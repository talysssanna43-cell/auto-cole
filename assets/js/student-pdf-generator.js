async function getStudentForPdf(studentEmail) {
    const email = String(studentEmail || '').trim();
    if (!email || !window.supabaseClient) return null;

    const { data: user, error: userError } = await window.supabaseClient
        .from('users')
        .select('*')
        .ilike('email', email)
        .maybeSingle();
    if (userError) console.warn('PDF eleve, users indisponible:', userError);
    if (user) return user;

    const { data: notification, error: notificationError } = await window.supabaseClient
        .from('inscription_notifications')
        .select('user_email,user_prenom,user_nom,user_name,user_telephone,telephone,pack,forfait,created_at,numero_neph')
        .ilike('user_email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (notificationError) console.warn('PDF eleve, inscription_notifications indisponible:', notificationError);

    if (!notification) {
        return { email, prenom: '', nom: '', telephone: '', forfait: '', created_at: null, numero_neph: '' };
    }

    const parts = String(notification.user_name || '').trim().split(/\s+/).filter(Boolean);
    return {
        email: notification.user_email || email,
        prenom: notification.user_prenom || parts.slice(0, -1).join(' ') || parts[0] || '',
        nom: notification.user_nom || parts.slice(-1).join('') || '',
        telephone: notification.user_telephone || notification.telephone || '',
        forfait: notification.forfait || notification.pack || '',
        created_at: notification.created_at,
        numero_neph: notification.numero_neph || ''
    };
}
// Telecharge la fiche eleve en PDF.
window.downloadStudentPDF = async function(studentEmail) {
    try {
        console.log('Generation du PDF pour:', studentEmail);
        
        // Recuperer les donnees de l'eleve, avec fallback si la table users ne contient pas le profil.
        const student = await getStudentForPdf(studentEmail);
        if (!student) {
            alert("Impossible de recuperer les donnees de l'eleve.");
            return;
        }
        
        // Recuperer les reservations
        const { data: reservations, error: resError } = await window.supabaseClient
            .from('reservations')
            .select('*, slots(*)')
            .eq('email', student.email)
            .order('created_at', { ascending: false });
        
        if (resError) {
            console.error('Erreur recuperation reservations:', resError);
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
        
        // Recuperer les annulations
        const { data: cancellations } = await window.supabaseClient
            .from('cancellation_requests')
            .select('*')
            .eq('user_email', student.email);
        
        const totalCancellations = (cancellations || []).filter(c => 
            c.status === 'accepted' || c.status === 'approved'
        ).length;
        
        // Generer le PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Couleurs de l'auto-ecole
        const blackColor = [0, 0, 0]; // Noir
        const fuchsiaColor = [236, 72, 153]; // Rose fuchsia
        const darkGray = [55, 65, 81]; // Gris fonce
        const lightGray = [243, 244, 246]; // Gris clair
        const whiteColor = [255, 255, 255]; // Blanc
        const greenColor = [34, 197, 94]; // Vert pour "Effectue"
        const redColor = [239, 68, 68]; // Rouge pour annulations
        
        let yPos = 15;
        
        // En-tete avec fond noir
        doc.setFillColor(...blackColor);
        doc.rect(0, 0, 210, 28, 'F');
        
        doc.setTextColor(...fuchsiaColor);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('AUTO ECOLE BRETEUIL', 15, 13);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...whiteColor);
        doc.text('1A Rue Edouard Delanglade, 13006 Marseille', 15, 20);
        doc.text('04 91 53 36 98   breteuilautoecole@gmail.com', 15, 25);
        
        yPos = 38;
        
        // Titre avec fond gris clair
        doc.setFillColor(...lightGray);
        doc.rect(10, yPos, 190, 10, 'F');
        doc.setTextColor(...blackColor);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('FICHE RECAPITULATIVE ELEVE', 105, yPos + 7, { align: 'center' });
        
        yPos += 18;
        
        // Informations personnelles
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...fuchsiaColor);
        doc.text('Informations personnelles', 15, yPos);
        yPos += 8;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        const infoData = [
            ['NOM COMPLET', `${student.prenom || ''} ${student.nom || ''}`],
            ['EMAIL', student.email || '-'],
            ['TELEPHONE', student.telephone || '-'],
            ['NUMERO NEPH', student.numero_neph || '-']
        ];
        
        infoData.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...darkGray);
            doc.text(label, 15, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...blackColor);
            doc.text(value, 80, yPos);
            yPos += 6;
        });
        
        yPos += 5;
        
        // Forfait et Statistiques
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...fuchsiaColor);
        doc.text('Forfait & Statistiques', 15, yPos);
        yPos += 8;
        
        // Grille de statistiques
        const stats = [
            { label: 'FORFAIT', value: student.forfait || 'Non defini', color: fuchsiaColor },
            { label: 'HEURES EFFECTUEES', value: `${totalHours}h`, color: greenColor },
            { label: 'SEANCES REALISEES', value: completedSessions.length.toString(), color: blackColor }
        ];
        
        const stats2 = [
            { label: 'SEANCES A VENIR', value: upcomingSessions.length.toString(), color: blackColor },
            { label: 'ANNULATIONS', value: totalCancellations.toString(), color: redColor },
            { label: 'DATE D\'INSCRIPTION', value: student.created_at ? new Date(student.created_at).toLocaleDateString('fr-FR') : '-', color: blackColor }
        ];
        
        doc.setFontSize(9);
        let xPos = 15;
        
        stats.forEach(stat => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...darkGray);
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
            doc.setTextColor(...darkGray);
            doc.text(stat.label, xPos, yPos);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...stat.color);
            doc.setFontSize(14);
            doc.text(stat.value, xPos, yPos + 7);
            doc.setFontSize(9);
            xPos += 63;
        });
        
        yPos += 18;
        
        // Historique des seances
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...fuchsiaColor);
        doc.text('Historique des seances', 15, yPos);
        yPos += 8;
        
        if (completedSessions.length === 0) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(...darkGray);
            doc.text('Aucune seance enregistree.', 15, yPos);
        } else {
            // En-tete du tableau avec fond noir
            doc.setFillColor(...blackColor);
            doc.rect(15, yPos - 5, 180, 8, 'F');
            
            doc.setTextColor(...fuchsiaColor);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('DATE', 20, yPos);
            doc.text('HORAIRE', 70, yPos);
            doc.text('MONITEUR', 110, yPos);
            doc.text('STATUT', 160, yPos);
            
            yPos += 8;
            
            // Lignes du tableau
            doc.setTextColor(...blackColor);
            doc.setFont('helvetica', 'normal');
            
            const sessionsToShow = completedSessions.slice(0, 15); // Limiter a 15 seances
            
            sessionsToShow.forEach((res, index) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                
                // Fond alterne gris clair
                if (index % 2 === 0) {
                    doc.setFillColor(...lightGray);
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
                
                let statusStr = 'A venir';
                let statusColor = [0, 0, 0];
                const isPast = slotDate && slotDate < now;
                
                if (res.status === 'completed' || res.status === 'done' || (isPast && res.status === 'upcoming')) {
                    statusStr = 'Effectue';
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
            doc.setTextColor(...darkGray);
            doc.setFont('helvetica', 'italic');
            doc.text(
                `Document genere le ${new Date().toLocaleDateString('fr-FR')}   Auto Ecole Breteuil   1A Rue Edouard Delanglade, 13006 Marseille`,
                105,
                290,
                { align: 'center' }
            );
        }
        
        // Telecharger le PDF
        const fileName = `Fiche_${student.prenom}_${student.nom}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`;
        doc.save(fileName);
        
        console.log('PDF genere avec succes:', fileName);
        
    } catch (error) {
        console.error('Erreur generation PDF:', error);
        alert('Erreur lors de la generation du PDF.');
    }
};

// Envoie la fiche PDF par email a l'eleve.
window.sendStudentPDFByEmail = async function(studentEmail) {
    try {
        console.log('Envoi du PDF par email a:', studentEmail);
        
        // Afficher un message de chargement
        const loadingMsg = document.createElement('div');
        loadingMsg.id = 'emailLoadingMsg';
        loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); color: white; padding: 2rem 3rem; border-radius: 12px; z-index: 10000; text-align: center;';
        loadingMsg.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i><br><strong>Envoi du PDF en cours...</strong>';
        document.body.appendChild(loadingMsg);
        
        // Recuperer les donnees de l'eleve, avec fallback si la table users ne contient pas le profil.
        const student = await getStudentForPdf(studentEmail);
        if (!student) {
            throw new Error("Impossible de recuperer les donnees de l'eleve");
        }
        
        // Recuperer les reservations
        const { data: reservations } = await window.supabaseClient
            .from('reservations')
            .select('*, slots(*)')
            .eq('email', student.email)
            .order('created_at', { ascending: false });
        
        // Calculer les statistiques
        const now = new Date();
        const completedSessions = (reservations || []).filter(r => {
            const slotDate = r.slots?.start_at ? new Date(r.slots.start_at) : null;
            const isPast = slotDate && slotDate < now;
            return r.status === 'completed' || r.status === 'done' || (isPast && r.status === 'upcoming');
        });
        
        const upcomingSessions = (reservations || []).filter(r => {
            const slotDate = r.slots?.start_at ? new Date(r.slots.start_at) : null;
            const isFuture = slotDate && slotDate >= now;
            return r.status === 'upcoming' && isFuture;
        });
        
        const { data: cancellations } = await window.supabaseClient
            .from('cancellation_requests')
            .select('*')
            .eq('user_email', student.email);
        
        const totalCancellations = (cancellations || []).filter(c => 
            c.status === 'accepted' || c.status === 'approved'
        ).length;
        
        const totalHours = completedSessions.length * 2;
        
        // Generer le PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Generer le contenu du PDF
        await generatePDFContent(doc, student, completedSessions, upcomingSessions, totalHours, totalCancellations, now);
        
        // Convertir le PDF en base64
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        
        // Envoyer l'email via Netlify Function
        const response = await fetch('/.netlify/functions/send-student-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${window.authSession?.getToken() || ''}`
            },
            body: JSON.stringify({
                studentEmail: student.email,
                studentName: `${student.prenom} ${student.nom}`,
                pdfBase64: pdfBase64
            })
        });
        
        const result = await response.json();
        
        // Supprimer le message de chargement
        document.body.removeChild(loadingMsg);
        
        if (response.ok && result.ok) {
            alert(`Email envoye avec succes a ${student.email}`);
        } else {
            throw new Error(result.error || 'Erreur lors de l\'envoi de l\'email');
        }
        
    } catch (error) {
        console.error('Erreur envoi email:', error);
        const loadingMsg = document.getElementById('emailLoadingMsg');
        if (loadingMsg) document.body.removeChild(loadingMsg);
        alert('Erreur lors de l\'envoi de l\'email: ' + error.message);
    }
};

// Fonction commune pour generer le contenu du PDF
async function generatePDFContent(doc, student, completedSessions, upcomingSessions, totalHours, totalCancellations, now) {
    // Couleurs de l'auto-ecole
    const blackColor = [0, 0, 0];
    const fuchsiaColor = [236, 72, 153];
    const darkGray = [55, 65, 81];
    const lightGray = [243, 244, 246];
    const whiteColor = [255, 255, 255];
    const greenColor = [34, 197, 94];
    const redColor = [239, 68, 68];
    
    let yPos = 15;
    
    // En-tete
    doc.setFillColor(...blackColor);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(...fuchsiaColor);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('AUTO ECOLE BRETEUIL', 15, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...whiteColor);
    doc.text('1A Rue Edouard Delanglade, 13006 Marseille', 15, 20);
    doc.text('04 91 53 36 98   breteuilautoecole@gmail.com', 15, 25);
    
    yPos = 38;
    
    // Titre
    doc.setFillColor(...lightGray);
    doc.rect(10, yPos, 190, 10, 'F');
    doc.setTextColor(...blackColor);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('FICHE RECAPITULATIVE ELEVE', 105, yPos + 7, { align: 'center' });
    
    yPos += 18;
    
    // Informations personnelles
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...fuchsiaColor);
    doc.text('Informations personnelles', 15, yPos);
    yPos += 8;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const infoData = [
        ['NOM COMPLET', `${student.prenom || ''} ${student.nom || ''}`],
        ['EMAIL', student.email || '-'],
        ['TELEPHONE', student.telephone || '-'],
        ['NUMERO NEPH', student.numero_neph || '-']
    ];
    
    infoData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkGray);
        doc.text(label, 15, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...blackColor);
        doc.text(value, 80, yPos);
        yPos += 6;
    });
    
    yPos += 5;
    
    // Forfait et Statistiques
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...fuchsiaColor);
    doc.text('Forfait & Statistiques', 15, yPos);
    yPos += 8;
    
    const stats = [
        { label: 'FORFAIT', value: student.forfait || 'Non defini', color: fuchsiaColor },
        { label: 'HEURES EFFECTUEES', value: `${totalHours}h`, color: greenColor },
        { label: 'SEANCES REALISEES', value: completedSessions.length.toString(), color: blackColor }
    ];
    
    const stats2 = [
        { label: 'SEANCES A VENIR', value: upcomingSessions.length.toString(), color: blackColor },
        { label: 'ANNULATIONS', value: totalCancellations.toString(), color: redColor },
        { label: 'DATE D\'INSCRIPTION', value: student.created_at ? new Date(student.created_at).toLocaleDateString('fr-FR') : '-', color: blackColor }
    ];
    
    doc.setFontSize(9);
    let xPos = 15;
    
    stats.forEach(stat => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkGray);
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
        doc.setTextColor(...darkGray);
        doc.text(stat.label, xPos, yPos);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...stat.color);
        doc.setFontSize(14);
        doc.text(stat.value, xPos, yPos + 7);
        doc.setFontSize(9);
        xPos += 63;
    });
    
    yPos += 18;
    
    // Historique
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...fuchsiaColor);
    doc.text('Historique des seances', 15, yPos);
    yPos += 8;
    
    if (completedSessions.length === 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...darkGray);
        doc.text('Aucune seance enregistree.', 15, yPos);
    } else {
        doc.setFillColor(...blackColor);
        doc.rect(15, yPos - 5, 180, 8, 'F');
        doc.setTextColor(...fuchsiaColor);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('DATE', 20, yPos);
        doc.text('HORAIRE', 70, yPos);
        doc.text('MONITEUR', 110, yPos);
        doc.text('STATUT', 160, yPos);
        
        yPos += 8;
        doc.setTextColor(...blackColor);
        doc.setFont('helvetica', 'normal');
        
        const sessionsToShow = completedSessions.slice(0, 15);
        
        sessionsToShow.forEach((res, index) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            
            if (index % 2 === 0) {
                doc.setFillColor(...lightGray);
                doc.rect(15, yPos - 5, 180, 7, 'F');
            }
            
            const slotDate = res.slots?.start_at ? new Date(res.slots.start_at) : null;
            const dateStr = slotDate ? slotDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
            const timeStr = slotDate ? slotDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-';
            const instructor = res.slots?.instructor || '-';
            
            let statusStr = 'A venir';
            let statusColor = blackColor;
            const isPast = slotDate && slotDate < now;
            
            if (res.status === 'completed' || res.status === 'done' || (isPast && res.status === 'upcoming')) {
                statusStr = 'Effectue';
                statusColor = greenColor;
            }
            
            doc.setTextColor(...blackColor);
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
        doc.setTextColor(...darkGray);
        doc.setFont('helvetica', 'italic');
        doc.text(
            `Document genere le ${new Date().toLocaleDateString('fr-FR')}   Auto Ecole Breteuil   1A Rue Edouard Delanglade, 13006 Marseille`,
            105,
            290,
            { align: 'center' }
        );
    }
}

