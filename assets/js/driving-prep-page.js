(function () {
    const STORAGE_KEY = 'quizProgress';
    let serverProgress = {};
    let hasServerStorage = false;
    let accessReady = false;

    function readLocalProgress() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
        } catch (error) {
            return {};
        }
    }

    function writeLocalProgress(progress) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress || {}));
        } catch (error) {
            console.warn('Preparation conduite: stockage local indisponible', error);
        }
    }

    function mergeProgress(localProgress, remoteProgress) {
        const merged = { ...(localProgress || {}) };
        Object.entries(remoteProgress || {}).forEach(([sessionId, remote]) => {
            const local = merged[sessionId];
            if (!local || Number(remote.score || 0) >= Number(local.score || 0)) {
                merged[sessionId] = remote;
            }
        });
        return merged;
    }

    function normalizeItems(items) {
        return (items || []).reduce((map, item) => {
            const sessionId = String(item.session_id);
            map[sessionId] = {
                score: Number(item.best_score || 0),
                total: Number(item.total_questions || 0),
                date: item.last_reviewed_at || item.updated_at || item.first_reviewed_at || new Date().toISOString(),
                attempts: Number(item.attempts || 0),
                stored: true
            };
            return map;
        }, {});
    }

    function token() {
        return window.authSession?.getToken?.() || '';
    }

    async function loadRemoteProgress() {
        if (!window.authSession?.requireRole) return false;
        const user = await window.authSession.requireRole('student');
        if (!user) {
            window.location.href = 'connexion.html?redirect=cours-theorique.html';
            return false;
        }

        const response = await fetch('/.netlify/functions/driving-prep-progress', {
            headers: { Authorization: `Bearer ${token()}` },
            cache: 'no-store'
        });
        const payload = await response.json().catch(() => ({}));

        if (response.status === 403 && payload.error === 'NO_DRIVING_PACK') {
            showLockedState();
            return false;
        }
        if (!response.ok || !payload.ok) {
            throw new Error(payload.error || 'PREPARATION_PROGRESS_LOAD_FAILED');
        }

        hasServerStorage = payload.storage_ready !== false;
        serverProgress = normalizeItems(payload.items || []);
        const merged = mergeProgress(readLocalProgress(), serverProgress);
        writeLocalProgress(merged);
        if (!hasServerStorage) showStorageWarning();
        return true;
    }

    async function saveRemoteProgress(sessionId, score, total, sessionTitle) {
        if (!accessReady) return;
        const authToken = token();
        if (!authToken) return;

        try {
            const response = await fetch('/.netlify/functions/driving-prep-progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    session_id: Number(sessionId),
                    session_title: sessionTitle || `Seance ${sessionId}`,
                    best_score: Number(score || 0),
                    total_questions: Number(total || 0)
                })
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload.ok) throw new Error(payload.error || 'SAVE_FAILED');
            hasServerStorage = payload.storage_ready !== false;
            serverProgress = normalizeItems(payload.items || []);
        } catch (error) {
            console.warn('Preparation conduite: suivi serveur non enregistre', error);
        }
    }

    function installProgressBridge() {
        const originalGetProgress = window.getProgress;
        const originalSaveProgress = window.saveProgress;

        window.getProgress = function getProgressBridge() {
            return mergeProgress(
                typeof originalGetProgress === 'function' ? originalGetProgress() : readLocalProgress(),
                serverProgress
            );
        };

        window.saveProgress = function saveProgressBridge(sessionId, score, total) {
            if (typeof originalSaveProgress === 'function') originalSaveProgress(sessionId, score, total);
            const current = readLocalProgress();
            const previous = current[sessionId];
            if (!previous || Number(score || 0) >= Number(previous.score || 0)) {
                current[sessionId] = {
                    score: Number(score || 0),
                    total: Number(total || 0),
                    date: new Date().toISOString()
                };
                writeLocalProgress(current);
            }
            const session = (window.quizSessions || []).find((item) => String(item.id) === String(sessionId));
            saveRemoteProgress(sessionId, score, total, session?.title);
        };
    }

    function showStorageWarning() {
        const header = document.querySelector('.quiz-header p');
        if (!header || document.getElementById('prepStorageWarning')) return;
        const warning = document.createElement('p');
        warning.id = 'prepStorageWarning';
        warning.style.cssText = 'margin-top:.6rem;color:#fef3c7;font-size:.85rem;';
        warning.textContent = "Suivi local actif. La table Supabase de suivi doit etre ajoutee pour l'affichage admin complet.";
        header.insertAdjacentElement('afterend', warning);
    }

    function showLockedState() {
        const container = document.querySelector('.container');
        if (!container) return;
        container.innerHTML = `
            <div class="results-card" style="display:block;">
                <div class="results-score average"><i class="fas fa-lock"></i></div>
                <h2>Acces reserve aux packs conduite</h2>
                <p>Cette plateforme se debloque automatiquement des qu'un pack avec cours de conduite est actif sur ton dossier.</p>
                <div class="results-actions">
                    <button class="btn-back" onclick="window.location.href='espace-eleve.html'">Retour a mon espace</button>
                </div>
            </div>
        `;
    }

    async function init() {
        installProgressBridge();
        try {
            accessReady = await loadRemoteProgress();
        } catch (error) {
            console.warn('Preparation conduite: chargement serveur indisponible', error);
            accessReady = true;
        }
        if (accessReady && typeof window.renderSessions === 'function') {
            window.renderSessions();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
