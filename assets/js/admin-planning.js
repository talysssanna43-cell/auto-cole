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
    return `${s} → ${e}`;
}

function normalizeInstructor(value) {
    if (value === 'Sammy') return 'Sammy';
    if (value === 'Nail') return 'Nail';
    return 'Mylène';
}

function buildSlotId(dateStr, startTime) {
    return `${dateStr}|${startTime}`;
}

// Variable d'état globale pour le planning
let state = {
    weekStart: startOfWeek(new Date()),
    instructor: 'Nail' // Nail par défaut à partir du 1er mai 2026
};

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

function setFeedback(el, text, type) {
    if (!el) return;
    el.textContent = text || '';
    el.className = `feedback${type ? ` ${type}` : ''}`;
}

function requireAdmin() {
    const raw = localStorage.getItem('ae_user');
    if (!raw) return { ok: false, error: new Error('NOT_AUTHENTICATED') };
    try {
        const user = JSON.parse(raw);
        if (!user.is_admin) return { ok: false, error: new Error('NOT_AUTHORIZED') };
        return { ok: true, email: user.email };
    } catch (e) {
        return { ok: false, error: new Error('NOT_AUTHENTICATED') };
    }
}

function logout() {
    localStorage.removeItem('ae_user');
    window.location.href = 'connexion.html';
}

async function fetchBookedSlots(instructor, weekStart, weekEnd) {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    end.setHours(23, 59, 59, 999);

    console.log('🔍 Fetching booked slots for:', instructor, 'from', start.toISOString(), 'to', end.toISOString());

    const { data, error } = await window.supabaseClient
        .from('slots')
        .select('id, start_at, end_at, status, instructor, notes, reservations(first_name,last_name,phone,email)')
        .eq('instructor', instructor)
        .gte('start_at', start.toISOString())
        .lte('start_at', end.toISOString())
        .order('start_at', { ascending: true });

    if (error) throw error;
    
    console.log('📊 Slots récupérés:', data?.length || 0);
    data?.forEach((slot, i) => {
        console.log(`Slot ${i+1}:`, slot.id, slot.start_at, 'Reservations:', slot.reservations);
    });
    
    // Toujours chercher les réservations manuellement pour éviter les problèmes de relation
    console.log('🔍 Recherche manuelle des réservations pour tous les slots...');
    const slotIds = (data || []).map(s => s.id);
    
    if (slotIds.length > 0) {
        const { data: manualReservations, error: resError } = await window.supabaseClient
            .from('reservations')
            .select('slot_id, first_name, last_name, phone, email')
            .in('slot_id', slotIds);
        
        if (resError) {
            console.error('❌ Erreur récupération réservations:', resError);
        } else {
            console.log('📋 Réservations trouvées manuellement:', manualReservations?.length || 0);
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
                        console.log('✅ Réservation associée au slot', slot.id, ':', reservation.first_name, reservation.last_name);
                    } else if (slot.status === 'booked') {
                        console.warn('⚠️ Slot orphelin détecté (marqué "booked" sans réservation):', slot.id);
                        orphanSlots.push(slot.id);
                        // Corriger localement le statut pour l'affichage
                        slot.status = 'available';
                    }
                });
            } else {
                // Aucune réservation trouvée, tous les slots 'booked' sont orphelins
                data.forEach(slot => {
                    if (slot.status === 'booked') {
                        console.warn('⚠️ Slot orphelin détecté (marqué "booked" sans réservation):', slot.id);
                        orphanSlots.push(slot.id);
                        slot.status = 'available';
                    }
                });
            }
            
            // Auto-correction en base de données des slots orphelins
            if (orphanSlots.length > 0) {
                console.log('🔧 Auto-correction de', orphanSlots.length, 'slot(s) orphelin(s)...');
                const { error: updateError } = await window.supabaseClient
                    .from('slots')
                    .update({ status: 'available' })
                    .in('id', orphanSlots);
                
                if (updateError) {
                    console.error('❌ Erreur lors de la correction des slots orphelins:', updateError);
                } else {
                    console.log('✅ Slots orphelins corrigés automatiquement');
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
    
    if (emails.length > 0) {
        const { data: inscriptions } = await window.supabaseClient
            .from('inscription_notifications')
            .select('user_email, pack, transmission_type, created_at')
            .in('user_email', [...new Set(emails)])
            .order('created_at', { ascending: false });
        
        // Prendre la plus récente inscription pour chaque email
        (inscriptions || []).forEach(ins => {
            if (!packMap.has(ins.user_email)) {
                packMap.set(ins.user_email, ins.pack);
                transmissionMap.set(ins.user_email, ins.transmission_type);
            }
        });
        
        // Récupérer forfait et heures depuis users
        const { data: users } = await window.supabaseClient
            .from('users')
            .select('email, forfait, hours_goal')
            .in('email', [...new Set(emails)]);
        
        (users || []).forEach(user => {
            forfaitMap.set(user.email, user.forfait);
            hoursGoalMap.set(user.email, user.hours_goal);
        });
        
        // Calculer les heures effectuées en comptant les réservations passées
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
                hoursCountMap.set(res.email, (hoursCountMap.get(res.email) || 0) + hours);
            }
        });
        
        hoursCountMap.forEach((hours, email) => {
            hoursCompletedMap.set(email, hours);
        });
    }

    const bookedMap = new Map();
    (data || []).forEach((row) => {
        // Inclure les slots réservés, permis, indisponible OU ceux qui ont des réservations
        const hasReservation = Array.isArray(row.reservations) ? row.reservations.length > 0 : !!row.reservations;
        const isPermis = row.status === 'permis';
        const isIndisponible = row.status === 'indisponible';
        
        // Debug: log pour voir les créneaux permis
        if (row.status === 'permis' || (row.notes && row.notes.includes('PERMIS'))) {
            console.log('🟡 Créneau PERMIS détecté:', {
                id: row.id,
                start_at: row.start_at,
                status: row.status,
                notes: row.notes,
                isPermis: isPermis
            });
        }
        
        if (row.status !== 'booked' && !hasReservation && !isPermis && !isIndisponible) return;
        
        const d = new Date(row.start_at);
        const dateStr = toInputDate(d);
        const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        const id = buildSlotId(dateStr, timeStr);

        const res = Array.isArray(row.reservations) ? row.reservations[0] : row.reservations;
        const email = res?.email || '';
        const pack = packMap.get(email) || '';
        const transmissionType = transmissionMap.get(email) || null;
        
        // Log détaillé pour déboguer les réservations sans nom (sauf pour les créneaux permis et indisponibles)
        if (!isPermis && !isIndisponible && (!res?.first_name || !res?.last_name)) {
            console.warn('⚠️ Réservation sans nom pour le slot:', {
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
                first_name: res?.first_name || 'Réservé',
                last_name: res?.last_name || '(sans détails)',
                phone: res?.phone || '',
                email: email,
                pack: pack,
                transmission_type: transmissionType,
                forfait: forfaitMap.get(email) || '',
                hours_completed: hoursCompletedMap.get(email) || 0,
                hours_goal: hoursGoalMap.get(email) || 0
            }
        });
    });
    
    // Debug: afficher tous les créneaux permis et indisponibles dans la map
    console.log('📋 Créneaux dans bookedMap:', bookedMap.size);
    bookedMap.forEach((value, key) => {
        if (value.status === 'permis') {
            console.log(`  🟡 ${key} → PERMIS (${value.notes})`);
        }
        if (value.status === 'indisponible') {
            console.log(`  🔴 ${key} → INDISPONIBLE (${value.notes})`);
        }
    });

    return bookedMap;
}

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
    
    // Pour déterminer si un créneau est passé, on compare uniquement la date (pas l'heure)
    // Cela permet de placer des élèves sur tous les créneaux de la semaine affichée
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    // Track stats
    let totalSlots = 0, bookedCount = 0, doneCount = 0;

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
        const end = getEndForStart(instructor, start);
        const timeCell = `<div class="cal-time">${start.replace(':', 'h')}</div>`;

        const dayCells = days.map((d) => {
            const dateStr = toInputDate(d);
            const id = buildSlotId(dateStr, start);
            const booking = bookedSet instanceof Map ? bookedSet.get(id) : null;
            const isBooked = !!booking;
            const slotStart = new Date(`${dateStr}T${start}:00`).getTime();
            
            // Vérifier si c'est un créneau permis
            const isPermis = booking && booking.status === 'permis';
            let permisLocation = '';
            let permisCandidates = '';
            if (isPermis && booking.notes) {
                // Format: "PERMIS - Lieu | Candidats: Nom1, Nom2, Nom3"
                const parts = booking.notes.split('|');
                permisLocation = parts[0] ? parts[0].replace('PERMIS - ', '').trim() : '';
                if (parts[1]) {
                    permisCandidates = parts[1].replace('Candidats:', '').trim();
                }
            }
            
            // Vérifier si c'est un créneau indisponible
            const isIndisponible = booking && booking.status === 'indisponible';
            let indisponibleReason = '';
            if (isIndisponible && booking.notes) {
                indisponibleReason = booking.notes.replace('INDISPONIBLE - ', '').trim();
            }
            
            // Un créneau est passé seulement si la DATE est antérieure à aujourd'hui
            // Cela permet de placer des élèves sur tous les créneaux de la semaine affichée
            const slotDate = new Date(dateStr);
            slotDate.setHours(0, 0, 0, 0);
            const isPast = slotDate.getTime() < todayTimestamp;
            
            // Un créneau est "done" si réservé ET l'heure est passée
            const isDone = isBooked && !isPermis && !isIndisponible && (slotStart < now);

            totalSlots++;
            if (isDone) doneCount++;
            else if (isBooked && !isPermis && !isIndisponible) bookedCount++;

            const statusClass = isIndisponible ? 'indisponible' : isPermis ? 'permis' : isDone ? 'done' : isBooked ? 'booked' : 'available';
            const statusLabel = isIndisponible
                ? `INDISPONIBLE${indisponibleReason ? `<br><small style="font-size: 0.75rem; opacity: 0.9;">${indisponibleReason}</small>` : ''}`
                : isPermis 
                ? `PERMIS - ${permisLocation}${permisCandidates ? `<br><small style="font-size: 0.75rem; opacity: 0.9;">${permisCandidates}</small>` : ''}` 
                : isDone ? 'Réalisé' : isBooked ? 'Réservé' : 'Libre';
            const todayCol = isToday(d) ? ' today-col' : '';

            const studentName = isBooked && !isPermis && !isIndisponible
                ? `${(booking.student?.first_name || '').trim()} ${(booking.student?.last_name || '').trim()}`.trim()
                : '';
            const studentPhone = isBooked && !isPermis && !isIndisponible ? (booking.student?.phone || '') : '';

            const icon = isIndisponible ? 'fa-ban' : isPermis ? 'fa-id-card' : isDone ? 'fa-check' : isBooked ? 'fa-user' : 'fa-minus';
            
            // Déterminer le type de véhicule depuis transmission_type
            const transmissionType = isBooked ? (booking?.student?.transmission_type || null) : null;
            let vehicleType = '';
            let transmissionClass = '';
            
            if (transmissionType === 'auto') {
                vehicleType = 'BA';
                transmissionClass = 'transmission-auto';
            } else if (transmissionType === 'manual') {
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
                slotStart: start,
                slotEnd: end,
                instructor: instructor,
                slotId: id,
                slotUuid: booking.slot_uuid || null
            }).replace(/"/g, '&quot;') : '';

            // Pour les créneaux disponibles, ajouter un bouton '+' pour placer un élève
            const slotData = JSON.stringify({
                dateStr: dateStr,
                start: start,
                end: end,
                instructor: instructor
            }).replace(/"/g, '&quot;');
            
            return `
                <div class="cal-cell${todayCol}">
                    <div class="ev ${statusClass} ${transmissionClass}" ${isPermis || isIndisponible ? '' : isBooked ? `onclick="showStudent(${studentData})" style="cursor:pointer;"` : !isPast ? `onclick="openStudentSearchModal(${slotData})" style="cursor:pointer;"` : ''}>
                        ${!isBooked && !isPast && !isPermis && !isIndisponible ? `<button class="add-student-btn" onclick="event.stopPropagation(); openStudentSearchModal(${slotData});" title="Placer un élève"><i class="fas fa-plus"></i></button>` : ''}
                        <span class="ev-icon"><i class="fas ${icon}"></i></span>
                        <div class="ev-status">${statusLabel}</div>
                        <div class="ev-time">${start} – ${end}</div>
                        ${isBooked && !isPermis && !isIndisponible ? `<div class="ev-name">${studentName || 'Élève'}${vehicleType ? ` <span class="vehicle-badge">[${vehicleType}]</span>` : ''}</div>` : ''}
                        ${isBooked && !isPermis && !isIndisponible && studentPhone ? `<div class="ev-phone"><i class="fas fa-phone" style="font-size:0.55rem;margin-right:3px;"></i>${studentPhone}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

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

    // Update instructor name in header
    const instrName = document.getElementById('instructorName');
    if (instrName) instrName.textContent = instructor;
}

// Fonction pour sauvegarder l'état (globale pour être accessible partout)
function saveState() {
    localStorage.setItem('admin_planning_state', JSON.stringify({
        weekStart: state.weekStart.toISOString(),
        instructor: state.instructor
    }));
}

(function init() {
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

    // Segment control for instructor selection
    segmentBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            segmentBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.instructor = normalizeInstructor(btn.dataset.instructor);
            saveState();
            await refresh();
        });
    });

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

    refresh();
})();

// ══════════════════════════════════════════════════════════════════════════════
// GESTION DES DEMANDES D'ANNULATION
// ══════════════════════════════════════════════════════════════════════════════

let cancellationRequests = [];

async function loadCancellationRequests() {
    try {
        const { data, error } = await window.supabaseClient
            .from('cancellation_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading cancellation requests:', error);
            return;
        }

        cancellationRequests = data || [];
        updateCancellationUI();
    } catch (err) {
        console.error('Exception loading cancellation requests:', err);
    }
}

function updateCancellationUI() {
    const pill = document.getElementById('cancellationPill');
    const statEl = document.getElementById('statCancellations');
    const listEl = document.getElementById('cancellationList');

    const count = cancellationRequests.length;

    if (pill) {
        pill.style.display = count > 0 ? 'flex' : 'none';
    }
    if (statEl) {
        statEl.textContent = count;
    }

    if (listEl) {
        if (count === 0) {
            listEl.innerHTML = '<p class="empty-message">Aucune demande d\'annulation en attente.</p>';
        } else {
            listEl.innerHTML = cancellationRequests.map(req => {
                const createdAt = new Date(req.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                
                const slotDate = req.slot_date ? new Date(req.slot_date).toLocaleDateString('fr-FR', {
                    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                }) : 'Date inconnue';
                
                const slotTime = req.slot_time || 'Heure inconnue';
                const instructor = req.instructor || 'Moniteur inconnu';
                
                const justificationLink = req.justification_file 
                    ? `<a href="${req.justification_file}" target="_blank" class="justification-link" download="${req.justification_filename || 'justificatif'}">
                        <i class="fas fa-paperclip"></i> Voir le justificatif (${req.justification_filename || 'fichier'})
                       </a>`
                    : '<span style="font-size:0.8rem;color:var(--text2);"><i class="fas fa-exclamation-triangle"></i> Aucun justificatif fourni</span>';

                return `
                    <div class="cancellation-card" data-request-id="${req.id}">
                        <div class="card-header">
                            <div class="student-info">
                                <h4>${req.user_name || 'Élève inconnu'}</h4>
                                <p><i class="fas fa-envelope"></i> ${req.user_email || '-'}</p>
                                <p style="margin-top:4px;"><i class="fas fa-clock"></i> Demande du ${createdAt}</p>
                            </div>
                            <div style="text-align:right;">
                                <div class="slot-badge" style="margin-bottom:6px;">
                                    <i class="fas fa-calendar"></i> ${slotDate}
                                </div>
                                <div style="font-size:0.85rem;font-weight:600;color:var(--orange);">
                                    <i class="fas fa-clock"></i> ${slotTime} • ${instructor}
                                </div>
                            </div>
                        </div>
                        <div class="reason-section">
                            <label>Motif de l'annulation</label>
                            <p>${req.reason || 'Aucun motif fourni'}</p>
                        </div>
                        ${justificationLink}
                        <div class="card-actions">
                            <button class="btn-accept" onclick="handleCancellationDecision('${req.id}', 'accepted')">
                                <i class="fas fa-check"></i> Accepter
                            </button>
                            <button class="btn-refuse" onclick="handleCancellationDecision('${req.id}', 'refused')">
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
    const confirmMsg = decision === 'accepted'
        ? 'Accepter cette demande d\'annulation ?\n\nLe créneau redeviendra disponible pour les autres élèves.'
        : 'Refuser cette demande d\'annulation ?\n\nL\'heure restera comptée dans le forfait de l\'élève.';

    if (!confirm(confirmMsg)) return;

    try {
        // 1. Mettre à jour le statut de la demande
        const { error: updateError } = await window.supabaseClient
            .from('cancellation_requests')
            .update({ status: decision, updated_at: new Date().toISOString() })
            .eq('id', requestId);

        if (updateError) {
            console.error('Error updating cancellation request:', updateError);
            alert('Erreur lors de la mise à jour de la demande.');
            return;
        }

        // 2. Mettre à jour le statut de la réservation
        const request = cancellationRequests.find(r => r.id === requestId);
        if (request && request.reservation_id) {
            if (decision === 'accepted') {
                // Accepté : libérer le créneau
                const { data: resData } = await window.supabaseClient
                    .from('reservations')
                    .select('slot_id')
                    .eq('id', request.reservation_id)
                    .maybeSingle();

                if (resData?.slot_id) {
                    // Supprimer la réservation
                    await window.supabaseClient
                        .from('reservations')
                        .delete()
                        .eq('id', request.reservation_id);

                    // Remettre le slot en disponible
                    await window.supabaseClient
                        .from('slots')
                        .update({ status: 'available' })
                        .eq('id', resData.slot_id);

                    console.log('Créneau libéré avec succès');
                    
                    // Afficher les élèves disponibles pour ce créneau
                    await showAvailableStudentsForSlot(resData.slot_id);
                }
            } else {
                // Refusé : marquer la réservation comme annulée avec pénalité
                await window.supabaseClient
                    .from('reservations')
                    .update({ 
                        status: 'cancelled_refused',
                        notes: 'Demande d\'annulation refusée par l\'admin'
                    })
                    .eq('id', request.reservation_id);
                
                console.log('Réservation marquée comme refusée');
            }
        }

        // 3. Recharger les demandes et le planning
        await loadCancellationRequests();
        
        alert(decision === 'accepted' 
            ? 'Demande acceptée. Le créneau est maintenant disponible.' 
            : 'Demande refusée. L\'heure reste comptée.');
        
        // Rafraîchir la page pour voir les changements
        window.location.reload();

    } catch (err) {
        console.error('Error handling cancellation decision:', err);
        alert('Erreur lors du traitement de la demande.');
    }
};

// Charger les demandes d'annulation au démarrage
setTimeout(() => {
    loadCancellationRequests();
    loadInscriptionNotifications();
}, 1000);

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT SEARCH FUNCTIONALITY
// ══════════════════════════════════════════════════════════════════════════════

window.searchStudent = async function() {
    const searchInput = document.getElementById('studentSearchInput');
    const searchTerm = searchInput?.value.trim().toLowerCase();
    
    if (!searchTerm) {
        alert('Veuillez entrer un nom ou prénom à rechercher.');
        return;
    }
    
    try {
        // Rechercher dans la table users (nom, prénom, email, téléphone)
        const { data: users, error: userError } = await window.supabaseClient
            .from('users')
            .select('*')
            .or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telephone.ilike.%${searchTerm}%`);
        
        if (userError) {
            console.error('Error searching users:', userError);
            alert('Erreur lors de la recherche.');
            return;
        }
        
        if (!users || users.length === 0) {
            alert('Aucun élève trouvé avec ce nom ou prénom.');
            return;
        }
        
        // Si plusieurs résultats, prendre le premier
        const student = users[0];
        await displayStudentDetails(student);
        
    } catch (err) {
        console.error('Search error:', err);
        alert('Erreur lors de la recherche.');
    }
};

window.displayStudentDetails = async function(student) {
    try {
        // Récupérer toutes les réservations de l'élève
        const { data: reservations, error: resError } = await window.supabaseClient
            .from('reservations')
            .select('*, slots(*)')
            .eq('email', student.email)
            .order('created_at', { ascending: false });
        
        if (resError) {
            console.error('Error fetching reservations:', resError);
        }
        
        // Récupérer les demandes d'annulation
        const { data: cancellations, error: cancelError } = await window.supabaseClient
            .from('cancellation_requests')
            .select('*')
            .eq('user_email', student.email);
        
        if (cancelError) {
            console.error('Error fetching cancellations:', cancelError);
        }
        
        // Calculer les statistiques
        const now = new Date();
        
        // Compter les heures effectuées : status 'completed' ou 'done' OU séances passées avec status 'upcoming'
        const completedSessions = (reservations || []).filter(r => {
            const slotDate = r.slots?.start_at ? new Date(r.slots.start_at) : null;
            const isPast = slotDate && slotDate < now;
            return r.status === 'completed' || r.status === 'done' || (isPast && r.status === 'upcoming');
        });
        const totalHours = completedSessions.length * 2;
        
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
                        <span>${student.date_naissance ? new Date(student.date_naissance).toLocaleDateString('fr-FR') : '-'}</span>
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
                        <label>Heures effectuées</label>
                        <span style="color: var(--green); font-weight: 700;">${totalHours}h</span>
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
                                let statusLabel = 'À venir';
                                
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
                    <button onclick="openChangeForfaitModal('${student.email}', '${student.prenom}', '${student.nom}', '${student.forfait || ''}', ${totalHours})" 
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
                    <button onclick="openAdminExamResultModal('${student.email}', '${student.prenom} ${student.nom}')" 
                        style="background: linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        <i class="fas fa-trophy"></i> Saisir résultat examen
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
        const { data: users, error } = await window.supabaseClient
            .from('users')
            .select('*')
            .or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telephone.ilike.%${searchTerm}%`)
            .limit(5);
        
        if (error) {
            console.error('Error fetching suggestions:', error);
            return;
        }
        
        if (!users || users.length === 0) {
            suggestionsContainer.classList.remove('active');
            return;
        }
        
        // Si un seul résultat, ouvrir directement la fiche
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
                        <div class="suggestion-name">${user.prenom || ''} ${user.nom || ''}</div>
                        <div class="suggestion-email">${user.email || ''}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add mousedown event listeners to each suggestion (mousedown se déclenche avant blur)
        const suggestionItems = suggestionsContainer.querySelectorAll('.suggestion-item');
        suggestionItems.forEach((item, index) => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Empêcher le blur de l'input
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
                }, 300);
            } else {
                hideSuggestions();
            }
        });
    }
});

// ══════════════════════════════════════════════════════════════════════════════
// INSCRIPTION NOTIFICATIONS FUNCTIONALITY
// ══════════════════════════════════════════════════════════════════════════════

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

window.viewInscriptionDocuments = async function(userEmail) {
    try {
        // D'abord essayer de récupérer depuis inscription_notifications (pour les inscriptions en attente)
        const { data: notification, error: notifError } = await window.supabaseClient
            .from('inscription_notifications')
            .select('*')
            .eq('user_email', userEmail)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        console.log('🔍 Notification récupérée:', notification);
        console.log('📄 Documents dans notification:', notification?.documents);
        console.log('📊 Type de documents:', typeof notification?.documents);
        console.log('📦 Documents_count:', notification?.documents_count);
        
        let documents = {};
        let source = '';
        
        if (notification && notification.documents) {
            console.log('✅ Documents trouvés dans inscription_notifications');
            source = 'notification';
            
            // Handle different document formats
            if (typeof notification.documents === 'string') {
                try {
                    documents = JSON.parse(notification.documents);
                } catch (e) {
                    console.error('Error parsing documents JSON:', e);
                }
            } else if (typeof notification.documents === 'object') {
                documents = notification.documents;
            }
        } else {
            // Si pas trouvé dans notifications, chercher dans users (compte validé)
            const { data: user, error: userError } = await window.supabaseClient
                .from('users')
                .select('*')
                .eq('email', userEmail)
                .maybeSingle();
            
            if (userError) {
                console.error('Error fetching user:', userError);
                alert('Erreur lors du chargement des documents.');
                return;
            }
            
            if (!user) {
                console.log('Aucun document trouvé pour cet utilisateur');
                // Si la notification existe avec documents_count > 0 mais pas de champ documents
                if (notification && notification.documents_count > 0) {
                    alert(`⚠️ Documents non accessibles\n\nCette inscription a ${notification.documents_count} document(s) déclaré(s), mais ils n'ont pas été enregistrés dans la base de données (bug corrigé).\n\n📧 Solution : Demande à l'élève de renvoyer ses documents par email à l'auto-école.\n\n✅ Les futures inscriptions auront leurs documents accessibles directement ici.`);
                } else {
                    alert('⚠️ Aucun document trouvé.\n\nCette inscription ne contient pas de documents ou ils n\'ont pas été uploadés.');
                }
                return;
            }
            
            console.log('Documents trouvés dans users');
            source = 'user';
            
            // Handle different document formats
            if (user.documents) {
                if (typeof user.documents === 'string') {
                    try {
                        documents = JSON.parse(user.documents);
                    } catch (e) {
                        console.error('Error parsing documents JSON:', e);
                    }
                } else if (typeof user.documents === 'object') {
                    documents = user.documents;
                }
            }
        }
        
        console.log('Parsed documents:', documents);
        console.log('Number of documents:', Object.keys(documents).length);
        
        const modalBody = document.getElementById('inscriptionDocumentsBody');
        
        if (!modalBody) return;
        
        // Utiliser les données de la notification ou du user selon la source
        const userData = source === 'notification' ? {
            prenom: notification.user_prenom,
            nom: notification.user_nom,
            email: notification.user_email,
            telephone: notification.user_telephone,
            forfait: notification.pack
        } : user;
        
        const documentLabels = {
            pieceIdentite: 'Pièce d\'identité',
            assr: 'ASSR',
            jdc: 'Journée Défense et Citoyenneté',
            justifDomicile: 'Justificatif de domicile',
            ephoto: 'E-photo',
            certifHebergement: 'Certificat d\'hébergement',
            pieceHebergeur: 'Pièce d\'identité hébergeur',
            codeStudentCardFile: 'Carte étudiant / Certificat de scolarité'
        };
        
        modalBody.innerHTML = `
            <div style="margin-bottom: 1.5rem;">
                <h3 style="margin-bottom: 0.5rem;">${userData.prenom} ${userData.nom}</h3>
                <p style="color: var(--text2); margin: 0;">
                    <i class="fas fa-envelope"></i> ${userData.email}<br>
                    <i class="fas fa-phone"></i> ${userData.telephone || '-'}<br>
                    <i class="fas fa-box"></i> Pack: <strong>${userData.forfait || '-'}</strong>
                </p>
            </div>
            
            ${notification && notification.notes_admin ? `
                <div style="background: #fff9e6; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; border-left: 4px solid #ffc107;">
                    <h4 style="margin-bottom: 0.75rem; color: #856404;">
                        <i class="fas fa-comment-dots"></i> Commentaire de l'élève
                    </h4>
                    <p style="margin: 0; color: #856404; white-space: pre-wrap;">${notification.notes_admin}</p>
                </div>
            ` : ''}
            
            <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 12px;">
                <h4 style="margin-bottom: 1rem;"><i class="fas fa-file-alt"></i> Documents fournis</h4>
                ${Object.keys(documents).length === 0 ? 
                    '<p style="color: var(--text2); font-style: italic;">Aucun document fourni.</p>' :
                    Object.entries(documents).map(([key, doc]) => `
                        <div style="background: white; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <strong>${documentLabels[key] || key}</strong><br>
                                <small style="color: var(--text2);">${doc.name}</small>
                            </div>
                            <a href="${doc.data}" download="${doc.name}" class="btn-primary" style="padding: 0.5rem 1rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-download"></i> Télécharger
                            </a>
                        </div>
                    `).join('')
                }
            </div>
        `;
        
        const modal = document.getElementById('inscriptionDocumentsModal');
        if (modal) {
            modal.classList.add('active');
        }
        
    } catch (err) {
        console.error('Error viewing documents:', err);
        alert('Erreur lors de l\'affichage des documents.');
    }
};

window.closeInscriptionDocuments = function() {
    const modal = document.getElementById('inscriptionDocumentsModal');
    if (modal) {
        modal.classList.remove('active');
    }
};

window.handleInscriptionDecision = async function(notificationId, decision) {
    let rejectionMessage = '';
    
    if (decision === 'rejected') {
        rejectionMessage = prompt('Veuillez indiquer la raison du refus (ce message sera envoyé par email à l\'utilisateur) :');
        
        if (rejectionMessage === null) return; // User cancelled
        
        if (!rejectionMessage.trim()) {
            alert('Vous devez fournir une raison pour le refus.');
            return;
        }
    } else {
        const confirmMsg = 'Êtes-vous sûr de vouloir valider cette inscription ?';
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
        
        // Si l'inscription est approuvée, créer le compte utilisateur
        if (decision === 'approved') {
            console.log('✅ Inscription approuvée - Création du compte utilisateur...');
            
            try {
                // Hasher le mot de passe
                const passwordHash = await window.hashPassword(notification.user_password);
                
                // Calculer hours_goal selon le pack
                let hoursGoal = 20; // Par défaut
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
                
                // Créer ou mettre à jour le compte utilisateur (upsert pour éviter les doublons)
                const { data: userData, error: userError } = await window.supabaseClient
                    .from('users')
                    .upsert({
                        prenom: notification.user_prenom,
                        nom: notification.user_nom,
                        email: notification.user_email,
                        password_hash: passwordHash,
                        telephone: notification.user_telephone,
                        date_nais: notification.user_date_naissance,
                        adresse: notification.user_adresse,
                        code_postal: notification.user_code_postal,
                        ville: notification.user_ville,
                        numero_neph: notification.numero_neph || null,
                        forfait: notification.pack || null,
                        hours_goal: hoursGoal,
                        hours_completed_initial: 0,
                        notes_admin: notification.notes_admin || null
                    }, { onConflict: 'email' });
                
                if (userError) {
                    console.error('❌ Erreur création compte utilisateur:', userError);
                    alert(`Erreur lors de la création du compte: ${userError.message}`);
                    return;
                }
                
                console.log('✅ Compte utilisateur créé avec succès');
            } catch (createError) {
                console.error('❌ Erreur lors de la création du compte:', createError);
                alert('Erreur lors de la création du compte utilisateur.');
                return;
            }
        }
        
        // Si l'inscription est approuvée, créditer l'heure de parrainage si applicable
        if (decision === 'approved' && notification.referral_code) {
            console.log('🎁 Inscription approuvée avec code de parrainage:', notification.referral_code);
            
            // Récupérer le parrainage correspondant
            const { data: referralData, error: referralError } = await window.supabaseClient
                .from('referrals')
                .select('id, referrer_email, reward_credited')
                .eq('referral_code', notification.referral_code)
                .eq('referee_email', notification.user_email)
                .maybeSingle();
            
            if (referralError) {
                console.error('❌ Erreur récupération parrainage:', referralError);
            } else if (referralData && !referralData.reward_credited) {
                console.log('💰 Crédit de l\'heure de parrainage au parrain:', referralData.referrer_email);
                
                // Créditer 1h au parrain
                const { data: creditResult, error: creditError } = await window.supabaseClient
                    .rpc('credit_referral_reward', { referral_id: referralData.id });
                
                if (creditError) {
                    console.error('❌ Erreur crédit parrainage:', creditError);
                } else {
                    console.log('✅ Heure de parrainage créditée avec succès !', creditResult);
                }
            } else if (referralData && referralData.reward_credited) {
                console.log('ℹ️ Récompense déjà créditée pour ce parrainage');
            } else {
                console.log('ℹ️ Aucun parrainage trouvé pour ce code');
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

async function sendInscriptionEmail(userEmail, userName, decision, rejectionMessage, userPassword = null) {
    try {
        // Toujours utiliser l'URL de production dans les emails
        // (même si l'admin valide depuis localhost)
        const siteUrl = 'https://autoecolebreteuil.com';
        
        const isApproved = decision === 'approved';
        const subject = isApproved 
            ? '✅ Votre inscription a été validée - Auto-École Breteuil'
            : '❌ Votre inscription a été refusée - Auto-École Breteuil';
        
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
                        <h1>🎉 Inscription Validée !</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour <strong>${userName}</strong>,</p>
                        <p>Nous avons le plaisir de vous informer que votre inscription à l'Auto-École Breteuil a été <strong>validée avec succès</strong> !</p>
                        
                        <div class="credentials-box">
                            <h3 style="margin-top: 0; color: #11998e;">🔑 Vos identifiants de connexion</h3>
                            <p><strong>Email :</strong> ${userEmail}</p>
                            <p><strong>Mot de passe :</strong> ${userPassword || '(voir email précédent)'}</p>
                            <p style="font-size: 0.9em; color: #666; margin-top: 15px;">⚠️ Conservez ces identifiants en lieu sûr. Vous en aurez besoin pour accéder à votre espace élève.</p>
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
                        <p>Bienvenue dans notre auto-école ! 🚗</p>
                    </div>
                    <div class="footer">
                        <p>Auto-École Breteuil<br>
                        1 Rue Édouard Delanglade, 13006 Marseille<br>
                        📞 04 91 53 36 98 | ✉️ breteuilautoecole@gmail.com</p>
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
                        <h1>Inscription Refusée</h1>
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
                        1 Rue Édouard Delanglade, 13006 Marseille<br>
                        📞 04 91 53 36 98 | ✉️ breteuilautoecole@gmail.com</p>
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
                service_id: 'service_abc123',
                template_id: 'template_h7oyhzg',
                user_id: '8ysJSNqiNmOHg_pxC',
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
                
                // Compter jusqu'à et incluant cette séance
                if (sessionStart <= slotDateTime) {
                    cumulativeHours += hours;
                    
                    // Si c'est exactement cette séance, on s'arrête
                    if (sessionStart.getTime() === slotDateTime.getTime()) {
                        break;
                    }
                }
            }
            
            hourEnd = Math.ceil(cumulativeHours);
            
            console.log(`📊 ${student.prenom} - Créneau ${student.slotDate} ${student.slotStart}: ${hourEnd}h cumulées`);
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
                <span class="info-value" style="color: #0071e3; font-weight: 600;">${dateStr} - ${student.slotStart} à ${student.slotEnd}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Moniteur</span>
                <span class="info-value">${student.instructor || '-'}</span>
            </div>
        `;
    }

    details.innerHTML = `
        ${slotInfo}
        <div class="info-row">
            <span class="info-label">Prénom</span>
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
            <span class="info-label" style="color: #0c5460; font-weight: 600;"><i class="fas fa-clock"></i> Heures de conduite</span>
            <span class="info-value" style="color: #0c5460; font-weight: 600;">
                ${hourEnd > 0 
                    ? `${hourEnd}h effectuées / ${student.hours_goal || 0}h objectif`
                    : `${student.hours_completed || 0}h effectuées / ${student.hours_goal || 0}h objectif`
                }
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
                    <strong style="color: #495057;">Disponibilités :</strong><br>
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
                    <h2 style="margin: 0 0 0.5rem 0; color: #1d1d1f;">Élèves disponibles</h2>
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
// PLACEMENT D'ÉLÈVE SUR LE PLANNING
// ============================================

// Ouvrir la modal de recherche d'élève pour un créneau spécifique
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
    
    // Ajouter le CSS si nécessaire
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
    
    // Stocker les infos du créneau pour utilisation ultérieure
    window.currentSlotInfo = slotInfo;
    
    // Ajouter l'événement de recherche
    const searchInput = document.getElementById('slotStudentSearch');
    if (searchInput) {
        let searchTimeout = null;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const searchTerm = e.target.value.trim().toLowerCase();
            
            searchTimeout = setTimeout(() => {
                showSlotSuggestions(searchTerm);
            }, 300);
        });
        
        // Focus automatique sur le champ de recherche
        setTimeout(() => searchInput.focus(), 100);
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
    const suggestionsContainer = document.getElementById('slotAutocompleteSuggestions');
    if (!suggestionsContainer) return;
    
    if (!searchTerm || searchTerm.length < 2) {
        suggestionsContainer.classList.remove('active');
        return;
    }
    
    try {
        const { data: users, error } = await window.supabaseClient
            .from('users')
            .select('*')
            .or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%`)
            .limit(5);
        
        if (error) {
            console.error('Error fetching suggestions:', error);
            return;
        }
        
        if (!users || users.length === 0) {
            suggestionsContainer.innerHTML = `
                <div style="padding: 16px; text-align: center; color: #666;">
                    <i class="fas fa-user-slash" style="font-size: 2rem; margin-bottom: 8px; opacity: 0.5;"></i>
                    <p style="margin: 0;">Aucun élève trouvé</p>
                    <p style="margin: 8px 0 0 0; font-size: 0.85rem;">Voulez-vous <a href="inscription.html?admin=true" style="color: #667eea; font-weight: 600;">inscrire un nouvel élève</a> ?</p>
                </div>
            `;
            suggestionsContainer.classList.add('active');
            return;
        }
        
        suggestionsContainer.innerHTML = users.map((user, index) => {
            const initials = `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase();
            return `
                <div class="slot-suggestion-item" data-user-index="${index}">
                    <div class="slot-suggestion-icon">${initials}</div>
                    <div class="slot-suggestion-info">
                        <div class="slot-suggestion-name">${user.prenom || ''} ${user.nom || ''}</div>
                        <div class="slot-suggestion-email">${user.email || ''}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Ajouter les événements de clic
        const suggestionItems = suggestionsContainer.querySelectorAll('.slot-suggestion-item');
        suggestionItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                selectStudentForSlot(users[index]);
            });
        });
        
        suggestionsContainer.classList.add('active');
        
    } catch (err) {
        console.error('Autocomplete error:', err);
    }
};

window.selectStudentForSlot = async function(student) {
    if (!window.currentSlotInfo) {
        alert('Erreur: Informations du créneau manquantes.');
        return;
    }
    
    const slotInfo = window.currentSlotInfo;
    
    // Fermer la modal de recherche
    closeStudentSearchModal();
    
    // Réserver le créneau pour cet élève
    await bookStudentOnSlot(student, slotInfo);
};

window.bookStudentOnSlot = async function(student, slotInfo) {
    try {
        // Vérifier les heures restantes de l'élève
        const hoursGoal = student.hours_goal || 0;
        const hoursCompleted = student.hours_completed_initial || 0;
        
        // Récupérer le nombre d'heures déjà réservées
        const { data: reservations, error: resError } = await window.supabaseClient
            .from('reservations')
            .select('*, slots(*)')
            .eq('email', student.email)
            .in('status', ['upcoming', 'pending']);
        
        if (resError) {
            console.error('Error fetching reservations:', resError);
        }
        
        const hoursReserved = (reservations || []).length * 2;
        const hoursRemaining = hoursGoal - hoursCompleted - hoursReserved;
        const hoursRemainingAfter = Math.max(0, hoursRemaining - 2);
        
        if (hoursRemaining < 2) {
            const shouldContinue = confirm(
                `⚠️ ATTENTION : ${student.prenom} ${student.nom} n'a plus d'heures disponibles dans son forfait.\n\n` +
                `📊 Heures totales : ${hoursGoal}h\n` +
                `✅ Heures effectuées : ${hoursCompleted}h\n` +
                `📅 Heures réservées : ${hoursReserved}h\n` +
                `⏰ Heures restantes : ${Math.max(0, hoursRemaining)}h\n\n` +
                `❗ Après cette réservation : ${hoursRemainingAfter}h (forfait épuisé)\n\n` +
                `Voulez-vous quand même placer cet élève sur ce créneau ?`
            );
            
            if (!shouldContinue) {
                return;
            }
        }
        
        // Confirmer la réservation
        const slotDate = new Date(slotInfo.dateStr);
        const confirmMsg = `Confirmer la réservation ?\n\n` +
            `Élève : ${student.prenom} ${student.nom}\n` +
            `Email : ${student.email}\n` +
            `Moniteur : ${slotInfo.instructor}\n` +
            `Date : ${slotDate.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}\n` +
            `Horaire : ${slotInfo.start} - ${slotInfo.end}\n\n` +
            `⏰ Heures restantes après cette réservation : ${hoursRemainingAfter}h / ${hoursGoal}h`;
        
        if (!confirm(confirmMsg)) {
            return;
        }
        
        // Construire les dates ISO pour Supabase
        const startAt = new Date(`${slotInfo.dateStr}T${slotInfo.start}:00`);
        const endAt = new Date(`${slotInfo.dateStr}T${slotInfo.end}:00`);
        
        // Normaliser le nom du moniteur
        const normalizedInstructor = normalizeInstructor(slotInfo.instructor);
        
        // Réserver le créneau via la fonction book_slot
        console.log('📅 Tentative de réservation:', {
            start: startAt.toISOString(),
            end: endAt.toISOString(),
            instructor: normalizedInstructor,
            instructorOriginal: slotInfo.instructor,
            student: `${student.prenom} ${student.nom}`,
            email: student.email
        });
        
        const { data: bookingResult, error: bookingError } = await window.supabaseClient
            .rpc('book_slot', {
                p_start_at: startAt.toISOString(),
                p_end_at: endAt.toISOString(),
                p_instructor: normalizedInstructor,
                p_email: student.email,
                p_first_name: student.prenom,
                p_last_name: student.nom,
                p_phone: student.telephone || ''
            });
        
        console.log('📊 Résultat de la réservation:', bookingResult, 'Erreur:', bookingError);
        
        if (bookingError) {
            console.error('❌ Error booking slot:', bookingError);
            return;
        }
        
        if (!bookingResult || !bookingResult.ok) {
            console.error('❌ Booking failed:', bookingResult);
            alert('Impossible de réserver ce créneau : ' + (bookingResult?.error || 'Erreur inconnue'));
            return;
        }
        
        console.log('✅ Réservation créée avec succès! Slot ID:', bookingResult.slot_id, 'Reservation ID:', bookingResult.reservation_id);
        
        // Mettre à jour l'état pour afficher la semaine et le moniteur du créneau ajouté
        state.instructor = normalizedInstructor;
        state.weekStart = startOfWeek(new Date(slotInfo.dateStr));
        saveState();
        
        // Rafraîchir le planning sans recharger la page
        await refresh();
        
    } catch (err) {
        console.error('Error booking student on slot:', err);
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
        
        // Créer le HTML pour la sélection de créneau
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
        
        // Ajouter le CSS si nécessaire
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
        
        // Récupérer le nombre d'heures déjà réservées
        const { data: reservations, error: resError } = await window.supabaseClient
            .from('reservations')
            .select('*, slots(*)')
            .eq('email', studentEmail)
            .in('status', ['upcoming', 'pending']);
        
        if (resError) {
            console.error('Error fetching reservations:', resError);
        }
        
        const hoursReserved = (reservations || []).length * 2; // Chaque créneau = 2h
        const hoursRemaining = hoursGoal - hoursCompleted - hoursReserved;
        
        if (hoursRemaining < 2) {
            const shouldContinue = confirm(
                `Attention : ${studentFirstName} ${studentLastName} n'a plus d'heures disponibles dans son forfait.\n\n` +
                `Heures totales : ${hoursGoal}h\n` +
                `Heures effectuées : ${hoursCompleted}h\n` +
                `Heures réservées : ${hoursReserved}h\n` +
                `Heures restantes : ${hoursRemaining}h\n\n` +
                `Voulez-vous quand même placer cet élève sur ce créneau ?`
            );
            
            if (!shouldContinue) {
                return;
            }
        }
        
        // Confirmer la réservation
        const confirmMsg = `Confirmer la réservation ?\n\n` +
            `Élève : ${studentFirstName} ${studentLastName}\n` +
            `Email : ${studentEmail}\n` +
            `Moniteur : ${instructor}\n` +
            `Date : ${new Date(startAt).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}\n` +
            `Horaire : ${new Date(startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(endAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n\n` +
            `Heures restantes après cette réservation : ${hoursRemaining - 2}h`;
        
        if (!confirm(confirmMsg)) {
            return;
        }
        
        // Récupérer le téléphone de l'élève
        const studentPhone = student.telephone || '';
        
        // Réserver le créneau via la fonction book_slot
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
            console.error('Impossible de réserver ce créneau:', bookingResult?.error || 'Erreur inconnue');
            return;
        }
        
        // Fermer la modal de sélection
        closeSlotSelection();
        
        // Mettre à jour l'état pour afficher la semaine et le moniteur du créneau ajouté
        state.instructor = normalizeInstructor(instructor);
        state.weekStart = startOfWeek(new Date(startAt));
        saveState();
        
        // Rafraîchir le planning sans recharger la page
        await refresh();
        
    } catch (err) {
        console.error('Error booking slot for student:', err);
    }
};

// ============================================
// LISTE D'ATTENTE POUR DÉSISTEMENTS
// ============================================

async function loadWaitlist() {
    const container = document.getElementById('waitlistContainer');
    if (!container) return;
    
    try {
        // Charger tous les élèves intéressés par les désistements
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
                    <p>Aucun élève n'a configuré ses disponibilités pour le moment</p>
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
            
            // Formater les disponibilités par jour
            const availabilityHTML = daysWithSlots.map(day => {
                const slots = availabilitySlots[day];
                const slotsFormatted = slots.map(slot => {
                    // Convertir "07:00-09:00" en "07h-09h"
                    return slot.replace(/:/g, 'h').replace('-', ' - ');
                }).join(', ');
                
                return `
                    <div style="margin-bottom: 0.5rem;">
                        <strong style="color: var(--blue);">${daysMap[day] || day}</strong>: ${slotsFormatted}
                    </div>
                `;
            }).join('');
            
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
                                ${student.user_name || 'Nom non renseigné'}
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
                        
                        <!-- Disponibilités -->
                        <div>
                            <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: var(--text);">
                                <i class="fas fa-calendar-check" style="color: var(--green);"></i>
                                Disponibilités
                            </h4>
                            <div style="font-size: 0.9rem; color: var(--text);">
                                ${weeksHTML}
                                ${availabilityHTML || '<p style="color: var(--text2);">Aucune disponibilité configurée</p>'}
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
    if (!confirm(`Êtes-vous sûr de vouloir supprimer les disponibilités de cet élève ?\n\nEmail: ${userEmail}\n\nCette action est irréversible.`)) {
        return;
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('student_availability')
            .delete()
            .eq('user_email', userEmail);
        
        if (error) {
            console.error('Error deleting availability:', error);
            alert('❌ Erreur lors de la suppression. Réessaie.');
            return;
        }
        
        alert('✅ Disponibilités supprimées avec succès !');
        loadWaitlist(); // Recharger la liste
        
    } catch (err) {
        console.error('Error deleting availability:', err);
        alert('❌ Erreur lors de la suppression. Réessaie.');
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// NOTES ADMIN FUNCTIONALITY
// ══════════════════════════════════════════════════════════════════════════════

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
        btn.innerHTML = '<i class="fas fa-check"></i> Sauvegardé !';
        btn.style.background = '#218838';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '#28a745';
        }, 2000);
        
    } catch (err) {
        console.error('Erreur sauvegarde notes:', err);
        alert('❌ Erreur lors de la sauvegarde des notes.');
    }
};

// Effacer les notes admin pour un élève
window.clearAdminNotes = async function(studentEmail) {
    if (!confirm('Êtes-vous sûr de vouloir effacer ces notes ?')) return;
    
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
        btn.innerHTML = '<i class="fas fa-check"></i> Effacé !';
        btn.style.background = '#c82333';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '#dc3545';
        }, 2000);
        
    } catch (err) {
        console.error('Erreur effacement notes:', err);
        alert('❌ Erreur lors de l\'effacement des notes.');
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
        console.log('🚫 Mylène masquée - indisponible à partir du 1er mai 2026');
    }
    
    // Attendre un peu pour s'assurer que Supabase est chargé
    setTimeout(() => {
        loadWaitlist();
        
        // Charger les taux de réussite et détecter le moniteur actif
        loadInstructorSuccessRates().then(() => {
            // Détecter le moniteur actif après le chargement des données
            const activeBtn = document.querySelector('#instructorSegment button.active');
            const currentInstructor = activeBtn ? activeBtn.dataset.instructor : null;
            
            if (currentInstructor && window.refreshInstructorDisplay) {
                window.refreshInstructorDisplay(currentInstructor);
            }
        });
        
        startSuccessRateAutoRefresh();
        
        // Ajouter un écouteur sur les boutons de sélection de moniteur
        const instructorButtons = document.querySelectorAll('#instructorSegment button');
        instructorButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const instructorName = btn.dataset.instructor;
                if (window.refreshInstructorDisplay) {
                    window.refreshInstructorDisplay(instructorName);
                }
            });
        });
    }, 500);
});
