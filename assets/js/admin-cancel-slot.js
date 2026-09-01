// ============================================
// FONCTION DE SUPPRESSION DE CRÉNEAU
// ============================================

window.cancelSlotReservation = async function(slotId, studentEmail, studentFirstName, studentLastName, slotDate, slotStart) {
    try {
        const token = window.authSession?.getToken?.();
        if (!token) {
            alert('Session administrateur expirée. Reconnecte-toi puis réessaie.');
            return;
        }

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
        
        const response = await fetch('/.netlify/functions/admin-cancel-slot', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ slot_id: slotId })
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.ok) {
            console.error('Erreur suppression serveur:', result);
            alert('Erreur lors de la suppression du créneau.');
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
