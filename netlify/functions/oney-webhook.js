// Legacy Oney implementation retained below for history only. The public handler
// is retired and must not initialize payment or database clients.

exports.legacyHandler = async function handler(event) {
    console.log('📨 Webhook Oney reçu');

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Méthode non autorisée' })
        };
    }

    let payload;
    try {
        payload = JSON.parse(event.body || '{}');
    } catch (error) {
        console.error('❌ Erreur parsing webhook:', error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Corps de requête invalide' })
        };
    }

    console.log('📦 Payload Oney webhook:', payload);

    // TODO: Vérifier la signature du webhook Oney pour sécurité
    // Exemple (à adapter selon la doc Oney):
    /*
    const signature = event.headers['x-oney-signature'];
    const isValid = verifyOneySignature(payload, signature, oneyApiSecret);
    if (!isValid) {
        console.error('❌ Signature webhook invalide');
        return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
    }
    */

    try {
        const {
            payment_id,
            status,
            amount,
            customer_email,
            installments_count,
            metadata
        } = payload;

        console.log(`💳 Paiement Oney ${payment_id} - Statut: ${status}`);

        // Traiter selon le statut du paiement
        if (status === 'accepted' || status === 'completed') {
            console.log('✅ Paiement Oney accepté');

            // Récupérer les informations du pack depuis metadata
            const packId = metadata?.pack_id;
            const packLabel = metadata?.pack_label;
            const customerEmail = metadata?.customer_email || customer_email;

            // Enregistrer le paiement dans Supabase
            const { data: paymentRecord, error: paymentError } = await supabase
                .from('payments')
                .insert({
                    user_email: customerEmail,
                    amount: amount / 100, // Convertir centimes en euros
                    payment_method: 'oney',
                    payment_status: 'completed',
                    payment_id: payment_id,
                    pack_id: packId,
                    installments_count: installments_count,
                    metadata: {
                        oney_payment_id: payment_id,
                        pack_label: packLabel,
                        installments: installments_count
                    },
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (paymentError) {
                console.error('❌ Erreur enregistrement paiement:', paymentError);
                throw paymentError;
            }

            console.log('💾 Paiement enregistré:', paymentRecord);

            // Mettre à jour l'inscription si elle existe
            const { error: updateError } = await supabase
                .from('inscription_notifications')
                .update({
                    payment_status: 'paid',
                    payment_method: 'oney',
                    payment_id: payment_id,
                    amount_paid: amount / 100
                })
                .eq('user_email', customerEmail)
                .eq('pack', packId);

            if (updateError) {
                console.warn('⚠️ Erreur mise à jour inscription:', updateError);
            }

            // Créer une facture
            try {
                const { data: userData } = await supabase
                    .from('users')
                    .select('prenom, nom')
                    .eq('email', customerEmail)
                    .single();
                
                const studentName = userData ? `${userData.prenom} ${userData.nom}` : 'Élève';
                
                // Générer le numéro de facture
                const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number');
                
                // Créer la facture
                await supabase.from('invoices').insert({
                    invoice_number: invoiceNumber,
                    user_email: customerEmail,
                    student_name: studentName,
                    amount: amount / 100,
                    payment_method: `Oney (${installments_count}x)`,
                    description: packLabel || 'Forfait auto-école',
                    forfait: packId,
                    payment_date: new Date().toISOString()
                });
                
                console.log(`📄 Facture créée: ${invoiceNumber} pour ${customerEmail}`);
            } catch (invoiceError) {
                console.error('❌ Erreur création facture:', invoiceError);
            }

            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    message: 'Webhook traité avec succès',
                    payment_id: payment_id
                })
            };

        } else if (status === 'refused' || status === 'failed') {
            console.log('❌ Paiement Oney refusé');

            // Enregistrer l'échec
            await supabase
                .from('payments')
                .insert({
                    user_email: metadata?.customer_email || customer_email,
                    amount: amount / 100,
                    payment_method: 'oney',
                    payment_status: 'failed',
                    payment_id: payment_id,
                    metadata: {
                        oney_payment_id: payment_id,
                        failure_reason: payload.failure_reason || 'Unknown'
                    },
                    created_at: new Date().toISOString()
                });

            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    message: 'Paiement refusé enregistré',
                    payment_id: payment_id
                })
            };

        } else {
            console.log(`ℹ️ Statut Oney: ${status}`);
            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    message: 'Statut enregistré',
                    status: status
                })
            };
        }

    } catch (error) {
        console.error('❌ Erreur traitement webhook Oney:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                message: 'Erreur serveur',
                error: error.message 
            })
        };
    }
};

// Stripe is the only supported payment workflow.
exports.handler = async function retiredOneyWebhook() {
    return {
        statusCode: 410,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ error: 'PAYMENT_METHOD_RETIRED' })
    };
};
