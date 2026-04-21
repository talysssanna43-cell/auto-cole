// Gestion du blocage de créneaux pour les examens de permis

window.openPermisModal = function() {
    const modal = document.getElementById('permisModal');
    if (modal) {
        modal.style.display = 'flex';
        // Pré-remplir avec la date du jour
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('permisDate').value = today;
    }
};

window.closePermisModal = function() {
    const modal = document.getElementById('permisModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('permisForm').reset();
    }
};

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
            const startAt = `${slot.date}T${slot.start_time}:00`;
            const endAt = `${slot.date}T${slot.end_time}:00`;
            
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
                        notes: `PERMIS - ${slot.location}`
                    })
                    .eq('id', existingSlot.id);
                
                if (updateError) {
                    console.error('Erreur lors de la mise à jour:', updateError);
                } else {
                    console.log(`✅ Créneau ${slot.start_time} mis à jour en "permis" (${slot.location})`);
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
                        notes: `PERMIS - ${slot.location}`
                    });
                
                if (insertError) {
                    console.error('Erreur lors de l\'insertion:', insertError);
                } else {
                    console.log(`✅ Créneau ${slot.start_time} créé avec statut "permis" (${slot.location})`);
                }
            }
        }
        
        alert(`✅ ${slots.length} créneau(x) bloqué(s) pour le permis !\n\nDate: ${date}\nHoraire: ${startTime} - ${endTime}\nMoniteur: ${instructor}\nLieu: ${location}`);
        
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
