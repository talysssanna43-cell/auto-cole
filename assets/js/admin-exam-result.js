// Gestion de la saisie de resultat d'examen par l'admin
let adminSelectedRating = 0;

// Ouvrir la modal pour un eleve
window.openAdminExamResultModal = async function(studentEmail, studentName) {
    // Fermer la modal de profil de l'eleve d'abord
    const studentDetailsModal = document.getElementById('studentDetailsModal');
    if (studentDetailsModal) {
        studentDetailsModal.classList.remove('active');
    }
    
    const modal = document.getElementById('adminExamResultModal');
    if (!modal) return;
    
    // Remplir les infos de l'eleve
    document.getElementById('adminExamStudentEmail').value = studentEmail;
    document.getElementById('adminExamStudentName').value = studentName;
    document.getElementById('adminExamStudentDisplay').textContent = studentName;
    
    // Calculer le moniteur principal
    await calculateStudentMainInstructor(studentEmail);
    
    // Reset form
    document.getElementById('adminExamResultForm').reset();
    adminSelectedRating = 0;
    updateAdminStarDisplay();
    
    // Definir la date par defaut a aujourd'hui
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

// Definir la note (etoiles)
window.setAdminRating = function(rating) {
    adminSelectedRating = rating;
    document.getElementById('adminRatingValue').value = rating;
    updateAdminStarDisplay();
};

// Mettre a jour l'affichage des etoiles
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

// Calculer le moniteur principal de l'eleve (75% des heures)
async function calculateStudentMainInstructor(studentEmail) {
    const instructorDisplay = document.getElementById('adminExamInstructorDisplay');
    const instructorInput = document.getElementById('adminExamInstructor');
    
    if (!window.supabaseClient || !studentEmail) {
        showManualInstructorSelection();
        return;
    }
    
    try {
        // Recuperer toutes les seances effectuees de l'eleve
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
            instructorDisplay.innerHTML = `Moniteur: <strong>${mainInstructor}</strong> (${maxHours}/${totalHours} seances - ${percentage}%)`;
            instructorInput.value = mainInstructor;
        } else {
            // Afficher selection manuelle si pas de moniteur principal
            showManualInstructorSelection(instructorHours);
        }
        
    } catch (err) {
        console.error('Erreur calcul moniteur:', err);
        showManualInstructorSelection();
    }
}

// Afficher le selecteur manuel de moniteur
function showManualInstructorSelection(instructorHours = {}) {
    const instructorDisplay = document.getElementById('adminExamInstructorDisplay');
    const instructorInput = document.getElementById('adminExamInstructor');
    
    const instructors = Object.keys(instructorHours).length > 0 
        ? Object.keys(instructorHours) 
        : ['Daho', 'Sammy', 'Nail'];
    
    let html = '<label style="display: block; font-weight: 600; margin-bottom: 6px;">Selectionne le moniteur :</label>';
    html += '<select id="manualInstructorSelect" onchange="document.getElementById(\'adminExamInstructor\').value = this.value" required style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 0.95rem;">';
    html += '<option value="">-- Choisir un moniteur --</option>';
    
    instructors.forEach(instructor => {
        const hours = instructorHours[instructor] || 0;
        const label = hours > 0 ? `${instructor} (${hours} seances)` : instructor;
        html += `<option value="${instructor}">${label}</option>`;
    });
    
    html += '</select>';
    
    instructorDisplay.innerHTML = html;
    instructorInput.value = '';
}

// Soumettre le resultat d'examen
window.submitAdminExamResult = async function(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    // Verifier que la note est definie
    if (!adminSelectedRating || adminSelectedRating < 1) {
        alert('Merci de donner une note au moniteur (1 a 5 etoiles)');
        return;
    }
    
    // Verifier qu'un moniteur est determine
    const instructor = document.getElementById('adminExamInstructor').value;
    if (!instructor) {
        alert('Impossible de determiner le moniteur principal pour cet eleve.');
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
        
        const token = window.authSession?.getToken?.();
        if (!token) throw new Error('AUTH_REQUIRED');
        const response = await fetch('/.netlify/functions/admin-submit-exam-result', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        const payload = await response.json().catch(() => ({ ok: false, error: 'INVALID_SERVER_RESPONSE' }));
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'EXAM_RESULT_FAILED');
        
        // Succes - fermer la modal et rafraichir
        closeAdminExamResultModal();
        
        // Rafraichir les taux de reussite
        if (typeof loadInstructorSuccessRates === 'function') {
            await loadInstructorSuccessRates();
        }
        
        // Notification discrete (optionnel)
        console.log(`Resultat enregistre: ${studentName} - ${data.result} - ${instructor} - ${adminSelectedRating}/5`);
        
    } catch (err) {
        console.error('Erreur soumission resultat:', err);
        alert('Une erreur est survenue. Veuillez reessayer.');
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
};


