const { getEnv } = require('./auth');

function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
}

function hasDrivingPreparationAccess(notification) {
    const hours = Number(notification?.hours_purchased || 0);
    const pack = String(notification?.pack || notification?.forfait || '').toLowerCase();
    if (hours > 0) return true;
    if (!pack || pack.includes('code') || pack.includes('carte-rdv') || pack.includes('accompagnement')) return false;
    return [
        'tarif-',
        'chill',
        'zen',
        'premium',
        'accelere',
        'boite-auto',
        'aac',
        'supervisee',
        'second-chance',
        'am',
        'heure-conduite',
        'heures-conduite'
    ].some((prefix) => pack.startsWith(prefix) || pack === prefix);
}

async function sendDecisionEmail(supabase, notificationId) {
    const { data: notification, error } = await supabase
        .from('inscription_notifications')
        .select('id,user_email,user_name,status,rejection_message,decision_email_sent,pack,hours_purchased')
        .eq('id', notificationId)
        .maybeSingle();
    if (error) throw error;
    if (!notification || !['approved', 'rejected'].includes(notification.status) || notification.decision_email_sent) {
        return false;
    }

    const staleClaim = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const claimedAt = new Date().toISOString();
    const { data: claimed, error: claimError } = await supabase
        .from('inscription_notifications')
        .update({ decision_email_claimed_at: claimedAt })
        .eq('id', notification.id)
        .eq('decision_email_sent', false)
        .or(`decision_email_claimed_at.is.null,decision_email_claimed_at.lt.${staleClaim}`)
        .select('id,user_email,user_name,status,rejection_message,pack,hours_purchased')
        .maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) return false;

    try {
        const apiKey = getEnv('RESEND_API_KEY');
        const from = getEnv('RESEND_FROM_EMAIL', ['EMAIL_FROM']);
        if (!apiKey || !from) throw new Error('EMAIL_NOT_CONFIGURED');
        const approved = claimed.status === 'approved';
        const name = escapeHtml(claimed.user_name || 'élève');
        const reason = escapeHtml(claimed.rejection_message || 'Dossier incomplet');
        const siteUrl = (getEnv('URL', ['SITE_URL']) || 'https://autoecolebreteuil.com').replace(/\/$/, '');
        const preparationBlock = approved && hasDrivingPreparationAccess(claimed)
            ? `<p>Votre plateforme de préparation conduite est également ouverte. Elle vous permet de réviser avant vos cours et de suivre les séances déjà validées.</p>
               <p><a href="${siteUrl}/cours-theorique.html">Accéder à ma préparation permis</a></p>`
            : '';
        const content = approved
            ? `<p>Bonjour <strong>${name}</strong>,</p>
               <p>Votre inscription à l'Auto-Ecole Breteuil est validée.</p>
               <p>Vous pouvez maintenant vous connecter avec l'adresse e-mail et le mot de passe choisis lors de l'inscription.</p>
               <p><a href="${siteUrl}/connexion.html">Accéder à mon espace élève</a></p>
               ${preparationBlock}`
            : `<p>Bonjour <strong>${name}</strong>,</p>
               <p>Votre inscription ne peut pas être validée en l'état.</p>
               <p><strong>Motif :</strong> ${reason}</p>
               <p>Contactez-nous pour compléter ou corriger votre dossier.</p>`;
        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from,
                to: claimed.user_email,
                subject: approved
                    ? 'Votre inscription est validée - Auto-Ecole Breteuil'
                    : 'Mise à jour de votre inscription - Auto-Ecole Breteuil',
                html: `${content}<hr><p>Auto-Ecole Breteuil<br>04 91 53 36 98<br>breteuilautoecole@gmail.com</p>`
            })
        });
        if (!emailResponse.ok) throw new Error(`EMAIL_PROVIDER_${emailResponse.status}`);
        const { error: sentError } = await supabase
            .from('inscription_notifications')
            .update({
                decision_email_sent: true,
                decision_email_sent_at: new Date().toISOString(),
                decision_email_claimed_at: null
            })
            .eq('id', claimed.id);
        if (sentError) throw sentError;
        return true;
    } catch (emailError) {
        await supabase
            .from('inscription_notifications')
            .update({ decision_email_claimed_at: null })
            .eq('id', claimed.id)
            .eq('decision_email_claimed_at', claimedAt);
        throw emailError;
    }
}

module.exports = { sendDecisionEmail };
