// ============================================
// VÉRIFICATION STATUT PERMIS ÉLÈVE
// ============================================

// Fonction pour vérifier si l'élève a réussi son permis
async function checkStudentExamStatus(studentEmail) {
    try {
        if (!window.supabaseClient || !studentEmail) return null;
        
        const { data, error } = await window.supabaseClient
            .from('exam_results')
            .select('result, exam_date, instructor')
            .eq('student_email', studentEmail)
            .eq('result', 'passed')
            .order('exam_date', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        if (error) {
            console.error('Erreur vérification statut permis:', error);
            return null;
        }
        
        return data; // Retourne les données si l'élève a réussi, null sinon
    } catch (err) {
        console.error('Erreur:', err);
        return null;
    }
}

// Fonction pour afficher le message de félicitations
function displaySuccessMessage(examData) {
    const mainContent = document.querySelector('.student-dashboard');
    if (!mainContent) {
        console.error('❌ Container .student-dashboard non trouvé');
        return;
    }
    
    console.log('✅ Affichage du message de félicitations');
    
    const examDate = new Date(examData.exam_date).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    
    mainContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; padding: 40px; text-align: center;">
            <div style="background: linear-gradient(135deg, #34c759, #30d158); width: 120px; height: 120px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; box-shadow: 0 8px 24px rgba(52, 199, 89, 0.4);">
                <i class="fas fa-trophy" style="font-size: 4rem; color: white;"></i>
            </div>
            
            <h1 style="font-size: 2.5rem; font-weight: 700; color: var(--text); margin-bottom: 16px;">
                🎉 Félicitations !
            </h1>
            
            <p style="font-size: 1.3rem; color: var(--text2); margin-bottom: 32px; max-width: 600px;">
                Vous avez <strong style="color: #34c759;">réussi votre permis de conduire</strong> le ${examDate} !
            </p>
            
            <div style="background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; max-width: 500px; box-shadow: var(--shadow);">
                <p style="font-size: 1rem; color: var(--text2); line-height: 1.6; margin-bottom: 16px;">
                    <i class="fas fa-info-circle" style="color: var(--blue); margin-right: 8px;"></i>
                    Vous n'êtes plus en mesure de réserver des heures de conduite.
                </p>
                <p style="font-size: 0.95rem; color: var(--text2); line-height: 1.6;">
                    Merci d'avoir choisi notre auto-école. Nous vous souhaitons une excellente route ! 🚗
                </p>
            </div>
            
            <div style="margin-top: 32px;">
                <a href="index.html" style="display: inline-block; background: var(--blue); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.2s;">
                    <i class="fas fa-home" style="margin-right: 8px;"></i>
                    Retour à l'accueil
                </a>
            </div>
        </div>
    `;
}

// Exposer les fonctions globalement
window.checkStudentExamStatus = checkStudentExamStatus;
window.displaySuccessMessage = displaySuccessMessage;
