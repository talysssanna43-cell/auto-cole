(function () {
    const SESSION_TITLES = {
        1: 'Documents et installation',
        2: 'Voyants du tableau de bord',
        3: 'Commandes et securite',
        4: 'Pneus, niveaux et entretien',
        5: 'Chargement et passagers',
        6: 'Eco-conduite et risques',
        7: 'Premiers secours'
    };

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function injectStyles() {
        if (document.getElementById('adminDrivingPrepStyles')) return;
        const style = document.createElement('style');
        style.id = 'adminDrivingPrepStyles';
        style.textContent = `
            .driving-prep-admin { background:#f8fbff; border-left:4px solid #0071e3; }
            .driving-prep-summary { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:.75rem; margin:1rem 0; }
            .driving-prep-pill { border:1px solid #dbeafe; border-radius:14px; padding:.85rem; background:#fff; }
            .driving-prep-pill strong { display:block; color:#ed1675; font-size:1.45rem; }
            .driving-prep-pill span { color:#64748b; font-weight:800; font-size:.82rem; }
            .driving-prep-list { display:grid; gap:.55rem; }
            .driving-prep-row { display:grid; grid-template-columns:minmax(160px,1fr) 110px 120px; gap:.75rem; align-items:center; padding:.75rem; border-radius:12px; background:#fff; border:1px solid #e8eef7; }
            .driving-prep-row-title { font-weight:800; color:#18233f; }
            .driving-prep-status { justify-self:start; border-radius:999px; padding:.25rem .65rem; font-weight:900; font-size:.78rem; }
            .driving-prep-status.ok { background:#dcfce7; color:#15803d; }
            .driving-prep-status.review { background:#ffedd5; color:#c2410c; }
            .driving-prep-status.empty { background:#f1f5f9; color:#64748b; }
            .driving-prep-bar { height:8px; border-radius:999px; background:#e5e7eb; overflow:hidden; }
            .driving-prep-bar span { display:block; height:100%; background:#0071e3; border-radius:inherit; }
            @media (max-width:720px) { .driving-prep-row { grid-template-columns:1fr; } }
        `;
        document.head.appendChild(style);
    }

    async function fetchPrep(email) {
        const token = window.authSession?.getToken?.();
        if (!token || !email) return null;
        const response = await fetch(`/.netlify/functions/driving-prep-progress?email=${encodeURIComponent(email)}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'PREP_LOAD_FAILED');
        return payload;
    }

    function buildRows(items) {
        const map = new Map((items || []).map((item) => [Number(item.session_id), item]));
        return Array.from({ length: 7 }, (_, index) => {
            const sessionId = index + 1;
            const item = map.get(sessionId);
            const percent = Math.max(0, Math.min(100, Math.round(Number(item?.best_percent || 0))));
            const status = percent >= 70
                ? { cls: 'ok', label: 'Validee' }
                : percent > 0
                    ? { cls: 'review', label: 'A revoir' }
                    : { cls: 'empty', label: 'Pas commencee' };
            const title = item?.session_title || SESSION_TITLES[sessionId] || `Seance ${sessionId}`;
            return `
                <div class="driving-prep-row">
                    <div>
                        <div class="driving-prep-row-title">Seance ${sessionId} - ${escapeHtml(title)}</div>
                        <small>${item?.last_reviewed_at ? new Date(item.last_reviewed_at).toLocaleDateString('fr-FR') : 'Aucune revision'}</small>
                    </div>
                    <span class="driving-prep-status ${status.cls}">${status.label}</span>
                    <div><div class="driving-prep-bar"><span style="width:${percent}%"></span></div><small>${percent}%</small></div>
                </div>
            `;
        }).join('');
    }

    function buildSection(payload) {
        const summary = payload?.summary || {};
        const storageWarning = payload?.storage_ready === false
            ? '<p style="color:#c2410c;font-weight:800;margin:.75rem 0 0;">Table de suivi Supabase manquante : le suivi admin complet sera actif apres application du script SQL.</p>'
            : '';
        return `
            <div class="info-section driving-prep-admin" id="adminDrivingPrepSection">
                <h3><i class="fas fa-graduation-cap"></i> Preparation permis</h3>
                <div class="driving-prep-summary">
                    <div class="driving-prep-pill"><strong>${summary.validated_sessions || 0}/${summary.total_sessions || 7}</strong><span>Seances validees</span></div>
                    <div class="driving-prep-pill"><strong>${summary.to_review_sessions || 0}</strong><span>A revoir</span></div>
                    <div class="driving-prep-pill"><strong>${summary.missing_sessions || 0}</strong><span>Pas commencees</span></div>
                    <div class="driving-prep-pill"><strong>${summary.best_average || 0}%</strong><span>Moyenne revisee</span></div>
                </div>
                <div class="driving-prep-list">${buildRows(payload?.items || [])}</div>
                ${storageWarning}
            </div>
        `;
    }

    async function injectPrepSection(student) {
        const modalBody = document.getElementById('studentDetailsBody');
        if (!modalBody || !student?.email) return;
        document.getElementById('adminDrivingPrepSection')?.remove();
        try {
            const payload = await fetchPrep(student.email);
            const wrapper = document.createElement('div');
            wrapper.innerHTML = buildSection(payload);
            const actionsSection = [...modalBody.querySelectorAll('.info-section')]
                .find((section) => /Actions/i.test(section.textContent || ''));
            modalBody.insertBefore(wrapper.firstElementChild, actionsSection || null);
            window.fixTextEncoding?.(modalBody);
        } catch (error) {
            if (error.message === 'NO_DRIVING_PACK') return;
            console.warn('Suivi preparation permis indisponible:', error);
        }
    }

    function wrapDisplayStudentDetails() {
        const original = window.displayStudentDetails;
        if (typeof original !== 'function' || original.__drivingPrepWrapped) return;
        const wrapped = async function wrappedDisplayStudentDetails(student) {
            await original.apply(this, arguments);
            await injectPrepSection(student);
        };
        wrapped.__drivingPrepWrapped = true;
        window.displayStudentDetails = wrapped;
    }

    function init() {
        injectStyles();
        wrapDisplayStudentDetails();
        setTimeout(wrapDisplayStudentDetails, 800);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
