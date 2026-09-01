const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

const ALLOWED_DAYS = new Set(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']);

function cleanText(value, max = 200) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function cleanWeeks(value) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.map((week) => cleanText(week, 40)).filter(Boolean))];
}

function cleanSlots(value) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const slots = {};
    Object.entries(source).forEach(([day, entries]) => {
        const dayKey = cleanText(day, 20).toLowerCase();
        if (!ALLOWED_DAYS.has(dayKey) || !Array.isArray(entries)) return;
        const cleanEntries = [...new Set(entries
            .map((slot) => cleanText(slot, 40))
            .filter((slot) => /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(slot)))];
        if (cleanEntries.length) slots[dayKey] = cleanEntries;
    });
    return slots;
}

async function loadProfile(supabase, email) {
    const { data, error } = await supabase
        .from('users')
        .select('prenom,nom,telephone')
        .ilike('email', email)
        .maybeSingle();
    if (error) throw error;
    return data || {};
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (!['GET', 'POST', 'DELETE'].includes(event.httpMethod)) {
        return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
    }

    try {
        const session = verifySession(getBearerToken(event), ['student']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        const studentEmail = String(session.email || '').trim().toLowerCase();
        if (!studentEmail) return response(401, { ok: false, error: 'AUTH_REQUIRED' });

        if (event.httpMethod === 'GET') {
            const { data, error } = await supabase
                .from('student_availability')
                .select('*')
                .ilike('user_email', studentEmail)
                .maybeSingle();
            if (error) throw error;
            return response(200, { ok: true, availability: data || null });
        }

        if (event.httpMethod === 'DELETE') {
            const { error } = await supabase
                .from('student_availability')
                .delete()
                .ilike('user_email', studentEmail);
            if (error) throw error;
            return response(200, { ok: true });
        }

        const body = parseJsonBody(event);
        if (!body) return response(400, { ok: false, error: 'INVALID_BODY' });

        const profile = await loadProfile(supabase, studentEmail);
        const wantsNotifications = Boolean(body.wants_cancellation_notifications);
        const availabilitySlots = cleanSlots(body.availability_slots);
        const availabilityWeeks = cleanWeeks(body.availability_weeks);

        const payload = {
            user_email: studentEmail,
            user_name: cleanText(`${profile.prenom || ''} ${profile.nom || ''}`.trim() || body.user_name, 200),
            user_phone: cleanText(profile.telephone || body.user_phone, 60),
            wants_cancellation_notifications: wantsNotifications,
            availability_weeks: availabilityWeeks,
            availability_slots: availabilitySlots,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('student_availability')
            .upsert(payload, { onConflict: 'user_email' })
            .select('*')
            .single();
        if (error) throw error;

        return response(200, { ok: true, availability: data });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED', 'INSCRIPTION_PENDING', 'INSCRIPTION_REJECTED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('student-availability:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'STUDENT_AVAILABILITY_FAILED' });
    }
};
