// Fonction pour générer un mot de passe aléatoire simple et lisible
function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password;
}

// Fonction de hashage identique à supabaseClient.js (fallback)
async function localHashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Fonction pour envoyer l'email avec le nouveau mot de passe
async function sendPasswordResetEmail(userEmail, userName, newPassword) {
    try {
        // Détecter l'URL du site selon l'environnement
        const siteUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:8888'  // Netlify Dev
            : 'https://autoecolebreteuil.com';
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                    .password-box { background: white; border-left: 4px solid #ee0979; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .button { display: inline-block; background: #ee0979; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔑 Réinitialisation de mot de passe</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour <strong>${userName}</strong>,</p>
                        <p>Nous avons reçu une demande de réinitialisation de mot de passe pour ton compte Auto-École Breteuil.</p>
                        
                        <div class="password-box">
                            <h3 style="margin-top: 0; color: #ee0979;">🔐 Tes nouveaux identifiants</h3>
                            <p><strong>Email :</strong> ${userEmail}</p>
                            <p><strong>Nouveau mot de passe :</strong> ${newPassword}</p>
                            <p style="font-size: 0.9em; color: #666; margin-top: 15px;">⚠️ Pour ta sécurité, nous te recommandons de changer ce mot de passe après ta première connexion.</p>
                        </div>
                        
                        <p>Tu peux maintenant te connecter à ton espace élève avec ces nouveaux identifiants.</p>
                        <p style="text-align: center;">
                            <a href="${siteUrl}/connexion.html" class="button">Se connecter</a>
                        </p>
                        
                        <p style="font-size: 0.9em; color: #666; margin-top: 20px;">
                            <strong>Note :</strong> Si tu n'as pas demandé cette réinitialisation, contacte-nous immédiatement.
                        </p>
                    </div>
                    <div class="footer">
                        <p>Auto-École Breteuil<br>
                        1 Rue Édouard Delanglade, 13006 Marseille<br>
                        📞 04 91 53 36 98 | ✉️ breteuilautoecole@gmail.com</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        // Envoyer via EmailJS
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                service_id: 'service_abc123',
                template_id: 'template_h7oyhzg',
                user_id: '8ysJSNqiNmOHg_pxC',
                template_params: {
                    to_email: userEmail,
                    to_name: userName,
                    subject: '🔑 Réinitialisation de ton mot de passe - Auto-École Breteuil',
                    html_content: htmlContent
                }
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error sending email:', errorText);
            throw new Error('Failed to send email');
        }
        
        console.log('Password reset email sent successfully to', userEmail);
        
    } catch (err) {
        console.error('Error sending password reset email:', err);
        throw err;
    }
}

// Fonction pour afficher un message
function showMessage(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
    
    // Masquer l'autre message
    const otherElementId = isError ? 'successMessage' : 'errorMessage';
    document.getElementById(otherElementId).style.display = 'none';
}

// Log de chargement du script
console.log('🚀 Script reset-password.js chargé !');
console.log('📍 URL actuelle:', window.location.href);

// Alerte visible pour confirmer le chargement (temporaire pour debug)
setTimeout(() => {
    console.log('⏰ Script actif depuis 1 seconde');
}, 1000);

// Gestion du formulaire
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM chargé, initialisation du formulaire...');
    const resetForm = document.getElementById('resetForm');
    
    if (!resetForm) {
        console.error('❌ Formulaire #resetForm introuvable !');
        return;
    }
    
    console.log('✅ Formulaire trouvé:', resetForm);
    
    resetForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const email = document.getElementById('email').value.trim().toLowerCase();
        const submitButton = resetForm.querySelector('button[type="submit"]');
        
        // Désactiver le bouton pendant le traitement
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement en cours...';
        
        try {
            // Vérifier que Supabase est chargé
            if (!window.supabaseClient) {
                throw new Error('Chargement en cours, réessaie dans un instant.');
            }
            
            // Utiliser la fonction de hashage locale ou globale
            const hashFn = window.hashPassword || localHashPassword;
            
            // Vérifier si l'utilisateur existe
            console.log('🔍 Recherche utilisateur:', email);
            const { data: user, error: userError } = await window.supabaseClient
                .from('users')
                .select('id, prenom, nom, email, password_hash')
                .ilike('email', email)
                .maybeSingle();
            
            if (userError) {
                console.error('❌ Error fetching user:', userError);
                throw new Error('Erreur lors de la vérification du compte.');
            }
            
            if (!user) {
                throw new Error('Aucun compte trouvé avec cet email. Vérifie ton adresse ou inscris-toi.');
            }
            
            console.log('✅ Utilisateur trouvé:', user.id, user.prenom);
            console.log('🔑 Hash actuel en base:', user.password_hash);
            
            // Générer un nouveau mot de passe
            const newPassword = generatePassword();
            console.log('🆕 Nouveau mot de passe généré:', newPassword);
            
            const hashedPassword = await hashFn(newPassword);
            console.log('🔐 Hash du nouveau mot de passe:', hashedPassword);
            
            // Vérifier que le hash fonctionne en re-hashant
            const verifyHash = await hashFn(newPassword);
            console.log('✅ Vérification hash (doit être identique):', verifyHash);
            console.log('🔄 Hash identique ?', hashedPassword === verifyHash);
            
            // Mettre à jour le mot de passe dans la base de données
            const { data: updateData, error: updateError } = await window.supabaseClient
                .from('users')
                .update({ password_hash: hashedPassword })
                .eq('email', user.email)
                .select('id, password_hash');
            
            if (updateError) {
                console.error('❌ Error updating password:', updateError);
                throw new Error('Erreur lors de la mise à jour du mot de passe. Contacte l\'auto-école.');
            }
            
            // Vérifier que la mise à jour a bien fonctionné
            if (!updateData || updateData.length === 0) {
                console.error('❌ Aucune ligne mise à jour ! Possible problème de permissions RLS.');
                throw new Error('Erreur: Le mot de passe n\'a pas pu être mis à jour. Contacte l\'auto-école.');
            }
            
            console.log('✅ Mot de passe mis à jour en base:', updateData[0].password_hash);
            console.log('🔄 Hash en base correspond ?', updateData[0].password_hash === hashedPassword);
            
            // Vérifier immédiatement que le mot de passe fonctionne
            const verifyLoginHash = await hashFn(newPassword);
            const { data: verifyUser, error: verifyError } = await window.supabaseClient
                .from('users')
                .select('password_hash')
                .eq('email', user.email)
                .maybeSingle();
            
            if (verifyError || !verifyUser) {
                console.error('❌ Impossible de vérifier le mot de passe après mise à jour');
            } else {
                console.log('🔍 Vérification finale - Hash en base:', verifyUser.password_hash);
                console.log('🔍 Vérification finale - Hash calculé:', verifyLoginHash);
                console.log('✅ Correspondance:', verifyUser.password_hash === verifyLoginHash);
            }
            
            // Envoyer l'email avec le nouveau mot de passe
            const userName = `${user.prenom} ${user.nom || ''}`.trim();
            await sendPasswordResetEmail(user.email, userName, newPassword);
            
            console.log('📧 Email envoyé avec succès !');
            console.log('📋 Pour se connecter: email=' + user.email + ', mdp=' + newPassword);
            
            // Afficher le message de succès
            showMessage('successMessage', 
                `✅ Un email contenant ton nouveau mot de passe a été envoyé à ${email}. Vérifie ta boîte de réception !`,
                false
            );
            
            // Réinitialiser le formulaire
            resetForm.reset();
            
            // Rediriger vers la page de connexion après 5 secondes
            setTimeout(() => {
                window.location.href = 'connexion.html';
            }, 5000);
            
        } catch (error) {
            console.error('Error in password reset:', error);
            showMessage('errorMessage', error.message || 'Une erreur est survenue. Réessaie plus tard.', true);
        } finally {
            // Réactiver le bouton
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Réinitialiser mon mot de passe';
        }
    });
});
