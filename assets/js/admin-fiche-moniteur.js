// ══════════════════════════════════════════════════════════════════════════════
// FICHE MONITEUR - CHARGEMENT DES DONNÉES
// ══════════════════════════════════════════════════════════════════════════════

window.loadInstructorData = async function() {
    const instructor = document.getElementById('instructorSelect').value;
    
    if (!instructor) {
        document.getElementById('instructorContent').style.display = 'none';
        return;
    }
    
    document.getElementById('instructorContent').style.display = 'block';
    
    try {
        // Charger toutes les données en parallèle
        await Promise.all([
            loadBasicInfo(instructor),
            loadStats(instructor),
            loadExamResults(instructor),
            loadCongesAndIndisponibilites(instructor),
            loadBonuses(instructor)
        ]);
        
    } catch (error) {
        console.error('Error loading instructor data:', error);
        alert('Erreur lors du chargement des données du moniteur.');
    }
};

async function loadBasicInfo(instructor) {
    // Informations de base du moniteur
    document.getElementById('instructorName').textContent = instructor;
    
    // Récupérer les infos depuis la table users si elles existent
    const { data: userData } = await window.supabaseClient
        .from('users')
        .select('email, telephone, created_at')
        .eq('instructor_name', instructor)
        .eq('is_instructor', true)
        .single();
    
    if (userData) {
        document.getElementById('instructorEmail').textContent = userData.email || '-';
        document.getElementById('instructorPhone').textContent = userData.telephone || '-';
        document.getElementById('hireDate').textContent = userData.created_at 
            ? new Date(userData.created_at).toLocaleDateString('fr-FR') 
            : '-';
    } else {
        // Valeurs par défaut si pas de données
        document.getElementById('instructorEmail').textContent = instructor.toLowerCase() + '@autoecolebreteuil.com';
        document.getElementById('instructorPhone').textContent = '-';
        document.getElementById('hireDate').textContent = '-';
    }
}

async function loadStats(instructor) {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    // Nombre d'élèves actifs (avec réservations futures)
    const { data: activeReservations } = await window.supabaseClient
        .from('reservations')
        .select('email, slots(start_at, instructor)')
        .eq('slots.instructor', instructor)
        .gte('slots.start_at', now.toISOString())
        .eq('status', 'upcoming');
    
    const uniqueStudents = new Set(activeReservations?.map(r => r.email) || []);
    document.getElementById('activeStudents').textContent = uniqueStudents.size;
    
    // Heures effectuées cette année
    const { data: completedSlots } = await window.supabaseClient
        .from('reservations')
        .select('slots(start_at, end_at, instructor)')
        .eq('slots.instructor', instructor)
        .gte('slots.start_at', startOfYear.toISOString())
        .lte('slots.start_at', now.toISOString())
        .eq('status', 'done');
    
    let totalHours = 0;
    (completedSlots || []).forEach(res => {
        if (res.slots) {
            const start = new Date(res.slots.start_at);
            const end = new Date(res.slots.end_at);
            totalHours += (end - start) / (1000 * 60 * 60);
        }
    });
    
    document.getElementById('totalHours').textContent = Math.round(totalHours) + 'h';
}

async function loadExamResults(instructor) {
    // Récupérer tous les résultats d'examens des élèves du moniteur
    // On suppose qu'il y a une table exam_results ou similar
    const { data: examResults } = await window.supabaseClient
        .from('exam_results')
        .select('*')
        .eq('instructor', instructor);
    
    let successCount = 0;
    let failCount = 0;
    let pendingCount = 0;
    
    (examResults || []).forEach(exam => {
        if (exam.result === 'success' || exam.result === 'reussi') {
            successCount++;
        } else if (exam.result === 'fail' || exam.result === 'echec') {
            failCount++;
        } else {
            pendingCount++;
        }
    });
    
    const totalExams = successCount + failCount;
    const successRate = totalExams > 0 ? Math.round((successCount / totalExams) * 100) : 0;
    
    document.getElementById('successCount').textContent = successCount;
    document.getElementById('failCount').textContent = failCount;
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('totalExams').textContent = totalExams;
    document.getElementById('successRate').textContent = successRate + '%';
    
    // Remplir le tableau d'historique
    const tbody = document.getElementById('examsTableBody');
    
    if (examResults && examResults.length > 0) {
        tbody.innerHTML = examResults.map(exam => `
            <tr>
                <td>${new Date(exam.exam_date).toLocaleDateString('fr-FR')}</td>
                <td>${exam.student_name || exam.student_email}</td>
                <td>${exam.exam_type || 'Conduite'}</td>
                <td>
                    <span class="badge ${exam.result === 'success' || exam.result === 'reussi' ? 'success' : 'danger'}">
                        ${exam.result === 'success' || exam.result === 'reussi' ? 'Réussi' : 'Échoué'}
                    </span>
                </td>
                <td>${exam.comment || '-'}</td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #86868b;">Aucun examen enregistré</td></tr>';
    }
}

async function loadCongesAndIndisponibilites(instructor) {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    
    // Récupérer tous les créneaux indisponibles et congés
    const { data: slots } = await window.supabaseClient
        .from('slots')
        .select('*')
        .eq('instructor', instructor)
        .eq('status', 'indisponible')
        .gte('start_at', startOfYear.toISOString())
        .lte('start_at', endOfYear.toISOString())
        .order('start_at', { ascending: false });
    
    // Grouper par période
    const periods = new Map();
    let congesDaysCount = 0;
    
    (slots || []).forEach(slot => {
        const isConges = slot.notes && slot.notes.includes('CONGÉS');
        const key = slot.notes || 'Indisponible';
        
        if (!periods.has(key)) {
            periods.set(key, {
                type: isConges ? 'conges' : 'indisponible',
                dates: [],
                notes: slot.notes
            });
        }
        
        periods.get(key).dates.push(new Date(slot.start_at));
        
        // Compter les jours de congés
        if (isConges) {
            congesDaysCount++;
        }
    });
    
    // Convertir en jours (créneaux de 2h)
    const congesDays = Math.ceil(congesDaysCount / 4); // 4 créneaux de 2h = 1 jour
    document.getElementById('congesDays').textContent = congesDays;
    
    // Afficher dans la timeline
    const timeline = document.getElementById('congesTimeline');
    
    if (periods.size > 0) {
        timeline.innerHTML = Array.from(periods.entries()).map(([key, period]) => {
            const dates = period.dates.sort((a, b) => b - a);
            const firstDate = dates[dates.length - 1];
            const lastDate = dates[0];
            
            const dateStr = firstDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
                (dates.length > 1 ? ' - ' + lastDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
            
            return `
                <div class="timeline-item ${period.type}">
                    <div class="timeline-date">${dateStr}</div>
                    <div class="timeline-content">${period.notes || 'Indisponible'}</div>
                </div>
            `;
        }).join('');
    } else {
        timeline.innerHTML = '<p style="color: #86868b; text-align: center;">Aucun congé ou indisponibilité</p>';
    }
}

async function loadBonuses(instructor) {
    // Salaire de base (à adapter selon vos données)
    const baseSalaries = {
        'Daho': '2500€',
        'Nail': '2500€'
    };
    
    document.getElementById('baseSalary').textContent = baseSalaries[instructor] || '2500€';
    
    // Calculer les primes basées sur les résultats
    const successCount = parseInt(document.getElementById('successCount').textContent) || 0;
    const successBonus = successCount * 50; // 50€ par réussite
    
    document.getElementById('successBonus').textContent = successBonus + '€';
    
    // Prime d'ancienneté (à calculer selon la date d'embauche)
    const seniorityBonus = 200; // Exemple fixe
    document.getElementById('seniorityBonus').textContent = seniorityBonus + '€';
    
    const totalBonus = successBonus + seniorityBonus;
    document.getElementById('totalBonus').textContent = totalBonus + '€';
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('Fiche moniteur chargée');
});
