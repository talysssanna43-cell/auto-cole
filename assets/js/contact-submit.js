// Gestion de la soumission du formulaire de contact
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const feedback = document.getElementById('contactFeedback');
        
        // Désactiver le bouton pendant l'envoi
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
        }
        
        try {
            // Récupérer les données du formulaire
            const formData = {
                prenom: document.getElementById('prenom').value.trim(),
                nom: document.getElementById('nom').value.trim(),
                email: document.getElementById('email').value.trim().toLowerCase(),
                telephone: document.getElementById('telephone').value.trim() || null,
                sujet: document.getElementById('sujet').value,
                message: document.getElementById('message').value.trim(),
                newsletter: document.getElementById('newsletter').checked,
                status: 'nouveau'
            };
            
            // Vérifier que Supabase est chargé
            if (!window.supabaseClient) {
                throw new Error('Erreur de connexion. Réessaie dans un instant.');
            }
            
            // Enregistrer dans la base de données
            const { data, error } = await window.supabaseClient
                .from('contact_requests')
                .insert([formData])
                .select();
            
            if (error) {
                console.error('Error submitting contact form:', error);
                throw new Error('Erreur lors de l\'envoi du message. Réessaie plus tard.');
            }
            
            // Afficher le message de succès
            if (feedback) {
                feedback.style.display = 'block';
                feedback.style.background = '#d4edda';
                feedback.style.color = '#155724';
                feedback.style.border = '1px solid #c3e6cb';
                feedback.textContent = '✅ Message envoyé avec succès ! Nous te répondrons dans les plus brefs délais.';
            }
            
            // Réinitialiser le formulaire
            contactForm.reset();
            
            // Faire défiler vers le message de succès
            feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
        } catch (err) {
            console.error('Error:', err);
            
            // Afficher le message d'erreur
            if (feedback) {
                feedback.style.display = 'block';
                feedback.style.background = '#f8d7da';
                feedback.style.color = '#721c24';
                feedback.style.border = '1px solid #f5c6cb';
                feedback.textContent = '❌ ' + (err.message || 'Une erreur est survenue. Réessaie plus tard.');
            }
        } finally {
            // Réactiver le bouton
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer le message';
            }
        }
    });
});
