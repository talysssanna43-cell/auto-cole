const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ok: false, error: 'METHOD_NOT_ALLOWED' })
        };
    }

    try {
        const apiKey = process.env.RESEND_API_KEY;
        const from = process.env.RESEND_FROM_EMAIL;

        if (!apiKey || !from) {
            console.error('Missing RESEND_API_KEY or RESEND_FROM_EMAIL');
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ok: false, error: 'EMAIL_NOT_CONFIGURED' })
            };
        }

        const { studentEmail, studentName, pdfBase64 } = JSON.parse(event.body || '{}');

        if (!studentEmail || !pdfBase64) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ok: false, error: 'MISSING_EMAIL_OR_PDF' })
            };
        }

        console.log('📧 Sending PDF to:', studentEmail);

        // HTML de l'email
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #000; padding: 20px; text-align: center;">
                    <h1 style="color: #EC4899; margin: 0;">AUTO ECOLE BRETEUIL</h1>
                </div>
                
                <div style="padding: 30px; background: #f9f9f9;">
                    <h2 style="color: #333;">Bonjour ${studentName || ''},</h2>
                    
                    <p style="color: #666; line-height: 1.6;">
                        Vous trouverez ci-joint votre fiche recapitulative contenant toutes vos informations 
                        et l'historique de vos seances de conduite.
                    </p>
                    
                    <p style="color: #666; line-height: 1.6;">
                        Si vous avez des questions, n'hesitez pas a nous contacter.
                    </p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                        <p style="color: #999; font-size: 14px; margin: 5px 0;">
                            <strong>Auto Ecole Breteuil</strong><br>
                            1A rue Edouard Delanglade, 13006 Marseille<br>
                            Tel: 04 91 53 36 98<br>
                            Email: breteuilautoecole@gmail.com
                        </p>
                    </div>
                </div>
            </div>
        `;

        // Envoyer l'email avec Resend
        const resp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from,
                to: studentEmail,
                subject: 'Votre fiche recapitulative - Auto Ecole Breteuil',
                html,
                attachments: [
                    {
                        filename: `Fiche_${studentName.replace(/\s+/g, '_')}.pdf`,
                        content: pdfBase64
                    }
                ]
            })
        });

        const data = await resp.json().catch(() => ({}));

        if (!resp.ok) {
            console.error('Resend API error:', data);
            return {
                statusCode: 502,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ok: false, error: 'EMAIL_PROVIDER_ERROR', details: data })
            };
        }

        console.log('✅ Email sent successfully:', data.id);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ok: true, provider: 'resend', id: data.id || null })
        };

    } catch (error) {
        console.error('❌ Erreur envoi email:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ok: false, error: 'INTERNAL_ERROR', details: error.message })
        };
    }
};
