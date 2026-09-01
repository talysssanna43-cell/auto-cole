const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function text(value, max = 160) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function number(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Number(parsed.toFixed(2)) : fallback;
}

function dateOnly(value) {
    const match = String(value || '').match(/^\d{4}-\d{2}-\d{2}$/);
    return match ? value : null;
}

function isMissingTableError(error) {
    const message = String(error?.message || '').toLowerCase();
    return error?.code === '42P01' || error?.code === 'PGRST205' || message.includes('instructor_profitability_settings');
}

function isMissingInstructorSalaryColumn(error) {
    const message = String(error?.message || '').toLowerCase();
    return error?.code === 'PGRST204' || message.includes('monthly_salary_charges') || message.includes('schema cache');
}

function normaliseKey(value) {
    return String(value || '').trim().toLowerCase();
}

async function updateInstructorCurrentSalary(supabase, instructorName, salaryAndCharges) {
    const target = normaliseKey(instructorName);
    if (!target) return null;

    const { data: instructors, error: listError } = await supabase
        .from('instructors')
        .select('id, prenom, nom, email')
        .eq('is_active', true);
    if (listError) throw listError;

    const match = (instructors || []).find((instructor) => {
        const prenom = normaliseKey(instructor.prenom);
        const fullName = normaliseKey(`${instructor.prenom || ''} ${instructor.nom || ''}`);
        const email = normaliseKey(instructor.email);
        return target === prenom || target === fullName || target === email;
    });
    if (!match?.id) return null;

    const { data, error } = await supabase
        .from('instructors')
        .update({ monthly_salary_charges: salaryAndCharges })
        .eq('id', match.id)
        .select('id, monthly_salary_charges')
        .single();
    if (error) {
        if (isMissingInstructorSalaryColumn(error)) {
            const missing = new Error('INSTRUCTOR_SALARY_COLUMN_MISSING');
            missing.statusCode = 424;
            throw missing;
        }
        throw error;
    }
    return data;
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (!['GET', 'POST'].includes(event.httpMethod)) {
        return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
    }

    try {
        const session = verifySession(getBearerToken(event), ['admin']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        if (event.httpMethod === 'GET') {
            const instructorName = text(event.queryStringParameters?.instructor_name);
            let query = supabase
                .from('instructor_profitability_settings')
                .select('*')
                .order('effective_date', { ascending: false })
                .limit(80);
            if (instructorName) query = query.ilike('instructor_name', instructorName);
            const { data, error } = await query;
            if (error) {
                if (isMissingTableError(error)) return response(424, { ok: false, error: 'PROFITABILITY_SETTINGS_TABLE_MISSING' });
                throw error;
            }
            return response(200, { ok: true, settings: data || [] });
        }

        const body = parseJsonBody(event);
        if (!body) return response(400, { ok: false, error: 'INVALID_JSON' });

        const instructorName = text(body.instructor_name);
        const effectiveDate = dateOnly(body.effective_date);
        if (!instructorName || !effectiveDate) {
            return response(400, { ok: false, error: 'INVALID_SETTINGS' });
        }

        const payload = {
            instructor_name: instructorName,
            effective_date: effectiveDate,
            hours_per_day: number(body.hours_per_day, 10),
            salary_and_social_charges: number(body.salary_and_social_charges, 2200),
            vehicle_insurance: number(body.vehicle_insurance, 1500),
            entoria_share: number(body.entoria_share, 75),
            parking_share: number(body.parking_share, 83.33),
            maintenance_share: number(body.maintenance_share, 157.97),
            extra_fixed_charges: number(body.extra_fixed_charges, 0),
            created_by: session.email || null
        };

        const salaryUpdate = await updateInstructorCurrentSalary(supabase, instructorName, payload.salary_and_social_charges);

        const { data, error } = await supabase
            .from('instructor_profitability_settings')
            .insert(payload)
            .select('*')
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return response(200, {
                    ok: true,
                    partial: true,
                    warning: 'PROFITABILITY_SETTINGS_TABLE_MISSING',
                    setting: {
                        ...payload,
                        id: null,
                        instructor_salary_updated: Boolean(salaryUpdate)
                    }
                });
            }
            throw error;
        }

        return response(200, { ok: true, setting: data, instructor_salary_updated: Boolean(salaryUpdate) });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('admin-profitability-settings:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'PROFITABILITY_SETTINGS_FAILED' });
    }
};
