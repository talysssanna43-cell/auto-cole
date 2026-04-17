// Fonction pour récupérer l'utilisateur depuis le localStorage
function getStoredUser() {
    try {
        const stored = localStorage.getItem('ae_user');
        if (!stored) return null;
        return JSON.parse(stored);
    } catch (err) {
        console.error('Erreur lecture utilisateur:', err);
        return null;
    }
}

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

// Jours fériés français 2026
const JOURS_FERIES_2026 = [
    '2026-01-01', // Jour de l'an
    '2026-04-06', // Lundi de Pâques
    '2026-05-01', // Fête du travail
    '2026-05-08', // Victoire 1945
    '2026-05-14', // Ascension
    '2026-05-25', // Lundi de Pentecôte
    '2026-07-14', // Fête nationale
    '2026-08-15', // Assomption
    '2026-11-01', // Toussaint
    '2026-11-11', // Armistice 1918
    '2026-12-25'  // Noël
];

function isJourFerie(dateStr) {
    return JOURS_FERIES_2026.includes(dateStr);
}

const dashboardState = {
    user: null,
    sessions: [],
    rawSessions: [],
    totalHours: 0,
    completedHours: 0,
    reservedHours: 0,
    hoursGoal: 20,
    initialCompletedHours: 0,
    availableSlots: [],
    selectedSlotId: null,
    bookedSlotIds: new Set(),
    favoriteInstructor: null,
    activeInstructorKey: 'nail', // Nail par défaut à partir du 1er mai 2026
    weekOffset: 0 // 0 = semaine courante, 1 = semaine suivante, etc.
};

// Fonctions identiques à admin-planning pour synchronisation parfaite
function getTimeRows(instructor) {
    if (instructor === 'Sammy') {
        return ['07:00', '09:00', '11:00'];
    }
    // Nail et Mylène ont les mêmes horaires (après-midi uniquement)
    return ['13:00', '15:00', '17:00'];
}

function getEndForStart(instructor, start) {
    if (instructor === 'Sammy') {
        if (start === '07:00') return '09:00';
        if (start === '09:00') return '11:00';
        if (start === '11:00') return '13:00';
    }
    if (start === '13:00') return '15:00';
    if (start === '15:00') return '17:00';
    if (start === '17:00') return '19:00';
    return '';
}

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

function toInstructorKey(instructorLabel) {
    if (!instructorLabel) return dashboardState.activeInstructorKey;
    const normalized = String(instructorLabel).toLowerCase();
    if (normalized.includes('sammy')) return 'sammy';
    if (normalized.includes('nail')) return 'nail';
    return 'mylene';
}

function getEndTimeForSlot(startTime, instructorLabel) {
    // Normaliser le nom du moniteur
    let instructor = 'Mylène';
    if (instructorLabel && instructorLabel.toLowerCase().includes('sammy')) instructor = 'Sammy';
    if (instructorLabel && instructorLabel.toLowerCase().includes('nail')) instructor = 'Nail';
    
    return getEndForStart(instructor, startTime);
}

function padNumber(value) {
    return String(value).padStart(2, '0');
}

function toInputDate(dateObj) {
    return `${dateObj.getFullYear()}-${padNumber(dateObj.getMonth() + 1)}-${padNumber(dateObj.getDate())}`;
}

function buildSlotId(dateStr, start) {
    return `${dateStr}|${start}`;
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

function generateUpcomingSlots(instructorKey = dashboardState.activeInstructorKey) {
    const slots = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculer le début de la semaine en fonction de weekOffset
    const weekStart = startOfWeek(today);
    weekStart.setDate(weekStart.getDate() + (dashboardState.weekOffset * 7));
    
    // Normaliser le nom du moniteur pour correspondre à admin-planning
    let instructor = 'Mylène';
    if (instructorKey === 'sammy') instructor = 'Sammy';
    if (instructorKey === 'nail') instructor = 'Nail';
    
    // Générer les créneaux pour les 7 jours de la semaine
    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    const times = getTimeRows(instructor);
    
    days.forEach((day) => {
        const dateStr = toInputDate(day);
        
        // Pas de créneaux le dimanche (0) uniquement
        const jsDay = day.getDay();
        if (jsDay === 0) return;
        
        // Bloquer les créneaux de Mylène à partir du 1er mai 2026
        if (instructor === 'Mylène') {
            const slotDate = new Date(dateStr);
            const mayFirst2026 = new Date('2026-05-01T00:00:00');
            if (slotDate >= mayFirst2026) return;
        }
        
        // Pour les jours fériés, créer des créneaux spéciaux marqués comme fériés
        if (isJourFerie(dateStr)) {
            times.forEach((start) => {
                const end = getEndForStart(instructor, start);
                if (!end) return;
                
                slots.push({
                    id: buildSlotId(dateStr, start),
                    date: dateStr,
                    start: start,
                    end: end,
                    instructor: instructor,
                    dayLabel: day.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }),
                    label: `${start.replace(':', 'h')} - ${end.replace(':', 'h')}`,
                    isFerie: true
                });
            });
            return;
        }
        
        times.forEach((start) => {
            const end = getEndForStart(instructor, start);
            if (!end) return;
            
            slots.push({
                id: buildSlotId(dateStr, start),
                date: dateStr,
                start: start,
                end: end,
                instructor: instructor,
                dayLabel: day.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }),
                label: `${start.replace(':', 'h')} - ${end.replace(':', 'h')}`
            });
        });
    });

    return slots;
}

// Fonctions de navigation entre les semaines
window.goToPreviousWeek = async function() {
    if (dashboardState.weekOffset > 0) {
        dashboardState.weekOffset--;
        await refreshSlotsForCurrentWeek();
        renderSlotGrid();
        updateWeekDisplay();
    }
};

window.goToNextWeek = async function() {
    if (dashboardState.weekOffset < 12) { // Limiter à 12 semaines à l'avance (3 mois)
        dashboardState.weekOffset++;
        await refreshSlotsForCurrentWeek();
        renderSlotGrid();
        updateWeekDisplay();
    }
};

async function refreshSlotsForCurrentWeek() {
    // Générer les slots depuis les blueprints
    const generatedSlots = generateUpcomingSlots();
    
    // Récupérer les slots réservés depuis Supabase
    const bookedData = await fetchBookedSlotsFromSupabase();
    dashboardState.bookedSlotIds = bookedData.ids;
    
    // Fusionner les slots générés avec les slots réservés
    const allSlots = [...generatedSlots];
    bookedData.slots.forEach(bookedSlot => {
        // Ne pas ajouter les slots dimanche à la grille élève
        // (seul l'admin peut placer des séances le dimanche)
        const slotDate = new Date(bookedSlot.date);
        const jsDay = slotDate.getDay();
        if (jsDay === 0) return;
        
        // Bloquer les créneaux de Mylène à partir du 1er mai 2026
        if (bookedSlot.instructor === 'Mylène') {
            const mayFirst2026 = new Date('2026-05-01T00:00:00');
            if (slotDate >= mayFirst2026) return;
        }
        
        // Ajouter le slot réservé seulement s'il n'existe pas déjà dans les slots générés
        if (!allSlots.find(s => s.id === bookedSlot.id)) {
            allSlots.push(bookedSlot);
        }
    });
    
    dashboardState.availableSlots = allSlots;
}

function updateWeekDisplay() {
    const weekLabel = document.getElementById('weekLabel');
    if (!weekLabel) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + (dashboardState.weekOffset * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const startStr = weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const endStr = weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    
    weekLabel.textContent = `${startStr} - ${endStr}`;
    
    // Désactiver le bouton précédent si on est à la semaine courante
    const prevBtn = document.getElementById('prevWeekBtn');
    const nextBtn = document.getElementById('nextWeekBtn');
    if (prevBtn) prevBtn.disabled = dashboardState.weekOffset === 0;
    if (nextBtn) nextBtn.disabled = dashboardState.weekOffset >= 12;
}

function renderSlotGrid() {
    const grid = document.getElementById('slotGrid');
    if (!grid || !dashboardState.availableSlots.length) return;

    const bookedSet = new Set(
        (dashboardState.rawSessions || [])
            .map(getSessionSlotId)
            .filter(Boolean)
    );

    (dashboardState.bookedSlotIds || []).forEach((id) => bookedSet.add(id));
    
    console.log('📊 Nombre total de créneaux réservés dans bookedSet:', bookedSet.size);
    console.log('📋 Exemple d\'IDs réservés:', Array.from(bookedSet).slice(0, 3));

    const now = Date.now();

    // Organiser les créneaux par jour et horaire
    const slotsByDay = {};
    const timeSlots = new Set();
    
    dashboardState.availableSlots.forEach(slot => {
        const date = new Date(slot.date);
        const dayKey = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
        
        if (!slotsByDay[dayKey]) {
            slotsByDay[dayKey] = {};
        }
        
        slotsByDay[dayKey][slot.start] = slot;
        timeSlots.add(slot.start);
    });

    // Trier les horaires
    let sortedTimes = Array.from(timeSlots).sort();
    
    // Pour Mylène et Nail, ne pas afficher les créneaux du matin (elles commencent à 13h)
    if (dashboardState.activeInstructorKey === 'mylene' || dashboardState.activeInstructorKey === 'nail') {
        sortedTimes = sortedTimes.filter(time => {
            const hour = parseInt(time.split(':')[0]);
            return hour >= 13; // Seulement 13h et après
        });
    }
    
    // Pour Sammy, ne pas afficher les créneaux de l'après-midi (il travaille jusqu'à 13h)
    if (dashboardState.activeInstructorKey === 'sammy') {
        sortedTimes = sortedTimes.filter(time => {
            const hour = parseInt(time.split(':')[0]);
            return hour < 13; // Seulement avant 13h
        });
    }
    
    const days = Object.keys(slotsByDay);

    // Construire la grille HTML
    let html = '<table class="weekly-planning-grid">';
    
    // En-tête avec les jours
    html += '<thead><tr><th class="time-header">Horaire</th>';
    days.forEach(day => {
        // Extraire la date du slot pour vérifier si c'est un jour férié
        const daySlots = slotsByDay[day];
        const firstSlot = daySlots ? Object.values(daySlots)[0] : null;
        const isFerie = firstSlot && isJourFerie(firstSlot.date);
        
        const ferieClass = isFerie ? ' jour-ferie' : '';
        html += `<th class="day-header${ferieClass}">${day}${isFerie ? ' 🎉' : ''}</th>`;
    });
    html += '</tr></thead>';
    
    // Corps avec les créneaux
    html += '<tbody>';
    sortedTimes.forEach(time => {
        html += '<tr>';
        
        // Calculer l'heure de fin pour afficher l'intervalle
        let instructor = 'Mylène';
        if (dashboardState.activeInstructorKey === 'sammy') instructor = 'Sammy';
        if (dashboardState.activeInstructorKey === 'nail') instructor = 'Nail';
        const endTime = getEndForStart(instructor, time);
        const timeLabel = endTime ? `${time.replace(':', 'h')}-${endTime.replace(':', 'h')}` : time.replace(':', 'h');
        
        html += `<td class="time-cell">${timeLabel}</td>`;
        
        days.forEach(day => {
            const slot = slotsByDay[day][time];
            
            if (slot) {
                const slotTime = new Date(`${slot.date}T${slot.start}:00`).getTime();
                const isPast = slotTime < now;
                const isBooked = bookedSet.has(slot.id);
                const isDisabled = isPast || isBooked;
                const isSelected = !isDisabled && dashboardState.selectedSlotId === slot.id;
                
                if (isBooked) {
                    console.log(`🔒 Créneau RÉSERVÉ détecté: ${slot.id} (${slot.date} ${slot.start})`);
                }
                
                let classes = ['planning-slot'];
                if (isDisabled) {
                    classes.push('is-booked');
                } else {
                    classes.push('available');
                }
                if (isSelected) classes.push('is-selected');
                
                // Utiliser la même fonction que admin-planning
                let instructor = 'Mylène';
                if (dashboardState.activeInstructorKey === 'sammy') instructor = 'Sammy';
                if (dashboardState.activeInstructorKey === 'nail') instructor = 'Nail';
                const endTime = getEndForStart(instructor, slot.start);
                const label = endTime ? `${slot.start.replace(':', 'h')} - ${endTime.replace(':', 'h')}` : slot.start;
                
                // Affichage simple : FÉRIÉ, RÉSERVÉ ou disponible
                let slotContent = '';
                if (slot.isFerie) {
                    // Jour férié : afficher en bleu avec "Férié"
                    classes = ['planning-slot', 'is-ferie'];
                    slotContent = `
                        <span class="slot-label">${label}</span>
                        <span class="slot-status">FÉRIÉ 🎉</span>
                    `;
                } else if (isBooked) {
                    slotContent = `
                        <span class="slot-label">${label}</span>
                        <span class="slot-status">RÉSERVÉ</span>
                    `;
                } else {
                    slotContent = `
                        <span class="slot-label">${label}</span>
                        <span class="slot-instructor">${slot.instructor}</span>
                    `;
                }
                
                html += `
                    <td class="slot-cell">
                        <button type="button"
                            class="${classes.join(' ')}"
                            data-slot-id="${slot.id}"
                            data-slot-date="${slot.date}"
                            data-slot-start="${slot.start}"
                            data-slot-instructor="${slot.instructor}"
                            ${isDisabled ? 'disabled' : ''}>
                            ${slotContent}
                        </button>
                    </td>
                `;
            } else {
                html += '<td class="slot-cell empty"></td>';
            }
        });
        
        html += '</tr>';
    });
    html += '</tbody></table>';

    grid.innerHTML = html;

    grid.querySelectorAll('.planning-slot').forEach((card) => {
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
    if (!dateStr) return 'Date inconnue';
    
    // Gérer les différents formats de date
    let date;
    if (dateStr.includes('T')) {
        // Format ISO: 2026-02-25T12:00:00.000Z
        date = new Date(dateStr);
    } else if (dateStr.includes('-')) {
        // Format: 2026-02-25
        const [year, month, day] = dateStr.split('-');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
        date = new Date(dateStr);
    }
    
    if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateStr);
        return 'Date invalide';
    }
    
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' });
}

function formatTimeRange(start, end) {
    return `${start} - ${end}`;
}

function computeStats() {
    const raw = dashboardState.rawSessions || [];
    console.log('Computing stats from sessions:', raw);
    
    // Seules les séances avec statut 'done' comptent comme heures réalisées
    const completed = raw
        .filter((s) => {
            const status = (s.status || 'upcoming');
            console.log('Session:', s.id, 'Status:', status, 'Duration:', s.duration_hours || s.durationHours);
            return status === 'done';
        })
        .reduce((sum, s) => sum + (s.duration_hours || s.durationHours || 0), 0);
    const reserved = raw
        .filter((s) => (s.status || 'upcoming') === 'upcoming')
        .reduce((sum, s) => sum + (s.duration_hours || s.durationHours || 0), 0);

    console.log('Completed hours:', completed, 'Reserved hours:', reserved);
    
    dashboardState.completedHours = completed;
    dashboardState.reservedHours = reserved;
    dashboardState.totalHours = completed + reserved;

    persistUserHoursStats();
}

function persistUserHoursStats() {
    try {
        const user = dashboardState.user || getStoredUser();
        if (!user) return;
        const updated = {
            ...user,
            hours_completed: dashboardState.completedHours,
            hours_reserved: dashboardState.reservedHours,
            hours_goal: dashboardState.hoursGoal
        };
        localStorage.setItem('ae_user', JSON.stringify(updated));
        dashboardState.user = updated;
    } catch (e) {
    }
}

function renderStats() {
    const completedEl = document.getElementById('hoursCompleted');
    const remainingEl = document.getElementById('hoursRemaining');
    const nextSessionEl = document.getElementById('nextSession');
    const instructorEl = document.getElementById('favoriteInstructor');

    // Ajouter les heures initiales aux heures complétées
    const totalCompleted = dashboardState.completedHours + (dashboardState.initialCompletedHours || 0);
    
    if (completedEl) completedEl.textContent = `${totalCompleted}h`;
    if (remainingEl) {
        const remaining = Math.max(dashboardState.hoursGoal - totalCompleted - dashboardState.reservedHours, 0);
        remainingEl.textContent = `${remaining}h`;
    }

    const upcoming = dashboardState.sessions.find((s) => s.status === 'upcoming');
    if (upcoming && nextSessionEl) {
        // Format date as DD/MM/YY (shorter year)
        const date = new Date(upcoming.date);
        const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
        // Simplify slot format: remove spaces around dash
        const slot = upcoming.slot.replace(' - ', '-');
        nextSessionEl.textContent = `${formattedDate} ${slot}`;
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
                <td colspan="6" style="text-align:center; padding: 2rem 0; color: var(--text-light);">
                    Aucune séance enregistrée pour le moment.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = dashboardState.sessions.map((session) => {
        let statusClass, statusLabel;
        if (session.status === 'done') {
            statusClass = 'status-chip status-done';
            statusLabel = 'Réalisée';
        } else if (session.status === 'pending') {
            statusClass = 'status-chip status-pending';
            statusLabel = 'En attente';
        } else if (session.status === 'cancelled_refused') {
            statusClass = 'status-chip status-refused';
            statusLabel = 'Refusée';
        } else if (session.status === 'upcoming') {
            statusClass = 'status-chip status-upcoming';
            statusLabel = 'À venir';
        } else if (session.status === 'cancelled' || session.status === 'missed') {
            // Vérifier si c'est une annulation acceptée par l'admin
            if (session.notes && session.notes.includes('refusée')) {
                statusClass = 'status-chip status-refused';
                statusLabel = 'Refusée';
            } else if (session.penaltyApplied) {
                statusClass = 'status-chip status-missed';
                statusLabel = 'Annulée (déduite)';
            } else {
                statusClass = 'status-chip status-accepted';
                statusLabel = 'Acceptée';
            }
        } else {
            statusClass = 'status-chip status-missed';
            statusLabel = 'Annulée';
        }

        const canCancel = (session.status === 'upcoming' || session.status === 'pending') && !!session.sessionId;
        const cancelBtn = (session.status === 'upcoming' && canCancel)
            ? `<button type="button" class="btn-secondary" data-cancel-session-id="${session.sessionId}">Annuler</button>`
            : (session.status === 'pending' ? '<span style="font-size:0.8rem;color:#888;">Demande en cours</span>' : '');

        return `
            <tr>
                <td>${formatDate(session.date)}</td>
                <td>${session.slot}</td>
                <td>${session.durationHours}h</td>
                <td>${session.instructor}</td>
                <td><span class="${statusClass}">${statusLabel}</span></td>
                <td>${cancelBtn}</td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('[data-cancel-session-id]').forEach((btn) => {
        if (btn.dataset.bound === 'true') return;
        btn.dataset.bound = 'true';
        btn.addEventListener('click', () => handleCancelSession(btn.dataset.cancelSessionId));
    });
}

function normalizeSessionForState(session) {
    const endTime = session.end_time || getEndTimeForSlot(session.start_time, session.instructor) || '10:00';
    
    // Normaliser le nom du moniteur
    let instructorName = session.instructor || 'Moniteur Auto-Ecole';
    if (instructorName && typeof instructorName === 'string') {
        // Capitaliser la première lettre
        instructorName = instructorName.charAt(0).toUpperCase() + instructorName.slice(1).toLowerCase();
    }
    
    return {
        sessionId: session.id || null,
        date: session.date,
        slot: formatTimeRange(
            (session.start_time || '08:00').replace(':', 'h'),
            endTime.replace(':', 'h')
        ),
        durationHours: session.duration_hours || session.durationHours || 2,
        instructor: instructorName,
        status: session.status || 'upcoming',
        notes: session.notes || '',
        penaltyApplied: session.penalty_applied === true
    };
}

function getSessionStartDateTime(session) {
    if (!session) return null;
    const start = session.start_time;
    const localDate = getLocalDateFromSession(session);
    if (!start || !localDate) return null;
    const dt = new Date(`${localDate}T${start}:00`);
    return Number.isNaN(dt.getTime()) ? null : dt;
}

function calculateBusinessHoursUntil(targetDate) {
    const now = new Date();
    let current = new Date(now);
    let hoursCount = 0;
    
    while (current < targetDate) {
        const dayOfWeek = current.getDay();
        // Exclure samedi (6) et dimanche (0)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            hoursCount++;
        }
        current.setHours(current.getHours() + 1);
    }
    
    return hoursCount;
}

async function handleCancelSession(sessionId) {
    const feedback = document.getElementById('bookingFeedback');
    const rawSessions = loadSessionsFromStorage();
    const session = rawSessions.find((s) => String(s.id) === String(sessionId));
    if (!session) return;

    const startDt = getSessionStartDateTime(session);
    if (!startDt) return;

    // Calculer les heures ouvrées (hors week-end) jusqu'à la séance
    const businessHoursUntil = calculateBusinessHoursUntil(startDt);
    const isFreeCancel = businessHoursUntil >= 48;

    if (isFreeCancel) {
        // Annulation > 48h (hors week-end) : confirmation simple et annulation immédiate
        const confirmed = window.confirm(
            `Annuler ce créneau ?\n\nTu annules plus de 48h à l'avance (hors week-ends) : le créneau ne sera pas déduit de ton forfait et redeviendra disponible.`
        );
        if (!confirmed) return;

        try {
            if (feedback) {
                feedback.textContent = 'Annulation en cours...';
                feedback.className = 'form-feedback info';
            }

            const nextSessions = rawSessions.filter((s) => String(s.id) !== String(sessionId));

            // Libérer le créneau dans Supabase
            try {
                if (window.supabaseClient) {
                    const userEmail = (dashboardState.user || getStoredUser())?.email || null;
                    
                    // 1. Trouver le slot correspondant
                    const { data: slotData } = await window.supabaseClient
                        .from('slots')
                        .select('id')
                        .eq('instructor', session.instructor)
                        .eq('status', 'booked')
                        .gte('start_at', new Date(startDt.getTime() - 60000).toISOString())
                        .lte('start_at', new Date(startDt.getTime() + 60000).toISOString())
                        .limit(1)
                        .maybeSingle();
                    
                    if (slotData?.id) {
                        // 2. Supprimer la réservation
                        await window.supabaseClient
                            .from('reservations')
                            .delete()
                            .eq('slot_id', slotData.id);
                        
                        // 3. Remettre le slot en disponible
                        await window.supabaseClient
                            .from('slots')
                            .update({ status: 'available' })
                            .eq('id', slotData.id);
                        
                        console.log('Slot libéré avec succès:', slotData.id);
                    } else {
                        console.warn('Slot non trouvé pour annulation');
                    }
                }
            } catch (e) {
                console.warn('Annulation Supabase échouée:', e);
            }

            saveSessionsToStorage(nextSessions);
            dashboardState.rawSessions = nextSessions;
            dashboardState.sessions = nextSessions.map(normalizeSessionForState);
            
            const bookedData = await fetchBookedSlotsFromSupabase();
            dashboardState.bookedSlotIds = bookedData.ids;

            computeStats();
            renderStats();
            renderSessionsTable();
            renderSlotGrid();

            if (feedback) {
                feedback.textContent = 'Créneau annulé. Il n\'est pas déduit de ton forfait.';
                feedback.className = 'form-feedback success';
            }
        } catch (err) {
            console.error('Cancel session error:', err);
            if (feedback) {
                feedback.textContent = 'Impossible d\'annuler pour le moment. Réessaie.';
                feedback.className = 'form-feedback error';
            }
        }
    } else {
        // Annulation < 48h : ouvrir la modal pour demander un justificatif
        openCancelModal(sessionId);
    }
}

function openCancelModal(sessionId) {
    const modal = document.getElementById('cancelModal');
    const sessionIdInput = document.getElementById('cancelSessionId');
    if (modal && sessionIdInput) {
        sessionIdInput.value = sessionId;
        modal.classList.add('active');
    }
}

function closeCancelModal() {
    const modal = document.getElementById('cancelModal');
    if (modal) {
        modal.classList.remove('active');
        document.getElementById('cancelReason').value = '';
        document.getElementById('cancelJustification').value = '';
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

async function handleCancelJustificationSubmit(event) {
    event.preventDefault();
    
    const sessionId = document.getElementById('cancelSessionId').value;
    const reason = document.getElementById('cancelReason').value.trim();
    const fileInput = document.getElementById('cancelJustification');
    const file = fileInput.files[0];
    const feedback = document.getElementById('bookingFeedback');
    
    if (!sessionId || !reason || !file) {
        alert('Veuillez remplir tous les champs et joindre un justificatif.');
        return;
    }

    // Vérifier la taille du fichier (max 5 Mo)
    if (file.size > 5 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Taille maximale : 5 Mo.');
        return;
    }

    try {
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Envoi en cours...';
        }

        // Convertir le fichier en Base64
        const fileBase64 = await fileToBase64(file);
        const user = dashboardState.user || getStoredUser();

        // Récupérer les infos de la session pour les enregistrer
        const rawSessions = loadSessionsFromStorage();
        const session = rawSessions.find((s) => String(s.id) === String(sessionId));
        
        // Enregistrer la demande d'annulation dans Supabase
        if (window.supabaseClient) {
            const { error } = await window.supabaseClient
                .from('cancellation_requests')
                .insert({
                    reservation_id: sessionId,
                    user_email: user?.email || null,
                    user_name: `${user?.prenom || ''} ${user?.nom || ''}`.trim(),
                    reason: reason,
                    justification_file: fileBase64,
                    justification_filename: file.name,
                    status: 'pending',
                    slot_date: session?.date || null,
                    slot_time: session?.start_time || null,
                    instructor: session?.instructor || null,
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error('Error saving cancellation request:', error);
                throw error;
            }
        }

        // Mettre à jour le statut de la session en "pending" (en attente)
        const nextSessions = rawSessions.map((s) => {
            if (String(s.id) !== String(sessionId)) return s;
            return { ...s, status: 'pending', cancellation_pending: true };
        });

        saveSessionsToStorage(nextSessions);
        dashboardState.rawSessions = nextSessions;
        dashboardState.sessions = nextSessions.map(normalizeSessionForState);

        computeStats();
        renderStats();
        renderSessionsTable();

        closeCancelModal();

        if (feedback) {
            feedback.textContent = 'Demande d\'annulation envoyée. Vous serez informé(e) de la décision par email.';
            feedback.className = 'form-feedback success';
        }

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Envoyer la demande';
        }
    } catch (err) {
        console.error('Cancel justification submit error:', err);
        alert('Erreur lors de l\'envoi de la demande. Veuillez réessayer.');
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Envoyer la demande';
        }
    }
}

function initCancelModal() {
    const closeBtn = document.getElementById('closeCancelModal');
    const cancelBtn = document.getElementById('cancelModalCancel');
    const form = document.getElementById('cancelJustificationForm');
    const modal = document.getElementById('cancelModal');

    if (closeBtn) closeBtn.addEventListener('click', closeCancelModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeCancelModal);
    if (form) form.addEventListener('submit', handleCancelJustificationSubmit);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeCancelModal();
        });
    }
}

function getSessionStorageKey() {
    const user = dashboardState.user || getStoredUser();
    const email = user?.email || 'unknown';
    return `ae_sessions_${email}`;
}

function loadSessionsFromStorage() {
    try {
        const key = getSessionStorageKey();
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const sessions = JSON.parse(raw);
        return Array.isArray(sessions) ? sessions : [];
    } catch (error) {
        console.warn('Impossible de lire les sessions :', error);
        return [];
    }
}

function saveSessionsToStorage(sessions) {
    const key = getSessionStorageKey();
    localStorage.setItem(key, JSON.stringify(sessions));
}

async function fetchBookedSlotsFromSupabase() {
    try {
        if (!window.supabaseClient) return { ids: new Set(), slots: [] };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekStart = startOfWeek(today);
        weekStart.setDate(weekStart.getDate() + (dashboardState.weekOffset * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        console.log('📅 Plage de recherche des créneaux réservés:');
        console.log('  - Début:', weekStart.toISOString(), '→', weekStart.toLocaleDateString('fr-FR'));
        console.log('  - Fin:', weekEnd.toISOString(), '→', weekEnd.toLocaleDateString('fr-FR'));
        console.log('  - Offset semaine:', dashboardState.weekOffset);

        // Récupérer les créneaux réservés via la table reservations pour être sûr de tout avoir
        const { data, error } = await window.supabaseClient
            .from('reservations')
            .select('slot_id, slots(start_at, end_at, instructor, status)')
            .gte('slots.start_at', weekStart.toISOString())
            .lt('slots.start_at', weekEnd.toISOString());

        if (error) {
            console.warn('Supabase slots fetch error:', error);
            return { ids: new Set(), slots: [] };
        }

        console.log('🔍 Réservations trouvées dans Supabase:', data?.length || 0);
        if (data && data.length > 0) {
            console.log('📋 Exemple de réservation:', data[0]);
        }

        const ids = new Set();
        const slots = [];
        (data || []).forEach((reservation) => {
            const slot = reservation.slots;
            if (!slot || !slot.start_at) return;
            
            const d = new Date(slot.start_at);
            const endD = new Date(slot.end_at);
            if (Number.isNaN(d.getTime())) return;

            const dateStr = toInputDate(d);
            const startStr = `${padNumber(d.getHours())}:${padNumber(d.getMinutes())}`;
            const endStr = `${padNumber(endD.getHours())}:${padNumber(endD.getMinutes())}`;
            const slotId = buildSlotId(dateStr, startStr);
            
            console.log(`🔑 Créneau réservé: ${dateStr} ${startStr} → ID: ${slotId} (Instructeur: ${slot.instructor})`);
            
            ids.add(slotId);
            slots.push({
                id: slotId,
                date: dateStr,
                start: startStr,
                end: endStr,
                instructor: slot.instructor,
                dayLabel: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }),
                label: `${startStr.replace(':', 'h')} - ${endStr.replace(':', 'h')}`,
                isBooked: true
            });
        });

        console.log('🔒 IDs de créneaux réservés:', Array.from(ids));
        return { ids, slots };
    } catch (err) {
        console.warn('Supabase slots fetch exception:', err);
        return { ids: new Set(), slots: [] };
    }
}

async function fetchSessions(user) {
    const now = new Date();
    
    // Charger les sessions directement depuis Supabase
    if (window.supabaseClient && user?.email) {
        try {
            console.log('🔍 Chargement des réservations pour:', user.email);
            const { data: reservations, error: fetchError } = await window.supabaseClient
                .from('reservations')
                .select(`
                    *,
                    slots (
                        start_at,
                        end_at,
                        instructor
                    )
                `)
                .eq('email', user.email);
            
            if (fetchError) {
                console.error('Error fetching reservations:', fetchError);
            }
            
            console.log('📋 Réservations trouvées:', (reservations || []).length);
            if (reservations && reservations.length > 0) {
                console.log('📊 Exemple de réservation avec slot:', reservations[0]);
            }
            
            // Construire les sessions depuis Supabase
            const sessions = (reservations || []).map(reservation => {
                const slot = reservation.slots;
                
                if (!slot) {
                    console.warn('Réservation sans slot:', reservation.id);
                    return null;
                }
                
                // Extraire date et heures depuis start_at et end_at
                const startAt = new Date(slot.start_at);
                const endAt = new Date(slot.end_at);
                const date = slot.start_at.split('T')[0]; // Format: YYYY-MM-DD
                const start_time = startAt.toTimeString().slice(0, 5); // Format: HH:MM
                const end_time = endAt.toTimeString().slice(0, 5);
                const duration_hours = (endAt - startAt) / (1000 * 60 * 60);
                
                let status = reservation.status || 'upcoming';
                
                // Automatiquement marquer comme 'done' si la séance est passée
                if (status === 'upcoming' && endAt < now) {
                    status = 'done';
                    // Mettre à jour dans Supabase
                    window.supabaseClient
                        .from('reservations')
                        .update({ status: 'done' })
                        .eq('id', reservation.id)
                        .then(() => console.log(`Session ${reservation.id} marked as done`))
                        .catch(err => console.warn('Error updating session status:', err));
                }
                
                return {
                    id: reservation.id,
                    date: date,
                    start_time: start_time,
                    end_time: end_time,
                    duration_hours: duration_hours,
                    instructor: slot.instructor,
                    status: status,
                    notes: reservation.notes
                };
            }).filter(s => s !== null);
            
            // Ajouter les sessions locales avec statut cancelled_refused
            const storedSessions = loadSessionsFromStorage();
            const supabaseIds = new Set(sessions.map(s => String(s.id)));
            const cancelledSessions = storedSessions.filter(s => 
                s.status === 'cancelled_refused' && !supabaseIds.has(String(s.id))
            );
            
            const allSessions = [...sessions, ...cancelledSessions];
            
            saveSessionsToStorage(allSessions);
            dashboardState.rawSessions = allSessions;
        } catch (err) {
            console.warn('Error fetching sessions from Supabase:', err);
            dashboardState.rawSessions = loadSessionsFromStorage();
        }
    } else {
        dashboardState.rawSessions = loadSessionsFromStorage();
    }
    
    dashboardState.sessions = dashboardState.rawSessions.map(normalizeSessionForState);
    dashboardState.favoriteInstructor = dashboardState.sessions[0]?.instructor || dashboardState.favoriteInstructor;
    
    // Générer les slots depuis les blueprints
    const generatedSlots = generateUpcomingSlots();
    
    // Récupérer les slots réservés depuis Supabase
    const bookedData = await fetchBookedSlotsFromSupabase();
    dashboardState.bookedSlotIds = bookedData.ids;
    
    // Fusionner les slots générés avec les slots réservés
    const allSlots = [...generatedSlots];
    bookedData.slots.forEach(bookedSlot => {
        // Ajouter le slot réservé seulement s'il n'existe pas déjà dans les slots générés
        if (!allSlots.find(s => s.id === bookedSlot.id)) {
            allSlots.push(bookedSlot);
        }
    });
    
    dashboardState.availableSlots = allSlots;

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

async function refreshUserProfile(user) {
    if (!window.supabaseClient || !user || !user.email) return user;
    try {
        const { data, error } = await window.supabaseClient
            .from('users')
            .select('id, prenom, nom, email, telephone, forfait')
            .ilike('email', user.email)
            .limit(1)
            .maybeSingle();
        if (!error && data) {
            const updated = { ...user, nom: data.nom, telephone: data.telephone, prenom: data.prenom, forfait: data.forfait };
            localStorage.setItem('ae_user', JSON.stringify(updated));
            dashboardState.user = updated;
            
            // Récupérer le pack de l'utilisateur pour définir l'objectif d'heures
            await fetchUserPackAndSetGoal(data.forfait);
            
            return updated;
        }
    } catch (e) {
        console.warn('refreshUserProfile error:', e);
    }
    return user;
}

async function fetchUserPackAndSetGoal(forfait) {
    try {
        console.log('🔍 Pack récupéré depuis users.forfait:', forfait);
        
        // Try to get hours_goal and hours_remaining from database first
        const user = dashboardState.user;
        if (user && user.email) {
            const { data, error } = await window.supabaseClient
                .from('users')
                .select('hours_goal, hours_completed_initial')
                .eq('email', user.email)
                .maybeSingle();
            
            if (!error && data) {
                console.log('📊 Données utilisateur récupérées:', data);
                
                // Packs sans heures de conduite : toujours 0h
                const packsWithoutDriving = ['code'];
                if (packsWithoutDriving.includes(forfait)) {
                    dashboardState.hoursGoal = 0;
                    console.log('✅ Forfait', forfait, '→ 0 heures de conduite');
                } else {
                    if (data.hours_goal !== null && data.hours_goal !== undefined) {
                        dashboardState.hoursGoal = data.hours_goal;
                        console.log('✅ hours_goal récupéré depuis la DB:', dashboardState.hoursGoal);
                    }
                }
                
                // Récupérer hours_completed_initial directement
                console.log('🔍 hours_completed_initial dans la DB:', data.hours_completed_initial);
                
                if (data.hours_completed_initial !== null && data.hours_completed_initial !== undefined) {
                    dashboardState.initialCompletedHours = data.hours_completed_initial;
                    console.log('✅ Heures déjà effectuées avant inscription:', dashboardState.initialCompletedHours);
                } else {
                    dashboardState.initialCompletedHours = 0;
                    console.log('⚠️ Aucune heure initiale trouvée, défaut à 0');
                }
                
                if (dashboardState.hoursGoal !== undefined) return;
            }
        }
        
        // Fallback to pack-based mapping if hours_goal not in DB
        if (forfait) {
            // Définir les heures par forfait
            const packHours = {
                'code': 0,              // Code de la route uniquement, pas de conduite
                'aac': 20,
                'supervisee': 20,
                'boite-auto': 13,
                'am': 8,
                'second-chance': 6
            };
            
            dashboardState.hoursGoal = packHours[forfait] !== undefined ? packHours[forfait] : 20;
            console.log('✅ Pack détecté:', forfait, '- Objectif heures (fallback):', dashboardState.hoursGoal);
        } else {
            console.warn('⚠️ Aucun forfait trouvé, utilisation de 20h par défaut');
            dashboardState.hoursGoal = 20;
        }
        
        if (!dashboardState.initialCompletedHours) {
            dashboardState.initialCompletedHours = 0;
        }
    } catch (e) {
        console.error('❌ fetchUserPackAndSetGoal error:', e);
        dashboardState.hoursGoal = 20;
        dashboardState.initialCompletedHours = 0;
    }
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

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
    }

    let user = dashboardState.user || getStoredUser();
    if (!user) {
        window.location.href = getLoginUrl('espace-eleve.html');
        return;
    }

    const dateValue = form.elements['date']?.value;
    const startValue = form.elements['start']?.value;
    const instructorValue = form.elements['instructor']?.value;
    const statusValue = form.elements['status']?.value || 'upcoming';
    const notesValue = form.elements['notes']?.value?.trim();
    const endValue = getEndTimeForSlot(startValue, instructorValue);

    if (!dateValue || !startValue || !instructorValue || !endValue) {
        if (feedback) {
            feedback.textContent = 'Merci de remplir tous les champs obligatoires.';
            feedback.classList.add('error');
        }
        return;
    }

    (async () => {
        try {
            if (!window.supabaseClient) {
                throw new Error('Supabase client not initialized');
            }

            if (submitBtn) {
                submitBtn.dataset.originalText = submitBtn.dataset.originalText || submitBtn.textContent;
                submitBtn.textContent = 'Confirmation...';
            }

            const startAt = new Date(`${dateValue}T${startValue}:00`);
            const endAt = new Date(`${dateValue}T${endValue}:00`);
            
            // Vérifier que ce n'est pas un dimanche (réservé à l'admin)
            const bookingDay = startAt.getDay();
            if (bookingDay === 0) {
                if (feedback) {
                    feedback.textContent = '⚠️ Les réservations ne sont pas possibles le dimanche.';
                    feedback.className = 'form-feedback error';
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitBtn.dataset.originalText || 'Réserver';
                }
                return;
            }
            
            // Vérifier si l'utilisateur a un forfait avec heures de conduite
            if (dashboardState.hoursGoal === 0) {
                if (feedback) {
                    feedback.innerHTML = `⚠️ Ton forfait ne comprend pas d'heures de conduite.<br><a href="inscription.html" style="color: var(--primary-color); text-decoration: underline;">Acheter un pack conduite</a>`;
                    feedback.className = 'form-feedback error';
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitBtn.dataset.originalText || 'Réserver';
                }
                return;
            }

            // Vérifier si l'utilisateur a assez d'heures disponibles
            const hoursToBook = (endAt - startAt) / (1000 * 60 * 60); // Durée en heures
            const totalReservedAfter = dashboardState.reservedHours + hoursToBook;
            const remainingHours = dashboardState.hoursGoal - dashboardState.completedHours;
            
            if (totalReservedAfter > remainingHours) {
                const missingHours = totalReservedAfter - remainingHours;
                if (feedback) {
                    feedback.innerHTML = `⚠️ Heures insuffisantes. Il te manque <strong>${missingHours}h</strong>.<br><a href="#" onclick="openExtraHoursPayment(${missingHours}); return false;" style="color: var(--primary-color); text-decoration: underline;">Acheter ${missingHours}h supplémentaires</a>`;
                    feedback.className = 'form-feedback error';
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitBtn.dataset.originalText || 'Réserver';
                }
                return;
            }

            // Charger les données complètes de l'utilisateur depuis Supabase
            user = await refreshUserProfile(user);
            console.log('Booking with user:', user.prenom, user.nom, user.telephone);

            const { data, error } = await window.supabaseClient.rpc('book_slot', {
                p_start_at: startAt.toISOString(),
                p_end_at: endAt.toISOString(),
                p_instructor: instructorValue,
                p_email: user.email,
                p_first_name: user.prenom || null,
                p_last_name: user.nom || null,
                p_phone: user.telephone || null
            });

            if (error) {
                throw error;
            }

            console.log('📦 book_slot response:', JSON.stringify(data));

            if (!data || data.ok !== true) {
                const reason = data?.error || 'UNKNOWN_ERROR';
                console.error('❌ Échec de book_slot:', reason);
                
                if (feedback) {
                    let errorMessage = 'Impossible de confirmer la réservation. Réessaie.';
                    
                    if (reason === 'SLOT_NOT_AVAILABLE' || reason.includes('duplicate key') || reason.includes('reservations_slot_unique')) {
                        errorMessage = 'Ce créneau vient d\'être réservé par quelqu\'un d\'autre. Choisis-en un autre.';
                    }
                    
                    feedback.textContent = errorMessage;
                    feedback.className = 'form-feedback error';
                }
                
                // Recharger les créneaux pour mettre à jour l'affichage
                await refreshSlotsForCurrentWeek();
                renderSlotGrid();
                
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitBtn.dataset.originalText || 'Réserver';
                }
                
                // ARRÊTER ICI - Ne PAS sauvegarder en localStorage si book_slot échoue
                return;
            }
            
            // Vérifier que slot_id et reservation_id sont bien retournés
            if (!data.slot_id || !data.reservation_id) {
                console.error('❌ book_slot n\'a pas retourné slot_id ou reservation_id:', data);
                if (feedback) {
                    feedback.textContent = 'Erreur technique lors de la réservation. Contacte l\'auto-école.';
                    feedback.className = 'form-feedback error';
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitBtn.dataset.originalText || 'Réserver';
                }
                return;
            }

            // Réservation créée avec succès dans Supabase
            console.log('✅ Réservation créée - Slot ID:', data.slot_id, 'Reservation ID:', data.reservation_id);
            
            // Recharger les sessions depuis Supabase pour afficher la nouvelle réservation
            await refreshSlotsForCurrentWeek();
            
            // Rafraîchir l'affichage
            computeStats();
            renderStats();
            renderSessionsTable();
            renderSlotGrid();

            showBookingNotification({
                id: data.reservation_id,
                date: startAt.toISOString(),
                start_time: startValue,
                end_time: endValue,
                instructor: instructorValue
            }, dateValue, startValue, endValue, instructorValue, data.reservation_id);

            if (feedback) {
                feedback.textContent = 'Réservation confirmée. Ton compteur d\'heures a été mis à jour.';
                feedback.className = 'form-feedback success';
            }

            form.reset();
            dashboardState.selectedSlotId = null;
        } catch (err) {
            console.error('Erreur réservation Supabase:', err);
            if (feedback) {
                feedback.textContent = 'Erreur lors de la réservation. Réessaie dans quelques secondes.';
                feedback.className = 'form-feedback error';
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtn.dataset.originalText || 'Confirmer ma réservation';
            }
        }
    })();
}

function showBookingNotification(session, dateValue, startValue, endValue, instructorValue, reservationId) {
    const formattedDate = new Date(dateValue).toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    
    const notificationHTML = `
        <div class="booking-notification" id="bookingNotification" data-reservation-id="${reservationId || ''}">
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
                
                <div style="background: linear-gradient(135deg, #fff9fb 0%, #fff 100%); padding: 1.5rem; border-radius: 12px; margin: 1.5rem 0; border: 2px solid rgba(233,30,99,0.1);">
                    <h4 style="margin: 0 0 1rem 0; font-size: 1.05rem; color: #1d1d1f;">
                        <i class="fas fa-bell" style="color: var(--primary-color);"></i> 
                        Veux-tu être contacté(e) en cas de désistement ?
                    </h4>
                    <p style="margin: 0 0 1rem 0; color: #6c757d; font-size: 0.9rem;">
                        Si un créneau se libère suite à une annulation, nous pouvons te contacter en priorité pour le récupérer.
                    </p>
                    <div style="display: flex; gap: 1rem;">
                        <button onclick="handleCancellationInterest(true)" class="btn-primary" style="flex: 1; padding: 0.75rem; font-size: 0.95rem;">
                            <i class="fas fa-check"></i> Oui, je suis intéressé(e)
                        </button>
                        <button onclick="handleCancellationInterest(false)" class="btn-secondary" style="flex: 1; padding: 0.75rem; font-size: 0.95rem;">
                            <i class="fas fa-times"></i> Non merci
                        </button>
                    </div>
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

window.handleCancellationInterest = function(interested) {
    // Marquer que l'utilisateur a répondu (ne pas supprimer la réservation)
    const notification = document.getElementById('bookingNotification');
    if (!notification) return;
    
    notification.removeAttribute('data-reservation-id');
    
    if (!interested) {
        // Si non intéressé, fermer la popup (sans supprimer la réservation)
        closeBookingNotification();
        return;
    }
    
    // Si intéressé, afficher le formulaire de sélection des créneaux dans la popup
    
    const content = notification.querySelector('.notification-content');
    if (!content) return;
    
    // Remplacer le contenu de la popup par le formulaire de sélection
    content.innerHTML = `
        <div style="position: relative;">
            <button onclick="closeBookingNotification()" style="position: absolute; top: -0.5rem; right: -0.5rem; width: 28px; height: 28px; border-radius: 50%; border: none; background: #ff3b30; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; z-index: 10;">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;">Sélectionne tes disponibilités</h3>
        <p style="color: #6c757d; margin-bottom: 1rem; font-size: 0.85rem;">
            Choisis les semaines, jours et créneaux où tu es disponible en cas de désistement.
        </p>
        
        <!-- Sélection des semaines -->
        <div style="background: #e3f2fd; padding: 0.75rem; border-radius: 10px; margin-bottom: 1rem; border-left: 3px solid #2196f3;">
            <h4 style="margin: 0 0 0.5rem 0; font-size: 0.85rem; font-weight: 600; color: #0d47a1;">
                <i class="fas fa-calendar-week"></i> Semaines
            </h4>
            <div id="weeksContainer" style="display: grid; grid-template-columns: 1fr; gap: 0.4rem;">
                <!-- Les semaines seront générées dynamiquement avec les dates -->
            </div>
        </div>
        
        <div id="availabilityDaysSelection" style="max-height: 200px; overflow-y: auto; margin-bottom: 0.75rem;">
            <!-- Lundi -->
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 12px; margin-bottom: 1rem;">
                <label style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; font-weight: 600; cursor: pointer;">
                    <input type="checkbox" class="day-checkbox-popup" data-day="lundi" style="width: 20px; height: 20px; cursor: pointer;">
                    <span>Lundi</span>
                </label>
                <div class="time-slots-popup" data-day="lundi" style="display: none; padding-left: 1.5rem;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="07:00-09:00"> 07h-09h (Sammy)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="09:00-11:00"> 09h-11h (Sammy)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="11:00-13:00"> 11h-13h (Sammy)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="13:00-15:00"> 13h-15h (Mylène)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="15:00-17:00"> 15h-17h (Mylène)
                        </label>
                    </div>
                </div>
            </div>
            
            <!-- Mardi -->
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 12px; margin-bottom: 1rem;">
                <label style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; font-weight: 600; cursor: pointer;">
                    <input type="checkbox" class="day-checkbox-popup" data-day="mardi" style="width: 20px; height: 20px; cursor: pointer;">
                    <span>Mardi</span>
                </label>
                <div class="time-slots-popup" data-day="mardi" style="display: none; padding-left: 1.5rem;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="07:00-09:00"> 07h-09h (Sammy)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="09:00-11:00"> 09h-11h (Sammy)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="11:00-13:00"> 11h-13h (Sammy)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="13:00-15:00"> 13h-15h (Mylène)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="15:00-17:00"> 15h-17h (Mylène)
                        </label>
                    </div>
                </div>
            </div>
            
            <!-- Mercredi -->
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 12px; margin-bottom: 1rem;">
                <label style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; font-weight: 600; cursor: pointer;">
                    <input type="checkbox" class="day-checkbox-popup" data-day="mercredi" style="width: 20px; height: 20px; cursor: pointer;">
                    <span>Mercredi</span>
                </label>
                <div class="time-slots-popup" data-day="mercredi" style="display: none; padding-left: 1.5rem;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="07:00-09:00"> 07h-09h (Sammy)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="09:00-11:00"> 09h-11h (Sammy)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="11:00-13:00"> 11h-13h (Sammy)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="13:00-15:00"> 13h-15h (Mylène)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="15:00-17:00"> 15h-17h (Mylène)
                        </label>
                    </div>
                </div>
            </div>
            
            <!-- Jeudi -->
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 12px; margin-bottom: 1rem;">
                <label style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; font-weight: 600; cursor: pointer;">
                    <input type="checkbox" class="day-checkbox-popup" data-day="jeudi" style="width: 20px; height: 20px; cursor: pointer;">
                    <span>Jeudi</span>
                </label>
                <div class="time-slots-popup" data-day="jeudi" style="display: none; padding-left: 1.5rem;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="07:00-09:00"> 07h-09h (Sammy)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="09:00-11:00"> 09h-11h (Sammy)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="11:00-13:00"> 11h-13h (Sammy)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="13:00-15:00"> 13h-15h (Mylène)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="15:00-17:00"> 15h-17h (Mylène)
                        </label>
                    </div>
                </div>
            </div>
            
            <!-- Vendredi -->
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 12px; margin-bottom: 1rem;">
                <label style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; font-weight: 600; cursor: pointer;">
                    <input type="checkbox" class="day-checkbox-popup" data-day="vendredi" style="width: 20px; height: 20px; cursor: pointer;">
                    <span>Vendredi</span>
                </label>
                <div class="time-slots-popup" data-day="vendredi" style="display: none; padding-left: 1.5rem;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="07:00-09:00"> 07h-09h (Sammy)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="09:00-11:00"> 09h-11h (Sammy)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="11:00-13:00"> 11h-13h (Sammy)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="13:00-15:00"> 13h-15h (Mylène)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="15:00-17:00"> 15h-17h (Mylène)
                        </label>
                    </div>
                </div>
            </div>
            
            <!-- Samedi -->
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 12px; margin-bottom: 1rem;">
                <label style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; font-weight: 600; cursor: pointer;">
                    <input type="checkbox" class="day-checkbox-popup" data-day="samedi" style="width: 20px; height: 20px; cursor: pointer;">
                    <span>Samedi</span>
                </label>
                <div class="time-slots-popup" data-day="samedi" style="display: none; padding-left: 1.5rem;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="07:00-09:00"> 07h-09h (Sammy)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="09:00-11:00"> 09h-11h (Sammy)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="11:00-13:00"> 11h-13h (Sammy)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="13:00-15:00"> 13h-15h (Mylène)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="15:00-17:00"> 15h-17h (Mylène)
                        </label>
                    </div>
                </div>
            </div>
        </div>
        
        <p id="availabilityFeedbackPopup" style="text-align: center; font-weight: 600; margin-bottom: 1rem;"></p>
        
        <button class="btn-close-notification" onclick="saveAvailabilityFromPopup()" style="margin-bottom: 0.75rem;">
            <i class="fas fa-save"></i> Enregistrer mes disponibilités
        </button>
        <button class="btn-secondary" onclick="closeBookingNotification()" style="width: 100%; padding: 0.75rem; border: none; border-radius: 50px; cursor: pointer; font-size: 1rem; font-weight: 700;">
            <i class="fas fa-times"></i> Fermer
        </button>
    `;
    
    // Générer les semaines avec les dates réelles
    setTimeout(() => {
        const weeksContainer = document.getElementById('weeksContainer');
        if (weeksContainer) {
            const today = new Date();
            const weeks = [];
            
            // Trouver le lundi de cette semaine
            const currentDay = today.getDay(); // 0 = dimanche, 1 = lundi, etc.
            const daysUntilMonday = currentDay === 0 ? -6 : 1 - currentDay; // Si dimanche, reculer de 6 jours
            const thisMonday = new Date(today);
            thisMonday.setDate(today.getDate() + daysUntilMonday);
            
            for (let i = 0; i < 4; i++) {
                const weekStart = new Date(thisMonday);
                weekStart.setDate(thisMonday.getDate() + (i * 7));
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                
                const startStr = weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                const endStr = weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                
                weeks.push(`
                    <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.8rem;">
                        <input type="checkbox" class="week-checkbox-popup" value="semaine${i + 1}" style="width: 15px; height: 15px; cursor: pointer;">
                        <span>Du ${startStr} au ${endStr}</span>
                    </label>
                `);
            }
            
            weeks.push(`
                <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.8rem;">
                    <input type="checkbox" class="week-checkbox-popup" value="toutes" style="width: 15px; height: 15px; cursor: pointer;">
                    <span><strong>Toutes les semaines</strong></span>
                </label>
            `);
            
            weeksContainer.innerHTML = weeks.join('');
        }
        
        // Ajouter les event listeners pour les checkboxes de jours
        document.querySelectorAll('.day-checkbox-popup').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const day = this.dataset.day;
                const timeSlots = document.querySelector(`.time-slots-popup[data-day="${day}"]`);
                if (timeSlots) {
                    timeSlots.style.display = this.checked ? 'block' : 'none';
                    if (!this.checked) {
                        timeSlots.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                    }
                }
            });
        });
    }, 100);
};

window.saveAvailabilityFromPopup = async function() {
    try {
        const userEmail = dashboardState.user?.email;
        const userName = dashboardState.user ? `${dashboardState.user.prenom} ${dashboardState.user.nom}` : '';
        const userPhone = dashboardState.user?.telephone || '';
        
        if (!userEmail) {
            alert('Erreur: utilisateur non connecté');
            return;
        }
        
        const feedback = document.getElementById('availabilityFeedbackPopup');
        
        // Collect selected weeks
        const selectedWeeks = [];
        document.querySelectorAll('.week-checkbox-popup:checked').forEach(weekCheckbox => {
            selectedWeeks.push(weekCheckbox.value);
        });
        
        // Validate: must select at least one week
        if (selectedWeeks.length === 0) {
            if (feedback) {
                feedback.textContent = '⚠️ Sélectionne au moins une semaine de disponibilité';
                feedback.style.color = '#d32f2f';
            }
            return;
        }
        
        // Collect selected slots
        const availabilitySlots = {};
        document.querySelectorAll('.day-checkbox-popup:checked').forEach(dayCheckbox => {
            const day = dayCheckbox.dataset.day;
            const timeSlots = document.querySelector(`.time-slots-popup[data-day="${day}"]`);
            if (timeSlots) {
                const selectedTimes = [];
                timeSlots.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                    selectedTimes.push(cb.value);
                });
                if (selectedTimes.length > 0) {
                    availabilitySlots[day] = selectedTimes;
                }
            }
        });
        
        // Validate: must select at least one slot
        if (Object.keys(availabilitySlots).length === 0) {
            if (feedback) {
                feedback.textContent = '⚠️ Sélectionne au moins un jour et un créneau horaire';
                feedback.style.color = '#d32f2f';
            }
            return;
        }
        
        const payload = {
            user_email: userEmail,
            user_name: userName,
            user_phone: userPhone,
            wants_cancellation_notifications: true,
            availability_weeks: selectedWeeks,
            availability_slots: availabilitySlots,
            updated_at: new Date().toISOString()
        };
        
        // Upsert (insert or update)
        const { error } = await window.supabaseClient
            .from('student_availability')
            .upsert(payload, { onConflict: 'user_email' });
        
        if (error) {
            console.error('Error saving availability:', error);
            if (feedback) {
                feedback.textContent = '❌ Erreur lors de l\'enregistrement';
                feedback.style.color = '#d32f2f';
            }
            return;
        }
        
        if (feedback) {
            feedback.textContent = '✅ Disponibilités enregistrées avec succès !';
            feedback.style.color = '#0a8e47';
        }
        
        // Fermer la popup après 2 secondes
        setTimeout(() => {
            closeBookingNotification();
        }, 2000);
        
    } catch (err) {
        console.error('Error saving availability:', err);
        const feedback = document.getElementById('availabilityFeedbackPopup');
        if (feedback) {
            feedback.textContent = '❌ Erreur lors de l\'enregistrement';
            feedback.style.color = '#d32f2f';
        }
    }
};

window.closeBookingNotification = async function() {
    const notification = document.getElementById('bookingNotification');
    if (notification) {
        // Vérifier si on a un ID de réservation temporaire à supprimer
        const reservationId = notification.dataset.reservationId;
        
        if (reservationId) {
            // Supprimer la réservation de la base de données car l'utilisateur a fermé sans confirmer
            try {
                await window.supabaseClient
                    .from('reservations')
                    .delete()
                    .eq('id', reservationId);
                
                console.log('Réservation annulée car popup fermée sans confirmation');
                
                // Recharger les données pour mettre à jour l'interface
                if (typeof loadUserReservations === 'function') {
                    await loadUserReservations();
                }
                if (typeof renderSlotGrid === 'function') {
                    renderSlotGrid();
                }
            } catch (err) {
                console.error('Erreur lors de l\'annulation de la réservation:', err);
            }
        }
        
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }
};

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
            <option value="17:00">17h00 - 19h00</option>
        `;
    } else if (instructor === 'Nail') {
        // Nail a les mêmes horaires que Mylène (après-midi uniquement)
        startSelect.innerHTML = `
            <option value="">Sélectionne une heure</option>
            <option value="13:00">13h00 - 15h00</option>
            <option value="15:00">15h00 - 17h00</option>
            <option value="17:00">17h00 - 19h00</option>
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

    // Bloquer la sélection de dimanche sur le champ date
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        dateInput.addEventListener('change', function() {
            const feedback = document.getElementById('bookingFeedback');
            if (this.value) {
                const selectedDate = new Date(this.value + 'T00:00:00');
                const day = selectedDate.getDay();
                if (day === 0) {
                    this.value = '';
                    if (feedback) {
                        feedback.textContent = '⚠️ Les réservations ne sont pas possibles le dimanche.';
                        feedback.className = 'form-feedback error';
                    }
                } else if (feedback && feedback.textContent.includes('dimanche')) {
                    feedback.textContent = '';
                    feedback.className = 'form-feedback';
                }
            }
        });
    }

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

async function initStudentDashboard() {
    const user = requireAuth();
    if (!user) return;
    dashboardState.user = user;
    
    // Vérifier si l'élève a réussi son permis
    if (window.checkStudentExamStatus) {
        const examData = await window.checkStudentExamStatus(user.email);
        if (examData) {
            // L'élève a réussi son permis, afficher le message de félicitations
            console.log('✅ Élève a réussi son permis, blocage des réservations');
            if (window.displaySuccessMessage) {
                window.displaySuccessMessage(examData);
            }
            return; // Arrêter l'initialisation du dashboard
        }
    }
    hydrateHeader(user);

    // Charger les données complètes depuis Supabase
    const fullUser = await refreshUserProfile(user);
    hydrateHeader(fullUser);

    fetchSessions(fullUser);
    initBookingForm();
    initCancelModal();
    initTabs();
    updateWeekDisplay(); // Initialiser l'affichage de la semaine
    
    // Afficher le carnet de bord si AAC/Supervisée
    await checkAndShowDrivingLog();
}

// ============================================
// CARNET DE BORD - AAC/SUPERVISÉE
// ============================================

async function checkAndShowDrivingLog() {
    const user = dashboardState.user || getStoredUser();
    if (!user || !user.forfait) return;
    
    // Afficher le carnet de bord uniquement pour AAC et Supervisée
    if (user.forfait === 'aac' || user.forfait === 'supervisee') {
        // Afficher l'onglet Carnet de bord
        const tabBtn = document.getElementById('drivingLogTabBtn');
        if (tabBtn) {
            tabBtn.style.display = 'flex';
        }
        
        await fetchDrivingLogs(user.email);
        initDrivingLogForm();
    }
}

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // Retirer la classe active de tous les boutons et contenus
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Ajouter la classe active au bouton et contenu ciblés
            btn.classList.add('active');
            if (targetTab === 'sessions') {
                document.getElementById('sessionsTab').classList.add('active');
            } else if (targetTab === 'driving-log') {
                document.getElementById('drivingLogTab').classList.add('active');
            }
        });
    });
}

async function fetchDrivingLogs(email) {
    try {
        const { data, error } = await window.supabaseClient
            .from('driving_log')
            .select('*')
            .eq('user_email', email)
            .order('date', { ascending: false });
        
        if (error) {
            console.error('Erreur chargement trajets:', error);
            return;
        }
        
        renderDrivingLogs(data || []);
    } catch (err) {
        console.error('Erreur:', err);
    }
}

function renderDrivingLogs(logs) {
    const container = document.getElementById('tripsContainer');
    if (!container) return;
    
    // Calculer les statistiques
    const totalTrips = logs.length;
    const totalMinutes = logs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
    const totalKm = logs.reduce((sum, log) => sum + (parseFloat(log.distance_km) || 0), 0);
    
    // Mettre à jour les stats
    document.getElementById('totalTrips').textContent = totalTrips;
    document.getElementById('totalHours').textContent = `${Math.floor(totalMinutes / 60)}h${totalMinutes % 60 > 0 ? (totalMinutes % 60) + 'm' : ''}`;
    document.getElementById('totalKm').textContent = `${totalKm.toFixed(1)} km`;
    
    if (logs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <p>Aucun trajet enregistré</p>
                <span>Commencez à enregistrer vos heures de conduite</span>
            </div>
        `;
        return;
    }
    
    container.innerHTML = logs.map(log => {
        const date = new Date(log.date);
        const day = date.getDate();
        const month = date.toLocaleDateString('fr-FR', { month: 'short' });
        const hours = Math.floor(log.duration_minutes / 60);
        const minutes = log.duration_minutes % 60;
        const durationText = hours > 0 ? `${hours}h${minutes > 0 ? minutes + 'm' : ''}` : `${minutes}m`;
        
        return `
            <div class="trip-card">
                <div class="trip-date">
                    <div class="trip-date-day">${day}</div>
                    <div class="trip-date-month">${month}</div>
                </div>
                <div class="trip-details">
                    <div class="trip-route">${log.route}</div>
                    <div class="trip-meta">
                        <div class="trip-meta-item">
                            <span>⏱️</span>
                            <strong>${durationText}</strong>
                        </div>
                        <div class="trip-meta-item">
                            <span>📍</span>
                            <strong>${log.distance_km} km</strong>
                        </div>
                    </div>
                    ${log.conditions ? `<div class="trip-conditions">🌤️ ${log.conditions}</div>` : ''}
                    ${log.remarks ? `<div class="trip-remarks">💭 ${log.remarks}</div>` : ''}
                </div>
                <div class="trip-actions">
                    <button class="delete-btn" onclick="deleteDrivingLog('${log.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function handleDrivingLogSubmit(e) {
    e.preventDefault();
    const user = dashboardState.user || getStoredUser();
    if (!user) return;
    
    const formData = new FormData(e.target);
    const data = {
        user_email: user.email,
        date: formData.get('date'),
        duration_minutes: parseInt(formData.get('duration')),
        distance_km: parseFloat(formData.get('distance')),
        route: formData.get('route'),
        conditions: formData.get('conditions') || null,
        remarks: formData.get('remarks') || null
    };
    
    const { error } = await window.supabaseClient
        .from('driving_log')
        .insert(data);
    
    if (error) {
        alert('Erreur lors de l\'enregistrement');
        console.error(error);
        return;
    }
    
    e.target.reset();
    await fetchDrivingLogs(user.email);
    alert('Trajet enregistré avec succès !');
}

window.deleteDrivingLog = async function(logId) {
    if (!confirm('Supprimer ce trajet ?')) return;
    
    const { error } = await window.supabaseClient
        .from('driving_log')
        .delete()
        .eq('id', logId);
    
    if (error) {
        alert('Erreur lors de la suppression');
        console.error(error);
        return;
    }
    
    const user = dashboardState.user || getStoredUser();
    await fetchDrivingLogs(user.email);
}

// Fonction pour ouvrir le modal de paiement d'heures supplémentaires
window.openExtraHoursPayment = function(missingHours) {
    const modal = document.getElementById('extraHoursModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Pré-remplir avec le nombre d'heures manquantes (arrondi à la paire supérieure)
        const hoursNeeded = Math.ceil(missingHours / 2) * 2;
        const input = document.getElementById('extraHoursInput');
        if (input) {
            input.value = hoursNeeded;
            updateExtraHoursPrice();
        }
    }
};

window.closeExtraHoursModal = function() {
    const modal = document.getElementById('extraHoursModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

window.updateExtraHoursPrice = function() {
    const hoursInput = document.getElementById('extraHoursInput');
    const transmissionInput = document.querySelector('input[name="extraTransmission"]:checked');
    const totalPriceEl = document.getElementById('extraHoursTotalPrice');
    
    if (!hoursInput || !totalPriceEl) return;
    
    let hours = parseInt(hoursInput.value) || 0;
    
    // Ensure even number
    if (hours % 2 !== 0) {
        hours = Math.floor(hours / 2) * 2;
        hoursInput.value = hours;
    }
    
    const pricePerHour = transmissionInput ? parseInt(transmissionInput.dataset.price) || 0 : 0;
    const totalPrice = hours * pricePerHour;
    
    totalPriceEl.textContent = totalPrice > 0 ? totalPrice + '€' : '0€';
};

window.submitExtraHours = async function(e) {
    e.preventDefault();
    
    const hours = parseInt(document.getElementById('extraHoursInput').value) || 0;
    const transmissionInput = document.querySelector('input[name="extraTransmission"]:checked');
    
    if (hours <= 0 || hours % 2 !== 0) {
        alert('Le nombre d\'heures doit être pair (2, 4, 6, 8, etc.)');
        return;
    }
    
    if (!transmissionInput) {
        alert('Veuillez sélectionner un type de boîte');
        return;
    }
    
    const pricePerHour = parseInt(transmissionInput.dataset.price);
    const totalPrice = hours * pricePerHour;
    const transmissionType = transmissionInput.value;
    const packName = `${hours}h de conduite - Boîte ${transmissionType === 'manual' ? 'manuelle' : 'automatique'}`;
    
    // Rediriger vers tarifs avec les données
    localStorage.setItem('extraHoursPurchase', JSON.stringify({
        hours: hours,
        transmission: transmissionType,
        price: totalPrice,
        packName: packName
    }));
    
    window.location.href = 'tarifs.html#payer-heures';
};

function initDrivingLogForm() {
    const form = document.getElementById('drivingLogForm');
    if (form) {
        form.addEventListener('submit', handleDrivingLogSubmit);
    }
}

// ============================================
// AVAILABILITY FOR CANCELLATIONS
// ============================================

async function initAvailabilityConfig() {
    const wantsNotifCheckbox = document.getElementById('wantsCancellationNotif');
    const availabilityConfig = document.getElementById('availabilityConfig');
    const saveButton = document.getElementById('saveAvailability');
    
    if (!wantsNotifCheckbox || !availabilityConfig || !saveButton) return;
    
    // Load existing preferences
    await loadAvailabilityPreferences();
    
    // Toggle availability config when checkbox changes
    wantsNotifCheckbox.addEventListener('change', function() {
        if (this.checked) {
            availabilityConfig.style.display = 'block';
        } else {
            availabilityConfig.style.display = 'none';
        }
    });
    
    // Toggle time slots when day checkbox changes
    document.querySelectorAll('.day-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const day = this.dataset.day;
            const timeSlots = document.querySelector(`.time-slots[data-day="${day}"]`);
            if (timeSlots) {
                timeSlots.style.display = this.checked ? 'block' : 'none';
                // Uncheck all time slots if day is unchecked
                if (!this.checked) {
                    timeSlots.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                }
            }
        });
    });
    
    // Save availability preferences
    saveButton.addEventListener('click', saveAvailabilityPreferences);
}

async function loadAvailabilityPreferences() {
    try {
        const userEmail = dashboardState.user?.email;
        if (!userEmail) return;
        
        const { data, error } = await window.supabaseClient
            .from('student_availability')
            .select('*')
            .eq('user_email', userEmail)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
            console.error('Error loading availability:', error);
            return;
        }
        
        if (data) {
            // Set checkbox
            const wantsNotifCheckbox = document.getElementById('wantsCancellationNotif');
            if (wantsNotifCheckbox) {
                wantsNotifCheckbox.checked = data.wants_cancellation_notifications;
                if (data.wants_cancellation_notifications) {
                    document.getElementById('availabilityConfig').style.display = 'block';
                }
            }
            
            // Set availability slots
            if (data.availability_slots) {
                const slots = typeof data.availability_slots === 'string' 
                    ? JSON.parse(data.availability_slots) 
                    : data.availability_slots;
                
                Object.keys(slots).forEach(day => {
                    // Check day checkbox
                    const dayCheckbox = document.querySelector(`.day-checkbox[data-day="${day}"]`);
                    if (dayCheckbox) {
                        dayCheckbox.checked = true;
                        const timeSlots = document.querySelector(`.time-slots[data-day="${day}"]`);
                        if (timeSlots) {
                            timeSlots.style.display = 'block';
                            // Check time slot checkboxes
                            slots[day].forEach(timeSlot => {
                                const checkbox = timeSlots.querySelector(`input[value="${timeSlot}"]`);
                                if (checkbox) checkbox.checked = true;
                            });
                        }
                    }
                });
            }
        }
    } catch (err) {
        console.error('Error loading availability preferences:', err);
    }
}

async function saveAvailabilityPreferences() {
    try {
        const userEmail = dashboardState.user?.email;
        const userName = dashboardState.user ? `${dashboardState.user.prenom} ${dashboardState.user.nom}` : '';
        const userPhone = dashboardState.user?.telephone || '';
        
        if (!userEmail) {
            alert('Erreur: utilisateur non connecté');
            return;
        }
        
        const wantsNotif = document.getElementById('wantsCancellationNotif').checked;
        const feedback = document.getElementById('availabilityFeedback');
        
        // Collect selected slots
        const availabilitySlots = {};
        document.querySelectorAll('.day-checkbox:checked').forEach(dayCheckbox => {
            const day = dayCheckbox.dataset.day;
            const timeSlots = document.querySelector(`.time-slots[data-day="${day}"]`);
            if (timeSlots) {
                const selectedTimes = [];
                timeSlots.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                    selectedTimes.push(cb.value);
                });
                if (selectedTimes.length > 0) {
                    availabilitySlots[day] = selectedTimes;
                }
            }
        });
        
        // Validate: if wants notifications, must select at least one slot
        if (wantsNotif && Object.keys(availabilitySlots).length === 0) {
            feedback.textContent = '⚠️ Sélectionne au moins un créneau horaire';
            feedback.style.color = '#d32f2f';
            return;
        }
        
        const payload = {
            user_email: userEmail,
            user_name: userName,
            user_phone: userPhone,
            wants_cancellation_notifications: wantsNotif,
            availability_slots: availabilitySlots,
            updated_at: new Date().toISOString()
        };
        
        // Upsert (insert or update)
        const { error } = await window.supabaseClient
            .from('student_availability')
            .upsert(payload, { onConflict: 'user_email' });
        
        if (error) {
            console.error('Error saving availability:', error);
            feedback.textContent = '❌ Erreur lors de l\'enregistrement';
            feedback.style.color = '#d32f2f';
            return;
        }
        
        feedback.textContent = '✅ Disponibilités enregistrées avec succès !';
        feedback.style.color = '#0a8e47';
        
        setTimeout(() => {
            feedback.textContent = '';
        }, 3000);
        
    } catch (err) {
        console.error('Error saving availability:', err);
        const feedback = document.getElementById('availabilityFeedback');
        feedback.textContent = '❌ Erreur lors de l\'enregistrement';
        feedback.style.color = '#d32f2f';
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Rafraîchissement automatique des créneaux toutes les 30 secondes
let autoRefreshInterval = null;

function startAutoRefresh() {
    // Arrêter l'intervalle existant s'il y en a un
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // Rafraîchir toutes les 30 secondes
    autoRefreshInterval = setInterval(async () => {
        console.log('🔄 Rafraîchissement automatique des créneaux...');
        const bookedData = await fetchBookedSlotsFromSupabase();
        dashboardState.bookedSlotIds = bookedData.ids;
        renderSlotGrid();
    }, 30000); // 30 secondes
    
    console.log('✅ Rafraîchissement automatique activé (30s)');
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        console.log('⏸️ Rafraîchissement automatique désactivé');
    }
}

if (document.readyState === 'loading') {
    initStudentDashboard();
    initAvailabilityConfig();
    startAutoRefresh();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        // Masquer Mylène à partir du 1er mai 2026
        const today = new Date();
        const mayFirst2026 = new Date('2026-05-01T00:00:00');
        const myleneCard = document.getElementById('myleneCard');
        
        if (myleneCard && today >= mayFirst2026) {
            myleneCard.style.display = 'none';
            console.log('🚫 Mylène masquée - indisponible à partir du 1er mai 2026');
        }
        
        initStudentDashboard();
        initAvailabilityConfig();
        startAutoRefresh();
    });
}
