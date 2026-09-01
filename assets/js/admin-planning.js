console.log('ADMIN-PLANNING.JS V80 CHARGE - DELEGATION ACTIVE');

function startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function toInputDate(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatHeaderDate(dateObj) {
    return dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
}

function formatWeekLabel(start, end) {
    const s = start.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    const e = end.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${s} - ${e}`;
}

const INSTRUCTOR_NAME_ALIASES = new Map([
    ['mylene', 'Mylène'],
    ['mylène', 'Mylène'],
    ['myl?ne', 'Mylène'],
    ['myl?f?ne', 'Mylène'],
    ['sammy', 'Sammy'],
    ['nail', 'Nail'],
    ['daho', 'Daho']
]);

function normalizeInstructorKey(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function normalizeInstructor(value) {
    const raw = String(value || '').trim();
    const key = normalizeInstructorKey(raw);
    return INSTRUCTOR_NAME_ALIASES.get(key) || raw || 'Mylène';
}

function buildSlotId(dateStr, startTime) {
    return `${dateStr}|${startTime}`;
}

// Variable d'état globale pour le planning
const LEGACY_INSTRUCTOR_KEYS = new Set(['mylene', 'mylène', 'myl?ne', 'sammy', 'nail', 'daho']);

function isLegacyInstructorName(value) {
    return LEGACY_INSTRUCTOR_KEYS.has(normalizeInstructorKey(value));
}

function isCourseBasedPack(value) {
    const id = String(value || '').toLowerCase().trim();
    return id.startsWith('tarif-');
}

function addMinutesToTime(start, minutes) {
    const [h, m] = String(start || '00:00').split(':').map(Number);
    const total = (h * 60) + (m || 0) + minutes;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function buildTimeRows(start = '07:00', end = '19:00', stepMinutes = 120) {
    const rows = [];
    let current = start;
    while (current < end) {
        rows.push(current);
        current = addMinutesToTime(current, stepMinutes);
    }
    return rows;
}

function slotStartCodeStart(value) {
    return String(value || '').split('|')[0];
}

function slotStartCodeEnd(value) {
    const parts = String(value || '').split('|');
    return parts[1] || '';
}

function timeToMinutes(value) {
    const cleanValue = slotStartCodeStart(value);
    const [hours, minutes] = String(cleanValue || '00:00').split(':').map(Number);
    return ((hours || 0) * 60) + (minutes || 0);
}

function isCourseBasedStudent(student) {
    if (Number(student?.lesson_unit_minutes || 0) === 45) return true;
    return isCourseBasedPack(student?.forfait || student?.pack || student?.pack_id);
}

function isCourseBasedInstructor(instructor) {
    return !isLegacyInstructorName(instructor);
}

function isWeekdayDateStr(dateStr) {
    if (!dateStr) return false;
    const date = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    const day = date.getDay();
    return day >= 1 && day <= 5;
}

function isNailNewPackSlot(slotInfo) {
    const instructor = normalizeInstructor(slotInfo?.instructor || '');
    const start = slotStartCodeStart(slotInfo?.start || '');
    const end = String(slotInfo?.end || '');
    return instructor === 'Nail'
        && isWeekdayDateStr(slotInfo?.dateStr)
        && ((start === '15:00' && end === '15:45') || (start === '15:45' && end === '16:30'));
}

function lessonUnitsForDuration(student, hours) {
    const unitHours = isCourseBasedStudent(student) ? 0.75 : 1;
    return Math.max(0, Math.round((Number(hours) || 0) / unitHours));
}

function formatStudentBalance(student, value) {
    const numeric = Math.max(0, Number(value) || 0);
    if (isCourseBasedStudent(student)) return `${Math.round(numeric)} cours`;
    return `${Number.isInteger(numeric) ? numeric : numeric.toFixed(1).replace('.', ',')}h`;
}

function studentUnitLabel(student, plural = true) {
    if (isCourseBasedStudent(student)) return 'cours';
    return plural ? 'heures' : 'heure';
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const PERMIS_NOTES_PREFIX = 'PERMIS_JSON::';

function parsePermisNotes(notes) {
    const raw = String(notes || '').trim();
    if (raw.startsWith(PERMIS_NOTES_PREFIX)) {
        try {
            const data = JSON.parse(raw.slice(PERMIS_NOTES_PREFIX.length));
            const candidates = Array.isArray(data.candidates) ? data.candidates.map((candidate) => ({
                name: String(candidate.name || '').trim(),
                phone: String(candidate.phone || '').trim(),
                email: String(candidate.email || '').trim(),
                transmission: String(candidate.transmission || '').trim()
            })).filter((candidate) => candidate.name || candidate.email) : [];
            return {
                location: String(data.location || '').trim(),
                examDate: String(data.examDate || '').trim(),
                candidates
            };
        } catch (error) {
            console.warn('Notes permis illisibles:', error);
        }
    }

    const parts = raw.split('|').map((part) => part.trim()).filter(Boolean);
    const location = (parts[0] || '').replace(/^PERMIS\s*-\s*/i, '').trim();
    const candidate = { name: '', phone: '', email: '', transmission: '' };
    const candidates = [];

    parts.slice(1).forEach((part) => {
        if (/^Candidats?\s*:/i.test(part)) {
            part.replace(/^Candidats?\s*:\s*/i, '').split(',').map((name) => name.trim()).filter(Boolean).forEach((name) => {
                candidates.push({ name, phone: '', email: '', transmission: '' });
            });
        } else if (/^Eleve\s*:/i.test(part)) {
            candidate.name = part.replace(/^Eleve\s*:\s*/i, '').trim();
        } else if (/^Tel(?:ephone)?\s*:/i.test(part)) {
            candidate.phone = part.replace(/^Tel(?:ephone)?\s*:\s*/i, '').trim();
        } else if (/^Transmission\s*:/i.test(part)) {
            candidate.transmission = part.replace(/^Transmission\s*:\s*/i, '').trim();
        }
    });

    if (candidate.name || candidate.phone || candidate.transmission) candidates.unshift(candidate);
    return { location, examDate: '', candidates };
}

function renderPermisLabel(notes) {
    const { location, candidates } = parsePermisNotes(notes);
    const names = candidates.map((candidate) => candidate.name).filter(Boolean);
    const transmissions = [...new Set(candidates.map((candidate) => candidate.transmission).filter(Boolean))];
    const mainName = names.length > 1 ? `${names[0]} +${names.length - 1}` : (names[0] || 'Eleve');
    const transmissionText = transmissions.length ? transmissions.join('/') : '';
    return `
        <span style="display:block;font-size:0.78rem;font-weight:800;line-height:1.05;">PERMIS</span>
        ${location ? `<span style="display:block;font-size:0.72rem;font-weight:800;line-height:1.1;">${escapeHtml(location)}</span>` : ''}
        <span style="display:block;font-size:0.7rem;font-weight:700;line-height:1.15;margin-top:3px;">${escapeHtml(mainName)}${transmissionText ? ` · ${escapeHtml(transmissionText)}` : ''}</span>
    `;
}

window.showPermisDetails = function(encodedSlot) {
    let slot = {};
    try {
        slot = JSON.parse(decodeURIComponent(encodedSlot || ''));
    } catch (error) {
        console.error('Details permis invalides:', error);
        return;
    }

    const details = parsePermisNotes(slot.notes);
    const candidates = details.candidates.length ? details.candidates : [{ name: 'Eleve', phone: '', email: '', transmission: '' }];
    const existing = document.getElementById('permisDetailsModal');
    if (existing) existing.remove();

    const candidateRows = candidates.map((candidate) => `
        <div style="padding:12px 0;border-top:1px solid #f0f0f0;">
            <div style="font-weight:800;color:#1d1d1f;font-size:0.98rem;">${escapeHtml(candidate.name || 'Eleve')}</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:7px;color:#60646c;font-size:0.86rem;">
                ${candidate.transmission ? `<span style="background:#f5f5f7;border-radius:999px;padding:5px 9px;font-weight:700;">${escapeHtml(candidate.transmission)}</span>` : ''}
                ${candidate.phone ? `<a href="tel:${escapeHtml(candidate.phone)}" style="color:#ec4899;text-decoration:none;font-weight:700;">${escapeHtml(candidate.phone)}</a>` : ''}
                ${candidate.email ? `<a href="mailto:${escapeHtml(candidate.email)}" style="color:#60646c;text-decoration:none;">${escapeHtml(candidate.email)}</a>` : ''}
            </div>
        </div>
    `).join('');

    const modal = document.createElement('div');
    modal.id = 'permisDetailsModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.42);padding:20px;';
    modal.onclick = (event) => { if (event.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div style="width:min(520px,94vw);max-height:88vh;overflow:auto;background:white;border-radius:18px;box-shadow:0 24px 80px rgba(0,0,0,0.22);">
            <div style="padding:20px 22px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;gap:16px;align-items:start;">
                <div>
                    <div style="font-size:0.78rem;text-transform:uppercase;letter-spacing:0.04em;color:#86868b;font-weight:800;">Creneau permis</div>
                    <h3 style="margin:4px 0 0;font-size:1.25rem;color:#1d1d1f;">${escapeHtml(details.location || 'Lieu non precise')}</h3>
                    <div style="margin-top:6px;color:#60646c;font-weight:650;">${escapeHtml(slot.instructor || '')} · ${escapeHtml(slot.date || '')} · ${escapeHtml(slot.start || '')} - ${escapeHtml(slot.end || '')}</div>
                </div>
                <button type="button" onclick="var modal=document.getElementById('permisDetailsModal'); if(modal) modal.remove();" style="width:34px;height:34px;border-radius:50%;border:0;background:#f5f5f7;color:#60646c;cursor:pointer;"><i class="fas fa-times"></i></button>
            </div>
            <div style="padding:8px 22px 22px;">
                ${candidateRows}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

function studentPlanningMode(student) {
    return isCourseBasedStudent(student)
        ? {
            key: 'course',
            label: 'COURS 45 MIN',
            shortLabel: '45 min',
            description: 'A placer uniquement avec les nouveaux moniteurs',
            color: '#047857',
            bg: '#d1fae5',
            border: '#10b981',
            icon: 'fa-stopwatch'
        }
        : {
            key: 'hour',
            label: 'HEURES 2H',
            shortLabel: '2h',
            description: 'A placer uniquement avec les moniteurs historiques',
            color: '#92400e',
            bg: '#fef3c7',
            border: '#f59e0b',
            icon: 'fa-clock'
        };
}

function studentPlanningModeBadge(student, compact = false) {
    const mode = studentPlanningMode(student);
    const padding = compact ? '0.14rem 0.45rem' : '0.28rem 0.6rem';
    const fontSize = compact ? '0.68rem' : '0.75rem';
    return `<span title="${escapeHtml(mode.description)}" style="display:inline-flex;align-items:center;gap:0.3rem;padding:${padding};background:${mode.bg};color:${mode.color};border:1px solid ${mode.border};border-radius:999px;font-size:${fontSize};font-weight:800;letter-spacing:0;text-transform:uppercase;white-space:nowrap;"><i class="fas ${mode.icon}"></i>${mode.label}</span>`;
}

function isStudentCompatibleWithInstructor(student, instructor, slotInfo = null) {
    if (isNailNewPackSlot(slotInfo)) return isCourseBasedStudent(student);
    return isCourseBasedStudent(student) === isCourseBasedInstructor(instructor);
}

function planningModeWarning(student, instructor) {
    if (isCourseBasedStudent(student)) {
        return `${student.prenom || 'Cet élève'} est en pack COURS 45 MIN. Normalement, il doit être placé avec un nouveau moniteur qui a des créneaux de 45 minutes.`;
    }
    return `${student.prenom || 'Cet élève'} est en ancien pack HEURES 2H. Normalement, il doit être placé avec un moniteur historique et des créneaux de 2h.`;
}
let state = {
    weekStart: startOfWeek(new Date()),
    instructor: 'Nail',
    instructors: [] // Liste des moniteurs chargés depuis Supabase
};

// Charger les moniteurs depuis Supabase
async function loadInstructors() {
    console.log('?Y"" loadInstructors() appel?');
    try {
        console.log('?Y"? Requ?te serveur pour charger les moniteurs...');
        const payload = await fetchAdminPlanningData({ type: 'instructors' });
        const data = payload.instructors || [];

        console.log('?Y"? Donn?es brutes re?ues de Supabase:', data);

        // Ajouter les moniteurs de la BDD à la liste
        state.instructors = data.map(inst => ({
            name: `${inst.prenom} ${inst.nom}`,
            prenom: inst.prenom,
            id: inst.id,
            email: inst.email
        }));

        console.log('Moniteurs chargés et mappés:', state.instructors);

        // Mettre à jour l'interface
        updateInstructorButtons();
        updateInstructorSelects();
    } catch (err) {
        console.error('Exception chargement moniteurs:', err);
    }
}

// Ajouter les boutons des nouveaux moniteurs SANS toucher aux boutons existants
function updateInstructorButtons() {
    const segment = document.getElementById('instructorSegment');
    if (!segment) return;

    state.instructors.forEach(inst => {
        // Vérifier si un bouton existe déjà pour ce moniteur
        const existing = segment.querySelector(`button[data-instructor="${inst.prenom}"]`);
        if (existing) return;

        // Créer et ajouter le bouton du nouveau moniteur.
        // Pas de listener individuel : la délégation d'événement sur
        // #instructorSegment (voir IIFE) gère tous les clics.
        const btn = document.createElement('button');
        btn.dataset.instructor = inst.prenom;
        btn.textContent = inst.prenom;
        segment.appendChild(btn);
        console.log('?z. Bouton moniteur ajouté:', inst.prenom);
    });
}

// Mettre à jour les selects de moniteurs dans les modals
function updateInstructorSelects() {
    const selects = ['permisInstructor', 'indisponibleInstructor', 'congesInstructor'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;

        // Garder l'option vide
        const emptyOption = select.querySelector('option[value=""]');
        
        // Reconstruire les options
        select.innerHTML = emptyOption ? emptyOption.outerHTML : '<option value="">Sélectionner un moniteur</option>';

        // Ajouter les anciens moniteurs
        ['Mylène', 'Sammy', 'Nail', 'Daho'].forEach(name => {
            select.innerHTML += `<option value="${name}">${name}</option>`;
        });

        // Ajouter les nouveaux moniteurs
        state.instructors.forEach(inst => {
            if (!['Mylène', 'Sammy', 'Nail', 'Daho'].includes(inst.prenom)) {
                select.innerHTML += `<option value="${inst.prenom}">${inst.name}</option>`;
            }
        });
    });
}

function getTimeRows(instructor) {
    if (!isLegacyInstructorName(instructor)) {
        return buildTimeRows('07:00', '19:00', 45);
    }

    if (instructor === 'Sammy') {
        return ['07:00', '09:00', '11:00'];
    }
    if (instructor === 'Daho') {
        // Daho: Lundi 15h-17h, Mardi-Vendredi 17h-19h, Samedi 7h-13h
        return ['07:00', '09:00', '11:00', '15:00', '17:00'];
    }
    if (instructor === 'Nail') {
        return ['07:00', '09:00', '11:00', '13:00', '15:00|15:45', '15:45|16:30', '17:00'];
    }
    // Anciens moniteurs: créneaux historiques de 2h.
    return ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00'];
}

function getEndForStart(instructor, start, dateStr = '') {
    const encodedEnd = slotStartCodeEnd(start);
    if (encodedEnd) return encodedEnd;
    start = slotStartCodeStart(start);

    if (!isLegacyInstructorName(instructor)) {
        return addMinutesToTime(start, 45);
    }

    if (instructor === 'Sammy') {
        if (start === '07:00') return '09:00';
        if (start === '09:00') return '11:00';
        if (start === '11:00') return '13:00';
    }
    if (instructor === 'Daho') {
        // Daho: créneaux de 2h
        if (start === '07:00') return '09:00';
        if (start === '09:00') return '11:00';
        if (start === '11:00') return '13:00';
        if (start === '15:00') return '17:00';
        if (start === '17:00') return '19:00';
    }
    if (instructor === 'Nail') {
        if (start === '15:45') return '16:30';
        if (start === '15:00' && isWeekdayDateStr(dateStr)) return '15:45';
    }
    // Pour tous les autres moniteurs historiques: créneaux de 2h
    if (start === '07:00') return '09:00';
    if (start === '09:00') return '11:00';
    if (start === '11:00') return '13:00';
    if (start === '13:00') return '15:00';
    if (start === '15:00') return '17:00';
    if (start === '17:00') return '19:00';
    return '';
}

window.getTimeRows = getTimeRows;
window.getEndForStart = getEndForStart;

function setFeedback(el, text, type) {
    if (!el) return;
    el.textContent = text || '';
    el.className = `feedback${type ? ` ${type}` : ''}`;
}

function requireAdmin() {
    const user = window.authenticatedUser;
    if (!user || user.role !== 'admin') return { ok: false, error: new Error('NOT_AUTHORIZED') };
    return { ok: true, email: user.email };
}

function logout() {
    if (window.authSession?.logout) {
        window.authSession.logout();
    }
    localStorage.removeItem('ae_user');
    localStorage.removeItem('ae_access_token');
    sessionStorage.removeItem('ae_user');
    sessionStorage.removeItem('ae_access_token');
    window.location.href = 'index.html';
}

function getAdminAuthHeaders() {
    const token = window.authSession?.getToken?.();
    if (!token) throw new Error('AUTH_REQUIRED');
    return { Authorization: `Bearer ${token}` };
}

async function fetchAdminPlanningData(params) {
    const query = new URLSearchParams(params);
    const response = await fetch(`/.netlify/functions/admin-planning-data?${query.toString()}`, {
        method: 'GET',
        headers: getAdminAuthHeaders(),
        cache: 'no-store'
    });
    const payload = await response.json().catch(() => ({ ok: false, error: 'INVALID_SERVER_RESPONSE' }));
    if (!response.ok || !payload.ok) {
        const error = new Error(payload.error || 'ADMIN_PLANNING_DATA_FAILED');
        error.status = response.status;
        throw error;
    }
    return payload;
}

function setQuickStatValue(id, value) {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = String(Math.max(0, Number(value) || 0));
}

async function loadAdminQuickStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = addDays(todayStart, 1);
    const weekStart = startOfWeek(todayStart);
    const weekEnd = addDays(weekStart, 7);

    const payload = await fetchAdminPlanningData({
        type: 'global-stats',
        todayStart: todayStart.toISOString(),
        todayEnd: todayEnd.toISOString(),
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString()
    });

    const stats = payload.stats || {};
    setQuickStatValue('statActive', stats.activeStudents);
}

async function postAdminAction(functionName, body) {
    const response = await fetch(`/.netlify/functions/${functionName}`, {
        method: 'POST',
        headers: {
            ...getAdminAuthHeaders(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body || {}),
        cache: 'no-store'
    });
    const payload = await response.json().catch(() => ({ ok: false, error: 'INVALID_SERVER_RESPONSE' }));
    if (!response.ok || !payload.ok) {
        const error = new Error(payload.error || `${functionName.toUpperCase()}_FAILED`);
        error.status = response.status;
        error.payload = payload;
        throw error;
    }
    return payload;
}

const PLANNING_VEHICLES = Object.freeze([
    { id: 'c3-1', name: 'C3 N°1 EW-426-SR', label: 'BM', transmission: 'manual', owner: 'Elodie' },
    { id: 'c3-2', name: 'C3 N°2 permis', label: 'BM', transmission: 'manual', owner: 'Eric' },
    { id: 'c4', name: 'C4', label: 'BA', transmission: 'auto', owner: 'Elodie / Eric' }
]);

function isAutoStudent(student) {
    const value = [
        student?.transmission_type,
        student?.forfait,
        student?.pack
    ].filter(Boolean).join(' ').toLowerCase();
    return value.includes('auto') || value.includes('ba');
}

function defaultVehicleForInstructor(instructor, student) {
    if (isAutoStudent(student)) return PLANNING_VEHICLES.find((vehicle) => vehicle.id === 'c4');
    const key = normalizeInstructor(instructor).toLowerCase();
    if (key === 'elodie' || key === 'élodie') return PLANNING_VEHICLES.find((vehicle) => vehicle.id === 'c3-1');
    if (key === 'eric' || key === 'éric') return PLANNING_VEHICLES.find((vehicle) => vehicle.id === 'c3-2');
    return null;
}

function vehicleFromNotes(notes) {
    const value = String(notes || '').toLowerCase();
    if (value.includes('vehicle:c3-1') || value.includes('ew-426-sr') || value.includes('ew 426 sr') || value.includes('c3 n°1') || value.includes('c3 n 1')) return PLANNING_VEHICLES[0];
    if (value.includes('vehicle:c3-2') || value.includes('c3 n°2') || value.includes('c3 n 2') || value.includes('c3 2') || (value.includes('c3') && value.includes('permis'))) return PLANNING_VEHICLES[1];
    if (value.includes('vehicle:c4') || value.includes('c4')) return PLANNING_VEHICLES[2];
    return null;
}

function showAdminChoiceDialog({ title, message = '', options = [], multiline = false, placeholder = '', required = false }) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:20000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.48);padding:20px;';
        const field = options.length
            ? `<select data-dialog-field style="width:100%;padding:12px;border:1px solid #d1d5db;border-radius:8px;font:inherit;background:white;">${options.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join('')}</select>`
            : multiline
                ? `<textarea data-dialog-field rows="4" placeholder="${escapeHtml(placeholder)}" style="width:100%;padding:12px;border:1px solid #d1d5db;border-radius:8px;font:inherit;resize:vertical;"></textarea>`
                : `<input data-dialog-field type="text" placeholder="${escapeHtml(placeholder)}" style="width:100%;padding:12px;border:1px solid #d1d5db;border-radius:8px;font:inherit;">`;
        overlay.innerHTML = `
            <div role="dialog" aria-modal="true" aria-labelledby="adminChoiceTitle" style="width:min(460px,100%);background:white;border-radius:8px;box-shadow:0 24px 70px rgba(0,0,0,.25);padding:22px;">
                <h3 id="adminChoiceTitle" style="margin:0 0 8px;font-size:1.15rem;">${escapeHtml(title)}</h3>
                ${message ? `<p style="margin:0 0 16px;color:#60646c;line-height:1.45;">${escapeHtml(message)}</p>` : ''}
                ${field}
                <p data-dialog-error style="display:none;color:#b42318;margin:8px 0 0;font-size:.88rem;">Ce champ est obligatoire.</p>
                <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px;">
                    <button type="button" data-dialog-cancel style="padding:10px 16px;border:1px solid #d1d5db;border-radius:8px;background:white;cursor:pointer;">Annuler</button>
                    <button type="button" data-dialog-submit style="padding:10px 16px;border:0;border-radius:8px;background:#0071e3;color:white;font-weight:600;cursor:pointer;">Valider</button>
                </div>
            </div>`;
        const fieldElement = overlay.querySelector('[data-dialog-field]');
        const finish = (value) => {
            document.removeEventListener('keydown', onKeydown);
            overlay.remove();
            resolve(value);
        };
        const submit = () => {
            const value = String(fieldElement?.value || '').trim();
            if (required && !value) {
                overlay.querySelector('[data-dialog-error]').style.display = 'block';
                fieldElement?.focus();
                return;
            }
            finish(value);
        };
        const onKeydown = (event) => {
            if (event.key === 'Escape') finish(null);
            if (event.key === 'Enter' && !multiline) submit();
        };
        overlay.querySelector('[data-dialog-cancel]').addEventListener('click', () => finish(null));
        overlay.querySelector('[data-dialog-submit]').addEventListener('click', submit);
        overlay.addEventListener('click', (event) => { if (event.target === overlay) finish(null); });
        document.addEventListener('keydown', onKeydown);
        document.body.appendChild(overlay);
        fieldElement?.focus();
    });
}

async function resolveVehicleForBooking(student, slotInfo) {
    const automatic = defaultVehicleForInstructor(slotInfo.instructor, student);
    if (automatic) return automatic;

    const manualVehicles = PLANNING_VEHICLES.filter((vehicle) => vehicle.transmission === 'manual');
    const choice = await showAdminChoiceDialog({
        title: 'Choisir le vehicule',
        message: 'Quel vehicule boite manuelle sera utilise pour cette seance ?',
        options: manualVehicles.map((vehicle) => ({ value: vehicle.id, label: `${vehicle.name} (${vehicle.owner})` })),
        required: true
    });
    return manualVehicles.find((vehicle) => vehicle.id === choice) || null;
}

const studentSearchCache = {
    students: [],
    loadedAt: 0,
    loading: null
};

const adminBookingLocks = new Set();

function normalizeAdminSearchText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function buildStudentSearchText(student) {
    return normalizeAdminSearchText([
        student?.prenom,
        student?.nom,
        student?.email,
        student?.telephone,
        student?.user_name
    ].join(' '));
}

async function loadStudentSearchIndex(force = false) {
    const cacheAge = Date.now() - studentSearchCache.loadedAt;
    if (!force && studentSearchCache.students.length && cacheAge < 5 * 60 * 1000) {
        return studentSearchCache.students;
    }
    if (studentSearchCache.loading) return studentSearchCache.loading;

    studentSearchCache.loading = fetchAdminPlanningData({ type: 'student-index' })
        .then((payload) => {
            studentSearchCache.students = (payload.students || []).map((student) => ({
                ...student,
                _searchText: buildStudentSearchText(student)
            }));
            studentSearchCache.loadedAt = Date.now();
            return studentSearchCache.students;
        })
        .finally(() => {
            studentSearchCache.loading = null;
        });

    return studentSearchCache.loading;
}

async function getMatchingStudents(searchTerm, limit = 30) {
    const q = normalizeAdminSearchText(searchTerm);
    if (q.length < 2) return [];
    const students = await loadStudentSearchIndex();
    return students
        .filter((student) => student._searchText?.includes(q))
        .slice(0, limit);
}

function warmStudentSearchIndexWhenReady(attempt = 0) {
    if (window.authSession?.getToken?.()) {
        loadStudentSearchIndex().catch((error) => console.warn('Prechargement recherche eleves impossible:', error));
        return;
    }
    if (attempt < 50) {
        setTimeout(() => warmStudentSearchIndexWhenReady(attempt + 1), 100);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    warmStudentSearchIndexWhenReady();
});

async function fetchBookedSlots(instructor, weekStart, weekEnd) {
    const normalizedInstructor = normalizeInstructor(instructor);
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    end.setHours(23, 59, 59, 999);

    console.log('?Y"? Fetching booked slots for:', normalizedInstructor, 'from', start.toISOString(), 'to', end.toISOString());

    const { data, error } = await window.supabaseClient
        .from('slots')
        .select('id, start_at, end_at, status, instructor, notes, reservations(first_name,last_name,phone,email)')
        .eq('instructor', normalizedInstructor)
        .gte('start_at', start.toISOString())
        .lte('start_at', end.toISOString())
        .order('start_at', { ascending: true });

    if (error) throw error;
    
    console.log('?Y"S Slots r?cup?r?s:', data?.length || 0);
    data?.forEach((slot, i) => {
        console.log(`Slot ${i+1}:`, slot.id, slot.start_at, 'Reservations:', slot.reservations);
    });
    
    // Toujours chercher les réservations manuellement pour ?viter les probl?mes de relation
    console.log('?Y"? Recherche manuelle des réservations pour tous les slots...');
    const slotIds = (data || []).map(s => s.id);
    
    if (slotIds.length > 0) {
        const { data: manualReservations, error: resError } = await window.supabaseClient
            .from('reservations')
            .select('slot_id, first_name, last_name, phone, email')
            .in('slot_id', slotIds);
        
        if (resError) {
            console.error('?O Erreur récupération réservations:', resError);
        } else {
            console.log('?Y"< Réservations trouv?es manuellement:', manualReservations?.length || 0);
            manualReservations?.forEach(r => {
                console.log('  -', r.first_name, r.last_name, 'pour slot', r.slot_id);
            });
            
            // Associer les réservations aux slots et corriger les slots orphelins
            const orphanSlots = [];
            if (manualReservations && manualReservations.length > 0) {
                data.forEach(slot => {
                    const reservation = manualReservations.find(r => r.slot_id === slot.id);
                    if (reservation) {
                        slot.reservations = [reservation];
                        console.log('?o. Réservation associ?e au slot', slot.id, ':', reservation.first_name, reservation.last_name);
                    } else if (slot.status === 'booked') {
                        console.warn('?s?? Slot orphelin d?tect? (marqu? "booked" sans réservation):', slot.id);
                        orphanSlots.push(slot.id);
                        // Corriger localement le statut pour l'affichage
                        slot.status = 'available';
                    }
                });
            } else {
                // Aucune réservation trouv?e, tous les slots 'booked' sont orphelins
                data.forEach(slot => {
                    if (slot.status === 'booked') {
                        console.warn('?s?? Slot orphelin d?tect? (marqu? "booked" sans réservation):', slot.id);
                        orphanSlots.push(slot.id);
                        slot.status = 'available';
                    }
                });
            }
            
            // Auto-correction en base de données des slots orphelins
            if (orphanSlots.length > 0) {
                console.log('?Y"? Auto-correction de', orphanSlots.length, 'slot(s) orphelin(s)...');
                const { error: updateError } = await window.supabaseClient
                    .from('slots')
                    .update({ status: 'available' })
                    .in('id', orphanSlots);
                
                if (updateError) {
                    console.error('?O Erreur lors de la correction des slots orphelins:', updateError);
                } else {
                    console.log('?o. Slots orphelins corrig?s automatiquement');
                }
            }
        }
    }

    // Récupérer les emails des élèves pour obtenir leur pack et transmission_type
    const emails = (data || []).map(row => {
        const res = Array.isArray(row.reservations) ? row.reservations[0] : row.reservations;
        return res?.email;
    }).filter(Boolean);

    let packMap = new Map();
    let transmissionMap = new Map();
    let forfaitMap = new Map();
    let hoursCompletedMap = new Map();
    let hoursGoalMap = new Map();
    let lessonUnitMap = new Map();
    let phoneMap = new Map();
    let nameMap = new Map(); // Map pour stocker les noms (prenom + nom) par email
    
    if (emails.length > 0) {
        const { data: inscriptions } = await window.supabaseClient
            .from('inscription_notifications')
            .select('user_email, pack, transmission_type, created_at')
            .in('user_email', [...new Set(emails)])
            .order('created_at', { ascending: false });
        
        // Prendre la plus r?cente inscription pour chaque email
        (inscriptions || []).forEach(ins => {
            if (!packMap.has(ins.user_email)) {
                packMap.set(ins.user_email, ins.pack);
                transmissionMap.set(ins.user_email, ins.transmission_type);
            }
        });
        
        // Récupérer forfait, heures, téléphone et nom depuis users
        let { data: users, error: usersError } = await window.supabaseClient
            .from('users')
            .select('email, forfait, hours_goal, telephone, transmission_type, nom, prenom, lesson_unit_minutes')
            .in('email', [...new Set(emails)]);
        if (usersError && String(usersError.message || '').includes('lesson_unit_minutes')) {
            const fallback = await window.supabaseClient
                .from('users')
                .select('email, forfait, hours_goal, telephone, transmission_type, nom, prenom')
                .in('email', [...new Set(emails)]);
            users = fallback.data;
        }
        
        (users || []).forEach(user => {
            forfaitMap.set(user.email, user.forfait);
            hoursGoalMap.set(user.email, user.hours_goal);
            lessonUnitMap.set(user.email, user.lesson_unit_minutes || (isCourseBasedPack(user.forfait) ? 45 : 120));
            phoneMap.set(user.email, user.telephone);
            // Utiliser transmission_type de users si disponible, sinon garder celui d'inscription
            if (user.transmission_type && !transmissionMap.has(user.email)) {
                transmissionMap.set(user.email, user.transmission_type);
            }
            // Stocker le nom complet
            const fullName = user.prenom && user.nom ? `${user.prenom} ${user.nom}` : null;
            if (fullName) {
                nameMap.set(user.email, fullName);
            }
        });
        
        // Calculer les heures effectuées en comptant les réservations pass?es
        const { data: completedReservations } = await window.supabaseClient
            .from('reservations')
            .select('email, slots(start_at, end_at)')
            .in('email', [...new Set(emails)])
            .eq('status', 'done');
        
        const hoursCountMap = new Map();
        (completedReservations || []).forEach(res => {
            if (res.slots) {
                const startAt = new Date(res.slots.start_at);
                const endAt = new Date(res.slots.end_at);
                const hours = (endAt - startAt) / (1000 * 60 * 60);
                const fakeStudent = {
                    lesson_unit_minutes: lessonUnitMap.get(res.email) || (isCourseBasedPack(forfaitMap.get(res.email) || packMap.get(res.email)) ? 45 : 120),
                    forfait: forfaitMap.get(res.email),
                    pack: packMap.get(res.email)
                };
                hoursCountMap.set(res.email, (hoursCountMap.get(res.email) || 0) + lessonUnitsForDuration(fakeStudent, hours));
            }
        });
        
        hoursCountMap.forEach((hours, email) => {
            hoursCompletedMap.set(email, hours);
        });
    }

    const bookedMap = new Map();
    (data || []).forEach((row) => {
        // Inclure les slots r?serv?s, permis, indisponible OU ceux qui ont des réservations
        const hasReservation = Array.isArray(row.reservations) ? row.reservations.length > 0 : !!row.reservations;
        const isLessonSlot = ['booked', 'done', 'completed'].includes(row.status);
        const isPermis = row.status === 'permis';
        const isIndisponible = row.status === 'indisponible';
        
        // Debug: log pour voir les créneaux permis
        if (row.status === 'permis' || (row.notes && row.notes.includes('PERMIS'))) {
            console.log('?YY? Créneau PERMIS d?tect?:', {
                id: row.id,
                start_at: row.start_at,
                status: row.status,
                notes: row.notes,
                isPermis: isPermis
            });
        }
        
        if (!isLessonSlot && !hasReservation && !isPermis && !isIndisponible) return;
        
        const d = new Date(row.start_at);
        const dateStr = toInputDate(d);
        const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        const id = buildSlotId(dateStr, timeStr);

        const res = Array.isArray(row.reservations) ? row.reservations[0] : row.reservations;
        const email = res?.email || '';
        const pack = packMap.get(email) || '';
        const transmissionType = transmissionMap.get(email) || null;
        
        // Log détaillé pour d?boguer les réservations sans nom (sauf pour les créneaux permis et indisponibles)
        if (!isPermis && !isIndisponible && (!res?.first_name || !res?.last_name)) {
            console.warn('?s?? Réservation sans nom pour le slot:', {
                slotId: row.id,
                startAt: row.start_at,
                reservation: res,
                email: email
            });
        }
        
        bookedMap.set(id, {
            start_at: row.start_at,
            status: row.status,
            notes: row.notes || '',
            slot_uuid: row.id, // Stocker le vrai UUID du slot
            student: (isPermis || isIndisponible) ? null : {
                first_name: nameMap.get(email)?.split(' ')[0] || res?.first_name || email.split('@')[0] || 'Réservé',
                last_name: nameMap.get(email)?.split(' ').slice(1).join(' ') || res?.last_name || '',
                phone: phoneMap.get(email) || res?.phone || '',
                email: email,
                pack: pack,
                transmission_type: transmissionMap.get(email) || transmissionType,
                forfait: forfaitMap.get(email) || '',
                hours_completed: hoursCompletedMap.get(email) || 0,
                hours_goal: hoursGoalMap.get(email) || 0,
                lesson_unit_minutes: lessonUnitMap.get(email) || (isCourseBasedPack(forfaitMap.get(email) || pack) ? 45 : 120)
            }
        });
    });
    
    // Debug: afficher tous les créneaux permis et indisponibles dans la map
    console.log('?Y"< Créneaux dans bookedMap:', bookedMap.size);
    bookedMap.forEach((value, key) => {
        if (value.status === 'permis') {
            console.log(`  ?YY? ${key}' PERMIS (${value.notes})`);
        }
        if (value.status === 'indisponible') {
            console.log(`  ?Y"? ${key}' INDISPONIBLE (${value.notes})`);
        }
    });

    return bookedMap;
}

fetchBookedSlots = async function fetchBookedSlotsViaAdminEndpoint(instructor, weekStart, weekEnd) {
    const normalizedInstructor = normalizeInstructor(instructor);
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    end.setHours(23, 59, 59, 999);

    const payload = await fetchAdminPlanningData({
        type: 'booked-slots',
        instructor: normalizedInstructor,
        start: start.toISOString(),
        end: end.toISOString()
    });

    const bookedMap = new Map();
    (payload.items || []).forEach((item) => {
        if (!item?.start_at || !item?.booking) return;
        const d = new Date(item.start_at);
        const dateStr = toInputDate(d);
        const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        bookedMap.set(buildSlotId(dateStr, timeStr), item.booking);
    });

    return bookedMap;
};

function isToday(dateObj) {
    const now = new Date();
    return dateObj.getFullYear() === now.getFullYear() &&
           dateObj.getMonth() === now.getMonth() &&
           dateObj.getDate() === now.getDate();
}

function formatDayName(dateObj) {
    return dateObj.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
}

function formatDayNum(dateObj) {
    return dateObj.getDate();
}

function renderPlanning(grid, instructor, weekStart, bookedSet) {
    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    const times = getTimeRows(instructor);
    const now = Date.now();
    
    // Pour d?terminer si un créneau est pass?, on compare uniquement la date (pas l'heure)
    // Cela permet de placer des élèves sur tous les créneaux de la semaine affich?e
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    // Track stats
    let totalSlots = 0, bookedCount = 0, doneCount = 0, visibleTodayCount = 0, visibleWeekCount = 0;

    // Header row
    const headerRow = [
        `<div class="cal-head corner"></div>`,
        ...days.map((d) => {
            const todayClass = isToday(d) ? ' today' : '';
            return `<div class="cal-head${todayClass}">
                <div class="day-name">${formatDayName(d)}</div>
                <div class="day-num">${formatDayNum(d)}</div>
            </div>`;
        })
    ].join('');

    // Body rows
    const bodyRows = times.map((start) => {
        const timeCellStart = slotStartCodeStart(start);

        const dayCells = days.map((d) => {
            const dateStr = toInputDate(d);
            const end = getEndForStart(instructor, start, dateStr);
            if (!end) return '<div class="cal-cell"></div>';
            const bookingStart = slotStartCodeStart(start);
            const id = buildSlotId(dateStr, bookingStart);
            const booking = bookedSet instanceof Map ? bookedSet.get(id) : null;
            const isBooked = !!booking;
            const slotStart = new Date(`${dateStr}T${bookingStart}:00`).getTime();
            
            // Vérifier si c'est un créneau permis
            const isPermis = booking && booking.status === 'permis';
            const permisLabel = isPermis ? renderPermisLabel(booking.notes) : '';
            
            // Vérifier si c'est un créneau indisponible
            const isIndisponible = booking && booking.status === 'indisponible';
            let indisponibleReason = '';
            if (isIndisponible && booking.notes) {
                indisponibleReason = booking.notes.replace('INDISPONIBLE - ', '').trim();
            }
            
            // Vérifier si c'est un créneau de cong?s (d?tect? via les notes)
            const isConges = isIndisponible && booking.notes && booking.notes.includes('CONGES');
            let congesInfo = '';
            if (isConges && booking.notes) {
                congesInfo = booking.notes.replace('CONGES - ', '').trim();
            }
            
            // Logique sp?cifique pour Daho: filtrer selon les jours
            let isDahoUnavailable = false;
            if (instructor === 'Daho' && !isBooked) {
                const dayOfWeek = d.getDay(); // 0=Dimanche, 1=Lundi, ..., 6=Samedi
                
                // Lundi (1): 15h-19h disponible
                if (dayOfWeek === 1 && !['15:00', '17:00'].includes(start)) {
                    isDahoUnavailable = true;
                }
                // Mardi-Vendredi (2-5): seulement 17h-19h disponible
                else if (dayOfWeek >= 2 && dayOfWeek <= 5 && start !== '17:00') {
                    isDahoUnavailable = true;
                }
                // Samedi (6): seulement 7h-13h (7h, 9h, 11h)
                else if (dayOfWeek === 6 && !['07:00', '09:00', '11:00'].includes(start)) {
                    isDahoUnavailable = true;
                }
                // Dimanche (0): ferm?
                else if (dayOfWeek === 0) {
                    isDahoUnavailable = true;
                }
            }

            let isNailSpecialUnavailable = false;
            if (instructor === 'Nail' && !isBooked) {
                const specialSlot = isNailNewPackSlot({ instructor, dateStr, start: bookingStart, end });
                const dayOfWeek = d.getDay();
                if (slotStartCodeEnd(start) && !specialSlot) {
                    isNailSpecialUnavailable = true;
                } else if (bookingStart === '15:45' && !specialSlot) {
                    isNailSpecialUnavailable = true;
                } else if (bookingStart === '15:00' && dayOfWeek >= 1 && dayOfWeek <= 5 && !specialSlot) {
                    isNailSpecialUnavailable = true;
                }
            }
            
            // Un créneau est pass? seulement si la DATE est ant?rieure ? aujourd'hui
            // Cela permet de placer des élèves sur tous les créneaux de la semaine affich?e
            const slotDate = new Date(dateStr);
            slotDate.setHours(0, 0, 0, 0);
            const isPast = slotDate.getTime() < todayTimestamp;
            
            // Un créneau est "done" si r?serv? ET l'heure est pass?e,
            // ou si l'ancien statut en base indique deja une seance terminee.
            const isDone = isBooked && !isPermis && !isIndisponible && !isConges
                && (slotStart < now || ['done', 'completed'].includes(booking.status));

            totalSlots++;
            if (isDone) doneCount++;
            else if (isBooked && !isPermis && !isIndisponible && !isConges) bookedCount++;
            if (isBooked && !isPermis && !isIndisponible && !isConges) {
                visibleWeekCount++;
                if (isToday(d)) visibleTodayCount++;
            }

            const statusClass = isDahoUnavailable || isNailSpecialUnavailable ? 'indisponible' : isConges ? 'conges' : isIndisponible ? 'indisponible' : isPermis ? 'permis' : isDone ? 'done' : isBooked ? 'booked' : 'available';
            const statusLabel = isDahoUnavailable
                ? `INDISPONIBLE<br><small style="font-size: 0.75rem; opacity: 0.9;">Hors horaires</small>`
                : isNailSpecialUnavailable
                ? `INDISPONIBLE<br><small style="font-size: 0.75rem; opacity: 0.9;">Réservé nouveaux packs</small>`
                : isConges
                ? `CONGES<br><small style="font-size: 0.75rem; opacity: 0.9;">${congesInfo}</small>`
                : isIndisponible
                ? `INDISPONIBLE${indisponibleReason ? `<br><small style="font-size: 0.75rem; opacity: 0.9;">${indisponibleReason}</small>` : ''}`
                : isPermis 
                ? permisLabel
                : isDone ? 'Réalisé' : isBooked ? 'Réservé' : 'DISPO';
            const todayCol = isToday(d) ? ' today-col' : '';

            const studentName = isBooked && !isPermis && !isIndisponible && !isConges
                ? `${(booking.student?.first_name || '').trim()} ${(booking.student?.last_name || '').trim()}`.trim()
                : '';
            const studentPhone = isBooked && !isPermis && !isIndisponible && !isConges ? (booking.student?.phone || '') : '';

            const icon = isConges ? 'fa-umbrella-beach' : isIndisponible ? 'fa-ban' : isPermis ? 'fa-id-card' : isDone ? 'fa-check' : isBooked ? 'fa-user' : 'fa-plus';
            
            // Determiner le type de vehicule depuis le vehicule affecte, puis depuis la transmission.
            const transmissionType = isBooked ? (booking?.student?.transmission_type || null) : null;
            const assignedVehicle = isBooked ? vehicleFromNotes(booking?.notes || '') : null;
            let vehicleType = assignedVehicle?.label || '';
            let transmissionClass = '';
            
            if (assignedVehicle?.transmission === 'auto' || transmissionType === 'auto') {
                vehicleType = 'BA';
                transmissionClass = 'transmission-auto';
            } else if (assignedVehicle?.transmission === 'manual' || transmissionType === 'manual') {
                vehicleType = 'BM';
                transmissionClass = 'transmission-manual';
            }
            
            const studentData = isBooked ? JSON.stringify({
                prenom: booking.student?.first_name,
                nom: booking.student?.last_name,
                telephone: booking.student?.phone,
                email: booking.student?.email,
                pack: booking.student?.pack,
                forfait: booking.student?.forfait,
                hours_completed: booking.student?.hours_completed,
                hours_goal: booking.student?.hours_goal,
                slotDate: dateStr,
                slotStart: bookingStart,
                slotEnd: end,
                instructor: instructor,
                slotId: id,
                slotUuid: booking.slot_uuid || null
            }).replace(/"/g, '&quot;') : '';

            // Pour les créneaux disponibles, ajouter un bouton '+' pour placer un élève
            const slotData = JSON.stringify({
                dateStr: dateStr,
                start: bookingStart,
                end: end,
                instructor: instructor
            }).replace(/"/g, '&quot;');
            const permisData = isPermis ? encodeURIComponent(JSON.stringify({
                notes: booking.notes || '',
                date: d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
                start: bookingStart,
                end,
                instructor
            })) : '';
            
            return `
                <div class="cal-cell${todayCol}">
                    <div class="ev ${statusClass} ${transmissionClass}" ${isPermis ? `onclick="showPermisDetails('${permisData}')" style="cursor:pointer;"` : isIndisponible || isConges || isNailSpecialUnavailable ? '' : isBooked ? `onclick="showStudent(${studentData})" style="cursor:pointer;"` : `onclick="openStudentSearchModal(${slotData})" style="cursor:pointer;"`}>
                        ${!isBooked && !isPermis && !isIndisponible && !isConges && !isNailSpecialUnavailable ? `<button class="add-student-btn" onclick="event.stopPropagation(); openStudentSearchModal(${slotData});" title="Placer un eleve"><i class="fas fa-plus"></i></button>` : ''}
                        <span class="ev-icon"><i class="fas ${icon}"></i></span>
                        <div class="ev-status">${isBooked && !isPermis && !isIndisponible && !isConges ? (vehicleType || 'BM/BA') : statusLabel}</div>
                        <div class="ev-time">${bookingStart} - ${end}</div>
                        ${isBooked && !isPermis && !isIndisponible && !isConges ? `<div class="ev-name">${studentName || 'Eleve'}${vehicleType ? ` <span class="vehicle-badge" title="${assignedVehicle?.name || vehicleType}">[${vehicleType}]</span>` : ''}</div>` : ''}
                        ${isBooked && !isPermis && !isIndisponible && !isConges && studentPhone ? `<div class="ev-phone"><i class="fas fa-phone" style="font-size:0.55rem;margin-right:3px;"></i>${studentPhone}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        const firstDay = days[0] ? toInputDate(days[0]) : '';
        const rowEnd = getEndForStart(instructor, start, firstDay);
        const timeCell = `<div class="cal-time">${timeCellStart.replace(':', 'h')}${rowEnd ? `<br><small>${rowEnd.replace(':', 'h')}</small>` : ''}</div>`;
        return timeCell + dayCells;
    }).join('');

    grid.innerHTML = headerRow + bodyRows;

    // Update quick stats
    const statTotal = document.getElementById('statTotal');
    const statBooked = document.getElementById('statBooked');
    const statDone = document.getElementById('statDone');
    if (statTotal) statTotal.textContent = totalSlots;
    if (statBooked) statBooked.textContent = bookedCount;
    if (statDone) statDone.textContent = doneCount;
    setQuickStatValue('statToday', visibleTodayCount);
    setQuickStatValue('statWeek', visibleWeekCount);

    // Update instructor name in header
    const instrName = document.getElementById('instructorName');
    if (instrName) instrName.textContent = instructor;
}

// Fonction pour sauvegarder l'?tat (globale pour être accessible partout)
function saveState() {
    localStorage.setItem('admin_planning_state', JSON.stringify({
        weekStart: state.weekStart.toISOString(),
        instructor: state.instructor
    }));
}

(function init() {
    console.log('?YY? IIFE admin-planning v80 - Initialisation du planning');
    const loginSection = document.getElementById('loginSection');
    const planningSection = document.getElementById('planningSection');
    const adminActions = document.getElementById('adminActions');
    const logoutBtn = document.getElementById('logoutBtn');

    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');
    const weekLabel = document.getElementById('weekLabel');

    const planningFeedback = document.getElementById('planningFeedback');
    const planningGrid = document.getElementById('planningGrid');

    // Support both old <select> and new segment control
    const instructorSelectEl = document.getElementById('instructorSelect');
    const segmentBtns = document.querySelectorAll('#instructorSegment button');

    // Restaurer l'état sauvegardé
    const savedState = localStorage.getItem('admin_planning_state');
    if (savedState) {
        state = JSON.parse(savedState);
    } else {
        state.instructor = instructorSelectEl ? normalizeInstructor(instructorSelectEl.value) : 'Mylène';
    }
    
    // Convertir weekStart en Date si c'est une string
    if (typeof state.weekStart === 'string') {
        state.weekStart = new Date(state.weekStart);
    }

    // Fonction pour mettre à jour le bouton actif du moniteur
    function updateActiveInstructorButton() {
        segmentBtns.forEach(btn => {
            const btnInstructor = normalizeInstructor(btn.dataset.instructor);
            if (btnInstructor === state.instructor) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    async function refresh() {
        if (planningFeedback) setFeedback(planningFeedback, 'Chargement du planning...', '');
        try {
            const check = requireAdmin();
            if (!check.ok) {
                window.location.href = 'connexion.html';
                return;
            }

            if (loginSection) loginSection.style.display = 'none';
            if (planningSection) planningSection.classList.add('visible');
            if (adminActions) adminActions.style.display = '';

            const weekEnd = addDays(state.weekStart, 6);
            if (weekLabel) weekLabel.textContent = formatWeekLabel(state.weekStart, weekEnd);

            // Mettre à jour le bouton actif du moniteur
            updateActiveInstructorButton();

            const booked = await fetchBookedSlots(state.instructor, state.weekStart, weekEnd);
            if (planningGrid) renderPlanning(planningGrid, state.instructor, state.weekStart, booked);
            loadAdminQuickStats().catch((statsError) => {
                console.warn('Impossible de charger les compteurs admin:', statsError);
            });

            if (planningFeedback) setFeedback(planningFeedback, '', '');
        } catch (err) {
            console.error(err);
            if (planningFeedback) setFeedback(planningFeedback, 'Impossible de charger le planning. Vérifie ta connexion et réessaie.', 'error');
        }
    }

    const todayBtn = document.getElementById('todayBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => logout());
    }

    // Segment control for instructor selection.
    // Un seul listener sur le conteneur gère TOUS les boutons, y compris ceux
    // ajoutés dynamiquement (nouveaux moniteurs comme test3).
    const instructorSegment = document.getElementById('instructorSegment');
    if (instructorSegment) {
        instructorSegment.addEventListener('click', async (e) => {
            const btn = e.target.closest('button[data-instructor]');
            if (!btn || !instructorSegment.contains(btn)) return;

            instructorSegment.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.instructor = normalizeInstructor(btn.dataset.instructor);
            saveState();
            console.log('?Y-?? Moniteur sélectionn?:', state.instructor);
            await refresh();

            // Mettre à jour l'affichage des taux de r?ussite pour ce moniteur
            if (window.refreshInstructorDisplay) {
                window.refreshInstructorDisplay(state.instructor);
            }
        });
    }

    // Old select fallback
    if (instructorSelectEl) {
        instructorSelectEl.addEventListener('change', async () => {
            state.instructor = normalizeInstructor(instructorSelectEl.value);
            saveState();
            await refresh();
        });
    }

    // "Aujourd'hui" button
    if (todayBtn) {
        todayBtn.addEventListener('click', async () => {
            state.weekStart = startOfWeek(new Date());
            saveState();
            await refresh();
        });
    }

    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', async () => {
            state.weekStart = addDays(state.weekStart, -7);
            saveState();
            await refresh();
        });
    }

    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', async () => {
            state.weekStart = addDays(state.weekStart, 7);
            saveState();
            await refresh();
        });
    }

    // Exposer refresh globalement pour les boutons de moniteurs ajoutés dynamiquement
    window.refreshPlanning = refresh;

    window.addEventListener('auth-session-ready', () => refresh(), { once: true });
    if (window.authenticatedUser?.role === 'admin') refresh();
})();

// ?.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.?
// GESTION DES DEMANDES D'ANNULATION
// ?.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.?

let cancellationRequests = [];
let documentReviews = [];
let documentReviewRefreshTimer = null;
let documentReviewVisibilityBound = false;

async function loadDocumentReviewNotifications() {
    try {
        const payload = await fetchAdminPlanningData({ type: 'document-reviews' });
        documentReviews = payload.reviews || [];
        updateDocumentReviewUI();
    } catch (error) {
        console.error('Erreur chargement documents a verifier:', error);
        documentReviews = [];
        updateDocumentReviewUI();
    }
}

function updateDocumentReviewUI() {
    const pill = document.getElementById('documentReviewPill');
    const countElement = document.getElementById('statDocumentReviews');
    const list = document.getElementById('documentReviewList');
    const pendingCount = documentReviews.reduce((total, review) => total + Number(review.pending_count || 0), 0);

    if (pill) pill.style.display = pendingCount > 0 ? 'flex' : 'none';
    if (countElement) countElement.textContent = pendingCount;
    if (!list) return;

    if (!documentReviews.length) {
        list.innerHTML = '<p class="empty-message">Aucun document en attente de verification.</p>';
        return;
    }

    list.innerHTML = documentReviews.map((review) => {
        const uploadedAt = review.last_uploaded_at ? new Date(review.last_uploaded_at) : null;
        const uploadedLabel = uploadedAt && !Number.isNaN(uploadedAt.getTime())
            ? uploadedAt.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
            : 'En attente de verification';
        return `
            <div class="cancellation-card">
                <div class="card-header">
                    <div class="student-info">
                        <h4>${escapeHtml(review.user_name || review.user_email)}</h4>
                        <p><i class="fas fa-envelope"></i> ${escapeHtml(review.user_email)}</p>
                        <p style="margin-top:4px;"><i class="fas fa-clock"></i> ${escapeHtml(uploadedLabel)}</p>
                    </div>
                    <div class="slot-badge" style="background:#e8f2ff;color:#0066cc;">
                        <i class="fas fa-file-circle-check"></i>
                        ${Number(review.pending_count || 0)} document(s) a verifier
                    </div>
                </div>
                <div class="card-actions">
                    <button type="button" class="btn-accept" data-open-document-review="${escapeHtml(review.user_email)}" style="background:#0071e3;">
                        <i class="fas fa-folder-open"></i> Verifier les documents
                    </button>
                </div>
            </div>
        `;
    }).join('');

    list.querySelectorAll('[data-open-document-review]').forEach((button) => {
        button.addEventListener('click', () => window.viewInscriptionDocuments(button.dataset.openDocumentReview));
    });
}

window.toggleDocumentReviewPanel = function() {
    const panel = document.getElementById('documentReviewPanel');
    if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
};

async function loadCancellationRequests() {
    try {
        const payload = await fetchAdminPlanningData({ type: 'cancellation-requests' });
        cancellationRequests = payload.requests || [];
        updateCancellationUI();
    } catch (err) {
        console.error('Exception loading cancellation requests:', err);
        cancellationRequests = [];
        updateCancellationUI();
    }
}

function updateCancellationUI() {
    const pill = document.getElementById('cancellationPill');
    const statEl = document.getElementById('statCancellations');
    const actionCountEl = document.getElementById('cancellationActionCount');
    const listEl = document.getElementById('cancellationList');

    const count = cancellationRequests.length;

    if (pill) {
        pill.style.display = 'flex';
        pill.style.opacity = count > 0 ? '1' : '0.72';
    }
    if (statEl) {
        statEl.textContent = count;
    }
    if (actionCountEl) {
        actionCountEl.textContent = count;
    }

    if (listEl) {
        if (count === 0) {
            listEl.innerHTML = '<p class="empty-message">Aucune demande d\'annulation en attente.</p>';
        } else {
            listEl.innerHTML = cancellationRequests.map(req => {
                const safeId = escapeHtml(req.id);
                const safeName = escapeHtml(req.user_name || 'élève inconnu');
                const safeEmail = escapeHtml(req.user_email || '-');
                const safeReason = escapeHtml(req.reason || 'Aucun motif fourni');
                const safeInstructor = escapeHtml(req.instructor || 'Moniteur inconnu');
                const createdAt = new Date(req.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                
                const slotDate = req.slot_date ? new Date(req.slot_date).toLocaleDateString('fr-FR', {
                    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                }) : 'Date inconnue';
                
                const slotTime = escapeHtml(req.slot_time || 'Heure inconnue');
                
                const justificationLink = req.justification_file 
                    ? `<a href="${escapeHtml(req.justification_file)}" target="_blank" class="justification-link" download="${escapeHtml(req.justification_filename || 'justificatif')}">
                        <i class="fas fa-paperclip"></i> Voir le justificatif (${escapeHtml(req.justification_filename || 'fichier')})
                       </a>`
                    : '<span style="font-size:0.8rem;color:var(--text2);"><i class="fas fa-exclamation-triangle"></i> Aucun justificatif fourni</span>';

                return `
                    <div class="cancellation-card" data-request-id="${safeId}">
                        <div class="card-header">
                            <div class="student-info">
                                <h4>${safeName}</h4>
                                <p><i class="fas fa-envelope"></i> ${safeEmail}</p>
                                <p style="margin-top:4px;"><i class="fas fa-clock"></i> Demande du ${createdAt}</p>
                            </div>
                            <div style="text-align:right;">
                                <div class="slot-badge" style="margin-bottom:6px;">
                                    <i class="fas fa-calendar"></i> ${slotDate}
                                </div>
                                <div style="font-size:0.85rem;font-weight:600;color:var(--orange);">
                                    <i class="fas fa-clock"></i> ${slotTime} - ${safeInstructor}
                                </div>
                            </div>
                        </div>
                        <div class="reason-section">
                            <label>Motif de l'annulation</label>
                            <p>${safeReason}</p>
                        </div>
                        ${justificationLink}
                        <div class="reason-section" style="margin-top:10px;">
                            <label>Motif admin si refus</label>
                            <textarea data-admin-reason-for="${safeId}" rows="2" placeholder="Exemple : justificatif insuffisant ou demande hors délai..." style="width:100%;margin-top:6px;padding:10px;border:1px solid var(--border);border-radius:10px;font:inherit;resize:vertical;"></textarea>
                        </div>
                        <div class="card-actions">
                            <button class="btn-accept" onclick="handleCancellationDecision('${safeId}', 'accepted')">
                                <i class="fas fa-check"></i> Accepter
                            </button>
                            <button class="btn-refuse" onclick="handleCancellationDecision('${safeId}', 'refused')">
                                <i class="fas fa-times"></i> Refuser
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

window.toggleCancellationPanel = function() {
    const panel = document.getElementById('cancellationPanel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
};

window.handleCancellationDecision = async function(requestId, decision) {
    const adminReasonInput = document.querySelector(`[data-admin-reason-for="${requestId}"]`);
    const adminReason = (adminReasonInput?.value || '').trim();
    if (decision === 'refused' && adminReason.length < 3) {
        alert('Ajoute un motif admin avant de refuser la demande. Il sera envoyé à l’élève par email.');
        adminReasonInput?.focus();
        return;
    }

    const confirmMsg = decision === 'accepted'
        ? 'Accepter cette demande d\'annulation ?\n\nLe créneau redeviendra disponible pour les autres élèves.'
        : `Refuser cette demande d'annulation ?\n\nMotif envoyé à l'élève : ${adminReason}\n\nL'heure restera comptée dans le forfait de l'élève.`;

    if (!confirm(confirmMsg)) return;

    try {
        const token = window.authSession?.getToken?.();
        if (!token) throw new Error('AUTH_REQUIRED');

        const response = await fetch('/.netlify/functions/admin-cancellation-decision', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ request_id: requestId, decision, admin_reason: adminReason })
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.ok) {
            throw new Error(result?.error || 'ADMIN_CANCELLATION_DECISION_FAILED');
        }

        await loadCancellationRequests();
        await loadDesistementsPlanning();
        if (typeof window.refreshPlanning === 'function') {
            await window.refreshPlanning();
        }

        if (decision === 'accepted' && result.slot_id && typeof showAvailableStudentsForSlot === 'function') {
            showAvailableStudentsForSlot(result.slot_id).catch((error) => {
                console.warn('Impossible d afficher les eleves disponibles apres annulation:', error);
            });
        }
        
        alert(decision === 'accepted' 
            ? `Demande acceptée. Le créneau est maintenant disponible.${result.email_sent ? ' Email envoyé à l’élève.' : ' Attention : email non envoyé.'}` 
            : `Demande refusée. L'heure reste comptée.${result.email_sent ? ' Email envoyé à l’élève.' : ' Attention : email non envoyé.'}`);

    } catch (err) {
        console.error('Error handling cancellation decision:', err);
        alert('Erreur lors du traitement de la demande.');
    }
};

let adminSecondaryPanelsLoaded = false;

function loadAdminSecondaryPanelsWhenReady(attempt = 0) {
    if (!window.authSession?.getToken?.()) {
        if (attempt < 60) setTimeout(() => loadAdminSecondaryPanelsWhenReady(attempt + 1), 100);
        return;
    }
    if (adminSecondaryPanelsLoaded) return;
    adminSecondaryPanelsLoaded = true;
    loadCancellationRequests();
    loadInscriptionNotifications();
    loadDocumentReviewNotifications();
    loadDesistementsPlanning();
    if (!documentReviewRefreshTimer) {
        documentReviewRefreshTimer = setInterval(() => {
            if (window.authSession?.getToken?.()) loadDocumentReviewNotifications();
        }, 300000);
    }
    if (!documentReviewVisibilityBound) {
        documentReviewVisibilityBound = true;
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && window.authSession?.getToken?.()) loadDocumentReviewNotifications();
        });
    }
}

window.addEventListener('auth-session-ready', () => loadAdminSecondaryPanelsWhenReady());
setTimeout(() => loadAdminSecondaryPanelsWhenReady(), 250);

// ?.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.?
// STUDENT SEARCH FUNCTIONALITY
// ?.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.?

window.searchStudent = async function() {
    const searchInput = document.getElementById('slotStudentSearch') || document.getElementById('studentSearchInput');
    const resultsDiv = document.getElementById('slotAutocompleteSuggestions') || document.getElementById('autocompleteSuggestions');
    const searchTerm = searchInput?.value.trim().toLowerCase();
    
    if (!searchTerm || searchTerm.length < 2) {
        if (resultsDiv) {
            resultsDiv.innerHTML = '';
            resultsDiv.classList.remove('active');
        }
        return;
    }
    
    try {
        const results = await getMatchingStudents(searchTerm);
        
        if (!results || results.length === 0) {
            if (resultsDiv) {
                resultsDiv.innerHTML = `
                    <div style="padding: 1rem; color: #86868b; text-align: center;">
                        Aucun élève trouv?<br>
                        <small>Voulez-vous <a href="inscription.html?admin=true" style="color: var(--primary);">inscrire un nouvel élève</a> ?</small>
                    </div>
                `;
                resultsDiv.classList.add('active');
            }
            return;
        }
        
        // Afficher la liste des resultats
        if (resultsDiv) {
            resultsDiv.innerHTML = results.map(student => {
                const displayName = student.nom && student.prenom 
                    ? `${student.prenom} ${student.nom}` 
                    : student.email;
                const transmission = student.transmission_type === 'manual' ? 'BM' : student.transmission_type === 'auto' ? 'BA' : '';
                const pendingBadge = student._pending ? `<span style="margin-left: 0.5rem; padding: 0.15rem 0.5rem; background: #9c27b0; color: white; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">À valider</span>` : '';
                const compatible = !window.currentSlotInfo || isStudentCompatibleWithInstructor(student, window.currentSlotInfo.instructor, window.currentSlotInfo);
                const disabledStyle = compatible ? '' : 'border-left:4px solid #f59e0b;background:#fffbeb;';
                const specialSlotNote = window.currentSlotInfo && isNailNewPackSlot(window.currentSlotInfo)
                    ? 'Créneau Nail réservé aux nouveaux packs'
                    : 'Attention : planning différent, confirmation demandée';
                const compatibilityNote = compatible ? '' : `<div style="font-size:0.75rem;color:#92400e;font-weight:700;margin-top:0.25rem;">${specialSlotNote}</div>`;
                
                return `
                    <div class="suggestion-item" data-student-email="${escapeHtml(student.email)}" style="${disabledStyle}">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 40px; height: 40px; min-width: 40px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem;">
                                ${(student.prenom?.[0] || student.email[0]).toUpperCase()}
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="display:flex;align-items:center;gap:0.45rem;flex-wrap:wrap;">
                                    <span style="font-weight: 600; color: var(--dark); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayName}</span>
                                    ${studentPlanningModeBadge(student, true)}
                                </div>
                                <div style="font-size: 0.85rem; color: #86868b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    ${student.telephone || student.email}
                                    ${transmission ? `<span style="margin-left: 0.5rem; padding: 0.15rem 0.5rem; background: ${transmission === 'BM' ? '#ff9500' : '#0071e3'}; color: white; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">${transmission}</span>` : ''}${pendingBadge}
                                </div>
                                ${compatibilityNote}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            resultsDiv.classList.add('active');
        }
        
    } catch (err) {
        console.error('Search error:', err);
        const resultsDiv = document.getElementById('slotAutocompleteSuggestions');
        if (resultsDiv) {
            resultsDiv.innerHTML = '<div style="padding: 1rem; color: #dc3545; text-align: center;">Erreur lors de la recherche</div>';
            resultsDiv.classList.add('active');
        }
    }
};

window.displayStudentDetails = async function(student) {
    try {
        const detailsPayload = await fetchAdminPlanningData({ type: 'student-details', email: student.email });
        student = detailsPayload.student || student;
        const reservations = detailsPayload.reservations || [];
        const cancellations = detailsPayload.cancellations || [];
        
        // Calculer les statistiques
        const now = new Date();
        
        // Compter les heures effectuées : status 'completed' ou 'done' OU séances passées avec status 'upcoming'
        const completedSessions = (reservations || []).filter(r => {
            const slotDate = r.slots?.start_at ? new Date(r.slots.start_at) : null;
            const isPast = slotDate && slotDate < now;
            return r.status === 'completed' || r.status === 'done' || (isPast && r.status === 'upcoming');
        });
        const totalHours = completedSessions.reduce((sum, reservation) => {
            const slot = reservation.slots;
            if (!slot?.start_at || !slot?.end_at) return sum;
            const duration = (new Date(slot.end_at) - new Date(slot.start_at)) / (1000 * 60 * 60);
            return sum + lessonUnitsForDuration(student, duration);
        }, 0);
        
        // Compter les annulations acceptées (status 'accepted' ou 'approved')
        const totalCancellations = (cancellations || []).filter(c => 
            c.status === 'accepted' || c.status === 'approved'
        ).length;
        
        // Séances à venir : status 'upcoming' ET date future
        const upcomingSessions = (reservations || []).filter(r => {
            const slotDate = r.slots?.start_at ? new Date(r.slots.start_at) : null;
            const isFuture = slotDate && slotDate >= now;
            return r.status === 'upcoming' && isFuture;
        });
        
        const cancelledSessions = (reservations || []).filter(r => r.status?.includes('cancelled'));
        
        // Construire le HTML
        const modalBody = document.getElementById('studentDetailsBody');
        if (!modalBody) return;
        const mode = studentPlanningMode(student);
        const totalCompletedForChange = totalHours + Math.max(0, Number(student.hours_completed_initial || 0));
        const completedLabel = isCourseBasedStudent(student) ? 'Cours effectués' : 'Heures effectuées';
        const actionTitle = isCourseBasedStudent(student) ? 'Ajouter des cours (paiement cash)' : 'Ajouter des heures (paiement cash)';
        const actionInputLabel = isCourseBasedStudent(student) ? 'Nombre de cours (1-20)' : "Nombre d'heures (1-20)";
        
        modalBody.innerHTML = `
            <!-- Informations personnelles -->
            <div class="info-section">
                <h3><i class="fas fa-user"></i> Informations personnelles</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <label>Nom complet</label>
                        <span>${student.prenom || '-'} ${student.nom || '-'}</span>
                    </div>
                    <div class="info-item">
                        <label>Email</label>
                        <span>${student.email || '-'}</span>
                    </div>
                    <div class="info-item">
                        <label>Téléphone</label>
                        <span>${student.telephone || '-'}</span>
                    </div>
                    <div class="info-item">
                        <label>Date de naissance</label>
                        <span>${student.date_nais ? new Date(student.date_nais).toLocaleDateString('fr-FR') : '-'}</span>
                    </div>
                    <div class="info-item">
                        <label><i class="fas fa-car"></i> Transmission</label>
                        <span style="font-weight: 600; color: ${student.transmission_type === 'manual' ? '#FF6B6B' : '#4CAF50'};">
                            ${student.transmission_type === 'manual' ? 'Manuelle (BM)' : student.transmission_type === 'auto' ? 'Automatique (BA)' : 'Non renseigné'}
                        </span>
                    </div>
                    <div class="info-item" style="border-left: 4px solid ${mode.border}; background: ${mode.bg};">
                        <label><i class="fas ${mode.icon}"></i> Mode planning</label>
                        <span style="font-weight: 800; color: ${mode.color};">${mode.label}</span>
                        <small style="display:block;margin-top:0.35rem;color:${mode.color};font-weight:600;">${mode.description}</small>
                    </div>
                    <div class="info-item">
                        <label>Adresse</label>
                        <span>${student.adresse || '-'}</span>
                    </div>
                    <div class="info-item">
                        <label>Code postal</label>
                        <span>${student.code_postal || '-'}</span>
                    </div>
                    <div class="info-item">
                        <label>Ville</label>
                        <span>${student.ville || '-'}</span>
                    </div>
                    <div class="info-item">
                        <label><i class="fas fa-id-card"></i> Numéro NEPH</label>
                        <span style="font-family: monospace; font-weight: 600; color: ${student.numero_neph ? '#0071e3' : 'inherit'};">
                            ${student.numero_neph || 'Non renseigné'}
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Forfait et statistiques -->
            <div class="info-section">
                <h3><i class="fas fa-chart-line"></i> Forfait et statistiques</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <label>Forfait choisi</label>
                        <span>${student.forfait || 'Non défini'}</span>
                    </div>
                    <div class="info-item">
                        <label>${completedLabel}</label>
                        <span style="color: var(--green); font-weight: 700;">${formatStudentBalance(student, totalCompletedForChange)}</span>
                    </div>
                    <div class="info-item">
                        <label>Séances réalisées</label>
                        <span>${completedSessions.length}</span>
                    </div>
                    <div class="info-item">
                        <label>Séances à venir</label>
                        <span>${upcomingSessions.length}</span>
                    </div>
                    <div class="info-item">
                        <label>Annulations</label>
                        <span style="color: var(--red); font-weight: 700;">${totalCancellations}</span>
                    </div>
                    <div class="info-item">
                        <label>Date d'inscription</label>
                        <span>${student.created_at ? new Date(student.created_at).toLocaleDateString('fr-FR') : '-'}</span>
                    </div>
                </div>
            </div>
            
            <!-- Historique des séances -->
            <div class="info-section">
                <h3><i class="fas fa-history"></i> Historique des séances (${(reservations || []).length})</h3>
                ${(reservations || []).length === 0 ? '<p style="color: var(--text2); font-style: italic;">Aucune séance enregistrée.</p>' : `
                    <table class="sessions-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Horaire</th>
                                <th>Moniteur</th>
                                <th>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reservations.sort((a, b) => {
                                const dateA = a.slots?.start_at ? new Date(a.slots.start_at) : new Date(0);
                                const dateB = b.slots?.start_at ? new Date(b.slots.start_at) : new Date(0);
                                return dateB - dateA; // Tri décroissant (plus récent en premier)
                            }).map(res => {
                                const slotDate = res.slots?.start_at ? new Date(res.slots.start_at) : null;
                                const dateStr = slotDate ? slotDate.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                                const timeStr = slotDate ? `${String(slotDate.getHours()).padStart(2, '0')}:${String(slotDate.getMinutes()).padStart(2, '0')}` : '-';
                                const instructor = res.slots?.instructor || res.instructor || '-';
                                
                                // Vérifier si la séance est passée
                                const now = new Date();
                                const isPast = slotDate && slotDate < now;
                                
                                let statusClass = 'upcoming';
                                let statusLabel = 'à venir';
                                
                                if (res.status === 'completed' || res.status === 'done' || (isPast && res.status === 'upcoming')) {
                                    statusClass = 'completed';
                                    statusLabel = 'Effectué';
                                } else if (res.status === 'cancelled_refused') {
                                    statusClass = 'cancelled';
                                    statusLabel = 'Refusée';
                                } else if (res.status === 'pending') {
                                    statusClass = 'pending';
                                    statusLabel = 'En attente';
                                } else if (res.status?.includes('cancelled')) {
                                    statusClass = 'cancelled';
                                    statusLabel = 'Annulée';
                                }
                                
                                return `
                                    <tr>
                                        <td>${dateStr}</td>
                                        <td>${timeStr}</td>
                                        <td><strong>${instructor}</strong></td>
                                        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `}
            </div>
        `;
        
        // Section Notes Admin
        modalBody.innerHTML += `
            <div class="info-section" style="background: #fff3cd; border-left: 4px solid #ffc107;">
                <h3 style="color: #856404;"><i class="fas fa-sticky-note"></i> Notes admin (non incluses dans le PDF/Email)</h3>
                <div style="margin-top: 1rem;">
                    <textarea id="adminNotesTextarea" 
                        style="width: 100%; min-height: 120px; padding: 12px; border: 2px solid #ffc107; border-radius: 8px; font-size: 0.95rem; font-family: inherit; resize: vertical;"
                        placeholder="Ajoutez des notes ou commentaires sur cet élève (visible uniquement côté admin)...">${student.notes_admin || ''}</textarea>
                    <div style="margin-top: 0.75rem; display: flex; gap: 0.75rem;">
                        <button onclick="saveAdminNotes('${student.email}')" 
                            style="background: #28a745; color: white; border: none; padding: 0.5rem 1.25rem; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.5rem;"
                            onmouseover="this.style.background='#218838';"
                            onmouseout="this.style.background='#28a745';">
                            <i class="fas fa-save"></i> Sauvegarder les notes
                        </button>
                        <button onclick="clearAdminNotes('${student.email}')" 
                            style="background: #dc3545; color: white; border: none; padding: 0.5rem 1.25rem; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.5rem;"
                            onmouseover="this.style.background='#c82333';"
                            onmouseout="this.style.background='#dc3545';">
                            <i class="fas fa-eraser"></i> Effacer
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Boutons d'action
        modalBody.innerHTML += `
            <div class="info-section" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                <h3 style="color: white;"><i class="fas fa-calendar-plus"></i> Actions</h3>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <button onclick="showSlotSelectionForStudent('${student.email}', '${student.prenom}', '${student.nom}')" 
                        style="background: white; color: #667eea; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        <i class="fas fa-calendar-check"></i> Placer sur le planning
                    </button>
                    <button onclick="openChangeForfaitModal('${student.email}', '${student.prenom}', '${student.nom}', '${student.forfait || ''}', ${totalCompletedForChange})" 
                        style="background: #ffc107; color: #000; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        <i class="fas fa-exchange-alt"></i> Changer de forfait
                    </button>
                    <button onclick="downloadStudentPDF('${student.email}')" 
                        style="background: #28a745; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        <i class="fas fa-file-pdf"></i> Télécharger la fiche
                    </button>
                    <button onclick="sendStudentPDFByEmail('${student.email}')" 
                        style="background: #0071e3; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        <i class="fas fa-envelope"></i> Envoyer par email
                    </button>
                    <button onclick="viewInscriptionDocuments('${student.email}')" 
                        style="background: #ff6b6b; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        <i class="fas fa-file-alt"></i> Documents
                    </button>
                    <button onclick="openAdminExamResultModal('${student.email}', '${student.prenom} ${student.nom}')" 
                        style="background: linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        <i class="fas fa-trophy"></i> Saisir résultat examen
                    </button>
                </div>
            </div>
            
            <!-- Ajout d'heures (paiement cash) -->
            <div class="info-section" style="background: #f0f7ff; border-left: 4px solid #0071e3;">
                <h3 style="color: #0071e3;"><i class="fas fa-clock"></i> ${actionTitle}</h3>
                <div style="margin-top: 1rem; display: flex; gap: 1rem; align-items: flex-end;">
                    <div style="flex: 1;">
                        <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.9rem;">
                            ${actionInputLabel}
                        </label>
                        <input type="number" id="addHoursInput" min="1" max="20" placeholder="1-20"
                            style="width: 100%; padding: 10px; border: 2px solid #0071e3; border-radius: 8px; font-size: 0.95rem;">
                    </div>
                    <button 
                        onclick="addStudentHours('${student.email}')" 
                        style="background: #0071e3; color: white; border: none; padding: 10px 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s; white-space: nowrap;"
                        onmouseover="this.style.background='#0055b3'"
                        onmouseout="this.style.background='#0071e3'"
                    >
                        <i class="fas fa-check"></i> Ajouter
                    </button>
                </div>
            </div>
        `;
        
        // Afficher la modal
        const modal = document.getElementById('studentDetailsModal');
        if (modal) {
            modal.classList.add('active');
        }
        
    } catch (err) {
        console.error('Error displaying student details:', err);
        alert('Erreur lors de l\'affichage des détails.');
    }
};

// Fonction pour ajouter des heures à un élève (paiement cash)
window.addStudentHours = async function(studentEmail) {
    const input = document.getElementById('addHoursInput');
    const hoursToAdd = parseInt(input?.value);
    
    if (!hoursToAdd || hoursToAdd < 1 || hoursToAdd > 20) {
        alert('Veuillez entrer un nombre d\'heures valide (entre 1 et 20).');
        return;
    }
    
    try {
        // Récupérer les infos de l'élève
        const { data: student, error: studentError } = await window.supabaseClient
            .from('users')
            .select('prenom, nom, hours_goal, lesson_unit_minutes')
            .eq('email', studentEmail)
            .single();
        
        if (studentError || !student) {
            console.error('Error fetching student:', studentError);
            alert('Erreur lors de la récupération des informations de l\'élève.');
            return;
        }
        
        const userName = `${student.prenom || ''} ${student.nom || ''}`.trim();
        
        // Récupérer les heures depuis inscription_notifications (le total r?el)
        const { data: inscriptions, error: inscError } = await window.supabaseClient
            .from('inscription_notifications')
            .select('hours_purchased')
            .eq('user_email', studentEmail);
        
        let currentHoursGoal = student.hours_goal || 0;
        
        // Ajouter les nouvelles heures
        const newHoursGoal = currentHoursGoal + hoursToAdd;
        
        // Ins?rer dans inscription_notifications
        const { error: insertError } = await window.supabaseClient
            .from('inscription_notifications')
            .insert({
                user_email: studentEmail,
                user_name: userName,
                hours_purchased: hoursToAdd,
                lesson_unit_minutes: student.lesson_unit_minutes || 120,
                pack: 'Paiement cash',
                payment_method: 'cash',
                created_at: new Date().toISOString()
            });
        
        if (insertError) {
            console.error('Error adding hours:', insertError);
            alert('Erreur lors de l\'ajout des heures.');
            return;
        }
        
        // Mettre à jour hours_goal dans la table users
        const { error: updateError } = await window.supabaseClient
            .from('users')
            .update({ hours_goal: newHoursGoal })
            .eq('email', studentEmail);
        
        if (updateError) {
            console.error('Error updating hours goal:', updateError);
            alert('Erreur lors de la mise à jour des heures.');
            return;
        }
        
        alert(`${formatStudentBalance(student, hoursToAdd)} ajouté avec succès à l'élève.`);
        
        // Rafra?chir les détails de l'élève
        const { data: updatedStudent } = await window.supabaseClient
            .from('users')
            .select('*')
            .eq('email', studentEmail)
            .single();
        
        if (updatedStudent) {
            await displayStudentDetails(updatedStudent);
        }
        
        // R?initialiser l'input
        if (input) input.value = '';
        
    } catch (err) {
        console.error('Error adding student hours:', err);
        alert('Erreur lors de l\'ajout des heures.');
    }
};

window.closeStudentDetails = function() {
    const modal = document.getElementById('studentDetailsModal');
    if (modal) {
        modal.classList.remove('active');
    }
};

// Autocomplete functionality
let autocompleteTimeout = null;

window.showSuggestions = async function(searchTerm) {
    const suggestionsContainer = document.getElementById('autocompleteSuggestions');
    if (!suggestionsContainer) return;
    
    if (!searchTerm) {
        suggestionsContainer.classList.remove('active');
        return;
    }
    
    try {
        const users = await getMatchingStudents(searchTerm, 5);
        
        if (!users || users.length === 0) {
            suggestionsContainer.classList.remove('active');
            return;
        }
        
        // Si un seul resultat, ouvrir directement la fiche
        if (users.length === 1) {
            await selectStudent(users[0]);
            return;
        }
        
        suggestionsContainer.innerHTML = users.map((user, index) => {
            const initials = `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase();
            return `
                <div class="suggestion-item" data-user-index="${index}">
                    <div class="suggestion-icon">${initials}</div>
                    <div class="suggestion-info">
                        <div class="suggestion-name" style="display:flex;align-items:center;gap:0.45rem;flex-wrap:wrap;">
                            <span>${user.prenom || ''} ${user.nom || ''}</span>
                            ${studentPlanningModeBadge(user, true)}
                        </div>
                        <div class="suggestion-email">${user.email || ''}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add mousedown event listeners to each suggestion (mousedown se d?clenche avant blur)
        const suggestionItems = suggestionsContainer.querySelectorAll('.suggestion-item');
        suggestionItems.forEach((item, index) => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Emp?cher le blur de l'input
                selectStudent(users[index]);
            });
        });
        
        suggestionsContainer.classList.add('active');
        
    } catch (err) {
        console.error('Autocomplete error:', err);
    }
};

window.hideSuggestions = function() {
    const suggestionsContainer = document.getElementById('autocompleteSuggestions');
    if (suggestionsContainer) {
        suggestionsContainer.classList.remove('active');
    }
};

window.selectStudent = async function(user) {
    try {
        hideSuggestions();
        const searchInput = document.getElementById('studentSearchInput');
        if (searchInput) {
            searchInput.value = `${user.prenom || ''} ${user.nom || ''}`.trim();
        }
        
        await displayStudentDetails(user);
        
    } catch (err) {
        console.error('Error selecting student:', err);
    }
};

// Allow Enter key to trigger search and autocomplete on input
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('studentSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchStudent();
            }
        });
        
        // Autocomplete on input - afficher les suggestions pendant la frappe
        searchInput.addEventListener('input', (e) => {
            clearTimeout(autocompleteTimeout);
            
            const searchTerm = e.target.value.trim().toLowerCase();
            
            if (searchTerm.length >= 2) {
                autocompleteTimeout = setTimeout(() => {
                    showSuggestions(searchTerm);
                }, 40);
            } else {
                hideSuggestions();
            }
        });
    }
});

// ?.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.?
// INSCRIPTION NOTIFICATIONS FUNCTIONALITY
// ?.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.?

window.toggleInscriptionPanel = function() {
    const panel = document.getElementById('inscriptionPanel');
    if (panel) {
        if (panel.style.display === 'none' || !panel.style.display) {
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    }
};

window.loadInscriptionNotifications = async function() {
    try {
        console.log('Loading inscription notifications...');
        const { data: notifications, error } = await window.supabaseClient
            .from('inscription_notifications')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading inscription notifications:', error);
            return;
        }
        
        console.log('Notifications loaded:', notifications ? notifications.length : 0);
        
        const inscriptionList = document.getElementById('inscriptionList');
        const inscriptionPill = document.getElementById('inscriptionPill');
        const statInscriptions = document.getElementById('statInscriptions');
        
        if (!notifications || notifications.length === 0) {
            if (inscriptionList) {
                inscriptionList.innerHTML = '<p class="empty-message">Aucune nouvelle inscription en attente.</p>';
            }
            if (inscriptionPill) {
                inscriptionPill.style.display = 'none';
            }
            return;
        }
        
        // Show pill and update count
        if (inscriptionPill) {
            inscriptionPill.style.display = 'flex';
        }
        if (statInscriptions) {
            statInscriptions.textContent = notifications.length;
        }
        
        // Build notification cards
        if (inscriptionList) {
            inscriptionList.innerHTML = notifications.map(notif => {
                const date = new Date(notif.created_at);
                const dateStr = date.toLocaleDateString('fr-FR', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric'
                });
                const timeStr = date.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                return `
                    <div class="inscription-card">
                        <div class="inscription-card-header">
                            <div class="inscription-user-info">
                                <div class="user-avatar-large">
                                    ${notif.user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <div>
                                    <h3 class="inscription-user-name">${notif.user_name}</h3>
                                    <p class="inscription-user-email"><i class="fas fa-envelope"></i> ${notif.user_email}</p>
                                </div>
                            </div>
                            <div class="inscription-timestamp">
                                <div class="timestamp-date">${dateStr}</div>
                                <div class="timestamp-time">${timeStr}</div>
                            </div>
                        </div>
                        
                        <div class="inscription-card-body">
                            <div class="inscription-info-grid">
                                <div class="info-badge pack-badge">
                                    <i class="fas fa-box"></i>
                                    <div>
                                        <span class="info-label">Pack choisi</span>
                                        <span class="info-value">${notif.pack}</span>
                                    </div>
                                </div>
                                <div class="info-badge docs-badge">
                                    <i class="fas fa-file-alt"></i>
                                    <div>
                                        <span class="info-label">Documents</span>
                                        <span class="info-value">${notif.documents_count} fichier(s)</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                                <h4 style="margin: 0 0 0.75rem 0; font-size: 0.95rem; color: #495057;">
                                    <i class="fas fa-info-circle"></i> Informations complètes
                                </h4>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; font-size: 0.9rem;">
                                    <div>
                                        <strong style="color: #6c757d;">Téléphone:</strong><br>
                                        <span>${notif.user_telephone || 'Non renseigné'}</span>
                                    </div>
                                    <div>
                                        <strong style="color: #6c757d;">Date de naissance:</strong><br>
                                        <span>${notif.user_date_naissance ? new Date(notif.user_date_naissance).toLocaleDateString('fr-FR') : 'Non renseignée'}</span>
                                    </div>
                                    <div>
                                        <strong style="color: #6c757d;">Adresse:</strong><br>
                                        <span>${notif.user_adresse || 'Non renseignée'}</span>
                                    </div>
                                    <div>
                                        <strong style="color: #6c757d;">Code postal:</strong><br>
                                        <span>${notif.user_code_postal || 'Non renseigné'}</span>
                                    </div>
                                    <div>
                                        <strong style="color: #6c757d;">Ville:</strong><br>
                                        <span>${notif.user_ville || 'Non renseignée'}</span>
                                    </div>
                                    <div>
                                        <strong style="color: #6c757d;"><i class="fas fa-id-card"></i> Numéro NEPH:</strong><br>
                                        <span style="font-family: monospace; font-weight: 600; color: ${notif.numero_neph ? '#0071e3' : 'inherit'};">
                                            ${notif.numero_neph || 'Non renseigné'}
                                        </span>
                                    </div>
                                    ${notif.parent_prenom || notif.parent_nom ? `
                                    <div style="grid-column: 1 / -1; padding-top: 0.5rem; border-top: 1px solid #dee2e6; margin-top: 0.5rem;">
                                        <strong style="color: #6c757d;"><i class="fas fa-user-shield"></i> Représentant légal (mineur):</strong><br>
                                        <span>${notif.parent_prenom || ''} ${notif.parent_nom || ''}</span>
                                    </div>
                                    ` : ''}
                                    ${notif.permis_invalide === 'oui' ? `
                                    <div style="grid-column: 1 / -1;">
                                        <span style="background: #fff3cd; color: #856404; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">
                                            <i class="fas fa-exclamation-triangle"></i> Permis invalidé
                                        </span>
                                    </div>
                                    ` : ''}
                                    ${notif.is_heberge === 'oui' ? `
                                    <div style="grid-column: 1 / -1;">
                                        <span style="background: #d1ecf1; color: #0c5460; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">
                                            <i class="fas fa-home"></i> Hébergé(e)
                                        </span>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            ${notif.notes_admin ? `
                            <div style="margin-top: 1rem; padding: 1rem; background: #fff9e6; border-left: 4px solid #ffc107; border-radius: 8px;">
                                <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem; color: #856404;">
                                    <i class="fas fa-comment-dots"></i> Commentaire de l'élève
                                </h4>
                                <p style="margin: 0; color: #856404; white-space: pre-wrap; font-size: 0.9rem;">${notif.notes_admin}</p>
                            </div>
                            ` : ''}
                        </div>
                        
                        <div class="inscription-card-footer">
                            <button class="btn-inscription-view" onclick="viewInscriptionDocuments('${notif.user_email}')">
                                <i class="fas fa-folder-open"></i>
                                <span>Voir les documents</span>
                            </button>
                            <div class="inscription-actions">
                                <button class="btn-inscription-accept" onclick="handleInscriptionDecision('${notif.id}', 'approved')">
                                    <i class="fas fa-check-circle"></i>
                                    <span>Valider</span>
                                </button>
                                <button class="btn-inscription-reject" onclick="handleInscriptionDecision('${notif.id}', 'rejected')">
                                    <i class="fas fa-times-circle"></i>
                                    <span>Refuser</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
    } catch (err) {
        console.error('Error loading inscription notifications:', err);
    }
};

function parseAdminDocumentMap(value) {
    if (!value) return {};
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch (error) {
            return {};
        }
    }
    return typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function adminDocumentLabel(key) {
    return {
        pieceIdentite: 'Pi&egrave;ce d\'identit&eacute;',
        assr: 'ASSR',
        jdc: 'Journ&eacute;e D&eacute;fense et Citoyennet&eacute;',
        justifDomicile: 'Justificatif de domicile',
        ephoto: 'E-photo',
        certifHebergement: 'Certificat d\'h&eacute;bergement',
        pieceHebergeur: 'Pi&egrave;ce d\'identit&eacute; h&eacute;bergeur',
        codeStudentCardFile: 'Carte &eacute;tudiant / Certificat de scolarit&eacute;'
    }[key] || escapeHtml(key);
}

function documentStatusBadge(doc) {
    if (doc?.status === 'accepted') {
        return '<div style="margin-top:0.35rem;color:#15803d;font-weight:800;">Document accept&eacute;</div>';
    }
    if (doc?.status === 'rejected') {
        return `
            <div style="margin-top:0.35rem;color:#be123c;font-weight:800;">Document incorrect</div>
            ${doc?.admin_comment ? `<small style="display:block;margin-top:0.25rem;color:#9f1239;">${escapeHtml(doc.admin_comment)}</small>` : ''}
        `;
    }
    return '<div style="margin-top:0.35rem;color:#92400e;font-weight:800;">A verifier</div>';
}

function renderAdminDocumentRow(ownerEmail, key, doc) {
    const safeEmail = escapeHtml(ownerEmail);
    const safeKey = escapeHtml(key);
    const fileName = escapeHtml(doc?.name || 'document');
    const hasFile = Boolean(doc?.data);

    return `
        <div style="background:white;padding:1rem;border-radius:8px;margin-bottom:0.75rem;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
                <div>
                    <strong>${adminDocumentLabel(key)}</strong><br>
                    <small style="color:var(--text2);">${fileName}</small>
                    ${documentStatusBadge(doc)}
                </div>
                ${hasFile ? `
                    <a href="${doc.data}" download="${fileName}" class="btn-primary" style="padding:0.5rem 1rem;text-decoration:none;display:inline-flex;align-items:center;gap:0.5rem;">
                        <i class="fas fa-download"></i> Telecharger
                    </a>
                ` : '<span style="color:var(--text2);font-weight:700;">Fichier indisponible</span>'}
            </div>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.8rem;">
                <button type="button" class="btn-inscription-accept" onclick="setInscriptionDocumentStatus('${safeEmail}', '${safeKey}', 'accepted')" style="padding:0.45rem 0.8rem;">
                    Accepter
                </button>
                <button type="button" class="btn-inscription-reject" onclick="showDocumentRejectionForm('${safeKey}')" style="padding:0.45rem 0.8rem;">
                    Incorrect
                </button>
            </div>
            <div id="documentRejectionForm-${safeKey}" hidden style="margin-top:0.9rem;padding:0.9rem;background:#fff1f2;border:1px solid #fecdd3;border-radius:8px;">
                <label for="documentRejectionComment-${safeKey}" style="display:block;font-weight:800;color:#9f1239;margin-bottom:0.45rem;">Motif du refus</label>
                <textarea id="documentRejectionComment-${safeKey}" rows="3" maxlength="800" placeholder="Explique ce que l'eleve doit corriger" style="width:100%;resize:vertical;padding:0.7rem;border:1px solid #fda4af;border-radius:6px;"></textarea>
                <p id="documentRejectionError-${safeKey}" style="display:none;color:#be123c;font-weight:700;margin:0.35rem 0 0;"></p>
                <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.65rem;">
                    <button type="button" class="btn-inscription-reject" onclick="submitDocumentRejection('${safeEmail}', '${safeKey}')" style="padding:0.45rem 0.8rem;">Confirmer le refus</button>
                    <button type="button" class="btn-secondary" onclick="hideDocumentRejectionForm('${safeKey}')" style="padding:0.45rem 0.8rem;">Annuler</button>
                </div>
            </div>
        </div>
    `;
}

window.showDocumentRejectionForm = function(documentKey) {
    const form = document.getElementById(`documentRejectionForm-${documentKey}`);
    if (!form) return;
    form.hidden = false;
    document.getElementById(`documentRejectionComment-${documentKey}`)?.focus();
};

window.hideDocumentRejectionForm = function(documentKey) {
    const form = document.getElementById(`documentRejectionForm-${documentKey}`);
    const error = document.getElementById(`documentRejectionError-${documentKey}`);
    if (form) form.hidden = true;
    if (error) error.style.display = 'none';
};

window.submitDocumentRejection = async function(userEmail, documentKey) {
    const input = document.getElementById(`documentRejectionComment-${documentKey}`);
    const error = document.getElementById(`documentRejectionError-${documentKey}`);
    const comment = String(input?.value || '').trim();
    if (!comment) {
        if (error) {
            error.textContent = 'Indique le motif avant de confirmer.';
            error.style.display = 'block';
        }
        input?.focus();
        return;
    }
    await window.setInscriptionDocumentStatus(userEmail, documentKey, 'rejected', comment);
};

window.viewInscriptionDocuments = async function(userEmail) {
    try {
        const details = await fetchAdminPlanningData({ type: 'student-details', email: userEmail });
        const student = details.student || { email: userEmail };
        const notification = details.notification || (details.notifications || [])[0] || null;
        const notificationDocs = parseAdminDocumentMap(notification?.documents);
        const userDocs = parseAdminDocumentMap(student.documents);
        const documents = Object.keys(userDocs).length ? userDocs : notificationDocs;
        const ownerEmail = notification?.user_email || student.email || userEmail;
        const modalBody = document.getElementById('inscriptionDocumentsBody');
        if (!modalBody) return;

        const fullName = `${student.prenom || notification?.user_prenom || ''} ${student.nom || notification?.user_nom || ''}`.trim() || ownerEmail;
        const phone = student.telephone || notification?.user_telephone || '-';
        const pack = student.forfait || notification?.pack_label || notification?.pack || '-';
        const note = notification?.notes_admin || student.notes_admin || '';
        const documentsCount = Number(notification?.documents_count || student.documents_count || 0);

        const header = `
            <div style="margin-bottom:1.5rem;">
                <h3 style="margin-bottom:0.5rem;">${escapeHtml(fullName)}</h3>
                <p style="color:var(--text2);margin:0;">
                    <i class="fas fa-envelope"></i> ${escapeHtml(ownerEmail)}<br>
                    <i class="fas fa-phone"></i> ${escapeHtml(phone)}<br>
                    <i class="fas fa-box"></i> Pack: <strong>${escapeHtml(pack)}</strong>
                </p>
            </div>
        `;

        if (!Object.keys(documents).length && documentsCount > 0) {
            modalBody.innerHTML = `
                ${header}
                <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:1rem;border-radius:8px;color:#856404;">
                    ${documentsCount} document(s) sont indiques pour cette inscription, mais le fichier n'est pas disponible dans la base.
                </div>
            `;
        } else {
            modalBody.innerHTML = `
                ${header}
                ${note ? `
                    <div style="background:#fff9e6;padding:1.5rem;border-radius:12px;margin-bottom:1.5rem;border-left:4px solid #ffc107;">
                        <h4 style="margin-bottom:0.75rem;color:#856404;">
                            <i class="fas fa-comment-dots"></i> Commentaire de l'&eacute;l&egrave;ve
                        </h4>
                        <p style="margin:0;color:#856404;white-space:pre-wrap;">${escapeHtml(note)}</p>
                    </div>
                ` : ''}
                <div style="background:#f8f9fa;padding:1.5rem;border-radius:12px;">
                    <h4 style="margin-bottom:1rem;"><i class="fas fa-file-alt"></i> Documents fournis</h4>
                    ${Object.keys(documents).length === 0
                        ? '<p style="color:var(--text2);font-style:italic;">Aucun document fourni.</p>'
                        : Object.entries(documents).map(([key, doc]) => renderAdminDocumentRow(ownerEmail, key, doc)).join('')
                    }
                </div>
            `;
        }

        const modal = document.getElementById('inscriptionDocumentsModal');
        if (modal) modal.classList.add('active');
    } catch (err) {
        console.error('Error viewing documents:', err);
        alert('Erreur lors de l affichage des documents.');
    }
};

window.setInscriptionDocumentStatus = async function(userEmail, documentKey, status, providedComment = '') {
    try {
        const comment = String(providedComment || '').trim();
        if (status === 'rejected' && !comment) {
            window.showDocumentRejectionForm(documentKey);
            return;
        }

        const response = await fetch('/.netlify/functions/admin-document-status', {
            method: 'POST',
            headers: {
                ...getAdminAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userEmail, documentKey, status, comment })
        });
        const result = await response.json().catch(() => ({ ok: false }));
        if (!response.ok || !result.ok) {
            throw new Error(result.error || 'DOCUMENT_STATUS_FAILED');
        }
        alert(status === 'accepted' ? 'Document accepte.' : 'Document marque comme incorrect.');
        await window.viewInscriptionDocuments(userEmail);
        await loadDocumentReviewNotifications();
    } catch (error) {
        console.error('Erreur statut document:', error);
        alert('Impossible de mettre a jour ce document pour le moment.');
    }
};

window.closeInscriptionDocuments = function() {
    const modal = document.getElementById('inscriptionDocumentsModal');
    if (modal) {
        modal.classList.remove('active');
    }
};

window.legacyHandleInscriptionDecision = async function(notificationId, decision) {
    let rejectionMessage = '';
    
    if (decision === 'rejected') {
        rejectionMessage = await showAdminChoiceDialog({
            title: 'Refuser l inscription',
            message: 'Ce motif sera envoye par e-mail a l eleve.',
            multiline: true,
            placeholder: 'Motif du refus',
            required: true
        });
        
        if (rejectionMessage === null) return; // User cancelled
        
        if (!rejectionMessage.trim()) {
            alert('Vous devez fournir une raison pour le refus.');
            return;
        }
    } else {
        const confirmMsg = 'Valider cette inscription ?';
        if (!confirm(confirmMsg)) return;
    }
    
    try {
        // Get notification details for email
        const { data: notification, error: notifError } = await window.supabaseClient
            .from('inscription_notifications')
            .select('*')
            .eq('id', notificationId)
            .single();
        
        if (notifError || !notification) {
            console.error('Error fetching notification:', notifError);
            alert('Erreur lors de la récupération des données.');
            return;
        }
        
        // Update notification status
        console.log('Updating notification:', notificationId, 'to status:', decision);
        const { data: updateData, error } = await window.supabaseClient
            .from('inscription_notifications')
            .update({ 
                status: decision,
                reviewed_at: new Date().toISOString(),
                reviewed_by: 'admin',
                rejection_message: decision === 'rejected' ? rejectionMessage : null
            })
            .eq('id', notificationId)
            .select();
        
        console.log('Update result:', updateData, 'Error:', error);
        
        if (error) {
            console.error('Error updating notification:', error);
            alert('Erreur lors de la mise à jour.');
            return;
        }
        
        if (!updateData || updateData.length === 0) {
            console.error('No rows updated!');
            alert('Erreur: Aucune ligne mise à jour.');
            return;
        }
        
        console.log('Notification updated successfully:', updateData[0]);
        
        // Si l'inscription est approuv?e, cr?er le compte utilisateur
        if (decision === 'approved') {
            console.log('?o. Inscription approuv?e - Cr?ation du compte utilisateur...');
            
            try {
                // Hasher le mot de passe
                const passwordHash = await window.hashPassword(notification.user_password);
                
                // Calculer hours_goal selon le pack
                let hoursGoal = 20; // Par d?faut
                if (notification.pack) {
                    if (notification.pack === 'heures-conduite') {
                        hoursGoal = notification.hours_purchased || 0;
                    } else if (notification.pack === 'boite-auto') {
                        hoursGoal = 13;
                    } else if (notification.pack === 'am') {
                        hoursGoal = 8;
                    } else if (notification.pack === 'second-chance') {
                        hoursGoal = 6;
                    } else if (notification.pack === 'code') {
                        hoursGoal = 0;
                    }
                } else {
                    // Pas de pack = pas d'heures
                    hoursGoal = 0;
                }
                
                // Cr?er ou mettre à jour le compte utilisateur (upsert pour ?viter les doublons)
                const { data: userData, error: userError } = await window.supabaseClient
                    .from('users')
                    .upsert({
                        prenom: notification.user_prenom,
                        nom: notification.user_nom,
                        email: notification.user_email,
                        password_hash: passwordHash,
                        telephone: notification.user_telephone,
                        date_nais: notification.user_date_naissance,
                        genre: notification.genre || null,
                        adresse: notification.user_adresse,
                        code_postal: notification.user_code_postal,
                        ville: notification.user_ville,
                        numero_neph: notification.numero_neph || null,
                        forfait: notification.pack || null,
                        hours_goal: hoursGoal,
                        hours_completed_initial: 0,
                        lesson_unit_minutes: notification.lesson_unit_minutes || 45,
                        notes_admin: notification.notes_admin || null
                    }, { onConflict: 'email' });
                
                if (userError) {
                    console.error('?O Erreur cr?ation compte utilisateur:', userError);
                    alert(`Erreur lors de la création du compte: ${userError.message}`);
                    return;
                }
                
                console.log('?o. Compte utilisateur cr?? avec succès');
            } catch (createError) {
                console.error('Erreur lors de la création du compte:', createError);
                alert('Erreur lors de la création du compte utilisateur.');
                return;
            }
        }
        
        // Si l'inscription est approuv?e, cr?diter l'heure de parrainage si applicable
        if (decision === 'approved' && notification.referral_code) {
            console.log('?YZ? Inscription approuv?e avec code de parrainage:', notification.referral_code);
            
            // Récupérer le parrainage correspondant
            const { data: referralData, error: referralError } = await window.supabaseClient
                .from('referrals')
                .select('id, referrer_email, reward_credited')
                .eq('referral_code', notification.referral_code)
                .eq('referee_email', notification.user_email)
                .maybeSingle();
            
            if (referralError) {
                console.error('?O Erreur récupération parrainage:', referralError);
            } else if (referralData && !referralData.reward_credited) {
                console.log('Credit de l\'heure de parrainage au parrain:', referralData.referrer_email);
                
                // Cr?diter 1h au parrain
                const { data: creditResult, error: creditError } = await window.supabaseClient
                    .rpc('credit_referral_reward', { referral_id: referralData.id });
                
                if (creditError) {
                    console.error('?O Erreur cr?dit parrainage:', creditError);
                } else {
                    console.log('?o. Heure de parrainage cr?dit?e avec succès !', creditResult);
                }
            } else if (referralData && referralData.reward_credited) {
                console.log('?"?? R?compense déjà cr?dit?e pour ce parrainage');
            } else {
                console.log('?"?? Aucun parrainage trouv? pour ce code');
            }
        }
        
        // Send email notification (async, don't wait)
        sendInscriptionEmail(notification.user_email, notification.user_name, decision, rejectionMessage, notification.user_password)
            .then(() => {
                console.log('Email sent successfully');
            })
            .catch(err => {
                console.error('Email sending failed:', err);
            });
        
        // Reload notifications to remove the card immediately
        await loadInscriptionNotifications();
        
    } catch (err) {
        console.error('Error handling inscription decision:', err);
        alert('Erreur lors du traitement.');
    }
};

window.handleInscriptionDecision = async function(notificationId, decision) {
    let rejectionMessage = '';
    if (decision === 'rejected') {
        rejectionMessage = await showAdminChoiceDialog({
            title: 'Refuser l inscription',
            message: 'Ce motif sera envoye par e-mail a l eleve.',
            multiline: true,
            placeholder: 'Motif du refus',
            required: true
        });
        if (rejectionMessage === null) return;
        if (!rejectionMessage.trim()) {
            alert('Une raison est n&eacute;cessaire pour refuser une inscription.');
            return;
        }
    } else if (!confirm('Valider cette inscription ?')) {
        return;
    }

    const token = window.authSession?.getToken();
    if (!token) {
        alert('Ta session administrateur a expir&eacute;. Reconnecte-toi.');
        window.location.href = 'connexion.html';
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/send-registration-decision', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ notificationId, decision, rejectionMessage })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
            throw new Error(result.error || 'DECISION_FAILED');
        }
        await loadInscriptionNotifications();
    } catch (error) {
        console.error('Decision inscription:', error);
        alert('Impossible de mettre &agrave; jour cette inscription. R&eacute;essaie.');
    }
};

async function sendInscriptionEmail(userEmail, userName, decision, rejectionMessage, userPassword = null) {
    try {
        // Toujours utiliser l'URL de production dans les emails
        // (même si l'admin valide depuis localhost)
        const siteUrl = 'https://autoecolebreteuil.com';
        
        const isApproved = decision === 'approved';
        const subject = isApproved 
            ? 'Votre inscription a été validée - Auto-École Breteuil'
            : 'Votre inscription a été refusée - Auto-École Breteuil';
        
        const htmlContent = isApproved ? `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                    .credentials-box { background: white; border-left: 4px solid #11998e; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .button { display: inline-block; background: #11998e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Inscription validée !</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour <strong>${userName}</strong>,</p>
                        <p>Nous avons le plaisir de vous informer que votre inscription à l'Auto-École Breteuil a été <strong>validée avec succès</strong> !</p>
                        
                        <div class="credentials-box">
                            <h3 style="margin-top: 0; color: #11998e;">Vos identifiants de connexion</h3>
                            <p><strong>Email :</strong> ${userEmail}</p>
                            <p><strong>Mot de passe :</strong> ${userPassword || '(voir email précédent)'}</p>
                            <p style="font-size: 0.9em; color: #666; margin-top: 15px;">Conservez ces identifiants en lieu sûr. Vous en aurez besoin pour accéder à votre espace élève.</p>
                        </div>
                        
                        <p>Vous pouvez dès maintenant accéder à votre espace élève pour :</p>
                        <ul>
                            <li>Consulter votre planning de cours</li>
                            <li>Réserver vos heures de conduite</li>
                            <li>Suivre votre progression</li>
                        </ul>
                        <p style="text-align: center;">
                            <a href="${siteUrl}/connexion.html" class="button">Accéder à mon espace</a>
                        </p>
                        <p>Bienvenue dans notre auto-école !</p>
                    </div>
                    <div class="footer">
                        <p>Auto-École Breteuil<br>
                        1A Ruedouard Delanglade, 13006 Marseille<br>
                        04 91 53 36 98 | breteuilautoecole@gmail.com</p>
                    </div>
                </div>
            </body>
            </html>
        ` : `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                    .message-box { background: white; border-left: 4px solid #ee0979; padding: 15px; margin: 20px 0; border-radius: 5px; }
                    .button { display: inline-block; background: #0071e3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Inscription refusée</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour <strong>${userName}</strong>,</p>
                        <p>Nous vous informons que votre inscription à l'Auto-École Breteuil n'a malheureusement pas pu être validée.</p>
                        <div class="message-box">
                            <strong>Raison du refus :</strong>
                            <p>${rejectionMessage}</p>
                        </div>
                        <p>Si vous souhaitez obtenir plus d'informations ou corriger votre dossier, n'hésitez pas à nous contacter.</p>
                        <p style="text-align: center;">
                            <a href="mailto:breteuilautoecole@gmail.com" class="button">Nous contacter</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>Auto-École Breteuil<br>
                        1A Ruedouard Delanglade, 13006 Marseille<br>
                        04 91 53 36 98 | breteuilautoecole@gmail.com</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        // Send via EmailJS
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                service_id: '',
                template_id: '',
                user_id: '',
                template_params: {
                    to_email: userEmail,
                    to_name: userName,
                    subject: subject,
                    html_content: htmlContent
                }
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error sending email:', errorText);
            throw new Error('Failed to send email');
        }
        
        console.log('Email sent successfully to', userEmail);
        
    } catch (err) {
        console.error('Error sending inscription email:', err);
        throw err;
    }
}

// Client-side decision emails are disabled. The authenticated server endpoint
// sends the official decision notification after the database update.
sendInscriptionEmail = async () => {
    throw new Error('CLIENT_EMAIL_DISABLED');
};

// Show student details modal
window.showStudent = async function(student) {
    const modal = document.getElementById('studentModal');
    const details = document.getElementById('studentDetails');
    const closeBtn = document.getElementById('closeModal');

    // Calculer les heures effectuées AVANT cette séance
    let hoursBeforeThisSession = 0;
    let sessionDuration = 0;
    let hourStart = 0;
    let hourEnd = 0;
    let totalHoursCompleted = student.hours_completed || 0;
    
    if (student.email && student.slotDate) {
        try {
            const slotDateTime = new Date(`${student.slotDate}T${student.slotStart}`);
            
            // Récupérer TOUTES les réservations de cet élève (done ET upcoming)
            const { data: allReservations } = await window.supabaseClient
                .from('reservations')
                .select('slots(start_at, end_at), status, created_at')
                .eq('email', student.email);
            
            // Trier par date et compter jusqu'à cette séance incluse
            const sortedSessions = (allReservations || [])
                .filter(res => res.slots && res.slots.start_at)
                .sort((a, b) => new Date(a.slots.start_at) - new Date(b.slots.start_at));
            
            let cumulativeHours = 0;
            for (const res of sortedSessions) {
                const sessionStart = new Date(res.slots.start_at);
                const sessionEnd = new Date(res.slots.end_at);
                const hours = (sessionEnd - sessionStart) / (1000 * 60 * 60);
                
                // Compter jusqu'? et incluant cette séance
                if (sessionStart <= slotDateTime) {
                    cumulativeHours += lessonUnitsForDuration(student, hours);
                    
                    // Si c'est exactement cette séance, on s'arr?te
                    if (sessionStart.getTime() === slotDateTime.getTime()) {
                        break;
                    }
                }
            }
            
            hourEnd = Math.ceil(cumulativeHours);
            
            console.log(`?Y"S ${student.prenom} - Créneau ${student.slotDate} ${student.slotStart}: ${hourEnd}h cumul?es`);
        } catch (err) {
            console.error('Error calculating hours:', err);
        }
    }

    // Formater la date et l'heure du créneau
    let slotInfo = '';
    if (student.slotDate && student.slotStart && student.slotEnd) {
        const slotDate = new Date(student.slotDate);
        const dateStr = slotDate.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        
        slotInfo = `
            <div class="info-row" style="background: #f0f7ff; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                <span class="info-label" style="color: #0071e3; font-weight: 600;"><i class="fas fa-calendar-alt"></i> Créneau</span>
                <span class="info-value" style="color: #0071e3; font-weight: 600;">${dateStr} - ${student.slotStart} ? ${student.slotEnd}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Moniteur</span>
                <span class="info-value">${student.instructor || '-'}</span>
            </div>
        `;
    }

    const completedBalance = hourEnd > 0 ? hourEnd : (student.hours_completed || 0);
    const balanceProgressText = `${formatStudentBalance(student, completedBalance)} effectué / ${formatStudentBalance(student, student.hours_goal || 0)} objectif`;
    const addBalanceLabel = isCourseBasedStudent(student) ? 'Cours ? ajouter (paiement cash)' : 'Heures ? ajouter (paiement cash)';
    const addBalancePlaceholder = isCourseBasedStudent(student) ? 'Nombre de cours (1-20)' : "Nombre d'heures (1-20)";

    details.innerHTML = `
        ${slotInfo}
        <div class="info-row">
            <span class="info-label">Pr?nom</span>
            <span class="info-value">${student.prenom || '-'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Nom</span>
            <span class="info-value">${student.nom || '-'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Téléphone</span>
            <span class="info-value"><a href="tel:${student.telephone}">${student.telephone || '-'}</a></span>
        </div>
        <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value"><a href="mailto:${student.email}">${student.email || '-'}</a></span>
        </div>
        <div class="info-row" style="background: #fff3cd; padding: 12px; border-radius: 8px; margin-top: 12px;">
            <span class="info-label" style="color: #856404; font-weight: 600;"><i class="fas fa-graduation-cap"></i> Forfait</span>
            <span class="info-value" style="color: #856404; font-weight: 600;">${student.forfait || student.pack || '-'}</span>
        </div>
        <div class="info-row" style="background: #d1ecf1; padding: 12px; border-radius: 8px; margin-top: 8px;">
            <span class="info-label" style="color: #0c5460; font-weight: 600;"><i class="fas fa-clock"></i> Solde conduite</span>
            <span class="info-value" style="color: #0c5460; font-weight: 600;">
                ${balanceProgressText}
            </span>
        </div>
        ${student.slotUuid ? `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <button onclick="cancelSlotReservation('${student.slotUuid}', '${student.email}', '${student.prenom}', '${student.nom}', '${student.slotDate}', '${student.slotStart}')" 
                    style="width: 100%; background: #ff3b30; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;"
                    onmouseover="this.style.background='#e6342a';"
                    onmouseout="this.style.background='#ff3b30';">
                    <i class="fas fa-trash-alt"></i> Supprimer ce créneau
                </button>
                <p style="margin-top: 8px; font-size: 0.8rem; color: #666; text-align: center; font-style: italic;">
                    <i class="fas fa-info-circle"></i> Le créneau sera libéré et l'heure sera recréditée à l'élève
                </p>
            </div>
        ` : ''}
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.9rem;">
                    <i class="fas fa-clock"></i> ${addBalanceLabel}
                </label>
                <input type="number" id="addHoursInput" min="1" max="20" placeholder="${addBalancePlaceholder}"
                    style="width: 100%; padding: 10px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem;">
            </div>
            <button 
                onclick="addStudentHours('${student.email}')" 
                style="width: 100%; background: #0071e3; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;"
                onmouseover="this.style.background='#0055b3'"
                onmouseout="this.style.background='#0071e3'"
            >
                <i class="fas fa-check"></i> Ajouter du solde
            </button>
        </div>
    `;

    modal.classList.add('active');

    // Close modal handlers
    if (closeBtn) {
        closeBtn.onclick = () => modal.classList.remove('active');
    }
    modal.onclick = (e) => {
        if (e.target === modal) modal.classList.remove('active');
    };
};

// ============================================
// AVAILABLE STUDENTS FOR CANCELLATIONS
// ============================================

async function showAvailableStudentsForSlot(slotId) {
    try {
        // Get slot details
        const { data: slot, error: slotError } = await window.supabaseClient
            .from('slots')
            .select('*')
            .eq('id', slotId)
            .single();
        
        if (slotError || !slot) {
            console.error('Error fetching slot:', slotError);
            return;
        }
        
        // Get day of week from slot date
        const slotDate = new Date(slot.date);
        const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const dayName = dayNames[slotDate.getDay()];
        
        // Get time slot (e.g., "14:00-16:00")
        const startTime = slot.start_time.substring(0, 5); // "14:00"
        const endTime = slot.end_time.substring(0, 5); // "16:00"
        const timeSlot = `${startTime}-${endTime}`;
        
        // Find students who are available for this day and time
        const { data: availableStudents, error: studentsError } = await window.supabaseClient
            .from('student_availability')
            .select('*')
            .eq('wants_cancellation_notifications', true);
        
        if (studentsError) {
            console.error('Error fetching available students:', studentsError);
            return;
        }
        
        // Filter students who match this specific day and time slot
        const matchingStudents = availableStudents.filter(student => {
            if (!student.availability_slots) return false;
            
            const slots = typeof student.availability_slots === 'string' 
                ? JSON.parse(student.availability_slots) 
                : student.availability_slots;
            
            // Check if student is available on this day and time
            if (slots[dayName]) {
                return slots[dayName].some(time => {
                    // Check if the time slot matches or overlaps
                    return time === timeSlot || 
                           time.includes(startTime) || 
                           timeSlot.includes(time.split('-')[0]);
                });
            }
            return false;
        });
        
        if (matchingStudents.length === 0) {
            alert('Aucun élève disponible pour ce créneau.\n\nCréneau libéré : ' + 
                  dayName.charAt(0).toUpperCase() + dayName.slice(1) + ' ' + timeSlot);
            return;
        }
        
        // Display available students in a modal
        const studentsList = matchingStudents.map(student => `
            <div style="background: #f8f9fa; padding: 1.25rem; border-radius: 12px; margin-bottom: 1rem; border-left: 4px solid #10b981;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                    <div>
                        <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; color: #1d1d1f;">
                            <i class="fas fa-user" style="color: #10b981;"></i> ${student.user_name}
                        </h4>
                        <p style="margin: 0; color: #6c757d; font-size: 0.9rem;">
                            <i class="fas fa-envelope"></i> ${student.user_email}
                        </p>
                        ${student.user_phone ? `
                        <p style="margin: 0.25rem 0 0 0; color: #6c757d; font-size: 0.9rem;">
                            <i class="fas fa-phone"></i> <a href="tel:${student.user_phone}" style="color: #0071e3;">${student.user_phone}</a>
                        </p>
                        ` : ''}
                    </div>
                    <a href="tel:${student.user_phone || ''}" class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.9rem; text-decoration: none;">
                        <i class="fas fa-phone"></i> Appeler
                    </a>
                </div>
                <div style="background: white; padding: 0.75rem; border-radius: 8px; font-size: 0.85rem;">
                    <strong style="color: #495057;">Disponibilit?s :</strong><br>
                    ${Object.entries(typeof student.availability_slots === 'string' ? JSON.parse(student.availability_slots) : student.availability_slots)
                        .map(([day, times]) => `<span style="color: #6c757d;">${day.charAt(0).toUpperCase() + day.slice(1)}: ${times.join(', ')}</span>`)
                        .join('<br>')}
                </div>
            </div>
        `).join('');
        
        const message = `
            <div style="background: white; border-radius: 16px; padding: 2rem; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <i class="fas fa-users" style="font-size: 3rem; color: #10b981; margin-bottom: 1rem;"></i>
                    <h2 style="margin: 0 0 0.5rem 0; color: #1d1d1f;">élèves disponibles</h2>
                    <p style="color: #6c757d; margin: 0;">
                        ${matchingStudents.length} élève(s) disponible(s) pour ce créneau
                    </p>
                </div>
                
                <div style="background: #e3f2fd; padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; border-left: 4px solid #2196f3;">
                    <p style="margin: 0; color: #0d47a1; font-weight: 600;">
                        <i class="fas fa-calendar-alt"></i> Créneau libéré :
                    </p>
                    <p style="margin: 0.5rem 0 0 0; color: #1565c0; font-size: 1.1rem;">
                        ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${slotDate.toLocaleDateString('fr-FR')} - ${timeSlot}
                    </p>
                </div>
                
                <div style="max-height: 400px; overflow-y: auto;">
                    ${studentsList}
                </div>
                
                <div style="margin-top: 1.5rem; text-align: center;">
                    <button onclick="closeAvailableStudentsModal()" class="btn-secondary" style="padding: 0.75rem 2rem;">
                        <i class="fas fa-times"></i> Fermer
                    </button>
                </div>
            </div>
        `;
        
        // Create and show modal
        const existingModal = document.getElementById('availableStudentsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'availableStudentsModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 2rem;
            overflow-y: auto;
        `;
        modal.innerHTML = message;
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
    } catch (err) {
        console.error('Error showing available students:', err);
    }
}

window.closeAvailableStudentsModal = function() {
    const modal = document.getElementById('availableStudentsModal');
    if (modal) {
        modal.remove();
    }
};

// ============================================
// PLACEMENT D'??L?^VE SUR LE PLANNING
// ============================================

// Ouvrir la modal de recherche d'élève pour un créneau sp?cifique
window.openStudentSearchModal = function(slotInfo) {
    const modalHtml = `
        <div class="student-search-modal" id="studentSearchModalSlot">
            <div class="student-search-content">
                <div class="student-search-header">
                    <h2><i class="fas fa-user-plus"></i> Placer un élève sur le créneau</h2>
                    <button class="close-btn" onclick="closeStudentSearchModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="student-search-body">
                    <div class="slot-info-box">
                        <div class="slot-info-item">
                            <i class="fas fa-calendar"></i>
                            <span>${new Date(slotInfo.dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <div class="slot-info-item">
                            <i class="fas fa-clock"></i>
                            <span>${slotInfo.start} - ${slotInfo.end}</span>
                        </div>
                        <div class="slot-info-item">
                            <i class="fas fa-user-tie"></i>
                            <span>Moniteur : ${slotInfo.instructor}</span>
                        </div>
                    </div>
                    
                    <div class="search-input-container">
                        <label for="slotStudentSearch">Rechercher un élève</label>
                        <div style="position: relative;">
                            <input 
                                type="text" 
                                id="slotStudentSearch" 
                                placeholder="Tapez le nom ou prénom de l'élève..."
                                autocomplete="off"
                                oninput="window.showSlotSuggestions && window.showSlotSuggestions(this.value)"
                                style="width: 100%; padding: 12px 16px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem;"
                            />
                            <i class="fas fa-search" style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: #999; pointer-events: none;"></i>
                        </div>
                        <div class="slot-autocomplete-suggestions" id="slotAutocompleteSuggestions"></div>
                    </div>
                    
                    <p style="margin-top: 1rem; font-size: 0.9rem; color: #666; font-style: italic;">
                        <i class="fas fa-info-circle"></i> Tapez au moins 2 lettres pour voir les suggestions
                    </p>
                </div>
            </div>
        </div>
    `;
    
    // Ajouter le CSS si n?cessaire
    if (!document.getElementById('studentSearchModalStyles')) {
        const style = document.createElement('style');
        style.id = 'studentSearchModalStyles';
        style.textContent = `
            .student-search-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10002;
                padding: 20px;
            }
            .student-search-content {
                background: white;
                border-radius: 16px;
                max-width: 600px;
                width: 100%;
                max-height: 90vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            }
            .student-search-header {
                padding: 24px;
                border-bottom: 2px solid #e0e0e0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 16px 16px 0 0;
            }
            .student-search-header h2 {
                margin: 0;
                font-size: 1.5rem;
            }
            .student-search-body {
                padding: 24px;
                overflow-y: auto;
            }
            .slot-info-box {
                background: #f8f9fa;
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 24px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .slot-info-item {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 0.95rem;
                color: #333;
            }
            .slot-info-item i {
                width: 20px;
                color: #667eea;
            }
            .search-input-container {
                margin-bottom: 16px;
            }
            .search-input-container label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #333;
            }
            .slot-autocomplete-suggestions {
                position: relative;
                background: white;
                border: 2px solid #667eea;
                border-top: none;
                border-radius: 0 0 12px 12px;
                max-height: 300px;
                overflow-y: auto;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: none;
                margin-top: -2px;
            }
            .slot-autocomplete-suggestions.active {
                display: block;
            }
            .slot-suggestion-item {
                padding: 12px 16px;
                cursor: pointer;
                transition: background 0.2s;
                border-bottom: 1px solid #e0e0e0;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .slot-suggestion-item:last-child {
                border-bottom: none;
            }
            .slot-suggestion-item:hover {
                background: #f8f9fa;
            }
            .slot-suggestion-icon {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 0.9rem;
            }
            .slot-suggestion-info {
                flex: 1;
            }
            .slot-suggestion-name {
                font-weight: 600;
                color: #333;
                margin-bottom: 2px;
            }
            .slot-suggestion-email {
                font-size: 0.8rem;
                color: #666;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Supprimer l'ancienne modal si elle existe
    const existingModal = document.getElementById('studentSearchModalSlot');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Ajouter la nouvelle modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Stocker les infos du créneau pour utilisation ult?rieure
    window.currentSlotInfo = slotInfo;
    
    // Ajouter l'?v?nement de recherche
    const searchInput = document.getElementById('slotStudentSearch');
    const suggestions = document.getElementById('slotAutocompleteSuggestions');
    if (searchInput) {
        let searchTimeout = null;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const searchTerm = e.target.value.trim().toLowerCase();
            
            searchTimeout = setTimeout(() => {
                showSlotSuggestions(searchTerm);
            }, 40);
        });
        
        // Focus automatique sur le champ de recherche
        setTimeout(() => searchInput.focus(), 100);
    }

    if (suggestions) {
        suggestions.addEventListener('click', (event) => {
            const item = event.target.closest('.suggestion-item[data-student-email]');
            if (!item) return;
            event.preventDefault();
            event.stopPropagation();
            selectStudentForSlot(item.dataset.studentEmail);
        });
    }
    
    // Fermer au clic sur le fond
    const modal = document.getElementById('studentSearchModalSlot');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeStudentSearchModal();
            }
        });
    }
};

window.closeStudentSearchModal = function() {
    const modal = document.getElementById('studentSearchModalSlot');
    if (modal) {
        modal.remove();
    }
    window.currentSlotInfo = null;
};

window.showSlotSuggestions = async function(searchTerm) {
    const input = document.getElementById('slotStudentSearch');
    if (input && typeof searchTerm === 'string' && input.value !== searchTerm) {
        input.value = searchTerm;
    }
    await window.searchStudent();
};

window.selectStudentForSlot = async function(studentEmail) {
    if (!window.currentSlotInfo) {
        alert('Erreur: Informations du créneau manquantes.');
        return;
    }
    
    try {
        const detailsPayload = await fetchAdminPlanningData({ type: 'student-details', email: studentEmail });
        const student = detailsPayload.student;
        if (!student) {
            alert('Ce compte eleve n est pas disponible. Verifiez d abord que son inscription a bien ete validee.');
            return;
        }
        student._reservations = detailsPayload.reservations || [];
        
        const slotInfo = window.currentSlotInfo;
        if (!slotInfo) {
            alert('Erreur: Informations du creneau manquantes.');
            return;
        }
        
        // R?server le créneau pour cet élève
        await bookStudentOnSlot(student, slotInfo);
        closeStudentSearchModal();
        
    } catch (err) {
        console.error('Error in selectStudentForSlot:', err);
        alert('Erreur lors de la sélection de l\'élève.');
    }
};

// Cr?e (ou met à jour) un compte utilisateur ? partir d'une notification d'inscription
// Utilis? quand un élève a pay? mais n'a pas encore de compte dans la table users
async function ensureUserAccountFromNotification(notif) {
    try {
        // Calculer le total des heures achet?es (somme de toutes les inscriptions)
        const { data: allNotifs } = await window.supabaseClient
            .from('inscription_notifications')
            .select('hours_purchased')
            .eq('user_email', notif.user_email);
        
        const hoursGoal = (allNotifs || []).reduce((sum, n) => sum + (n.hours_purchased || 0), 0);
        
        const parts = (notif.user_name || '').split(' ');
        const payload = {
            prenom: notif.user_prenom || parts[0] || '',
            nom: notif.user_nom || parts.slice(1).join(' ') || '',
            email: notif.user_email,
            telephone: notif.user_telephone || '',
            date_nais: notif.user_date_naissance || null,
            genre: notif.genre || null,
            adresse: notif.user_adresse || null,
            code_postal: notif.user_code_postal || null,
            ville: notif.user_ville || null,
            numero_neph: notif.numero_neph || null,
            forfait: notif.pack || null,
            hours_goal: hoursGoal,
            hours_completed_initial: 0,
            lesson_unit_minutes: notif.lesson_unit_minutes || 45,
            transmission_type: notif.transmission_type || 'manual'
        };
        
        // Hasher le mot de passe si disponible
        if (notif.user_password && window.hashPassword) {
            payload.password_hash = await window.hashPassword(notif.user_password);
        }
        
        const { error } = await window.supabaseClient
            .from('users')
            .upsert(payload, { onConflict: 'email' });
        
        if (error) {
            console.error('?O Erreur cr?ation compte depuis notification:', error);
            alert(`Erreur lors de la création du compte de l'élève: ${error.message}`);
            return null;
        }
        
        console.log('?o. Compte cr?? automatiquement depuis inscription_notifications:', notif.user_email);
        
        const { data: created } = await window.supabaseClient
            .from('users')
            .select('*')
            .eq('email', notif.user_email)
            .maybeSingle();
        
        return created;
    } catch (e) {
        console.error('?O Exception ensureUserAccountFromNotification:', e);
        alert('Erreur lors de la création du compte de l\'élève.');
        return null;
    }
}

window.bookStudentOnSlot = async function(student, slotInfo) {
    const bookingLockKey = student?.email && slotInfo
        ? `${student.email}|${slotInfo.dateStr}|${slotInfo.start}|${slotInfo.instructor}`
        : null;
    try {
        if (!student || !slotInfo || !slotInfo.instructor || !slotInfo.dateStr || !slotInfo.start || !slotInfo.end) {
            alert('Erreur: informations de reservation incompletes. Recharge la page puis reessaie.');
            return;
        }
        if (bookingLockKey && adminBookingLocks.has(bookingLockKey)) {
            console.warn('Reservation deja en cours, double clic ignore:', bookingLockKey);
            return;
        }
        if (bookingLockKey) adminBookingLocks.add(bookingLockKey);

        if (isNailNewPackSlot(slotInfo) && !isCourseBasedStudent(student)) {
            alert('Ce créneau Nail de 15h00 à 16h30 est réservé aux élèves avec un nouveau pack en cours de conduite.');
            return;
        }

        if (!isStudentCompatibleWithInstructor(student, slotInfo.instructor, slotInfo)) {
            const shouldContinue = confirm(
                `${planningModeWarning(student, slotInfo.instructor)}\n\n` +
                `Moniteur selectionne : ${slotInfo.instructor}\n` +
                `Creneau : ${slotInfo.start} - ${slotInfo.end}\n\n` +
                `Tu peux continuer quand meme si c'est volontaire. Confirmer ce choix ?`
            );
            if (!shouldContinue) return;
        }

        // Vérifier les heures restantes de l'élève
        const hoursGoal = student.hours_goal || 0;
        const hoursCompleted = student.hours_completed_initial || 0;
        
        let reservations = student._reservations || [];
        if (!reservations.length) {
            try {
                const { data, error: resError } = await window.supabaseClient
                    .from('reservations')
                    .select('*, slots(*)')
                    .eq('email', student.email)
                    .in('status', ['upcoming', 'pending']);

                if (resError) {
                    console.warn('Reservations directes indisponibles, utilisation du serveur uniquement:', resError);
                } else {
                    reservations = data || [];
                }
            } catch (resErr) {
                console.warn('Reservations directes indisponibles:', resErr);
            }
        }
        
        const hoursReserved = (reservations || []).reduce((sum, reservation) => {
            const slot = reservation.slots;
            if (!slot?.start_at || !slot?.end_at) return sum;
            const duration = (new Date(slot.end_at) - new Date(slot.start_at)) / (1000 * 60 * 60);
            return sum + lessonUnitsForDuration(student, duration);
        }, 0);
        const hoursRemaining = hoursGoal - hoursCompleted - hoursReserved;
        const slotDuration = (new Date(`${slotInfo.dateStr}T${slotInfo.end}:00`) - new Date(`${slotInfo.dateStr}T${slotInfo.start}:00`)) / (1000 * 60 * 60);
        const unitsToBook = lessonUnitsForDuration(student, slotDuration);
        const hoursRemainingAfter = Math.max(0, hoursRemaining - unitsToBook);
        const selectedVehicle = await resolveVehicleForBooking(student, slotInfo);
        if (!selectedVehicle) {
            alert('Choisis un véhicule pour placer cette séance.');
            return;
        }
        
        if (hoursRemaining < unitsToBook) {
            const shouldContinue = confirm(
                `ATTENTION : ${student.prenom} ${student.nom} n'a plus assez de ${studentUnitLabel(student)} disponibles dans son forfait.\n\n` +
                `Total : ${formatStudentBalance(student, hoursGoal)}\n` +
                `Effectué : ${formatStudentBalance(student, hoursCompleted)}\n` +
                `Réservé : ${formatStudentBalance(student, hoursReserved)}\n` +
                `Restant : ${formatStudentBalance(student, Math.max(0, hoursRemaining))}\n\n` +
                `Après cette réservation : ${formatStudentBalance(student, hoursRemainingAfter)} (forfait épuisé)\n\n` +
                `Voulez-vous quand même placer cet élève sur ce créneau ?`
            );
            
            if (!shouldContinue) {
                return;
            }
        }
        
        // Confirmer la réservation
        const slotDate = new Date(slotInfo.dateStr);
        const confirmMsg = `Confirmer la réservation ?\n\n` +
            `élève : ${student.prenom} ${student.nom}\n` +
            `Email : ${student.email}\n` +
            `Moniteur : ${slotInfo.instructor}\n` +
            `Véhicule : ${selectedVehicle.name} (${selectedVehicle.label})\n` +
            `Date : ${slotDate.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}\n` +
            `Horaire : ${slotInfo.start} - ${slotInfo.end}\n\n` +
            `Solde restant après cette réservation : ${formatStudentBalance(student, hoursRemainingAfter)} / ${formatStudentBalance(student, hoursGoal)}`;
        
        if (!confirm(confirmMsg)) {
            return;
        }
        
        // Construire les dates ISO pour Supabase
        const startAt = new Date(`${slotInfo.dateStr}T${slotInfo.start}:00`);
        const endAt = new Date(`${slotInfo.dateStr}T${slotInfo.end}:00`);
        
        // Normaliser le nom du moniteur
        const normalizedInstructor = normalizeInstructor(slotInfo.instructor);
        
        // R?server le créneau via la fonction serveur admin.
        console.log('?Y". Tentative de réservation:', {
            start: startAt.toISOString(),
            end: endAt.toISOString(),
            instructor: normalizedInstructor,
            instructorOriginal: slotInfo.instructor,
            student: `${student.prenom} ${student.nom}`,
            email: student.email
        });
        
        const bookingResult = await postAdminAction('admin-book-slot', {
            start_at: startAt.toISOString(),
            end_at: endAt.toISOString(),
            instructor: normalizedInstructor,
            email: student.email,
            first_name: student.prenom,
            last_name: student.nom,
            phone: student.telephone || '',
            forfait: student.forfait || student.pack || '',
            lesson_unit_minutes: isCourseBasedStudent(student) ? 45 : 120,
            transmission_type: isAutoStudent(student) ? 'auto' : 'manual',
            vehicle_id: selectedVehicle.id,
            vehicle_name: selectedVehicle.name
        });
        
        console.log('?o. Réservation cr??e avec succès! Slot ID:', bookingResult.slot_id, 'Reservation ID:', bookingResult.reservation_id);
        
        // Mettre à jour l'?tat pour afficher la semaine et le moniteur du créneau ajouté
        state.instructor = normalizedInstructor;
        state.weekStart = startOfWeek(new Date(slotInfo.dateStr));
        saveState();
        
        // Rafra?chir le planning sans recharger la page
        if (typeof window.refreshPlanning === 'function') {
            await window.refreshPlanning();
        } else {
            window.location.reload();
        }
        
    } catch (err) {
        console.error('Error booking student on slot:', err);
        const messages = {
            SLOT_NOT_AVAILABLE: 'Ce creneau vient d etre pris ou bloque. Recharge le planning.',
            STUDENT_TIME_CONFLICT: 'Cet eleve a deja une seance sur ce meme horaire.',
            VEHICLE_TIME_CONFLICT: 'Ce vehicule est deja utilise sur ce meme horaire. Choisis un autre vehicule ou un autre creneau.',
            INVALID_VEHICLE: 'Le vehicule choisi n est pas valide pour cette seance.',
            INCOMPATIBLE_PLANNING_MODE: 'Ce creneau est reserve a un autre type de forfait.',
            SUNDAY_CLOSED: 'L auto-ecole est fermee le dimanche.',
            INVALID_SLOT_DATA: 'Les informations du creneau sont incompletes.',
            AUTH_REQUIRED: 'Ta session admin a expire. Reconnecte-toi.'
        };
        alert(messages[err.message] || messages[err.payload?.error] || 'Erreur lors de la reservation. Recharge la page puis reessaie.');
    } finally {
        if (bookingLockKey) adminBookingLocks.delete(bookingLockKey);
    }
};

window.showSlotSelectionForStudent = async function(studentEmail, studentFirstName, studentLastName) {
    try {
        // Fermer la modal de détails de l'élève
        closeStudentDetails();
        
        // Récupérer les créneaux disponibles pour la semaine en cours
        const now = new Date();
        const weekStart = startOfWeek(now);
        const weekEnd = addDays(weekStart, 13); // 2 semaines
        
        // Récupérer tous les créneaux disponibles
        const { data: availableSlots, error: slotsError } = await window.supabaseClient
            .from('slots')
            .select('*')
            .eq('status', 'available')
            .gte('start_at', weekStart.toISOString())
            .lte('start_at', weekEnd.toISOString())
            .order('start_at', { ascending: true });
        
        if (slotsError) {
            console.error('Error fetching available slots:', slotsError);
            alert('Erreur lors de la récupération des créneaux disponibles.');
            return;
        }
        
        if (!availableSlots || availableSlots.length === 0) {
            alert('Aucun créneau disponible pour les 2 prochaines semaines.');
            return;
        }
        
        // Grouper les créneaux par moniteur
        const slotsByInstructor = {};
        availableSlots.forEach(slot => {
            if (!slotsByInstructor[slot.instructor]) {
                slotsByInstructor[slot.instructor] = [];
            }
            slotsByInstructor[slot.instructor].push(slot);
        });
        
        // Cr?er le HTML pour la sélection de créneau
        const instructorTabs = Object.keys(slotsByInstructor).map((instructor, index) => `
            <button class="instructor-tab ${index === 0 ? 'active' : ''}" 
                onclick="switchInstructorTab('${instructor}')" 
                data-instructor="${instructor}">
                ${instructor}
                <span class="tab-count">${slotsByInstructor[instructor].length}</span>
            </button>
        `).join('');
        
        const instructorPanels = Object.entries(slotsByInstructor).map(([instructor, slots], index) => {
            const slotsHtml = slots.map(slot => {
                const slotDate = new Date(slot.start_at);
                const dateStr = slotDate.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: '2-digit', 
                    month: 'long',
                    year: 'numeric'
                });
                const timeStr = `${String(slotDate.getHours()).padStart(2, '0')}:${String(slotDate.getMinutes()).padStart(2, '0')}`;
                const endDate = new Date(slot.end_at);
                const endTimeStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
                
                return `
                    <div class="slot-card" onclick="bookSlotForStudent('${slot.id}', '${studentEmail}', '${studentFirstName}', '${studentLastName}', '${instructor}', '${slot.start_at}', '${slot.end_at}')">
                        <div class="slot-date">
                            <i class="fas fa-calendar"></i>
                            ${dateStr}
                        </div>
                        <div class="slot-time">
                            <i class="fas fa-clock"></i>
                            ${timeStr} - ${endTimeStr}
                        </div>
                        <div class="slot-instructor">
                            <i class="fas fa-user-tie"></i>
                            ${instructor}
                        </div>
                    </div>
                `;
            }).join('');
            
            return `
                <div class="instructor-panel ${index === 0 ? 'active' : ''}" data-instructor="${instructor}">
                    <div class="slots-grid">
                        ${slotsHtml}
                    </div>
                </div>
            `;
        }).join('');
        
        const modalHtml = `
            <div class="slot-selection-modal" id="slotSelectionModal">
                <div class="slot-selection-content">
                    <div class="slot-selection-header">
                        <h2><i class="fas fa-calendar-plus"></i> Placer ${studentFirstName} ${studentLastName} sur le planning</h2>
                        <button class="close-btn" onclick="closeSlotSelection()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="slot-selection-body">
                        <div class="instructor-tabs">
                            ${instructorTabs}
                        </div>
                        <div class="instructor-panels">
                            ${instructorPanels}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Ajouter le CSS si n?cessaire
        if (!document.getElementById('slotSelectionStyles')) {
            const style = document.createElement('style');
            style.id = 'slotSelectionStyles';
            style.textContent = `
                .slot-selection-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10001;
                    padding: 20px;
                }
                .slot-selection-content {
                    background: white;
                    border-radius: 16px;
                    max-width: 900px;
                    width: 100%;
                    max-height: 90vh;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                }
                .slot-selection-header {
                    padding: 24px;
                    border-bottom: 2px solid #e0e0e0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 16px 16px 0 0;
                }
                .slot-selection-header h2 {
                    margin: 0;
                    font-size: 1.5rem;
                }
                .slot-selection-body {
                    padding: 24px;
                    overflow-y: auto;
                    flex: 1;
                }
                .instructor-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 24px;
                    border-bottom: 2px solid #e0e0e0;
                    padding-bottom: 10px;
                }
                .instructor-tab {
                    padding: 10px 20px;
                    border: none;
                    background: #f5f5f5;
                    border-radius: 8px 8px 0 0;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .instructor-tab.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .instructor-tab:hover:not(.active) {
                    background: #e0e0e0;
                }
                .tab-count {
                    background: rgba(255, 255, 255, 0.3);
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.85rem;
                }
                .instructor-tab.active .tab-count {
                    background: rgba(255, 255, 255, 0.3);
                }
                .instructor-panel {
                    display: none;
                }
                .instructor-panel.active {
                    display: block;
                }
                .slots-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 16px;
                }
                .slot-card {
                    background: #f8f9fa;
                    border: 2px solid #e0e0e0;
                    border-radius: 12px;
                    padding: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .slot-card:hover {
                    border-color: #667eea;
                    background: #f0f4ff;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
                }
                .slot-date, .slot-time, .slot-instructor {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                    font-size: 0.95rem;
                }
                .slot-date {
                    font-weight: 600;
                    color: #333;
                    text-transform: capitalize;
                }
                .slot-time {
                    color: #667eea;
                    font-weight: 600;
                }
                .slot-instructor {
                    color: #666;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Supprimer l'ancienne modal si elle existe
        const existingModal = document.getElementById('slotSelectionModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Ajouter la nouvelle modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
    } catch (err) {
        console.error('Error showing slot selection:', err);
        alert('Erreur lors de l\'affichage des créneaux.');
    }
};

window.switchInstructorTab = function(instructor) {
    // Mettre à jour les onglets
    document.querySelectorAll('.instructor-tab').forEach(tab => {
        if (tab.dataset.instructor === instructor) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Mettre à jour les panneaux
    document.querySelectorAll('.instructor-panel').forEach(panel => {
        if (panel.dataset.instructor === instructor) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });
};

window.closeSlotSelection = function() {
    const modal = document.getElementById('slotSelectionModal');
    if (modal) {
        modal.remove();
    }
};

window.bookSlotForStudent = async function(slotId, studentEmail, studentFirstName, studentLastName, instructor, startAt, endAt) {
    try {
        // Vérifier si l'élève existe dans la base de données
        const { data: student, error: studentError } = await window.supabaseClient
            .from('users')
            .select('*')
            .eq('email', studentEmail)
            .maybeSingle();
        
        if (studentError) {
            console.error('Error checking student:', studentError);
            alert('Erreur lors de la vérification de l\'élève.');
            return;
        }
        
        if (!student) {
            // L'élève n'existe pas dans la base de données
            const shouldRedirect = confirm(
                `L'élève ${studentFirstName} ${studentLastName} (${studentEmail}) n'est pas inscrit dans notre base de données.\n\n` +
                `Voulez-vous l'inscrire maintenant ?`
            );
            
            if (shouldRedirect) {
                // Rediriger vers la page d'inscription admin
                window.location.href = `inscription.html?admin=true&email=${encodeURIComponent(studentEmail)}&prenom=${encodeURIComponent(studentFirstName)}&nom=${encodeURIComponent(studentLastName)}`;
            }
            return;
        }
        
        // Vérifier les heures restantes de l'élève
        const hoursGoal = student.hours_goal || 0;
        const hoursCompleted = student.hours_completed_initial || 0;
        
        // Récupérer le nombre d'heures déjà r?serv?es
        const { data: reservations, error: resError } = await window.supabaseClient
            .from('reservations')
            .select('*, slots(*)')
            .eq('email', studentEmail)
            .in('status', ['upcoming', 'pending']);
        
        if (resError) {
            console.error('Error fetching reservations:', resError);
        }
        
        const hoursReserved = (reservations || []).reduce((sum, reservation) => {
            const slot = reservation.slots;
            if (!slot?.start_at || !slot?.end_at) return sum;
            const duration = (new Date(slot.end_at) - new Date(slot.start_at)) / (1000 * 60 * 60);
            return sum + lessonUnitsForDuration(student, duration);
        }, 0);
        const hoursRemaining = hoursGoal - hoursCompleted - hoursReserved;
        const slotDuration = (new Date(endAt) - new Date(startAt)) / (1000 * 60 * 60);
        const unitsToBook = lessonUnitsForDuration(student, slotDuration);
        
        if (hoursRemaining < unitsToBook) {
            const shouldContinue = confirm(
                `Attention : ${studentFirstName} ${studentLastName} n'a plus assez de ${studentUnitLabel(student)} disponibles dans son forfait.\n\n` +
                `Total : ${formatStudentBalance(student, hoursGoal)}\n` +
                `Effectué : ${formatStudentBalance(student, hoursCompleted)}\n` +
                `Réservé : ${formatStudentBalance(student, hoursReserved)}\n` +
                `Restant : ${formatStudentBalance(student, hoursRemaining)}\n\n` +
                `Voulez-vous quand même placer cet élève sur ce créneau ?`
            );
            
            if (!shouldContinue) {
                return;
            }
        }
        
        // Confirmer la réservation
        const confirmMsg = `Confirmer la réservation ?\n\n` +
            `élève : ${studentFirstName} ${studentLastName}\n` +
            `Email : ${studentEmail}\n` +
            `Moniteur : ${instructor}\n` +
            `Date : ${new Date(startAt).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}\n` +
            `Horaire : ${new Date(startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(endAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n\n` +
            `Solde restant après cette réservation : ${formatStudentBalance(student, hoursRemaining - unitsToBook)}`;
        
        if (!confirm(confirmMsg)) {
            return;
        }
        
        // Récupérer le téléphone de l'élève
        const studentPhone = student.telephone || '';
        
        // R?server le créneau via la fonction book_slot
        const { data: bookingResult, error: bookingError } = await window.supabaseClient
            .rpc('book_slot', {
                p_start_at: startAt,
                p_end_at: endAt,
                p_instructor: instructor,
                p_email: studentEmail,
                p_first_name: studentFirstName,
                p_last_name: studentLastName,
                p_phone: studentPhone
            });
        
        if (bookingError) {
            console.error('Error booking slot:', bookingError);
            return;
        }
        
        if (!bookingResult || !bookingResult.ok) {
            console.error('Impossible de r?server ce créneau:', bookingResult?.error || 'Erreur inconnue');
            return;
        }
        
        // Fermer la modal de sélection
        closeSlotSelection();
        
        // Mettre à jour l'?tat pour afficher la semaine et le moniteur du créneau ajouté
        state.instructor = normalizeInstructor(instructor);
        state.weekStart = startOfWeek(new Date(startAt));
        saveState();
        
        // Rafra?chir le planning sans recharger la page
        await refresh();
        
    } catch (err) {
        console.error('Error booking slot for student:', err);
    }
};

// ============================================
// LISTE D'ATTENTE POUR D?SISTEMENTS
// ============================================

async function loadWaitlist() {
    const container = document.getElementById('waitlistContainer');
    if (!container) return;
    
    try {
        // Charger tous les élèves intéressés par les d?sistements
        const { data: students, error } = await window.supabaseClient
            .from('student_availability')
            .select('*')
            .eq('wants_cancellation_notifications', true)
            .order('user_name', { ascending: true });
        
        if (error) {
            console.error('Error loading waitlist:', error);
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--red);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Erreur lors du chargement de la liste d'attente</p>
                </div>
            `;
            return;
        }
        
        if (!students || students.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text2);">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Aucun élève n'a configur? ses disponibilités pour le moment</p>
                </div>
            `;
            return;
        }
        
        // Afficher les élèves
        const daysMap = {
            'lundi': 'Lundi',
            'mardi': 'Mardi',
            'mercredi': 'Mercredi',
            'jeudi': 'Jeudi',
            'vendredi': 'Vendredi',
            'samedi': 'Samedi'
        };
        
        const studentsHTML = students.map(student => {
            const availabilitySlots = student.availability_slots || {};
            const availabilityWeeks = student.availability_weeks || [];
            const daysWithSlots = Object.keys(availabilitySlots).filter(day => availabilitySlots[day] && availabilitySlots[day].length > 0);
            
            // Formater les semaines avec les vraies dates
            const getWeekDates = (weekValue) => {
                if (weekValue === 'toutes') return 'Toutes les semaines';
                
                const today = new Date();
                const currentDay = today.getDay();
                const daysUntilMonday = currentDay === 0 ? -6 : 1 - currentDay;
                const thisMonday = new Date(today);
                thisMonday.setDate(today.getDate() + daysUntilMonday);
                
                const weekNumber = parseInt(weekValue.replace('semaine', '')) - 1;
                const weekStart = new Date(thisMonday);
                weekStart.setDate(thisMonday.getDate() + (weekNumber * 7));
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                
                const startStr = weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                const endStr = weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                
                return `Du ${startStr} au ${endStr}`;
            };
            
            const weeksHTML = availabilityWeeks.length > 0 ? `
                <div style="margin-bottom: 1rem; padding: 0.75rem; background: #fff3e0; border-radius: 8px; border-left: 3px solid #ff9800;">
                    <strong style="color: #e65100; display: block; margin-bottom: 0.5rem;">
                        <i class="fas fa-calendar-week"></i> Semaines disponibles:
                    </strong>
                    <div style="color: #f57c00; font-size: 0.9rem;">
                        ${availabilityWeeks.map(week => getWeekDates(week)).join(', ')}
                    </div>
                </div>
            ` : '';
            
            // Cr?er un mini-planning visuel
            // Les créneaux stock?s sont au format '07:00-09:00', '09:00-11:00', etc.
            // Les jours sont en minuscule : 'lundi', 'mardi', etc.
            const miniTimeSlots = [
                { label: '07-09h', value: '07:00-09:00' },
                { label: '09-11h', value: '09:00-11:00' },
                { label: '11-13h', value: '11:00-13:00' },
                { label: '13-15h', value: '13:00-15:00' },
                { label: '15-17h', value: '15:00-17:00' },
                { label: '17-19h', value: '17:00-19:00' }
            ];
            
            const miniDaysOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
            const miniDaysLabels = { lundi: 'Lun', mardi: 'Mar', mercredi: 'Mer', jeudi: 'Jeu', vendredi: 'Ven', samedi: 'Sam' };
            
            const availabilityHTML = `
                <div style="background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="padding: 6px; border: 1px solid #e0e0e0; font-weight: 600; text-align: left; width: 60px;"></th>
                                ${miniDaysOrder.map(day => `
                                    <th style="padding: 4px; border: 1px solid #e0e0e0; font-weight: 600; text-align: center; font-size: 0.7rem;">
                                        ${miniDaysLabels[day]}
                                    </th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${miniTimeSlots.map(slot => `
                                <tr>
                                    <td style="padding: 4px; border: 1px solid #e0e0e0; font-weight: 600; color: #666; background: #fafafa; font-size: 0.65rem;">
                                        ${slot.label}
                                    </td>
                                    ${miniDaysOrder.map(day => {
                                        const isAvailable = availabilitySlots[day] && availabilitySlots[day].includes(slot.value);
                                        return `
                                            <td style="padding: 4px; border: 1px solid #e0e0e0; text-align: center; background: ${isAvailable ? '#d4edda' : 'white'};">
                                                ${isAvailable ? '<i class="fas fa-check" style="color: #28a745; font-size: 0.8rem;"></i>' : ''}
                                            </td>
                                        `;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            return `
                <div style="background: #f8f9fa; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; border-left: 4px solid var(--orange); position: relative;">
                    <!-- Bouton de suppression -->
                    <button onclick="deleteStudentAvailability('${student.user_email}')" style="position: absolute; top: 1rem; right: 1rem; width: 32px; height: 32px; border-radius: 50%; border: none; background: var(--red); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; transition: all 0.2s;" title="Supprimer les disponibilités de cet élève">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                        <!-- Informations personnelles -->
                        <div>
                            <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; color: var(--text); padding-right: 2.5rem;">
                                <i class="fas fa-user" style="color: var(--orange);"></i>
                                ${student.user_name || 'Nom non renseign?'}
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <i class="fas fa-envelope" style="color: var(--text2); width: 20px;"></i>
                                    <a href="mailto:${student.user_email}" style="color: var(--blue); text-decoration: none;">
                                        ${student.user_email}
                                    </a>
                                </div>
                                ${student.user_phone ? `
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <i class="fas fa-phone" style="color: var(--text2); width: 20px;"></i>
                                        <a href="tel:${student.user_phone}" style="color: var(--blue); text-decoration: none; font-weight: 600;">
                                            ${student.user_phone}
                                        </a>
                                    </div>
                                ` : ''}
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <i class="fas fa-clock" style="color: var(--text2); width: 20px;"></i>
                                    <span style="color: var(--text2); font-size: 0.9rem;">
                                        Inscrit le ${new Date(student.created_at).toLocaleDateString('fr-FR')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Disponibilit?s -->
                        <div>
                            <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: var(--text);">
                                <i class="fas fa-calendar-check" style="color: var(--green);"></i>
                                Disponibilit?s
                            </h4>
                            <div style="font-size: 0.9rem; color: var(--text);">
                                ${weeksHTML}
                                ${availabilityHTML || '<p style="color: var(--text2);">Aucune disponibilit? configur?e</p>'}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(0,0,0,0.1); display: flex; gap: 0.75rem;">
                        ${student.user_phone ? `
                            <a href="tel:${student.user_phone}" style="padding: 0.5rem 1rem; border-radius: 8px; background: var(--green); color: white; text-decoration: none; font-size: 0.9rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-phone"></i> Appeler
                            </a>
                        ` : ''}
                        <a href="mailto:${student.user_email}" style="padding: 0.5rem 1rem; border-radius: 8px; background: var(--blue); color: white; text-decoration: none; font-size: 0.9rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-envelope"></i> Envoyer un email
                        </a>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = `
            <div style="margin-bottom: 1rem; padding: 1rem; background: #e3f2fd; border-radius: 8px; border-left: 4px solid var(--blue);">
                <p style="margin: 0; color: #0d47a1; font-weight: 600;">
                    <i class="fas fa-info-circle"></i> 
                    ${students.length} élève${students.length > 1 ? 's' : ''} dans la liste d'attente
                </p>
            </div>
            ${studentsHTML}
        `;
        
    } catch (err) {
        console.error('Error loading waitlist:', err);
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--red);">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Erreur lors du chargement de la liste d'attente</p>
            </div>
        `;
    }
}

window.refreshWaitlist = function() {
    loadWaitlist();
};

window.deleteStudentAvailability = async function(userEmail) {
    if (!confirm(`Supprimer les disponibilités de cet élève ?\n\nEmail : ${userEmail}\n\nCette action est irréversible.`)) {
        return;
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('student_availability')
            .delete()
            .eq('user_email', userEmail);
        
        if (error) {
            console.error('Error deleting availability:', error);
            alert('Erreur lors de la suppression. Réessaie.');
            return;
        }
        
        alert('Disponibilités supprimées avec succès !');
        loadWaitlist(); // Recharger la liste
        
    } catch (err) {
        console.error('Error deleting availability:', err);
        alert('Erreur lors de la suppression. Réessaie.');
    }
};

// ?.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.?
// NOTES ADMIN FUNCTIONALITY
// ?.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.??.?

// Sauvegarder les notes admin pour un élève
window.saveAdminNotes = async function(studentEmail) {
    const textarea = document.getElementById('adminNotesTextarea');
    if (!textarea) return;
    
    const notes = textarea.value.trim();
    
    try {
        const { error } = await window.supabaseClient
            .from('users')
            .update({ notes_admin: notes })
            .eq('email', studentEmail);
        
        if (error) throw error;
        
        // Notification de succès
        const btn = event.target.closest('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Sauvegard? !';
        btn.style.background = '#218838';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '#28a745';
        }, 2000);
        
    } catch (err) {
        console.error('Erreur sauvegarde notes:', err);
        alert('Erreur lors de la sauvegarde des notes.');
    }
};

// Effacer les notes admin pour un élève
window.clearAdminNotes = async function(studentEmail) {
    if (!confirm('Effacer ces notes ?')) return;
    
    const textarea = document.getElementById('adminNotesTextarea');
    if (!textarea) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('users')
            .update({ notes_admin: null })
            .eq('email', studentEmail);
        
        if (error) throw error;
        
        textarea.value = '';
        
        // Notification de succès
        const btn = event.target.closest('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Effac? !';
        btn.style.background = '#c82333';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '#dc3545';
        }, 2000);
        
    } catch (err) {
        console.error('Erreur effacement notes:', err);
        alert('Erreur lors de l\'effacement des notes.');
    }
};

// Charger la liste d'attente au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Masquer Mylène à partir du 1er mai 2026
    const today = new Date();
    const mayFirst2026 = new Date('2026-05-01T00:00:00');
    const myleneBtn = document.getElementById('myleneBtn');
    
    if (myleneBtn && today >= mayFirst2026) {
        myleneBtn.style.display = 'none';
        console.log('Mylène masquée - indisponible à partir du 1er mai 2026');
    }
    
    // Attendre un peu pour s'assurer que Supabase est charg?
    console.log('?? setTimeout d?clench? pour charger les moniteurs...');
    setTimeout(() => {
        console.log('?o. setTimeout ex?cut?, appel de loadInstructors()...');
        // Charger les moniteurs depuis Supabase
        loadInstructors();
        
        loadWaitlist();
        
        // Charger les taux de r?ussite et d?tecter le moniteur actif
        loadInstructorSuccessRates().then(() => {
            // D?tecter le moniteur actif après le chargement des données
            const activeBtn = document.querySelector('#instructorSegment button.active');
            const currentInstructor = activeBtn ? activeBtn.dataset.instructor : null;
            
            if (currentInstructor && window.refreshInstructorDisplay) {
                window.refreshInstructorDisplay(currentInstructor);
            }
        });
        
        startSuccessRateAutoRefresh();
        
        // Note : la sélection de moniteur (planning + taux de r?ussite) est
        // g?r?e par la d?l?gation d'?v?nement sur #instructorSegment dans l'IIFE.
        // Pas besoin d'attacher d'?couteurs individuels ici.
    }, 500);
});

// ============================================
// PLANNING D?SISTEMENTS
// ============================================

async function loadDesistementsPlanning() {
    const container = document.getElementById('desistementsPlanning');
    try {
        console.log('?Y". Chargement du planning d?sistements...');
        
        if (!container) return;
        
        const payload = await fetchAdminPlanningData({ type: 'student-availabilities' });
        const enrichedAvailabilities = payload.availabilities || [];

        console.log(`?o. ${enrichedAvailabilities.length} élèves avec disponibilités`);
        
        // G?n?rer le planning visuel
        generateDesistementsGrid(enrichedAvailabilities, container);
        
    } catch (err) {
        console.error('Erreur:', err);
        if (container) {
            container.innerHTML = `
                <div style="padding: 1rem; border: 1px solid #fecdd3; background: #fff1f2; color: #be123c; border-radius: 12px; font-weight: 600;">
                    Impossible de charger les disponibilités élèves pour le moment.
                </div>
            `;
        }
    }
}

function generateDesistementsGrid(availabilities, container) {
    const daysOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const daysLabels = { lundi: 'LUN', mardi: 'MAR', mercredi: 'MER', jeudi: 'JEU', vendredi: 'VEN', samedi: 'SAM' };
    
    const adminWeekOffset = Math.max(0, Number(desistementWeekOffset || 0));
    const targetSemaineKey = `semaine${adminWeekOffset + 1}`;
    
    const today = new Date();
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff + (adminWeekOffset * 7));
    
    const weekDates = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        weekDates.push(d);
    }
    
    const weekStartStr = weekDates[0].toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' });
    const weekEndStr = weekDates[5].toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    
    // Stocker les dispo pour le onclick
    window._desistAvailabilities = availabilities;
    
    function normalizePackText(value) {
        return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function isAcceleratedAvailability(student) {
        const profile = student?._profile || {};
        return normalizePackText([
            student.forfait,
            student.pack,
            student.pack_label,
            profile.forfait,
            profile.pack
        ].filter(Boolean).join(' ')).includes('accelere');
    }

    function isCourseBasedAvailability(student) {
        const profile = student?._profile || {};
        const explicitUnit = Number(student?.lesson_unit_minutes || profile.lesson_unit_minutes || 0);
        if (explicitUnit === 45) return true;
        return [
            student.forfait,
            student.pack,
            student.pack_label,
            profile.forfait,
            profile.pack
        ].some(isCourseBasedPack);
    }

    function desistementColor(student) {
        return isAcceleratedAvailability(student)
            ? { bg: '#ef4444', shadow: 'rgba(239,68,68,0.28)', label: 'Ancien pack accelere prioritaire' }
            : { bg: '#34c759', shadow: 'rgba(52,199,89,0.24)', label: 'Disponible' };
    }

    function formatDesistementTime(value) {
        return String(value || '').replace(':', 'h');
    }

    function parseDesistementSlot(value) {
        const match = String(value || '').match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
        if (!match) return null;
        const startMinutes = timeToMinutes(match[1]);
        const endMinutes = timeToMinutes(match[2]);
        if (endMinutes <= startMinutes) return null;
        return {
            label: formatDesistementTime(match[1]),
            value,
            end: formatDesistementTime(match[2]),
            startMinutes,
            endMinutes
        };
    }

    function parseAvailabilityWeeks(avail) {
        const rawWeeks = avail?.availability_weeks || [];
        if (Array.isArray(rawWeeks)) return rawWeeks;
        try {
            const parsed = JSON.parse(rawWeeks);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return String(rawWeeks || '')
                .split(',')
                .map((week) => week.trim())
                .filter(Boolean);
        }
    }

    function parseAvailabilitySlots(avail) {
        const rawSlots = avail?.availability_slots || {};
        if (rawSlots && typeof rawSlots === 'object') return rawSlots;
        try {
            return JSON.parse(rawSlots || '{}') || {};
        } catch (error) {
            return {};
        }
    }

    function availabilityWeeksMatch(avail) {
        const weeks = parseAvailabilityWeeks(avail);
        return weeks.includes(targetSemaineKey) || weeks.includes('toutes');
    }

    const weekAvailabilities = availabilities.filter(availabilityWeeksMatch);
    const weekCourseCount = weekAvailabilities.filter(isCourseBasedAvailability).length;
    const weekHourCount = Math.max(0, weekAvailabilities.length - weekCourseCount);
    const otherWeekCourseCount = availabilities.filter((avail) => isCourseBasedAvailability(avail) && !availabilityWeeksMatch(avail)).length;

    const timeSlotMap = new Map();
    weekAvailabilities.forEach((avail) => {
        const slots = parseAvailabilitySlots(avail);
        Object.values(slots || {}).forEach((daySlots) => {
            (Array.isArray(daySlots) ? daySlots : []).forEach((value) => {
                const slot = parseDesistementSlot(value);
                if (slot) timeSlotMap.set(value, slot);
            });
        });
    });

    const timeSlots = Array.from(timeSlotMap.values()).sort((a, b) => {
        const startDiff = a.startMinutes - b.startMinutes;
        return startDiff || (a.endMinutes - b.endMinutes);
    });

    let html = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
            <div style="font-size: 1.05rem; font-weight: 600; color: #1d1d1f; letter-spacing: -0.01em;">
                ${weekStartStr} &rarr; ${weekEndStr}
            </div>
            <div style="display: flex; gap: 6px;">
                <button onclick="changeDesistementWeek(-1)" style="width: 36px; height: 36px; border: none; border-radius: 10px; background: #f5f5f7; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; color: #1d1d1f;" onmouseover="this.style.background='#e8e8ed'" onmouseout="this.style.background='#f5f5f7'">
                    <i class="fas fa-chevron-left" style="font-size: 0.8rem;"></i>
                </button>
                <button onclick="changeDesistementWeek(1)" style="width: 36px; height: 36px; border: none; border-radius: 10px; background: #f5f5f7; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; color: #1d1d1f;" onmouseover="this.style.background='#e8e8ed'" onmouseout="this.style.background='#f5f5f7'">
                    <i class="fas fa-chevron-right" style="font-size: 0.8rem;"></i>
                </button>
            </div>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 1rem;">
            <span style="display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border-radius:999px;background:#f4f4f5;color:#27272a;font-size:0.8rem;font-weight:600;">
                ${weekAvailabilities.length} élève(s) cette semaine
            </span>
            <span style="display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border-radius:999px;background:#fff1f2;color:#be123c;font-size:0.8rem;font-weight:700;">
                ${weekCourseCount} nouveau(x) pack(s) 45 min
            </span>
            <span style="display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border-radius:999px;background:#f0fdf4;color:#166534;font-size:0.8rem;font-weight:700;">
                ${weekHourCount} ancien(s) pack(s) 2h
            </span>
            ${otherWeekCourseCount > 0 ? `<span style="display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border-radius:999px;background:#fff7ed;color:#9a3412;font-size:0.8rem;font-weight:700;">${otherWeekCourseCount} nouveau(x) pack(s) sur une autre semaine</span>` : ''}
        </div>
    `;

    if (timeSlots.length === 0) {
        html += `
            <div style="padding: 1rem; border: 1px solid #e5e7eb; background: #f8fafc; color: #475569; border-radius: 12px; line-height: 1.45;">
                <strong>Aucune disponibilité déclarée sur cette semaine.</strong>
                ${otherWeekCourseCount > 0 ? `<br>${otherWeekCourseCount} élève(s) en nouveau pack ont déclaré des disponibilités sur une autre semaine. Utilise la flèche de droite pour les afficher.` : ''}
            </div>
        `;
        container.innerHTML = html;
        return;
    }

    html += `
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04);">
            <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                <colgroup>
                    <col style="width: 80px;">
                    <col span="6">
                </colgroup>
                <thead>
                    <tr>
                        <th style="padding: 14px 4px; text-align: center; background: white; border-bottom: 1px solid #f0f0f0;"></th>
                        ${daysOfWeek.map((day, i) => {
                            const isToday = weekDates[i].toDateString() === today.toDateString();
                            return `
                            <th style="padding: 12px 4px; text-align: center; background: white; border-bottom: 1px solid #f0f0f0;">
                                <div style="font-size: 0.7rem; font-weight: 600; color: ${isToday ? '#e83e8c' : '#86868b'}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">${daysLabels[day]}</div>
                                <div style="font-size: 1.25rem; font-weight: 700; color: ${isToday ? 'white' : '#1d1d1f'}; width: 34px; height: 34px; line-height: 34px; margin: 0 auto; border-radius: 50%; ${isToday ? 'background: #e83e8c;' : ''}">${weekDates[i].getDate()}</div>
                            </th>`;
                        }).join('')}
                    </tr>
                </thead>
                <tbody>
    `;
    
    timeSlots.forEach((slot, slotIdx) => {
        html += `<tr>`;
        html += `<td style="padding: 8px 4px; text-align: center; font-size: 0.78rem; font-weight: 600; color: #86868b; vertical-align: middle; border-bottom: 1px solid #f5f5f5;">
            <div>${slot.label}</div>
            <div style="font-size: 0.62rem; font-weight: 400; color: #b0b0b5;">${slot.end}</div>
        </td>`;
        
        daysOfWeek.forEach((dayName, dayIdx) => {
            const availableStudents = weekAvailabilities.filter(avail => {
                const slots = parseAvailabilitySlots(avail);
                if (!slots || !slots[dayName]) return false;
                return slots[dayName].includes(slot.value);
            });
            
            const dateStr = weekDates[dayIdx].toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
            const creneauStr = `${slot.label} - ${slot.end}`;
            
            html += `<td style="padding: 4px; vertical-align: top; border-bottom: 1px solid #f5f5f5; border-left: 1px solid #f5f5f5;">`;
            
            if (availableStudents.length > 0) {
                availableStudents.forEach(student => {
                    const escapedEmail = (student.user_email || '').replace(/'/g, "\\'");
                    const initials = (student.user_name || '').split(' ').map(n => n[0]).join('').toUpperCase();
                    const studentColor = desistementColor(student);
                    html += `
                        <div onclick="showDesistementStudentModal('${escapedEmail}', '${dateStr}', '${creneauStr}')"
                             title="${studentColor.label}"
                             style="background: ${studentColor.bg}; color: white; padding: 4px 6px; border-radius: 8px; margin: 2px; font-size: 0.72rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; display: flex; align-items: center; gap: 4px; overflow: hidden;"
                             onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 3px 10px ${studentColor.shadow}';"
                             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                            <span style="width: 20px; height: 20px; min-width: 20px; border-radius: 50%; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; font-size: 0.58rem;">${initials}</span>
                            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${student.user_name}</span>
                            ${isAcceleratedAvailability(student) ? '<span style="margin-left:auto;font-size:0.58rem;font-weight:800;background:rgba(255,255,255,0.22);border-radius:999px;padding:2px 5px;">30J</span>' : ''}
                        </div>
                    `;
                });
            }
            
            html += `</td>`;
        });
        
        html += `</tr>`;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// Navigation par semaine du planning d?sistements
let desistementWeekOffset = 0;

window.changeDesistementWeek = async function(direction) {
    desistementWeekOffset += direction;
    if (desistementWeekOffset < 0) desistementWeekOffset = 0;
    if (desistementWeekOffset > 3) desistementWeekOffset = 3;
    
    if (!window.planningState) window.planningState = {};
    window.planningState.weekOffset = desistementWeekOffset;
    
    await loadDesistementsPlanning();
};

// Modal détaillée de l'élève (style Apple)
window.showDesistementStudentModal = async function(email, dateStr, creneauStr) {
    const cachedAvailability = (window._desistAvailabilities || []).find((item) => (
        String(item.user_email || '').toLowerCase() === String(email || '').toLowerCase()
    ));

    let studentData = cachedAvailability?._profile || null;
    let availData = cachedAvailability || null;

    if (!studentData && window.supabaseClient) {
        try {
            const { data } = await window.supabaseClient
                .from('users')
                .select('prenom, nom, email, telephone, forfait, hours_completed, hours_goal, lesson_unit_minutes')
                .eq('email', email)
                .maybeSingle();
            studentData = data;
        } catch (e) {
            console.error('Erreur récupération élève:', e);
        }
    }
    
    if (!availData && window.supabaseClient) {
        try {
            const { data } = await window.supabaseClient
                .from('student_availability')
                .select('user_name, user_phone')
                .eq('user_email', email)
                .maybeSingle();
            availData = data;
        } catch (e) {}
    }
    
    const prenom = studentData?.prenom || availData?.user_name?.split(' ')[0] || '-';
    const nom = studentData?.nom || availData?.user_name?.split(' ').slice(1).join(' ') || '-';
    const telephone = studentData?.telephone || availData?.user_phone || '-';
    const forfait = studentData?.forfait || '-';
    const hoursCompleted = studentData?.hours_completed || 0;
    const hoursGoal = studentData?.hours_goal || 0;
    const balanceText = `${formatStudentBalance(studentData, hoursCompleted)} / ${formatStudentBalance(studentData, hoursGoal)}`;
    const initials = `${prenom[0] || ''}${nom[0] || ''}`.toUpperCase();
    
    // Supprimer modal existante
    const existing = document.getElementById('desistementModal');
    if (existing) existing.remove();
    
    const modalHTML = `
        <div id="desistementModal" style="position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); animation: fadeIn 0.2s ease;" onclick="if(event.target===this) this.remove()">
            <div style="background: white; border-radius: 20px; width: 420px; max-width: 92vw; box-shadow: 0 24px 80px rgba(0,0,0,0.2); overflow: hidden; animation: slideUp 0.3s ease;">
                
                <!-- Header -->
                <div style="padding: 24px 24px 16px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #34c759, #30b350); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem;">${initials}</div>
                        <h3 style="font-size: 1.15rem; font-weight: 700; color: #1d1d1f; margin: 0;">Détails de l'élève</h3>
                    </div>
                    <button onclick="document.getElementById('desistementModal').remove()" style="width: 32px; height: 32px; border-radius: 50%; border: none; background: #f5f5f7; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #86868b; transition: all 0.15s;" onmouseover="this.style.background='#e8e8ed'" onmouseout="this.style.background='#f5f5f7'">
                        <i class="fas fa-times" style="font-size: 0.85rem;"></i>
                    </button>
                </div>
                
                <!-- Créneau -->
                <div style="margin: 0 24px; padding: 12px 16px; background: #fff8e1; border-radius: 12px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-calendar" style="color: #f5a623; font-size: 1rem;"></i>
                    <div>
                        <div style="font-weight: 700; color: #1d1d1f; font-size: 0.9rem;">CRÉNEAU</div>
                        <div style="color: #0071e3; font-weight: 600; font-size: 0.85rem;">${dateStr} - ${creneauStr}</div>
                    </div>
                </div>
                
                <!-- Infos -->
                <div style="padding: 20px 24px;">
                    <div style="display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #f0f0f0;">
                        <span style="font-weight: 600; color: #86868b; font-size: 0.9rem;">PRÉNOM</span>
                        <span style="font-weight: 700; color: #1d1d1f; font-size: 0.9rem;">${prenom.toUpperCase()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #f0f0f0;">
                        <span style="font-weight: 600; color: #86868b; font-size: 0.9rem;">NOM</span>
                        <span style="font-weight: 700; color: #1d1d1f; font-size: 0.9rem;">${nom.toUpperCase()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #f0f0f0;">
                        <span style="font-weight: 600; color: #86868b; font-size: 0.9rem;">TÉLÉPHONE</span>
                        <a href="tel:${telephone}" style="font-weight: 700; color: #0071e3; text-decoration: none; font-size: 0.9rem;">${telephone}</a>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #f0f0f0;">
                        <span style="font-weight: 600; color: #86868b; font-size: 0.9rem;">EMAIL</span>
                        <a href="mailto:${email}" style="font-weight: 700; color: #0071e3; text-decoration: none; font-size: 0.9rem;">${email}</a>
                    </div>
                    
                    <!-- Forfait -->
                    <div style="margin-top: 16px; padding: 12px 16px; background: #fff8e1; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; color: #1d1d1f; font-size: 0.9rem;"><i class="fas fa-box" style="color: #f5a623; margin-right: 6px;"></i> FORFAIT</span>
                        <span style="font-weight: 600; color: #1d1d1f; font-size: 0.9rem;">${forfait}</span>
                    </div>
                    
                    <!-- Heures -->
                    <div style="margin-top: 8px; padding: 12px 16px; background: #e8f5e9; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; color: #1d1d1f; font-size: 0.9rem;"><i class="fas fa-clock" style="color: #34c759; margin-right: 6px;"></i> HEURES DE CONDUITE</span>
                        <span style="font-weight: 600; color: #1d1d1f; font-size: 0.9rem;">${balanceText}</span>
                    </div>
                </div>
                
                <!-- Actions -->
                <div style="padding: 0 24px 24px; display: flex; gap: 8px;">
                    ${telephone && telephone !== '-' ? `
                        <a href="tel:${telephone}" style="flex: 1; padding: 14px; border-radius: 14px; background: #34c759; color: white; text-decoration: none; text-align: center; font-weight: 700; font-size: 0.95rem; transition: all 0.15s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-phone"></i> Appeler
                        </a>
                    ` : ''}
                    <a href="mailto:${email}" style="flex: 1; padding: 14px; border-radius: 14px; background: #0071e3; color: white; text-decoration: none; text-align: center; font-weight: 700; font-size: 0.95rem; transition: all 0.15s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                        <i class="fas fa-envelope"></i> Email
                    </a>
                </div>
            </div>
        </div>
        <style>
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

