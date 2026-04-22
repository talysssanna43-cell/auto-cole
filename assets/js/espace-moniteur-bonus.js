// Gestion de l'affichage des primes sur l'espace moniteur

async function loadBonusProgress() {
    console.log('🎯 loadBonusProgress called');
    
    const instructorName = localStorage.getItem('instructorName');
    console.log('👤 Instructor name:', instructorName);
    
    if (!instructorName) {
        console.warn('No instructor name found');
        return;
    }
    
    // Toujours afficher la carte de progression
    const bonusCard = document.getElementById('bonusProgressCard');
    console.log('📊 Bonus card element:', bonusCard);
    
    if (bonusCard) {
        bonusCard.style.display = 'block';
        console.log('✅ Bonus card displayed');
    } else {
        console.error('❌ Bonus card element not found!');
    }
    
    try {
        // Récupérer les données de prime du moniteur
        const { data: bonus, error } = await window.supabaseClient
            .from('instructor_bonuses')
            .select('*')
            .eq('instructor', instructorName)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        if (error) {
            console.error('Erreur chargement primes:', error);
            // Afficher avec des valeurs par défaut
            updateBonusDisplay(null);
            return;
        }
        
        if (!bonus) {
            // Pas de données de prime encore - afficher avec des valeurs par défaut
            updateBonusDisplay(null);
            return;
        }
        
        // Afficher avec les vraies données
        updateBonusDisplay(bonus);
        
    } catch (err) {
        console.error('Erreur chargement progression primes:', err);
        updateBonusDisplay(null);
    }
}

function updateBonusDisplay(bonus) {
    // Utiliser les données du bonus ou des valeurs par défaut
    const studentCount = bonus?.total_students || 0;
    const successRate = bonus?.success_rate || 0;
    const bonusAmount = bonus?.bonus_amount || 0;
    
    document.getElementById('bonusStudentCount').textContent = studentCount;
    
    // Calculer le prochain palier
    let nextLevel = '';
    if (successRate < 80) {
        nextLevel = 'Prochain palier : 80% (120€)';
    } else if (successRate < 90) {
        nextLevel = 'Prochain palier : 90% (200€)';
    } else if (successRate < 100) {
        nextLevel = 'Prochain palier : 100% (300€)';
    } else {
        nextLevel = '🏆 Palier maximum atteint !';
    }
    document.getElementById('bonusNextLevel').textContent = nextLevel;
    
    // Mettre à jour la barre de progression style Apple
    const progressBar = document.getElementById('bonusProgressBar');
    const cursor = document.getElementById('bonusCursor');
    const tooltip = document.getElementById('bonusTooltip');
    const tooltipText = document.getElementById('bonusTooltipText');
    
    if (progressBar && cursor && tooltip && tooltipText) {
        // Calculer la position basée sur le nombre d'élèves (0-20)
        const progressPercent = (studentCount / 20) * 100;
        
        // Déterminer la couleur de la barre selon le taux de réussite
        let barColor;
        if (successRate >= 100) {
            // Vert pur à 100%
            barColor = 'linear-gradient(90deg, #34c759 0%, #30d158 100%)';
        } else if (successRate >= 90) {
            // Dégradé vert vers jaune entre 90% et 100%
            const greenToYellow = ((successRate - 90) / 10); // 0 à 90%, 1 à 100%
            barColor = `linear-gradient(90deg, #ffd700 0%, #34c759 ${greenToYellow * 100}%)`;
        } else if (successRate >= 80) {
            // Dégradé orange vers jaune entre 80% et 90%
            const orangeToYellow = ((successRate - 80) / 10); // 0 à 80%, 1 à 90%
            barColor = `linear-gradient(90deg, #ff9500 0%, #ffd700 ${orangeToYellow * 100}%)`;
        } else {
            // Rouge en dessous de 80%
            barColor = 'linear-gradient(90deg, #ff3b30 0%, #ff6b6b 100%)';
        }
        
        // Animer la barre avec la couleur appropriée
        setTimeout(() => {
            progressBar.style.width = `${progressPercent}%`;
            progressBar.style.background = barColor;
            
            // Adapter l'ombre selon la couleur
            if (successRate >= 100) {
                progressBar.style.boxShadow = '0 2px 8px rgba(52, 199, 89, 0.5)';
            } else if (successRate >= 90) {
                progressBar.style.boxShadow = '0 2px 8px rgba(255, 215, 0, 0.5)';
            } else if (successRate >= 80) {
                progressBar.style.boxShadow = '0 2px 8px rgba(255, 149, 0, 0.5)';
            } else {
                progressBar.style.boxShadow = '0 2px 8px rgba(255, 59, 48, 0.5)';
            }
        }, 100);
        
        // Animer le curseur
        setTimeout(() => {
            cursor.style.left = `${progressPercent}%`;
        }, 100);
        
        // Mettre à jour le tooltip
        tooltipText.innerHTML = `
            <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 2px;">${studentCount}/20 élèves</div>
            <div style="font-size: 0.9rem; font-weight: 700; color: #34c759; margin-top: 4px;">${successRate}% de réussite</div>
        `;
        
        // Afficher le tooltip au survol
        cursor.addEventListener('mouseenter', () => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateX(-50%) translateY(-6px)';
        });
        
        cursor.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateX(-50%) translateY(0)';
        });
        
        // Changer la couleur du curseur selon le taux de réussite (même logique que la barre)
        const cursorInner = cursor.querySelector('div');
        if (cursorInner) {
            if (successRate >= 100) {
                // Vert pur à 100%
                cursorInner.style.background = 'linear-gradient(135deg, #34c759 0%, #30d158 100%)';
                cursor.style.boxShadow = '0 4px 16px rgba(52, 199, 89, 0.5), 0 0 0 4px rgba(52, 199, 89, 0.2)';
            } else if (successRate >= 90) {
                // Dégradé jaune vers vert entre 90% et 100%
                const greenToYellow = ((successRate - 90) / 10);
                if (greenToYellow > 0.5) {
                    cursorInner.style.background = 'linear-gradient(135deg, #34c759 0%, #30d158 100%)';
                    cursor.style.boxShadow = '0 4px 16px rgba(52, 199, 89, 0.5), 0 0 0 4px rgba(52, 199, 89, 0.2)';
                } else {
                    cursorInner.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
                    cursor.style.boxShadow = '0 4px 16px rgba(255, 215, 0, 0.5), 0 0 0 4px rgba(255, 215, 0, 0.2)';
                }
            } else if (successRate >= 80) {
                // Dégradé orange vers jaune entre 80% et 90%
                const orangeToYellow = ((successRate - 80) / 10);
                if (orangeToYellow > 0.5) {
                    cursorInner.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
                    cursor.style.boxShadow = '0 4px 16px rgba(255, 215, 0, 0.5), 0 0 0 4px rgba(255, 215, 0, 0.2)';
                } else {
                    cursorInner.style.background = 'linear-gradient(135deg, #ff9500 0%, #ffb84d 100%)';
                    cursor.style.boxShadow = '0 4px 16px rgba(255, 149, 0, 0.5), 0 0 0 4px rgba(255, 149, 0, 0.2)';
                }
            } else {
                // Rouge en dessous de 80%
                cursorInner.style.background = 'linear-gradient(135deg, #ff3b30 0%, #ff6b6b 100%)';
                cursor.style.boxShadow = '0 4px 16px rgba(255, 59, 48, 0.5), 0 0 0 4px rgba(255, 59, 48, 0.2)';
            }
        }
    }
}

// Exporter la fonction
window.loadBonusProgress = loadBonusProgress;
