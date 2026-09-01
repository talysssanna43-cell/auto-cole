const Stripe = require('stripe');
const { assertSessionActive, getBearerToken, getEnv, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { computePackChange } = require('./_lib/pack-change');
const { sendInvoiceIfNeeded } = require('./_lib/payment-processing');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

async function createInvoice(supabase, student, currentPack, nextPack, amountDue, paymentReference) {
    const { data: generatedNumber } = await supabase.rpc('generate_invoice_number');
    const invoice = {
        invoice_number: generatedNumber || `FACT-UPGRADE-${Date.now()}`,
        user_email: student.email,
        student_name: `${student.prenom || ''} ${student.nom || ''}`.trim() || student.email,
        amount: amountDue,
        payment_method: 'stripe-pack-upgrade',
        description: `Complement changement de forfait : ${currentPack.label} vers ${nextPack.label}`,
        forfait: nextPack.id,
        hours_purchased: nextPack.courses,
        payment_date: new Date().toISOString(),
        stripe_payment_intent_id: paymentReference,
        lesson_unit_minutes: 45
    };

    const { data, error } = await supabase.from('invoices').insert(invoice).select().single();
    if (!error) return data;
    if (error.code === '23505') {
        const existing = await supabase
            .from('invoices')
            .select('*')
            .eq('stripe_payment_intent_id', paymentReference)
            .maybeSingle();
        if (existing.error) throw existing.error;
        return existing.data;
    }
    if (!/lesson_unit_minutes|schema cache|column/i.test(error.message || '')) throw error;

    const retry = { ...invoice };
    delete retry.lesson_unit_minutes;
    const secondTry = await supabase.from('invoices').insert(retry).select().single();
    if (secondTry.error && secondTry.error.code !== '23505') throw secondTry.error;
    if (secondTry.data) return secondTry.data;
    const existing = await supabase
        .from('invoices')
        .select('*')
        .eq('stripe_payment_intent_id', paymentReference)
        .maybeSingle();
    if (existing.error) throw existing.error;
    return existing.data;
}

function isLocalOrigin(event) {
    const origin = String(event.headers.origin || event.headers.Origin || '');
    const host = String(event.headers.host || event.headers.Host || '');
    return /localhost|127\.0\.0\.1/i.test(origin) || /localhost|127\.0\.0\.1/i.test(host);
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const supabase = getSupabaseAdmin();
        const session = verifySession(getBearerToken(event), ['student']);
        await assertSessionActive(session, supabase);
        const body = parseJsonBody(event);
        const simulateLocal = body?.simulateLocal === true;
        const checkoutSessionId = String(body?.checkoutSessionId || '').trim();
        if (!checkoutSessionId && !simulateLocal) return response(400, { ok: false, error: 'MISSING_CHECKOUT_SESSION' });

        let checkout = null;
        if (!simulateLocal) {
            const stripeSecret = getEnv('STRIPE_SECRET_KEY');
            if (!stripeSecret) return response(503, { ok: false, error: 'STRIPE_NOT_CONFIGURED' });
            const stripe = new Stripe(stripeSecret);
            checkout = await stripe.checkout.sessions.retrieve(checkoutSessionId);
            if (checkout.payment_status !== 'paid' || checkout.metadata?.source !== 'pack_upgrade') {
                return response(409, { ok: false, error: 'PAYMENT_NOT_COMPLETED' });
            }
        } else if (!isLocalOrigin(event)) {
            return response(403, { ok: false, error: 'LOCAL_SIMULATION_ONLY' });
        }

        const email = String(session.email || '').trim().toLowerCase();
        if (checkout) {
            const paymentEmail = String(checkout.metadata?.customer_email || checkout.customer_details?.email || checkout.customer_email || '').trim().toLowerCase();
            if (paymentEmail !== email) return response(403, { ok: false, error: 'PAYMENT_OWNER_MISMATCH' });
        }

        const { data: student, error: studentError } = await supabase
            .from('users')
            .select('*')
            .ilike('email', email)
            .maybeSingle();
        if (studentError) throw studentError;
        if (!student) return response(404, { ok: false, error: 'STUDENT_NOT_FOUND' });

        const newPackId = simulateLocal ? body?.new_pack : checkout.metadata?.new_pack;
        const { currentPack, nextPack, amountDue, transmission } = computePackChange(student, newPackId);
        const paidAmount = simulateLocal ? amountDue : Number(checkout.amount_total || 0) / 100;
        if (!simulateLocal && Math.round(paidAmount * 100) < Math.round(amountDue * 100)) {
            return response(409, { ok: false, error: 'AMOUNT_MISMATCH' });
        }

        const { data: updatedStudent, error: updateError } = await supabase
            .from('users')
            .update({
                forfait: nextPack.id,
                hours_goal: nextPack.courses,
                transmission_type: transmission,
                lesson_unit_minutes: 45
            })
            .ilike('email', email)
            .select()
            .single();
        if (updateError) throw updateError;

        const paymentReference = simulateLocal
            ? `local-test-pack-upgrade:${email}:${Date.now()}`
            : String(checkout.payment_intent || checkout.id);
        const invoice = await createInvoice(supabase, updatedStudent, currentPack, nextPack, paidAmount, paymentReference);

        await supabase.from('inscription_notifications').insert({
            user_email: updatedStudent.email,
            user_name: `${updatedStudent.prenom || ''} ${updatedStudent.nom || ''}`.trim(),
            user_prenom: updatedStudent.prenom || null,
            user_nom: updatedStudent.nom || null,
            user_telephone: updatedStudent.telephone || null,
            pack: nextPack.id,
            pack_label: nextPack.label,
            hours_purchased: nextPack.courses,
            amount_paid: paidAmount,
            payment_method: simulateLocal ? 'local-test-pack-upgrade' : 'stripe-pack-upgrade',
            stripe_payment_intent_id: paymentReference,
            transmission_type: transmission,
            lesson_unit_minutes: 45,
            status: 'approved',
            created_at: new Date().toISOString()
        }).catch((error) => console.error('confirm-pack-upgrade notification:', error.message));

        if (!simulateLocal) {
            await sendInvoiceIfNeeded(supabase, paymentReference, Number(updatedStudent.hours_goal || nextPack.courses || 0))
                .catch((error) => console.error('confirm-pack-upgrade email:', error.message));
        }

        return response(200, {
            ok: true,
            student: updatedStudent,
            invoice,
            change: {
                from_pack: currentPack.id,
                to_pack: nextPack.id,
                amount_paid: paidAmount,
                simulated: simulateLocal,
                courses_goal: nextPack.courses
            }
        });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('confirm-pack-upgrade:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'PACK_UPGRADE_CONFIRMATION_FAILED' });
    }
};
