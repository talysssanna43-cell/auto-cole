// Support Ticket System
(function() {
    'use strict';

    // Créer le bouton flottant discret
    function createFloatingButton() {
        const buttonHTML = `
            <button id="reportIssueBtn" style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: var(--primary-gradient);
                color: white;
                border: none;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                cursor: pointer;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                transition: transform 0.2s, box-shadow 0.2s;
            " title="Signaler un problème">
                <i class="fas fa-exclamation-circle"></i>
            </button>
        `;
        
        document.body.insertAdjacentHTML('beforeend', buttonHTML);
        
        // Effet hover
        const btn = document.getElementById('reportIssueBtn');
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
            this.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });
    }

    // Créer le modal HTML
    function createReportModal() {
        const modalHTML = `
            <div id="reportIssueModal" class="support-modal" style="display: none !important; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); overflow: auto; align-items: center; justify-content: center;">
                <div class="support-modal-content" style="background-color: #fefefe; margin: auto; padding: 2rem; border-radius: 12px; max-width: 600px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h2 style="margin: 0; color: var(--primary-color);"><i class="fas fa-exclamation-circle"></i> Signaler un problème</h2>
                        <span class="support-close" style="font-size: 2rem; font-weight: bold; color: #aaa; cursor: pointer; line-height: 1;">&times;</span>
                    </div>
                    
                    <form id="reportIssueForm">
                        <div style="margin-bottom: 1.5rem;">
                            <label for="reportMessage" style="display: block; font-weight: 600; margin-bottom: 0.5rem;">
                                Décris le problème rencontré *
                            </label>
                            <textarea 
                                id="reportMessage" 
                                name="message" 
                                rows="6" 
                                required
                                placeholder="Explique-nous en détail le problème que tu rencontres..."
                                style="width: 100%; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 8px; font-family: inherit; font-size: 1rem; resize: vertical;"
                            ></textarea>
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                            <label for="reportAttachment" style="display: block; font-weight: 600; margin-bottom: 0.5rem;">
                                Ajouter une capture d'écran (optionnel)
                            </label>
                            <input 
                                type="file" 
                                id="reportAttachment" 
                                name="attachment" 
                                accept="image/*,.pdf"
                                style="width: 100%; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 8px;"
                            >
                            <small style="color: #666; display: block; margin-top: 0.5rem;">
                                <i class="fas fa-info-circle"></i> Formats acceptés : JPG, PNG, PDF (max 5MB)
                            </small>
                        </div>

                        <div id="reportFeedback" style="margin-bottom: 1rem; padding: 0.75rem; border-radius: 8px; display: none;"></div>

                        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                            <button 
                                type="button" 
                                class="btn-cancel"
                                style="padding: 0.75rem 1.5rem; border: 2px solid #ddd; background: white; color: #666; border-radius: 8px; cursor: pointer; font-weight: 600;"
                            >
                                Annuler
                            </button>
                            <button 
                                type="submit" 
                                class="btn-submit"
                                style="padding: 0.75rem 1.5rem; border: none; background: var(--primary-gradient); color: white; border-radius: 8px; cursor: pointer; font-weight: 600;"
                            >
                                <i class="fas fa-paper-plane"></i> Envoyer
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Initialiser le système
    function init() {
        // Attendre que Supabase soit disponible
        function waitForSupabase() {
            if (!window.supabaseClient) {
                // Réessayer après 100ms
                setTimeout(waitForSupabase, 100);
                return;
            }
            
            // Créer le bouton flottant
            createFloatingButton();
            
            // Créer le modal
            createReportModal();

            const modal = document.getElementById('reportIssueModal');
            const btn = document.getElementById('reportIssueBtn');
            const closeBtn = modal.querySelector('.support-close');
            const cancelBtn = modal.querySelector('.btn-cancel');
            const form = document.getElementById('reportIssueForm');

        // Ouvrir le modal
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                modal.style.display = 'flex';
                modal.style.setProperty('display', 'flex', 'important');
            });
        }

        // Fermer le modal
        function closeModal() {
            modal.style.display = 'none';
            modal.style.setProperty('display', 'none', 'important');
            form.reset();
            document.getElementById('reportFeedback').style.display = 'none';
        }

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        // Fermer si clic en dehors du modal
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Soumettre le formulaire
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const submitBtn = form.querySelector('.btn-submit');
            const feedback = document.getElementById('reportFeedback');
            const message = document.getElementById('reportMessage').value.trim();
            const attachmentInput = document.getElementById('reportAttachment');

            if (!message) {
                showFeedback('Merci de décrire le problème.', 'error');
                return;
            }

            // Vérifier si l'utilisateur est connecté (clé ae_user)
            let user = JSON.parse(localStorage.getItem('ae_user') || '{}');
            
            if (!user.email) {
                showFeedback('Tu dois être connecté pour signaler un problème.', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';

            try {
                let attachmentUrl = null;

                // Upload du fichier si présent
                if (attachmentInput.files.length > 0) {
                    const file = attachmentInput.files[0];
                    
                    // Vérifier la taille (5MB max)
                    if (file.size > 5 * 1024 * 1024) {
                        showFeedback('Le fichier est trop volumineux (max 5MB).', 'error');
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer';
                        return;
                    }

                    // Nettoyer le nom du fichier (supprimer espaces et accents)
                    const cleanFileName = file.name
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
                        .replace(/[^a-zA-Z0-9.-]/g, '_'); // Remplacer caractères spéciaux par _
                    
                    // Upload vers Supabase Storage
                    const fileName = `${Date.now()}_${cleanFileName}`;
                    const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
                        .from('support-attachments')
                        .upload(fileName, file);

                    if (uploadError) {
                        console.error('Upload error:', uploadError);
                        showFeedback('Erreur lors de l\'upload du fichier.', 'error');
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer';
                        return;
                    }

                    // Récupérer l'URL publique
                    const { data: urlData } = window.supabaseClient.storage
                        .from('support-attachments')
                        .getPublicUrl(fileName);
                    
                    attachmentUrl = urlData.publicUrl;
                }

                // Insérer le ticket dans la base de données
                const { data, error } = await window.supabaseClient
                    .from('support_tickets')
                    .insert({
                        user_email: user.email,
                        user_name: `${user.prenom || ''} ${user.nom || ''}`.trim(),
                        message: message,
                        attachment_url: attachmentUrl,
                        status: 'pending'
                    });

                if (error) {
                    console.error('Insert error:', error);
                    showFeedback('Erreur lors de l\'envoi. Réessaie.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer';
                    return;
                }

                showFeedback('✅ Ton signalement a été envoyé ! L\'équipe te répondra rapidement.', 'success');
                
                setTimeout(() => {
                    closeModal();
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer';
                }, 2000);

            } catch (err) {
                console.error('Error:', err);
                showFeedback('Une erreur est survenue. Réessaie.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer';
            }
        });

            function showFeedback(message, type) {
                const feedback = document.getElementById('reportFeedback');
                feedback.textContent = message;
                feedback.style.display = 'block';
                feedback.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
                feedback.style.color = type === 'success' ? '#155724' : '#721c24';
                feedback.style.border = `1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'}`;
            }
        }
        
        // Démarrer l'attente de Supabase
        waitForSupabase();
    }

    // Initialiser quand le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
