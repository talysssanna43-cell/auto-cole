const INSTRUCTORS = {
    mylene: {
        name: 'Mylène',
        calendarUrl: 'https://calendar.google.com/calendar/embed?src=c323b0f23fda394143c27dfc90fd0c94cac8b23b888186821e8ec4060365ab36%40group.calendar.google.com&mode=AGENDA&ctz=Europe%2FParis',
        slotBlueprintKey: 'mylene'
    },
    sammy: {
        name: 'Sammy',
        calendarUrl: 'https://calendar.google.com/calendar/embed?src=d8e2dffb13aaaa7afa4caf500034556410b3b0cf3d74cb6acd772cd165a3d745%40group.calendar.google.com&mode=AGENDA&ctz=Europe%2FParis',
        slotBlueprintKey: 'sammy'
    }
};

const dashboardState = {
    user: null,
    sessions: [],
    rawSessions: [],
    totalHours: 0,
    hoursGoal: 20,
    availableSlots: [],
    selectedSlotId: null,
    favoriteInstructor: null,
    activeInstructorKey: 'mylene'
};

const SLOT_END_MAP = {
    mylene: {
        '13:00': '15:00',
        '15:00': '17:00'
    },
    sammy: {
        '07:00': '09:00',
        '09:00': '11:00',
        '11:00': '13:00'
    }
};

const WEEKLY_SLOT_BLUEPRINTS = {
    mylene: [
        { weekday: 1, start: '13:00', instructor: 'Mylène' },
        { weekday: 1, start: '15:00', instructor: 'Mylène' },
        { weekday: 2, start: '13:00', instructor: 'Mylène' },
        { weekday: 2, start: '15:00', instructor: 'Mylène' },
        { weekday: 3, start: '13:00', instructor: 'Mylène' },
        { weekday: 3, start: '15:00', instructor: 'Mylène' },
        { weekday: 4, start: '13:00', instructor: 'Mylène' },
        { weekday: 4, start: '15:00', instructor: 'Mylène' },
        { weekday: 5, start: '13:00', instructor: 'Mylène' },
        { weekday: 5, start: '15:00', instructor: 'Mylène' }
    ],
    sammy: [
        { weekday: 1, start: '07:00', instructor: 'Sammy' },
        { weekday: 1, start: '09:00', instructor: 'Sammy' },
        { weekday: 1, start: '11:00', instructor: 'Sammy' },
        { weekday: 2, start: '07:00', instructor: 'Sammy' },
        { weekday: 2, start: '09:00', instructor: 'Sammy' },
        { weekday: 2, start: '11:00', instructor: 'Sammy' },
        { weekday: 3, start: '07:00', instructor: 'Sammy' },
        { weekday: 3, start: '09:00', instructor: 'Sammy' },
        { weekday: 3, start: '11:00', instructor: 'Sammy' },
        { weekday: 4, start: '07:00', instructor: 'Sammy' },
        { weekday: 4, start: '09:00', instructor: 'Sammy' },
        { weekday: 4, start: '11:00', instructor: 'Sammy' },
        { weekday: 5, start: '07:00', instructor: 'Sammy' },
        { weekday: 5, start: '09:00', instructor: 'Sammy' },
        { weekday: 5, start: '11:00', instructor: 'Sammy' }
    ]
};

const SLOT_GENERATION_RANGE_DAYS = 14;

function padNumber(value) {
    return String(value).padStart(2, '0');
}

function toInputDate(dateObj) {
    return `${dateObj.getFullYear()}-${padNumber(dateObj.getMonth() + 1)}-${padNumber(dateObj.getDate())}`;
}

function buildSlotId(dateStr, start) {
    return `${dateStr}|${start}`;
}

function getNormalizedWeekday(dateObj) {
    const jsDay = dateObj.getDay(); // 0 Sunday
    return jsDay === 0 ? 7 : jsDay; // 1 (Mon) ... 7 (Sun)
}

function getLocalDateFromSession(session) {
    if (session.date_local) return session.date_local;
    if (session.date) {
        const parsed = new Date(session.date);
        if (!Number.isNaN(parsed.getTime())) {
            return toInputDate(parsed);
        }
    }
    return null;
}

function getSessionSlotId(session) {
    if (!session) return null;
    const start = session.start_time || session.start || session.startTime;
    const localDate = getLocalDateFromSession(session);
    if (!start || !localDate) return null;
    return buildSlotId(localDate, start);
}

function generateUpcomingSlots(rangeDays = SLOT_GENERATION_RANGE_DAYS, instructorKey = dashboardState.activeInstructorKey) {
    const blueprint = WEEKLY_SLOT_BLUEPRINTS[instructorKey] || [];
    const endMap = SLOT_END_MAP[instructorKey] || {};
    const slots = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let offset = 0; offset < rangeDays; offset += 1) {
        const slotDate = new Date(today);
        slotDate.setDate(today.getDate() + offset + 1);
        const weekday = getNormalizedWeekday(slotDate);

        blueprint.forEach((definition) => {
            if (definition.weekday !== weekday) return;
            const endTime = endMap[definition.start];
            if (!endTime) return;
            const dateStr = toInputDate(slotDate);
            slots.push({
                id: buildSlotId(dateStr, definition.start),
                date: dateStr,
                start: definition.start,
                end: endTime,
                instructor: definition.instructor,
                theme: definition.theme,
                dayLabel: slotDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }),
                label: `${definition.start.replace(':', 'h')} - ${endTime.replace(':', 'h')}`
            });
        });
    }

    return slots;
}

function renderSlotGrid() {
    const grid = document.getElementById('slotGrid');
    if (!grid || !dashboardState.availableSlots.length) return;

    const bookedSet = new Set(
        (dashboardState.rawSessions || [])
            .map(getSessionSlotId)
            .filter(Boolean)
    );

    const now = Date.now();

    const cards = dashboardState.availableSlots.map((slot) => {
        const slotTime = new Date(`${slot.date}T${slot.start}:00`).getTime();
        const isPast = slotTime < now;
        const isBooked = bookedSet.has(slot.id);
        const isDisabled = isPast || isBooked;
        const isSelected = !isDisabled && dashboardState.selectedSlotId === slot.id;
        const classes = ['slot-card'];
        if (isDisabled) {
            classes.push('is-booked');
        } else {
            classes.push('available');
        }
        if (isSelected) classes.push('is-selected');
        const meta = isDisabled ? `Avec ${slot.instructor}` : `Disponible avec ${slot.instructor}`;

        return `
            <button type="button"
                class="${classes.join(' ')}"
                data-slot-id="${slot.id}"
                data-slot-date="${slot.date}"
                data-slot-start="${slot.start}"
                data-slot-instructor="${slot.instructor}"
                ${isDisabled ? 'disabled' : ''}>
                <span class="slot-day">${slot.dayLabel}</span>
                <span class="slot-time">${slot.label}</span>
                <span class="slot-meta">${meta}</span>
            </button>
        `;
    }).join('');

    grid.innerHTML = cards || `<p style="grid-column: 1 / -1; color: var(--text-light);">Aucun créneau disponible pour le moment.</p>`;

    grid.querySelectorAll('.slot-card').forEach((card) => {
        card.addEventListener('click', () => handleSlotSelection(card));
    });
}

function renderInstructorToggle() {
    const toggle = document.getElementById('instructorToggle');
    if (!toggle) return;
    toggle.querySelectorAll('button').forEach((button) => {
        const key = button.dataset.instructorKey;
        if (!key) return;
        if (key === dashboardState.activeInstructorKey) {
            button.classList.add('is-active');
        } else {
            button.classList.remove('is-active');
        }
        button.addEventListener('click', () => {
            if (dashboardState.activeInstructorKey === key) return;
            dashboardState.activeInstructorKey = key;
            dashboardState.availableSlots = generateUpcomingSlots();
            updateCalendarIframe();
            renderInstructorToggle();
            renderSlotGrid();
        }, { once: true });
    });
}

function updateCalendarIframe() {
    const iframe = document.getElementById('instructorCalendarFrame');
    const instructor = INSTRUCTORS[dashboardState.activeInstructorKey];
    if (iframe && instructor) {
        iframe.src = instructor.calendarUrl;
    }
}

function handleSlotSelection(card) {
    if (!card || card.disabled) return;
    const slotId = card.dataset.slotId;
    if (!slotId) return;

    dashboardState.selectedSlotId = slotId;

    const dateInput = document.getElementById('bookingDate');
    if (dateInput) dateInput.value = card.dataset.slotDate || '';

    const startSelect = document.getElementById('bookingStart');
    if (startSelect && card.dataset.slotStart) {
        ensureTimeSlotsForInstructor(card.dataset.slotInstructor);
        startSelect.value = card.dataset.slotStart;
    }

    const instructorSelect = document.getElementById('bookingInstructor');
    if (instructorSelect) {
        const optionExists = Array.from(instructorSelect.options).some((opt) => opt.value === card.dataset.slotInstructor);
        if (optionExists) {
            instructorSelect.value = card.dataset.slotInstructor;
        }
    }

    const feedback = document.getElementById('bookingFeedback');
    if (feedback) {
        feedback.textContent = 'Créneau verrouillé, confirme la réservation via le formulaire.';
        feedback.className = 'form-feedback info';
    }

    renderSlotGrid();
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' });
}

function formatTimeRange(start, end) {
    return `${start} - ${end}`;
}

function computeStats() {
    dashboardState.totalHours = dashboardState.sessions.reduce((sum, session) => sum + (session.durationHours || 0), 0);
}

function renderStats() {
    const completedEl = document.getElementById('hoursCompleted');
    const remainingEl = document.getElementById('hoursRemaining');
    const nextSessionEl = document.getElementById('nextSession');
    const instructorEl = document.getElementById('favoriteInstructor');

    if (completedEl) completedEl.textContent = `${dashboardState.totalHours}h`;
    if (remainingEl) {
        const remaining = Math.max(dashboardState.hoursGoal - dashboardState.totalHours, 0);
        remainingEl.textContent = `${remaining}h`;
    }

    const upcoming = dashboardState.sessions.find((s) => s.status === 'upcoming');
    if (upcoming && nextSessionEl) {
        nextSessionEl.textContent = `${formatDate(upcoming.date)} • ${upcoming.slot}`;
    } else if (nextSessionEl) {
        nextSessionEl.textContent = '--';
    }

    if (instructorEl) {
        instructorEl.textContent = dashboardState.favoriteInstructor || '--';
    }
}

function renderSessionsTable() {
    const tbody = document.querySelector('#sessionsTable tbody');
    if (!tbody) return;

    if (!dashboardState.sessions.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding: 2rem 0; color: var(--text-light);">
                    Aucune séance enregistrée pour le moment.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = dashboardState.sessions.map((session) => {
        const statusClass = session.status === 'done'
            ? 'status-chip status-done'
            : session.status === 'upcoming'
                ? 'status-chip status-upcoming'
                : 'status-chip status-missed';
        const statusLabel = session.status === 'done'
            ? 'Réalisée'
            : session.status === 'upcoming'
                ? 'À venir'
                : 'Annulée';

        return `
            <tr>
                <td>${formatDate(session.date)}</td>
                <td>${session.slot}</td>
                <td>${session.durationHours}h</td>
                <td>${session.instructor}</td>
                <td><span class="${statusClass}">${statusLabel}</span></td>
            </tr>
        `;
    }).join('');
}

function normalizeSessionForState(session) {
    return {
        date: session.date,
        slot: formatTimeRange(
            (session.start_time || '08:00').replace(':', 'h'),
            (session.end_time || SLOT_MAP[session.start_time] || '10:00').replace(':', 'h')
        ),
        durationHours: session.duration_hours || session.durationHours || 2,
        instructor: session.instructor || 'Moniteur Auto-Ecole',
        status: session.status || 'upcoming',
        notes: session.notes || ''
    };
}

function loadSessionsFromStorage() {
    try {
        const raw = localStorage.getItem('ae_sessions');
        if (!raw) return [];
        const sessions = JSON.parse(raw);
        return Array.isArray(sessions) ? sessions : [];
    } catch (error) {
        console.warn('Impossible de lire ae_sessions :', error);
        return [];
    }
}

function saveSessionsToStorage(sessions) {
    localStorage.setItem('ae_sessions', JSON.stringify(sessions));
}

function fetchSessions(user) {
    const storedSessions = loadSessionsFromStorage();
    dashboardState.rawSessions = storedSessions;
    dashboardState.sessions = storedSessions.map(normalizeSessionForState);
    dashboardState.favoriteInstructor = dashboardState.sessions[0]?.instructor || dashboardState.favoriteInstructor;
    dashboardState.availableSlots = generateUpcomingSlots();
    computeStats();
    renderStats();
    renderSessionsTable();
    renderSlotGrid();
    renderInstructorToggle();
    updateCalendarIframe();
}

function requireAuth() {
    const user = getStoredUser();
    if (!user) {
        // Mode test : créer un utilisateur fictif pour tester
        const testUser = {
            id: 'test-123',
            prenom: 'Test',
            email: 'test@example.com'
        };
        localStorage.setItem('ae_user', JSON.stringify(testUser));
        return testUser;
    }
    return user;
}

function hydrateHeader(user) {
    const nameEl = document.getElementById('studentName');
    const emailEl = document.getElementById('studentEmail');
    if (nameEl) nameEl.textContent = user.prenom || 'élève';
    if (emailEl) emailEl.textContent = user.email || '';
}

function handleBookingSubmission(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const feedback = document.getElementById('bookingFeedback');
    if (feedback) {
        feedback.textContent = '';
        feedback.className = 'form-feedback';
    }

    const user = dashboardState.user || getStoredUser();
    if (!user) {
        window.location.href = getLoginUrl('espace-eleve.html');
        return;
    }

    const dateValue = form.elements['date']?.value;
    const startValue = form.elements['start']?.value;
    const instructorValue = form.elements['instructor']?.value;
    const statusValue = form.elements['status']?.value || 'upcoming';
    const notesValue = form.elements['notes']?.value?.trim();
    const endValue = SLOT_MAP[startValue];

    if (!dateValue || !startValue || !instructorValue || !endValue) {
        if (feedback) {
            feedback.textContent = 'Merci de remplir tous les champs obligatoires.';
            feedback.classList.add('error');
        }
        return;
    }

    const isoDate = new Date(`${dateValue}T${startValue}:00`);
    const localSessions = loadSessionsFromStorage();

    const newSession = {
        id: crypto.randomUUID(),
        date: isoDate.toISOString(),
        start_time: startValue,
        end_time: endValue,
        duration_hours: 2,
        instructor: instructorValue,
        status: statusValue,
        notes: notesValue
    };

    localSessions.unshift(newSession);
    saveSessionsToStorage(localSessions);

    dashboardState.rawSessions = localSessions;
    dashboardState.sessions = localSessions.map(normalizeSessionForState);
    dashboardState.favoriteInstructor = instructorValue;
    
    // Ajouter 2h aux heures réalisées
    dashboardState.totalHours += 2;
    
    computeStats();
    renderStats();
    renderSessionsTable();
    renderSlotGrid();

    // Afficher notification avec les détails de la réservation
    showBookingNotification(newSession, dateValue, startValue, endValue, instructorValue);

    form.reset();
    dashboardState.selectedSlotId = null;
    
    if (feedback) {
        feedback.textContent = '✓ Séance confirmée ! +2h ajoutées à ton compteur.';
        feedback.classList.add('success');
    }
}

function showBookingNotification(session, dateValue, startValue, endValue, instructorValue) {
    const formattedDate = new Date(dateValue).toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    
    const notificationHTML = `
        <div class="booking-notification" id="bookingNotification">
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>Réservation confirmée !</h3>
                <div class="notification-details">
                    <p><i class="fas fa-calendar"></i> <strong>Date :</strong> ${formattedDate}</p>
                    <p><i class="fas fa-clock"></i> <strong>Horaire :</strong> ${startValue.replace(':', 'h')} - ${endValue.replace(':', 'h')}</p>
                    <p><i class="fas fa-user-tie"></i> <strong>Moniteur :</strong> ${instructorValue}</p>
                    <p><i class="fas fa-hourglass-half"></i> <strong>Durée :</strong> 2 heures</p>
                    ${session.notes ? `<p><i class="fas fa-sticky-note"></i> <strong>Note :</strong> ${session.notes}</p>` : ''}
                </div>
                <button class="btn-close-notification" onclick="closeBookingNotification()">
                    <i class="fas fa-times"></i> Fermer
                </button>
            </div>
        </div>
    `;
    
    const existingNotification = document.getElementById('bookingNotification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', notificationHTML);
    
    setTimeout(() => {
        const notification = document.getElementById('bookingNotification');
        if (notification) {
            notification.classList.add('show');
        }
    }, 100);
}

function closeBookingNotification() {
    const notification = document.getElementById('bookingNotification');
    if (notification) {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }
}

function ensureTimeSlotsForInstructor(instructor) {
    const startSelect = document.getElementById('bookingStart');
    if (!startSelect) return;

    if (!instructor) {
        startSelect.innerHTML = '<option value="">Choisis d\'abord un moniteur</option>';
        startSelect.value = '';
        startSelect.disabled = true;
        startSelect.setAttribute('disabled', 'disabled');
        return;
    }

    startSelect.disabled = false;
    startSelect.removeAttribute('disabled');
    if (instructor === 'Sammy') {
        startSelect.innerHTML = `
            <option value="">Sélectionne une heure</option>
            <option value="07:00">07h00 - 09h00</option>
            <option value="09:00">09h00 - 11h00</option>
            <option value="11:00">11h00 - 13h00</option>
        `;
    } else if (instructor === 'Mylène') {
        startSelect.innerHTML = `
            <option value="">Sélectionne une heure</option>
            <option value="13:00">13h00 - 15h00</option>
            <option value="15:00">15h00 - 17h00</option>
        `;
    } else {
        startSelect.innerHTML = '<option value="">Sélectionne une heure</option>';
    }
    startSelect.value = '';
}

function initBookingForm() {
    const form = document.getElementById('bookingForm');
    if (!form) return;
    form.addEventListener('submit', handleBookingSubmission);

    // Filtrer les créneaux horaires selon le moniteur choisi
    const instructorSelect = document.getElementById('bookingInstructor');
    if (instructorSelect) {
        instructorSelect.addEventListener('change', function handleInstructorChange() {
            ensureTimeSlotsForInstructor(this.value);
        });
        ensureTimeSlotsForInstructor(instructorSelect.value);
    } else {
        ensureTimeSlotsForInstructor('');
    }
}

function initStudentDashboard() {
    const user = requireAuth();
    if (!user) return;
    dashboardState.user = user;
    hydrateHeader(user);

    fetchSessions(user);
    initBookingForm();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initStudentDashboard();
} else {
    document.addEventListener('DOMContentLoaded', initStudentDashboard);
}
