// ============================================
// INSTRUCTOR SUCCESS RATES
// ============================================

async function loadInstructorSuccessRates() {
    try {
        if (!window.supabaseClient) return;
        
        const { data: bonuses, error } = await window.supabaseClient
            .from('instructor_bonuses')
            .select('instructor, success_rate, total_students, final_score, average_rating, bonus_amount')
            .eq('status', 'active')
            .order('instructor');
        
        if (error) {
            console.error('Erreur chargement taux de réussite:', error);
            return;
        }
        
        console.log('📊 Taux de réussite des moniteurs:', bonuses);
        cachedBonuses = bonuses || [];
        
        // Au chargement initial, afficher tous les moniteurs sans filtrage
        displayInstructorSuccessRates(cachedBonuses, null);
    } catch (err) {
        console.error('Erreur:', err);
    }
}

function displayInstructorSuccessRates(bonuses, instructorFilter = null) {
    const container = document.getElementById('instructorSuccessRates');
    console.log('📦 Container instructorSuccessRates:', container);
    if (!container) {
        console.error('❌ Container instructorSuccessRates NOT FOUND!');
        return;
    }
    
    console.log('🎯 displayInstructorSuccessRates appelée avec:', {
        bonusesCount: bonuses?.length || 0,
        instructorFilter: instructorFilter,
        bonuses: bonuses
    });
    
    // Afficher les noms exacts des moniteurs
    if (bonuses && bonuses.length > 0) {
        bonuses.forEach(b => {
            console.log(`👤 Moniteur trouvé: "${b.instructor}" (longueur: ${b.instructor.length})`);
        });
    }
    
    // Filtrer par moniteur si un filtre est spécifié
    let filteredBonuses = bonuses || [];
    if (instructorFilter) {
        console.log(`🔎 Recherche de: "${instructorFilter}" (longueur: ${instructorFilter.length})`);
        filteredBonuses = filteredBonuses.filter(b => {
            const match = b.instructor === instructorFilter;
            console.log(`  - Comparaison "${b.instructor}" === "${instructorFilter}": ${match}`);
            return match;
        });
        console.log(`🔍 Filtrage pour "${instructorFilter}":`, filteredBonuses);
    }
    
    if (filteredBonuses.length === 0) {
        console.log('⚠️ Aucun bonus trouvé pour ce moniteur');
        container.innerHTML = '';
        return;
    }
    
    let html = '<div style="background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow);">';
    html += '<h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;"><i class="fas fa-trophy" style="color: var(--orange);"></i> Taux de réussite des moniteurs</h3>';
    html += '<div style="display: flex; flex-direction: column; gap: 16px;">';
    
    filteredBonuses.forEach(bonus => {
        const successRate = bonus.success_rate || 0;
        const studentCount = bonus.total_students || 0;
        const finalScore = bonus.final_score || 0;
        
        // Déterminer la couleur selon le taux de réussite
        let color1, color2;
        if (successRate >= 100) {
            color1 = '#34c759';
            color2 = '#30d158';
        } else if (successRate >= 90) {
            const ratio = (successRate - 90) / 10;
            color1 = `rgb(${Math.round(255 - (255 - 52) * ratio)}, ${Math.round(215 + (199 - 215) * ratio)}, ${Math.round(0 + (89 - 0) * ratio)})`;
            color2 = '#34c759';
        } else if (successRate >= 80) {
            const ratio = (successRate - 80) / 10;
            color1 = `rgb(255, ${Math.round(149 + (215 - 149) * ratio)}, 0)`;
            color2 = '#ffd700';
        } else {
            color1 = '#ff3b30';
            color2 = '#ff6b6b';
        }
        
        html += `
            <div style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 8px; border-radius: 8px; transition: background 0.2s;" 
                 onclick="showInstructorExamResults('${bonus.instructor}')"
                 onmouseover="this.style.background='rgba(0,0,0,0.03)'"
                 onmouseout="this.style.background='transparent'"
                 title="Cliquer pour voir les détails">
                <div style="min-width: 100px; font-weight: 600; font-size: 0.95rem;">${bonus.instructor}</div>
                <div style="flex: 1; position: relative; height: 12px; background: rgba(0,0,0,0.06); border-radius: 6px; overflow: visible;">
                    <div style="position: absolute; left: 0; top: 0; bottom: 0; width: ${Math.min(studentCount / 20 * 100, 100)}%; background: linear-gradient(90deg, ${color1}, ${color2}); border-radius: 6px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 8px ${color1}40;"></div>
                    <div style="position: absolute; left: ${Math.min(studentCount / 20 * 100, 100)}%; top: 50%; transform: translate(-50%, -50%); width: 32px; height: 32px; background: white; border-radius: 50%; box-shadow: 0 4px 16px rgba(0,0,0,0.2), 0 0 0 4px ${color1}33; display: flex; align-items: center; justify-content: center; z-index: 10; cursor: pointer;" title="Score final: ${finalScore}%">
                        <div style="width: 16px; height: 16px; background: linear-gradient(135deg, ${color1}, ${color2}); border-radius: 50%; box-shadow: inset 0 1px 2px rgba(255,255,255,0.3);"></div>
                    </div>
                </div>
                <div style="min-width: 180px; text-align: right; font-size: 0.85rem; color: var(--text2); display: flex; flex-direction: column; gap: 2px; align-items: flex-end;">
                    <div>
                        <span style="font-weight: 700; color: ${color1};">${successRate}%</span> réussite • ${studentCount}/20 élèves
                    </div>
                    <div style="font-size: 0.8rem;">
                        Score final: <span style="font-weight: 700; color: var(--blue);">${finalScore}%</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div></div>';
    container.innerHTML = html;
}

// Rafraîchissement automatique des taux de réussite toutes les 30 secondes
let successRateRefreshInterval = null;

function startSuccessRateAutoRefresh() {
    if (successRateRefreshInterval) {
        clearInterval(successRateRefreshInterval);
    }
    
    successRateRefreshInterval = setInterval(async () => {
        console.log('🔄 Rafraîchissement automatique des taux de réussite...');
        await loadInstructorSuccessRates();
    }, 30000); // 30 secondes
    
    console.log('✅ Rafraîchissement automatique des taux de réussite activé (30s)');
}

// Variable globale pour stocker les données de bonus
let cachedBonuses = [];

// Afficher les détails des résultats d'examen d'un moniteur
window.showInstructorExamResults = async function(instructorName) {
    const modal = document.getElementById('instructorExamResultsModal');
    const nameDisplay = document.getElementById('instructorNameDisplay');
    const bodyContainer = document.getElementById('instructorExamResultsBody');
    
    if (!modal || !nameDisplay || !bodyContainer) return;
    
    nameDisplay.textContent = instructorName;
    bodyContainer.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #667eea;"></i></div>';
    
    modal.style.display = 'flex';
    
    try {
        // Récupérer tous les résultats d'examen pour ce moniteur
        const { data: results, error } = await window.supabaseClient
            .from('exam_results')
            .select('*')
            .eq('instructor', instructorName)
            .order('exam_date', { ascending: false });
        
        if (error) {
            console.error('Erreur récupération résultats:', error);
            bodyContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #ff3b30;">Erreur lors du chargement des résultats.</div>';
            return;
        }
        
        if (!results || results.length === 0) {
            bodyContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">Aucun résultat d\'examen pour ce moniteur.</div>';
            return;
        }
        
        // Calculer les statistiques
        const totalExams = results.length;
        const passedCount = results.filter(r => r.result === 'passed').length;
        const failedCount = results.filter(r => r.result === 'failed').length;
        const successRate = Math.round((passedCount / totalExams) * 100);
        const avgRating = (results.reduce((sum, r) => sum + (r.rating || 0), 0) / totalExams).toFixed(1);
        
        let html = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                <div style="background: #1a1a1a; padding: 16px; border-radius: 12px; border: 1px solid #333;">
                    <div style="font-size: 0.85rem; color: #fff; opacity: 0.8; margin-bottom: 4px;">Total examens</div>
                    <div style="font-size: 2rem; font-weight: 700; color: #fff;">${totalExams}</div>
                </div>
                <div style="background: #1a1a1a; padding: 16px; border-radius: 12px; border: 1px solid #333;">
                    <div style="font-size: 0.85rem; color: #4ade80; opacity: 0.8; margin-bottom: 4px;">Réussis</div>
                    <div style="font-size: 2rem; font-weight: 700; color: #4ade80;">${passedCount}</div>
                </div>
                <div style="background: #1a1a1a; padding: 16px; border-radius: 12px; border: 1px solid #333;">
                    <div style="font-size: 0.85rem; color: #f87171; opacity: 0.8; margin-bottom: 4px;">Échoués</div>
                    <div style="font-size: 2rem; font-weight: 700; color: #f87171;">${failedCount}</div>
                </div>
                <div style="background: #1a1a1a; padding: 16px; border-radius: 12px; border: 1px solid #333;">
                    <div style="font-size: 0.85rem; color: #fbbf24; opacity: 0.8; margin-bottom: 4px;">Note moyenne</div>
                    <div style="font-size: 2rem; font-weight: 700; color: #fbbf24;">${avgRating}/5 ⭐</div>
                </div>
            </div>
            
            <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 16px; color: #333;">
                <i class="fas fa-list"></i> Liste des résultats
            </h4>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
        `;
        
        results.forEach(result => {
            const isPassed = result.result === 'passed';
            const resultColor = isPassed ? '#2e7d32' : '#c62828';
            const resultBg = isPassed ? '#c8e6c9' : '#ffcdd2';
            const resultIcon = isPassed ? 'check-circle' : 'times-circle';
            const resultText = isPassed ? 'Réussi' : 'Échoué';
            
            const stars = '⭐'.repeat(result.rating || 0);
            const examDate = new Date(result.exam_date).toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
            });
            
            html += `
                <div style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <div>
                            <div style="font-weight: 700; font-size: 1.05rem; margin-bottom: 4px;">${result.student_name}</div>
                            <div style="font-size: 0.85rem; color: #666;">
                                <i class="fas fa-calendar"></i> ${examDate}
                            </div>
                        </div>
                        <div style="background: ${resultBg}; color: ${resultColor}; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 0.85rem;">
                            <i class="fas fa-${resultIcon}"></i> ${resultText}
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 16px; margin-bottom: 8px; font-size: 0.9rem;">
                        <div>
                            <span style="color: #666;">Note:</span> 
                            <span style="font-weight: 600; color: #ffd700;">${stars} ${result.rating}/5</span>
                        </div>
                    </div>
                    
                    ${result.appreciation ? `
                        <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-top: 12px;">
                            <div style="font-size: 0.85rem; color: #666; margin-bottom: 4px;">
                                <i class="fas fa-comment"></i> Commentaire
                            </div>
                            <div style="font-size: 0.9rem; color: #333; font-style: italic;">"${result.appreciation}"</div>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += '</div>';
        
        bodyContainer.innerHTML = html;
        
    } catch (err) {
        console.error('Erreur affichage résultats:', err);
        bodyContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #ff3b30;">Erreur lors du chargement des résultats.</div>';
    }
};

// Fermer la modal des détails
window.closeInstructorExamResultsModal = function() {
    const modal = document.getElementById('instructorExamResultsModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// Fonction pour rafraîchir l'affichage selon le moniteur sélectionné
function refreshInstructorDisplay(instructorName) {
    console.log('🔄 Rafraîchissement pour le moniteur:', instructorName);
    console.log('📦 Données en cache:', cachedBonuses);
    displayInstructorSuccessRates(cachedBonuses, instructorName);
    loadInstructorBonusHistory(instructorName);
}

// Modifier loadInstructorSuccessRates pour mettre en cache les données
async function loadInstructorSuccessRatesOriginal() {
    try {
        if (!window.supabaseClient) return;
        
        const { data: bonuses, error } = await window.supabaseClient
            .from('instructor_bonuses')
            .select('instructor, success_rate, total_students, final_score, average_rating, bonus_amount')
            .eq('status', 'active')
            .order('instructor');
        
        if (error) {
            console.error('Erreur chargement taux de réussite:', error);
            return;
        }
        
        console.log('📊 Taux de réussite des moniteurs:', bonuses);
        if (bonuses && bonuses.length > 0) {
            bonuses.forEach(b => {
                console.log(`📈 ${b.instructor}: success_rate=${b.success_rate}%, final_score=${b.final_score}%, total_students=${b.total_students}`);
            });
        }
        cachedBonuses = bonuses || [];
        
        // Au chargement initial, afficher tous les moniteurs sans filtrage
        displayInstructorSuccessRates(cachedBonuses, null);
    } catch (err) {
        console.error('Erreur:', err);
    }
}

// Remplacer la fonction loadInstructorSuccessRates
loadInstructorSuccessRates = loadInstructorSuccessRatesOriginal;

// Fonction pour charger l'historique des primes d'un moniteur
async function loadInstructorBonusHistory(instructorName) {
    const container = document.getElementById('instructorBonusHistory');
    if (!container) return;
    
    if (!instructorName) {
        container.innerHTML = '';
        return;
    }
    
    try {
        const { data: history, error } = await window.supabaseClient
            .from('instructor_bonuses')
            .select('*')
            .eq('instructor', instructorName)
            .in('status', ['completed', 'paid'])
            .order('period_end', { ascending: false });
        
        if (error) {
            console.error('Erreur chargement historique:', error);
            return;
        }
        
        if (!history || history.length === 0) {
            container.innerHTML = `
                <div style="background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow);">
                    <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-history" style="color: var(--blue);"></i> 
                        Historique des primes - ${instructorName}
                    </h3>
                    <div style="padding: 24px; text-align: center; color: var(--text2); background: var(--bg); border-radius: var(--radius);">
                        <i class="fas fa-inbox" style="font-size: 2rem; opacity: 0.3; margin-bottom: 8px;"></i>
                        <p>Aucune prime complétée pour ce moniteur</p>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = `
            <div style="background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow);">
                <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-history" style="color: var(--blue);"></i> 
                    Historique des primes - ${instructorName}
                </h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
        `;
        
        history.forEach(bonus => {
            const periodStart = new Date(bonus.period_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            const periodEnd = new Date(bonus.period_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            
            let badgeColor = '#ff3b30';
            if (bonus.success_rate >= 100) badgeColor = '#34c759';
            else if (bonus.success_rate >= 90) badgeColor = '#ffd700';
            else if (bonus.success_rate >= 80) badgeColor = '#ff9500';
            
            const isPaid = bonus.status === 'paid';
            
            html += `
                <div style="background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; display: flex; justify-content: space-between; align-items: center; gap: 16px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <div style="width: 8px; height: 8px; background: ${badgeColor}; border-radius: 50%;"></div>
                            <span style="font-weight: 600; font-size: 0.9rem;">Période du ${periodStart} au ${periodEnd}</span>
                            ${isPaid ? '<span style="background: #34c759; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">✓ Payée</span>' : ''}
                        </div>
                        <div style="display: flex; gap: 20px; margin-top: 8px; font-size: 0.8rem; color: var(--text2);">
                            <div><i class="fas fa-users" style="margin-right: 4px;"></i>${bonus.total_students} élèves</div>
                            <div><i class="fas fa-check-circle" style="margin-right: 4px; color: #34c759;"></i>${bonus.passed_students} réussis</div>
                            <div><i class="fas fa-percentage" style="margin-right: 4px;"></i>${bonus.success_rate}% réussite</div>
                            <div><i class="fas fa-trophy" style="margin-right: 4px;"></i>Score: ${bonus.final_score}%</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="text-align: right;">
                            <div style="font-size: 1.3rem; font-weight: 700; color: ${badgeColor};">${bonus.bonus_amount}€</div>
                        </div>
                        ${!isPaid ? `
                            <button 
                                onclick="markBonusAsPaid('${bonus.id}')" 
                                style="background: var(--blue); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;"
                                onmouseover="this.style.background='#0051d5'"
                                onmouseout="this.style.background='var(--blue)'"
                            >
                                <i class="fas fa-check"></i> Distribué
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
        container.innerHTML = html;
        
    } catch (err) {
        console.error('Erreur:', err);
    }
}

// Fonction pour marquer une prime comme payée
async function markBonusAsPaid(bonusId) {
    try {
        const { error } = await window.supabaseClient
            .from('instructor_bonuses')
            .update({ status: 'paid' })
            .eq('id', bonusId);
        
        if (error) {
            console.error('Erreur mise à jour prime:', error);
            alert('Erreur lors de la mise à jour de la prime');
            return;
        }
        
        // Recharger l'historique
        const activeBtn = document.querySelector('#instructorSegment button.active');
        const currentInstructor = activeBtn ? activeBtn.dataset.instructor : null;
        if (currentInstructor) {
            await loadInstructorBonusHistory(currentInstructor);
        }
        
    } catch (err) {
        console.error('Erreur:', err);
        alert('Erreur lors de la mise à jour de la prime');
    }
}

// Exposer les fonctions globalement
window.loadInstructorSuccessRates = loadInstructorSuccessRates;
window.startSuccessRateAutoRefresh = startSuccessRateAutoRefresh;
window.refreshInstructorDisplay = refreshInstructorDisplay;
window.loadInstructorBonusHistory = loadInstructorBonusHistory;
window.markBonusAsPaid = markBonusAsPaid;
