(function () {
    const state = {
        selectedStudent: null,
        timer: null,
        loading: false
    };

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function token() {
        return window.authSession?.getToken?.() || '';
    }

    function isAdminPage() {
        return document.body?.dataset?.examRequestRole === 'admin'
            || /admin-planning\.html/i.test(location.pathname);
    }

    function isInstructorPage() {
        return document.body?.dataset?.examRequestRole === 'instructor'
            || /espace-moniteur\.html/i.test(location.pathname);
    }

    function currentInstructorName() {
        if (isAdminPage()) {
            return window.state?.instructor || document.querySelector('#instructorSegment button.active')?.dataset?.instructor || '';
        }
        let storedUser = {};
        try {
            storedUser = JSON.parse(localStorage.getItem('ae_user') || sessionStorage.getItem('ae_user') || '{}');
        } catch (error) {
            storedUser = {};
        }
        return window.authenticatedUser?.instructor_name
            || window.authenticatedUser?.prenom
            || storedUser?.prenom
            || '';
    }

    function injectStyles() {
        if (document.getElementById('examRequestStyles')) return;
        const style = document.createElement('style');
        style.id = 'examRequestStyles';
        style.textContent = `
            .btn-exam-request {
                display: inline-flex;
                align-items: center;
                gap: 7px;
                padding: 7px 14px;
                border: 0;
                border-radius: 999px;
                background: #ec4899;
                color: #fff;
                font: inherit;
                font-size: 0.8rem;
                font-weight: 650;
                cursor: pointer;
                box-shadow: 0 8px 18px rgba(236,72,153,0.18);
                white-space: nowrap;
            }
            .btn-exam-request:hover { background: #db2777; transform: translateY(-1px); }
            .exam-request-modal-overlay {
                position: fixed;
                inset: 0;
                z-index: 400;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 18px;
                background: rgba(15, 23, 42, 0.42);
                backdrop-filter: blur(6px);
            }
            .exam-request-modal-overlay.active { display: flex; }
            .exam-request-modal {
                width: min(560px, 100%);
                background: #fff;
                border-radius: 14px;
                box-shadow: 0 24px 70px rgba(15,23,42,0.22);
                overflow: hidden;
            }
            .exam-request-modal header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 18px 20px;
                border-bottom: 1px solid rgba(0,0,0,0.08);
            }
            .exam-request-modal h3 {
                margin: 0;
                display: flex;
                align-items: center;
                gap: 9px;
                font-size: 1.05rem;
            }
            .exam-request-close {
                width: 32px;
                height: 32px;
                border: 0;
                border-radius: 50%;
                background: rgba(0,0,0,0.05);
                cursor: pointer;
            }
            .exam-request-form {
                padding: 20px;
                display: grid;
                gap: 14px;
            }
            .exam-request-field { position: relative; display: grid; gap: 6px; }
            .exam-request-field label {
                color: #1d1d1f;
                font-size: 0.86rem;
                font-weight: 650;
            }
            .exam-request-field input,
            .exam-request-field textarea {
                width: 100%;
                border: 1px solid rgba(0,0,0,0.12);
                border-radius: 10px;
                padding: 11px 12px;
                font: inherit;
                outline: none;
                background: #fff;
            }
            .exam-request-field textarea { min-height: 88px; resize: vertical; }
            .exam-request-suggestions {
                position: absolute;
                left: 0;
                right: 0;
                top: calc(100% + 4px);
                z-index: 20;
                display: none;
                overflow: hidden;
                max-height: 260px;
                overflow-y: auto;
                background: #fff;
                border: 1px solid rgba(0,0,0,0.12);
                border-radius: 10px;
                box-shadow: 0 16px 30px rgba(15,23,42,0.12);
            }
            .exam-request-suggestions.active { display: block; }
            .exam-request-suggestion {
                width: 100%;
                border: 0;
                border-bottom: 1px solid rgba(0,0,0,0.06);
                background: #fff;
                padding: 11px 12px;
                text-align: left;
                cursor: pointer;
            }
            .exam-request-suggestion:hover { background: #f6f7fb; }
            .exam-request-suggestion strong { display: block; color: #1d1d1f; }
            .exam-request-suggestion span { color: #86868b; font-size: 0.8rem; }
            .exam-request-selected {
                display: none;
                border-radius: 10px;
                padding: 11px 12px;
                background: #fdf2f8;
                color: #9d174d;
                font-size: 0.86rem;
                font-weight: 650;
            }
            .exam-request-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 4px;
            }
            .exam-request-actions button {
                border: 0;
                border-radius: 10px;
                padding: 11px 15px;
                font: inherit;
                font-weight: 700;
                cursor: pointer;
            }
            .exam-request-secondary { background: #f3f4f6; color: #374151; }
            .exam-request-primary { background: #ec4899; color: #fff; }
            .exam-request-feedback { min-height: 18px; color: #86868b; font-size: 0.84rem; }
            .exam-request-feedback.error { color: #dc2626; }
            .exam-request-feedback.success { color: #16a34a; }
            .exam-request-panel {
                margin: 0 0 18px;
                background: #fff;
                border: 1px solid rgba(0,0,0,0.06);
                border-radius: 14px;
                box-shadow: 0 4px 24px rgba(0,0,0,0.06);
                overflow: hidden;
            }
            .exam-request-panel-header {
                display: flex;
                justify-content: space-between;
                gap: 14px;
                align-items: center;
                padding: 16px 18px;
                border-bottom: 1px solid rgba(0,0,0,0.06);
            }
            .exam-request-panel-header h2 {
                margin: 0;
                display: flex;
                gap: 9px;
                align-items: center;
                font-size: 1rem;
            }
            .exam-request-count {
                display: inline-flex;
                min-width: 26px;
                height: 26px;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                background: #fdf2f8;
                color: #be185d;
                font-weight: 800;
            }
            .exam-request-list {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                gap: 12px;
                padding: 14px;
            }
            .exam-request-card {
                --urgency-color: #22c55e;
                border: 1px solid rgba(0,0,0,0.08);
                border-left: 5px solid var(--urgency-color);
                border-radius: 12px;
                padding: 14px;
                background: #fff;
            }
            .exam-request-card h3 {
                margin: 0 0 6px;
                font-size: 0.98rem;
                font-weight: 750;
            }
            .exam-request-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 7px;
                margin: 9px 0;
            }
            .exam-request-pill {
                border-radius: 999px;
                padding: 5px 9px;
                background: #f5f5f7;
                color: #4b5563;
                font-size: 0.76rem;
                font-weight: 650;
            }
            .exam-request-deadline {
                color: var(--urgency-color);
                background: color-mix(in srgb, var(--urgency-color) 13%, white);
            }
            .exam-request-bar {
                height: 7px;
                border-radius: 999px;
                background: linear-gradient(90deg, #22c55e, #f59e0b, #ef4444);
                margin: 10px 0 8px;
                position: relative;
            }
            .exam-request-cursor {
                position: absolute;
                top: 50%;
                width: 16px;
                height: 16px;
                border: 3px solid #fff;
                border-radius: 50%;
                background: var(--urgency-color);
                transform: translate(-50%, -50%);
                box-shadow: 0 3px 10px rgba(0,0,0,0.22);
            }
            .exam-request-note {
                margin: 8px 0 0;
                color: #6b7280;
                font-size: 0.82rem;
                line-height: 1.35;
            }
            .exam-request-card-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 12px;
            }
            .exam-request-card-actions button {
                border: 0;
                border-radius: 8px;
                padding: 8px 10px;
                font: inherit;
                font-size: 0.78rem;
                font-weight: 700;
                cursor: pointer;
            }
            .exam-request-schedule { background: #ec4899; color: #fff; }
            .exam-request-dismiss { background: #f3f4f6; color: #4b5563; }
            @media (max-width: 700px) {
                .exam-request-panel-header { align-items: flex-start; flex-direction: column; }
                .exam-request-list { grid-template-columns: 1fr; }
                .exam-request-actions { flex-direction: column; }
                .exam-request-actions button { width: 100%; }
            }
        `;
        document.head.appendChild(style);
    }

    function ensureModal() {
        injectStyles();
        let modal = document.getElementById('examRequestModal');
        if (modal) return modal;
        modal = document.createElement('div');
        modal.id = 'examRequestModal';
        modal.className = 'exam-request-modal-overlay';
        modal.innerHTML = `
            <div class="exam-request-modal" role="dialog" aria-modal="true" aria-labelledby="examRequestTitle">
                <header>
                    <h3 id="examRequestTitle"><i class="fas fa-flag-checkered"></i> Demande permis</h3>
                    <button class="exam-request-close" type="button" onclick="closeExamRequestModal()" aria-label="Fermer"><i class="fas fa-times"></i></button>
                </header>
                <form class="exam-request-form" id="examRequestForm">
                    <input type="hidden" id="examRequestStudentEmail">
                    <input type="hidden" id="examRequestStudentName">
                    <div class="exam-request-field">
                        <label for="examRequestStudentSearch">Candidat</label>
                        <input id="examRequestStudentSearch" type="text" autocomplete="off" placeholder="Tape les premières lettres du nom ou prénom" required>
                        <div id="examRequestSuggestions" class="exam-request-suggestions"></div>
                    </div>
                    <div id="examRequestSelected" class="exam-request-selected"></div>
                    <div class="exam-request-field">
                        <label for="examRequestComment">Commentaire du moniteur</label>
                        <textarea id="examRequestComment" placeholder="Exemple : élève prêt, souhaite Aubagne si possible, disponible le matin..."></textarea>
                    </div>
                    <p id="examRequestFeedback" class="exam-request-feedback"></p>
                    <div class="exam-request-actions">
                        <button class="exam-request-secondary" type="button" onclick="closeExamRequestModal()">Annuler</button>
                        <button class="exam-request-primary" type="submit"><i class="fas fa-paper-plane"></i> Envoyer la demande</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('#examRequestStudentSearch')?.addEventListener('input', handleStudentSearch);
        modal.querySelector('#examRequestForm')?.addEventListener('submit', submitExamRequest);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) window.closeExamRequestModal();
        });
        return modal;
    }

    function feedback(message, type = '') {
        const element = document.getElementById('examRequestFeedback');
        if (!element) return;
        element.textContent = message || '';
        element.className = `exam-request-feedback ${type}`;
    }

    function setSelectedStudent(student) {
        state.selectedStudent = student;
        const emailInput = document.getElementById('examRequestStudentEmail');
        const nameInput = document.getElementById('examRequestStudentName');
        const searchInput = document.getElementById('examRequestStudentSearch');
        const selected = document.getElementById('examRequestSelected');
        const suggestions = document.getElementById('examRequestSuggestions');
        const name = student.name || `${student.prenom || ''} ${student.nom || ''}`.trim() || student.email;
        if (emailInput) emailInput.value = student.email || '';
        if (nameInput) nameInput.value = name;
        if (searchInput) searchInput.value = name;
        if (selected) {
            selected.innerHTML = `<i class="fas fa-user-check"></i> ${escapeHtml(name)} - ${escapeHtml(student.email || '')}`;
            selected.style.display = 'block';
        }
        if (suggestions) suggestions.classList.remove('active');
    }

    async function handleStudentSearch(event) {
        clearTimeout(state.timer);
        const term = String(event.target.value || '').trim();
        const suggestions = document.getElementById('examRequestSuggestions');
        if (!suggestions) return;
        state.selectedStudent = null;
        document.getElementById('examRequestStudentEmail').value = '';
        document.getElementById('examRequestStudentName').value = '';
        document.getElementById('examRequestSelected').style.display = 'none';
        if (term.length < 2) {
            suggestions.classList.remove('active');
            return;
        }
        state.timer = setTimeout(async () => {
            try {
                const response = await fetch(`/.netlify/functions/search-students?q=${encodeURIComponent(term)}`, {
                    headers: { Authorization: `Bearer ${token()}` },
                    cache: 'no-store'
                });
                const payload = await response.json().catch(() => ({ ok: false }));
                if (!response.ok || !payload.ok) throw new Error(payload.error || 'SEARCH_FAILED');
                const students = payload.students || [];
                suggestions.innerHTML = students.length
                    ? students.map((student) => {
                        const encoded = encodeURIComponent(JSON.stringify(student));
                        const name = student.name || `${student.prenom || ''} ${student.nom || ''}`.trim() || student.email;
                        return `
                            <button class="exam-request-suggestion" type="button" onclick="selectExamRequestStudent('${encoded}')">
                                <strong>${escapeHtml(name)}</strong>
                                <span>${escapeHtml(student.email || '')}${student.telephone ? ` - ${escapeHtml(student.telephone)}` : ''}</span>
                            </button>
                        `;
                    }).join('')
                    : '<div class="exam-request-suggestion">Aucun élève trouvé</div>';
                suggestions.classList.add('active');
            } catch (error) {
                console.error('exam request search:', error);
                suggestions.innerHTML = '<div class="exam-request-suggestion">Recherche indisponible</div>';
                suggestions.classList.add('active');
            }
        }, 220);
    }

    window.selectExamRequestStudent = function selectExamRequestStudent(encoded) {
        try {
            setSelectedStudent(JSON.parse(decodeURIComponent(encoded)));
        } catch (error) {
            console.error('selectExamRequestStudent:', error);
        }
    };

    window.openExamRequestModal = function openExamRequestModal() {
        const modal = ensureModal();
        state.selectedStudent = null;
        modal.querySelector('#examRequestForm')?.reset();
        modal.querySelector('#examRequestStudentEmail').value = '';
        modal.querySelector('#examRequestStudentName').value = '';
        modal.querySelector('#examRequestSelected').style.display = 'none';
        modal.querySelector('#examRequestSuggestions').classList.remove('active');
        feedback('');
        modal.classList.add('active');
        setTimeout(() => modal.querySelector('#examRequestStudentSearch')?.focus(), 50);
    };

    window.closeExamRequestModal = function closeExamRequestModal() {
        document.getElementById('examRequestModal')?.classList.remove('active');
    };

    async function submitExamRequest(event) {
        event.preventDefault();
        const submitButton = event.target.querySelector('button[type="submit"]');
        const studentEmail = document.getElementById('examRequestStudentEmail')?.value || '';
        const studentName = document.getElementById('examRequestStudentName')?.value || '';
        if (!studentEmail || !studentName) {
            feedback('Sélectionne un élève dans la liste.', 'error');
            return;
        }

        try {
            submitButton.disabled = true;
            feedback('Envoi de la demande...', '');
            const response = await fetch('/.netlify/functions/exam-requests', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_email: studentEmail,
                    student_name: studentName,
                    instructor: currentInstructorName(),
                    comment: document.getElementById('examRequestComment')?.value || ''
                })
            });
            const payload = await response.json().catch(() => ({ ok: false }));
            if (!response.ok || !payload.ok) throw new Error(payload.error || 'EXAM_REQUEST_FAILED');
            feedback('Demande envoyée à l’admin.', 'success');
            if (isAdminPage()) await window.loadExamRequests?.();
            setTimeout(() => window.closeExamRequestModal(), 700);
        } catch (error) {
            console.error('submit exam request:', error);
            const message = error.message === 'EXAM_REQUESTS_TABLE_MISSING'
                ? 'La table des demandes permis manque dans Supabase.'
                : "Impossible d'envoyer la demande permis.";
            feedback(message, 'error');
        } finally {
            submitButton.disabled = false;
        }
    }

    function deadlineText(request) {
        if (request.days_left < 0) return `Délai dépassé de ${Math.abs(request.days_left)} j`;
        if (request.days_left === 0) return 'Dernier jour';
        return `J-${request.days_left}`;
    }

    function urgencyColor(request) {
        const progress = Math.max(0, Math.min(1, Number(request.urgency || 0)));
        const hue = Math.round(128 - (128 * progress));
        return `hsl(${hue} 72% 42%)`;
    }

    function formatDate(value) {
        const date = new Date(value || '');
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function ensureAdminPanel() {
        if (!isAdminPage()) return null;
        injectStyles();
        let panel = document.getElementById('examRequestPanel');
        if (panel) return panel;
        panel = document.createElement('section');
        panel.id = 'examRequestPanel';
        panel.className = 'exam-request-panel';
        panel.style.display = 'none';
        const anchor = document.querySelector('.controls') || document.getElementById('planningSection');
        if (anchor?.parentNode) {
            anchor.parentNode.insertBefore(panel, anchor);
        } else {
            document.querySelector('.main')?.appendChild(panel);
        }
        return panel;
    }

    function requestCard(request) {
        const color = urgencyColor(request);
        const progress = Math.max(0, Math.min(100, Math.round(Number(request.urgency || 0) * 100)));
        const name = request.student_name || request.student_email;
        const pack = request.pack_label || request.pack || 'Forfait non renseigné';
        const transmission = request.transmission_label || '';
        const comment = request.comment ? `<p class="exam-request-note">${escapeHtml(request.comment)}</p>` : '';
        const payload = encodeURIComponent(JSON.stringify({
            email: request.student_email,
            name,
            instructor: request.instructor,
            id: request.id
        }));
        return `
            <article class="exam-request-card" style="--urgency-color:${color}">
                <h3>${escapeHtml(name)}</h3>
                <div class="exam-request-meta">
                    <span class="exam-request-pill">${escapeHtml(request.instructor || 'Moniteur')}</span>
                    ${transmission ? `<span class="exam-request-pill">${escapeHtml(transmission)}</span>` : ''}
                    <span class="exam-request-pill">${escapeHtml(pack)}</span>
                    <span class="exam-request-pill exam-request-deadline">${escapeHtml(deadlineText(request))}</span>
                </div>
                <div class="exam-request-bar" aria-label="Urgence délai">
                    <span class="exam-request-cursor" style="left:${progress}%"></span>
                </div>
                <p class="exam-request-note">
                    ${escapeHtml(request.student_phone || 'Téléphone non renseigné')} -
                    demande reçue le ${escapeHtml(formatDate(request.created_at))},
                    date limite le ${escapeHtml(formatDate(request.deadline_at))}.
                </p>
                ${comment}
                <div class="exam-request-card-actions">
                    <button class="exam-request-schedule" type="button" onclick="scheduleExamFromRequest('${payload}')">
                        <i class="fas fa-calendar-check"></i> Fixer une date
                    </button>
                    <button class="exam-request-dismiss" type="button" onclick="dismissExamRequest('${escapeHtml(request.id)}')">
                        <i class="fas fa-check"></i> Traité
                    </button>
                </div>
            </article>
        `;
    }

    function renderAdminPanel(requests) {
        const panel = ensureAdminPanel();
        if (!panel) return;
        if (!requests.length) {
            panel.style.display = 'none';
            panel.innerHTML = '';
            return;
        }
        panel.style.display = 'block';
        panel.innerHTML = `
            <div class="exam-request-panel-header">
                <h2><i class="fas fa-flag-checkered" style="color:#ec4899;"></i> Demandes permis à planifier <span class="exam-request-count">${requests.length}</span></h2>
                <button class="btn-exam-request" type="button" onclick="openExamRequestModal()"><i class="fas fa-plus"></i> Nouvelle demande permis</button>
            </div>
            <div class="exam-request-list">${requests.map(requestCard).join('')}</div>
        `;
    }

    window.loadExamRequests = async function loadExamRequests() {
        if (!isAdminPage() || state.loading) return;
        state.loading = true;
        try {
            const response = await fetch('/.netlify/functions/exam-requests', {
                headers: { Authorization: `Bearer ${token()}` },
                cache: 'no-store'
            });
            const payload = await response.json().catch(() => ({ ok: false }));
            if (!response.ok || !payload.ok) throw new Error(payload.error || 'EXAM_REQUESTS_LOAD_FAILED');
            renderAdminPanel(payload.requests || []);
        } catch (error) {
            console.error('load exam requests:', error);
            if (error.message === 'EXAM_REQUESTS_TABLE_MISSING') {
                const panel = ensureAdminPanel();
                if (panel) {
                    panel.style.display = 'block';
                    panel.innerHTML = `
                        <div class="exam-request-panel-header">
                            <h2><i class="fas fa-flag-checkered" style="color:#ec4899;"></i> Demandes permis</h2>
                        </div>
                        <div style="padding:14px;color:#86868b;">La table Supabase des demandes permis doit être installée.</div>
                    `;
                }
            }
        } finally {
            state.loading = false;
        }
    };

    window.scheduleExamFromRequest = function scheduleExamFromRequest(encoded) {
        try {
            const request = JSON.parse(decodeURIComponent(encoded));
            if (typeof window.openExamDateModal === 'function') {
                window.openExamDateModal();
                window.currentExamRequestId = request.id || '';
                if (typeof window.selectExamDateStudent === 'function') {
                    window.selectExamDateStudent(encodeURIComponent(request.email), encodeURIComponent(request.name));
                }
                const instructorSelect = document.getElementById('examDateInstructor');
                if (instructorSelect && request.instructor) instructorSelect.value = request.instructor;
            }
        } catch (error) {
            console.error('scheduleExamFromRequest:', error);
        }
    };

    window.dismissExamRequest = async function dismissExamRequest(id) {
        if (!id) return;
        try {
            const response = await fetch('/.netlify/functions/exam-requests', {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, status: 'dismissed' })
            });
            const payload = await response.json().catch(() => ({ ok: false }));
            if (!response.ok || !payload.ok) throw new Error(payload.error || 'EXAM_REQUEST_UPDATE_FAILED');
            await window.loadExamRequests?.();
        } catch (error) {
            console.error('dismissExamRequest:', error);
            alert("Impossible de marquer cette demande comme traitée.");
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        injectStyles();
        if (isAdminPage()) {
            ensureAdminPanel();
            setTimeout(() => window.loadExamRequests?.(), 700);
            setInterval(() => window.loadExamRequests?.(), 15000);
        }
        if (isInstructorPage()) {
            ensureModal();
        }
    });
})();
