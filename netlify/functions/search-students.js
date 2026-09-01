const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, response } = require('./_lib/http');

function cleanTerm(value) {
    return String(value || '')
        .trim()
        .replace(/[,%]/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 80);
}

function studentName(student) {
    return `${student.prenom || ''} ${student.nom || ''}`.trim() || student.email;
}

async function searchUsers(supabase, pattern) {
    let result = await supabase
        .from('users')
        .select('email,prenom,nom,telephone,genre')
        .or(`nom.ilike.${pattern},prenom.ilike.${pattern},email.ilike.${pattern}`)
        .order('nom', { ascending: true })
        .limit(10);

    if (result.error && /genre/i.test(result.error.message || '')) {
        result = await supabase
            .from('users')
            .select('email,prenom,nom,telephone')
            .or(`nom.ilike.${pattern},prenom.ilike.${pattern},email.ilike.${pattern}`)
            .order('nom', { ascending: true })
            .limit(10);
    }

    return result;
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'GET') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const session = verifySession(getBearerToken(event), ['admin', 'instructor']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        const term = cleanTerm(event.queryStringParameters?.q);
        if (term.length < 2) return response(200, { ok: true, students: [] });

        const pattern = `%${term}%`;
        const { data, error } = await searchUsers(supabase, pattern);

        if (error) throw error;

        const students = (data || [])
            .filter((student) => student.email)
            .map((student) => ({
                email: String(student.email).toLowerCase(),
                prenom: student.prenom || '',
                nom: student.nom || '',
                telephone: student.telephone || '',
                genre: student.genre || '',
                name: studentName(student)
            }));

        return response(200, { ok: true, students });
    } catch (error) {
        console.error('search-students:', error.message);
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        return response(authErrors.includes(error.message) ? 401 : 500, {
            ok: false,
            error: authErrors.includes(error.message) ? 'AUTH_REQUIRED' : 'STUDENT_SEARCH_FAILED'
        });
    }
};
