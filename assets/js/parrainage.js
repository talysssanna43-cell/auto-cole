// Système de parrainage
(function() {
    'use strict';

    let currentUser = null;
    let referralCode = null;

    // Vérifier l'authentification au chargement
    async function checkAuth() {
        const user = JSON.parse(localStorage.getItem('ae_user') || '{}');
        
        if (!user.email) {
            window.location.href = 'connexion.html';
            return;
        }
        
        currentUser = user;
        await initReferralSystem();
    }

    // Initialiser le système de parrainage
    async function initReferralSystem() {
        try {
            // Vérifier si l'utilisateur a déjà un code de parrainage
            const { data: existingReferral, error: fetchError } = await window.supabaseClient
                .from('referrals')
                .select('*')
                .eq('referrer_email', currentUser.email)
                .is('referee_email', null)
                .maybeSingle();

            if (fetchError) {
                console.error('Erreur lors de la vérification du code existant:', fetchError);
            }

            if (existingReferral) {
                // L'utilisateur a déjà un code
                referralCode = existingReferral.referral_code;
                displayReferralCode(referralCode);
            } else {
                // Créer un nouveau code de parrainage
                await createReferralCode();
            }

            // Charger les statistiques et la liste des parrainages
            await loadReferralStats();
            await loadReferralList();

        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            showError('Erreur lors du chargement de ton code de parrainage');
        }
    }

    // Créer un nouveau code de parrainage
    async function createReferralCode() {
        try {
            // Appeler la fonction Supabase pour générer un code unique
            const { data: codeData, error: codeError } = await window.supabaseClient
                .rpc('generate_referral_code', { user_email: currentUser.email });

            if (codeError) throw codeError;

            const newCode = codeData;

            // Insérer le code dans la table referrals
            const { data: referralData, error: insertError } = await window.supabaseClient
                .from('referrals')
                .insert({
                    referrer_email: currentUser.email,
                    referrer_name: `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim(),
                    referral_code: newCode,
                    status: 'pending'
                })
                .select()
                .single();

            if (insertError) throw insertError;

            referralCode = newCode;
            displayReferralCode(newCode);

        } catch (error) {
            console.error('Erreur lors de la création du code:', error);
            showError('Erreur lors de la création de ton code de parrainage');
        }
    }

    // Afficher le code de parrainage et générer le QR code
    function displayReferralCode(code) {
        document.getElementById('loadingSpinner').style.display = 'none';
        document.getElementById('loadingText').style.display = 'none';
        document.getElementById('qrContent').style.display = 'block';
        document.getElementById('referralCodeDisplay').textContent = code;

        // Générer le QR code avec une API externe (évite les problèmes de tracking prevention)
        const referralUrl = `${window.location.origin}/inscription.html?ref=${code}`;
        const qrContainer = document.getElementById('qrCanvas');
        
        // Utiliser l'API QR Server pour générer le QR code
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(referralUrl)}&color=e91e63&bgcolor=ffffff`;
        
        console.log('🔗 URL de parrainage:', referralUrl);
        console.log('📱 QR Code API URL:', qrApiUrl);
        
        // Créer l'image du QR code
        const img = document.createElement('img');
        img.src = qrApiUrl;
        img.alt = 'QR Code de parrainage';
        img.style.width = '250px';
        img.style.height = '250px';
        img.style.display = 'block';
        img.style.margin = '0 auto';
        img.style.borderRadius = '8px';
        
        // Gérer les erreurs de chargement
        img.onerror = function() {
            console.error('❌ Erreur de chargement du QR code');
            qrContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Impossible de charger le QR code</p>
                    <p style="font-size: 0.9rem; color: #666;">Utilise le lien de parrainage ci-dessus</p>
                </div>
            `;
        };
        
        img.onload = function() {
            console.log('✅ QR code chargé avec succès');
        };
        
        // Vider le conteneur et ajouter l'image
        qrContainer.innerHTML = '';
        qrContainer.appendChild(img);
        
        // Stocker l'URL pour le téléchargement
        window.qrCodeImageUrl = qrApiUrl;
    }

    // Charger les statistiques
    async function loadReferralStats() {
        try {
            // Compter tous les parrainages (en tant que parrain)
            const { data: allReferrals, error: allError } = await window.supabaseClient
                .from('referrals')
                .select('*')
                .eq('referrer_email', currentUser.email)
                .not('referee_email', 'is', null);

            if (allError) throw allError;

            const total = allReferrals ? allReferrals.length : 0;
            const completed = allReferrals ? allReferrals.filter(r => r.status === 'completed').length : 0;
            const hoursEarned = allReferrals ? allReferrals.filter(r => r.reward_credited).length : 0;

            document.getElementById('totalReferrals').textContent = total;
            document.getElementById('completedReferrals').textContent = completed;
            document.getElementById('hoursEarned').textContent = `${hoursEarned}h`;

        } catch (error) {
            console.error('Erreur lors du chargement des stats:', error);
        }
    }

    // Charger la liste des parrainages
    async function loadReferralList() {
        try {
            const { data: referrals, error } = await window.supabaseClient
                .from('referrals')
                .select('*')
                .eq('referrer_email', currentUser.email)
                .not('referee_email', 'is', null)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const listContainer = document.getElementById('referralList');

            if (!referrals || referrals.length === 0) {
                listContainer.innerHTML = '<p style="text-align: center; color: #666;">Aucun parrainage pour le moment</p>';
                return;
            }

            listContainer.innerHTML = referrals.map(ref => {
                const statusClass = ref.status === 'completed' ? 'status-completed' : 'status-pending';
                const statusText = ref.status === 'completed' ? '✅ Validé' : '⏳ En attente';
                const date = new Date(ref.created_at).toLocaleDateString('fr-FR');
                
                return `
                    <div class="referral-item">
                        <div class="referral-info">
                            <h4>${ref.referee_name || 'Nouveau filleul'}</h4>
                            <p><i class="fas fa-envelope"></i> ${ref.referee_email || 'Email non disponible'}</p>
                            <p><i class="fas fa-calendar"></i> ${date}</p>
                            ${ref.payment_verified ? '<p style="color: #28a745;"><i class="fas fa-check-circle"></i> Paiement validé</p>' : '<p style="color: #ffc107;"><i class="fas fa-clock"></i> En attente de paiement</p>'}
                        </div>
                        <div class="referral-status ${statusClass}">
                            ${statusText}
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Erreur lors du chargement de la liste:', error);
        }
    }

    // Partager sur WhatsApp
    window.shareWhatsApp = function() {
        const message = `🚗 Rejoins-moi à l'Auto-Ecole Breteuil et utilise mon code de parrainage ${referralCode} pour t'inscrire !\n\n${window.location.origin}/inscription.html?ref=${referralCode}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    // Copier le lien de parrainage
    window.copyReferralLink = function() {
        const referralUrl = `${window.location.origin}/inscription.html?ref=${referralCode}`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(referralUrl).then(() => {
                alert('✅ Lien copié dans le presse-papier !');
            }).catch(err => {
                console.error('Erreur lors de la copie:', err);
                fallbackCopy(referralUrl);
            });
        } else {
            fallbackCopy(referralUrl);
        }
    };

    // Fallback pour la copie
    function fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            alert('✅ Lien copié dans le presse-papier !');
        } catch (err) {
            alert('❌ Impossible de copier le lien. Copie-le manuellement : ' + text);
        }
        document.body.removeChild(textArea);
    }

    // Télécharger le QR code
    window.downloadQRCode = function() {
        if (window.qrCodeImageUrl) {
            const link = document.createElement('a');
            link.download = `parrainage-${referralCode}.png`;
            link.href = window.qrCodeImageUrl;
            link.target = '_blank';
            link.click();
        } else {
            alert('QR code non disponible pour le téléchargement');
        }
    };

    // Déconnexion
    window.logout = function() {
        localStorage.removeItem('ae_user');
        window.location.href = 'connexion.html';
    };

    // Afficher une erreur
    function showError(message) {
        const qrSection = document.getElementById('qrSection');
        qrSection.innerHTML = `
            <div style="color: #dc3545; padding: 2rem; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p style="font-size: 1.1rem; font-weight: 600;">${message}</p>
                <button onclick="location.reload()" class="btn-primary" style="margin-top: 1rem;">
                    Réessayer
                </button>
            </div>
        `;
    }

    // Initialiser au chargement de la page
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAuth);
    } else {
        checkAuth();
    }
})();
