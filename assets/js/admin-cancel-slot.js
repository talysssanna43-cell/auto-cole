// ============================================
// FONCTION DE SUPPRESSION DE CRÉNEAU
// ============================================

window.cancelSlotReservation = async function(slotId, studentEmail, studentFirstName, studentLastName, slotDate, slotStart) {
    try {
        // Confirmer la suppression
        const slotDateObj = new Date(slotDate);
        const confirmMsg = `⚠️ Confirmer la suppression de ce créneau ?\n\n` +
            `Élève : ${studentFirstName} ${studentLastName}\n` +
            `Email : ${studentEmail}\n` +
            `Date : ${slotDateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}\n` +
            `Horaire : ${slotStart}\n\n` +
            `✅ Le créneau sera libéré\n` +
            `✅ L'heure sera recréditée à l'élève`;
        
        if (!confirm(confirmMsg)) {
            return;
        }
        
        console.log('🗑️ Suppression du créneau:', slotId);
        
        // 1. Récupérer les informations de la réservation
        const { data: reservations, error: resError } = await window.supabaseClient
            .from('reservations')
            .select('*')
            .eq('slot_id', slotId);
        
        if (resError) {
            console.error('Erreur récupération réservation:', resError);
            alert('Erreur lors de la récupération de la réservation.');
            return;
        }
        
        console.log('📋 Réservations trouvées:', reservations);
        
        // 2. Supprimer la réservation
        const { error: deleteResError } = await window.supabaseClient
            .from('reservations')
            .delete()
            .eq('slot_id', slotId);
        
        if (deleteResError) {
            console.error('Erreur suppression réservation:', deleteResError);
            alert('Erreur lors de la suppression de la réservation.');
            return;
        }
        
        console.log('✅ Réservation supprimée');
        
        // 3. Remettre le slot en statut "available"
        const { error: updateSlotError } = await window.supabaseClient
            .from('slots')
            .update({ status: 'available' })
            .eq('id', slotId);
        
        if (updateSlotError) {
            console.error('Erreur mise à jour slot:', updateSlotError);
            alert('Erreur lors de la libération du créneau.');
            return;
        }
        
        console.log('✅ Slot libéré');
        
        // 4. Vérifier les heures de l'élève pour afficher un message informatif
        const { data: userData, error: userError } = await window.supabaseClient
            .from('users')
            .select('hours_goal, hours_completed_initial')
            .eq('email', studentEmail)
            .single();
        
        let hoursMessage = '';
        if (!userError && userData) {
            const { data: remainingReservations } = await window.supabaseClient
                .from('reservations')
                .select('*')
                .eq('email', studentEmail)
                .in('status', ['upcoming', 'pending']);
            
            const hoursGoal = userData.hours_goal || 0;
            const hoursCompleted = userData.hours_completed_initial || 0;
            const hoursReserved = (remainingReservations || []).length * 2;
            const hoursRemaining = Math.max(0, hoursGoal - hoursCompleted - hoursReserved);
            
            hoursMessage = `\n\n⏰ Heures disponibles : ${hoursRemaining}h / ${hoursGoal}h`;
        }
        
        // 5. Fermer la modal
        const modal = document.getElementById('studentModal');
        if (modal) {
            modal.classList.remove('active');
        }
        
        // 6. Afficher un message de succès
        alert(`✅ Créneau supprimé avec succès !\n\n` +
            `Le créneau du ${slotDateObj.toLocaleDateString('fr-FR')} à ${slotStart} a été libéré.\n` +
            `${studentFirstName} ${studentLastName} peut maintenant réserver un autre créneau.` +
            hoursMessage);
        
        // 7. Rafraîchir le planning
        window.location.reload();
        
    } catch (err) {
        console.error('Erreur lors de la suppression du créneau:', err);
        alert('Erreur lors de la suppression du créneau.');
    }
};
