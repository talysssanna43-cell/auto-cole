const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

const PACKS = Object.freeze({
    'tarif-chill-5': { label: 'Chill boite manuelle - 5 cours', price: 239, courses: 5, transmission: 'manual' },
    'tarif-chill-10': { label: 'Chill boite manuelle - 10 cours', price: 489, courses: 10, transmission: 'manual' },
    'tarif-chill-20': { label: 'Chill boite manuelle - 20 cours', price: 699, courses: 20, transmission: 'manual' },
    'tarif-chill-25': { label: 'Chill boite manuelle - 25 cours', price: 965, courses: 25, transmission: 'manual' },
    'tarif-chill-30': { label: 'Chill boite manuelle - 30 cours', price: 1149, courses: 30, transmission: 'manual', legacy: true },
    'tarif-premium-5': { label: 'Premium boite manuelle - 5 cours', price: 389, courses: 5, transmission: 'manual' },
    'tarif-premium-10': { label: 'Premium boite manuelle - 10 cours', price: 599, courses: 10, transmission: 'manual' },
    'tarif-premium-20': { label: 'Premium boite manuelle - 20 cours', price: 799, courses: 20, transmission: 'manual' },
    'tarif-premium-25': { label: 'Premium boite manuelle - 25 cours', price: 1095, courses: 25, transmission: 'manual' },
    'tarif-premium-30': { label: 'Premium boite manuelle - 30 cours', price: 1249, courses: 30, transmission: 'manual', legacy: true },
    'tarif-accelere-5': { label: 'Accelere boite manuelle - 5 cours', price: 489, courses: 5, transmission: 'manual' },
    'tarif-accelere-10': { label: 'Accelere boite manuelle - 10 cours', price: 749, courses: 10, transmission: 'manual' },
    'tarif-accelere-20': { label: 'Accelere boite manuelle - 20 cours', price: 899, courses: 20, transmission: 'manual' },
    'tarif-accelere-25': { label: 'Accelere boite manuelle - 25 cours', price: 1199, courses: 25, transmission: 'manual' },
    'tarif-accelere-30': { label: 'Accelere boite manuelle - 30 cours', price: 1399, courses: 30, transmission: 'manual', legacy: true },
    'tarif-chill-auto-5': { label: 'Chill boite automatique - 5 cours', price: 269, courses: 5, transmission: 'auto' },
    'tarif-chill-auto-13': { label: 'Chill boite automatique - 13 cours', price: 499, courses: 13, transmission: 'auto' },
    'tarif-premium-auto-5': { label: 'Premium boite automatique - 5 cours', price: 379, courses: 5, transmission: 'auto' },
    'tarif-premium-auto-13': { label: 'Premium boite automatique - 13 cours', price: 599, courses: 13, transmission: 'auto' },
    'tarif-accelere-auto-5': { label: 'Accelere boite automatique - 5 cours', price: 499, courses: 5, transmission: 'auto' },
    'tarif-accelere-auto-13': { label: 'Accelere boite automatique - 13 cours', price: 749, courses: 13, transmission: 'auto' },
    'tarif-aac-20': { label: 'Conduite accompagnee - 20 cours', price: 889, courses: 20, transmission: 'manual' },
    'tarif-supervisee-20': { label: 'Conduite supervisee - 20 cours', price: 889, courses: 20, transmission: 'manual' },
    'tarif-aac-auto-13': { label: 'AAC boite automatique - 13 cours', price: 639, courses: 13, transmission: 'auto' },
    'tarif-supervisee-auto-13': { label: 'Supervisee boite automatique - 13 cours', price: 639, courses: 13, transmission: 'auto' },
    code: { label: 'Code classique', price: 20, courses: 0, transmission: 'none' },
    'code-etudiant': { label: 'Code etudiant', price: 15, courses: 0, transmission: 'none' },
    am: { label: 'Voiture sans permis AM', price: 350, courses: 8, transmission: 'auto' },
    'second-chance': { label: 'Forfait Second Chance', price: 569, courses: 6, transmission: 'manual' },
    'boite-auto': { label: 'Chill boite automatique - 13 cours', price: 499, courses: 13, transmission: 'auto' },
    '20h': { label: 'Chill boite manuelle - 20 cours', price: 699, courses: 20, transmission: 'manual' },
    chill: { label: 'Chill boite manuelle - 20 cours', price: 699, courses: 20, transmission: 'manual' },
    zen: { label: 'Chill boite manuelle - 20 cours', price: 699, courses: 20, transmission: 'manual' },
    accelere: { label: 'Accelere boite manuelle - 20 cours', price: 899, courses: 20, transmission: 'manual' },
    aac: { label: 'Conduite accompagnee - 20 cours', price: 889, courses: 20, transmission: 'manual' },
    supervisee: { label: 'Conduite supervisee - 20 cours', price: 889, courses: 20, transmission: 'manual' }
});

function clean(value, max = 200) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function normalizeEmail(value) {
    return clean(value, 254).toLowerCase();
}

async function createInvoice(supabase, student, currentPack, nextPack, amountDue) {
    if (!amountDue || amountDue <= 0) return null;

    const { data: generatedNumber } = await supabase.rpc('generate_invoice_number');
    const invoiceNumber = generatedNumber || `FACT-UPGRADE-${Date.now()}`;
    const invoice = {
        invoice_number: invoiceNumber,
        user_email: student.email,
        student_name: `${student.prenom || ''} ${student.nom || ''}`.trim() || student.email,
        amount: amountDue,
        payment_method: 'admin-pack-upgrade',
        description: `Complement changement de forfait : ${currentPack.label} vers ${nextPack.label}`,
        forfait: nextPack.id,
        hours_purchased: nextPack.courses,
        payment_date: new Date().toISOString(),
        stripe_payment_intent_id: null,
        lesson_unit_minutes: 45
    };

    const { data, error } = await supabase.from('invoices').insert(invoice).select().single();
    if (!error) return data;
    if (!/lesson_unit_minutes|schema cache|column/i.test(error.message || '')) throw error;

    const retry = { ...invoice };
    delete retry.lesson_unit_minutes;
    const secondTry = await supabase.from('invoices').insert(retry).select().single();
    if (secondTry.error) throw secondTry.error;
    return secondTry.data;
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const supabase = getSupabaseAdmin();
        const session = verifySession(getBearerToken(event), ['admin']);
        await assertSessionActive(session, supabase);

        const body = parseJsonBody(event);
        const email = normalizeEmail(body?.email);
        const newPackId = clean(body?.new_pack, 80);
        const nextPack = PACKS[newPackId];
        if (!email || !nextPack || nextPack.legacy) return response(400, { ok: false, error: 'INVALID_CHANGE_FORFAIT_DATA' });

        const { data: student, error: studentError } = await supabase
            .from('users')
            .select('*')
            .ilike('email', email)
            .maybeSingle();
        if (studentError) throw studentError;
        if (!student) return response(404, { ok: false, error: 'STUDENT_NOT_FOUND' });

        const currentPack = {
            ...(PACKS[student.forfait] || {
                label: student.forfait || 'Forfait actuel',
                price: 0,
                courses: Number(student.hours_goal || 0),
                transmission: student.transmission_type || nextPack.transmission
            }),
            id: student.forfait || 'unknown'
        };
        const nextPackWithId = { ...nextPack, id: newPackId };
        const initialCompleted = Math.max(0, Number(student.hours_completed_initial || 0));
        const displayedCompleted = Math.max(0, Number(body.completed_courses || 0));
        const completedForDisplay = Math.max(initialCompleted, displayedCompleted);
        const amountDue = Math.max(0, Number(nextPack.price || 0) - Number(currentPack.price || 0));
        const remainingAfterChange = Math.max(0, Number(nextPack.courses || 0) - completedForDisplay);
        const transmission = nextPack.transmission === 'none' ? student.transmission_type : nextPack.transmission;

        const { data: updatedStudent, error: updateError } = await supabase
            .from('users')
            .update({
                forfait: newPackId,
                hours_goal: nextPack.courses,
                transmission_type: transmission,
                lesson_unit_minutes: 45
            })
            .ilike('email', email)
            .select()
            .single();
        if (updateError) throw updateError;

        let invoice = null;
        try {
            invoice = await createInvoice(supabase, updatedStudent, currentPack, nextPackWithId, amountDue);
        } catch (invoiceError) {
            console.error('admin-change-forfait invoice:', invoiceError.message);
        }

        try {
            await supabase.from('inscription_notifications').insert({
                user_email: updatedStudent.email,
                user_name: `${updatedStudent.prenom || ''} ${updatedStudent.nom || ''}`.trim(),
                user_prenom: updatedStudent.prenom || null,
                user_nom: updatedStudent.nom || null,
                user_telephone: updatedStudent.telephone || null,
                pack: newPackId,
                pack_label: nextPack.label,
                hours_purchased: nextPack.courses,
                amount_paid: amountDue,
                payment_method: 'admin-pack-upgrade',
                transmission_type: transmission,
                lesson_unit_minutes: 45,
                status: 'approved',
                created_at: new Date().toISOString()
            });
        } catch (notificationError) {
            console.error('admin-change-forfait notification:', notificationError.message);
        }

        return response(200, {
            ok: true,
            student: updatedStudent,
            invoice,
            change: {
                from_pack: currentPack.id,
                to_pack: newPackId,
                amount_due: amountDue,
                completed_courses: completedForDisplay,
                remaining_courses_after_change: remainingAfterChange
            }
        });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('admin-change-forfait:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'CHANGE_FORFAIT_FAILED' });
    }
};
