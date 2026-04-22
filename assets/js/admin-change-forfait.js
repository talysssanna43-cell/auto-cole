// ===== CHANGEMENT DE FORFAIT ÉLÈVE =====

// Prix des packs
const packPrices = {
    code: 20,
    am: 350,
    'boite-auto': 859,
    '20h': 900,
    zen: 995,
    accelere: 999,
    aac: 1190,
    supervisee: 1190,
    'second-chance': 569
};

// Heures incluses dans chaque pack
const packHours = {
    code: 0,
    am: 8,
    'boite-auto': 13,
    '20h': 20,
    zen: 20,
    accelere: 20,
    aac: 20,
    supervisee: 20,
    'second-chance': 6
};

// Type de transmission par pack
const packTransmission = {
    'boite-auto': 'auto',
    '20h': 'manual',
    'am': 'auto',
    // Les autres packs permettent de choisir
};

window.openChangeForfaitModal = function(email, prenom, nom, currentForfait, heuresEffectuees) {
    // Créer la modal
    let modal = document.getElementById('changeForfaitModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'changeForfaitModal';
        modal.className = 'student-details-modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="student-details-content" style="max-width: 800px;">
            <div class="student-details-header">
                <h2><i class="fas fa-exchange-alt"></i> Changer de forfait</h2>
                <button class="close-btn" onclick="closeChangeForfaitModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="student-details-body">
                <div class="info-section">
                    <h3><i class="fas fa-user"></i> Élève</h3>
                    <p style="font-size: 1.1rem; font-weight: 600;">${prenom} ${nom}</p>
                    <p style="color: #666; margin-top: 0.5rem;">
                        <strong>Forfait actuel :</strong> ${currentForfait || 'Non défini'}<br>
                        <strong>Heures effectuées :</strong> <span style="color: #28a745; font-weight: 700;">${heuresEffectuees}h</span>
                    </p>
                </div>
                
                <div class="info-section">
                    <h3><i class="fas fa-box"></i> Nouveau forfait</h3>
                    <p style="color: #666; margin-bottom: 1rem;">
                        Les ${heuresEffectuees}h déjà effectuées seront déduites du nouveau forfait.
                    </p>
                    
                    <div id="packSelection" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                        ${generatePackCards(heuresEffectuees)}
                    </div>
                </div>
                
                <div id="transmissionSection" style="display: none; margin-top: 1.5rem;">
                    <div class="info-section">
                        <h3><i class="fas fa-car"></i> Type de transmission</h3>
                        <div style="display: flex; gap: 1rem;">
                            <label style="flex: 1; cursor: pointer;">
                                <input type="radio" name="newTransmission" value="manual" checked>
                                <span style="margin-left: 0.5rem; font-weight: 600;">Boîte manuelle (BM)</span>
                            </label>
                            <label style="flex: 1; cursor: pointer;">
                                <input type="radio" name="newTransmission" value="auto">
                                <span style="margin-left: 0.5rem; font-weight: 600;">Boîte automatique (BA)</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                    <button onclick="closeChangeForfaitModal()" 
                        style="flex: 1; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; background: white; font-weight: 600; cursor: pointer;">
                        Annuler
                    </button>
                    <button id="confirmChangeForfait" onclick="confirmChangeForfait('${email}', '${prenom}', '${nom}', ${heuresEffectuees})" 
                        style="flex: 1; padding: 0.75rem; border: none; border-radius: 8px; background: #28a745; color: white; font-weight: 600; cursor: pointer;" disabled>
                        <i class="fas fa-check"></i> Confirmer le changement
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // Ajouter les event listeners pour la sélection de pack
    document.querySelectorAll('.pack-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.pack-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            
            const packId = this.dataset.pack;
            const confirmBtn = document.getElementById('confirmChangeForfait');
            confirmBtn.disabled = false;
            
            // Afficher la section transmission si nécessaire
            const transmissionSection = document.getElementById('transmissionSection');
            if (['aac', 'supervisee', 'accelere', 'second-chance', 'zen'].includes(packId)) {
                transmissionSection.style.display = 'block';
            } else {
                transmissionSection.style.display = 'none';
            }
        });
    });
};

function generatePackCards(heuresEffectuees) {
    const packs = [
        { id: 'code', name: 'Code', icon: 'book' },
        { id: 'am', name: 'AM (VSP)', icon: 'motorcycle' },
        { id: 'boite-auto', name: 'Boîte Auto', icon: 'car' },
        { id: '20h', name: '20h Conduite', icon: 'road' },
        { id: 'zen', name: 'Zen', icon: 'smile' },
        { id: 'accelere', name: 'Accéléré', icon: 'bolt' },
        { id: 'aac', name: 'AAC', icon: 'users' },
        { id: 'supervisee', name: 'Supervisée', icon: 'user-graduate' },
        { id: 'second-chance', name: 'Second Chance', icon: 'redo' }
    ];
    
    return packs.map(pack => {
        const heuresIncluses = packHours[pack.id];
        const heuresRestantes = Math.max(0, heuresIncluses - heuresEffectuees);
        const prix = packPrices[pack.id];
        
        return `
            <div class="pack-card" data-pack="${pack.id}" style="border: 2px solid #ddd; border-radius: 12px; padding: 1rem; cursor: pointer; transition: all 0.2s; text-align: center;">
                <i class="fas fa-${pack.icon}" style="font-size: 2rem; color: #667eea; margin-bottom: 0.5rem;"></i>
                <h4 style="margin: 0.5rem 0; font-size: 1rem;">${pack.name}</h4>
                <p style="color: #666; font-size: 0.85rem; margin: 0.5rem 0;">
                    ${heuresIncluses}h incluses<br>
                    <strong style="color: #28a745;">${heuresRestantes}h restantes</strong>
                </p>
                <p style="font-weight: 700; color: #667eea; margin: 0.5rem 0;">${prix}€</p>
            </div>
        `;
    }).join('');
}

window.closeChangeForfaitModal = function() {
    const modal = document.getElementById('changeForfaitModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.confirmChangeForfait = async function(email, prenom, nom, heuresEffectuees) {
    const selectedCard = document.querySelector('.pack-card.selected');
    if (!selectedCard) {
        alert('Veuillez sélectionner un forfait');
        return;
    }
    
    const newPack = selectedCard.dataset.pack;
    const heuresIncluses = packHours[newPack];
    const heuresRestantes = Math.max(0, heuresIncluses - heuresEffectuees);
    
    // Déterminer le type de transmission
    let transmission = packTransmission[newPack];
    if (!transmission) {
        const transmissionRadio = document.querySelector('input[name="newTransmission"]:checked');
        transmission = transmissionRadio ? transmissionRadio.value : 'manual';
    }
    
    const confirmBtn = document.getElementById('confirmChangeForfait');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Changement en cours...';
    
    try {
        // Mettre à jour le forfait dans la base de données
        const { error: updateError } = await window.supabaseClient
            .from('users')
            .update({
                forfait: newPack,
                hours_goal: heuresIncluses,
                hours_remaining: heuresRestantes,
                transmission_type: transmission,
                updated_at: new Date().toISOString()
            })
            .eq('email', email);
        
        if (updateError) {
            throw updateError;
        }
        
        console.log(`✅ Forfait changé pour ${prenom} ${nom}: ${newPack} (${transmission})`);
        
        // Fermer la modal
        closeChangeForfaitModal();
        
        // Rafraîchir les détails de l'élève
        const { data: updatedStudent } = await window.supabaseClient
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (updatedStudent) {
            await displayStudentDetails(updatedStudent);
        }
        
        // Rafraîchir le planning
        await refresh();
        
    } catch (error) {
        console.error('Erreur changement forfait:', error);
        alert('Erreur lors du changement de forfait: ' + error.message);
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-check"></i> Confirmer le changement';
    }
};

// Styles CSS pour les cartes de pack
const style = document.createElement('style');
style.textContent = `
    .pack-card:hover {
        border-color: #667eea !important;
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    }
    
    .pack-card.selected {
        border-color: #667eea !important;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
    }
`;
document.head.appendChild(style);
