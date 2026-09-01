const {
    getEnv,
    getSupabaseAdmin,
    hashPassword,
    signSession,
    verifyPassword
} = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');
const { consumeRateLimit } = require('./_lib/rate-limit');

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

async function findAccount(supabase, email) {
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, prenom, nom, email, telephone, password_hash, is_admin')
        .ilike('email', email)
        .maybeSingle();
    if (userError) throw userError;
    if (user?.is_admin === true) {
        return {
            id: user.id,
            prenom: user.prenom,
            nom: user.nom,
            email: normalizeEmail(user.email),
            telephone: user.telephone,
            role: 'admin',
            password_hash: user.password_hash,
            account_table: 'users',
            disabled: false
        };
    }

    const { data: instructor, error: instructorError } = await supabase
        .from('instructors')
        .select('id, prenom, nom, email, telephone, password_hash, is_active')
        .ilike('email', email)
        .maybeSingle();
    if (instructorError) throw instructorError;
    if (instructor) {
        return {
            id: instructor.id,
            prenom: instructor.prenom,
            nom: instructor.nom,
            email: normalizeEmail(instructor.email),
            telephone: instructor.telephone,
            role: 'instructor',
            instructor_name: instructor.prenom,
            password_hash: instructor.password_hash,
            account_table: 'instructors',
            disabled: instructor.is_active === false
        };
    }

    if (!user) return null;

    return {
        id: user.id,
        prenom: user.prenom,
        nom: user.nom,
        email: normalizeEmail(user.email),
        telephone: user.telephone,
        role: user.is_admin === true ? 'admin' : 'student',
        password_hash: user.password_hash,
        account_table: 'users',
        disabled: false
    };
}

async function getLatestInscriptionStatus(supabase, email) {
    const { data, error } = await supabase
        .from('inscription_notifications')
        .select('status,payment_method')
        .ilike('user_email', email)
        .neq('pack', 'Paiement cash')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    return data || null;
}

async function getApprovedLegacyPassword(supabase, email) {
    const { data, error } = await supabase
        .from('inscription_notifications')
        .select('user_password,status,payment_method')
        .ilike('user_email', email)
        .not('user_password', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);
    if (error) throw error;
    const row = (data || []).find((item) => {
        const status = String(item.status || '').toLowerCase();
        const paymentMethod = String(item.payment_method || '').toLowerCase();
        return status === 'approved' || ['admin', 'cash'].includes(paymentMethod);
    });
    return row?.user_password ? String(row.user_password) : '';
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    const body = parseJsonBody(event);
    const email = normalizeEmail(body?.email);
    const password = String(body?.password || '').trim();
    if (!email || !password || password.length > 256) {
        return response(400, { ok: false, error: 'INVALID_CREDENTIALS' });
    }
    const failedLoginRateOptions = { scope: 'login', identifier: email, limit: 8, windowMs: 15 * 60 * 1000 };

    try {
        const supabase = getSupabaseAdmin();
        const adminEmail = normalizeEmail(getEnv('ADMIN_EMAIL'));
        const adminHash = getEnv('ADMIN_PASSWORD_HASH');
        const configuredAdmin = adminEmail && adminHash && email === adminEmail
            ? {
                id: 'admin',
                prenom: 'Auto-Ecole',
                nom: 'Breteuil',
                email,
                role: 'admin',
                password_hash: adminHash,
                disabled: false
            }
            : null;
        let account = await findAccount(supabase, email);

        if (!account && configuredAdmin) {
            account = configuredAdmin;
        }

        let passwordVerified = account && !account.disabled && verifyPassword(password, account.password_hash);
        let shouldMigratePassword = passwordVerified && account.account_table && !String(account.password_hash).startsWith('scrypt$');

        if (!passwordVerified && account?.account_table === 'users' && !account.disabled) {
            const legacyPassword = await getApprovedLegacyPassword(supabase, email);
            if (legacyPassword && password === legacyPassword.trim()) {
                passwordVerified = true;
                shouldMigratePassword = true;
            }
        }

        if (!account || account.disabled || !passwordVerified) {
            if (!configuredAdmin || !verifyPassword(password, configuredAdmin.password_hash)) {
                const rate = consumeRateLimit(event, failedLoginRateOptions);
                if (!rate.allowed) {
                    return response(429, { ok: false, error: 'TOO_MANY_ATTEMPTS', retryAfter: rate.retryAfter }, { 'Retry-After': String(rate.retryAfter) });
                }
                return response(401, { ok: false, error: 'INVALID_CREDENTIALS' });
            }
            account = configuredAdmin;
            shouldMigratePassword = false;
        }

        if (shouldMigratePassword) {
            await supabase
                .from(account.account_table)
                .update({ password_hash: hashPassword(password) })
                .eq('id', account.id);
        }

        if (account.role === 'student') {
            const inscription = await getLatestInscriptionStatus(supabase, email);
            const status = inscription?.status || null;
            const adminCreated = ['admin', 'cash'].includes(String(inscription?.payment_method || '').toLowerCase());
            if (status === 'pending' && !adminCreated) return response(403, { ok: false, error: 'INSCRIPTION_PENDING' });
            if (status === 'rejected') return response(403, { ok: false, error: 'INSCRIPTION_REJECTED' });
        }

        const token = signSession(account, body?.remember === true);
        return response(200, {
            ok: true,
            token,
            user: {
                id: account.id,
                prenom: account.prenom || '',
                nom: account.nom || '',
                email: account.email,
                telephone: account.telephone || '',
                role: account.role,
                is_admin: account.role === 'admin',
                is_moniteur: account.role === 'instructor',
                instructor_name: account.instructor_name || null
            }
        });
    } catch (error) {
        console.error('auth-login:', error.message);
        const configurationError = ['SUPABASE_SERVER_NOT_CONFIGURED', 'SESSION_SECRET_NOT_CONFIGURED'].includes(error.message);
        return response(configurationError ? 503 : 500, {
            ok: false,
            error: configurationError ? error.message : 'LOGIN_FAILED'
        });
    }
};
