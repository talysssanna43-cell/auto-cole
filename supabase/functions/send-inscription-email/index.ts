import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userEmail, userName, decision, rejectionMessage } = await req.json()

    const isApproved = decision === 'approved'
    const subject = isApproved 
      ? '✅ Votre inscription a été validée - Auto-École Breteuil'
      : '❌ Votre inscription a été refusée - Auto-École Breteuil'

    const htmlContent = isApproved ? `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #11998e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Inscription Validée !</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${userName}</strong>,</p>
            <p>Nous avons le plaisir de vous informer que votre inscription à l'Auto-École Breteuil a été <strong>validée avec succès</strong> !</p>
            <p>Vous pouvez dès maintenant accéder à votre espace élève pour :</p>
            <ul>
              <li>Consulter votre planning de cours</li>
              <li>Réserver vos heures de conduite</li>
              <li>Suivre votre progression</li>
            </ul>
            <p style="text-align: center;">
              <a href="${Deno.env.get('SITE_URL')}/connexion.html" class="button">Accéder à mon espace</a>
            </p>
            <p>Bienvenue dans notre auto-école ! 🚗</p>
          </div>
          <div class="footer">
            <p>Auto-École Breteuil<br>
            1 Rue Édouard Delanglade, 13006 Marseille<br>
            📞 04 91 53 36 98 | ✉️ a.e.breteuil@gmail.com</p>
          </div>
        </div>
      </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .message-box { background: white; border-left: 4px solid #ee0979; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; background: #0071e3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Inscription Refusée</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${userName}</strong>,</p>
            <p>Nous vous informons que votre inscription à l'Auto-École Breteuil n'a malheureusement pas pu être validée.</p>
            <div class="message-box">
              <strong>Raison du refus :</strong>
              <p>${rejectionMessage}</p>
            </div>
            <p>Si vous souhaitez obtenir plus d'informations ou corriger votre dossier, n'hésitez pas à nous contacter.</p>
            <p style="text-align: center;">
              <a href="mailto:a.e.breteuil@gmail.com" class="button">Nous contacter</a>
            </p>
          </div>
          <div class="footer">
            <p>Auto-École Breteuil<br>
            1 Rue Édouard Delanglade, 13006 Marseille<br>
            📞 04 91 53 36 98 | ✉️ a.e.breteuil@gmail.com</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Auto-École Breteuil <talysssanna43@gmail.com>',
        to: [userEmail],
        subject: subject,
        html: htmlContent,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Failed to send email')
    }

    return new Response(
      JSON.stringify({ success: true, messageId: data.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
