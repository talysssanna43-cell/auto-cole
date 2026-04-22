import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const { record } = await req.json()
    
    // Envoyer l'email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Auto-École Breteuil <notifications@breteuilautoecole.com>',
        to: ['breteuilautoecole@gmail.com'],
        subject: `Nouvelle demande de devis - ${record.prenom} ${record.nom}`,
        html: `
          <h2>Nouvelle demande de devis</h2>
          <p><strong>Nom :</strong> ${record.nom}</p>
          <p><strong>Prénom :</strong> ${record.prenom}</p>
          <p><strong>Email :</strong> ${record.email}</p>
          <p><strong>Téléphone :</strong> ${record.telephone}</p>
          <p><strong>Date de naissance :</strong> ${record.date_naissance || 'Non renseignée'}</p>
          <p><strong>Financement :</strong> ${record.financement || 'Non renseigné'}</p>
          <p><strong>Organisme :</strong> ${record.organisme || 'Non renseigné'}</p>
          <p><strong>Forfait :</strong> ${record.forfait || 'Non renseigné'}</p>
          <p><strong>Message :</strong></p>
          <p>${record.message || 'Aucun message'}</p>
          <hr>
          <p><small>Demande reçue le ${new Date(record.created_at).toLocaleString('fr-FR')}</small></p>
        `
      })
    })

    const data = await res.json()
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
