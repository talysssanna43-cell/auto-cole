// ── Utility Functions ──
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

function formatWeekLabel(start, end) {
    const s = start.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    const e = end.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    return `${s} → ${e}`;
}

function buildSlotId(dateStr, startTime) {
    return `${dateStr}|${startTime}`;
}

function getTimeRows(instructor) {
    if (instructor === 'Sammy') {
        return ['07:00', '09:00', '11:00'];
    }
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

// ── Auth Check ──
function requireMoniteur() {
    const raw = localStorage.getItem('ae_user');
    if (!raw) return { ok: false };
    try {
        const user = JSON.parse(raw);
        if (!user.is_moniteur && !user.instructor_name) return { ok: false };
        return { ok: true, user };
    } catch (e) {
        return { ok: false };
    }
}

function logout() {
    localStorage.removeItem('ae_user');
    window.location.href = 'connexion.html';
}

// ── Fetch Data ──
async function fetchMySlots(instructor, weekStart, weekEnd) {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    end.setHours(23, 59, 59, 999);

    console.log('🔍 Récupération créneaux pour:', instructor);
    console.log('📅 Période:', start.toISOString(), '→', end.toISOString());

    const { data, error } = await window.supabaseClient
        .from('slots')
        .select('id, start_at, end_at, status, notes, reservations(id, email, first_name, last_name, phone)')
        .eq('instructor', instructor)
        .gte('start_at', start.toISOString())
        .lte('start_at', end.toISOString());

    if (error) throw error;
    
    console.log('📊 Créneaux trouvés:', data?.length || 0);
    const indisponibleCount = (data || []).filter(s => s.status === 'indisponible').length;
    const permisCount = (data || []).filter(s => s.status === 'permis').length;
    console.log(`  - Indisponibles: ${indisponibleCount}`);
    console.log(`  - Permis: ${permisCount}`);
    
    // Récupérer les packs et transmission_type des élèves
    const emails = (data || []).map(slot => {
        const res = Array.isArray(slot.reservations) ? slot.reservations[0] : slot.reservations;
        return res?.email;
    }).filter(Boolean);

    let packMap = new Map();
    let transmissionMap = new Map();
    if (emails.length > 0) {
        const { data: inscriptions } = await window.supabaseClient
            .from('inscription_notifications')
            .select('user_email, pack, transmission_type')
            .in('user_email', [...new Set(emails)]);
        
        (inscriptions || []).forEach(ins => {
            packMap.set(ins.user_email, ins.pack);
            transmissionMap.set(ins.user_email, ins.transmission_type);
        });
    }

    // Ajouter le pack et transmission_type à chaque slot
    return (data || []).map(slot => {
        const res = Array.isArray(slot.reservations) ? slot.reservations[0] : slot.reservations;
        const email = res?.email;
        return {
            ...slot,
            pack: email ? packMap.get(email) : null,
            transmission_type: email ? transmissionMap.get(email) : null
        };
    });
}

async function fetchCancellations(instructor) {
    const { data, error } = await window.supabaseClient
        .from('cancellations')
        .select('id, slot_id, reason, created_at, reservations(first_name, last_name, phone)')
        .eq('instructor', instructor)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.warn('Table cancellations not found or error:', error);
        return [];
    }
    return data || [];
}

async function fetchMessages(instructor) {
    const { data, error } = await window.supabaseClient
        .from('messages')
        .select('id, subject, content, is_read, created_at, reservations(first_name, last_name)')
        .eq('instructor', instructor)
        .order('created_at', { ascending: false })
        .limit(30);

    if (error) {
        console.warn('Table messages not found or error:', error);
        return [];
    }
    return data || [];
}

// ── Render Planning ──
function renderPlanning(grid, instructor, weekStart, slots) {
    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    const times = getTimeRows(instructor);
    const now = Date.now();

    // Build lookup map
    const slotMap = new Map();
    slots.forEach(slot => {
        const d = new Date(slot.start_at);
        const dateStr = toInputDate(d);
        const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        const id = buildSlotId(dateStr, timeStr);
        slotMap.set(id, slot);
    });

    // Stats
    let weekTotal = 0, todayTotal = 0, doneTotal = 0;

    // Header
    const headerRow = [
        `<div class="cal-head" style="border-right:1px solid var(--border);"></div>`,
        ...days.map(d => {
            const todayClass = isToday(d) ? ' today' : '';
            return `<div class="cal-head${todayClass}">
                <div class="day-name">${formatDayName(d)}</div>
                <div class="day-num">${formatDayNum(d)}</div>
            </div>`;
        })
    ].join('');

    // Body
    const bodyRows = times.map(start => {
        const end = getEndForStart(instructor, start);
        const timeCell = `<div class="cal-time">${start.replace(':', 'h')}</div>`;

        const dayCells = days.map(d => {
            const dateStr = toInputDate(d);
            const id = buildSlotId(dateStr, start);
            const slot = slotMap.get(id);
            const isBooked = slot && slot.status === 'booked';
            const isCancelled = slot && slot.status === 'cancelled';
            const isPermis = slot && slot.status === 'permis';
            const isIndisponible = slot && slot.status === 'indisponible';
            
            const permisLocation = isPermis && slot.notes ? slot.notes.replace('PERMIS - ', '').split('|')[0].trim() : '';
            const permisCandidates = isPermis && slot.notes && slot.notes.includes('|') 
                ? slot.notes.split('|')[1].replace('Candidats:', '').trim() 
                : '';
            
            const indisponibleReason = isIndisponible && slot.notes ? slot.notes.replace('INDISPONIBLE - ', '').trim() : '';
            
            const slotStart = new Date(`${dateStr}T${start}:00`).getTime();
            const isPast = slotStart < now;
            const isDone = isBooked && isPast;

            if (isBooked) weekTotal++;
            if (isBooked && isToday(d)) todayTotal++;
            if (isDone) doneTotal++;

            let statusClass = 'available';
            let statusLabel = 'Libre';
            if (isIndisponible) {
                statusClass = 'indisponible';
                statusLabel = `INDISPONIBLE${indisponibleReason ? `<br><small style="font-size: 0.75rem; opacity: 0.9;">${indisponibleReason}</small>` : ''}`;
            } else if (isPermis) {
                statusClass = 'permis';
                statusLabel = `PERMIS - ${permisLocation}${permisCandidates ? `<br><small style="font-size: 0.75rem; opacity: 0.9;">${permisCandidates}</small>` : ''}`;
            } else if (isCancelled) {
                statusClass = 'cancelled';
                statusLabel = 'Annulé';
            } else if (isDone) {
                statusClass = 'done';
                statusLabel = 'Fait';
            } else if (isBooked) {
                statusClass = 'booked';
                statusLabel = 'Réservé';
            }

            const todayCol = isToday(d) ? ' today-col' : '';
            const resArray = slot?.reservations;
            const res = Array.isArray(resArray) ? resArray[0] : resArray;
            const studentName = res ? `${res.first_name || ''} ${res.last_name || ''}`.trim() : '';
            
            // Déterminer le type de véhicule depuis transmission_type
            const transmissionType = slot?.transmission_type || null;
            let vehicleType = '';
            let transmissionClass = '';
            
            if (transmissionType === 'auto') {
                vehicleType = 'BA';
                transmissionClass = 'transmission-auto';
            } else if (transmissionType === 'manual') {
                vehicleType = 'BM';
                transmissionClass = 'transmission-manual';
            }
            
            const studentData = res ? JSON.stringify({
                prenom: res.first_name,
                nom: res.last_name,
                telephone: res.phone,
                email: res.email
            }).replace(/"/g, '&quot;') : '';

            return `
                <div class="cal-cell${todayCol}">
                    <div class="ev ${statusClass} ${transmissionClass}" ${res && !isPermis && !isIndisponible ? `onclick="showStudent(${studentData})"` : ''}>
                        <div class="ev-status">${statusLabel}</div>
                        <div class="ev-time">${start} – ${end}</div>
                        ${studentName && !isPermis && !isIndisponible ? `<div class="ev-name">${studentName}${vehicleType ? ` <span class="vehicle-badge">[${vehicleType}]</span>` : ''}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        return timeCell + dayCells;
    }).join('');

    grid.innerHTML = headerRow + bodyRows;

    // Update stats
    document.getElementById('statWeek').textContent = weekTotal;
    document.getElementById('statToday').textContent = todayTotal;
    document.getElementById('statDone').textContent = doneTotal;
}

// ── Render Messages ──
function renderMessages(container, messages) {
    if (!messages.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>Aucun message pour le moment</p></div>`;
        return;
    }

    container.innerHTML = messages.map(msg => {
        const res = msg.reservations;
        const name = res ? `${res.first_name || ''} ${res.last_name || ''}`.trim() : 'Élève';
        const date = new Date(msg.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        const badge = msg.is_read ? '<span class="item-badge read">Lu</span>' : '<span class="item-badge new">Nouveau</span>';

        return `
            <div class="list-item">
                <div class="item-icon purple"><i class="fas fa-envelope"></i></div>
                <div class="item-content">
                    <div class="item-title">${name}</div>
                    <div class="item-subtitle">${msg.subject || msg.content?.substring(0, 50) || 'Message'}</div>
                </div>
                <div class="item-time">${date}</div>
                ${badge}
            </div>
        `;
    }).join('');
}

// ── Render Cancellations ──
function renderCancellations(container, cancellations) {
    if (!cancellations.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-check"></i><p>Aucune annulation récente</p></div>`;
        return;
    }

    document.getElementById('statCancelled').textContent = cancellations.length;

    container.innerHTML = cancellations.map(c => {
        const res = c.reservations;
        const name = res ? `${res.first_name || ''} ${res.last_name || ''}`.trim() : 'Élève';
        const date = new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

        return `
            <div class="list-item">
                <div class="item-icon red"><i class="fas fa-calendar-times"></i></div>
                <div class="item-content">
                    <div class="item-title">${name}</div>
                    <div class="item-subtitle">${c.reason || 'Annulation de cours'}</div>
                </div>
                <div class="item-time">${date}</div>
            </div>
        `;
    }).join('');
}

// ── Show Student Modal ──
window.showStudent = function(student) {
    const modal = document.getElementById('studentModal');
    const details = document.getElementById('studentDetails');

    details.innerHTML = `
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
    `;

    modal.classList.add('active');
};

// ── Init ──
(function init() {
    const check = requireMoniteur();
    if (!check.ok) {
        window.location.href = 'connexion.html';
        return;
    }

    const user = check.user;
    const instructor = user.instructor_name || user.prenom;
    
    // Stocker le nom du moniteur dans localStorage pour les autres scripts
    localStorage.setItem('instructorName', instructor);
    console.log('💾 Instructor name saved to localStorage:', instructor);

    // Update UI with user info
    document.getElementById('userName').textContent = user.prenom || instructor;
    document.getElementById('userFullName').textContent = user.prenom || instructor;
    document.getElementById('userAvatar').textContent = (user.prenom || instructor).charAt(0).toUpperCase();

    // Elements
    const planningGrid = document.getElementById('planningGrid');
    const weekLabel = document.getElementById('weekLabel');
    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');
    const todayBtn = document.getElementById('todayBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const closeModal = document.getElementById('closeModal');
    const studentModal = document.getElementById('studentModal');
    const tabBtns = document.querySelectorAll('.topbar-tabs button');
    const messagesList = document.getElementById('messagesList');
    const annulationsList = document.getElementById('annulationsList');

    let state = {
        weekStart: startOfWeek(new Date())
    };

    async function refreshPlanning() {
        const weekEnd = addDays(state.weekStart, 6);
        weekLabel.textContent = formatWeekLabel(state.weekStart, weekEnd);

        try {
            const slots = await fetchMySlots(instructor, state.weekStart, weekEnd);
            renderPlanning(planningGrid, instructor, state.weekStart, slots);
        } catch (err) {
            console.error('Error loading planning:', err);
        }
    }

    async function refreshMessages() {
        try {
            const messages = await fetchMessages(instructor);
            renderMessages(messagesList, messages);
        } catch (err) {
            console.error('Error loading messages:', err);
        }
    }

    async function refreshCancellations() {
        try {
            const cancellations = await fetchCancellations(instructor);
            renderCancellations(annulationsList, cancellations);
        } catch (err) {
            console.error('Error loading cancellations:', err);
        }
    }

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');

            if (btn.dataset.tab === 'messages') refreshMessages();
            if (btn.dataset.tab === 'annulations') refreshCancellations();
        });
    });

    // Week navigation
    prevWeekBtn.addEventListener('click', () => {
        state.weekStart = addDays(state.weekStart, -7);
        refreshPlanning();
    });

    nextWeekBtn.addEventListener('click', () => {
        state.weekStart = addDays(state.weekStart, 7);
        refreshPlanning();
    });

    todayBtn.addEventListener('click', () => {
        state.weekStart = startOfWeek(new Date());
        refreshPlanning();
    });

    // Logout
    logoutBtn.addEventListener('click', logout);

    // Modal close
    closeModal.addEventListener('click', () => studentModal.classList.remove('active'));
    studentModal.addEventListener('click', (e) => {
        if (e.target === studentModal) studentModal.classList.remove('active');
    });

    // Initial load
    refreshPlanning();
    
    // Charger les données de primes avec un délai pour s'assurer que le DOM est prêt
    setTimeout(() => {
        console.log('⏰ Attempting to load bonus progress...');
        if (typeof window.loadBonusProgress === 'function') {
            console.log('✅ loadBonusProgress function found, calling it...');
            window.loadBonusProgress();
        } else {
            console.error('❌ loadBonusProgress function not found!');
        }
    }, 500);
})();
