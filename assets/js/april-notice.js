// ============================================
// MODAL D'INFORMATION AVRIL
// ============================================

(function() {
    // Vérifier si on est en mars ou avril
    const now = new Date();
    const currentMonth = now.getMonth(); // 0 = janvier, 2 = mars, 3 = avril
    
    // Vérifier si l'utilisateur a déjà vu la notification
    const hasSeenNotice = localStorage.getItem('april_notice_seen_2026');
    
    // Afficher de mars à avril (mois 2 et 3) ET si pas déjà vu
    if ((currentMonth === 2 || currentMonth === 3) && !hasSeenNotice) {
        // Créer la modal
        const modalHTML = `
            <div id="aprilNoticeModal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                padding: 20px;
            ">
                <div style="
                    background: white;
                    border-radius: 20px;
                    max-width: 500px;
                    width: 100%;
                    padding: 40px 30px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    text-align: center;
                    position: relative;
                ">
                    <div style="
                        width: 80px;
                        height: 80px;
                        margin: 0 auto 20px;
                        background: linear-gradient(135deg, #FF69B4 0%, #E91E63 100%);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <i class="fas fa-info-circle" style="font-size: 2.5rem; color: white;"></i>
                    </div>
                    
                    <h2 style="
                        font-size: 1.75rem;
                        font-weight: 700;
                        color: #1A1A2E;
                        margin-bottom: 20px;
                    ">Information importante</h2>
                    
                    <p style="
                        font-size: 1.1rem;
                        color: #4B5563;
                        line-height: 1.6;
                        margin-bottom: 15px;
                    ">
                        <strong style="color: #FF69B4;">Pendant le mois d'avril</strong>, notre bureau sera ouvert uniquement le <strong>vendredi de 17h à 19h</strong>.
                    </p>
                    
                    <p style="
                        font-size: 1rem;
                        color: #6B7280;
                        line-height: 1.6;
                        margin-bottom: 30px;
                    ">
                        N'hésitez pas à nous contacter si vous avez besoin d'informations ou pour prendre rendez-vous.
                    </p>
                    
                    <button id="aprilNoticeOkBtn" style="
                        background: linear-gradient(135deg, #FF69B4 0%, #E91E63 100%);
                        color: white;
                        border: none;
                        padding: 14px 40px;
                        border-radius: 12px;
                        font-size: 1.1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 4px 15px rgba(255, 105, 180, 0.3);
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(255, 105, 180, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(255, 105, 180, 0.3)';">
                        J'ai compris
                    </button>
                </div>
            </div>
        `;
        
        // Ajouter la modal au body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Gérer le clic sur le bouton OK
        const okBtn = document.getElementById('aprilNoticeOkBtn');
        const modal = document.getElementById('aprilNoticeModal');
        
        if (okBtn && modal) {
            okBtn.addEventListener('click', function() {
                // Sauvegarder dans localStorage que l'utilisateur a vu la notification
                localStorage.setItem('april_notice_seen_2026', 'true');
                
                // Fermer la modal avec animation
                modal.style.opacity = '1';
                modal.style.transition = 'opacity 0.3s';
                modal.style.opacity = '0';
                
                setTimeout(() => {
                    modal.remove();
                }, 300);
            });
        }
    }
})();
