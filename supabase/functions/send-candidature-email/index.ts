import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { nom, prenom, email, telephone, poste, disponibilites, message, cvName, lettreName } = await req.json()

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ec4899, #be185d); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          td { padding: 12px; border: 1px solid #dee2e6; }
          .label { font-weight: bold; background: #f8f9fa; width: 40%; }
          .note { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Nouvelle Candidature</h1>
          </div>
          <div class="content">
            <h2>Informations du candidat</h2>
            <table>
              <tr>
                <td class="label">Nom</td>
                <td>${nom}</td>
              </tr>
              <tr>
                <td class="label">Prénom</td>
                <td>${prenom}</td>
              </tr>
              <tr>
                <td class="label">Email</td>
                <td><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr>
                <td class="label">Téléphone</td>
                <td>${telephone}</td>
              </tr>
              <tr>
                <td class="label">Poste souhaité</td>
                <td><strong>${poste}</strong></td>
              </tr>
              <tr>
                <td class="label">Disponibilités</td>
                <td>${disponibilites || 'Non renseignées'}</td>
              </tr>
              <tr>
                <td class="label">Message</td>
                <td>${message || 'Aucun message'}</td>
              </tr>
              <tr>
                <td class="label">CV</td>
                <td>${cvName || 'Non fourni'}</td>
              </tr>
              <tr>
                <td class="label">Lettre de motivation</td>
                <td>${lettreName || 'Non fournie'}</td>
              </tr>
            </table>
            <div class="note">
              <strong>📁 Note :</strong> Les fichiers (CV et lettre de motivation) sont stockés dans Supabase (table <code>candidatures</code>).
              <br><br>
              Pour consulter les fichiers, connectez-vous au dashboard Supabase et accédez à la table <code>candidatures</code>.
            </div>
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
        from: 'Auto-École Breteuil <onboarding@resend.dev>',
        to: ['breteuilautoecole@gmail.com'],
        subject: `Nouvelle candidature - ${prenom} ${nom} (${poste})`,
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
