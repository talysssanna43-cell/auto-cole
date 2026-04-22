// Gestion du blocage de créneaux pour les examens de permis

window.openDeletePermisModal = async function() {
    // Récupérer tous les créneaux permis depuis la base de données
    try {
        const { data: permisSlots, error } = await window.supabaseClient
            .from('slots')
            .select('id, start_at, end_at, instructor, notes')
            .eq('status', 'permis')
            .order('start_at', { ascending: true });
        
        if (error) {
            alert('❌ Erreur lors de la récupération: ' + error.message);
            return;
        }
        
        if (!permisSlots || permisSlots.length === 0) {
            alert('ℹ️ Aucun créneau permis à supprimer.');
            return;
        }
        
        // Construire la liste HTML
        const listHtml = permisSlots.map(slot => {
            const startDate = new Date(slot.start_at);
            const endDate = new Date(slot.end_at);
            const dateStr = startDate.toLocaleDateString('fr-FR', { 
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
            });
            const startTime = `${String(startDate.getHours()).padStart(2, '0')}h${String(startDate.getMinutes()).padStart(2, '0')}`;
            const endTime = `${String(endDate.getHours()).padStart(2, '0')}h${String(endDate.getMinutes()).padStart(2, '0')}`;
            const location = slot.notes ? slot.notes.replace('PERMIS - ', '') : 'Non renseigné';
            
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 8px; background: rgba(255, 193, 7, 0.08);">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #f57c00; font-size: 0.9rem;">
                            <i class="fas fa-id-card"></i> ${dateStr}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text2); margin-top: 4px;">
                            ${startTime} - ${endTime} · ${slot.instructor} · ${location}
                        </div>
                    </div>
                    <button onclick="deletePermisSlot('${slot.id}')"
                        style="padding: 8px 14px; border: none; border-radius: 6px; background: #dc3545; color: white; font-weight: 600; cursor: pointer; font-size: 0.85rem;">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            `;
        }).join('');
        
        // Créer / afficher la modal
        let modal = document.getElementById('deletePermisModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'deletePermisModal';
            modal.className = 'student-details-modal';
            modal.style.display = 'flex';
            document.body.appendChild(modal);
        }
        modal.innerHTML = `
            <div class="student-details-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <div class="student-details-header">
                    <h3><i class="fas fa-id-card" style="margin-right:8px; color: #ffc107;"></i> Supprimer un créneau permis</h3>
                    <button class="modal-close" onclick="closeDeletePermisModal()"><i class="fas fa-times"></i></button>
                </div>
                <div style="padding: 20px;">
                    <p style="margin-bottom: 16px; color: var(--text2); font-size: 0.9rem;">
                        Sélectionne le créneau à supprimer. Il redeviendra disponible pour les élèves.
                    </p>
                    ${listHtml}
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    } catch (err) {
        console.error('Erreur:', err);
        alert('❌ Erreur: ' + err.message);
    }
};

window.closeDeletePermisModal = function() {
    const modal = document.getElementById('deletePermisModal');
    if (modal) modal.style.display = 'none';
};

window.deletePermisSlot = async function(slotId) {
    if (!confirm('Supprimer ce créneau permis ?\n\nIl redeviendra disponible pour les élèves.')) {
        return;
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('slots')
            .delete()
            .eq('id', slotId);
        
        if (error) {
            alert('❌ Erreur lors de la suppression: ' + error.message);
            return;
        }
        
        alert('✅ Créneau supprimé ! Il est à nouveau disponible.');
        closeDeletePermisModal();
        if (typeof window.loadWeekSlots === 'function') {
            window.loadWeekSlots();
        } else {
            location.reload();
        }
    } catch (err) {
        console.error('Erreur:', err);
        alert('❌ Erreur: ' + err.message);
    }
};

// Liste des candidats sélectionnés
let selectedCandidates = [];

window.openPermisModal = function() {
    console.log('🔵 openPermisModal appelée');
    const modal = document.getElementById('permisModal');
    if (modal) {
        console.log('✅ Modal trouvée');
        modal.style.display = 'flex';
        // Pré-remplir avec la date du jour
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('permisDate');
        if (dateInput) {
            dateInput.value = today;
        }
        
        // Réinitialiser la liste des candidats
        selectedCandidates = [];
        window.updateCandidatesList();
    } else {
        console.error('❌ Modal permisModal non trouvée');
    }
};

window.closePermisModal = function() {
    const modal = document.getElementById('permisModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('permisForm').reset();
        selectedCandidates = [];
    }
};

// Autocomplétion pour rechercher les élèves
let candidateAutocompleteTimeout = null;
window.searchCandidate = async function(input) {
    const searchTerm = input.value.trim();
    const suggestionsContainer = document.getElementById('candidateSuggestions');
    
    if (!suggestionsContainer) return;
    
    if (searchTerm.length < 2) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    clearTimeout(candidateAutocompleteTimeout);
    candidateAutocompleteTimeout = setTimeout(async () => {
        try {
            const { data: users, error } = await window.supabaseClient
                .from('users')
                .select('email, prenom, nom, telephone')
                .or(`prenom.ilike.%${searchTerm}%,nom.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
                .limit(10);
            
            if (error) {
                console.error('Erreur recherche:', error);
                return;
            }
            
            if (!users || users.length === 0) {
                suggestionsContainer.innerHTML = '<div style="padding: 0.75rem; color: #999;">Aucun élève trouvé</div>';
                suggestionsContainer.style.display = 'block';
                return;
            }
            
            suggestionsContainer.innerHTML = users.map(user => `
                <div class="candidate-suggestion" onclick="selectCandidate('${user.email}', '${user.prenom}', '${user.nom}')" 
                    style="padding: 0.75rem; cursor: pointer; border-bottom: 1px solid #eee; transition: background 0.2s;"
                    onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='white'">
                    <div style="font-weight: 600;">${user.prenom} ${user.nom}</div>
                    <div style="font-size: 0.85rem; color: #666;">${user.email}</div>
                </div>
            `).join('');
            
            suggestionsContainer.style.display = 'block';
            
        } catch (err) {
            console.error('Erreur autocomplétion:', err);
        }
    }, 300);
};

window.selectCandidate = function(email, prenom, nom) {
    // Vérifier si déjà ajouté
    if (selectedCandidates.find(c => c.email === email)) {
        alert('Ce candidat est déjà dans la liste');
        return;
    }
    
    selectedCandidates.push({ email, prenom, nom });
    window.updateCandidatesList();
    
    // Réinitialiser le champ de recherche
    const input = document.getElementById('candidateSearch');
    if (input) input.value = '';
    
    const suggestionsContainer = document.getElementById('candidateSuggestions');
    if (suggestionsContainer) suggestionsContainer.style.display = 'none';
};

window.removeCandidate = function(email) {
    selectedCandidates = selectedCandidates.filter(c => c.email !== email);
    window.updateCandidatesList();
};

window.updateCandidatesList = function() {
    const container = document.getElementById('selectedCandidatesList');
    if (!container) return;
    
    if (selectedCandidates.length === 0) {
        container.innerHTML = '<p style="color: #999; font-style: italic; text-align: center; padding: 1rem;">Aucun candidat ajouté</p>';
        return;
    }
    
    container.innerHTML = selectedCandidates.map(candidate => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8f9fa; border-radius: 8px; margin-bottom: 0.5rem;">
            <div>
                <div style="font-weight: 600;">${candidate.prenom} ${candidate.nom}</div>
                <div style="font-size: 0.85rem; color: #666;">${candidate.email}</div>
            </div>
            <button type="button" onclick="removeCandidate('${candidate.email}')" 
                style="padding: 0.5rem 0.75rem; border: none; border-radius: 6px; background: #dc3545; color: white; cursor: pointer; font-size: 0.85rem;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

window.submitPermisBlock = async function(event) {
    event.preventDefault();
    
    const date = document.getElementById('permisDate').value;
    const startTime = document.getElementById('permisStartTime').value;
    const endTime = document.getElementById('permisEndTime').value;
    const instructor = document.getElementById('permisInstructor').value;
    const location = document.getElementById('permisLocation').value;
    
    console.log('📝 Blocage de créneaux pour permis:', { date, startTime, endTime, instructor, location });
    
    // Vérifier que l'heure de fin est après l'heure de début
    if (endTime <= startTime) {
        alert('❌ L\'heure de fin doit être après l\'heure de début.');
        return;
    }
    
    // Vérifier qu'au moins un candidat est sélectionné
    if (selectedCandidates.length === 0) {
        alert('❌ Veuillez ajouter au moins un candidat au permis.');
        return;
    }
    
    // Créer la liste des candidats pour les notes
    const candidatesNames = selectedCandidates.map(c => `${c.prenom} ${c.nom}`).join(', ');
    const notesText = `PERMIS - ${location} | Candidats: ${candidatesNames}`;
    
    try {
        // Créer les créneaux à bloquer (toutes les 2 heures entre start et end)
        const slots = [];
        let currentTime = startTime;
        
        while (currentTime < endTime) {
            const [hours, minutes] = currentTime.split(':').map(Number);
            const nextHours = hours + 2;
            const nextTime = `${String(nextHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            
            // Si le prochain créneau dépasse l'heure de fin, on s'arrête
            // Mais on accepte si nextTime == endTime (ex: 11h-13h quand endTime = 13h)
            if (nextTime > endTime) break;
            
            slots.push({
                date: date,
                start_time: currentTime,
                end_time: nextTime,
                instructor: instructor,
                location: location
            });
            
            currentTime = nextTime;
        }
        
        console.log('🔒 Créneaux à bloquer:', slots);
        
        if (slots.length === 0) {
            alert('❌ Aucun créneau à bloquer. Vérifie les horaires (minimum 2h).');
            return;
        }
        
        // Insérer les créneaux bloqués dans la base de données
        for (const slot of slots) {
            // Convertir l'heure locale en UTC pour éviter les décalages horaires
            const startAt = new Date(`${slot.date}T${slot.start_time}:00`).toISOString();
            const endAt = new Date(`${slot.date}T${slot.end_time}:00`).toISOString();
            console.log(`🕐 Créneau ${slot.start_time}-${slot.end_time} (local) → ${startAt} (UTC)`);
            
            // Vérifier si un créneau existe déjà
            const { data: existingSlot, error: checkError } = await window.supabaseClient
                .from('slots')
                .select('id, status')
                .eq('start_at', startAt)
                .eq('instructor', slot.instructor)
                .maybeSingle();
            
            if (checkError) {
                console.error('Erreur lors de la vérification:', checkError);
                continue;
            }
            
            if (existingSlot) {
                // Mettre à jour le créneau existant
                const { error: updateError } = await window.supabaseClient
                    .from('slots')
                    .update({
                        status: 'permis',
                        end_at: endAt,
                        notes: notesText
                    })
                    .eq('id', existingSlot.id);
                
                if (updateError) {
                    console.error('Erreur lors de la mise à jour:', updateError);
                } else {
                    console.log(`✅ Créneau ${slot.start_time} mis à jour en "permis"`);
                }
            } else {
                // Créer un nouveau créneau
                const { error: insertError } = await window.supabaseClient
                    .from('slots')
                    .insert({
                        start_at: startAt,
                        end_at: endAt,
                        instructor: slot.instructor,
                        status: 'permis',
                        notes: notesText
                    });
                
                if (insertError) {
                    console.error('Erreur lors de l\'insertion:', insertError);
                } else {
                    console.log(`✅ Créneau ${slot.start_time} créé avec statut "permis"`);
                }
            }
        }
        
        alert(`✅ ${slots.length} créneau(x) bloqué(s) pour le permis !\n\nDate: ${date}\nHoraire: ${startTime} - ${endTime}\nMoniteur: ${instructor}\nLieu: ${location}\n\nCandidats (${selectedCandidates.length}): ${candidatesNames}`);
        
        closePermisModal();
        
        // Recharger le planning
        if (typeof window.loadWeekSlots === 'function') {
            window.loadWeekSlots();
        }
        
    } catch (err) {
        console.error('Erreur lors du blocage des créneaux:', err);
        alert('❌ Erreur lors du blocage. Réessaie.');
    }
};

// Fermer le modal en cliquant en dehors
document.addEventListener('click', (e) => {
    const modal = document.getElementById('permisModal');
    if (modal && e.target === modal) {
        closePermisModal();
    }
});
