const SUPABASE_URL = 'https://pcdkaqndfjysalyrbwuo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjZGthcW5kZmp5c2FseXJid3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTI3OTIsImV4cCI6MjA4MjM4ODc5Mn0.M0gy-iR0iE8tIUF-1kGLZvhHowq29RVpMG7QPbJgo4Q';
const AUTH_TOKEN_KEY = 'ae_access_token';
const AUTH_USER_KEY = 'ae_user';

if (typeof supabase === 'undefined') {
    throw new Error('Supabase JS library must be loaded before supabaseClient.js');
}

function readStoredValue(key) {
    try {
        return localStorage.getItem(key) || sessionStorage.getItem(key) || '';
    } catch (error) {
        return '';
    }
}

function clearStoredAuth() {
    for (const storage of [localStorage, sessionStorage]) {
        try {
            storage.removeItem(AUTH_TOKEN_KEY);
            storage.removeItem(AUTH_USER_KEY);
            storage.removeItem('instructorSession');
        } catch (error) {
            // Storage can be disabled by browser privacy settings.
        }
    }
}

function createSupabaseClient() {
    return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

window.setSupabaseAccessToken = function setSupabaseAccessToken(token) {
    // The app session token is signed for Netlify Functions only.
    // Direct Supabase REST calls must keep Supabase's own anon JWT, otherwise
    // PostgREST rejects the request with PGRST301 when local JWT secrets differ.
    window.supabaseClient = createSupabaseClient();
    return window.supabaseClient;
};

window.supabaseClient = createSupabaseClient();

// Compatibility for administration pages not yet routed through a server
// endpoint. Legacy hashes are migrated to scrypt after a successful login.
window.hashPassword = async function hashPassword(password) {
    if (!password) return '';
    const data = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

window.authSession = {
    getToken() {
        return readStoredValue(AUTH_TOKEN_KEY);
    },

    getCachedUser() {
        const raw = readStoredValue(AUTH_USER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (error) {
            clearStoredAuth();
            return null;
        }
    },

    async login(email, password, remember = false) {
        const response = await fetch('/.netlify/functions/auth-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, remember })
        });
        const result = await response.json().catch(() => ({ ok: false, error: 'INVALID_SERVER_RESPONSE' }));
        if (!response.ok || !result.ok || !result.token || !result.user) {
            const error = new Error(result.error || 'LOGIN_FAILED');
            error.status = response.status;
            throw error;
        }

        clearStoredAuth();
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(AUTH_TOKEN_KEY, result.token);
        storage.setItem(AUTH_USER_KEY, JSON.stringify(result.user));
        window.setSupabaseAccessToken(result.token);
        return result.user;
    },

    async verify() {
        const token = this.getToken();
        if (!token) return null;
        const response = await fetch('/.netlify/functions/auth-session', {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
        });
        if (!response.ok) {
            clearStoredAuth();
            window.setSupabaseAccessToken('');
            return null;
        }
        const result = await response.json();
        if (!result.ok || !result.user) return null;

        const storage = localStorage.getItem(AUTH_TOKEN_KEY) ? localStorage : sessionStorage;
        storage.setItem(AUTH_USER_KEY, JSON.stringify(result.user));
        return result.user;
    },

    async requireRole(roles) {
        const allowed = Array.isArray(roles) ? roles : [roles];
        const user = await this.verify();
        return user && allowed.includes(user.role) ? user : null;
    },

    logout() {
        clearStoredAuth();
        window.setSupabaseAccessToken('');
    }
};
