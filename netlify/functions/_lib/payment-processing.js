const { getSupabaseAdmin } = require('./auth');
const { sendPaymentEmail } = require('./payment-email');

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function nextMonthlyCharge(fromDate = new Date()) {
    const next = new Date(fromDate);
    next.setUTCMonth(next.getUTCMonth() + 1);
    return next.toISOString();
}

async function advanceInstallmentPlan(supabase, payment) {
    const reference = String(payment.planReference || '');
    const installmentNumber = Number(payment.installmentNumber || 0);
    if (!reference || !installmentNumber) return;

    const { data: plan, error: planError } = await supabase
        .from('installment_plans')
        .select('*')
        .eq('initial_payment_intent_id', reference)
        .maybeSingle();
    if (planError) throw planError;
    if (!plan || Number(plan.paid_installments || 0) >= installmentNumber) return;
    if (installmentNumber !== Number(plan.paid_installments || 0) + 1) {
        throw new Error('INSTALLMENT_SEQUENCE_ERROR');
    }

    const completed = installmentNumber >= Number(plan.installment_count);
    const dueBase = plan.next_charge_at ? new Date(plan.next_charge_at) : new Date();
    const update = {
        paid_installments: installmentNumber,
        stripe_payment_method_id: payment.stripePaymentMethodId || plan.stripe_payment_method_id,
        status: completed ? 'completed' : 'active',
        next_charge_at: completed ? null : nextMonthlyCharge(dueBase),
        last_error: null,
        updated_at: new Date().toISOString()
    };
    const { error: updateError } = await supabase
        .from('installment_plans')
        .update(update)
        .eq('id', plan.id)
        .eq('paid_installments', plan.paid_installments);
    if (updateError) throw updateError;
}

async function ensureRegistrationAccount(supabase, payment) {
    const { data: pending, error: pendingError } = await supabase
        .from('pending_registrations')
        .select('*')
        .eq('stripe_payment_intent_id', payment.paymentReference)
        .maybeSingle();
    if (pendingError) throw pendingError;
    if (!pending) throw new Error('PENDING_REGISTRATION_NOT_FOUND');

    const profile = pending.profile || {};
    const { data: currentUser, error: currentError } = await supabase
        .from('users')
        .select('hours_goal')
        .ilike('email', pending.user_email)
        .maybeSingle();
    if (currentError) throw currentError;

    const userPayload = {
        prenom: profile.prenom,
        nom: profile.nom,
        email: pending.user_email,
        telephone: profile.telephone,
        date_nais: profile.date_nais,
        adresse: profile.adresse,
        code_postal: profile.code_postal,
        ville: profile.ville,
        numero_neph: profile.numero_neph,
        password_hash: profile.password_hash,
        forfait: pending.pack,
        hours_goal: Math.max(Number(currentUser?.hours_goal || 0), Number(pending.hours_purchased || 0)),
        transmission_type: pending.transmission_type
    };
    const { error: userError } = await supabase.from('users').upsert(userPayload, { onConflict: 'email' });
    if (userError) throw userError;

    const notification = {
        user_email: pending.user_email,
        user_name: `${profile.prenom || ''} ${profile.nom || ''}`.trim(),
        user_prenom: profile.prenom,
        user_nom: profile.nom,
        user_telephone: profile.telephone,
        user_date_naissance: profile.date_nais,
        user_adresse: profile.adresse,
        user_code_postal: profile.code_postal,
        user_ville: profile.ville,
        numero_neph: profile.numero_neph,
        pack: pending.pack,
        pack_label: pending.pack_label,
        hours_purchased: pending.hours_purchased,
        amount_paid: payment.amount,
        transmission_type: pending.transmission_type,
        payment_method: 'stripe',
        stripe_payment_intent_id: payment.paymentReference
    };

    if (payment.documents && Object.keys(payment.documents).length > 0) {
        notification.documents = payment.documents;
        notification.documents_count = Object.keys(payment.documents).length;
    }

    if (profile.referral_code) {
        const { data: referral, error: referralLookupError } = await supabase
            .from('referrals')
            .select('id, referral_code')
            .eq('referral_code', profile.referral_code)
            .is('referee_email', null)
            .maybeSingle();
        if (referralLookupError) throw referralLookupError;
        if (referral) {
            const { error: referralUpdateError } = await supabase
                .from('referrals')
                .update({
                    referee_email: pending.user_email,
                    referee_name: notification.user_name,
                    payment_verified: true,
                    status: 'pending'
                })
                .eq('id', referral.id);
            if (referralUpdateError) throw referralUpdateError;
            notification.referral_code = referral.referral_code;
        }
    }
    const { data: existingNotification, error: notificationLookupError } = await supabase
        .from('inscription_notifications')
        .select('id')
        .eq('stripe_payment_intent_id', payment.paymentReference)
        .maybeSingle();
    if (notificationLookupError) throw notificationLookupError;

    if (existingNotification) {
        const { error: notificationUpdateError } = await supabase
            .from('inscription_notifications')
            .update(notification)
            .eq('id', existingNotification.id);
        if (notificationUpdateError) throw notificationUpdateError;
    } else {
        const { error: notificationInsertError } = await supabase
            .from('inscription_notifications')
            .insert({ ...notification, status: 'pending' });

        if (notificationInsertError?.code === '23505') {
            // The webhook and browser finalization can arrive together. A retry must
            // enrich the existing row without resetting an admin decision to pending.
            const { error: notificationRetryError } = await supabase
                .from('inscription_notifications')
                .update(notification)
                .eq('stripe_payment_intent_id', payment.paymentReference);
            if (notificationRetryError) throw notificationRetryError;
        } else if (notificationInsertError) {
            throw notificationInsertError;
        }
    }

    payment.studentName = notification.user_name;
    payment.packId = pending.pack;
    payment.packLabel = pending.pack_label;
    payment.hours = Number(pending.hours_purchased || 0);
    payment.transmission = pending.transmission_type;
}

async function sendInvoiceIfNeeded(supabase, paymentReference, hoursAvailable) {
    const { data: invoice, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('stripe_payment_intent_id', paymentReference)
        .maybeSingle();
    if (error) throw error;
    if (!invoice || invoice.confirmation_email_sent) return invoice;

    const staleClaim = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const claimedAt = new Date().toISOString();
    const { data: claimedInvoice, error: claimError } = await supabase
        .from('invoices')
        .update({ confirmation_email_claimed_at: claimedAt })
        .eq('id', invoice.id)
        .eq('confirmation_email_sent', false)
        .or(`confirmation_email_claimed_at.is.null,confirmation_email_claimed_at.lt.${staleClaim}`)
        .select('*')
        .maybeSingle();
    if (claimError) throw claimError;
    if (!claimedInvoice) return invoice;

    try {
        await sendPaymentEmail(claimedInvoice, hoursAvailable);
        const { error: updateError } = await supabase
            .from('invoices')
            .update({
                confirmation_email_sent: true,
                confirmation_email_sent_at: new Date().toISOString(),
                confirmation_email_claimed_at: null
            })
            .eq('id', claimedInvoice.id);
        if (updateError) throw updateError;
        return claimedInvoice;
    } catch (emailError) {
        await supabase
            .from('invoices')
            .update({ confirmation_email_claimed_at: null })
            .eq('id', claimedInvoice.id)
            .eq('confirmation_email_claimed_at', claimedAt);
        throw emailError;
    }
}

async function processSuccessfulPayment(input) {
    const supabase = getSupabaseAdmin();
    const payment = {
        eventId: String(input.eventId || `manual:${input.paymentReference}`),
        paymentReference: String(input.paymentReference || ''),
        email: normalizeEmail(input.email),
        amount: Number(input.amount || 0),
        source: String(input.source || 'student_pack'),
        packId: String(input.packId || 'heures-conduite'),
        packLabel: String(input.packLabel || input.packId || 'Paiement Auto-Ecole Breteuil'),
        hours: Number(input.hours || 0),
        transmission: input.transmission === 'auto' ? 'auto' : 'manual',
        paymentMethod: String(input.paymentMethod || 'stripe'),
        installments: Number(input.installments || 0) || null,
        studentName: String(input.studentName || ''),
        documents: input.documents || null,
        planReference: String(input.planReference || ''),
        installmentNumber: Number(input.installmentNumber || 0),
        stripeCustomerId: String(input.stripeCustomerId || ''),
        stripePaymentMethodId: String(input.stripePaymentMethodId || '')
    };
    if (!payment.paymentReference || !payment.email || payment.amount <= 0) throw new Error('INVALID_PAYMENT_DATA');

    if (payment.source === 'registration') await ensureRegistrationAccount(supabase, payment);

    const { data: rpcResult, error: rpcError } = await supabase.rpc('record_successful_payment', {
        p_event_id: payment.eventId,
        p_payment_reference: payment.paymentReference,
        p_user_email: payment.email,
        p_student_name: payment.studentName || payment.email,
        p_amount: payment.amount,
        p_source: payment.source,
        p_pack_id: payment.packId,
        p_pack_label: payment.packLabel,
        p_hours: payment.hours,
        p_transmission: payment.transmission,
        p_payment_method: payment.paymentMethod,
        p_installments_count: payment.installments
    });
    if (rpcError) throw rpcError;

    const hoursAvailable = Number(rpcResult?.hours_available ?? payment.hours);
    await advanceInstallmentPlan(supabase, payment);
    await sendInvoiceIfNeeded(supabase, payment.paymentReference, hoursAvailable).catch((error) => {
        console.error('payment confirmation email:', error.message);
    });
    return rpcResult || { ok: true, hours_available: hoursAvailable };
}

module.exports = { processSuccessfulPayment, sendInvoiceIfNeeded };
