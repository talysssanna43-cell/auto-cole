// Gestion de la saisie de résultat d'examen par l'admin
let adminSelectedRating = 0;

// Ouvrir la modal pour un élève
window.openAdminExamResultModal = async function(studentEmail, studentName) {
    // Fermer la modal de profil de l'élève d'abord
    const studentDetailsModal = document.getElementById('studentDetailsModal');
    if (studentDetailsModal) {
        studentDetailsModal.classList.remove('active');
    }
    
    const modal = document.getElementById('adminExamResultModal');
    if (!modal) return;
    
    // Remplir les infos de l'élève
    document.getElementById('adminExamStudentEmail').value = studentEmail;
    document.getElementById('adminExamStudentName').value = studentName;
    document.getElementById('adminExamStudentDisplay').textContent = studentName;
    
    // Calculer le moniteur principal
    await calculateStudentMainInstructor(studentEmail);
    
    // Reset form
    document.getElementById('adminExamResultForm').reset();
    adminSelectedRating = 0;
    updateAdminStarDisplay();
    
    // Définir la date par défaut à aujourd'hui
    document.getElementById('adminExamDate').valueAsDate = new Date();
    
    modal.style.display = 'flex';
};

// Fermer la modal
window.closeAdminExamResultModal = function() {
    const modal = document.getElementById('adminExamResultModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('adminExamResultForm').reset();
        adminSelectedRating = 0;
        updateAdminStarDisplay();
    }
};

// Définir la note (étoiles)
window.setAdminRating = function(rating) {
    adminSelectedRating = rating;
    document.getElementById('adminRatingValue').value = rating;
    updateAdminStarDisplay();
};

// Mettre à jour l'affichage des étoiles
function updateAdminStarDisplay() {
    const stars = document.querySelectorAll('.rating-star-admin');
    stars.forEach((star, index) => {
        if (index < adminSelectedRating) {
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

// Calculer le moniteur principal de l'élève (75% des heures)
async function calculateStudentMainInstructor(studentEmail) {
    const instructorDisplay = document.getElementById('adminExamInstructorDisplay');
    const instructorInput = document.getElementById('adminExamInstructor');
    
    if (!window.supabaseClient || !studentEmail) {
        showManualInstructorSelection();
        return;
    }
    
    try {
        // Récupérer toutes les séances effectuées de l'élève
        const { data: reservations, error } = await window.supabaseClient
            .from('reservations')
            .select(`
                *,
                slots (
                    instructor
                )
            `)
            .eq('email', studentEmail)
            .eq('status', 'done');
        
        if (error) {
            console.error('Erreur Supabase:', error);
            showManualInstructorSelection();
            return;
        }
        
        if (!reservations || reservations.length === 0) {
            showManualInstructorSelection();
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
            instructorDisplay.innerHTML = `Moniteur: <strong>${mainInstructor}</strong> (${maxHours}/${totalHours} séances - ${percentage}%)`;
            instructorInput.value = mainInstructor;
        } else {
            // Afficher sélection manuelle si pas de moniteur principal
            showManualInstructorSelection(instructorHours);
        }
        
    } catch (err) {
        console.error('Erreur calcul moniteur:', err);
        showManualInstructorSelection();
    }
}

// Afficher le sélecteur manuel de moniteur
function showManualInstructorSelection(instructorHours = {}) {
    const instructorDisplay = document.getElementById('adminExamInstructorDisplay');
    const instructorInput = document.getElementById('adminExamInstructor');
    
    const instructors = Object.keys(instructorHours).length > 0 
        ? Object.keys(instructorHours) 
        : ['Mylène', 'Sammy', 'Nail'];
    
    let html = '<label style="display: block; font-weight: 600; margin-bottom: 6px;">Sélectionne le moniteur :</label>';
    html += '<select id="manualInstructorSelect" onchange="document.getElementById(\'adminExamInstructor\').value = this.value" required style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 0.95rem;">';
    html += '<option value="">-- Choisir un moniteur --</option>';
    
    instructors.forEach(instructor => {
        const hours = instructorHours[instructor] || 0;
        const label = hours > 0 ? `${instructor} (${hours} séances)` : instructor;
        html += `<option value="${instructor}">${label}</option>`;
    });
    
    html += '</select>';
    
    instructorDisplay.innerHTML = html;
    instructorInput.value = '';
}

// Soumettre le résultat d'examen
window.submitAdminExamResult = async function(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    // Vérifier que la note est définie
    if (!adminSelectedRating || adminSelectedRating < 1) {
        alert('❌ Merci de donner une note au moniteur (1 à 5 étoiles)');
        return;
    }
    
    // Vérifier qu'un moniteur est déterminé
    const instructor = document.getElementById('adminExamInstructor').value;
    if (!instructor) {
        alert('❌ Impossible de déterminer le moniteur principal pour cet élève.');
        return;
    }
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    
    try {
        const studentEmail = document.getElementById('adminExamStudentEmail').value;
        const studentName = document.getElementById('adminExamStudentName').value;
        const examDate = document.getElementById('adminExamDate').value;
        const result = document.querySelector('input[name="adminExamResult"]:checked').value;
        const appreciation = document.getElementById('adminAppreciation').value;
        
        const data = {
            student_email: studentEmail,
            student_name: studentName,
            result: result,
            exam_date: examDate,
            instructor: instructor,
            rating: parseInt(adminSelectedRating),
            appreciation: appreciation || null,
            submitted_at: new Date().toISOString(),
            submitted_by_admin: true
        };
        
        // Enregistrer dans Supabase
        const { error } = await window.supabaseClient
            .from('exam_results')
            .insert([data]);
        
        if (error) throw error;
        
        // Succès
        closeAdminExamResultModal();
        
        const resultText = data.result === 'passed' ? 'Réussi ✅' : 'Échoué ❌';
        alert(`✅ Résultat enregistré avec succès !\n\nÉlève: ${studentName}\nRésultat: ${resultText}\nMoniteur: ${instructor}\nNote: ${adminSelectedRating}/5`);
        
        // Rafraîchir les taux de réussite
        if (typeof loadInstructorSuccessRates === 'function') {
            await loadInstructorSuccessRates();
        }
        
    } catch (err) {
        console.error('Erreur soumission résultat:', err);
        alert('❌ Une erreur est survenue. Veuillez réessayer.');
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
};
