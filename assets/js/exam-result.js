// Gestion du modal de résultat d'examen
let selectedRating = 0;

// Ouvrir le modal
window.openExamResultModal = async function() {
    const modal = document.getElementById('examResultModal');
    if (!modal) return;
    
    // Calculer le moniteur principal
    await calculateMainInstructor();
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

// Fermer le modal
window.closeExamResultModal = function() {
    const modal = document.getElementById('examResultModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset form
        document.getElementById('examResultForm').reset();
        selectedRating = 0;
        updateStarDisplay();
    }
};

// Définir la note (étoiles)
window.setRating = function(rating) {
    selectedRating = rating;
    document.getElementById('ratingValue').value = rating;
    updateStarDisplay();
};

// Mettre à jour l'affichage des étoiles
function updateStarDisplay() {
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach((star, index) => {
        if (index < selectedRating) {
            star.classList.remove('far');
            star.classList.add('fas');
            star.style.color = '#FFD700';
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
            star.style.color = '#ddd';
        }
    });
}

// Calculer le moniteur principal (75% des heures)
async function calculateMainInstructor() {
    const instructorInfo = document.getElementById('instructorInfo');
    const selectedInstructorInput = document.getElementById('selectedInstructor');
    
    if (!window.supabaseClient || !dashboardState?.user?.email) {
        showManualInstructorSelection();
        return;
    }
    
    try {
        // Récupérer toutes les séances effectuées de l'élève via la table reservations avec jointure sur slots
        const { data: reservations, error } = await window.supabaseClient
            .from('reservations')
            .select(`
                *,
                slots (
                    instructor
                )
            `)
            .eq('email', dashboardState.user.email)
            .eq('status', 'done');
        
        if (error) {
            console.error('Erreur Supabase:', error);
            showManualInstructorSelection();
            return;
        }
        
        if (!reservations || reservations.length === 0) {
            showManualInstructorSelection('Aucune séance effectuée');
            return;
        }
        
        // Compter les heures par moniteur
        const instructorHours = {};
        reservations.forEach(reservation => {
            const instructor = reservation.slots?.instructor || 'Inconnu';
            instructorHours[instructor] = (instructorHours[instructor] || 0) + 1;
        });
        
        // Trouver le moniteur avec le plus d'heures
        let mainInstructor = null;
        let maxHours = 0;
        let totalHours = reservations.length;
        
        for (const [instructor, hours] of Object.entries(instructorHours)) {
            if (hours > maxHours) {
                maxHours = hours;
                mainInstructor = instructor;
            }
        }
        
        const percentage = Math.round((maxHours / totalHours) * 100);
        
        if (percentage >= 75) {
            instructorInfo.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <i class="fas fa-user-tie" style="font-size: 1.5rem; color: #1976d2;"></i>
                    <div>
                        <div style="font-weight: 700; font-size: 1.1rem; color: #333;">${mainInstructor}</div>
                        <div style="font-size: 0.9rem; color: #666;">${maxHours}/${totalHours} séances (${percentage}%)</div>
                    </div>
                </div>
            `;
            selectedInstructorInput.value = mainInstructor;
        } else {
            // Afficher sélection manuelle si aucun moniteur n'atteint 75%
            showManualInstructorSelection(`Aucun moniteur principal (max: ${mainInstructor} ${percentage}%)`, instructorHours);
        }
        
    } catch (err) {
        console.error('Erreur calcul moniteur:', err);
        showManualInstructorSelection('Erreur de calcul');
    }
}

// Afficher la sélection manuelle du moniteur
function showManualInstructorSelection(message = '', instructorHours = {}) {
    const instructorInfo = document.getElementById('instructorInfo');
    const selectedInstructorInput = document.getElementById('selectedInstructor');
    
    // Liste des moniteurs disponibles
    const availableInstructors = Object.keys(instructorHours).length > 0 
        ? Object.keys(instructorHours) 
        : ['Mylène', 'Sammy', 'Nail'];
    
    let html = '';
    if (message) {
        html += `<div style="color: #FF9800; margin-bottom: 0.75rem; font-size: 0.85rem;">
            <i class="fas fa-info-circle"></i> ${message}
        </div>`;
    }
    
    html += `<div style="font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem;">Sélectionne ton moniteur principal :</div>`;
    html += `<select id="manualInstructorSelect" onchange="document.getElementById('selectedInstructor').value = this.value" style="width: 100%; padding: 0.6rem; border: 2px solid #ddd; border-radius: 8px; font-size: 0.95rem;">
        <option value="">-- Choisir un moniteur --</option>`;
    
    availableInstructors.forEach(instructor => {
        const hours = instructorHours[instructor] || 0;
        const label = hours > 0 ? `${instructor} (${hours} séances)` : instructor;
        html += `<option value="${instructor}">${label}</option>`;
    });
    
    html += `</select>`;
    
    instructorInfo.innerHTML = html;
    selectedInstructorInput.value = '';
}

// Soumettre le résultat d'examen
window.submitExamResult = async function(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    // Vérifier que la note est définie
    if (!selectedRating || selectedRating < 1) {
        alert('❌ Merci de donner une note au moniteur (1 à 5 étoiles)');
        return;
    }
    
    // Vérifier qu'un moniteur est sélectionné
    const instructor = document.getElementById('selectedInstructor').value;
    if (!instructor) {
        alert('❌ Impossible de déterminer le moniteur principal. Tu dois avoir effectué au moins 75% de tes heures avec un même moniteur.');
        return;
    }
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    
    try {
        const formData = new FormData(form);
        const data = {
            student_email: dashboardState.user.email,
            student_name: `${dashboardState.user.prenom || ''} ${dashboardState.user.nom || ''}`.trim(),
            result: formData.get('examResult'),
            exam_date: formData.get('examDate'),
            instructor: instructor,
            rating: parseInt(selectedRating),
            appreciation: formData.get('appreciation') || null,
            submitted_at: new Date().toISOString()
        };
        
        // Enregistrer dans Supabase
        const { error } = await window.supabaseClient
            .from('exam_results')
            .insert([data]);
        
        if (error) throw error;
        
        // Succès
        closeExamResultModal();
        
        const resultText = data.result === 'passed' ? 'Félicitations ! 🎉' : 'Courage pour la prochaine fois ! 💪';
        alert(`✅ ${resultText}\n\nTon résultat a été enregistré avec succès.\n\nMerci pour ton retour sur ${instructor} !`);
        
    } catch (err) {
        console.error('Erreur soumission résultat:', err);
        alert('❌ Une erreur est survenue. Veuillez réessayer.');
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
};
