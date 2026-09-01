const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const TOKEN_ISSUER = 'auto-ecole-breteuil';

function getEnv(name, aliases = []) {
    for (const key of [name, ...aliases]) {
        if (process.env[key]) return process.env[key];
    }
    return '';
}

function getSupabaseAdmin() {
    const url = getEnv('SUPABASE_URL');
    const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY', ['SUPABASE_SERVICE_KEY']);
    if (!url || !serviceKey) {
        throw new Error('SUPABASE_SERVER_NOT_CONFIGURED');
    }
    return createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
}

function getJwtSecret() {
    const secret = getEnv('SUPABASE_JWT_SECRET');
    if (!secret || secret.length < 32) {
        throw new Error('SESSION_SECRET_NOT_CONFIGURED');
    }
    return secret;
}

function encodeBase64Url(value) {
    return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value) {
    return Buffer.from(value, 'base64url').toString('utf8');
}

function signSession(profile, remember = false) {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12;
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
        aud: 'authenticated',
        role: 'authenticated',
        iss: TOKEN_ISSUER,
        iat: now,
        exp: now + expiresIn,
        sub: deterministicUuid(profile.email),
        email: profile.email,
        app_role: profile.role,
        profile: {
            id: profile.id,
            prenom: profile.prenom || '',
            nom: profile.nom || '',
            telephone: profile.telephone || '',
            instructor_name: profile.instructor_name || null
        }
    };
    const encodedHeader = encodeBase64Url(JSON.stringify(header));
    const encodedPayload = encodeBase64Url(JSON.stringify(payload));
    const unsigned = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto.createHmac('sha256', getJwtSecret()).update(unsigned).digest('base64url');
    return `${unsigned}.${signature}`;
}

function verifySession(token, allowedRoles = []) {
    if (!token || typeof token !== 'string') throw new Error('AUTH_REQUIRED');
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('INVALID_SESSION');

    const unsigned = `${parts[0]}.${parts[1]}`;
    const expected = crypto.createHmac('sha256', getJwtSecret()).update(unsigned).digest();
    const actual = Buffer.from(parts[2], 'base64url');
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
        throw new Error('INVALID_SESSION');
    }

    const payload = JSON.parse(decodeBase64Url(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.iss !== TOKEN_ISSUER || payload.exp <= now) throw new Error('SESSION_EXPIRED');
    if (allowedRoles.length && !allowedRoles.includes(payload.app_role)) throw new Error('FORBIDDEN');
    return payload;
}

function getBearerToken(event) {
    const header = event.headers.authorization || event.headers.Authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match ? match[1] : '';
}

function sha256(value) {
    return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function safeEqualText(left, right) {
    const a = Buffer.from(String(left || ''));
    const b = Buffer.from(String(right || ''));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('base64url');
    const hash = crypto.scryptSync(String(password), salt, 64).toString('base64url');
    return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
    if (!storedHash) return false;
    if (storedHash.startsWith('scrypt$')) {
        const [, salt, expectedHash] = storedHash.split('$');
        if (!salt || !expectedHash) return false;
        const actualHash = crypto.scryptSync(String(password), salt, 64).toString('base64url');
        return safeEqualText(actualHash, expectedHash);
    }
    return safeEqualText(sha256(password), storedHash);
}

function deterministicUuid(value) {
    const hex = sha256(String(value).toLowerCase()).slice(0, 32).split('');
    hex[12] = '4';
    hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
    const joined = hex.join('');
    return `${joined.slice(0, 8)}-${joined.slice(8, 12)}-${joined.slice(12, 16)}-${joined.slice(16, 20)}-${joined.slice(20)}`;
}

function publicProfile(payload) {
    return {
        id: payload.profile?.id || null,
        prenom: payload.profile?.prenom || '',
        nom: payload.profile?.nom || '',
        telephone: payload.profile?.telephone || '',
        email: payload.email,
        role: payload.app_role,
        is_admin: payload.app_role === 'admin',
        is_moniteur: payload.app_role === 'instructor',
        instructor_name: payload.profile?.instructor_name || null,
        expires_at: payload.exp
    };
}

async function assertSessionActive(payload, supabase = getSupabaseAdmin()) {
    const email = String(payload.email || '').toLowerCase();
    if (payload.app_role === 'student') {
        const [{ data: user, error: userError }, { data: notification, error: notificationError }] = await Promise.all([
            supabase.from('users').select('id').ilike('email', email).maybeSingle(),
            supabase.from('inscription_notifications')
                .select('status')
                .ilike('user_email', email)
                .neq('pack', 'Paiement cash')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()
        ]);
        if (userError) throw userError;
        if (notificationError) throw notificationError;
        if (!user) throw new Error('ACCOUNT_DISABLED');
        if (notification?.status === 'pending') throw new Error('INSCRIPTION_PENDING');
        if (notification?.status === 'rejected') throw new Error('INSCRIPTION_REJECTED');
    } else if (payload.app_role === 'instructor') {
        const { data: instructor, error } = await supabase
            .from('instructors')
            .select('id,is_active')
            .ilike('email', email)
            .maybeSingle();
        if (error) throw error;
        if (!instructor || instructor.is_active === false) throw new Error('ACCOUNT_DISABLED');
    } else if (payload.app_role === 'admin') {
        const { data: admin, error } = await supabase
            .from('users')
            .select('id,is_admin')
            .ilike('email', email)
            .maybeSingle();
        if (error) throw error;
        const configuredAdmin = String(getEnv('ADMIN_EMAIL') || '').trim().toLowerCase();
        if (!admin?.is_admin && configuredAdmin !== email) throw new Error('ACCOUNT_DISABLED');
    } else {
        throw new Error('FORBIDDEN');
    }
    return payload;
}

module.exports = {
    assertSessionActive,
    getBearerToken,
    getEnv,
    getSupabaseAdmin,
    hashPassword,
    publicProfile,
    safeEqualText,
    sha256,
    signSession,
    verifyPassword,
    verifySession
};
