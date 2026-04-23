const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
    // Autoriser uniquement les requêtes POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { studentEmail, studentName, pdfBase64 } = JSON.parse(event.body);

        if (!studentEmail || !pdfBase64) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Email et PDF requis' })
            };
        }

        // Configuration du transporteur email
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Options de l'email
        const mailOptions = {
            from: `"Auto Ecole Breteuil" <${process.env.EMAIL_USER}>`,
            to: studentEmail,
            subject: 'Votre fiche recapitulative - Auto Ecole Breteuil',
            html: `
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
            `,
            attachments: [
                {
                    filename: `Fiche_${studentName.replace(/\s+/g, '_')}.pdf`,
                    content: pdfBase64,
                    encoding: 'base64'
                }
            ]
        };

        // Envoyer l'email
        await transporter.sendMail(mailOptions);

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                message: 'Email envoye avec succes' 
            })
        };

    } catch (error) {
        console.error('Erreur envoi email:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Erreur lors de l\'envoi de l\'email',
                details: error.message 
            })
        };
    }
};
