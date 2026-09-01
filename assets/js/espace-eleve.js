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

// Liste des moniteurs - sera chargée dynamiquement depuis Supabase
let INSTRUCTORS = {};

function ensureNailInstructorForNewPacks() {
    if (!isNewLessonFormat() || INSTRUCTORS.nail) return;
    INSTRUCTORS.nail = {
        id: null,
        name: 'Nail',
        fullName: 'Nail',
        phone: '',
        gender: 'female',
        workSchedule: 'full_time',
        customSchedule: null,
        visibleToStudents: true,
        calendarUrl: '',
        slotBlueprintKey: 'nail'
    };
}

// Charger les moniteurs visibles aux éléves depuis Supabase
async function loadVisibleInstructors() {
    try {
        const token = window.authSession?.getToken?.();
        if (token) {
            const response = await fetch('/.netlify/functions/student-planning-data?type=instructors', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            });
            const result = await response.json().catch(() => null);
            if (response.ok && result?.ok) {
                INSTRUCTORS = {};

                (result.instructors || []).forEach(instructor => {
                    const key = normalizeInstructorKey(instructor.prenom);
                    if (!key) return;
                    INSTRUCTORS[key] = {
                        id: instructor.id,
                        name: instructor.prenom,
                        fullName: `${instructor.prenom || ''} ${instructor.nom || ''}`.trim() || instructor.prenom,
                        phone: instructor.telephone || '',
                        gender: instructor.gender || 'male',
                        workSchedule: instructor.work_schedule || 'full_time',
                        customSchedule: instructor.custom_schedule,
                        visibleToStudents: instructor.visible_to_students || false,
                        calendarUrl: '',
                        slotBlueprintKey: key
                    };
                });

                const uniqueInstructors = new Set();
                (result.bonuses || []).forEach(bonus => {
                    if (bonus.instructor) uniqueInstructors.add(bonus.instructor);
                });
                uniqueInstructors.forEach(instructorName => {
                    const key = normalizeInstructorKey(instructorName);
                    if (!key || INSTRUCTORS[key]) return;
                    const gender = (instructorName === 'Nail' || instructorName === 'Mylène' || instructorName === 'Myléne') ? 'female' : 'male';
                    INSTRUCTORS[key] = {
                        id: null,
                        name: instructorName,
                        fullName: instructorName,
                        gender,
                        workSchedule: 'full_time',
                        customSchedule: null,
                        visibleToStudents: false,
                        calendarUrl: '',
                        slotBlueprintKey: key
                    };
                });

                ensureNailInstructorForNewPacks();
                updateInstructorSelect();
                createInstructorCards();
                return;
            }
            console.warn('student-planning-data instructors unavailable:', result?.error || response.status);
        }

        // Charger depuis la table instructors (seulement ceux visibles aux éléves)
        const { data: instructors, error: error1 } = await window.supabaseClient
            .from('instructors')
            .select('*')
            .eq('is_active', true)
            .eq('visible_to_students', true)
            .order('prenom', { ascending: true });

        if (error1) {
            console.error('Erreur chargement instructors:', error1);
        }

        // Charger depuis la table instructor_bonuses
        const { data: bonusInstructors, error: error2 } = await window.supabaseClient
            .from('instructor_bonuses')
            .select('instructor')
            .eq('status', 'active');

        if (error2) {
            console.error('Erreur chargement instructor_bonuses:', error2);
        }

        console.log('?? Moniteurs (instructors):', instructors);
        console.log('?? Moniteurs (bonuses):', bonusInstructors);

        // Construire l'objet INSTRUCTORS
        INSTRUCTORS = {};
        
        // Ajouter les moniteurs de la table instructors
        (instructors || []).forEach(instructor => {
            const key = instructor.prenom.toLowerCase();
            INSTRUCTORS[key] = {
                id: instructor.id,
                name: instructor.prenom,
                fullName: `${instructor.prenom} ${instructor.nom}`,
                phone: instructor.telephone || '',
                gender: instructor.gender || 'male',
                workSchedule: instructor.work_schedule || 'full_time',
                customSchedule: instructor.custom_schedule,
                visibleToStudents: instructor.visible_to_students || false,
                calendarUrl: '',
                slotBlueprintKey: key
            };
        });

        // Ajouter les moniteurs de instructor_bonuses (s'ils n'existent pas déjé)
        const uniqueInstructors = new Set();
        (bonusInstructors || []).forEach(bonus => {
            const instructorName = bonus.instructor;
            if (instructorName) {
                uniqueInstructors.add(instructorName);
            }
        });

        uniqueInstructors.forEach(instructorName => {
            const key = instructorName.toLowerCase();
            // N'ajouter que si pas déjé présent
            if (!INSTRUCTORS[key]) {
                // Déterminer le genre selon le nom (heuristique simple)
                const gender = (instructorName === 'Nail' || instructorName === 'Myléne') ? 'female' : 'male';
                
                INSTRUCTORS[key] = {
                    id: null,
                    name: instructorName,
                    fullName: instructorName,
                    gender: gender,
                    workSchedule: 'full_time',
                    customSchedule: null,
                    visibleToStudents: false, // Par défaut, pas de réservation automatique pour les anciens moniteurs
                    calendarUrl: '',
                    slotBlueprintKey: key
                };
            }
        });

        ensureNailInstructorForNewPacks();
        // Mettre é jour le select des moniteurs
        updateInstructorSelect();
        
        // Créer les cartes des moniteurs
        createInstructorCards();

    } catch (err) {
        console.error('Erreur:', err);
    }
}

// Mettre é jour le select des moniteurs dans le formulaire de réservation
function updateInstructorSelect() {
    const select = document.getElementById('bookingInstructor');
    if (!select) return;

    // Garder l'option par défaut
    select.innerHTML = '<option value="">Choisis un moniteur</option>';

    let instructors = Object.values(INSTRUCTORS);
    if (isNewLessonFormat()) {
        const newInstructors = instructors.filter((instructor) => !isLegacyInstructorName(instructor.name) || normalizeInstructorKey(instructor.name) === 'nail');
        if (newInstructors.length > 0) instructors = newInstructors;
    }

    // Ajouter les moniteurs visibles
    instructors.forEach(instructor => {
        const option = document.createElement('option');
        option.value = instructor.name;
        option.textContent = instructor.fullName;
        select.appendChild(option);
    });

    console.log('? Select moniteurs mis é jour:', Object.keys(INSTRUCTORS).length, 'moniteurs');
}

// Créer les cartes des moniteurs avec avatars
function createInstructorCards() {
    const container = document.getElementById('instructorToggle');
    if (!container) return;

    // Vider le conteneur
    container.innerHTML = '';

    let instructorEntries = Object.entries(INSTRUCTORS);
    if (isNewLessonFormat()) {
        const newInstructorEntries = instructorEntries.filter(([, instructor]) => !isLegacyInstructorName(instructor.name) || normalizeInstructorKey(instructor.name) === 'nail');
        if (newInstructorEntries.length > 0) instructorEntries = newInstructorEntries;
    }

    // Créer une carte pour chaque moniteur
    instructorEntries.forEach(([key, instructor], index) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'coach-card' + (index === 0 ? ' is-active' : '');
        card.dataset.instructorKey = key;
        card.id = `${key}Card`;

        // Avatar selon le genre
        const avatarClass = instructor.gender === 'female' ? 'female' : 'male';
        const avatarImage = instructor.gender === 'female' 
            ? 'assets/Nail.png'  // Avatar féminin par défaut
            : 'assets/Daho.png'; // Avatar masculin par défaut

        card.innerHTML = `
            <span class="coach-avatar ${avatarClass}">
                <img src="${avatarImage}" alt="Avatar de ${instructor.name}" loading="lazy">
            </span>
            <span class="coach-info">
                <span class="coach-name">${instructor.name}</span>
            </span>
        `;

        // Ajouter l'événement click pour changer de moniteur actif
        card.addEventListener('click', () => {
            // Retirer la classe active de tous les boutons
            container.querySelectorAll('.coach-card').forEach(c => c.classList.remove('is-active'));
            // Ajouter la classe active au bouton cliqué
            card.classList.add('is-active');
            // Mettre é jour le moniteur actif
            dashboardState.activeInstructorKey = key;
            // Recharger les créneaux pour ce moniteur
            refreshSlotsForCurrentWeek().then(() => {
                renderSlotGrid();
            });
        });

        container.appendChild(card);
    });

    console.log('? Cartes moniteurs créées:', instructorEntries.length);
    
    // Définir le premier moniteur comme actif par défaut
    if (instructorEntries.length > 0) {
        dashboardState.activeInstructorKey = instructorEntries[0][0];
    }
}

// Les fonctions de planning avec tableau ont été supprimées
// Le systéme utilise maintenant le méme affichage que Daho et Nail (cartes colorées)

// Jours fériés franéais 2026
const JOURS_FERIES_2026 = [
    '2026-01-01', // Jour de l'an
    '2026-04-06', // Lundi de Péques
    '2026-05-01', // Féte du travail
    '2026-05-08', // Victoire 1945
    '2026-05-14', // Ascension
    '2026-05-25', // Lundi de Pentecéte
    '2026-07-14', // Féte nationale
    '2026-08-15', // Assomption
    '2026-11-01', // Toussaint
    '2026-11-11', // Armistice 1918
    '2026-12-25'  // Noél
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
    lessonUnitMinutes: 120,
    availableSlots: [],
    selectedSlotId: null,
    selectedSlotEnd: '',
    bookedSlotIds: new Set(),
    bookedSlots: [],
    favoriteInstructor: null,
    activeInstructorKey: 'nail', // Nail par défaut é partir du 1er mai 2026
    weekOffset: 0 // 0 = semaine courante, 1 = semaine suivante, etc.
};
window.dashboardState = dashboardState;

// Fonctions identiques é admin-planning pour synchronisation parfaite
const LEGACY_INSTRUCTOR_KEYS = new Set(['mylene', 'mylène', 'sammy', 'nail', 'daho']);

function normalizeInstructorKey(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function isLegacyInstructorName(value) {
    return LEGACY_INSTRUCTOR_KEYS.has(normalizeInstructorKey(value));
}

function isCourseBasedPack(value) {
    return String(value || '').toLowerCase().trim().startsWith('tarif-');
}

function isNewLessonFormat() {
    if (Number(dashboardState.lessonUnitMinutes || dashboardState.user?.lesson_unit_minutes || 0) === 45) return true;
    return isCourseBasedPack(dashboardState.user?.forfait || dashboardState.user?.pack);
}

function lessonUnitsForDuration(hours) {
    const unitHours = isNewLessonFormat() ? 0.75 : 1;
    return Math.max(0, Math.round((Number(hours) || 0) / unitHours));
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

function compareSlotStartCodes(a, b) {
    const startDiff = timeToMinutes(a) - timeToMinutes(b);
    if (startDiff !== 0) return startDiff;
    return timeToMinutes(slotStartCodeEnd(a)) - timeToMinutes(slotStartCodeEnd(b));
}

function formatSlotRange(startCode, endFallback = '') {
    const start = slotStartCodeStart(startCode);
    const end = slotStartCodeEnd(startCode) || endFallback;
    const labelStart = start.replace(':', 'h');
    return end ? `${labelStart}-${String(end).replace(':', 'h')}` : labelStart;
}

function formatAvailabilityRange(start, end) {
    return `${String(start).replace(':', 'h')}-${String(end).replace(':', 'h')}`;
}

function getAvailabilitySlotOptionsForCurrentFormat() {
    const stepMinutes = isNewLessonFormat() ? 45 : 120;
    return buildTimeRows('07:00', '19:00', stepMinutes).map((start) => {
        const end = addMinutesToTime(start, stepMinutes);
        return {
            value: `${start}-${end}`,
            label: formatAvailabilityRange(start, end)
        };
    });
}

function renderAvailabilityTimeChoices(containerSelector) {
    const options = getAvailabilitySlotOptionsForCurrentFormat();
    document.querySelectorAll(containerSelector).forEach((container) => {
        const previousChecked = new Set(
            Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map((input) => input.value)
        );
        const gridCols = isNewLessonFormat()
            ? 'repeat(auto-fill, minmax(118px, 1fr))'
            : 'repeat(auto-fill, minmax(150px, 1fr))';
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: ${gridCols}; gap: 0.75rem;">
                ${options.map((slot) => `
                    <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem;">
                        <input type="checkbox" value="${slot.value}" ${previousChecked.has(slot.value) ? 'checked' : ''}> ${slot.label}
                    </label>
                `).join('')}
            </div>
        `;
    });
}

function getAvailabilitySlotLabel(value) {
    const found = getAvailabilitySlotOptionsForCurrentFormat().find((slot) => slot.value === value);
    if (found) return found.label;
    const [start, end] = String(value || '').split('-');
    return start && end ? formatAvailabilityRange(start, end) : String(value || '');
}

async function requestStudentAvailability(method = 'GET', payload = null) {
    const token = window.authSession?.getToken?.();
    if (!token) throw new Error('AUTH_REQUIRED');
    const options = {
        method,
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
    };
    if (payload) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(payload);
    }
    const response = await fetch('/.netlify/functions/student-availability', options);
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
        throw new Error(result?.error || 'STUDENT_AVAILABILITY_FAILED');
    }
    return result.availability || null;
}

function isWeekdayDateStr(dateStr) {
    if (!dateStr) return false;
    const date = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    const day = date.getDay();
    return day >= 1 && day <= 5;
}

function isNailNewPackSlot(dateStr, start, end) {
    return isNewLessonFormat()
        && isWeekdayDateStr(dateStr)
        && ((start === '15:00' && end === '15:45') || (start === '15:45' && end === '16:30'));
}

function drivingUnitLabel(plural = true) {
    if (isNewLessonFormat()) return 'cours';
    return plural ? 'heures' : 'heure';
}

function formatDrivingUnits(value) {
    const numeric = Math.max(0, Number(value) || 0);
    if (isNewLessonFormat()) return `${Math.round(numeric)}`;
    return `${Number.isInteger(numeric) ? numeric : numeric.toFixed(1).replace('.', ',')}h`;
}
function getTimeRows(instructor, dateStr) {
    if (isNewLessonFormat() && instructor === 'Nail') {
        return ['15:00|15:45', '15:45|16:30'];
    }

    if (isNewLessonFormat() && !isLegacyInstructorName(instructor)) {
        return buildTimeRows('07:00', '19:00', 45);
    }

    // Daho: afficher tous les créneaux (matin et aprés-midi) pour tous les jours
    // Les créneaux hors horaires seront marqués comme indispo
    if (instructor === 'Daho') {
        if (!dateStr) return ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00']; // Fallback
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay(); // 0 = dimanche, 1 = lundi, etc.
        
        // Pour tous les jours, afficher tous les créneaux possibles
        // La logique de disponibilité sera gérée par isDahoSlotAvailable
        return ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00'];
    }
    // Nail: tous les créneaux de 7h é 19h
    return ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00'];
}

function getEndForStart(instructor, start, dateStr = '') {
    const encodedEnd = slotStartCodeEnd(start);
    if (encodedEnd) return encodedEnd;
    start = slotStartCodeStart(start);

    if (isNewLessonFormat() && instructor === 'Nail') {
        if (start === '15:00') return '15:45';
        if (start === '15:45') return '16:30';
        return '';
    }

    if (isNewLessonFormat() && !isLegacyInstructorName(instructor)) {
        return addMinutesToTime(start, 45);
    }

    if (instructor === 'Daho') {
        if (start === '07:00') return '09:00';
        if (start === '09:00') return '11:00';
        if (start === '11:00') return '13:00';
        if (start === '13:00') return '15:00';
        if (start === '15:00') return '17:00';
        if (start === '17:00') return '19:00';
    }
    if (instructor === 'Nail') {
        if (start === '15:45') return '';
        if (start === '15:00' && isWeekdayDateStr(dateStr)) return '';
    }

    // Tous les autres moniteurs (Nail, Myléne et nouveaux moniteurs) : créneaux de 2h
    if (start === '07:00') return '09:00';
    if (start === '09:00') return '11:00';
    if (start === '11:00') return '13:00';
    if (start === '13:00') return '15:00';
    if (start === '15:00') return '17:00';
    if (start === '17:00') return '19:00';
    return '';
}

// Vérifier si un créneau est disponible pour Daho selon ses horaires de travail
function isDahoSlotAvailable(dateStr, start) {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = dimanche, 1 = lundi, etc.
    
    if (dayOfWeek === 1) {
        // Lundi: 15H é 19H disponible
        return start === '15:00' || start === '17:00';
    } else if (dayOfWeek >= 2 && dayOfWeek <= 5) {
        // Mardi é vendredi: 17H é 19H disponible
        return start === '17:00';
    } else if (dayOfWeek === 6) {
        // Samedi: 7H é 13H disponible (matin)
        return start === '07:00' || start === '09:00' || start === '11:00';
    } else {
        // Dimanche: fermé
        return false;
    }
}

// Vérifier si un créneau est disponible pour Nail selon ses horaires de travail
function isNailSlotAvailable(dateStr, start) {
    const startCode = start;
    start = slotStartCodeStart(start);
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = dimanche, 1 = lundi, etc.
    
    // Dimanche: fermé (géré par isJourFerme)
    if (dayOfWeek === 0) return false;

    if (isNewLessonFormat()) {
        const end = getEndForStart('Nail', startCode, dateStr);
        return isNailNewPackSlot(dateStr, start, end);
    }
    
    // Lundi à vendredi: 15H-16H30 réservé aux nouveaux packs.
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && (start === '15:00' || start === '15:45')) return false;

    // Samedi: 7H à 17H disponible, 17H à 19H indispo
    return start !== '17:00';
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
    const normalized = normalizeInstructorKey(instructorLabel);
    const found = Object.keys(INSTRUCTORS).find((key) => {
        const instructor = INSTRUCTORS[key];
        return normalizeInstructorKey(key) === normalized
            || normalizeInstructorKey(instructor?.name) === normalized
            || normalizeInstructorKey(instructor?.fullName) === normalized;
    });
    if (found) return found;
    if (normalized.includes('nail')) return 'nail';
    if (normalized.includes('daho')) return 'daho';
    return dashboardState.activeInstructorKey || normalized;
}

function getEndTimeForSlot(startTime, instructorLabel) {
    const key = toInstructorKey(instructorLabel);
    const instructor = INSTRUCTORS[key]?.name || instructorLabel || 'Daho';
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

function buildGeneratedSlotId(dateStr, startCode, end, instructor) {
    const bookingStart = slotStartCodeStart(startCode);
    if (isNewLessonFormat() && normalizeInstructorKey(instructor) === 'nail') {
        return `${dateStr}|${bookingStart}|${end}`;
    }
    return buildSlotId(dateStr, bookingStart);
}

function getPlanningSlotDurationMinutes(slot) {
    if (!slot?.start || !slot?.end) return 0;
    const start = timeToMinutes(slot.start);
    const end = timeToMinutes(slot.end);
    return Number.isFinite(start) && Number.isFinite(end) ? end - start : 0;
}

function isSlotRowVisibleForCurrentLessonFormat(slot) {
    const minutes = getPlanningSlotDurationMinutes(slot);
    if (isNewLessonFormat()) return minutes === 45;
    return minutes === 120;
}

function markSundaySlotClosedForStudents(slot) {
    if (!slot?.date) return slot;
    const day = new Date(`${slot.date}T00:00:00`);
    if (!Number.isNaN(day.getTime()) && day.getDay() === 0) {
        slot.isJourFerme = true;
        slot.isUnavailable = true;
    }
    return slot;
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
    
    // Récupérer le nom du moniteur depuis INSTRUCTORS
    const instructorData = INSTRUCTORS[instructorKey];
    if (!instructorData) {
        console.warn('Moniteur non trouvé:', instructorKey);
        return slots;
    }
    
    const instructor = instructorData.name;
    
    // Générer les créneaux pour les 7 jours de la semaine
    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    const times = getTimeRows(instructor);
    
    days.forEach((day) => {
        const dateStr = toInputDate(day);
        
        // Afficher les dimanches mais les marquer comme fermés
        const jsDay = day.getDay();
        const isJourFerme = (jsDay === 0); // Seulement dimanche fermé
        
        // Daho est disponible é partir du 1er mai 2026
        if (instructor === 'Daho') {
            const slotDate = new Date(dateStr);
            const mayFirst2026 = new Date('2026-05-01T00:00:00');
            if (slotDate < mayFirst2026) return;
        }
        
        // Pour les jours fermés (dimanche), créer des créneaux marqués comme fermés
        if (isJourFerme) {
            times.forEach((start) => {
                const end = getEndForStart(instructor, start, dateStr);
                const bookingStart = slotStartCodeStart(start);
                if (!end) return;
                
                slots.push({
                    id: buildGeneratedSlotId(dateStr, start, end, instructor),
                    date: dateStr,
                    start: bookingStart,
                    gridStart: start,
                    end: end,
                    instructor: instructor,
                    dayLabel: day.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }),
                    label: `${bookingStart.replace(':', 'h')} - ${end.replace(':', 'h')}`,
                    isJourFerme: true
                });
            });
            return;
        }
        
        // Pour les jours fériés, créer des créneaux spéciaux marqués comme fériés
        if (isJourFerie(dateStr)) {
            times.forEach((start) => {
                const end = getEndForStart(instructor, start, dateStr);
                const bookingStart = slotStartCodeStart(start);
                if (!end) return;
                
                slots.push({
                    id: buildGeneratedSlotId(dateStr, start, end, instructor),
                    date: dateStr,
                    start: bookingStart,
                    gridStart: start,
                    end: end,
                    instructor: instructor,
                    dayLabel: day.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }),
                    label: `${bookingStart.replace(':', 'h')} - ${end.replace(':', 'h')}`,
                    isFerie: true
                });
            });
            return;
        }
        
        times.forEach((start) => {
            const end = getEndForStart(instructor, start, dateStr);
            const bookingStart = slotStartCodeStart(start);
            if (!end) return;
            
            // Vérifier la disponibilité du moniteur selon son horaire personnalisé
            let isUnavailable = false;
            
            // Pour les moniteurs avec horaires personnalisés (mi-temps)
            if (instructorData.customSchedule && instructorData.workSchedule === 'part_time') {
                const dayOfWeek = day.getDay(); // 0 = dimanche, 1 = lundi, etc.
                const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
                const dayName = dayNames[dayOfWeek];
                const daySchedule = instructorData.customSchedule[dayName];
                
                // Si pas d'horaire défini pour ce jour ? indisponible
                if (!daySchedule || !daySchedule.start || !daySchedule.end) {
                    isUnavailable = true;
                } else {
                    // Vérifier si le créneau est DANS la plage horaire du moniteur
                    const slotStartValue = slotStartCodeStart(start);
                    const slotStartHour = parseInt(slotStartValue.split(':')[0]);
                    const slotStartMinute = parseInt(slotStartValue.split(':')[1]);
                    const scheduleStartHour = parseInt(daySchedule.start.split(':')[0]);
                    const scheduleStartMinute = parseInt(daySchedule.start.split(':')[1]);
                    const scheduleEndHour = parseInt(daySchedule.end.split(':')[0]);
                    const scheduleEndMinute = parseInt(daySchedule.end.split(':')[1]);
                    
                    const slotStartInMinutes = slotStartHour * 60 + slotStartMinute;
                    const scheduleStartInMinutes = scheduleStartHour * 60 + scheduleStartMinute;
                    const scheduleEndInMinutes = scheduleEndHour * 60 + scheduleEndMinute;
                    
                    // Le créneau est disponible SEULEMENT s'il commence dans la plage horaire
                    if (slotStartInMinutes < scheduleStartInMinutes || slotStartInMinutes >= scheduleEndInMinutes) {
                        isUnavailable = true;
                    }
                }
            }
            // Pour Daho (logique existante)
            else if (instructor === 'Daho' && !isDahoSlotAvailable(dateStr, start)) {
                isUnavailable = true;
            }
            // Pour Nail (logique existante)
            else if (instructor === 'Nail' && !isNailSlotAvailable(dateStr, start)) {
                isUnavailable = true;
            }
            
            slots.push({
                id: buildGeneratedSlotId(dateStr, start, end, instructor),
                date: dateStr,
                start: bookingStart,
                gridStart: start,
                end: end,
                instructor: instructor,
                dayLabel: day.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }),
                label: `${bookingStart.replace(':', 'h')} - ${end.replace(':', 'h')}`,
                isUnavailable: isUnavailable
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
    if (dashboardState.weekOffset < 12) { // Limiter é 12 semaines é l'avance (3 mois)
        dashboardState.weekOffset++;
        await refreshSlotsForCurrentWeek();
        renderSlotGrid();
        updateWeekDisplay();
    }
};

// Recharger les sessions depuis Supabase
async function reloadSessionsFromSupabase() {
    try {
        const user = dashboardState.user || getStoredUser();
        if (!user || !user.email) {
            console.warn('Pas d\'utilisateur connecté');
            return;
        }

        const now = new Date();
        
        console.log('?? Rechargement des réservations pour:', user.email);
        
        // Récupérer les réservations de l'utilisateur depuis Supabase
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
            console.error('? Erreur chargement réservations:', fetchError);
            return;
        }
        
        console.log('?? Réservations rechargées:', (reservations || []).length);
        if (reservations && reservations.length > 0) {
            console.log('?? Détail des réservations:', reservations.map(r => ({
                id: r.id,
                instructor: r.slots?.instructor,
                start: r.slots?.start_at
            })));
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
        
        // Dédoublonner par ID (au cas oé Supabase retourne des doublons)
        const uniqueSessions = [];
        const seenIds = new Set();
        sessions.forEach(session => {
            if (!seenIds.has(session.id)) {
                seenIds.add(session.id);
                uniqueSessions.push(session);
            } else {
                console.warn('?? Session en double ignorée:', session.id);
            }
        });
        
        // Mettre é jour le state avec les sessions uniques
        dashboardState.rawSessions = uniqueSessions;
        dashboardState.sessions = uniqueSessions.map(normalizeSessionForState);
        
        // Sauvegarder dans le localStorage
        saveSessionsToStorage(uniqueSessions);
        
        console.log('? Sessions rechargées:', uniqueSessions.length);
        
    } catch (err) {
        console.error('Erreur rechargement sessions:', err);
    }
}

async function refreshSlotsForCurrentWeek() {
    // Générer les slots depuis les blueprints
    const generatedSlots = generateUpcomingSlots();
    
    // Récupérer les slots réservés depuis Supabase
    const bookedData = await fetchBookedSlotsFromSupabase();
    dashboardState.bookedSlotIds = bookedData.ids;
    dashboardState.bookedSlots = bookedData.slots || [];
    
    // Fusionner les slots générés avec les slots réservés
    const allSlots = [...generatedSlots];
    bookedData.slots.forEach(bookedSlot => {
        // Afficher tous les slots, y compris dimanche et lundi
        // (mais ils seront marqués comme non réservables)
        const slotDate = new Date(bookedSlot.date);
        const jsDay = slotDate.getDay();
        
        // Daho est disponible é partir du 1er mai 2026
        if (bookedSlot.instructor === 'Daho') {
            const mayFirst2026 = new Date('2026-05-01T00:00:00');
            if (slotDate < mayFirst2026) return;
        }
        
        // Garder les anciens blocs en base comme blocage, sans créer de fausses lignes horaires.
        if (!allSlots.find(s => s.id === bookedSlot.id || arePlanningSlotsOverlapping(s, bookedSlot))) {
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
    const weekStart = startOfWeek(today);
    weekStart.setDate(weekStart.getDate() + (dashboardState.weekOffset * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const startStr = weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const endStr = weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    
    weekLabel.textContent = `${startStr} - ${endStr}`;
    
    // Désactiver le bouton précédent si on est é la semaine courante
    const prevBtn = document.getElementById('prevWeekBtn');
    const nextBtn = document.getElementById('nextWeekBtn');
    if (prevBtn) prevBtn.disabled = dashboardState.weekOffset === 0;
    if (nextBtn) nextBtn.disabled = dashboardState.weekOffset >= 12;
}

function isSlotOverlappingBookedSlot(slot) {
    if (!slot?.date || !slot?.start || !slot?.end) return false;
    const slotStart = new Date(`${slot.date}T${slot.start}:00`).getTime();
    const slotEnd = new Date(`${slot.date}T${slot.end}:00`).getTime();
    if (!Number.isFinite(slotStart) || !Number.isFinite(slotEnd)) return false;

    const bookedFromOthers = (dashboardState.bookedSlots || []).some((booked) => {
        if (!booked?.date || !booked?.start || !booked?.end) return false;
        if (normalizeInstructorKey(booked.instructor) !== normalizeInstructorKey(slot.instructor)) return false;
        if (booked.date !== slot.date) return false;
        const bookedStart = new Date(`${booked.date}T${booked.start}:00`).getTime();
        const bookedEnd = new Date(`${booked.date}T${booked.end}:00`).getTime();
        return Number.isFinite(bookedStart) && Number.isFinite(bookedEnd)
            && bookedStart < slotEnd
            && bookedEnd > slotStart;
    });
    if (bookedFromOthers) return true;

    return (dashboardState.rawSessions || []).some((session) => {
        const status = String(session?.status || '').toLowerCase();
        if (status.includes('cancel')) return false;
        const sessionDate = getLocalDateFromSession(session);
        const sessionStart = session.start_time || session.start || session.startTime;
        const sessionEnd = session.end_time || session.end || session.endTime;
        if (!sessionDate || !sessionStart || !sessionEnd || sessionDate !== slot.date) return false;
        if (normalizeInstructorKey(session.instructor) !== normalizeInstructorKey(slot.instructor)) return false;
        const bookedStart = new Date(`${sessionDate}T${sessionStart}:00`).getTime();
        const bookedEnd = new Date(`${sessionDate}T${sessionEnd}:00`).getTime();
        return Number.isFinite(bookedStart) && Number.isFinite(bookedEnd)
            && bookedStart < slotEnd
            && bookedEnd > slotStart;
    });
}

function arePlanningSlotsOverlapping(slotA, slotB) {
    if (!slotA || !slotB) return false;
    if (!slotA.date || !slotA.start || !slotA.end || !slotB.date || !slotB.start || !slotB.end) return false;
    if (slotA.date !== slotB.date) return false;
    if (normalizeInstructorKey(slotA.instructor) !== normalizeInstructorKey(slotB.instructor)) return false;
    const startA = new Date(`${slotA.date}T${slotA.start}:00`).getTime();
    const endA = new Date(`${slotA.date}T${slotA.end}:00`).getTime();
    const startB = new Date(`${slotB.date}T${slotB.start}:00`).getTime();
    const endB = new Date(`${slotB.date}T${slotB.end}:00`).getTime();
    return Number.isFinite(startA) && Number.isFinite(endA) && Number.isFinite(startB) && Number.isFinite(endB)
        && startA < endB
        && endA > startB;
}

function getPlanningSlotRowKey(slot) {
    if (!slot) return '';
    const start = slot.start || slotStartCodeStart(slot.gridStart);
    const end = slot.end || slotStartCodeEnd(slot.gridStart);
    if (start && end) return `${start}|${end}`;
    return slot.gridStart || start || '';
}

function isBlockingPlanningSlot(slot) {
    return Boolean(slot?.isBooked || slot?.isPermis || slot?.isIndisponible || slot?.isUnavailable || slot?.isJourFerme || slot?.isFerie);
}

function addPlanningSlotToGrid(slotsByDay, timeSlots, dayKey, slot) {
    const rowKey = getPlanningSlotRowKey(slot);
    if (!rowKey) return;
    if (!slotsByDay[dayKey]) slotsByDay[dayKey] = {};

    const current = slotsByDay[dayKey][rowKey];
    if (!current || (!isBlockingPlanningSlot(current) && isBlockingPlanningSlot(slot))) {
        slotsByDay[dayKey][rowKey] = slot;
    }
    timeSlots.add(rowKey);
}

function getPlanningGridDays() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = startOfWeek(today);
    weekStart.setDate(weekStart.getDate() + (dashboardState.weekOffset * 7));

    return Array.from({ length: 7 }).map((_, index) => {
        const date = addDays(weekStart, index);
        const dateStr = toInputDate(date);
        return {
            date,
            dateStr,
            key: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
        };
    });
}

function getPlanningRowKey(instructor, row, dateStr) {
    const start = slotStartCodeStart(row);
    const end = slotStartCodeEnd(row) || getEndForStart(instructor, row, dateStr);
    return start && end ? `${start}|${end}` : '';
}

function isSlotUnavailableForSchedule(dayInfo, rowKey, instructor, instructorData) {
    if (instructorData?.customSchedule && instructorData.workSchedule === 'part_time') {
        const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const daySchedule = instructorData.customSchedule[dayNames[dayInfo.date.getDay()]];
        if (!daySchedule || !daySchedule.start || !daySchedule.end) return true;

        const slotStartInMinutes = timeToMinutes(rowKey);
        const scheduleStartInMinutes = timeToMinutes(daySchedule.start);
        const scheduleEndInMinutes = timeToMinutes(daySchedule.end);
        return slotStartInMinutes < scheduleStartInMinutes || slotStartInMinutes >= scheduleEndInMinutes;
    }
    if (instructor === 'Daho') return !isDahoSlotAvailable(dayInfo.dateStr, rowKey);
    if (instructor === 'Nail') return !isNailSlotAvailable(dayInfo.dateStr, rowKey);
    return false;
}

function buildFallbackSlotForGridCell(dayInfo, rowKey, instructor, instructorData) {
    const start = slotStartCodeStart(rowKey);
    const end = slotStartCodeEnd(rowKey) || getEndForStart(instructor, rowKey, dayInfo.dateStr);
    if (!start || !end) return null;

    const slot = {
        id: buildGeneratedSlotId(dayInfo.dateStr, rowKey, end, instructor),
        date: dayInfo.dateStr,
        start,
        gridStart: rowKey,
        end,
        instructor,
        dayLabel: dayInfo.date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }),
        label: `${start.replace(':', 'h')} - ${end.replace(':', 'h')}`
    };

    if (dayInfo.date.getDay() === 0) {
        slot.isJourFerme = true;
    } else if (isJourFerie(dayInfo.dateStr)) {
        slot.isFerie = true;
    } else {
        slot.isUnavailable = isSlotUnavailableForSchedule(dayInfo, rowKey, instructor, instructorData);
    }

    return slot;
}

function renderSlotGrid() {
    const grid = document.getElementById('slotGrid');
    if (!grid) return;

    const bookedSet = new Set(
        (dashboardState.rawSessions || [])
            .map(getSessionSlotId)
            .filter(Boolean)
    );

    (dashboardState.bookedSlotIds || []).forEach((id) => bookedSet.add(id));

    const now = Date.now();

    // Organiser les créneaux par jour et horaire
    const slotsByDay = {};
    const timeSlots = new Set();
    const activeInstr = INSTRUCTORS[dashboardState.activeInstructorKey];
    const instructor = activeInstr ? activeInstr.name : 'Nail';
    const gridDays = getPlanningGridDays();

    gridDays.forEach((day) => {
        slotsByDay[day.key] = {};
        getTimeRows(instructor, day.dateStr).forEach((row) => {
            const rowKey = getPlanningRowKey(instructor, row, day.dateStr);
            if (rowKey) timeSlots.add(rowKey);
        });
    });
    
    dashboardState.availableSlots.forEach(slot => {
        markSundaySlotClosedForStudents(slot);
        if (!isSlotRowVisibleForCurrentLessonFormat(slot)) return;
        const date = new Date(slot.date);
        const dayKey = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
        addPlanningSlotToGrid(slotsByDay, timeSlots, dayKey, slot);
    });

    gridDays.forEach((day) => {
        Array.from(timeSlots).forEach((rowKey) => {
            if (slotsByDay[day.key]?.[rowKey]) return;
            const slot = buildFallbackSlotForGridCell(day, rowKey, instructor, activeInstr);
            if (slot) addPlanningSlotToGrid(slotsByDay, timeSlots, day.key, slot);
        });
    });

    // Trier les horaires
    let sortedTimes = Array.from(timeSlots).sort(compareSlotStartCodes);
    
    // Pour Daho, ne pas afficher les créneaux du matin sauf samedi (il commence é 15h le lundi, 17h mardi-vendredi, 7h samedi)
    if (dashboardState.activeInstructorKey === 'daho') {
        sortedTimes = sortedTimes.filter(time => {
            // Afficher tous les créneaux pour Daho, la logique de disponibilité est gérée par isDahoSlotAvailable
            return true;
        });
    }
    
    // Pour Nail, afficher tous les créneaux
    if (dashboardState.activeInstructorKey === 'nail') {
        sortedTimes = sortedTimes.filter(time => {
            // Afficher tous les créneaux pour Nail
            return true;
        });
    }
    
    const days = gridDays.map((day) => day.key);

    // Construire la grille HTML
    let html = '<table class="weekly-planning-grid">';
    
    // En-téte avec les jours
    html += '<thead><tr><th class="time-header">Horaire</th>';
    days.forEach(day => {
        // Extraire la date du slot pour vérifier si c'est un jour férié ou fermé
        const daySlots = slotsByDay[day];
        const firstSlot = daySlots ? Object.values(daySlots)[0] : null;
        const isFerie = firstSlot && isJourFerie(firstSlot.date);
        const isJourFerme = firstSlot && firstSlot.isJourFerme;
        
        let headerClass = '';
        let emoji = '';
        if (isJourFerme) {
            headerClass = ' jour-ferme';
            emoji = '';
        } else if (isFerie) {
            headerClass = ' jour-ferie';
            emoji = '';
        }
        
        html += `<th class="day-header${headerClass}">${day}${emoji}</th>`;
    });
    html += '</tr></thead>';
    
    // Corps avec les créneaux
    html += '<tbody>';
    sortedTimes.forEach(time => {
        html += '<tr>';
        
        // Calculer l'heure de fin pour afficher l'intervalle
        const activeInstr = INSTRUCTORS[dashboardState.activeInstructorKey];
        const instructor = activeInstr ? activeInstr.name : 'Nail';
        const firstSlotForTime = days.map((day) => slotsByDay[day]?.[time]).find(Boolean);
        const endTime = firstSlotForTime?.end || getEndForStart(instructor, time, firstSlotForTime?.date || '');
        const timeLabel = formatSlotRange(time, endTime);
        
        html += `<td class="time-cell">${timeLabel}</td>`;
        
        days.forEach(day => {
            const slot = slotsByDay[day][time];
            
            if (slot) {
                const slotTime = new Date(`${slot.date}T${slot.start}:00`).getTime();
                const isPast = slotTime < now;
                const isUnavailable = slot.isUnavailable || slot.isPermis || slot.isIndisponible || false;
                const isBooked = !isUnavailable && (bookedSet.has(slot.id) || slot.isBooked || isSlotOverlappingBookedSlot(slot));
                const isDisabled = isPast || isBooked || isUnavailable;
                const isSelected = !isDisabled && dashboardState.selectedSlotId === slot.id;
                
                let classes = ['planning-slot'];
                if (isDisabled) {
                    classes.push('is-booked');
                } else {
                    classes.push('available');
                }
                if (isSelected) classes.push('is-selected');
                
                // Utiliser la méme fonction que admin-planning
                const activeInstrSlot = INSTRUCTORS[dashboardState.activeInstructorKey];
                const instructor = activeInstrSlot ? activeInstrSlot.name : 'Nail';
                const rowKey = getPlanningSlotRowKey(slot);
                const endTime = slot.end || getEndForStart(instructor, rowKey || slot.gridStart || slot.start, slot.date);
                const label = endTime ? `${slot.start.replace(':', 'h')} - ${endTime.replace(':', 'h')}` : slot.start;
                
                // Affichage volontairement simple côté élève : seulement RÉSERVÉ ou DISPO.
                let slotContent = '';
                if (isDisabled) {
                    classes = ['planning-slot', 'is-booked'];
                    slotContent = `
                        <span class="slot-label">${label}</span>
                        <span class="slot-status">RéSERVé</span>
                    `;
                } else {
                    // Créneau disponible : afficher DISPONIBLE
                    slotContent = `
                        <span class="slot-label">${label}</span>
                        <span class="slot-status" style="color: #155724; font-weight: 700;">DISPO</span>
                    `;
                }
                
                html += `
                    <td class="slot-cell">
                        <button type="button"
                            class="${classes.join(' ')}"
                            data-slot-id="${slot.id}"
                            data-slot-date="${slot.date}"
                            data-slot-start="${slot.start}"
                            data-slot-end="${slot.end || endTime || ''}"
                            data-slot-instructor="${slot.instructor}"
                            ${(isDisabled || slot.isJourFerme) ? 'disabled' : ''}>
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
        button.addEventListener('click', async () => {
            if (dashboardState.activeInstructorKey === key) return;
            dashboardState.activeInstructorKey = key;
            await refreshSlotsForCurrentWeek();
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
    dashboardState.selectedSlotEnd = card.dataset.slotEnd || '';

    const dateInput = document.getElementById('bookingDate');
    if (dateInput) dateInput.value = card.dataset.slotDate || '';

    const startSelect = document.getElementById('bookingStart');
    if (startSelect && card.dataset.slotStart) {
        ensureTimeSlotsForInstructor(card.dataset.slotInstructor);
        const encodedValue = card.dataset.slotEnd ? `${card.dataset.slotStart}|${card.dataset.slotEnd}` : card.dataset.slotStart;
        startSelect.value = Array.from(startSelect.options).some((option) => option.value === encodedValue)
            ? encodedValue
            : card.dataset.slotStart;
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
        .reduce((sum, s) => sum + lessonUnitsForDuration(s.duration_hours || s.durationHours || 0), 0);
    const reserved = raw
        .filter((s) => (s.status || 'upcoming') === 'upcoming')
        .reduce((sum, s) => sum + lessonUnitsForDuration(s.duration_hours || s.durationHours || 0), 0);

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
            hours_goal: dashboardState.hoursGoal,
            lesson_unit_minutes: dashboardState.lessonUnitMinutes
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
    const completedTitle = completedEl?.closest('.stat-card')?.querySelector('h3');
    const remainingTitle = remainingEl?.closest('.stat-card')?.querySelector('h3');
    if (completedTitle) completedTitle.textContent = isNewLessonFormat() ? 'Cours réalisés' : 'Heures réalisées';
    if (remainingTitle) remainingTitle.textContent = isNewLessonFormat() ? 'Cours restants' : 'Heures restantes';

    // Ajouter les heures initiales aux heures complétées
    const totalCompleted = dashboardState.completedHours + (dashboardState.initialCompletedHours || 0);
    
    if (completedEl) completedEl.textContent = formatDrivingUnits(totalCompleted);
    if (remainingEl) {
        const remaining = Math.max(dashboardState.hoursGoal - totalCompleted - dashboardState.reservedHours, 0);
        remainingEl.textContent = formatDrivingUnits(remaining);
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
window.renderStats = renderStats;

function getInstructorPhone(instructorName) {
    if (!instructorName) return '';
    const name = instructorName.toLowerCase();
    // Chercher d'abord dans les moniteurs chargés depuis Supabase
    const instructor = INSTRUCTORS[name] || Object.values(INSTRUCTORS).find(i => i.name.toLowerCase() === name);
    if (instructor && instructor.phone) return instructor.phone;
    // Fallback pour les anciens moniteurs (instructor_bonuses)
    if (name.includes('daho')) return '06 02 45 08 11';
    if (name.includes('nail')) return '04.91.53.36.98';
    return '';
}

function renderSessionsTable() {
    const tbody = document.querySelector('#sessionsTable tbody');
    if (!tbody) return;

    if (!dashboardState.sessions.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding: 2rem 0; color: var(--text-light);">
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
                <td>${isNewLessonFormat() ? `${lessonUnitsForDuration(session.durationHours)} cours` : `${session.durationHours}h`}</td>
                <td>
                    <div style="font-weight: 600;">${session.instructor}</div>
                    <div style="font-size: 0.85rem; color: var(--text-light); margin-top: 2px;">
                        <i class="fas fa-phone" style="font-size: 0.75rem;"></i> ${getInstructorPhone(session.instructor)}
                    </div>
                </td>
                <td>Métro Saint-Barnabé</td>
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
        // Capitaliser la premiére lettre
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

    // Calculer les heures ouvrées (hors week-end) jusqu'é la séance
    const businessHoursUntil = calculateBusinessHoursUntil(startDt);
    const isFreeCancel = businessHoursUntil >= 48;

    if (isFreeCancel) {
        // Annulation > 48h (hors week-end) : confirmation simple et annulation immédiate
        const confirmed = window.confirm(
            `Annuler ce créneau ?\n\nTu annules plus de 48h é l'avance (hors week-ends) : le créneau ne sera pas déduit de ton forfait et redeviendra disponible.`
        );
        if (!confirmed) return;

        try {
            if (feedback) {
                feedback.textContent = 'Annulation en cours...';
                feedback.className = 'form-feedback info';
            }

            if (!window.supabaseClient) {
                throw new Error('Connexion au serveur indisponible.');
            }

            // The database checks ownership and frees the slot atomically.
            // Never remove the local session before that confirmation.
            const { data: cancellation, error: cancellationError } = await window.supabaseClient
                .rpc('cancel_own_reservation', {
                    p_reservation_id: sessionId,
                    p_slot_id: null
                });
            if (cancellationError) throw cancellationError;
            if (!cancellation?.ok) {
                if (cancellation?.error === 'JUSTIFICATION_REQUIRED') {
                    openCancelModal(sessionId);
                    return;
                }
                throw new Error(cancellation?.error || 'ANNULATION_REFUSED');
            }

            const nextSessions = rawSessions.filter((s) => String(s.id) !== String(sessionId));

            // Retained only as historical context while the next release migrates this file.
            // The secure RPC above is the sole live cancellation path.
            if (false) {

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

            }

            saveSessionsToStorage(nextSessions);
            dashboardState.rawSessions = nextSessions;
            dashboardState.sessions = nextSessions.map(normalizeSessionForState);
            
            const bookedData = await fetchBookedSlotsFromSupabase();
            dashboardState.bookedSlotIds = bookedData.ids;
            dashboardState.bookedSlots = bookedData.slots || [];

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
        
        const token = window.authSession?.getToken?.();
        if (!token) {
            throw new Error('AUTH_REQUIRED');
        }

        const response = await fetch('/.netlify/functions/student-cancellation-request', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reservation_id: sessionId,
                user_name: `${user?.prenom || ''} ${user?.nom || ''}`.trim(),
                reason,
                justification_file: fileBase64,
                justification_filename: file.name
            })
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.ok) {
            console.error('Error saving cancellation request:', result);
            throw new Error(result?.error || 'STUDENT_CANCELLATION_REQUEST_FAILED');
        }

        // Mettre é jour le statut de la session en "pending" (en attente)
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
    // Dédoublonner avant de sauvegarder
    const uniqueSessions = [];
    const seenIds = new Set();
    (sessions || []).forEach(session => {
        if (session && session.id && !seenIds.has(session.id)) {
            seenIds.add(session.id);
            uniqueSessions.push(session);
        }
    });
    
    const key = getSessionStorageKey();
    localStorage.setItem(key, JSON.stringify(uniqueSessions));
    
    if (uniqueSessions.length !== (sessions || []).length) {
        console.warn('?? Doublons supprimés lors de la sauvegarde:', (sessions || []).length - uniqueSessions.length);
    }
}

async function fetchBookedSlotsFromSupabase() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekStart = startOfWeek(today);
        weekStart.setDate(weekStart.getDate() + (dashboardState.weekOffset * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        console.log('?? Plage de recherche des créneaux réservés:');
        console.log('  - Début:', weekStart.toISOString(), '?', weekStart.toLocaleDateString('fr-FR'));
        console.log('  - Fin:', weekEnd.toISOString(), '?', weekEnd.toLocaleDateString('fr-FR'));
        console.log('  - Offset semaine:', dashboardState.weekOffset);

        // Récupérer les créneaux réservés via la table reservations
        // Filtrer seulement les réservations confirmées (status = upcoming, completed, done)
        // ET vérifier que le slot n'est pas 'available' (sinon c'est une réservation annulée)
        // IMPORTANT: Ne pas afficher les réservations de l'éléve actuel comme "réservées"
        const currentUser = getStoredUser();
        const currentUserEmail = currentUser?.email;
        
        // Récupérer le nom du moniteur actif
        const activeInstructor = INSTRUCTORS[dashboardState.activeInstructorKey];
        const activeInstructorName = activeInstructor?.name;
        
        console.log('?? Moniteur actif:', activeInstructorName);

        const token = window.authSession?.getToken?.();
        if (token && activeInstructorName) {
            const params = new URLSearchParams({
                type: 'booked-slots',
                instructor: activeInstructorName,
                start: weekStart.toISOString(),
                end: weekEnd.toISOString()
            });
            const response = await fetch(`/.netlify/functions/student-planning-data?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            });
            const result = await response.json().catch(() => null);
            if (response.ok && result?.ok) {
                const ids = new Set();
                const slots = [];
                (result.items || []).forEach(slot => {
                    const d = new Date(slot.start_at);
                    const endD = new Date(slot.end_at);
                    if (Number.isNaN(d.getTime()) || Number.isNaN(endD.getTime())) return;
                    const dateStr = toInputDate(d);
                    const startStr = `${padNumber(d.getHours())}:${padNumber(d.getMinutes())}`;
                    const endStr = `${padNumber(endD.getHours())}:${padNumber(endD.getMinutes())}`;
                    const slotId = buildSlotId(dateStr, startStr);
                    if (slot.status === 'booked') ids.add(slotId);
                    slots.push({
                        id: slotId,
                        date: dateStr,
                        start: startStr,
                        end: endStr,
                        instructor: slot.instructor,
                        dayLabel: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }),
                        label: `${startStr.replace(':', 'h')} - ${endStr.replace(':', 'h')}`,
                        isBooked: slot.status === 'booked',
                        isPermis: slot.status === 'permis',
                        isIndisponible: slot.status === 'indisponible'
                    });
                });
                return { ids, slots };
            }
            console.warn('student-planning-data booked-slots unavailable:', result?.error || response.status);
        }

        if (!window.supabaseClient) return { ids: new Set(), slots: [] };
        
        let query = window.supabaseClient
            .from('reservations')
            .select('slot_id, status, email, slots!inner(start_at, end_at, instructor, status)')
            .in('status', ['upcoming', 'completed', 'done'])
            .neq('slots.status', 'available')
            .gte('slots.start_at', weekStart.toISOString())
            .lt('slots.start_at', weekEnd.toISOString());
        
        // Filtrer par moniteur actif si défini
        if (activeInstructorName) {
            query = query.eq('slots.instructor', activeInstructorName);
        }
        
        const { data, error } = await query;
        
        // Récupérer aussi les créneaux bloqués pour permis et indisponibles
        let blockedQuery = window.supabaseClient
            .from('slots')
            .select('id, start_at, end_at, instructor, status')
            .in('status', ['booked', 'permis', 'indisponible'])
            .gte('start_at', weekStart.toISOString())
            .lt('start_at', weekEnd.toISOString());
        
        // Filtrer par moniteur actif si défini
        if (activeInstructorName) {
            blockedQuery = blockedQuery.eq('instructor', activeInstructorName);
        }
        
        const { data: blockedSlots, error: blockedError } = await blockedQuery;
        
        if (blockedError) {
            console.warn('Erreur récupération créneaux bloqués:', blockedError);
        } else if (blockedSlots && blockedSlots.length > 0) {
            console.log('?? Créneaux bloqués (permis + indisponible):', blockedSlots.length);
        }

        if (error) {
            console.warn('Supabase slots fetch error:', error);
            return { ids: new Set(), slots: [] };
        }

        console.log('?? Réservations trouvées dans Supabase:', data?.length || 0);
        if (data && data.length > 0) {
            console.log('?? Exemple de réservation:', data[0]);
        }

        const ids = new Set();
        const slots = [];
        const ownBookedSlotIds = new Set(
            (data || [])
                .filter((reservation) => currentUserEmail && reservation.email === currentUserEmail)
                .map((reservation) => reservation.slot_id)
        );
        (data || []).forEach((reservation) => {
            // IMPORTANT: Ignorer les réservations de l'éléve actuel
            // Elles ne doivent pas étre marquées comme "réservées" dans le planning
            if (currentUserEmail && reservation.email === currentUserEmail) {
                console.log(`?? SKIP: Réservation de l'éléve actuel ignorée`);
                return;
            }
            
            const slot = reservation.slots;
            if (!slot || !slot.start_at) return;
            
            // CRITIQUE: Vérifier que le slot n'est pas 'available'
            // Si le slot est 'available', cela signifie que la réservation a été annulée
            // et le créneau est redevenu libre
            if (slot.status === 'available') {
                console.log(`?? SKIP: Créneau avec status 'available' ignoré (réservation annulée)`);
                return;
            }
            
            const d = new Date(slot.start_at);
            const endD = new Date(slot.end_at);
            if (Number.isNaN(d.getTime())) return;
            
            // CRITIQUE: Ignorer les créneaux de Daho avant le 1er mai 2026
            // Car Daho est disponible é partir du 1er mai 2026
            const mayFirst2026 = new Date('2026-05-01T00:00:00');
            if (slot.instructor === 'Daho' && d < mayFirst2026) {
                console.log(`?? SKIP: Créneau Daho avant le 1er mai ignoré (${toInputDate(d)} ${padNumber(d.getHours())}:${padNumber(d.getMinutes())})`);
                return;
            }

            const dateStr = toInputDate(d);
            const startStr = `${padNumber(d.getHours())}:${padNumber(d.getMinutes())}`;
            const endStr = `${padNumber(endD.getHours())}:${padNumber(endD.getMinutes())}`;
            const slotId = buildSlotId(dateStr, startStr);
            
            console.log(`?? Créneau réservé: ${dateStr} ${startStr} ? ID: ${slotId} (Instructeur: ${slot.instructor}, Status: ${slot.status})`);
            
            if (slot.status === 'booked') ids.add(slotId);
            slots.push({
                id: slotId,
                date: dateStr,
                start: startStr,
                end: endStr,
                instructor: slot.instructor,
                dayLabel: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }),
                label: `${startStr.replace(':', 'h')} - ${endStr.replace(':', 'h')}`,
                isBooked: slot.status === 'booked'
            });
        });
        
        // Ajouter les créneaux bloqués pour permis et indisponibles é la liste des créneaux réservés
        (blockedSlots || []).forEach(slot => {
            if (!slot || !slot.start_at) return;
            if (slot.status === 'booked' && ownBookedSlotIds.has(slot.id)) return;
            
            const d = new Date(slot.start_at);
            const endD = new Date(slot.end_at);
            if (Number.isNaN(d.getTime())) return;

            const dateStr = toInputDate(d);
            const startStr = `${padNumber(d.getHours())}:${padNumber(d.getMinutes())}`;
            const endStr = `${padNumber(endD.getHours())}:${padNumber(endD.getMinutes())}`;
            const slotId = buildSlotId(dateStr, startStr);
            
            console.log(`?? Créneau bloqué (permis): ${dateStr} ${startStr} ? ID: ${slotId} (Instructeur: ${slot.instructor})`);
            
            if (slot.status === 'booked') ids.add(slotId);
            slots.push({
                id: slotId,
                date: dateStr,
                start: startStr,
                end: endStr,
                instructor: slot.instructor,
                dayLabel: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }),
                label: `${startStr.replace(':', 'h')} - ${endStr.replace(':', 'h')}`,
                isBooked: slot.status === 'booked',
                isPermis: slot.status === 'permis',
                isIndisponible: slot.status === 'indisponible'
            });
        });

        console.log('?? IDs de créneaux réservés:', Array.from(ids));
        return { ids, slots };
    } catch (err) {
        console.warn('Supabase slots fetch exception:', err);
        return { ids: new Set(), slots: [] };
    }
}

async function fetchSessions(user) {
    const now = new Date();
    let loadedFromServer = false;

    if (window.authSession?.getToken && user?.email) {
        try {
            const token = window.authSession.getToken();
            if (token) {
                const response = await fetch('/.netlify/functions/student-dashboard-data', {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: 'no-store'
                });
                const result = await response.json().catch(() => null);
                if (response.ok && result?.ok) {
                    const serverUser = result.user || {};
                    dashboardState.user = {
                        ...user,
                        ...serverUser,
                        forfait: serverUser.forfait || user.forfait,
                        pack: serverUser.pack || user.pack
                    };
                    dashboardState.lessonUnitMinutes = Number(
                        serverUser.lesson_unit_minutes
                        || dashboardState.user.lesson_unit_minutes
                        || (isCourseBasedPack(dashboardState.user.forfait || dashboardState.user.pack) ? 45 : 120)
                    );
                    dashboardState.hoursGoal = Number(result.totals?.hours_goal || serverUser.hours_goal || dashboardState.hoursGoal || 0);
                    dashboardState.initialCompletedHours = Number(result.totals?.hours_completed_initial || serverUser.hours_completed_initial || 0);

                    const serverSessions = (result.sessions || []).map((session) => ({
                        ...session,
                        durationHours: session.duration_hours,
                        slot: `${session.start_time} - ${session.end_time}`
                    }));
                    const storedSessions = loadSessionsFromStorage();
                    const serverIds = new Set(serverSessions.map((session) => String(session.id)));
                    const localOnlySessions = storedSessions.filter((session) => {
                        if (serverIds.has(String(session.id))) return false;
                        return session.status === 'cancelled_refused' || session.status === 'cancelled_pending';
                    });

                    dashboardState.rawSessions = [...serverSessions, ...localOnlySessions];
                    saveSessionsToStorage(dashboardState.rawSessions);
                    localStorage.setItem('ae_user', JSON.stringify(dashboardState.user));
                    loadedFromServer = true;
                } else {
                    console.warn('student-dashboard-data unavailable:', result?.error || response.status);
                }
            }
        } catch (error) {
            console.warn('student-dashboard-data error:', error);
        }
    }
    
    // Charger les sessions directement depuis Supabase
    if (!loadedFromServer && window.supabaseClient && user?.email) {
        try {
            console.log('?? Chargement des réservations pour:', user.email);
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
            
            console.log('?? Réservations trouvées:', (reservations || []).length);
            if (reservations && reservations.length > 0) {
                console.log('?? Exemple de réservation avec slot:', reservations[0]);
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
                    // Mettre é jour dans Supabase
                    // The UI can label past sessions locally. Only the admin
                    // workflow may persist a lesson completion in the database.
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
            
            // Ajouter les sessions locales (cancelled_refused + upcoming non trouvées en base)
            const storedSessions = loadSessionsFromStorage();
            const supabaseIds = new Set(sessions.map(s => String(s.id)));
            
            // Garder les sessions annulées ET les sessions upcoming qui ne sont pas encore en base
            const localOnlySessions = storedSessions.filter(s => {
                if (!supabaseIds.has(String(s.id))) {
                    // Session en localStorage mais pas en Supabase
                    if (s.status === 'cancelled_refused') return true;
                    if (s.status === 'upcoming') {
                        console.log('?? Session upcoming trouvée en localStorage mais pas en Supabase:', s);
                        return true; // Garder temporairement
                    }
                }
                return false;
            });
            
            const allSessions = [...sessions, ...localOnlySessions];
            
            console.log('?? Total sessions:', allSessions.length, '(Supabase:', sessions.length, '+ Local:', localOnlySessions.length + ')');
            
            saveSessionsToStorage(allSessions);
            dashboardState.rawSessions = allSessions;
        } catch (err) {
            console.warn('Error fetching sessions from Supabase:', err);
            dashboardState.rawSessions = loadSessionsFromStorage();
        }
    } else if (!loadedFromServer) {
        dashboardState.rawSessions = loadSessionsFromStorage();
    }
    
    dashboardState.sessions = dashboardState.rawSessions.map(normalizeSessionForState);
    dashboardState.favoriteInstructor = dashboardState.sessions[0]?.instructor || dashboardState.favoriteInstructor;

    updateInstructorSelect();
    createInstructorCards();
    
    // Générer les slots depuis les blueprints
    const generatedSlots = generateUpcomingSlots();
    
    // Récupérer les slots réservés depuis Supabase
    const bookedData = await fetchBookedSlotsFromSupabase();
    dashboardState.bookedSlotIds = bookedData.ids;
    dashboardState.bookedSlots = bookedData.slots || [];
    
    // Fusionner les slots générés avec les slots réservés
    const allSlots = [...generatedSlots];
    bookedData.slots.forEach(bookedSlot => {
        // Garder les anciens blocs en base comme blocage, sans créer de fausses lignes horaires.
        if (!allSlots.find(s => s.id === bookedSlot.id || arePlanningSlotsOverlapping(s, bookedSlot))) {
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
        window.location.replace('connexion.html?redirect=espace-eleve.html');
        return null;
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
            const updated = {
                ...user,
                nom: data.nom,
                telephone: data.telephone,
                prenom: data.prenom,
                forfait: data.forfait,
                lesson_unit_minutes: data.lesson_unit_minutes || user.lesson_unit_minutes || (isCourseBasedPack(data.forfait || user.forfait) ? 45 : 120)
            };
            dashboardState.lessonUnitMinutes = Number(updated.lesson_unit_minutes || 120);
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

async function legacyFetchUserPackAndSetGoal(forfait) {
    try {
        console.log('?? Pack récupéré depuis users.forfait:', forfait);
        
        // Récupérer les heures depuis inscription_notifications
        const user = dashboardState.user;
        if (user && user.email) {
            // Récupérer toutes les inscriptions de l'utilisateur (triées par date décroissante)
            const { data: inscriptions, error: inscError } = await window.supabaseClient
                .from('inscription_notifications')
                .select('hours_purchased, pack, created_at')
                .eq('user_email', user.email)
                .order('created_at', { ascending: false });
            
            if (!inscError && inscriptions && inscriptions.length > 0) {
                // Calculer le total des heures achetées
                const totalHoursPurchased = inscriptions.reduce((sum, ins) => {
                    return sum + (ins.hours_purchased || 0);
                }, 0);
                
                dashboardState.hoursGoal = totalHoursPurchased;
                console.log('? Total heures achetées depuis inscription_notifications:', dashboardState.hoursGoal);
                
                // Packs sans heures de conduite : toujours 0h
                const packsWithoutDriving = ['code'];
                const latestPack = inscriptions[0].pack;
                if (packsWithoutDriving.includes(latestPack)) {
                    dashboardState.hoursGoal = 0;
                    console.log('? Forfait', latestPack, '? 0 cours de conduite');
                }
            } else {
                console.warn('?? Aucune inscription trouvée dans inscription_notifications');
            }
            
            // Récupérer hours_completed_initial depuis users
            const { data: userData, error: userError } = await window.supabaseClient
                .from('users')
                .select('hours_completed_initial')
                .eq('email', user.email)
                .maybeSingle();
            
            if (!userError && userData) {
                console.log('?? hours_completed_initial dans la DB:', userData.hours_completed_initial);
                
                if (userData.hours_completed_initial !== null && userData.hours_completed_initial !== undefined) {
                    dashboardState.initialCompletedHours = userData.hours_completed_initial;
                    console.log('? Heures déjé effectuées avant inscription:', dashboardState.initialCompletedHours);
                } else {
                    dashboardState.initialCompletedHours = 0;
                    console.log('?? Aucune heure initiale trouvée, défaut é 0');
                }
            }
            
            if (dashboardState.hoursGoal !== undefined && dashboardState.hoursGoal > 0) return;
        }
        
        // Fallback to pack-based mapping if hours_goal not in DB
        if (forfait) {
            // Définir les heures par forfait
            const packHours = {
                'code': 0,              // Code de la route uniquement, pas de conduite
                'aac': 20,
                'supervisee': 20,
                'boite-auto': 13,
                'chill': 20,
                'chill-auto': 13,
                'zen': 20,
                'zen-auto': 13,
                'am': 8,
                'second-chance': 6
            };
            
            dashboardState.hoursGoal = packHours[forfait] !== undefined ? packHours[forfait] : 20;
            console.log('? Pack détecté:', forfait, '- Objectif heures (fallback):', dashboardState.hoursGoal);
        } else {
            console.warn('?? Aucun forfait trouvé, utilisation de 20h par défaut');
            dashboardState.hoursGoal = 20;
        }
        
        if (!dashboardState.initialCompletedHours) {
            dashboardState.initialCompletedHours = 0;
        }
    } catch (e) {
        console.error('? fetchUserPackAndSetGoal error:', e);
        dashboardState.hoursGoal = 20;
        dashboardState.initialCompletedHours = 0;
    }
}

async function fetchUserPackAndSetGoal(forfait) {
    const user = dashboardState.user;
    if (!user?.email || !window.supabaseClient) {
        dashboardState.hoursGoal = 0;
        dashboardState.initialCompletedHours = 0;
        return;
    }

    try {
        // `hours_goal` is updated exclusively by the server after a verified
        // payment. Pending or rejected registration notifications never count.
        const { data, error } = await window.supabaseClient
            .from('users')
            .select('hours_goal, hours_completed_initial, forfait')
            .ilike('email', user.email)
            .maybeSingle();
        if (error) throw error;

        const legacyHours = {
            code: 0,
            'code-etudiant': 0,
            'code-classique': 0,
            aac: 20,
            supervisee: 20,
            'boite-auto': 13,
            am: 8,
            '20h': 20,
            chill: 20,
            accelere: 20,
            'second-chance': 6
        };
        const selectedForfait = data?.forfait || forfait;
        const storedGoal = Number(data?.hours_goal);
        dashboardState.hoursGoal = Number.isFinite(storedGoal) && storedGoal >= 0
            ? storedGoal
            : (legacyHours[selectedForfait] ?? 0);

        const initialHours = Number(data?.hours_completed_initial);
        dashboardState.initialCompletedHours = Number.isFinite(initialHours) && initialHours >= 0
            ? initialHours
            : 0;
        dashboardState.lessonUnitMinutes = Number(data?.lesson_unit_minutes || user.lesson_unit_minutes || (isCourseBasedPack(selectedForfait) ? 45 : 120));
    } catch (error) {
        console.error('Impossible de charger le solde d\'heures:', error);
        dashboardState.hoursGoal = 0;
        dashboardState.initialCompletedHours = 0;
    }
}

function hydrateHeader(user) {
    const nameEl = document.getElementById('studentName');
    const emailEl = document.getElementById('studentEmail');
    if (nameEl) nameEl.textContent = user.prenom || 'éléve';
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
    const startSelection = form.elements['start']?.value || '';
    const [selectedStartValue, selectedEndValue] = startSelection.split('|');
    const startValue = selectedStartValue || startSelection;
    const instructorValue = form.elements['instructor']?.value;
    const statusValue = form.elements['status']?.value || 'upcoming';
    const notesValue = form.elements['notes']?.value?.trim();
    const endValue = selectedEndValue || getEndTimeForSlot(startValue, instructorValue);

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
            
            // Vérifier que ce n'est pas un dimanche (auto-école fermée)
            const bookingDay = startAt.getDay();
            if (bookingDay === 0) {
                if (feedback) {
                    feedback.textContent = 'Les réservations ne sont pas possibles le dimanche.';
                    feedback.className = 'form-feedback error';
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitBtn.dataset.originalText || 'Réserver';
                }
                return;
            }
            
            // Vérifier si l'utilisateur a un forfait avec conduite
            if (dashboardState.hoursGoal === 0) {
                if (feedback) {
                    feedback.innerHTML = `Ton forfait ne comprend pas de ${drivingUnitLabel()} de conduite.<br><a href="inscription.html" style="color: var(--primary-color); text-decoration: underline;">Acheter un pack conduite</a>`;
                    feedback.className = 'form-feedback error';
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitBtn.dataset.originalText || 'Réserver';
                }
                return;
            }

            // Vérifier si l'utilisateur a assez de solde disponible
            const hoursToBook = (endAt - startAt) / (1000 * 60 * 60); // Durée en heures
            const unitsToBook = lessonUnitsForDuration(hoursToBook);
            const totalReservedAfter = dashboardState.reservedHours + unitsToBook;
            const remainingUnits = dashboardState.hoursGoal - dashboardState.completedHours;
            
            if (totalReservedAfter > remainingUnits) {
                const missingUnits = totalReservedAfter - remainingUnits;
                if (feedback) {
                    const missingText = `${formatDrivingUnits(missingUnits)} ${drivingUnitLabel(missingUnits > 1)}`;
                    feedback.innerHTML = `Solde insuffisant. Il te manque <strong>${missingText}</strong>.<br><a href="#" onclick="openExtraHoursPayment(${Math.ceil(missingUnits)}); return false;" style="color: var(--primary-color); text-decoration: underline;">Ajouter du solde</a>`;
                    feedback.className = 'form-feedback error';
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitBtn.dataset.originalText || 'Réserver';
                }
                return;
            }

            const selectedSlotInfo = {
                id: buildSlotId(dateValue, startValue),
                date: dateValue,
                start: startValue,
                end: endValue,
                instructor: instructorValue
            };
            if ((dashboardState.bookedSlotIds || new Set()).has(selectedSlotInfo.id) || isSlotOverlappingBookedSlot(selectedSlotInfo)) {
                if (feedback) {
                    feedback.textContent = 'Ce créneau est déjà réservé ou bloqué sur cette plage horaire. Choisis-en un autre.';
                    feedback.className = 'form-feedback error';
                }
                await refreshSlotsForCurrentWeek();
                renderSlotGrid();
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitBtn.dataset.originalText || 'Réserver';
                }
                return;
            }

            // Charger les données complétes de l'utilisateur depuis Supabase
            user = await refreshUserProfile(user);
            console.log('Booking with user:', user.prenom, user.nom, user.telephone);

            const token = window.authSession?.getToken?.();
            if (!token) {
                window.location.href = getLoginUrl('espace-eleve.html');
                return;
            }

            const response = await fetch('/.netlify/functions/student-book-slot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    start_at: startAt.toISOString(),
                    end_at: endAt.toISOString(),
                    instructor: instructorValue
                })
            });
            const data = await response.json().catch(() => null);
            const error = !response.ok || !data?.ok ? new Error(data?.error || 'BOOKING_FAILED') : null;

            if (error) {
                throw error;
            }

            console.log('?? book_slot response:', JSON.stringify(data));

            if (!data || data.ok !== true) {
                const reason = data?.error || 'UNKNOWN_ERROR';
                console.error('? échec de book_slot:', reason);
                
                if (feedback) {
                    let errorMessage = 'Impossible de confirmer la réservation. Réessaie.';
                    
                    if (reason === 'SLOT_NOT_AVAILABLE' || reason.includes('duplicate key') || reason.includes('reservations_slot_unique')) {
                        errorMessage = 'Ce créneau vient d\'être réservé par quelqu\'un d\'autre. Choisis-en un autre.';
                    }
                    
                    feedback.textContent = errorMessage;
                    feedback.className = 'form-feedback error';
                }
                
                // Recharger les créneaux pour mettre é jour l'affichage
                await refreshSlotsForCurrentWeek();
                renderSlotGrid();
                
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitBtn.dataset.originalText || 'Réserver';
                }
                
                // ARRéTER ICI - Ne PAS sauvegarder en localStorage si book_slot échoue
                return;
            }
            
            // Vérifier que slot_id et reservation_id sont bien retournés
            if (!data.slot_id || !data.reservation_id) {
                console.error('? book_slot n\'a pas retourné slot_id ou reservation_id:', data);
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

            // Réservation créée avec succés dans Supabase
            console.log('? Réservation créée - Slot ID:', data.slot_id, 'Reservation ID:', data.reservation_id);
            
            // IMPORTANT : Attendre 500ms pour que Supabase finalise la transaction
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Recharger les sessions depuis la fonction serveur pour garder
            // l'espace élève synchronisé avec l'admin et le moniteur.
            await fetchSessions(user);
            
            // Si le rechargement échoue, créer manuellement la session en localStorage
            // Vérifier dans rawSessions (qui a .id) ET dans sessions (qui a .sessionId)
            const sessionExists = dashboardState.rawSessions.some(s => s.id === data.reservation_id) ||
                                  dashboardState.sessions.some(s => s.sessionId === data.reservation_id);
            if (!sessionExists) {
                console.warn('?? Session non trouvée aprés rechargement, création manuelle');
                const manualSession = {
                    id: data.reservation_id,
                    date: dateValue,
                    start_time: startValue,
                    end_time: endValue,
                    duration_hours: (endAt - startAt) / (1000 * 60 * 60),
                    instructor: instructorValue,
                    status: 'upcoming',
                    notes: notesValue
                };
                dashboardState.rawSessions.push(manualSession);
                dashboardState.sessions.push(normalizeSessionForState(manualSession));
                saveSessionsToStorage(dashboardState.rawSessions);
                console.log('?? Session sauvegardée manuellement en localStorage');
            }
            
            // Recharger les créneaux disponibles
            await refreshSlotsForCurrentWeek();
            
            // Rafraéchir l'affichage
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
                feedback.textContent = `Réservation confirmée. Ton compteur de ${drivingUnitLabel()} a été mis à jour.`;
                feedback.className = 'form-feedback success';
            }

            form.reset();
            dashboardState.selectedSlotId = null;
            dashboardState.selectedSlotEnd = '';
        } catch (err) {
            console.error('Erreur réservation Supabase:', err);
            if (feedback) {
                const messages = {
                    INCOMPATIBLE_PLANNING_MODE: 'Ce créneau est réservé à un autre type de forfait.',
                    INVALID_SLOT_DURATION: 'Ce créneau ne correspond pas à la durée de ton forfait.',
                    SLOT_NOT_AVAILABLE: 'Ce créneau est déjà réservé ou bloqué sur cette plage horaire. Choisis-en un autre.',
                    STUDENT_TIME_CONFLICT: 'Tu as déjà une séance sur ce même horaire.',
                    INSUFFICIENT_BALANCE: 'Ton solde est insuffisant pour réserver ce créneau.',
                    SUNDAY_CLOSED: 'L auto-école est fermée le dimanche.'
                };
                feedback.textContent = messages[err.message] || 'Erreur lors de la réservation. Réessaie dans quelques secondes.';
                feedback.className = 'form-feedback error';
            }
            await refreshSlotsForCurrentWeek();
            renderSlotGrid();
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
    const startDate = new Date(`${dateValue}T${startValue}:00`);
    const endDate = new Date(`${dateValue}T${endValue}:00`);
    const durationHours = (endDate - startDate) / (1000 * 60 * 60);
    const durationLabel = isNewLessonFormat()
        ? `${lessonUnitsForDuration(durationHours)} cours (${durationHours === 0.75 ? '45 min' : `${durationHours}h`})`
        : `${durationHours} heure${durationHours > 1 ? 's' : ''}`;

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
                    <p><i class="fas fa-hourglass-half"></i> <strong>Durée :</strong> ${durationLabel}</p>
                    ${session.notes ? `<p><i class="fas fa-sticky-note"></i> <strong>Note :</strong> ${session.notes}</p>` : ''}
                </div>
                
                <div style="background: linear-gradient(135deg, #fff9fb 0%, #fff 100%); padding: 1.5rem; border-radius: 12px; margin: 1.5rem 0; border: 2px solid rgba(233,30,99,0.1);">
                    <h4 style="margin: 0 0 1rem 0; font-size: 1.05rem; color: #1d1d1f;">
                        <i class="fas fa-bell" style="color: var(--primary-color);"></i> 
                        Veux-tu être contacté(e) en cas de désistement ?
                    </h4>
                    <p style="margin: 0 0 1rem 0; color: #6c757d; font-size: 0.9rem;">
                        Si un créneau se libére suite é une annulation, nous pouvons te contacter en priorité pour le récupérer.
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
            Choisis les semaines, jours et créneaux oé tu es disponible en cas de désistement.
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
                            <input type="checkbox" value="13:00-15:00"> 13h-15h (Daho)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="15:00-17:00"> 15h-17h (Daho)
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
                            <input type="checkbox" value="13:00-15:00"> 13h-15h (Daho)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="15:00-17:00"> 15h-17h (Daho)
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
                            <input type="checkbox" value="13:00-15:00"> 13h-15h (Daho)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="15:00-17:00"> 15h-17h (Daho)
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
                            <input type="checkbox" value="13:00-15:00"> 13h-15h (Daho)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="15:00-17:00"> 15h-17h (Daho)
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
                            <input type="checkbox" value="13:00-15:00"> 13h-15h (Daho)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="15:00-17:00"> 15h-17h (Daho)
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
                            <input type="checkbox" value="13:00-15:00"> 13h-15h (Daho)
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
                            <input type="checkbox" value="15:00-17:00"> 15h-17h (Daho)
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

    renderAvailabilityTimeChoices('.time-slots-popup');
    
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
        
        // Charger les disponibilités existantes pour fusionner
        let existingSlots = {};
        let existingWeeks = [];
        try {
            const data = await requestStudentAvailability('GET');
            if (data) {
                existingSlots = typeof data.availability_slots === 'string'
                    ? JSON.parse(data.availability_slots) 
                    : (data.availability_slots || {});
                existingWeeks = data.availability_weeks || [];
            }
        } catch (e) {
            console.error('Erreur chargement dispo existantes:', e);
        }
        
        // Collect selected weeks
        const selectedWeeks = [];
        document.querySelectorAll('.week-checkbox-popup:checked').forEach(weekCheckbox => {
            selectedWeeks.push(weekCheckbox.value);
        });
        
        // Validate: must select at least one week
        if (selectedWeeks.length === 0) {
            if (feedback) {
                feedback.textContent = 'Sélectionne au moins une semaine de disponibilité';
                feedback.style.color = '#d32f2f';
            }
            return;
        }
        
        // Collect selected slots
        const newSlots = {};
        document.querySelectorAll('.day-checkbox-popup:checked').forEach(dayCheckbox => {
            const day = dayCheckbox.dataset.day;
            const timeSlots = document.querySelector(`.time-slots-popup[data-day="${day}"]`);
            if (timeSlots) {
                const selectedTimes = [];
                timeSlots.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                    selectedTimes.push(cb.value);
                });
                if (selectedTimes.length > 0) {
                    newSlots[day] = selectedTimes;
                }
            }
        });
        
        // Validate: must select at least one slot
        if (Object.keys(newSlots).length === 0) {
            if (feedback) {
                feedback.textContent = 'Sélectionne au moins un jour et un créneau horaire';
                feedback.style.color = '#d32f2f';
            }
            return;
        }
        
        // Fusionner avec les disponibilités existantes
        const mergedSlots = { ...existingSlots };
        Object.keys(newSlots).forEach(day => {
            const existing = mergedSlots[day] || [];
            const merged = [...new Set([...existing, ...newSlots[day]])];
            mergedSlots[day] = merged;
        });
        
        const mergedWeeks = [...new Set([...existingWeeks, ...selectedWeeks])];
        
        console.log('?? Sauvegarde fusionnée - Semaines:', mergedWeeks, 'Créneaux:', mergedSlots);
        
        const payload = {
            user_email: userEmail,
            user_name: userName,
            user_phone: userPhone,
            wants_cancellation_notifications: true,
            availability_weeks: mergedWeeks,
            availability_slots: mergedSlots,
            updated_at: new Date().toISOString()
        };
        
        try {
            await requestStudentAvailability('POST', payload);
        } catch (error) {
            console.error('Error saving availability:', error);
            if (feedback) {
                feedback.textContent = '? Erreur lors de l\'enregistrement';
                feedback.style.color = '#d32f2f';
            }
            return;
        }
        
        if (feedback) {
            feedback.textContent = 'Disponibilités enregistrées avec succès !';
            feedback.style.color = '#0a8e47';
        }
        
        // Fermer la popup aprés 2 secondes
        setTimeout(() => {
            closeBookingNotification();
        }, 2000);
        
    } catch (err) {
        console.error('Error saving availability:', err);
        const feedback = document.getElementById('availabilityFeedbackPopup');
        if (feedback) {
            feedback.textContent = '? Erreur lors de l\'enregistrement';
            feedback.style.color = '#d32f2f';
        }
    }
};

window.closeBookingNotification = async function() {
    const notification = document.getElementById('bookingNotification');
    if (notification) {
        // Vérifier si on a un ID de réservation temporaire é supprimer
        const reservationId = notification.dataset.reservationId;
        
        if (reservationId) {
            // Supprimer la réservation de la base de données car l'utilisateur a fermé sans confirmer
            try {
                const { data: cancellation, error: cancellationError } = await window.supabaseClient
                    .rpc('cancel_own_reservation', {
                        p_reservation_id: reservationId,
                        p_slot_id: null
                    });
                if (cancellationError || !cancellation?.ok) {
                    throw cancellationError || new Error(cancellation?.error || 'ANNULATION_REFUSED');
                }
                
                console.log('Réservation annulée car popup fermée sans confirmation');
                
                // Recharger les données pour mettre é jour l'interface
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
    
    // Chercher le moniteur dans INSTRUCTORS
    const instructorKey = instructor.toLowerCase();
    const instructorData = INSTRUCTORS[instructorKey];
    
    let timeSlots = [];
    
    if (instructorData) {
        // Utiliser les horaires du moniteur depuis Supabase
        if (isNewLessonFormat() && normalizeInstructorKey(instructorData.name || instructor) === 'nail') {
            timeSlots = ['15:00|15:45', '15:45|16:30'];
        } else if (isNewLessonFormat() && !isLegacyInstructorName(instructorData.name || instructor)) {
            timeSlots = buildTimeRows('07:00', '19:00', 45);
        } else if (instructorData.workSchedule === 'full_time') {
            timeSlots = ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00'];
        } else if (instructorData.customSchedule) {
            // Extraire les heures uniques des horaires personnalisés
            const uniqueHours = new Set();
            Object.values(instructorData.customSchedule).forEach(schedule => {
                if (schedule.start) uniqueHours.add(schedule.start);
            });
            timeSlots = Array.from(uniqueHours).sort();
        } else {
            timeSlots = ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00'];
        }
    } else {
        // Fallback pour les anciens moniteurs codés en dur
        if (instructor === 'Sammy') {
            timeSlots = ['07:00', '09:00', '11:00'];
        } else if (isNewLessonFormat() && normalizeInstructorKey(instructor) === 'nail') {
            timeSlots = ['15:00|15:45', '15:45|16:30'];
        } else if (instructor === 'Daho' || instructor === 'Nail') {
            timeSlots = ['13:00', '15:00', '17:00'];
        } else {
            timeSlots = ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00'];
        }
    }
    
    // Générer les options
    let html = '<option value="">Sélectionne une heure</option>';
    timeSlots.forEach(time => {
        const end = getEndForStart(instructorData?.name || instructor, time);
        const bookingStart = slotStartCodeStart(time);
        const optionValue = slotStartCodeEnd(time) ? `${bookingStart}|${end}` : bookingStart;
        const labelStart = bookingStart.replace(':', 'h');
        const labelEnd = String(end || '').replace(':', 'h');
        html += `<option value="${optionValue}">${labelStart} - ${labelEnd}</option>`;
    });
    
    startSelect.innerHTML = html;
    startSelect.value = '';
}

function initBookingForm() {
    const form = document.getElementById('bookingForm');
    if (!form) return;
    form.addEventListener('submit', handleBookingSubmission);

    // Bloquer la sélection de dimanche sur le champ date (auto-école fermée)
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        dateInput.addEventListener('change', function() {
            const selectedDate = new Date(this.value + 'T00:00:00');
            if (!isNaN(selectedDate)) {
                const day = selectedDate.getDay();
                const feedback = document.getElementById('bookingFeedback');
                
                if (day === 0) {
                    this.value = '';
                    if (feedback) {
                        feedback.textContent = 'Les réservations ne sont pas possibles le dimanche.';
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
    const user = await window.authSession?.requireRole('student');
    if (!user) {
        window.location.replace('connexion.html?redirect=espace-eleve.html');
        return;
    }
    if (!user) return;
    dashboardState.user = user;
    
    // Vérifier si l'éléve a réussi son permis
    if (window.checkStudentExamStatus) {
        const examData = await window.checkStudentExamStatus(user.email);
        if (examData) {
            // L'éléve a réussi son permis, afficher le message de félicitations
            console.log('? éléve a réussi son permis, blocage des réservations');
            if (window.displaySuccessMessage) {
                window.displaySuccessMessage(examData);
            }
            return; // Arréter l'initialisation du dashboard
        }
    }
    hydrateHeader(user);

    // Charger les données complétes depuis Supabase
    const fullUser = await refreshUserProfile(user);
    hydrateHeader(fullUser);
    updateInstructorSelect();
    createInstructorCards();

    await fetchSessions(fullUser);
    initBookingForm();
    initCancelModal();
    initTabs();
    updateWeekDisplay(); // Initialiser l'affichage de la semaine
    
    // Afficher le carnet de bord si AAC/Supervisée
    await checkAndShowDrivingLog();
}
window.loadUserData = initStudentDashboard;

// ============================================
// CARNET DE BORD - AAC/SUPERVISéE
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
            } else if (targetTab === 'invoices') {
                document.getElementById('invoicesTab').classList.add('active');
                // Charger les factures si pas déjé chargées
                if (!window.invoicesLoaded) {
                    loadInvoices();
                }
            } else if (targetTab === 'driving-log') {
                document.getElementById('drivingLogTab').classList.add('active');
            } else if (targetTab === 'profile') {
                document.getElementById('profileTab')?.classList.add('active');
                if (typeof window.renderStudentProfile === 'function') {
                    window.renderStudentProfile();
                }
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
    
    // Mettre é jour les stats
    document.getElementById('totalTrips').textContent = totalTrips;
    document.getElementById('totalHours').textContent = `${Math.floor(totalMinutes / 60)}h${totalMinutes % 60 > 0 ? (totalMinutes % 60) + 'm' : ''}`;
    document.getElementById('totalKm').textContent = `${totalKm.toFixed(1)} km`;
    
    if (logs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fas fa-route"></i></div>
                <p>Aucun trajet enregistré</p>
                <span>Commencez à enregistrer vos cours de conduite</span>
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
                            <span><i class="fas fa-clock"></i></span>
                            <strong>${durationText}</strong>
                        </div>
                        <div class="trip-meta-item">
                            <span><i class="fas fa-road"></i></span>
                            <strong>${log.distance_km} km</strong>
                        </div>
                    </div>
                    ${log.conditions ? `<div class="trip-conditions"><i class="fas fa-cloud-sun"></i> ${log.conditions}</div>` : ''}
                    ${log.remarks ? `<div class="trip-remarks"><i class="fas fa-comment-dots"></i> ${log.remarks}</div>` : ''}
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
        
        // Pré-remplir avec le nombre d'heures manquantes (arrondi é la paire supérieure)
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
    
    totalPriceEl.textContent = totalPrice > 0 ? totalPrice + 'é' : '0é';
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
    const packName = `${hours} cours de conduite - Boîte ${transmissionType === 'manual' ? 'manuelle' : 'automatique'}`;
    
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

    renderAvailabilityTimeChoices('.time-slots');
    
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
        
        const data = await requestStudentAvailability('GET');
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
            feedback.textContent = 'Sélectionne au moins un créneau horaire';
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
        
        try {
            await requestStudentAvailability('POST', payload);
        } catch (error) {
            console.error('Error saving availability:', error);
            feedback.textContent = '? Erreur lors de l\'enregistrement';
            feedback.style.color = '#d32f2f';
            return;
        }
        
        feedback.textContent = 'Disponibilités enregistrées avec succès !';
        feedback.style.color = '#0a8e47';
        
        setTimeout(() => {
            feedback.textContent = '';
        }, 3000);
        
    } catch (err) {
        console.error('Error saving availability:', err);
        const feedback = document.getElementById('availabilityFeedback');
        feedback.textContent = '? Erreur lors de l\'enregistrement';
        feedback.style.color = '#d32f2f';
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Rafraéchissement automatique des créneaux toutes les 30 secondes
let autoRefreshInterval = null;

function startAutoRefresh() {
    // Arréter l'intervalle existant s'il y en a un
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // Rafraéchir toutes les 30 secondes
    autoRefreshInterval = setInterval(async () => {
        console.log('?? Rafraéchissement automatique des créneaux...');
        const bookedData = await fetchBookedSlotsFromSupabase();
        dashboardState.bookedSlotIds = bookedData.ids;
        dashboardState.bookedSlots = bookedData.slots || [];
        renderSlotGrid();
    }, 30000); // 30 secondes
    
    console.log('? Rafraéchissement automatique activé (30s)');
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        console.log('?? Rafraéchissement automatique désactivé');
    }
}

const studentPackInvoiceCatalog = {
    code: { price: 20, label: 'Code classique', courses: 0 },
    'code-etudiant': { price: 15, label: 'Code étudiant', courses: 0 },
    'code-classique': { price: 20, label: 'Code classique', courses: 0 },
    am: { price: 350, label: 'Voiture sans permis (AM)', courses: 8 },
    'tarif-chill-5': { price: 239, label: 'Chill boîte manuelle - 5 cours', courses: 5 },
    'tarif-chill-10': { price: 489, label: 'Chill boîte manuelle - 10 cours', courses: 10 },
    'tarif-chill-20': { price: 699, label: 'Chill boîte manuelle - 20 cours', courses: 20 },
    'tarif-chill-25': { price: 965, label: 'Chill boîte manuelle - 25 cours', courses: 25 },
    'tarif-chill-30': { price: 1149, label: 'Chill boîte manuelle - 30 cours', courses: 30 },
    'tarif-zen-5': { price: 239, label: 'Chill boîte manuelle - 5 cours', courses: 5 },
    'tarif-zen-10': { price: 489, label: 'Chill boîte manuelle - 10 cours', courses: 10 },
    'tarif-zen-20': { price: 699, label: 'Chill boîte manuelle - 20 cours', courses: 20 },
    'tarif-zen-25': { price: 965, label: 'Chill boîte manuelle - 25 cours', courses: 25 },
    'tarif-zen-30': { price: 1149, label: 'Chill boîte manuelle - 30 cours', courses: 30 },
    'tarif-premium-5': { price: 389, label: 'Premium boîte manuelle - 5 cours', courses: 5 },
    'tarif-premium-10': { price: 599, label: 'Premium boîte manuelle - 10 cours', courses: 10 },
    'tarif-premium-20': { price: 799, label: 'Premium boîte manuelle - 20 cours', courses: 20 },
    'tarif-premium-25': { price: 1095, label: 'Premium boîte manuelle - 25 cours', courses: 25 },
    'tarif-premium-30': { price: 1249, label: 'Premium boîte manuelle - 30 cours', courses: 30 },
    'tarif-accelere-5': { price: 489, label: 'Accéléré boîte manuelle - 5 cours', courses: 5 },
    'tarif-accelere-10': { price: 749, label: 'Accéléré boîte manuelle - 10 cours', courses: 10 },
    'tarif-accelere-20': { price: 899, label: 'Accéléré boîte manuelle - 20 cours', courses: 20 },
    'tarif-accelere-25': { price: 1199, label: 'Accéléré boîte manuelle - 25 cours', courses: 25 },
    'tarif-accelere-30': { price: 1399, label: 'Accéléré boîte manuelle - 30 cours', courses: 30 },
    'tarif-chill-auto-5': { price: 269, label: 'Chill boîte automatique - 5 cours', courses: 5 },
    'tarif-chill-auto-13': { price: 499, label: 'Chill boîte automatique - 13 cours', courses: 13 },
    'tarif-zen-auto-5': { price: 269, label: 'Chill boîte automatique - 5 cours', courses: 5 },
    'tarif-zen-auto-13': { price: 499, label: 'Chill boîte automatique - 13 cours', courses: 13 },
    'tarif-premium-auto-5': { price: 379, label: 'Premium boîte automatique - 5 cours', courses: 5 },
    'tarif-premium-auto-13': { price: 599, label: 'Premium boîte automatique - 13 cours', courses: 13 },
    'tarif-accelere-auto-5': { price: 499, label: 'Accéléré boîte automatique - 5 cours', courses: 5 },
    'tarif-accelere-auto-13': { price: 749, label: 'Accéléré boîte automatique - 13 cours', courses: 13 },
    'tarif-aac-20': { price: 889, label: 'Conduite accompagnée - 20 cours', courses: 20 },
    'tarif-supervisee-20': { price: 889, label: 'Conduite supervisée - 20 cours', courses: 20 },
    'tarif-aac-auto-13': { price: 639, label: 'AAC boîte automatique - 13 cours', courses: 13 },
    'tarif-supervisee-auto-13': { price: 639, label: 'Supervisée boîte automatique - 13 cours', courses: 13 },
    'second-chance': { price: 569, label: 'Forfait Second Chance', courses: 6 },
    'boite-auto': { price: 499, label: 'Chill boîte automatique - 13 cours', courses: 13 },
    '20h': { price: 699, label: 'Chill boîte manuelle - 20 cours', courses: 20 },
    chill: { price: 699, label: 'Chill boîte manuelle - 20 cours', courses: 20 },
    zen: { price: 699, label: 'Chill boîte manuelle - 20 cours', courses: 20 },
    'zen-auto': { price: 499, label: 'Chill boîte automatique - 13 cours', courses: 13 },
    accelere: { price: 899, label: 'Accéléré boîte manuelle - 20 cours', courses: 20 },
    aac: { price: 889, label: 'Conduite accompagnée - 20 cours', courses: 20 },
    supervisee: { price: 889, label: 'Conduite supervisée - 20 cours', courses: 20 }
};

async function buildAdminPackInvoiceFallback(userData) {
    if (!window.supabaseClient || !userData || !userData.email) return null;
    const { data: profile, error } = await window.supabaseClient
        .from('users')
        .select('prenom, nom, email, forfait, hours_goal, created_at')
        .ilike('email', userData.email)
        .maybeSingle();
    if (error || !profile || !profile.forfait) return null;

    const pack = studentPackInvoiceCatalog[profile.forfait];
    if (!pack || !pack.price) return null;

    const invoiceId = `admin-pack:${profile.email}:${profile.forfait}`;
    const invoice = {
        id: invoiceId,
        invoice_number: `ADMIN-${String(profile.forfait).toUpperCase()}-${String(profile.email || '').slice(0, 6).toUpperCase()}`,
        user_email: profile.email,
        student_name: `${profile.prenom || userData.prenom || ''} ${profile.nom || userData.nom || ''}`.trim() || profile.email,
        amount: pack.price,
        payment_method: 'admin',
        description: `Forfait ${pack.label}`,
        forfait: profile.forfait,
        hours_purchased: Number(profile.hours_goal || pack.courses || 0),
        payment_date: profile.created_at || new Date().toISOString(),
        lesson_unit_minutes: isCourseBasedPack(profile.forfait) ? 45 : 120
    };
    window.adminPackInvoiceFallbacks = window.adminPackInvoiceFallbacks || {};
    window.adminPackInvoiceFallbacks[invoiceId] = invoice;
    return invoice;
}

async function downloadStudentInvoicePdf(invoiceId, button) {
    const originalHtml = button?.innerHTML;
    try {
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Préparation...';
        }
        const token = window.authSession?.getToken() || '';
        const pdfResponse = await fetch(`/.netlify/functions/student-invoice-pdf?id=${encodeURIComponent(invoiceId)}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
        });
        const result = await pdfResponse.json().catch(() => ({ ok: false }));
        if (!pdfResponse.ok || !result.ok || !result.pdfBase64) {
            throw new Error(result.error || 'PDF_UNAVAILABLE');
        }

        const bytes = Uint8Array.from(atob(result.pdfBase64), (character) => character.charCodeAt(0));
        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = result.fileName || 'facture-auto-ecole-breteuil.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
        console.error('Erreur téléchargement facture PDF:', error);
        alert('La facture PDF ne peut pas être téléchargée pour le moment. Réessaie dans quelques instants.');
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalHtml;
        }
    }
}

window.downloadInvoicePDF = (invoiceId, button) => downloadStudentInvoicePdf(invoiceId, button);

// Fonction pour charger les factures de l'éléve
async function loadInvoices() {
    try {
        // Récupérer l'email depuis ae_user
        const aeUser = localStorage.getItem('ae_user') || sessionStorage.getItem('ae_user');
        if (!aeUser) {
            console.error('Utilisateur non connecté');
            return;
        }
        
        const userData = JSON.parse(aeUser);
        const userEmail = userData.email;
        
        if (!userEmail) {
            console.error('Email utilisateur non trouvé');
            return;
        }
        
        console.log('Chargement des factures pour:', userEmail);

        const token = window.authSession?.getToken() || '';
        const invoiceResponse = await fetch('/.netlify/functions/student-invoices', {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
        });
        const invoiceResult = await invoiceResponse.json().catch(() => ({ ok: false }));

        if (!invoiceResponse.ok || !invoiceResult.ok) {
            console.error('Erreur chargement factures:', invoiceResult.error || invoiceResponse.status);
            document.getElementById('invoicesList').innerHTML = `
                <div style="text-align:center; padding: 3rem 1rem; color: var(--text-light);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #ff6b6b;"></i>
                    <p style="margin-top: 1rem;">Impossible de charger tes factures pour le moment.</p>
                </div>
            `;
            return;
        }

        const invoices = Array.isArray(invoiceResult.invoices) ? invoiceResult.invoices : [];
        window.studentInvoicesById = Object.fromEntries(
            invoices.map((invoice) => [String(invoice.id), invoice])
        );

        if (!invoices || invoices.length === 0) {
            document.getElementById('invoicesList').innerHTML = `
                <div style="text-align:center; padding: 3rem 1rem; color: var(--text-light);">
                    <i class="fas fa-file-invoice" style="font-size: 3rem; color: var(--primary-color); opacity: 0.3;"></i>
                    <p style="margin-top: 1rem; font-size: 1.1rem;">Aucune facture disponible</p>
                    <p style="margin-top: 0.5rem; font-size: 0.9rem;">Tes factures apparaîtront ici après chaque achat.</p>
                </div>
            `;
            window.invoicesLoaded = true;
            return;
        }
        
        // Afficher les factures
        let invoicesHTML = '<div class="invoices-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; padding: 1rem 0;">';
        
        invoices.forEach(invoice => {
            const date = new Date(invoice.payment_date);
            const invoiceAmount = Number(invoice.amount || 0);
            const formattedDate = date.toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
            });
            
            let description = invoice.description;
            if (invoice.forfait) {
                description = `Forfait ${invoice.forfait}`;
            } else if (invoice.hours_purchased) {
                const unit = Number(invoice.lesson_unit_minutes || 0) === 45 || String(invoice.forfait || '').startsWith('tarif-')
                    ? 'cours de conduite'
                    : 'heure(s) de conduite';
                description = `${invoice.hours_purchased} ${unit}`;
            }

            const downloadControl = invoice.pdfBase64
                ? `<a class="download-invoice-pdf" href="data:application/pdf;base64,${invoice.pdfBase64}" download="${invoice.pdfFileName || 'facture-auto-ecole-breteuil.pdf'}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; text-decoration: none;" onmouseover="this.style.transform='scale(1.05)';" onmouseout="this.style.transform='scale(1)';"><i class="fas fa-download"></i> Télécharger</a>`
                : `<button onclick="downloadInvoicePDF('${invoice.id}', this)" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)';" onmouseout="this.style.transform='scale(1)';"><i class="fas fa-download"></i> Télécharger</button>`;
            
            invoicesHTML += `
                <div class="invoice-card" style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 4px 16px rgba(0,0,0,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <div style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.25rem;">Facture N°</div>
                            <div style="font-weight: 700; color: var(--primary-color); font-size: 1.1rem;">${invoice.invoice_number}</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #EC4899 0%, #FF6B9D 100%); color: white; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                            PAYÉ
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #f0f0f0;">
                        <div style="font-size: 0.9rem; color: var(--text-light); margin-bottom: 0.5rem;">
                            <i class="fas fa-calendar"></i> ${formattedDate}
                        </div>
                        <div style="font-size: 1rem; color: var(--text-dark); font-weight: 500;">
                            ${description}
                        </div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 0.85rem; color: var(--text-light);">Montant</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-dark);">${invoiceAmount.toFixed(2)} €</div>
                        </div>
                        ${downloadControl}
                    </div>
                </div>
            `;
        });
        
        invoicesHTML += '</div>';
        document.getElementById('invoicesList').innerHTML = invoicesHTML;
        window.invoicesLoaded = true;
        
        console.log(`${invoices.length} facture(s) chargée(s)`);
        
    } catch (error) {
        console.error('? Erreur:', error);
        document.getElementById('invoicesList').innerHTML = `
            <div style="text-align:center; padding: 3rem 1rem; color: var(--text-light);">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #ff6b6b;"></i>
                <p style="margin-top: 1rem;">Une erreur est survenue</p>
            </div>
        `;
    }
}

// ============================================
// OPEN AVAILABILITY MODAL (bouton "Mes disponibilités")
// ============================================

window.openAvailabilityModal = async function() {
    // Supprimer toute notification existante
    const existingNotif = document.getElementById('bookingNotification');
    if (existingNotif) {
        existingNotif.remove();
    }
    
    const userEmail = dashboardState.user?.email;
    
    // Charger les disponibilités existantes
    let existingAvailability = null;
    if (userEmail) {
        try {
            existingAvailability = await requestStudentAvailability('GET');
        } catch (e) {
            console.error('Erreur chargement dispo:', e);
        }
    }
    
    // Créer la popup de disponibilités
    const notificationHTML = `
        <div id="bookingNotification" class="booking-notification">
            <div class="notification-content">
                <div style="position: relative;">
                    <button onclick="closeBookingNotification()" style="position: absolute; top: -0.5rem; right: -0.5rem; width: 28px; height: 28px; border-radius: 50%; border: none; background: #ff3b30; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; z-index: 10;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;"><i class="fas fa-calendar-check"></i> Mes disponibilités</h3>
                <p style="color: #6c757d; margin-bottom: 1rem; font-size: 0.85rem;">
                    ${existingAvailability ? 'Voici tes disponibilités actuelles. Tu peux les modifier ci-dessous.' : 'Indique-nous quand tu es disponible pour qu\'on puisse te proposer des créneaux en cas de désistement.'}
                </p>
                ${existingAvailability ? `
                    <div id="currentAvailabilityDisplay" style="background: #e8f5e9; padding: 1rem; border-radius: 12px; margin-bottom: 1rem; border-left: 4px solid #34c759;">
                        <h4 style="margin: 0 0 0.75rem 0; font-size: 0.95rem; color: #2e7d32; font-weight: 700;">
                            <i class="fas fa-check-circle"></i> Tes disponibilités enregistrées
                        </h4>
                        <div id="availabilitySummary" style="font-size: 0.85rem; color: #2e7d32;"></div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="showAvailabilityEditForm()" style="flex: 1; padding: 0.75rem; border: none; border-radius: 12px; background: #0071e3; color: white; font-weight: 700; cursor: pointer;">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                        <button onclick="deleteMyAvailability()" style="flex: 1; padding: 0.75rem; border: none; border-radius: 12px; background: #ff3b30; color: white; font-weight: 700; cursor: pointer;">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', notificationHTML);
    
    // Afficher la popup avec animation
    setTimeout(() => {
        const notification = document.getElementById('bookingNotification');
        if (notification) {
            notification.classList.add('show');
            
            if (existingAvailability) {
                // Afficher le résumé des disponibilités
                displayAvailabilitySummary(existingAvailability);
            } else {
                // Pas de dispo, afficher directement le formulaire
                handleCancellationInterest(true);
            }
        }
    }, 100);
};

// Afficher le résumé des disponibilités
function displayAvailabilitySummary(availability) {
    const summaryDiv = document.getElementById('availabilitySummary');
    if (!summaryDiv) return;
    
    console.log('?? DEBUG - Disponibilités brutes:', availability);
    
    const weeks = availability.availability_weeks || [];
    const slots = typeof availability.availability_slots === 'string' 
        ? JSON.parse(availability.availability_slots) 
        : availability.availability_slots;
    
    console.log('?? Semaines:', weeks);
    console.log('?? Créneaux parsés:', slots);
    console.log('?? Clés des créneaux:', Object.keys(slots));
    
    const daysMap = { lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi', jeudi: 'Jeudi', vendredi: 'Vendredi', samedi: 'Samedi' };
    
    // Fonction pour calculer les dates d'une semaine
    const getWeekDates = (weekKey) => {
        if (weekKey === 'toutes') return 'Toutes les semaines';
        
        const weekNum = parseInt(weekKey.replace('semaine', ''));
        const today = new Date();
        const currentDay = today.getDay();
        const diff = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diff + ((weekNum - 1) * 7));
        
        const saturday = new Date(monday);
        saturday.setDate(monday.getDate() + 5);
        
        const startStr = monday.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        const endStr = saturday.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        
        return `${startStr} ? ${endStr}`;
    };
    
    let html = '<div style="margin-bottom: 0.75rem;"><strong><i class="fas fa-calendar-week"></i> Semaines :</strong> ';
    if (weeks.includes('toutes')) {
        html += 'Toutes les semaines';
    } else {
        html += weeks.map(w => getWeekDates(w)).join(', ');
    }
    html += '</div>';
    
    html += '<div style="margin-bottom: 0.5rem;"><strong><i class="fas fa-clock"></i> Créneaux :</strong></div>';
    
    // Trier les jours dans l'ordre de la semaine
    const daysOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const sortedDays = Object.keys(slots).sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b));
    
    console.log('?? Jours triés:', sortedDays);
    
    sortedDays.forEach(day => {
        console.log(`   Jour ${day}:`, slots[day]);
        if (slots[day] && slots[day].length > 0) {
            const daySlots = slots[day].map(s => getAvailabilitySlotLabel(s)).join(', ');
            html += `<div style="margin-left: 1rem; margin-top: 0.25rem;">- <strong>${daysMap[day] || day}</strong> : ${daySlots}</div>`;
        }
    });
    
    summaryDiv.innerHTML = html;
}

// Afficher le formulaire d'édition
window.showAvailabilityEditForm = async function() {
    const userEmail = dashboardState.user?.email;
    
    // Charger les disponibilités existantes
    let existingAvailability = null;
    if (userEmail) {
        try {
            existingAvailability = await requestStudentAvailability('GET');
        } catch (e) {
            console.error('Erreur chargement dispo:', e);
        }
    }
    
    // Afficher le formulaire
    handleCancellationInterest(true);
    
    // Attendre que le formulaire soit généré
    setTimeout(() => {
        if (existingAvailability) {
            console.log('?? Pré-remplissage du formulaire avec:', existingAvailability);
            
            // Pré-cocher les semaines
            const weeks = existingAvailability.availability_weeks || [];
            weeks.forEach(week => {
                const weekCheckbox = document.querySelector(`.week-checkbox-popup[value="${week}"]`);
                if (weekCheckbox) {
                    weekCheckbox.checked = true;
                }
            });
            
            // Pré-cocher les jours et créneaux
            const slots = typeof existingAvailability.availability_slots === 'string' 
                ? JSON.parse(existingAvailability.availability_slots) 
                : existingAvailability.availability_slots;
            
            Object.keys(slots).forEach(day => {
                // Cocher le jour
                const dayCheckbox = document.querySelector(`.day-checkbox-popup[data-day="${day}"]`);
                if (dayCheckbox) {
                    dayCheckbox.checked = true;
                    // Afficher les créneaux
                    const timeSlots = document.querySelector(`.time-slots-popup[data-day="${day}"]`);
                    if (timeSlots) {
                        timeSlots.style.display = 'block';
                    }
                }
                
                // Cocher les créneaux horaires
                slots[day].forEach(timeSlot => {
                    const timeCheckbox = document.querySelector(`.time-slots-popup[data-day="${day}"] input[value="${timeSlot}"]`);
                    if (timeCheckbox) {
                        timeCheckbox.checked = true;
                    }
                });
            });
            
            console.log('? Formulaire pré-rempli avec les disponibilités existantes');
        }
    }, 300);
};

// Supprimer les disponibilités
window.deleteMyAvailability = async function() {
    if (!confirm('Es-tu sûr(e) de vouloir supprimer toutes tes disponibilités ?\n\nTu ne recevras plus de notifications pour les créneaux de désistement.')) {
        return;
    }
    
    const userEmail = dashboardState.user?.email;
    if (!userEmail) {
        alert('Erreur: utilisateur non connecté');
        return;
    }
    
    try {
        await requestStudentAvailability('DELETE');
        
        alert('Tes disponibilités ont été supprimées avec succès !');
        closeBookingNotification();
        
    } catch (err) {
        console.error('Erreur:', err);
        alert('? Erreur lors de la suppression');
    }
};

// Initialisation au chargement de la page
async function initEspaceEleve() {
    // Charger les moniteurs visibles depuis Supabase
    await loadVisibleInstructors();
    
    // Masquer Daho é partir du 1er mai 2026
    const today = new Date();
    const mayFirst2026 = new Date('2026-05-01T00:00:00');
    const myleneCard = document.getElementById('myleneCard');
    
    if (myleneCard && today >= mayFirst2026) {
        myleneCard.style.display = 'none';
        console.log('?? Daho masquée - indisponible é partir du 1er mai 2026');
    }
    
    initStudentDashboard();
    initAvailabilityConfig();
    startAutoRefresh();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEspaceEleve);
} else {
    initEspaceEleve();
}

