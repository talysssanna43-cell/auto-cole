const { assertSessionActive, getBearerToken, getSupabaseAdmin, hashPassword, verifySession } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function text(value, max = 200) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function email(value) {
    return text(value, 254).toLowerCase();
}

function bool(value) {
    return value === true;
}

function money(value, fallback = 2200) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Number(number.toFixed(2)) : fallback;
}

function isMissingColumnError(error) {
    const message = String(error?.message || '').toLowerCase();
    return error?.code === 'PGRST204' || message.includes('monthly_salary_charges') || message.includes('schema cache');
}

function arrayOfText(value) {
    if (!Array.isArray(value)) return [];
    return value.map((item) => text(item, 40)).filter(Boolean).slice(0, 10);
}

function sanitizeSchedule(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const output = {};
    days.forEach((day) => {
        const item = value[day] || {};
        output[day] = {
            start: text(item.start, 5) || null,
            end: text(item.end, 5) || null
        };
    });
    return output;
}

async function fetchAll(buildQuery, maxRows = 3000) {
    const pageSize = 1000;
    const rows = [];
    for (let from = 0; from < maxRows; from += pageSize) {
        const { data, error } = await buildQuery().range(from, from + pageSize - 1);
        if (error) throw error;
        rows.push(...(data || []));
        if (!data || data.length < pageSize) break;
    }
    return rows;
}

function buildInstructorData(body, isUpdate = false) {
    const prenom = text(body.prenom, 100);
    const nom = text(body.nom, 100);
    const instructorEmail = email(body.email);
    const password = String(body.password || '');
    const workSchedule = text(body.work_schedule, 30) === 'part_time' ? 'part_time' : 'full_time';

    if (!prenom || !nom || !instructorEmail) {
        const error = new Error('INVALID_INSTRUCTOR_DATA');
        error.statusCode = 400;
        throw error;
    }
    if (!isUpdate && password.length < 6) {
        const error = new Error('PASSWORD_REQUIRED');
        error.statusCode = 400;
        throw error;
    }

    const data = {
        prenom,
        nom,
        gender: text(body.gender, 20) === 'female' ? 'female' : 'male',
        email: instructorEmail,
        telephone: text(body.telephone, 30) || null,
        monthly_salary_charges: money(body.monthly_salary_charges),
        specialites: arrayOfText(body.specialites),
        is_active: bool(body.is_active),
        visible_to_students: bool(body.visible_to_students),
        work_schedule: workSchedule,
        custom_schedule: workSchedule === 'part_time' ? sanitizeSchedule(body.custom_schedule) : null
    };
    if (password) data.password_hash = hashPassword(password);
    return data;
}

async function writeInstructor(supabase, id, instructorData) {
    const write = (payload) => {
        if (id) {
            return supabase
                .from('instructors')
                .update(payload)
                .eq('id', id)
                .select('*')
                .single();
        }
        return supabase
            .from('instructors')
            .insert(payload)
            .select('*')
            .single();
    };

    let result = await write(instructorData);
    if (result.error && isMissingColumnError(result.error)) {
        const error = new Error('INSTRUCTOR_SALARY_COLUMN_MISSING');
        error.statusCode = 424;
        throw error;
    }
    return result;
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;

    try {
        const session = verifySession(getBearerToken(event), ['admin']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        if (event.httpMethod === 'GET') {
            const id = text(event.queryStringParameters?.id, 80);
            if (id) {
                const { data, error } = await supabase
                    .from('instructors')
                    .select('*')
                    .eq('id', id)
                    .maybeSingle();
                if (error) throw error;
                return response(200, { ok: true, instructor: data || null });
            }

            const instructors = await fetchAll(() => supabase
                .from('instructors')
                .select('*')
                .order('created_at', { ascending: false }));
            return response(200, { ok: true, instructors });
        }

        if (event.httpMethod === 'POST') {
            const body = parseJsonBody(event);
            if (!body) return response(400, { ok: false, error: 'INVALID_BODY' });

            const id = text(body.id, 80);
            const instructorData = buildInstructorData(body, Boolean(id));
            const result = await writeInstructor(supabase, id, instructorData);
            if (result.error) throw result.error;
            return response(200, { ok: true, instructor: result.data });
        }

        if (event.httpMethod === 'DELETE') {
            const id = text(event.queryStringParameters?.id, 80);
            if (!id) return response(400, { ok: false, error: 'ID_REQUIRED' });
            const { error } = await supabase
                .from('instructors')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return response(200, { ok: true });
        }

        return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = error.statusCode || (authErrors.includes(error.message) ? 401 : 500);
        console.error('admin-instructors:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : (error.message || 'ADMIN_INSTRUCTORS_FAILED') });
    }
};
