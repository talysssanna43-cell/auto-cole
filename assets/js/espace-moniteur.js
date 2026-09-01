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

function slotStartCodeStart(value) {
    return String(value || '').split('|')[0];
}

function slotStartCodeEnd(value) {
    const parts = String(value || '').split('|');
    return parts[1] || '';
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

const LEGACY_INSTRUCTOR_KEYS = new Set(['sammy', 'daho', 'nail', 'mylene']);
const NEW_INSTRUCTOR_TIME_ROWS = [
    '07:00', '07:45', '08:30', '09:15',
    '10:00', '10:45', '11:30', '12:15',
    '13:00', '13:45', '14:30', '15:15',
    '16:00', '16:45', '17:30', '18:15'
];

function normalizeInstructorName(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function isLegacyInstructorName(value) {
    return LEGACY_INSTRUCTOR_KEYS.has(normalizeInstructorName(value));
}

function getTimeRows(instructor) {
    const key = normalizeInstructorName(instructor);
    if (!isLegacyInstructorName(instructor)) {
        return NEW_INSTRUCTOR_TIME_ROWS;
    }
    if (key === 'sammy') {
        return ['07:00', '09:00', '11:00'];
    }
    if (key === 'daho') {
        // Daho: Lundi 17h-19h, Mardi-Vendredi 17h-19h, Samedi 7h-13h
        return ['07:00', '09:00', '11:00', '15:00', '17:00'];
    }
    if (key === 'nail') {
        return ['07:00', '09:00', '11:00', '13:00', '15:00|15:45', '15:45|16:30', '17:00'];
    }
    // TOUS les autres moniteurs (y compris les nouveaux créés dynamiquement) : 7h-19h
    return ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00'];
}

function getEndForStart(instructor, start) {
    const encodedEnd = slotStartCodeEnd(start);
    if (encodedEnd) return encodedEnd;
    start = slotStartCodeStart(start);
    const key = normalizeInstructorName(instructor);
    if (!isLegacyInstructorName(instructor)) {
        const [hours, minutes] = start.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes + 45, 0, 0);
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    if (key === 'sammy') {
        if (start === '07:00') return '09:00';
        if (start === '09:00') return '11:00';
        if (start === '11:00') return '13:00';
    }
    if (key === 'daho') {
        if (start === '07:00') return '09:00';
        if (start === '09:00') return '11:00';
        if (start === '11:00') return '13:00';
        if (start === '15:00') return '17:00';
        if (start === '17:00') return '19:00';
    }
    if (key === 'nail') {
        if (start === '07:00') return '09:00';
        if (start === '09:00') return '11:00';
        if (start === '11:00') return '13:00';
        if (start === '13:00') return '15:00';
        if (start === '15:00') return '15:45';
        if (start === '15:45') return '16:30';
        if (start === '17:00') return '19:00';
    }
    if (key === 'mylene') {
        if (start === '07:00') return '09:00';
        if (start === '09:00') return '11:00';
        if (start === '11:00') return '13:00';
        if (start === '13:00') return '15:00';
        if (start === '15:00') return '17:00';
        if (start === '17:00') return '19:00';
    }
    if (start === '13:00') return '15:00';
    if (start === '15:00') return '17:00';
    if (start === '17:00') return '19:00';
    return '';
}

// ── Auth Check ──
function requireMoniteur() {
    // Vérifier d'abord la nouvelle session instructors
    const instructorSession = sessionStorage.getItem('instructorSession');
    if (instructorSession) {
        try {
            const instructor = JSON.parse(instructorSession);
            return { 
                ok: true, 
                user: {
                    prenom: instructor.prenom,
                    nom: instructor.nom,
                    email: instructor.email,
                    // L'admin enregistre les créneaux sous le prénom (state.instructor = prénom)
                    // donc on filtre par prénom pour retrouver les créneaux du moniteur
                    instructor_name: instructor.prenom,
                    is_moniteur: true
                }
            };
        } catch (e) {
            console.error('Erreur parsing instructorSession:', e);
        }
    }
    
    // Fallback: ancien système avec localStorage
    const cached = window.authSession?.getCachedUser?.();
    if (cached) {
        const isInstructor = cached.role === 'instructor' || cached.is_moniteur || cached.instructor_name;
        return isInstructor ? {
            ok: true,
            user: {
                ...cached,
                instructor_name: cached.instructor_name || cached.prenom
            }
        } : { ok: false };
    }

    const raw = localStorage.getItem('ae_user') || sessionStorage.getItem('ae_user');
    if (!raw) return { ok: false };
    try {
        const user = JSON.parse(raw);
        if (user.role !== 'instructor' && !user.is_moniteur && !user.instructor_name) return { ok: false };
        return { ok: true, user: { ...user, instructor_name: user.instructor_name || user.prenom } };
    } catch (e) {
        return { ok: false };
    }
}

function logout() {
    window.authSession?.logout?.();
    sessionStorage.removeItem('instructorSession');
    localStorage.removeItem('ae_user');
    sessionStorage.removeItem('ae_user');
    window.location.href = 'index.html';
}

// ── Fetch Data ──
async function fetchMySlots(instructor, weekStart, weekEnd) {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    end.setHours(23, 59, 59, 999);

    console.log('🔍 Récupération créneaux pour:', instructor);
    console.log('📅 Période:', start.toISOString(), '→', end.toISOString());

    // Récupérer l'ID du moniteur depuis la session
    const instructorSession = sessionStorage.getItem('instructorSession');
    const token = window.authSession?.getToken?.();
    if (token) {
        try {
            const params = new URLSearchParams({
                instructor,
                start: start.toISOString(),
                end: end.toISOString()
            });
            const res = await fetch(`/.netlify/functions/instructor-planning-data?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            });
            const result = await res.json().catch(() => null);
            if (res.ok && result?.ok) {
                console.log('Planning moniteur charge depuis le serveur:', result.slots?.length || 0);
                return result.slots || [];
            }
            console.warn('Planning serveur indisponible, fallback Supabase:', result?.error || res.status);
        } catch (serverError) {
            console.warn('Planning serveur indisponible, fallback Supabase:', serverError);
        }
    }

    let instructorId = null;
    if (instructorSession) {
        try {
            const session = JSON.parse(instructorSession);
            instructorId = session.id;
            console.log('🆔 Instructor ID:', instructorId);
        } catch (e) {
            console.error('Erreur parsing session:', e);
        }
    }

    // Récupérer TOUS les créneaux du moniteur (par nom uniquement, comme l'admin les enregistre)
    const { data, error } = await window.supabaseClient
        .from('slots')
        .select('id, start_at, end_at, status, notes, instructor, instructor_id, reservations(id, email, first_name, last_name, phone)')
        .eq('instructor', instructor)
        .gte('start_at', start.toISOString())
        .lte('start_at', end.toISOString());

    if (error) throw error;
    
    // Filtrer les slots orphelins (booked sans réservation)
    const filteredData = (data || []).filter(slot => {
        // Garder les slots indisponibles et permis
        if (slot.status === 'indisponible' || slot.status === 'permis') return true;
        
        // Garder seulement les slots booked qui ont une réservation
        if (slot.status === 'booked') {
            const hasReservation = slot.reservations && (
                Array.isArray(slot.reservations) ? slot.reservations.length > 0 : slot.reservations.id
            );
            return hasReservation;
        }
        
        // Ignorer les slots available (ils ne doivent pas apparaître)
        return false;
    });
    
    console.log('📊 Créneaux trouvés:', data?.length || 0);
    console.log('📊 Créneaux filtrés (sans orphelins):', filteredData.length);
    const indisponibleCount = filteredData.filter(s => s.status === 'indisponible').length;
    const permisCount = filteredData.filter(s => s.status === 'permis').length;
    console.log(`  - Indisponibles: ${indisponibleCount}`);
    console.log(`  - Permis: ${permisCount}`);
    
    // Récupérer les packs et transmission_type des élèves
    const emails = filteredData.map(slot => {
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

        const { data: users } = await window.supabaseClient
            .from('users')
            .select('email, forfait, transmission_type')
            .in('email', [...new Set(emails)]);

        (users || []).forEach(user => {
            if (user.forfait && !packMap.has(user.email)) {
                packMap.set(user.email, user.forfait);
            }
            if (user.transmission_type && !transmissionMap.has(user.email)) {
                transmissionMap.set(user.email, user.transmission_type);
            }
        });
    }

    // Ajouter le pack et transmission_type à chaque slot
    return filteredData.map(slot => {
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
// COPIE EXACTE DU PLANNING ADMIN (version lecture seule pour moniteur)
function renderPlanning(grid, instructor, weekStart, slots) {
    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    
    // Utiliser TOUTES les heures de 7h à 19h (comme l'admin)
    const times = getTimeRows(instructor);
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

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

    // Header (identique à l'admin)
    const headerRow = [
        `<div class="cal-head corner"></div>`,
        ...days.map(d => {
            const todayClass = isToday(d) ? ' today' : '';
            return `<div class="cal-head${todayClass}">
                <div class="day-name">${formatDayName(d)}</div>
                <div class="day-num">${formatDayNum(d)}</div>
            </div>`;
        })
    ].join('');

    // Body (identique à l'admin, sans les boutons +)
    const bodyRows = times.map(start => {
        const bookingStart = slotStartCodeStart(start);
        const end = getEndForStart(instructor, start);
        const timeCell = `<div class="cal-time">${bookingStart.replace(':', 'h')}</div>`;

        const dayCells = days.map(d => {
            const dateStr = toInputDate(d);
            const id = buildSlotId(dateStr, bookingStart);
            const slot = slotMap.get(id);
            const isBooked = !!slot;
            const slotStart = new Date(`${dateStr}T${bookingStart}:00`).getTime();
            
            // Vérifier les statuts
            const isPermis = slot && slot.status === 'permis';
            const isIndisponible = slot && slot.status === 'indisponible';
            const isConges = isIndisponible && slot.notes && slot.notes.includes('CONGÉS');
            
            // Extraire les infos
            const permisLabel = isPermis ? renderPermisLabel(slot.notes) : '';
            
            const indisponibleReason = isIndisponible && slot.notes ? slot.notes.replace('INDISPONIBLE - ', '').replace('CONGÉS - ', '').trim() : '';
            
            // Déterminer si passé
            const slotDate = new Date(dateStr);
            slotDate.setHours(0, 0, 0, 0);
            const isPast = slotDate.getTime() < todayTimestamp;
            const isDone = isBooked && !isPermis && !isIndisponible && (slotStart < now);

            if (isBooked && !isPermis && !isIndisponible) weekTotal++;
            if (isBooked && !isPermis && !isIndisponible && isToday(d)) todayTotal++;
            if (isDone) doneTotal++;

            // Classes et labels (comme l'admin)
            const statusClass = isConges ? 'conges' : isIndisponible ? 'indisponible' : isPermis ? 'permis' : isDone ? 'done' : isBooked ? 'booked' : 'available';
            const statusLabel = isConges
                ? `CONGÉS<br><small style="font-size: 0.75rem; opacity: 0.9;">${indisponibleReason}</small>`
                : isIndisponible
                ? `INDISPONIBLE${indisponibleReason ? `<br><small style="font-size: 0.75rem; opacity: 0.9;">${indisponibleReason}</small>` : ''}`
                : isPermis 
                ? permisLabel
                : isDone ? 'Réalisé' : isBooked ? 'Réservé' : 'Libre';

            const todayCol = isToday(d) ? ' today-col' : '';
            const resArray = slot?.reservations;
            const res = Array.isArray(resArray) ? resArray[0] : resArray;
            const studentName = res && !isPermis && !isIndisponible ? `${res.first_name || ''} ${res.last_name || ''}`.trim() : '';
            const studentPhone = res && !isPermis && !isIndisponible ? (res.phone || '') : '';
            
            // Type de véhicule
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
            
            const icon = isConges ? 'fa-umbrella-beach' : isIndisponible ? 'fa-ban' : isPermis ? 'fa-id-card' : isDone ? 'fa-check' : isBooked ? 'fa-user' : 'fa-minus';
            
            const studentData = res ? JSON.stringify({
                prenom: res.first_name,
                nom: res.last_name,
                telephone: res.phone,
                email: res.email,
                slotId: slot.id,
                date: dateStr,
                start: bookingStart
            }).replace(/"/g, '&quot;') : '';
            const permisData = isPermis ? encodeURIComponent(JSON.stringify({
                notes: slot.notes || '',
                date: d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
                start: bookingStart,
                end,
                instructor
            })) : '';

            return `
                <div class="cal-cell${todayCol}">
                    <div class="ev ${statusClass} ${transmissionClass}" ${isPermis ? `onclick="showPermisDetails('${permisData}')" style="cursor:pointer;"` : res && !isIndisponible ? `onclick="showStudent(${studentData})" style="cursor:pointer;"` : ''}>
                        <span class="ev-icon"><i class="fas ${icon}"></i></span>
                        <div class="ev-status">${isBooked && !isPermis && !isIndisponible ? (vehicleType || 'BM/BA') : statusLabel}</div>
                        <div class="ev-time">${bookingStart} – ${end}</div>
                        ${studentName ? `<div class="ev-name">${studentName}${vehicleType ? ` <span class="vehicle-badge">[${vehicleType}]</span>` : ''}</div>` : ''}
                        ${studentPhone ? `<div class="ev-phone"><i class="fas fa-phone" style="font-size:0.55rem;margin-right:3px;"></i>${studentPhone}</div>` : ''}
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

function setExpenseFeedback(message, type = '') {
    const feedback = document.getElementById('expenseFeedback');
    if (!feedback) return;
    feedback.textContent = message || '';
    feedback.className = `expense-feedback ${type}`;
}

function formatExpenseMotif(motif) {
    return String(motif || 'Frais vehicule').split('|').map((part) => part.trim());
}

async function fetchInstructorExpenses() {
    const token = window.authSession?.getToken?.();
    if (!token) throw new Error('AUTH_REQUIRED');
    const response = await fetch('/.netlify/functions/instructor-expenses', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
    });
    const payload = await response.json().catch(() => ({ ok: false, error: 'INVALID_SERVER_RESPONSE' }));
    if (!response.ok || !payload.ok) throw new Error(payload.error || 'INSTRUCTOR_EXPENSES_FAILED');
    return payload.expenses || [];
}

function renderInstructorExpenses(expenses) {
    const container = document.getElementById('expenseHistory');
    if (!container) return;
    if (!expenses.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>Aucun frais saisi pour le moment</p>
            </div>
        `;
        return;
    }
    container.innerHTML = expenses.map((expense) => {
        const parts = formatExpenseMotif(expense.motif);
        const title = parts.shift() || 'Frais vehicule';
        const date = expense.date ? new Date(`${expense.date}T12:00:00`).toLocaleDateString('fr-FR') : '-';
        const amount = Math.round(Number(expense.montant || 0)).toLocaleString('fr-FR');
        return `
            <div class="expense-history-item">
                <div>
                    <div class="expense-history-title">${title}</div>
                    <div class="expense-history-meta">${date}${parts.length ? ` · ${parts.join(' · ')}` : ''}</div>
                    ${expense.photo_url ? `<div class="expense-history-meta"><a href="${expense.photo_url}" target="_blank" rel="noopener">Voir le justificatif</a></div>` : ''}
                </div>
                <div class="expense-history-amount">${amount}€</div>
            </div>
        `;
    }).join('');
}

async function refreshInstructorExpenses() {
    try {
        renderInstructorExpenses(await fetchInstructorExpenses());
    } catch (error) {
        console.error('Error loading instructor expenses:', error);
        const container = document.getElementById('expenseHistory');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-triangle-exclamation"></i>
                    <p>Impossible de charger les frais.</p>
                </div>
            `;
        }
    }
}

async function submitInstructorExpense(event) {
    event.preventDefault();
    const token = window.authSession?.getToken?.();
    if (!token) {
        setExpenseFeedback('Connexion moniteur introuvable. Reconnecte-toi.', 'error');
        return;
    }

    const kind = document.getElementById('expenseKind')?.value || 'fuel';
    const body = {
        kind,
        plate: document.getElementById('expensePlate')?.value || '',
        date: document.getElementById('expenseDate')?.value || '',
        time: document.getElementById('expenseTime')?.value || '',
        amount: Number(document.getElementById('expenseAmount')?.value || 0),
        incident_type: document.getElementById('incidentType')?.value || '',
        photo_url: document.getElementById('expensePhoto')?.value || '',
        comment: document.getElementById('expenseComment')?.value || ''
    };

    setExpenseFeedback('Envoi en cours...', '');
    try {
        const response = await fetch('/.netlify/functions/instructor-expenses', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        const payload = await response.json().catch(() => ({ ok: false, error: 'INVALID_SERVER_RESPONSE' }));
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'INSTRUCTOR_EXPENSE_FAILED');

        event.target.reset();
        const dateInput = document.getElementById('expenseDate');
        if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
        const incidentWrap = document.getElementById('incidentTypeWrap');
        if (incidentWrap) incidentWrap.style.display = 'none';
        setExpenseFeedback('Frais envoyé. Il est maintenant pris en compte dans la rentabilité admin.', 'success');
        await refreshInstructorExpenses();
    } catch (error) {
        console.error('Error submitting instructor expense:', error);
        const messages = {
            MISSING_PLATE: "La plaque d'immatriculation est obligatoire.",
            INVALID_AMOUNT: 'Le montant doit être supérieur à 0.',
            INVALID_DATE: 'La date est invalide.',
            MISSING_INCIDENT_TYPE: "Précise le type d'incident."
        };
        setExpenseFeedback(messages[error.message] || "Impossible d'envoyer ce frais.", 'error');
    }
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
        window.location.href = 'index.html';
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
    const expenseForm = document.getElementById('expenseForm');
    const expenseKind = document.getElementById('expenseKind');
    const incidentTypeWrap = document.getElementById('incidentTypeWrap');
    const expenseDate = document.getElementById('expenseDate');

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
            if (btn.dataset.tab === 'frais') refreshInstructorExpenses();
        });
    });

    if (expenseDate) expenseDate.value = new Date().toISOString().slice(0, 10);
    if (expenseKind && incidentTypeWrap) {
        expenseKind.addEventListener('change', () => {
            incidentTypeWrap.style.display = expenseKind.value === 'incident' ? '' : 'none';
        });
    }
    if (expenseForm) {
        expenseForm.addEventListener('submit', submitInstructorExpense);
    }

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
    
    // Rafraîchissement automatique toutes les 15 secondes
    setInterval(() => {
        refreshPlanning();
    }, 15000);
    
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
