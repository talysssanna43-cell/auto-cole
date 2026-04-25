const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
    const sig = event.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let stripeEvent;

    try {
        stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Webhook signature verification failed' })
        };
    }

    // Gérer l'événement checkout.session.completed
    if (stripeEvent.type === 'checkout.session.completed') {
        const session = stripeEvent.data.object;
        
        // Extraire les infos du client_reference_id
        // Format: email_5h_manual ou email_3h_automatic
        const clientRef = session.client_reference_id || '';
        const parts = clientRef.split('_');
        
        if (parts.length >= 3) {
            const email = parts.slice(0, -2).join('_'); // Reconstruire l'email
            const quantityStr = parts[parts.length - 2]; // "5h"
            const gearboxType = parts[parts.length - 1]; // "manual" ou "automatic"
            
            const quantity = parseInt(quantityStr.replace('h', ''));
            
            if (email && quantity > 0) {
                try {
                    // Récupérer l'utilisateur
                    const { data: user, error: userError } = await supabase
                        .from('users')
                        .select('hours_goal')
                        .eq('email', email)
                        .single();
                    
                    if (!userError && user) {
                        const newGoal = (user.hours_goal || 0) + quantity;
                        
                        // Mettre à jour hours_goal
                        const { error: updateError } = await supabase
                            .from('users')
                            .update({ hours_goal: newGoal })
                            .eq('email', email);
                        
                        if (!updateError) {
                            console.log(`✅ Hours updated for ${email}: +${quantity}h (new total: ${newGoal}h)`);
                            
                            // Créer une facture
                            const { data: userData } = await supabase
                                .from('users')
                                .select('prenom, nom')
                                .eq('email', email)
                                .single();
                            
                            const studentName = userData ? `${userData.prenom} ${userData.nom}` : 'Élève';
                            const amount = session.amount_total / 100; // Convertir centimes en euros
                            
                            // Générer le numéro de facture
                            const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number');
                            
                            // Créer la facture
                            await supabase.from('invoices').insert({
                                invoice_number: invoiceNumber,
                                user_email: email,
                                student_name: studentName,
                                amount: amount,
                                payment_method: 'Carte bancaire (Stripe)',
                                description: `${quantity} heure(s) de conduite supplémentaire(s)`,
                                hours_purchased: quantity,
                                payment_date: new Date().toISOString()
                            });
                            
                            console.log(`📄 Facture créée: ${invoiceNumber} pour ${email}`);
                        } else {
                            console.error('Error updating hours_goal:', updateError);
                        }
                    }
                } catch (err) {
                    console.error('Error processing payment:', err);
                }
            }
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ received: true })
    };
};
