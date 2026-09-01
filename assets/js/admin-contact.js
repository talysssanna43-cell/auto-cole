let allContactRequests = [];
let contactPageInitialized = false;
let selectedAgendaDate = '';

const ADVISOR_CALLBACK_SLOTS = [
    'entre 09h00 et 10h00',
    'entre 10h00 et 11h00',
    'entre 11h00 et 12h00',
    'entre 14h00 et 15h00',
    'entre 15h00 et 16h00',
    'entre 16h00 et 17h00',
    'entre 17h00 et 18h00'
];

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

function safeRequestId(value) {
    const id = String(value || '');
    return /^[a-z0-9-]{8,}$/i.test(id) ? id : '';
}

function safeTelephone(value) {
    return String(value || '').replace(/[^0-9+(). -]/g, '').trim();
}

function telHref(value) {
    const cleaned = safeTelephone(value).replace(/[^\d+]/g, '');
    return cleaned ? `tel:${cleaned}` : '';
}

function mailHref(value) {
    const address = String(value || '').trim().replace(/[^\w.+@-]/g, '');
    return address ? `mailto:${address}` : '';
}

function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDay(value) {
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return 'Date non précisée';
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function formatAgendaDate(value) {
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return 'Jour non précisé';
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
}

function toLocalIso(date) {
    const localDate = new Date(date);
    localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
    return localDate.toISOString().slice(0, 10);
}

function todayIso() {
    return toLocalIso(new Date());
}

function createdDayIso(request) {
    const date = new Date(request.created_at || Date.now());
    if (Number.isNaN(date.getTime())) return todayIso();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
}

function prefixedLine(message, labels) {
    const lines = String(message || '').split(/\r?\n/);
    for (const line of lines) {
        const lower = line.toLowerCase();
        for (const label of labels) {
            const prefix = `${label.toLowerCase()}:`;
            if (lower.startsWith(prefix)) {
                return line.slice(line.indexOf(':') + 1).trim();
            }
        }
    }
    return '';
}

function slotSortKey(slot) {
    const normalized = String(slot || '').toLowerCase();
    const knownIndex = ADVISOR_CALLBACK_SLOTS.findIndex((knownSlot) => knownSlot.toLowerCase() === normalized);
    if (knownIndex >= 0) return knownIndex * 100;

    const match = normalized.match(/(\d{1,2})\s*h\s*(\d{2})?/);
    if (!match) return 9999;
    return Number(match[1]) * 60 + Number(match[2] || 0);
}

function knownAgendaSlotsFor(items) {
    const unknownSlots = Array.from(new Set(items
        .map((item) => item.details.callbackSlot)
        .filter((slot) => slot && !ADVISOR_CALLBACK_SLOTS.includes(slot))));

    return [...ADVISOR_CALLBACK_SLOTS, ...unknownSlots.sort((a, b) => slotSortKey(a) - slotSortKey(b))];
}

function setSelectedAgendaDate(value) {
    selectedAgendaDate = value || todayIso();
}

function moveAgendaDate(days) {
    const date = new Date(`${selectedAgendaDate || todayIso()}T12:00:00`);
    date.setDate(date.getDate() + days);
    selectedAgendaDate = toLocalIso(date);
    displayAdvisorAgenda(allContactRequests);
}

function setAgendaToday() {
    selectedAgendaDate = todayIso();
    displayAdvisorAgenda(allContactRequests);
}

function requestDetails(request) {
    const message = String(request.message || '');
    const isAdvisorRequest = /demande de rappel conseiller|créneau souhaité|creneau souhaite|créneau de rappel souhaité|creneau de rappel souhaite|rappel souhaité|rappel souhaite/i.test(message);
    const callbackDate = prefixedLine(message, ['Date souhaitée', 'Date souhaitee', 'Date de rappel souhaitée', 'Date de rappel souhaitee']);
    const callbackSlot = prefixedLine(message, ['Créneau souhaité', 'Creneau souhaite', 'Créneau de rappel souhaité', 'Creneau de rappel souhaite']);
    const subject = prefixedLine(message, ['Sujet']) || request.sujet || 'Autre';
    const clientMessage = prefixedLine(message, ['Message', 'Motif', 'Commentaire']) || (isAdvisorRequest ? '' : message);
    const cleanCallbackDate = /^\d{4}-\d{2}-\d{2}$/.test(callbackDate) ? callbackDate : '';

    return {
        isAdvisorRequest,
        callbackDate: cleanCallbackDate,
        agendaDate: cleanCallbackDate || createdDayIso(request),
        callbackSlot: callbackSlot || 'Créneau non précisé',
        subject,
        clientMessage,
        createdAtLabel: formatDateTime(request.created_at)
    };
}

async function adminContactRequest(options = {}) {
    const token = window.authSession?.getToken?.();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch('/.netlify/functions/admin-page-data?resource=contact', {
        ...options,
        headers
    });
    const payload = await response.json().catch(() => ({ ok: false }));
    if (!response.ok || !payload.ok) {
        if (response.status === 401) {
            window.location.href = `connexion.html?redirect=${encodeURIComponent('admin-contact.html')}`;
            return payload;
        }
        throw new Error(payload.error || 'CONTACT_ADMIN_REQUEST_FAILED');
    }
    return payload;
}

async function loadContactRequests() {
    const container = document.getElementById('contactRequestsContainer');
    const agendaContainer = document.getElementById('advisorAgendaContainer');
    const statusFilter = document.getElementById('statusFilter');

    if (!container) return;

    try {
        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Chargement des demandes...</p>
            </div>
        `;
        if (agendaContainer) {
            agendaContainer.innerHTML = `
                <div class="agenda-empty">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Chargement de l'agenda...</span>
                </div>
            `;
        }

        const payload = await adminContactRequest({ method: 'GET' });
        allContactRequests = payload.items || [];

        updateStats(allContactRequests);
        updateContactBadge(allContactRequests);
        displayAdvisorAgenda(allContactRequests);

        const selectedStatus = statusFilter ? statusFilter.value : 'tous';
        const filteredRequests = selectedStatus === 'tous'
            ? allContactRequests
            : allContactRequests.filter((request) => request.status === selectedStatus);

        displayContactRequests(filteredRequests);
    } catch (error) {
        console.error('Contact admin:', error);
        container.innerHTML = `
            <div class="loading-state" style="color:#ff3b30;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erreur lors du chargement des demandes</p>
            </div>
        `;
        if (agendaContainer) {
            agendaContainer.innerHTML = `
                <div class="agenda-empty danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Impossible de charger l'agenda.</span>
                </div>
            `;
        }
    }
}

function updateStats(requests) {
    const advisorRequests = requests.filter((request) => requestDetails(request).isAdvisorRequest);
    const pendingAdvisor = advisorRequests.filter((request) => request.status !== 'resolu');
    const today = todayIso();
    const todayAdvisor = pendingAdvisor.filter((request) => requestDetails(request).agendaDate === today);

    const statTotal = document.getElementById('statTotal');
    const statNew = document.getElementById('statNew');
    const statResolved = document.getElementById('statResolved');

    if (statTotal) statTotal.textContent = requests.length;
    if (statNew) statNew.textContent = todayAdvisor.length;
    if (statResolved) statResolved.textContent = requests.filter((request) => request.status === 'resolu').length;
}

function statusMeta(status) {
    const metas = {
        nouveau: { label: 'Nouveau', color: '#ff9500', bg: 'rgba(255,149,0,0.15)' },
        en_cours: { label: 'En cours', color: '#0071e3', bg: 'rgba(0,113,227,0.15)' },
        resolu: { label: 'Contacté', color: '#34c759', bg: 'rgba(52,199,89,0.15)' }
    };
    return metas[status] || { label: status || 'Sans statut', color: '#86868b', bg: 'rgba(134,134,139,0.15)' };
}

function displayAdvisorAgenda(requests) {
    const container = document.getElementById('advisorAgendaContainer');
    if (!container) return;
    if (!selectedAgendaDate) setSelectedAgendaDate(todayIso());

    const agendaItems = requests
        .map((request) => ({ request, details: requestDetails(request) }))
        .filter((item) => item.details.isAdvisorRequest)
        .sort((a, b) => {
            const byDate = a.details.agendaDate.localeCompare(b.details.agendaDate);
            if (byDate !== 0) return byDate;
            return a.details.callbackSlot.localeCompare(b.details.callbackSlot, 'fr');
        });

    const dayItems = agendaItems.filter((item) => item.details.agendaDate === selectedAgendaDate);
    const pendingCount = dayItems.filter((item) => item.request.status !== 'resolu').length;
    const contactedCount = dayItems.length - pendingCount;

    updateAgendaHeader(dayItems.length, pendingCount, contactedCount);

    const slots = knownAgendaSlotsFor(dayItems);
    container.innerHTML = `
        <div class="agenda-board">
            ${slots.map((slot) => advisorAgendaSlotHtml(slot, dayItems)).join('')}
        </div>
    `;
}

function updateAgendaHeader(totalCount, pendingCount, contactedCount) {
    const title = document.getElementById('agendaDayTitle');
    const subtitle = document.getElementById('agendaDaySubtitle');
    const count = document.getElementById('agendaDayCount');
    const today = todayIso();

    if (title) title.textContent = selectedAgendaDate === today ? "Aujourd'hui" : formatAgendaDate(selectedAgendaDate);
    if (subtitle) {
        const doneText = contactedCount > 0 ? `, ${contactedCount} déjà contacté${contactedCount > 1 ? 's' : ''}` : '';
        subtitle.textContent = `${escapePlain(formatDay(selectedAgendaDate))}${doneText}`;
    }
    if (count) {
        count.textContent = `${pendingCount} rappel${pendingCount > 1 ? 's' : ''} à faire`;
        if (!totalCount) count.textContent = 'Aucun rappel prévu';
    }
}

function escapePlain(value) {
    const parser = document.createElement('textarea');
    parser.innerHTML = String(value || '');
    return parser.value;
}

function advisorAgendaSlotHtml(slot, items) {
    const slotItems = items
        .filter((item) => item.details.callbackSlot === slot)
        .sort((a, b) => String(a.request.created_at || '').localeCompare(String(b.request.created_at || '')));

    return `
        <section class="agenda-slot-row">
            <div class="agenda-slot-time">
                <strong>${escapeHtml(slot)}</strong>
                <span>${slotItems.length ? `${slotItems.length} demande${slotItems.length > 1 ? 's' : ''}` : 'Libre'}</span>
            </div>
            <div class="agenda-slot-body">
                ${slotItems.length
                    ? slotItems.map(({ request, details }) => advisorAgendaCardHtml(request, details)).join('')
                    : '<div class="agenda-slot-empty">Aucun appel prévu sur ce créneau.</div>'}
            </div>
        </section>
    `;
}

function advisorAgendaCardHtml(request, details) {
    const id = safeRequestId(request.id);
    const telephone = safeTelephone(request.telephone);
    const phoneLink = telHref(telephone);
    const emailLink = mailHref(request.email);
    const isDone = request.status === 'resolu';
    const meta = statusMeta(request.status);
    const message = details.clientMessage || 'Aucun commentaire laissé.';

    return `
        <article class="agenda-call-card ${isDone ? 'is-done' : ''}">
            <div class="agenda-card-head">
                <div>
                    <h4>${escapeHtml(request.prenom)} ${escapeHtml(request.nom)}</h4>
                    <p>${escapeHtml(details.subject || 'Demande conseiller')}</p>
                </div>
                <span class="agenda-status">${escapeHtml(meta.label)}</span>
            </div>
            <p class="agenda-card-message"><strong>Commentaire :</strong> ${escapeHtml(message)}</p>
            <div class="agenda-card-contact">
                ${telephone ? `<a href="${escapeHtml(phoneLink)}"><i class="fas fa-phone"></i> ${escapeHtml(telephone)}</a>` : ''}
                ${request.email ? `<a href="${escapeHtml(emailLink)}"><i class="fas fa-envelope"></i> ${escapeHtml(request.email)}</a>` : ''}
            </div>
            <div class="agenda-card-actions">
                ${telephone ? `<a class="agenda-call-link" href="${escapeHtml(phoneLink)}"><i class="fas fa-phone-volume"></i> Appeler</a>` : ''}
                ${request.email ? `<a class="agenda-mail-link" href="${escapeHtml(emailLink)}"><i class="fas fa-envelope"></i> Email</a>` : ''}
                ${!isDone ? `
                    <button class="btn-contacted" type="button" onclick="markContacted('${id}')">
                        <i class="fas fa-check"></i> OK appelé
                    </button>
                ` : ''}
            </div>
        </article>
    `;
}

function displayContactRequests(requests) {
    const container = document.getElementById('contactRequestsContainer');

    if (!requests || requests.length === 0) {
        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-inbox"></i>
                <p>Aucune demande de contact</p>
            </div>
        `;
        return;
    }

    container.innerHTML = requests.map((request) => contactRequestHtml(request)).join('');
}

function contactRequestHtml(request) {
    const details = requestDetails(request);
    const meta = statusMeta(request.status);
    const requestId = safeRequestId(request.id);
    const telephone = safeTelephone(request.telephone);
    const phoneLink = telHref(telephone);
    const emailLink = mailHref(request.email);
    const sujetLabel = details.isAdvisorRequest ? 'Rappel conseiller' : details.subject;

    return `
        <article class="request-card">
            <div class="request-head">
                <div>
                    <h3><i class="fas fa-user"></i>${escapeHtml(request.prenom)} ${escapeHtml(request.nom)}</h3>
                    <p>${escapeHtml(details.createdAtLabel)}</p>
                </div>
                <span class="status-pill" style="background:${meta.bg};color:${meta.color};">${escapeHtml(meta.label)}</span>
            </div>

            <div class="request-grid">
                <div class="request-info">
                    <span>Contact</span>
                    ${request.email ? `<a href="${escapeHtml(emailLink)}">${escapeHtml(request.email)}</a>` : ''}
                    ${telephone ? `<a href="${escapeHtml(phoneLink)}">${escapeHtml(telephone)}</a>` : ''}
                </div>
                ${details.isAdvisorRequest ? `
                    <div class="request-info">
                        <span>Rappel souhaité</span>
                        <strong>${escapeHtml(formatDay(details.agendaDate))}</strong>
                        <p>${escapeHtml(details.callbackSlot)}</p>
                    </div>
                ` : ''}
                <div class="request-info">
                    <span>Sujet</span>
                    <strong>${escapeHtml(sujetLabel)}</strong>
                </div>
            </div>

            <div class="request-message">
                <strong><i class="fas fa-comment"></i> Message</strong>
                <p>${escapeHtml(details.clientMessage || request.message || 'Aucun message précisé')}</p>
            </div>

            <div class="request-actions">
                <select onchange="updateRequestStatus('${requestId}', this.value)" aria-label="Statut de la demande">
                    <option value="nouveau" ${request.status === 'nouveau' ? 'selected' : ''}>Nouveau</option>
                    <option value="en_cours" ${request.status === 'en_cours' ? 'selected' : ''}>En cours</option>
                    <option value="resolu" ${request.status === 'resolu' ? 'selected' : ''}>Contacté</option>
                </select>
                ${telephone ? `<a class="action-call" href="${escapeHtml(phoneLink)}"><i class="fas fa-phone"></i> Rappeler</a>` : ''}
                ${request.email ? `<a class="action-mail" href="${escapeHtml(emailLink)}"><i class="fas fa-envelope"></i> Email</a>` : ''}
                ${request.status !== 'resolu' ? `<button class="action-ok" type="button" onclick="markContacted('${requestId}')"><i class="fas fa-check"></i> OK contacté</button>` : ''}
                <button class="action-delete" type="button" onclick="deleteContactRequest('${requestId}')" title="Supprimer">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </article>
    `;
}

async function updateRequestStatus(requestId, newStatus) {
    if (!requestId) return;
    try {
        await adminContactRequest({
            method: 'POST',
            body: JSON.stringify({ action: 'update', id: requestId, status: newStatus })
        });
        await loadContactRequests();
    } catch (error) {
        console.error('Contact status:', error);
        alert('Erreur lors de la mise à jour du statut');
    }
}

function markContacted(requestId) {
    return updateRequestStatus(requestId, 'resolu');
}

async function deleteContactRequest(requestId) {
    if (!requestId || !confirm('Êtes-vous sûr de vouloir supprimer cette demande de contact ?')) {
        return;
    }

    try {
        await adminContactRequest({
            method: 'POST',
            body: JSON.stringify({ action: 'delete', id: requestId })
        });
        await loadContactRequests();
    } catch (error) {
        console.error('Contact delete:', error);
        alert('Erreur lors de la suppression de la demande');
    }
}

function updateContactBadge(requests) {
    const badge = document.getElementById('contactBadge');
    if (!badge) return;

    const newCount = requests.filter((request) => request.status === 'nouveau').length;
    if (newCount > 0) {
        badge.textContent = newCount;
        badge.style.display = 'inline-flex';
    } else {
        badge.style.display = 'none';
    }
}

function initContactPage() {
    if (contactPageInitialized) return;
    contactPageInitialized = true;
    setSelectedAgendaDate(todayIso());

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            const selectedStatus = statusFilter.value;
            const filteredRequests = selectedStatus === 'tous'
                ? allContactRequests
                : allContactRequests.filter((request) => request.status === selectedStatus);
            displayContactRequests(filteredRequests);
        });
    }

    const prevDay = document.getElementById('agendaPrevDay');
    const nextDay = document.getElementById('agendaNextDay');
    const todayBtn = document.getElementById('agendaTodayBtn');
    if (prevDay) prevDay.addEventListener('click', () => moveAgendaDate(-1));
    if (nextDay) nextDay.addEventListener('click', () => moveAgendaDate(1));
    if (todayBtn) todayBtn.addEventListener('click', setAgendaToday);

    loadContactRequests();
}

window.loadContactRequests = loadContactRequests;
window.updateRequestStatus = updateRequestStatus;
window.deleteContactRequest = deleteContactRequest;
window.markContacted = markContacted;

document.addEventListener('auth-session-ready', initContactPage);
document.addEventListener('DOMContentLoaded', initContactPage);
