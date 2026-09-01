(function () {
    function setActiveTab(tab) {
        document.querySelectorAll('.tab-btn').forEach((button) => button.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach((content) => content.classList.remove('active'));
        document.querySelector(`.tab-btn[data-tab="${tab}"]`)?.classList.add('active');
        document.getElementById(`${tab}Tab`)?.classList.add('active');
        if (tab === 'prep') loadPrepSummary();
    }

    function ensurePrepTab() {
        const tabs = document.querySelector('.tabs-navigation');
        if (tabs && !document.querySelector('[data-tab="prep"]')) {
            const button = document.createElement('button');
            button.className = 'tab-btn';
            button.type = 'button';
            button.dataset.tab = 'prep';
            button.innerHTML = '<i class="fas fa-graduation-cap"></i> Preparation permis';
            const invoices = tabs.querySelector('[data-tab="invoices"]');
            tabs.insertBefore(button, invoices || tabs.firstElementChild);
            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                setActiveTab('prep');
                history.replaceState(null, '', '#tab-preparation');
            }, true);
        }

        if (!document.getElementById('prepTab')) {
            const panel = document.createElement('div');
            panel.className = 'tab-content';
            panel.id = 'prepTab';
            panel.innerHTML = `
                <div class="prep-panel">
                    <div class="panel-header">
                        <h2><i class="fas fa-graduation-cap"></i> Preparation permis</h2>
                        <p>Revois les points utiles avant tes cours de conduite et garde une trace de ce que tu as valide.</p>
                    </div>
                    <div class="prep-summary-grid" id="studentPrepSummary">
                        <div class="prep-summary-card"><strong>--</strong><span>Seances validees</span></div>
                        <div class="prep-summary-card"><strong>--</strong><span>A revoir</span></div>
                        <div class="prep-summary-card"><strong>--</strong><span>Pas commencees</span></div>
                    </div>
                    <a class="prep-launch" href="cours-theorique.html">
                        <i class="fas fa-play-circle"></i>
                        Lancer la plateforme de preparation
                    </a>
                    <p class="prep-note">Le suivi se met a jour apres chaque seance revisee.</p>
                </div>
            `;
            const invoices = document.getElementById('invoicesTab');
            (invoices?.parentNode || document.querySelector('.student-dashboard .container') || document.body)
                .insertBefore(panel, invoices || null);
        }

        const drawer = document.getElementById('studentMobileDrawer');
        if (drawer && !drawer.querySelector('[href="cours-theorique.html"]')) {
            const link = document.createElement('a');
            link.href = 'cours-theorique.html';
            link.innerHTML = '<i class="fas fa-graduation-cap"></i> Preparation permis';
            const invoicesLink = [...drawer.querySelectorAll('a')].find((item) => /factures/i.test(item.textContent || ''));
            drawer.insertBefore(link, invoicesLink || drawer.querySelector('[data-logout]'));
        }
    }

    function hidePrepAccess() {
        const prepButton = document.querySelector('[data-tab="prep"]');
        const prepTab = document.getElementById('prepTab');
        if (prepButton) prepButton.remove();
        if (prepTab) prepTab.remove();
        document.querySelectorAll('#studentMobileDrawer a[href="cours-theorique.html"]').forEach((link) => link.remove());
        if (window.location.hash === '#tab-preparation') {
            history.replaceState(null, '', '#tab-planning');
            setActiveTab('planning');
        }
    }

    function injectStyles() {
        if (document.getElementById('studentDrivingPrepStyles')) return;
        const style = document.createElement('style');
        style.id = 'studentDrivingPrepStyles';
        style.textContent = `
            .prep-panel { background:#fff; border-radius:24px; padding:2rem; box-shadow:0 18px 50px rgba(15,23,42,.08); }
            .prep-summary-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:1rem; margin:1.4rem 0; }
            .prep-summary-card { border:1px solid #e8eef7; border-radius:18px; padding:1rem; background:#f8fbff; }
            .prep-summary-card strong { display:block; color:#ed1675; font-size:2rem; line-height:1; }
            .prep-summary-card span { display:block; color:#64748b; font-weight:800; margin-top:.45rem; }
            .prep-launch { display:inline-flex; align-items:center; justify-content:center; gap:.65rem; min-height:54px; padding:0 1.3rem; border-radius:999px; background:#13ce66; color:#fff; font-weight:900; text-decoration:none; box-shadow:0 12px 28px rgba(19,206,102,.22); }
            .prep-note { margin-top:1rem; color:#64748b; font-weight:600; }
            @media (max-width:720px) { .prep-panel { padding:1.1rem; border-radius:18px; } .prep-launch { width:100%; } }
        `;
        document.head.appendChild(style);
    }

    async function loadPrepSummary() {
        const target = document.getElementById('studentPrepSummary');
        const token = window.authSession?.getToken?.();
        if (!target || !token) return;
        try {
            const response = await fetch('/.netlify/functions/driving-prep-progress', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            });
            const payload = await response.json().catch(() => ({}));
            if (response.status === 403 && payload.error === 'NO_DRIVING_PACK') {
                hidePrepAccess();
                return;
            }
            if (!response.ok || !payload.ok) throw new Error(payload.error || 'PREP_LOAD_FAILED');
            const summary = payload.summary || {};
            target.innerHTML = `
                <div class="prep-summary-card"><strong>${summary.validated_sessions || 0}/${summary.total_sessions || 7}</strong><span>Seances validees</span></div>
                <div class="prep-summary-card"><strong>${summary.to_review_sessions || 0}</strong><span>A revoir</span></div>
                <div class="prep-summary-card"><strong>${summary.missing_sessions || 0}</strong><span>Pas commencees</span></div>
            `;
        } catch (error) {
            target.innerHTML = `
                <div class="prep-summary-card"><strong>7</strong><span>Seances disponibles</span></div>
                <div class="prep-summary-card"><strong>15</strong><span>Minutes par seance</span></div>
                <div class="prep-summary-card"><strong>70%</strong><span>Objectif validation</span></div>
            `;
        }
    }

    function handleHash() {
        if (window.location.hash === '#tab-preparation') setActiveTab('prep');
    }

    function init() {
        injectStyles();
        ensurePrepTab();
        setTimeout(loadPrepSummary, 700);
        handleHash();
        window.addEventListener('hashchange', handleHash);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
