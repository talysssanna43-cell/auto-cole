(function () {
    const PACKS = Object.freeze({
        'tarif-chill-5': { label: 'Chill boite manuelle - 5 cours', price: 239, courses: 5, transmission: 'BM' },
        'tarif-chill-10': { label: 'Chill boite manuelle - 10 cours', price: 489, courses: 10, transmission: 'BM' },
        'tarif-chill-20': { label: 'Chill boite manuelle - 20 cours', price: 699, courses: 20, transmission: 'BM' },
        'tarif-chill-25': { label: 'Chill boite manuelle - 25 cours', price: 965, courses: 25, transmission: 'BM' },
        'tarif-chill-30': { label: 'Chill boite manuelle - 30 cours', price: 1149, courses: 30, transmission: 'BM' },
        'tarif-premium-5': { label: 'Premium boite manuelle - 5 cours', price: 389, courses: 5, transmission: 'BM' },
        'tarif-premium-10': { label: 'Premium boite manuelle - 10 cours', price: 599, courses: 10, transmission: 'BM' },
        'tarif-premium-20': { label: 'Premium boite manuelle - 20 cours', price: 799, courses: 20, transmission: 'BM' },
        'tarif-premium-25': { label: 'Premium boite manuelle - 25 cours', price: 1095, courses: 25, transmission: 'BM' },
        'tarif-premium-30': { label: 'Premium boite manuelle - 30 cours', price: 1249, courses: 30, transmission: 'BM' },
        'tarif-accelere-5': { label: 'Accelere boite manuelle - 5 cours', price: 489, courses: 5, transmission: 'BM' },
        'tarif-accelere-10': { label: 'Accelere boite manuelle - 10 cours', price: 749, courses: 10, transmission: 'BM' },
        'tarif-accelere-20': { label: 'Accelere boite manuelle - 20 cours', price: 899, courses: 20, transmission: 'BM' },
        'tarif-accelere-25': { label: 'Accelere boite manuelle - 25 cours', price: 1199, courses: 25, transmission: 'BM' },
        'tarif-accelere-30': { label: 'Accelere boite manuelle - 30 cours', price: 1399, courses: 30, transmission: 'BM' },
        'tarif-chill-auto-5': { label: 'Chill boite automatique - 5 cours', price: 269, courses: 5, transmission: 'BA' },
        'tarif-chill-auto-13': { label: 'Chill boite automatique - 13 cours', price: 499, courses: 13, transmission: 'BA' },
        'tarif-premium-auto-5': { label: 'Premium boite automatique - 5 cours', price: 379, courses: 5, transmission: 'BA' },
        'tarif-premium-auto-13': { label: 'Premium boite automatique - 13 cours', price: 599, courses: 13, transmission: 'BA' },
        'tarif-accelere-auto-5': { label: 'Accelere boite automatique - 5 cours', price: 499, courses: 5, transmission: 'BA' },
        'tarif-accelere-auto-13': { label: 'Accelere boite automatique - 13 cours', price: 749, courses: 13, transmission: 'BA' },
        'tarif-aac-20': { label: 'Conduite accompagnee - 20 cours', price: 889, courses: 20, transmission: 'BM' },
        'tarif-supervisee-20': { label: 'Conduite supervisee - 20 cours', price: 889, courses: 20, transmission: 'BM' },
        'tarif-aac-auto-13': { label: 'AAC boite automatique - 13 cours', price: 639, courses: 13, transmission: 'BA' },
        'tarif-supervisee-auto-13': { label: 'Supervisee boite automatique - 13 cours', price: 639, courses: 13, transmission: 'BA' },
        '20h': { label: 'Chill boite manuelle - 20 cours', price: 699, courses: 20, transmission: 'BM' },
        chill: { label: 'Chill boite manuelle - 20 cours', price: 699, courses: 20, transmission: 'BM' },
        zen: { label: 'Chill boite manuelle - 20 cours', price: 699, courses: 20, transmission: 'BM' },
        'boite-auto': { label: 'Chill boite automatique - 13 cours', price: 499, courses: 13, transmission: 'BA' },
        accelere: { label: 'Accelere boite manuelle - 20 cours', price: 899, courses: 20, transmission: 'BM' },
        aac: { label: 'Conduite accompagnee - 20 cours', price: 889, courses: 20, transmission: 'BM' },
        supervisee: { label: 'Conduite supervisee - 20 cours', price: 889, courses: 20, transmission: 'BM' },
        am: { label: 'Voiture sans permis AM', price: 350, courses: 8, transmission: 'BA' },
        'second-chance': { label: 'Forfait Second Chance', price: 569, courses: 6, transmission: 'BM' }
    });

    const UPGRADE_PACK_IDS = [
        'tarif-chill-5', 'tarif-chill-10', 'tarif-chill-20', 'tarif-chill-25',
        'tarif-premium-5', 'tarif-premium-10', 'tarif-premium-20', 'tarif-premium-25',
        'tarif-accelere-5', 'tarif-accelere-10', 'tarif-accelere-20', 'tarif-accelere-25',
        'tarif-chill-auto-5', 'tarif-chill-auto-13', 'tarif-premium-auto-5', 'tarif-premium-auto-13',
        'tarif-accelere-auto-5', 'tarif-accelere-auto-13',
        'tarif-aac-20', 'tarif-supervisee-20', 'tarif-aac-auto-13', 'tarif-supervisee-auto-13',
        'am', 'second-chance'
    ];

    const DOCUMENT_LABELS = Object.freeze({
        pieceIdentite: 'Piece d identite',
        assr: 'ASSR',
        jdc: 'JDC ou attestation de recensement',
        justifDomicile: 'Justificatif de domicile',
        ephoto: 'E-photo',
        certifHebergement: 'Certificat d hebergement',
        pieceHebergeur: 'Piece d identite de l hebergeur',
        pieceIdentiteParent: 'Piece d identite du representant legal',
        codeStudentCardFile: 'Carte etudiante'
    });
    const pendingDocumentFiles = new Map();
    const pendingPreviewUrls = new Map();

    function formatEuros(value) {
        return `${Number(value || 0).toLocaleString('fr-FR')}€`;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getState() {
        return window.dashboardState || {};
    }

    function getUser() {
        return getState().user || window.authSession?.getCachedUser?.() || {};
    }

    function getCurrentPack() {
        const user = getUser();
        const pack = PACKS[user.forfait] || PACKS[user.pack];
        return pack ? { ...pack, id: user.forfait || user.pack } : {
            id: user.forfait || user.pack || '',
            label: user.forfait || user.pack || 'Forfait actuel',
            price: 0,
            courses: Number(getState().hoursGoal || user.hours_goal || 0),
            transmission: user.transmission_type === 'auto' ? 'BA' : 'BM'
        };
    }

    function getCompletedCourses() {
        const state = getState();
        return Math.max(0, Number(state.completedHours || 0) + Number(state.initialCompletedHours || 0));
    }

    function getReservedCourses() {
        return Math.max(0, Number(getState().reservedHours || 0));
    }

    function setActiveTab(tab) {
        document.querySelectorAll('.tab-btn').forEach((button) => button.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach((content) => content.classList.remove('active'));
        const button = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
        const content = document.getElementById(`${tab}Tab`);
        if (button) button.classList.add('active');
        if (content) content.classList.add('active');
        if (tab === 'profile') renderProfile();
        if (tab === 'documents') renderDocuments();
    }

    function injectStyles() {
        if (document.getElementById('studentProfileUpgradeStyles')) return;
        const style = document.createElement('style');
        style.id = 'studentProfileUpgradeStyles';
        style.textContent = `
            .profile-panel { background: #fff; border-radius: 24px; padding: 2rem; box-shadow: 0 18px 50px rgba(15, 23, 42, .08); }
            .profile-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
            .profile-info-card { border: 1px solid #edf0f5; border-radius: 18px; padding: 1rem; background: #f8fbff; }
            .profile-info-card span { display: block; color: #6b7280; font-size: .82rem; font-weight: 800; text-transform: uppercase; letter-spacing: .02em; }
            .profile-info-card strong { display: block; margin-top: .35rem; color: #14152b; font-size: 1.05rem; word-break: break-word; }
            .pack-change-box { margin-top: 1.5rem; border: 2px solid rgba(237, 22, 117, .2); border-radius: 22px; padding: 1.2rem; background: linear-gradient(180deg, #fff 0%, #fff7fb 100%); }
            .pack-change-box h3 { margin: 0 0 .35rem; color: #14152b; }
            .pack-change-form { display: grid; grid-template-columns: minmax(220px, 1fr) auto; gap: 1rem; align-items: end; margin-top: 1rem; }
            .pack-change-form label { display: grid; gap: .45rem; font-weight: 800; color: #233d60; }
            .pack-change-form select { min-height: 52px; border: 1px solid #d8dee9; border-radius: 14px; padding: 0 .9rem; font: inherit; background: #fff; }
            .pack-change-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: .8rem; margin-top: 1rem; }
            .pack-change-summary div { border-radius: 16px; padding: .85rem; background: #fff; border: 1px solid #eef1f6; }
            .pack-change-summary span { display: block; color: #6b7280; font-size: .78rem; font-weight: 800; text-transform: uppercase; }
            .pack-change-summary strong { display: block; margin-top: .25rem; color: #14152b; font-size: 1.08rem; }
            .pack-change-submit { min-height: 52px; padding: 0 1.25rem; border: 0; border-radius: 15px; background: #13ce66; color: #fff; font: inherit; font-weight: 900; cursor: pointer; box-shadow: 0 12px 24px rgba(19, 206, 102, .22); }
            .pack-change-submit:disabled { cursor: not-allowed; opacity: .55; box-shadow: none; }
            .student-drawer-profile-card { margin: 4px 0 10px; padding: 14px; border-radius: 18px; background: linear-gradient(135deg, #fff5fb 0%, #edf7ff 100%); border: 1px solid rgba(237, 22, 117, .18); }
            .student-drawer-profile-card strong { display: block; color: #14152b; font-size: 1rem; }
            .student-drawer-profile-card span { display: block; color: #64748b; font-size: .82rem; margin-top: 4px; }
            .student-drawer-profile-actions { display: grid; grid-template-columns: 1fr; gap: 8px; margin-top: 12px; }
            .student-drawer-profile-actions a { display: flex !important; align-items: center; justify-content: center; gap: 8px; background: #fff !important; color: #123b70 !important; border: 1px solid #dbeafe; }
            .student-drawer-profile-actions a:last-child { background: #13ce66 !important; color: #fff !important; border-color: #13ce66; }
            .student-documents-box { margin-top: 1.5rem; border: 1px solid #eceff4; border-radius: 22px; padding: 1.2rem; background: #fff; }
            .student-documents-page .student-documents-box { margin-top: 0; border: 0; border-radius: 0; padding: 0; }
            .student-documents-box h3 { margin: 0 0 .35rem; color: #14152b; }
            .student-documents-list { display: grid; gap: .75rem; margin-top: 1rem; }
            .student-document-row { display: grid; grid-template-columns: minmax(180px, 1fr) auto; gap: .75rem; align-items: center; padding: .9rem; border: 1px solid #edf0f5; border-radius: 16px; background: #f8fafc; }
            .student-document-main strong { display: block; color: #14152b; }
            .student-document-main small { display: block; margin-top: .25rem; color: #64748b; }
            .student-document-link { display: inline-flex; align-items: center; gap: .4rem; margin-top: .5rem; color: #2563eb; font-weight: 850; text-decoration: none; }
            .student-document-status { display: inline-flex; align-items: center; width: fit-content; margin-top: .4rem; border-radius: 999px; padding: .22rem .6rem; font-size: .78rem; font-weight: 900; }
            .student-document-status.pending { background: #fff7ed; color: #c2410c; }
            .student-document-status.accepted { background: #dcfce7; color: #15803d; }
            .student-document-status.rejected { background: #ffe4e6; color: #be123c; }
            .student-document-status.missing { background: #f1f5f9; color: #475569; }
            .student-document-actions { display: flex; align-items: center; justify-content: flex-end; gap: .55rem; flex-wrap: wrap; }
            .student-document-upload { display: inline-flex; align-items: center; justify-content: center; min-height: 42px; padding: 0 .9rem; border: 0; border-radius: 13px; background: #ed1675; color: #fff; font: inherit; font-weight: 850; cursor: pointer; }
            .student-document-upload input { display: none; }
            .student-document-send { min-height: 42px; padding: 0 .9rem; border: 0; border-radius: 13px; background: #13ce66; color: #fff; font: inherit; font-weight: 900; cursor: pointer; }
            .student-document-send:disabled { cursor: not-allowed; opacity: .45; }
            .student-document-preview { grid-column: 1 / -1; display: none; align-items: center; gap: .8rem; padding: .75rem; border: 1px dashed #cbd5e1; border-radius: 14px; background: #fff; }
            .student-document-preview.active { display: flex; }
            .student-document-preview img { width: 62px; height: 62px; object-fit: cover; border-radius: 10px; border: 1px solid #e5e7eb; }
            .student-document-preview a { color: #2563eb; font-weight: 850; text-decoration: none; }
            .student-document-feedback { margin-top: .75rem; font-weight: 800; }
            @media (max-width: 720px) { .profile-panel { padding: 1.1rem; border-radius: 18px; } .pack-change-form { grid-template-columns: 1fr; } .student-document-row { grid-template-columns: 1fr; } .student-document-actions { justify-content: flex-start; } }
        `;
        document.head.appendChild(style);
    }

    function ensureProfileTab() {
        const tabs = document.querySelector('.tabs-navigation');
        if (tabs && !document.querySelector('[data-tab="profile"]')) {
            const button = document.createElement('button');
            button.className = 'tab-btn';
            button.type = 'button';
            button.dataset.tab = 'profile';
            button.innerHTML = '<i class="fas fa-user"></i> Mon profil';
            tabs.insertBefore(button, tabs.firstElementChild);
            button.addEventListener('click', () => setActiveTab('profile'));
        }
        if (tabs && !document.querySelector('[data-tab="documents"]')) {
            const button = document.createElement('button');
            button.className = 'tab-btn';
            button.type = 'button';
            button.dataset.tab = 'documents';
            button.innerHTML = '<i class="fas fa-folder-open"></i> Mes documents';
            const invoicesButton = tabs.querySelector('[data-tab="invoices"]');
            tabs.insertBefore(button, invoicesButton || tabs.children[1] || null);
            button.addEventListener('click', () => {
                setActiveTab('documents');
                history.replaceState(null, '', '#tab-documents');
            });
        }

        if (!document.getElementById('profileTab')) {
            const panel = document.createElement('div');
            panel.className = 'tab-content';
            panel.id = 'profileTab';
            panel.innerHTML = '<div class="profile-panel" id="studentProfilePanel"></div>';
            const invoices = document.getElementById('invoicesTab');
            (invoices?.parentNode || document.querySelector('.student-dashboard .container') || document.body)
                .insertBefore(panel, invoices || null);
        }

        if (!document.getElementById('documentsTab')) {
            const panel = document.createElement('div');
            panel.className = 'tab-content';
            panel.id = 'documentsTab';
            panel.innerHTML = `
                <div class="profile-panel student-documents-page" id="studentDocumentsBox">
                    <div class="panel-header">
                        <h2><i class="fas fa-folder-open"></i> Mes documents</h2>
                        <p style="color: var(--text-light); margin-top: .45rem;">Consulte les pieces deja envoyees, complete ton dossier et suis leur verification.</p>
                    </div>
                    <div class="student-documents-box">
                        <div class="student-documents-list" id="studentDocumentsList">
                            <div class="student-document-row"><div class="student-document-main"><strong>Chargement des documents...</strong></div></div>
                        </div>
                        <div class="student-document-feedback" id="studentDocumentsFeedback"></div>
                    </div>
                </div>
            `;
            const invoices = document.getElementById('invoicesTab');
            (invoices?.parentNode || document.querySelector('.student-dashboard .container') || document.body)
                .insertBefore(panel, invoices || null);
        }

        const drawer = document.getElementById('studentMobileDrawer');
        if (drawer && !drawer.querySelector('.student-drawer-profile-card')) {
            const card = document.createElement('div');
            card.className = 'student-drawer-profile-card';
            card.innerHTML = `
                <strong>Mon profil</strong>
                <span>Infos, forfait et changement de formule</span>
                <div class="student-drawer-profile-actions">
                    <a href="#tab-profile"><i class="fas fa-user"></i> Voir mon profil</a>
                    <a href="#tab-documents"><i class="fas fa-folder-open"></i> Mes documents</a>
                    <a href="#tab-profile" data-focus-pack-change><i class="fas fa-rotate"></i> Changer de forfait</a>
                </div>
            `;
            const firstLink = drawer.querySelector('a');
            drawer.insertBefore(card, firstLink || drawer.querySelector('[data-logout]'));
            card.querySelectorAll('a').forEach((link) => {
                link.addEventListener('click', () => {
                    const targetTab = link.getAttribute('href') === '#tab-documents' ? 'documents' : 'profile';
                    setActiveTab(targetTab);
                    if (link.hasAttribute('data-focus-pack-change')) {
                        setTimeout(() => document.querySelector('.pack-change-box')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
                    }
                });
            });
        }
    }

    function renderProfile() {
        const panel = document.getElementById('studentProfilePanel');
        if (!panel) return;
        const user = getUser();
        const pack = getCurrentPack();
        const completed = getCompletedCourses();
        const reserved = getReservedCourses();
        const remaining = Math.max(0, Number(pack.courses || getState().hoursGoal || 0) - completed - reserved);

        panel.innerHTML = `
            <div class="panel-header">
                <h2><i class="fas fa-user"></i> Mon profil</h2>
                <p style="color: var(--text-light); margin-top: .45rem;">Tes informations, ton forfait et tes possibilites d'evolution.</p>
            </div>
            <div class="profile-grid">
                <div class="profile-info-card"><span>Nom</span><strong>${user.prenom || ''} ${user.nom || ''}</strong></div>
                <div class="profile-info-card"><span>Email</span><strong>${user.email || '-'}</strong></div>
                <div class="profile-info-card"><span>Telephone</span><strong>${user.telephone || '-'}</strong></div>
                <div class="profile-info-card"><span>Forfait actuel</span><strong>${pack.label}</strong></div>
                <div class="profile-info-card"><span>Type</span><strong>${pack.transmission || (user.transmission_type === 'auto' ? 'BA' : 'BM')}</strong></div>
                <div class="profile-info-card"><span>Progression</span><strong>${completed} cours realises / ${reserved} reserves / ${remaining} restants</strong></div>
            </div>
            <div class="pack-change-box">
                <h3>Changer de forfait</h3>
                <p style="margin: 0; color: #64748b;">Tu peux passer sur un forfait superieur en reglent uniquement la difference. Les cours deja realises restent deduits du nouveau forfait.</p>
                <form class="pack-change-form" id="studentPackChangeForm">
                    <label>
                        Nouveau forfait
                        <select id="studentNewPackSelect" required>
                            ${UPGRADE_PACK_IDS.map((id) => {
                                const item = PACKS[id];
                                return `<option value="${id}" ${id === pack.id ? 'disabled' : ''}>${item.label} - ${formatEuros(item.price)}</option>`;
                            }).join('')}
                        </select>
                    </label>
                    <button class="pack-change-submit" type="submit">Regler la difference</button>
                </form>
                <div class="pack-change-summary" id="studentPackChangeSummary"></div>
            </div>
        `;

        const select = document.getElementById('studentNewPackSelect');
        const form = document.getElementById('studentPackChangeForm');
        const submit = form?.querySelector('button[type="submit"]');
        const updateSummary = () => {
            const next = PACKS[select.value];
            const due = Math.max(0, Number(next.price || 0) - Number(pack.price || 0));
            const nextRemaining = Math.max(0, Number(next.courses || 0) - completed);
            const summary = document.getElementById('studentPackChangeSummary');
            if (summary) {
                summary.innerHTML = `
                    <div><span>Ancien forfait</span><strong>${formatEuros(pack.price)}</strong></div>
                    <div><span>Nouveau forfait</span><strong>${formatEuros(next.price)}</strong></div>
                    <div><span>Difference a payer</span><strong style="color:#13a453;">${formatEuros(due)}</strong></div>
                    <div><span>Apres changement</span><strong>${nextRemaining} cours restants</strong></div>
                `;
            }
            if (submit) {
                submit.disabled = due <= 0;
                submit.textContent = due > 0 ? `Regler ${formatEuros(due)}` : 'Aucune difference a payer';
            }
        };
        select?.addEventListener('change', updateSummary);
        updateSummary();
        form?.addEventListener('submit', submitPackChange);
    }
    window.renderStudentProfile = renderProfile;

    function documentStatusInfo(document) {
        const status = String(document?.status || (document?.data ? 'pending' : 'missing')).toLowerCase();
        if (status === 'accepted') return { cls: 'accepted', label: 'Valide' };
        if (status === 'rejected') return { cls: 'rejected', label: 'A remplacer' };
        if (status === 'pending') return { cls: 'pending', label: 'En verification' };
        return { cls: 'missing', label: 'Manquant' };
    }

    async function loadDocuments() {
        const token = window.authSession?.getToken?.();
        if (!token) throw new Error('AUTH_REQUIRED');
        const response = await fetch('/.netlify/functions/student-documents', {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'DOCUMENTS_LOAD_FAILED');
        return payload;
    }

    function renderDocumentRow(key, document) {
        const status = documentStatusInfo(document);
        const canUpload = status.cls !== 'accepted';
        const comment = document?.admin_comment ? `<small>Motif admin : ${escapeHtml(document.admin_comment)}</small>` : '';
        const existingLink = document?.data
            ? `<a class="student-document-link" href="${escapeHtml(document.data)}" target="_blank" rel="noopener"><i class="fas fa-eye"></i> Voir la piece jointe envoyee</a>`
            : '';
        return `
            <div class="student-document-row" data-document-key="${escapeHtml(key)}">
                <div class="student-document-main">
                    <strong>${escapeHtml(DOCUMENT_LABELS[key] || key)}</strong>
                    <small>${document?.name ? escapeHtml(document.name) : 'Aucun fichier depose'}</small>
                    ${comment}
                    <span class="student-document-status ${status.cls}">${status.label}</span>
                    ${existingLink}
                </div>
                <div class="student-document-actions" style="${canUpload ? '' : 'display:none;'}">
                    <label class="student-document-upload">
                        ${document?.data ? 'Choisir un remplacement' : 'Choisir un fichier'}
                        <input type="file" accept="image/*,.pdf" data-document-input="${escapeHtml(key)}">
                    </label>
                    <button type="button" class="student-document-send" data-document-send="${escapeHtml(key)}" disabled>
                        Envoyer a l'admin
                    </button>
                </div>
                <div class="student-document-preview" data-document-preview="${escapeHtml(key)}"></div>
            </div>
        `;
    }

    async function renderDocuments() {
        const list = document.getElementById('studentDocumentsList');
        if (!list) return;
        try {
            const payload = await loadDocuments();
            const docs = payload.documents || {};
            const keys = [...new Set([...(payload.expected || []), ...Object.keys(docs)])];
            list.innerHTML = keys.length
                ? keys.map((key) => renderDocumentRow(key, docs[key])).join('')
                : '<div class="student-document-row"><div class="student-document-main"><strong>Aucun document attendu pour le moment.</strong></div></div>';
            list.querySelectorAll('[data-document-input]').forEach((input) => {
                input.addEventListener('change', handleDocumentSelection);
            });
            list.querySelectorAll('[data-document-send]').forEach((button) => {
                button.addEventListener('click', handleDocumentUpload);
            });
        } catch (error) {
            if (error.message === 'AUTH_REQUIRED') {
                setTimeout(renderDocuments, 500);
                return;
            }
            list.innerHTML = '<div class="student-document-row"><div class="student-document-main"><strong>Documents indisponibles</strong><small>Recharge la page ou reconnecte-toi.</small></div></div>';
        }
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function clearPendingPreview(key) {
        const previousUrl = pendingPreviewUrls.get(key);
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        pendingPreviewUrls.delete(key);
    }

    function handleDocumentSelection(event) {
        const input = event.currentTarget;
        const file = input.files?.[0];
        const key = input.dataset.documentInput;
        const feedback = document.getElementById('studentDocumentsFeedback');
        if (!file || !key) return;
        if (file.size > 1_000_000) {
            if (feedback) {
                feedback.textContent = 'Fichier trop lourd : maximum 1 Mo.';
                feedback.style.color = '#be123c';
            }
            input.value = '';
            return;
        }

        clearPendingPreview(key);
        const previewUrl = URL.createObjectURL(file);
        pendingPreviewUrls.set(key, previewUrl);
        pendingDocumentFiles.set(key, file);

        const row = input.closest('[data-document-key]');
        const preview = row?.querySelector('[data-document-preview]');
        const sendButton = row?.querySelector('[data-document-send]');
        if (preview) {
            const visual = file.type.startsWith('image/')
                ? `<img src="${previewUrl}" alt="">`
                : '<i class="fas fa-file-pdf" style="font-size:2rem;color:#be123c;"></i>';
            preview.classList.add('active');
            preview.innerHTML = `
                ${visual}
                <div>
                    <strong style="display:block;color:#14152b;">Piece jointe selectionnee</strong>
                    <small style="display:block;color:#64748b;">${escapeHtml(file.name)}</small>
                    <a href="${previewUrl}" target="_blank" rel="noopener">Ouvrir avant envoi</a>
                </div>
            `;
        }
        if (sendButton) sendButton.disabled = false;
        if (feedback) feedback.textContent = '';
    }

    async function handleDocumentUpload(event) {
        const button = event.currentTarget;
        const key = button?.dataset.documentSend;
        const file = key ? pendingDocumentFiles.get(key) : null;
        const feedback = document.getElementById('studentDocumentsFeedback');
        if (!file || !key) {
            if (feedback) {
                feedback.textContent = 'Choisis une piece jointe avant de l envoyer.';
                feedback.style.color = '#be123c';
            }
            return;
        }

        try {
            if (feedback) {
                feedback.textContent = 'Envoi du document a l admin...';
                feedback.style.color = '#64748b';
            }
            button.disabled = true;
            button.textContent = 'Envoi...';
            const token = window.authSession?.getToken?.();
            const body = {
                documentKey: key,
                document: {
                    name: file.name,
                    type: file.type,
                    data: await fileToBase64(file)
                }
            };
            const response = await fetch('/.netlify/functions/student-documents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload.ok) throw new Error(payload.error || 'DOCUMENT_UPLOAD_FAILED');
            pendingDocumentFiles.delete(key);
            clearPendingPreview(key);
            if (feedback) {
                feedback.textContent = 'Document envoye a l admin. Il est maintenant en verification.';
                feedback.style.color = '#15803d';
            }
            await renderDocuments();
        } catch (error) {
            button.disabled = false;
            button.textContent = 'Envoyer a l admin';
            if (feedback) {
                feedback.textContent = 'Impossible d envoyer le document. Reessaie.';
                feedback.style.color = '#be123c';
            }
        }
    }

    async function submitPackChange(event) {
        event.preventDefault();
        const select = document.getElementById('studentNewPackSelect');
        const newPack = select?.value;
        const token = window.authSession?.getToken?.();
        if (!newPack || !token) {
            alert('Ta session a expire. Reconnecte-toi avant de changer de forfait.');
            window.location.href = 'connexion.html?redirect=espace-eleve.html';
            return;
        }

        const button = event.currentTarget.querySelector('button[type="submit"]');
        if (button) {
            button.disabled = true;
            button.textContent = 'Preparation du paiement...';
        }

        try {
            const response = await fetch('/.netlify/functions/create-pack-upgrade-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ new_pack: newPack })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.url) {
                if (['STRIPE_LIVE_BLOCKED_ON_LOCALHOST', 'STRIPE_NOT_CONFIGURED'].includes(result.error) && isLocalPage()) {
                    const ok = confirm("Stripe live est bloque sur localhost pour eviter un vrai debit. Veux-tu simuler ce changement de forfait localement pour tester le parcours ?");
                    if (ok) {
                        await simulateLocalPackChange(newPack);
                        return;
                    }
                    throw new Error('Test annule. Pour tester Stripe reellement sans argent, utilise une cle Stripe test sk_test dans Netlify.');
                }
                if (result.error === 'NO_PAYMENT_REQUIRED') throw new Error("Ce changement ne demande pas de paiement. Contacte l'auto-ecole pour le valider proprement.");
                if (result.error === 'SAME_PACK') throw new Error('Tu as deja ce forfait.');
                throw new Error(result.message || 'Impossible de preparer le paiement.');
            }
            window.location.assign(result.url);
        } catch (error) {
            console.error('Changement de forfait:', error);
            alert(`${error.message}\n\nTu peux contacter l'auto-ecole au 04 91 53 36 98.`);
            if (button) {
                button.disabled = false;
                button.textContent = 'Regler la difference';
            }
        }
    }

    function isLocalPage() {
        return /localhost|127\.0\.0\.1/i.test(window.location.hostname);
    }

    async function simulateLocalPackChange(newPack) {
        const token = window.authSession?.getToken?.();
        const response = await fetch('/.netlify/functions/confirm-pack-upgrade', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ simulateLocal: true, new_pack: newPack })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
            throw new Error('La simulation locale a echoue. Recharge la page et reessaie.');
        }
        localStorage.setItem('ae_user', JSON.stringify(result.student));
        if (window.dashboardState) {
            window.dashboardState.user = result.student;
            window.dashboardState.hoursGoal = Number(result.student.hours_goal || 0);
            window.dashboardState.lessonUnitMinutes = Number(result.student.lesson_unit_minutes || 45);
        }
        alert(`Simulation locale confirmee. Nouveau forfait : ${PACKS[result.change.to_pack]?.label || result.change.to_pack}.`);
        renderProfile();
        if (typeof window.renderStats === 'function') window.renderStats();
    }

    async function confirmPackUpgradeReturn() {
        const url = new URL(window.location.href);
        const status = url.searchParams.get('pack_upgrade_success');
        if (status === 'false') {
            alert('Le changement de forfait a ete annule. Aucun paiement n’a ete effectue.');
            url.searchParams.delete('pack_upgrade_success');
            window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
            return;
        }
        if (status !== 'true') return;

        const checkoutSessionId = url.searchParams.get('session_id');
        const token = window.authSession?.getToken?.();
        if (!checkoutSessionId || !token) return;

        try {
            const response = await fetch('/.netlify/functions/confirm-pack-upgrade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ checkoutSessionId })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.ok) throw new Error('Le paiement est confirme, mais la mise a jour est encore en cours. Recharge la page dans quelques instants.');

            localStorage.setItem('ae_user', JSON.stringify(result.student));
            alert(`Paiement confirme. Ton forfait est maintenant : ${PACKS[result.change.to_pack]?.label || result.change.to_pack}.`);
            window.location.replace('espace-eleve.html#tab-profile');
        } catch (error) {
            console.error('Confirmation changement forfait:', error);
            alert(error.message);
        }
    }

    function bindHashNavigation() {
        const go = () => {
            if (window.location.hash === '#tab-profile') setActiveTab('profile');
            if (window.location.hash === '#tab-documents') {
                setActiveTab('documents');
            }
        };
        window.addEventListener('hashchange', go);
        go();
    }

    function waitForDashboardThenRender(attempt = 0) {
        ensureProfileTab();
        if (getUser()?.email || attempt > 30) {
            renderProfile();
            bindHashNavigation();
            return;
        }
        setTimeout(() => waitForDashboardThenRender(attempt + 1), 250);
    }

    document.addEventListener('DOMContentLoaded', () => {
        injectStyles();
        confirmPackUpgradeReturn();
        waitForDashboardThenRender();
    });
})();
