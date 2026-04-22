// Gestion du blocage de créneaux indisponibles

window.openIndisponibleModal = function() {
    console.log('🔵 openIndisponibleModal appelée');
    const modal = document.getElementById('indisponibleModal');
    if (modal) {
        console.log('✅ Modal trouvée');
        modal.style.display = 'flex';
        // Pré-remplir avec la date du jour
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('indisponibleDate');
        if (dateInput) {
            dateInput.value = today;
        }
    } else {
        console.error('❌ Modal indisponibleModal non trouvée');
    }
};

window.closeIndisponibleModal = function() {
    const modal = document.getElementById('indisponibleModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('indisponibleForm').reset();
    }
};

window.submitIndisponibleBlock = async function(event) {
    event.preventDefault();
    
    const date = document.getElementById('indisponibleDate').value;
    const startTime = document.getElementById('indisponibleStartTime').value;
    const endTime = document.getElementById('indisponibleEndTime').value;
    const instructor = document.getElementById('indisponibleInstructor').value;
    const reason = document.getElementById('indisponibleReason').value || 'Indisponible';
    
    console.log('📝 Blocage de créneaux indisponibles:', { date, startTime, endTime, instructor, reason });
    
    // Vérifier que l'heure de fin est après l'heure de début
    if (endTime <= startTime) {
        alert('❌ L\'heure de fin doit être après l\'heure de début.');
        return;
    }
    
    try {
        // Créer les créneaux à bloquer (toutes les 2 heures entre start et end)
        const slots = [];
        let currentTime = startTime;
        
        while (currentTime < endTime) {
            const [hours, minutes] = currentTime.split(':').map(Number);
            const nextHours = hours + 2;
            const nextTime = `${String(nextHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            
            if (nextTime > endTime) break;
            
            slots.push({
                date: date,
                start_time: currentTime,
                end_time: nextTime,
                instructor: instructor,
                reason: reason
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
                        status: 'indisponible',
                        end_at: endAt,
                        notes: `INDISPONIBLE - ${slot.reason}`
                    })
                    .eq('id', existingSlot.id);
                
                if (updateError) {
                    console.error('Erreur lors de la mise à jour:', updateError);
                } else {
                    console.log(`✅ Créneau ${slot.start_time} mis à jour en "indisponible"`);
                }
            } else {
                // Créer un nouveau créneau
                const { error: insertError } = await window.supabaseClient
                    .from('slots')
                    .insert({
                        start_at: startAt,
                        end_at: endAt,
                        instructor: slot.instructor,
                        status: 'indisponible',
                        notes: `INDISPONIBLE - ${slot.reason}`
                    });
                
                if (insertError) {
                    console.error('Erreur lors de l\'insertion:', insertError);
                } else {
                    console.log(`✅ Créneau ${slot.start_time} créé avec statut "indisponible"`);
                }
            }
        }
        
        alert(`✅ ${slots.length} créneau(x) bloqué(s) comme indisponible !\n\nDate: ${date}\nHoraire: ${startTime} - ${endTime}\nMoniteur: ${instructor}\nRaison: ${reason}`);
        
        closeIndisponibleModal();
        
        // Recharger le planning
        if (typeof window.loadWeekSlots === 'function') {
            window.loadWeekSlots();
        }
        
    } catch (err) {
        console.error('Erreur lors du blocage des créneaux:', err);
        alert('❌ Erreur: ' + err.message);
    }
};

window.openDeleteIndisponibleModal = async function() {
    try {
        const { data: indisponibleSlots, error } = await window.supabaseClient
            .from('slots')
            .select('id, start_at, end_at, instructor, notes')
            .eq('status', 'indisponible')
            .order('start_at', { ascending: true });
        
        if (error) {
            alert('❌ Erreur lors de la récupération: ' + error.message);
            return;
        }
        
        if (!indisponibleSlots || indisponibleSlots.length === 0) {
            alert('ℹ️ Aucun créneau indisponible à supprimer.');
            return;
        }
        
        // Filtrer pour ne garder que les créneaux à venir
        const now = new Date();
        const futureIndisponibleSlots = indisponibleSlots.filter(slot => {
            const slotDate = new Date(slot.start_at);
            return slotDate >= now;
        });
        
        if (futureIndisponibleSlots.length === 0) {
            alert('ℹ️ Aucun créneau indisponible à venir. Les créneaux passés sont automatiquement masqués.');
            return;
        }
        
        // Construire la liste HTML
        const listHtml = futureIndisponibleSlots.map(slot => {
            const startDate = new Date(slot.start_at);
            const endDate = new Date(slot.end_at);
            const dateStr = startDate.toLocaleDateString('fr-FR', { 
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
            });
            const startTime = `${String(startDate.getHours()).padStart(2, '0')}h${String(startDate.getMinutes()).padStart(2, '0')}`;
            const endTime = `${String(endDate.getHours()).padStart(2, '0')}h${String(endDate.getMinutes()).padStart(2, '0')}`;
            const reason = slot.notes ? slot.notes.replace('INDISPONIBLE - ', '') : 'Non renseigné';
            
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 8px; background: rgba(220, 53, 69, 0.08);">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #c82333; font-size: 0.9rem;">
                            <i class="fas fa-ban"></i> ${dateStr}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text2); margin-top: 4px;">
                            ${startTime} - ${endTime} · ${slot.instructor} · ${reason}
                        </div>
                    </div>
                    <button onclick="deleteIndisponibleSlot('${slot.id}')"
                        style="padding: 8px 14px; border: none; border-radius: 6px; background: #dc3545; color: white; font-weight: 600; cursor: pointer; font-size: 0.85rem;">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            `;
        }).join('');
        
        // Créer / afficher la modal
        let modal = document.getElementById('deleteIndisponibleModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'deleteIndisponibleModal';
            modal.className = 'modal-overlay';
            modal.style.display = 'none';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal" style="max-width: 700px;">
                <div class="modal-header">
                    <h3><i class="fas fa-trash" style="margin-right:8px;"></i> Supprimer un créneau indisponible</h3>
                    <button class="modal-close" onclick="closeDeleteIndisponibleModal()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 16px; color: var(--text2); font-size: 0.9rem;">
                        Sélectionne le créneau à supprimer. Il redeviendra disponible pour les élèves.
                    </p>
                    <div style="max-height: 400px; overflow-y: auto;">
                        ${listHtml}
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
    } catch (err) {
        console.error('Erreur:', err);
        alert('❌ Erreur: ' + err.message);
    }
};

window.closeDeleteIndisponibleModal = function() {
    const modal = document.getElementById('deleteIndisponibleModal');
    if (modal) modal.style.display = 'none';
};

window.deleteIndisponibleSlot = async function(slotId) {
    if (!confirm('Supprimer ce créneau indisponible ?\n\nIl redeviendra disponible pour les élèves.')) {
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
        closeDeleteIndisponibleModal();
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
