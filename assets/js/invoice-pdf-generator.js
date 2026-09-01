// Générateur de PDF de facture pour les élèves
function invoicePdfText(value, fallback = '') {
    const text = value === null || value === undefined ? fallback : String(value);
    return text.trim() || fallback;
}

function invoicePdfAmount(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function invoicePdfFilePart(value, fallback = 'eleve') {
    return invoicePdfText(value, fallback)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Za-z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '') || fallback;
}

window.downloadInvoicePDF = async function(invoiceId) {
    try {
        console.log('📄 Génération de la facture PDF:', invoiceId);
        
        // Récupérer les données de la facture. Les anciens dossiers créés par
        // l'admin avant la génération automatique utilisent une facture locale.
        let invoice = null;
        let invoiceError = null;
        if (String(invoiceId || '').startsWith('admin-pack:')) {
            invoice = window.adminPackInvoiceFallbacks?.[invoiceId] || null;
            if (!invoice) invoiceError = new Error('Facture de forfait introuvable');
        } else {
            const result = await window.supabaseClient
                .from('invoices')
                .select('*')
                .eq('id', invoiceId)
                .single();
            invoice = result.data;
            invoiceError = result.error;
        }
        
        if (invoiceError || !invoice) {
            throw new Error('Erreur lors de la récupération de la facture');
        }

        const invoiceNumber = invoicePdfText(invoice.invoice_number, `INV-${invoice.id || Date.now()}`);
        const studentName = invoicePdfText(invoice.student_name, invoice.user_email || 'Eleve');
        const userEmail = invoicePdfText(invoice.user_email, '');
        const invoiceAmount = invoicePdfAmount(invoice.amount);
        const paymentDate = invoice.payment_date ? new Date(invoice.payment_date) : new Date();
        
        // Récupérer le téléphone de l'élève
        const { data: userData } = await window.supabaseClient
            .from('users')
            .select('telephone')
            .eq('email', userEmail)
            .single();
        
        invoice.student_phone = userData?.telephone || '';
        
        // Générer le PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Couleurs de l'auto-école
        const blackColor = [0, 0, 0];
        const fuchsiaColor = [236, 72, 153];
        const darkGray = [55, 65, 81];
        const lightGray = [243, 244, 246];
        const whiteColor = [255, 255, 255];
        
        let yPos = 15;
        
        // En-tête avec fond noir
        doc.setFillColor(...blackColor);
        doc.rect(0, 0, 210, 35, 'F');
        
        doc.setTextColor(...fuchsiaColor);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('AUTO ECOLE BRETEUIL', 15, 15);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...whiteColor);
        doc.text('1A Rue Édouard Delanglade', 15, 22);
        doc.text('13006 Marseille', 15, 27);
        doc.text('Tel: 04 91 53 36 98', 15, 32);
        
        // FACTURE en gros à droite
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...fuchsiaColor);
        doc.text('FACTURE', 195, 25, { align: 'right' });
        
        yPos = 45;
        
        // Numéro de facture et date
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...blackColor);
        doc.text(`Facture N ${invoiceNumber}`, 15, yPos);
        

        doc.setFont('helvetica', 'normal');
        doc.text(`Date: ${paymentDate.toLocaleDateString('fr-FR')}`, 195, yPos, { align: 'right' });
        
        yPos += 15;
        
        // Informations client
        doc.setFillColor(...lightGray);
        doc.rect(15, yPos - 5, 180, 45, 'F');
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...fuchsiaColor);
        doc.text('INFORMATIONS ELEVE:', 20, yPos);
        
        yPos += 8;
        doc.setFontSize(10);
        
        // Nom
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...blackColor);
        const nameParts = studentName.split(' ');
        const prenom = nameParts[0] || '';
        const nom = nameParts.slice(1).join(' ') || '';
        doc.text('Nom:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(nom, 50, yPos);
        
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Prenom:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(prenom, 50, yPos);
        
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Tel:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkGray);
        doc.text(invoice.student_phone || 'Non renseigne', 50, yPos);
        
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...blackColor);
        doc.text('Email:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkGray);
        doc.text(userEmail || 'Non renseigne', 50, yPos);
        
        yPos += 15;
        
        // Tableau des prestations
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...fuchsiaColor);
        doc.text('DETAILS DE LA PRESTATION', 15, yPos);
        
        yPos += 10;
        
        // En-tête du tableau
        doc.setFillColor(...blackColor);
        doc.rect(15, yPos - 5, 180, 10, 'F');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...fuchsiaColor);
        doc.text('DESCRIPTION', 20, yPos + 2);
        doc.text('QUANTITE', 130, yPos + 2);
        doc.text('MONTANT', 170, yPos + 2);
        
        yPos += 12;
        
        // Ligne de prestation
        doc.setFillColor(...lightGray);
        doc.rect(15, yPos - 5, 180, 10, 'F');
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...blackColor);
        
        let description = invoicePdfText(invoice.description, 'Paiement');
        if (invoice.forfait) {
            description = `Forfait ${invoice.forfait}`;
        } else if (invoice.hours_purchased) {
            description = `${invoice.hours_purchased} heure(s) de conduite`;
        }
        
        doc.text(description, 20, yPos + 2);
        doc.text('1', 135, yPos + 2);
        doc.text(`${invoiceAmount.toFixed(2)} ${String.fromCharCode(8364)}`, 175, yPos + 2);
        
        yPos += 20;
        
        // Calcul TVA 20%
        const totalTTC = invoiceAmount;
        const totalHT = (totalTTC / 1.20).toFixed(2);
        const montantTVA = (totalTTC - totalHT).toFixed(2);
        
        // Sous-total HT
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkGray);
        doc.text('Total HT', 135, yPos);
        doc.text(`${totalHT} ${String.fromCharCode(8364)}`, 175, yPos);
        
        yPos += 7;
        doc.text('TVA (20%)', 135, yPos);
        doc.text(`${montantTVA} ${String.fromCharCode(8364)}`, 175, yPos);
        
        yPos += 10;
        
        // Total TTC
        doc.setFillColor(...fuchsiaColor);
        doc.rect(130, yPos - 5, 65, 12, 'F');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...whiteColor);
        doc.text('TOTAL TTC', 135, yPos + 3);
        doc.text(`${totalTTC.toFixed(2)} ${String.fromCharCode(8364)}`, 175, yPos + 3);
        
        yPos += 25;
        
        // Informations de paiement
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...blackColor);
        doc.text('MODE DE PAIEMENT:', 15, yPos);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkGray);
        const paymentMethod = invoice.payment_method || 'Non specifie';
        doc.text(paymentMethod.toUpperCase(), 60, yPos);
        
        yPos += 7;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...blackColor);
        doc.text('STATUT:', 15, yPos);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(34, 197, 94); // Vert
        doc.text('PAYE', 60, yPos);
        
        yPos += 15;
        
        // Mentions légales SARL
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...darkGray);
        doc.text('TVA incluse (20%)', 15, yPos);
        
        // Pied de page
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkGray);
        doc.text(
            'Auto Ecole Breteuil - 1A Rue Édouard Delanglade, 13006 Marseille - Tel: 04 91 53 36 98 - Email: breteuilautoecole@gmail.com',
            105,
            285,
            { align: 'center' }
        );
        
        // Télécharger le PDF
        const fileName = `Facture_${invoicePdfFilePart(invoiceNumber, 'facture')}_${invoicePdfFilePart(studentName)}.pdf`;
        doc.save(fileName);
        
        console.log('✅ Facture PDF générée avec succès:', fileName);
        
    } catch (error) {
        console.error('❌ Erreur génération facture PDF:', error);
        alert('Erreur lors de la génération de la facture.');
    }
};

// Fonction pour créer une facture après un paiement
window.createInvoice = async function(paymentData) {
    try {
        console.log('📝 Création de la facture:', paymentData);
        
        // Générer le numéro de facture
        const { data: invoiceNumber, error: numberError } = await window.supabaseClient
            .rpc('generate_invoice_number');
        
        if (numberError) {
            throw new Error('Erreur lors de la génération du numéro de facture');
        }
        
        // Créer la facture
        const { data: invoice, error: invoiceError } = await window.supabaseClient
            .from('invoices')
            .insert({
                invoice_number: invoiceNumber,
                user_email: paymentData.userEmail,
                student_name: paymentData.studentName,
                amount: paymentData.amount,
                payment_method: paymentData.paymentMethod,
                description: paymentData.description,
                forfait: paymentData.forfait || null,
                hours_purchased: paymentData.hoursPurchased || null,
                payment_date: new Date().toISOString()
            })
            .select()
            .single();
        
        if (invoiceError) {
            throw new Error('Erreur lors de la création de la facture');
        }
        
        console.log('✅ Facture créée:', invoice);
        return invoice;
        
    } catch (error) {
        console.error('❌ Erreur création facture:', error);
        throw error;
    }
};
