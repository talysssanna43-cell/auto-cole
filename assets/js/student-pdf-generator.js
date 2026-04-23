// Fonction pour télécharger la fiche élève en PDF
window.downloadStudentPDF = async function(studentEmail) {
    try {
        console.log('📄 Génération du PDF pour:', studentEmail);
        
        // Récupérer les données de l'élève
        const { data: student, error: studentError } = await window.supabaseClient
            .from('users')
            .select('*')
            .eq('email', studentEmail)
            .single();
        
        if (studentError || !student) {
            console.error('Erreur récupération élève:', studentError);
            alert('Erreur lors de la récupération des données de l\'élève.');
            return;
        }
        
        // Récupérer les réservations
        const { data: reservations, error: resError } = await window.supabaseClient
            .from('reservations')
            .select('*, slots(*)')
            .eq('email', student.email)
            .order('created_at', { ascending: false });
        
        if (resError) {
            console.error('Erreur récupération réservations:', resError);
        }
        
        // Calculer les statistiques
        const now = new Date();
        const completedSessions = (reservations || []).filter(r => {
            const slotDate = r.slots?.start_at ? new Date(r.slots.start_at) : null;
            const isPast = slotDate && slotDate < now;
            return r.status === 'completed' || r.status === 'done' || (isPast && r.status === 'upcoming');
        });
        const totalHours = completedSessions.length * 2;
        
        const upcomingSessions = (reservations || []).filter(r => {
            const slotDate = r.slots?.start_at ? new Date(r.slots.start_at) : null;
            const isFuture = slotDate && slotDate >= now;
            return r.status === 'upcoming' && isFuture;
        });
        
        // Récupérer les annulations
        const { data: cancellations } = await window.supabaseClient
            .from('cancellation_requests')
            .select('*')
            .eq('user_email', student.email);
        
        const totalCancellations = (cancellations || []).filter(c => 
            c.status === 'accepted' || c.status === 'approved'
        ).length;
        
        // Générer le PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Couleurs
        const primaryColor = [31, 48, 94]; // Bleu foncé
        const accentColor = [102, 126, 234]; // Bleu clair
        const greenColor = [40, 167, 69];
        const lightBg = [240, 249, 255];
        
        let yPos = 15;
        
        // En-tête
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 25, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('AUTO ECOLE BRETEUIL', 15, 12);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('1A rue Édouard Delanglade   13006 Marseille', 15, 18);
        doc.text('04 91 53 36 98   breteuilautoecole@gmail.com', 15, 22);
        
        yPos = 35;
        
        // Titre
        doc.setFillColor(...lightBg);
        doc.rect(10, yPos, 190, 10, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('📋 FICHE RÉCAPITULATIVE ÉLÈVE', 105, yPos + 7, { align: 'center' });
        
        yPos += 18;
        
        // Informations personnelles
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('■ Informations personnelles', 15, yPos);
        yPos += 8;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        const infoData = [
            ['NOM COMPLET', `${student.prenom || ''} ${student.nom || ''}`],
            ['EMAIL', student.email || '-'],
            ['TÉLÉPHONE', student.telephone || '-'],
            ['NUMÉRO NEPH', student.numero_neph || '-']
        ];
        
        infoData.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 100, 100);
            doc.text(label, 15, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(value, 80, yPos);
            yPos += 6;
        });
        
        yPos += 5;
        
        // Forfait et Statistiques
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('■ Forfait & Statistiques', 15, yPos);
        yPos += 8;
        
        // Grille de statistiques
        const stats = [
            { label: 'FORFAIT', value: student.forfait || 'Non défini', color: accentColor },
            { label: 'HEURES EFFECTUÉES', value: `${totalHours}h`, color: greenColor },
            { label: 'SÉANCES RÉALISÉES', value: completedSessions.length.toString(), color: [0, 0, 0] }
        ];
        
        const stats2 = [
            { label: 'SÉANCES À VENIR', value: upcomingSessions.length.toString(), color: [0, 0, 0] },
            { label: 'ANNULATIONS', value: totalCancellations.toString(), color: [220, 53, 69] },
            { label: 'DATE D\'INSCRIPTION', value: student.created_at ? new Date(student.created_at).toLocaleDateString('fr-FR') : '-', color: [0, 0, 0] }
        ];
        
        doc.setFontSize(9);
        let xPos = 15;
        
        stats.forEach(stat => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 100, 100);
            doc.text(stat.label, xPos, yPos);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...stat.color);
            doc.setFontSize(14);
            doc.text(stat.value, xPos, yPos + 7);
            doc.setFontSize(9);
            xPos += 63;
        });
        
        yPos += 15;
        xPos = 15;
        
        stats2.forEach(stat => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 100, 100);
            doc.text(stat.label, xPos, yPos);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...stat.color);
            doc.setFontSize(14);
            doc.text(stat.value, xPos, yPos + 7);
            doc.setFontSize(9);
            xPos += 63;
        });
        
        yPos += 18;
        
        // Historique des séances
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('■ Historique des séances', 15, yPos);
        yPos += 8;
        
        if (completedSessions.length === 0) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(150, 150, 150);
            doc.text('Aucune séance enregistrée.', 15, yPos);
        } else {
            // En-tête du tableau
            doc.setFillColor(...primaryColor);
            doc.rect(15, yPos - 5, 180, 8, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('DATE', 20, yPos);
            doc.text('HORAIRE', 70, yPos);
            doc.text('MONITEUR', 110, yPos);
            doc.text('STATUT', 160, yPos);
            
            yPos += 8;
            
            // Lignes du tableau
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            
            const sessionsToShow = completedSessions.slice(0, 15); // Limiter à 15 séances
            
            sessionsToShow.forEach((res, index) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                
                // Fond alterné
                if (index % 2 === 0) {
                    doc.setFillColor(245, 245, 245);
                    doc.rect(15, yPos - 5, 180, 7, 'F');
                }
                
                const slotDate = res.slots?.start_at ? new Date(res.slots.start_at) : null;
                const dateStr = slotDate ? slotDate.toLocaleDateString('fr-FR', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                }) : '-';
                
                const timeStr = slotDate ? slotDate.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }) : '-';
                
                const instructor = res.slots?.instructor || '-';
                
                let statusStr = 'À venir';
                let statusColor = [0, 0, 0];
                const isPast = slotDate && slotDate < now;
                
                if (res.status === 'completed' || res.status === 'done' || (isPast && res.status === 'upcoming')) {
                    statusStr = 'Effectué';
                    statusColor = greenColor;
                }
                
                doc.setTextColor(0, 0, 0);
                doc.text(dateStr, 20, yPos);
                doc.text(timeStr, 70, yPos);
                doc.text(instructor, 110, yPos);
                
                doc.setTextColor(...statusColor);
                doc.setFont('helvetica', 'bold');
                doc.text(statusStr, 160, yPos);
                doc.setFont('helvetica', 'normal');
                
                yPos += 7;
            });
        }
        
        // Pied de page
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.setFont('helvetica', 'italic');
            doc.text(
                `Document généré le ${new Date().toLocaleDateString('fr-FR')}   Auto École Breteuil   1A rue Édouard Delanglade, 13006 Marseille`,
                105,
                290,
                { align: 'center' }
            );
        }
        
        // Télécharger le PDF
        const fileName = `Fiche_${student.prenom}_${student.nom}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`;
        doc.save(fileName);
        
        console.log('✅ PDF généré avec succès:', fileName);
        
    } catch (error) {
        console.error('❌ Erreur génération PDF:', error);
        alert('Erreur lors de la génération du PDF.');
    }
};
