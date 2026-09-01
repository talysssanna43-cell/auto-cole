(function protectCurrentPage() {
    const script = document.currentScript;
    const roles = (script?.dataset?.roles || '')
        .split(',')
        .map((role) => role.trim())
        .filter(Boolean);
    function currentRelativePath() {
        if (window.location.protocol === 'file:') {
            const filename = decodeURIComponent(window.location.pathname.split(/[\\/]/).pop() || 'index.html');
            return `${filename}${window.location.search || ''}${window.location.hash || ''}`;
        }
        return `${window.location.pathname.replace(/^\//, '')}${window.location.search || ''}${window.location.hash || ''}`;
    }

    const redirectTarget = script?.dataset?.redirect || `connexion.html?redirect=${encodeURIComponent(currentRelativePath())}`;
    const redirect = window.location.protocol === 'file:'
        ? `http://localhost:8892/${redirectTarget}`
        : redirectTarget;

    document.documentElement.classList.add('auth-check-pending');
    const style = document.createElement('style');
    style.id = 'auth-guard-style';
    style.textContent = '.auth-check-pending body{visibility:hidden}';
    document.head.appendChild(style);

    async function checkAccess() {
        try {
            if (!window.authSession) throw new Error('AUTH_NOT_LOADED');
            const user = await window.authSession.requireRole(roles);
            if (!user) {
                window.location.replace(redirect);
                return;
            }
            window.authenticatedUser = user;
            window.dispatchEvent(new CustomEvent('auth-session-ready', { detail: user }));
            document.documentElement.classList.remove('auth-check-pending');
        } catch (error) {
            window.location.replace(redirect);
        }
    }

    checkAccess();
})();
