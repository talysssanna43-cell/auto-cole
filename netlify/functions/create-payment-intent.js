const Stripe = require('stripe');
const { assertSessionActive, getBearerToken, getEnv, getSupabaseAdmin, hashPassword, verifySession } = require('./_lib/auth');
const { getInstallmentSchedule, normalizeTransmission, validatePurchase } = require('./_lib/catalog');
const { sanitizeDocuments } = require('./_lib/documents');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function cleanMetadata(value, maxLength = 450) {
    return String(value || '').replace(/[<>]/g, '').slice(0, maxLength);
}

function cleanProfileText(value, maxLength) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function validateRegistration(registration, customerEmail) {
    if (!registration || normalizeEmail(registration.email) !== customerEmail) return null;
    const required = ['prenom', 'nom', 'telephone', 'password'];
    if (required.some((key) => !String(registration[key] || '').trim())) return null;
    if (String(registration.password).length < 8 || String(registration.password).length > 128) return null;
    return {
        prenom: cleanProfileText(registration.prenom, 100),
        nom: cleanProfileText(registration.nom, 100),
        telephone: cleanProfileText(registration.telephone, 30),
        email: customerEmail,
        date_nais: registration.dateNaissance || null,
        genre: ['homme', 'femme', 'autre'].includes(registration.genre) ? registration.genre : null,
        adresse: cleanProfileText(registration.adresse, 300),
        code_postal: cleanProfileText(registration.codePostal, 20),
        ville: cleanProfileText(registration.ville, 100),
        numero_neph: cleanProfileText(registration.numeroNeph, 30) || null,
        referral_code: String(registration.referralCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16) || null,
        documents: sanitizeDocuments(registration.documents),
        lesson_unit_minutes: 45,
        password_hash: hashPassword(registration.password)
    };
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { message: 'Méthode non autorisée.' });

    const secret = getEnv('STRIPE_SECRET_KEY');
    if (!secret) return response(503, { message: 'Stripe n’est pas configuré côté serveur.' });

    const payload = parseJsonBody(event);
    if (!payload) return response(400, { message: 'Corps de requête invalide.' });

    const requestedAmount = Number(payload.amount);
    const packId = String(payload.packId || '');
    const customerEmail = normalizeEmail(payload.customerEmail);
    const hours = Number(payload.hours || 0);
    const transmission = normalizeTransmission(payload.transmission);
    if (!validatePurchase(payload, packId)) {
        return response(400, { message: 'Le montant ne correspond pas au tarif officiel du pack sélectionné.' });
    }
    const installmentSchedule = payload.installments
        ? getInstallmentSchedule(payload, packId)
        : null;
    if (payload.installments && !installmentSchedule) {
        return response(400, { message: 'L’échéancier demandé est invalide. Le paiement est possible en 2 ou 3 fois.' });
    }
    if (installmentSchedule && payload.installmentConsent !== true) {
        return response(400, { message: 'L’autorisation de prélèvement des échéances est requise.' });
    }
    if (!customerEmail) return response(400, { message: 'Adresse e-mail manquante.' });

    let source = payload.source === 'registration' ? 'registration' : 'student_pack';
    if (installmentSchedule && source !== 'registration') {
        return response(400, { message: 'Le paiement fractionné est réservé à l’inscription.' });
    }
    let registration = null;
    let stripe = null;
    let stripeCustomer = null;
    let paymentIntent = null;
    try {
        stripe = new Stripe(secret);
        if (source === 'registration') {
            const supabase = getSupabaseAdmin();
            const { data: existingUser, error: existingUserError } = await supabase
                .from('users')
                .select('id')
                .ilike('email', customerEmail)
                .maybeSingle();
            if (existingUserError) throw existingUserError;
            if (existingUser) {
                return response(409, {
                    error: 'ACCOUNT_EXISTS',
                    message: 'Un compte existe déjà avec cette adresse e-mail. Connecte-toi ou contacte l’auto-école.'
                });
            }

            const { data: previousAttempts, error: previousError } = await supabase
                .from('pending_registrations')
                .select('stripe_payment_intent_id')
                .ilike('user_email', customerEmail);
            if (previousError) throw previousError;
            for (const previous of previousAttempts || []) {
                const previousIntent = await stripe.paymentIntents
                    .retrieve(previous.stripe_payment_intent_id)
                    .catch(() => null);
                if (previousIntent && ['succeeded', 'processing'].includes(previousIntent.status)) {
                    return response(409, {
                        error: 'PAYMENT_ALREADY_PROCESSING',
                        message: 'Un paiement est déjà validé ou en cours de traitement pour cette adresse e-mail.'
                    });
                }
                if (previousIntent && previousIntent.status !== 'canceled') {
                    await stripe.paymentIntents.cancel(previousIntent.id).catch(() => {});
                }
                await supabase.from('installment_plans')
                    .delete()
                    .eq('initial_payment_intent_id', previous.stripe_payment_intent_id);
                await supabase.from('pending_registrations')
                    .delete()
                    .eq('stripe_payment_intent_id', previous.stripe_payment_intent_id);
            }
            registration = validateRegistration(payload.registration, customerEmail);
            if (!registration) return response(400, { message: 'Informations d’inscription incomplètes.' });
        } else {
            const session = verifySession(getBearerToken(event), ['student']);
            await assertSessionActive(session, getSupabaseAdmin());
            if (normalizeEmail(session.email) !== customerEmail) return response(403, { message: 'Compte de paiement incorrect.' });
        }

        const packLabel = cleanMetadata(payload.packLabel || packId, 200);
        if (installmentSchedule) {
            stripeCustomer = await stripe.customers.create({
                email: customerEmail,
                name: registration ? `${registration.prenom} ${registration.nom}` : cleanMetadata(payload.studentName, 180),
                metadata: { source: 'auto_ecole_installment' }
            });
        }

        const chargedAmount = installmentSchedule ? installmentSchedule.amounts[0] : requestedAmount;
        paymentIntent = await stripe.paymentIntents.create({
            amount: chargedAmount,
            currency: 'eur',
            description: cleanMetadata(payload.description || `Auto-Ecole Breteuil - ${packLabel}`, 300),
            receipt_email: customerEmail,
            payment_method_types: ['card'],
            ...(stripeCustomer ? {
                customer: stripeCustomer.id,
                setup_future_usage: 'off_session'
            } : {}),
            metadata: {
                source,
                pack_id: packId,
                pack_label: packLabel,
                hours: String(Number.isFinite(hours) ? hours : 0),
                transmission,
                customer_email: customerEmail,
                student_name: registration ? `${registration.prenom} ${registration.nom}` : cleanMetadata(payload.studentName, 180),
                installments_count: installmentSchedule ? String(installmentSchedule.installmentCount) : '',
                installment_number: installmentSchedule ? '1' : '',
                installment_plan_reference: '',
                total_amount_cents: installmentSchedule ? String(installmentSchedule.totalAmount) : String(requestedAmount)
            }
        });

        if (installmentSchedule) {
            await stripe.paymentIntents.update(paymentIntent.id, {
                metadata: {
                    ...paymentIntent.metadata,
                    installment_plan_reference: paymentIntent.id
                }
            });
        }

        if (registration) {
            const supabase = getSupabaseAdmin();
            const { error } = await supabase.from('pending_registrations').upsert({
                stripe_payment_intent_id: paymentIntent.id,
                user_email: customerEmail,
                profile: registration,
                pack: packId,
                pack_label: packLabel,
                hours_purchased: hours,
                lesson_unit_minutes: registration.lesson_unit_minutes,
                transmission_type: transmission,
                amount: requestedAmount / 100,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            }, { onConflict: 'stripe_payment_intent_id' });
            if (error) {
                throw error;
            }

            if (installmentSchedule) {
                const { error: planError } = await supabase.from('installment_plans').insert({
                    initial_payment_intent_id: paymentIntent.id,
                    user_email: customerEmail,
                    stripe_customer_id: stripeCustomer.id,
                    pack_id: packId,
                    pack_label: packLabel,
                    transmission_type: transmission,
                    hours_purchased: hours,
                    total_amount_cents: installmentSchedule.totalAmount,
                    installment_count: installmentSchedule.installmentCount,
                    installment_amounts_cents: installmentSchedule.amounts,
                    consent_at: new Date().toISOString(),
                    status: 'pending'
                });
                if (planError) {
                    throw planError;
                }
            }
        }

        return response(200, {
            clientSecret: paymentIntent.client_secret,
            amountCharged: chargedAmount,
            totalAmount: requestedAmount,
            installments: installmentSchedule?.installmentCount || null
        });
    } catch (error) {
        console.error('create-payment-intent:', error.message);
        if (paymentIntent?.id) {
            await stripe?.paymentIntents.cancel(paymentIntent.id).catch(() => {});
            if (registration) {
                try {
                    await getSupabaseAdmin().from('pending_registrations')
                        .delete()
                        .eq('stripe_payment_intent_id', paymentIntent.id);
                } catch (cleanupError) {
                    console.error('pending registration cleanup:', cleanupError.message);
                }
            }
        }
        if (stripeCustomer?.id) await stripe?.customers.del(stripeCustomer.id).catch(() => {});
        return response(500, { message: 'Création du paiement impossible.' });
    }
};
