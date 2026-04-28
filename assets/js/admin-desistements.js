// ============================================
// ADMIN DÉSISTEMENTS - PLANNING DES DISPONIBILITÉS
// ============================================

let currentWeekOffset = 0;

// Créneaux horaires
const timeSlots = [
    { label: '07:00 - 09:00', value: 'morning' },
    { label: '09:00 - 12:00', value: 'morning' },
    { label: '12:00 - 14:00', value: 'afternoon' },
    { label: '14:00 - 17:00', value: 'afternoon' },
    { label: '17:00 - 19:00', value: 'evening' },
    { label: '19:00 - 21:00', value: 'evening' }
];

// Jours de la semaine
const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📅 Initialisation du planning désistements...');
    
    // Vérifier l'authentification admin
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
        window.location.href = 'connexion.html';
        return;
    }
    
    // Charger le planning
    await loadAvailabilityPlanning();
    
    // Bouton déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            window.location.href = 'connexion.html';
        });
    }
});

// ============================================
// AUTHENTIFICATION
// ============================================

async function checkAdminAuth() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !user.email) return false;
    
    try {
        const { data, error } = await window.supabaseClient
            .from('comptes_speciaux')
            .select('is_admin')
            .eq('email', user.email)
            .maybeSingle();
        
        return data && data.is_admin;
    } catch (err) {
        console.error('Erreur vérification admin:', err);
        return false;
    }
}

// ============================================
// GESTION DES SEMAINES
// ============================================

function getWeekDates(offset = 0) {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay; // Lundi = début de semaine
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff + (offset * 7));
    monday.setHours(0, 0, 0, 0);
    
    const dates = [];
    for (let i = 0; i < 6; i++) { // Lundi à Samedi
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        dates.push(date);
    }
    
    return dates;
}

function updateWeekDisplay() {
    const dates = getWeekDates(currentWeekOffset);
    const weekDisplay = document.getElementById('weekDisplay');
    
    if (weekDisplay) {
        const startDate = dates[0].toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' });
        const endDate = dates[5].toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
        weekDisplay.textContent = `Semaine du ${startDate} au ${endDate}`;
    }
    
    // Désactiver le bouton précédent si on est à la semaine actuelle
    const prevBtn = document.getElementById('prevWeekBtn');
    if (prevBtn) {
        prevBtn.disabled = currentWeekOffset === 0;
    }
}

window.changeWeek = async function(direction) {
    currentWeekOffset += direction;
    await loadAvailabilityPlanning();
};

// ============================================
// CHARGEMENT DES DISPONIBILITÉS
// ============================================

async function loadAvailabilityPlanning() {
    try {
        console.log('📊 Chargement des disponibilités élèves...');
        
        // Récupérer toutes les disponibilités
        const { data: availabilities, error } = await window.supabaseClient
            .from('student_availability')
            .select('*')
            .eq('wants_cancellation_notifications', true);
        
        if (error) {
            console.error('Erreur chargement disponibilités:', error);
            return;
        }
        
        console.log(`✅ ${availabilities?.length || 0} élèves avec disponibilités`);
        
        // Mettre à jour l'affichage de la semaine
        updateWeekDisplay();
        
        // Générer le planning
        generatePlanningGrid(availabilities || []);
        
    } catch (err) {
        console.error('Erreur:', err);
    }
}

// ============================================
// GÉNÉRATION DU PLANNING
// ============================================

function generatePlanningGrid(availabilities) {
    const planningBody = document.getElementById('planningBody');
    if (!planningBody) return;
    
    const weekDates = getWeekDates(currentWeekOffset);
    const currentWeekNumber = getCurrentWeekNumber();
    
    // Construire la grille
    let html = '';
    
    timeSlots.forEach(slot => {
        html += `<tr>`;
        html += `<td class="time-cell">${slot.label}</td>`;
        
        // Pour chaque jour de la semaine
        daysOfWeek.forEach((dayName, dayIndex) => {
            const date = weekDates[dayIndex];
            const weekNumber = getWeekNumberFromDate(date);
            
            // Trouver les élèves disponibles pour ce jour et ce créneau
            const availableStudents = availabilities.filter(avail => {
                // Vérifier si l'élève est disponible pour cette semaine
                const weeks = avail.availability_weeks || [];
                if (!weeks.includes(weekNumber)) return false;
                
                // Vérifier si l'élève est disponible pour ce jour
                const slots = typeof avail.availability_slots === 'string' 
                    ? JSON.parse(avail.availability_slots) 
                    : avail.availability_slots;
                
                if (!slots || !slots[dayName]) return false;
                
                // Vérifier si l'élève est disponible pour ce créneau horaire
                return slots[dayName].includes(slot.value);
            });
            
            html += `<td>`;
            if (availableStudents.length > 0) {
                availableStudents.forEach(student => {
                    html += `<div class="student-tag" onclick="showStudentInfo('${student.user_email}', '${student.user_name}')" title="${student.user_phone || 'Pas de téléphone'}">
                        <i class="fas fa-user"></i> ${student.user_name}
                    </div>`;
                });
            } else {
                html += `<span class="empty-cell">-</span>`;
            }
            html += `</td>`;
        });
        
        html += `</tr>`;
    });
    
    planningBody.innerHTML = html;
}

// ============================================
// UTILITAIRES
// ============================================

function getCurrentWeekNumber() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const days = Math.floor((today - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

function getWeekNumberFromDate(date) {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

// ============================================
// AFFICHAGE INFO ÉLÈVE
// ============================================

window.showStudentInfo = function(email, name) {
    alert(`📞 Contacter ${name}\n\nEmail: ${email}\n\nVous pouvez contacter cet élève pour lui proposer un créneau en cas de désistement.`);
};

console.log('✅ admin-desistements.js chargé');
