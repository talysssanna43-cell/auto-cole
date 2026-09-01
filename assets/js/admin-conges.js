// ══════════════════════════════════════════════════════════════════════════════
// GESTION DES CONGÉS
// ══════════════════════════════════════════════════════════════════════════════

window.openCongesModal = function() {
    const modal = document.getElementById('congesModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Pré-remplir le moniteur actuel
        const currentInstructor = state?.instructor || 'Daho';
        const instructorSelect = document.getElementById('congesInstructor');
        if (instructorSelect) {
            instructorSelect.value = currentInstructor;
        }
        
        // Définir la date d'aujourd'hui par défaut
        const today = new Date().toISOString().split('T')[0];
        const startDateInput = document.getElementById('congesStartDate');
        const endDateInput = document.getElementById('congesEndDate');
        if (startDateInput) startDateInput.value = today;
        if (endDateInput) endDateInput.value = today;
    }
};

window.closeCongesModal = function() {
    const modal = document.getElementById('congesModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('congesForm')?.reset();
    }
};

function congesTimeToMinutes(value) {
    const [hours, minutes] = String(value || '00:00').split(':').map(Number);
    return ((hours || 0) * 60) + (minutes || 0);
}

function congesSlotStart(value) {
    return String(value || '').split('|')[0];
}

function congesSlotEnd(value) {
    return String(value || '').split('|')[1] || '';
}

function parseCongesDate(value) {
    const [year, month, day] = String(value || '').split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
}

function formatCongesDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getCongesPlanningRows(dateStr, startTime, endTime, instructor) {
    const requestedStart = congesTimeToMinutes(startTime);
    const requestedEnd = congesTimeToMinutes(endTime);
    const rows = typeof window.getTimeRows === 'function'
        ? window.getTimeRows(instructor)
        : [];

    const planningRows = rows
        .map((row) => {
            const start = congesSlotStart(row);
            const end = congesSlotEnd(row) || (typeof window.getEndForStart === 'function' ? window.getEndForStart(instructor, row, dateStr) : '');
            return { start, end };
        })
        .filter((slot) => slot.start && slot.end)
        .filter((slot) => congesTimeToMinutes(slot.start) >= requestedStart && congesTimeToMinutes(slot.end) <= requestedEnd);

    if (planningRows.length) return planningRows;

    const fallbackRows = [];
    let currentTime = startTime;
    while (congesTimeToMinutes(currentTime) < requestedEnd) {
        const nextTime = String(Number(currentTime.split(':')[0]) + 2).padStart(2, '0') + ':' + String(Number(currentTime.split(':')[1]) || 0).padStart(2, '0');
        if (congesTimeToMinutes(nextTime) > requestedEnd) break;
        fallbackRows.push({ start: currentTime, end: nextTime });
        currentTime = nextTime;
    }
    return fallbackRows;
}

function buildCongesSlots(startDate, endDate, startTime, endTime, instructor) {
    const slotsToBlock = [];
    let currentDate = parseCongesDate(startDate);
    const lastDate = parseCongesDate(endDate);
    if (!currentDate || !lastDate) return slotsToBlock;

    while (currentDate <= lastDate) {
        const dateStr = formatCongesDate(currentDate);
        getCongesPlanningRows(dateStr, startTime, endTime, instructor).forEach((row) => {
            slotsToBlock.push({
                start_at: new Date(`${dateStr}T${row.start}:00`).toISOString(),
                end_at: new Date(`${dateStr}T${row.end}:00`).toISOString(),
                instructor: instructor,
                status: 'indisponible',
                notes: `CONGÉS - ${instructor} (${startDate} au ${endDate})`
            });
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return slotsToBlock;
}

window.submitCongesBlock = async function(event) {
    event.preventDefault();
    
    const startDate = document.getElementById('congesStartDate').value;
    const endDate = document.getElementById('congesEndDate').value;
    const startTime = document.getElementById('congesStartTime').value;
    const endTime = document.getElementById('congesEndTime').value;
    const instructor = document.getElementById('congesInstructor').value;
    
    if (!startDate || !endDate || !startTime || !endTime || !instructor) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
    }
    
    // Vérifier que la date de fin est après la date de début
    if (new Date(endDate) < new Date(startDate)) {
        alert('La date de fin doit être après la date de début.');
        return;
    }
    
    try {
        const slotsToBlock = buildCongesSlots(startDate, endDate, startTime, endTime, instructor);
        
        if (slotsToBlock.length === 0) {
            alert('Aucun créneau à bloquer avec ces paramètres.');
            return;
        }
        
        // Confirmer avec l'utilisateur
        const confirmMsg = `Vous allez bloquer ${slotsToBlock.length} créneau(x) pour congés.\n\nDu ${startDate} au ${endDate}\nDe ${startTime} à ${endTime}\nMoniteur: ${instructor}\n\nConfirmer ?`;
        if (!confirm(confirmMsg)) {
            return;
        }
        
        // Insérer ou mettre à jour les créneaux dans la base de données
        console.log('📋 Créneaux à insérer:', slotsToBlock);
        
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        
        for (const slot of slotsToBlock) {
            // Vérifier si le créneau existe déjà
            const { data: existing, error: checkError } = await window.supabaseClient
                .from('slots')
                .select('id,status')
                .eq('start_at', slot.start_at)
                .eq('instructor', slot.instructor)
                .maybeSingle();
            
            if (checkError) {
                console.error('Error checking slot:', checkError);
                errorCount++;
                continue;
            }
            
            if (existing) {
                if (!['available', 'indisponible'].includes(existing.status)) {
                    skippedCount++;
                    continue;
                }

                // Mettre à jour le créneau existant
                const { error: updateError } = await window.supabaseClient
                    .from('slots')
                    .update({
                        status: slot.status,
                        notes: slot.notes,
                        end_at: slot.end_at
                    })
                    .eq('id', existing.id);
                
                if (updateError) {
                    console.error('Error updating slot:', updateError);
                    errorCount++;
                } else {
                    successCount++;
                }
            } else {
                // Insérer un nouveau créneau
                const { error: insertError } = await window.supabaseClient
                    .from('slots')
                    .insert([slot]);
                
                if (insertError) {
                    console.error('Error inserting slot:', insertError);
                    errorCount++;
                } else {
                    successCount++;
                }
            }
        }
        
        closeCongesModal();
        
        if (errorCount > 0) {
            alert(`⚠️ ${successCount} créneau(x) bloqué(s), ${skippedCount} déjà réservé(s), ${errorCount} erreur(s).`);
        } else {
            alert(`✅ ${successCount} créneau(x) bloqué(s) pour congés avec succès !${skippedCount ? `\n${skippedCount} créneau(x) déjà réservé(s) n'ont pas été modifiés.` : ''}`);
        }
        
        // Recharger le planning
        if (typeof loadPlanning === 'function') {
            await loadPlanning();
        }
        
    } catch (err) {
        console.error('Error in submitCongesBlock:', err);
        alert('Erreur lors du blocage des congés.');
    }
};

window.openDeleteCongesModal = function() {
    const instructor = document.getElementById('congesInstructor').value;
    
    if (!instructor) {
        alert('Veuillez sélectionner un moniteur.');
        return;
    }
    
    const confirmMsg = `⚠️ ATTENTION\n\nVous allez supprimer TOUS les créneaux de congés du moniteur ${instructor}.\n\nCette action est irréversible.\n\nConfirmer la suppression ?`;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    deleteCongesForInstructor(instructor);
};

async function deleteCongesForInstructor(instructor) {
    try {
        // Supprimer tous les créneaux avec status='indisponible' et notes contenant 'CONGÉS' pour ce moniteur
        const { data, error } = await window.supabaseClient
            .from('slots')
            .delete()
            .eq('instructor', instructor)
            .eq('status', 'indisponible')
            .like('notes', '%CONGÉS%');
        
        if (error) {
            console.error('Error deleting congés:', error);
            alert('Erreur lors de la suppression des congés: ' + error.message);
            return;
        }
        
        alert(`✅ Tous les congés du moniteur ${instructor} ont été supprimés.`);
        closeCongesModal();
        
        // Recharger le planning
        if (typeof loadPlanning === 'function') {
            await loadPlanning();
        }
        
    } catch (err) {
        console.error('Error in deleteCongesForInstructor:', err);
        alert('Erreur lors de la suppression des congés.');
    }
}
