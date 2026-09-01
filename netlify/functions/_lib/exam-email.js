const { getEnv } = require('./auth');

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function siteUrl() {
    return String(getEnv('URL') || getEnv('SITE_URL') || 'https://auto-ecole-breteuil.fr').replace(/\/$/, '');
}

function formatDate(value) {
    if (!value) return '';
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

function formatTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
}

function genderWords(value) {
    const genre = String(value || '').toLowerCase();
    if (genre === 'femme') {
        return {
            pret: 'prête',
            fier: 'fière',
            accompagne: 'accompagnée',
            repose: 'reposée',
            seul: 'seule'
        };
    }
    if (genre === 'homme') {
        return {
            pret: 'prêt',
            fier: 'fier',
            accompagne: 'accompagné',
            repose: 'reposé',
            seul: 'seul'
        };
    }
    return {
        pret: 'prêt(e)',
        fier: 'fier/fière',
        accompagne: 'accompagné(e)',
        repose: 'reposé(e)',
        seul: 'seul(e)'
    };
}

async function sendResendEmail({ to, subject, html, attachments = [] }) {
    const apiKey = getEnv('RESEND_API_KEY');
    const from = getEnv('RESEND_FROM_EMAIL');
    if (!apiKey || !from) throw new Error('EMAIL_NOT_CONFIGURED');

    const providerResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ from, to, subject, html, attachments })
    });
    const result = await providerResponse.json().catch(() => ({}));
    if (!providerResponse.ok) throw new Error(`EMAIL_PROVIDER_ERROR:${JSON.stringify(result)}`);
    return result;
}

function examScheduledHtml(exam) {
    const studentName = escapeHtml(exam.student_name || 'Bonjour');
    const words = genderWords(exam.genre);
    const resultUrl = `${siteUrl()}/espace-eleve.html?exam_result=${encodeURIComponent(exam.id)}`;
    const startTime = formatTime(exam.start_at);
    const endTime = formatTime(exam.end_at);
    const timeLine = startTime && endTime
        ? `<p><strong>Créneau réservé :</strong> ${escapeHtml(startTime)} - ${escapeHtml(endTime)}</p>`
        : '';

    return `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#1a1a2e;line-height:1.65;">
            <div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:18px;padding:24px;margin-bottom:24px;">
                <h1 style="color:#16a34a;margin:0 0 12px;font-size:28px;">Ta date d'examen est confirmée</h1>
                <p style="margin:0;font-size:17px;">C'est une vraie étape. Tu avances, tu progresses, et toute l'équipe reste avec toi jusqu'au bout.</p>
            </div>

            <p>Bonjour ${studentName},</p>

            <p>Nous sommes très contents de t'annoncer que ta date d'examen pratique du permis de conduire est confirmée. Ce moment peut impressionner, c'est normal : cela montre aussi que tu prends cette étape au sérieux.</p>

            <p>Garde confiance. Tu as déjà construit des automatismes, tu sais mieux observer, décider et corriger qu'au début de ta formation. Le jour J, l'objectif n'est pas d'être parfait, mais de conduire avec calme, méthode et sécurité.</p>

            <p>Tu ne seras pas ${words.seul}. Ton moniteur t'accompagnera, te donnera les dernières consignes et te contactera pour te préciser l'heure exacte du rendez-vous.</p>

            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:18px;margin:22px 0;">
                <p><strong>Date :</strong> ${escapeHtml(formatDate(exam.exam_date))}</p>
                ${timeLine}
                <p><strong>Lieu d'examen :</strong> ${escapeHtml(exam.location)}</p>
                <p><strong>Moniteur accompagnateur :</strong> ${escapeHtml(exam.instructor)}</p>
            </div>

            <p><strong>Documents à prévoir :</strong> uniquement ta pièce d'identité et ta convocation. Pense à les préparer la veille pour arriver ${words.repose} et l'esprit libre.</p>

            <p>Tu peux être ${words.fier} du chemin déjà parcouru. Maintenant, il est grand temps d'aller de l'avant : on continue avec sérieux, confiance et attention jusqu'au permis.</p>

            <p>48h après l'examen, nous t'enverrons un message pour renseigner ton résultat et déposer ta fiche résultat du permis si tu l'as reçue.</p>

            <p style="margin:28px 0;">
                <a href="${resultUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:700;">Accéder à mon espace élève</a>
            </p>

            <p style="margin-top:24px;">Merci pour ta confiance. Toute l'équipe de l'Auto-Ecole Breteuil te souhaite une très belle réussite.</p>
            <p style="font-weight:700;">Auto-Ecole Breteuil</p>
        </div>
    `;
}

function examResultRequestHtml(exam) {
    const studentName = escapeHtml(exam.student_name || 'Bonjour');
    const resultUrl = `${siteUrl()}/espace-eleve.html?exam_result=${encodeURIComponent(exam.id)}`;
    return `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#1a1a2e;line-height:1.6;">
            <h1 style="color:#16a34a;">Comment s'est passé ton examen ?</h1>
            <p>Bonjour ${studentName},</p>
            <p>Ton examen de conduite du ${escapeHtml(formatDate(exam.exam_date))} est passé. Tu peux maintenant nous indiquer ton résultat depuis ton espace élève.</p>
            <p>Tu peux aussi joindre ta fiche résultat du permis en PDF. Cela nous permet de suivre ton dossier sérieusement et de t'accompagner au mieux.</p>
            <p style="margin:26px 0;">
                <a href="${resultUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:700;">Renseigner mon résultat</a>
            </p>
            <p>Si c'est réussi, nous serons ravis de le valider avec toi. Si ce n'est pas encore bon, rien n'est perdu : nous regarderons les erreurs indiquées sur la fiche et nous retravaillerons dessus pour te représenter dans les meilleures conditions.</p>
            <p style="font-weight:700;">Auto-Ecole Breteuil</p>
        </div>
    `;
}

function resultReceivedHtml(exam) {
    const passed = exam.result === 'passed';
    const title = passed ? 'Bravo pour ton permis !' : 'On continue ensemble';
    const message = passed
        ? "Toute l'équipe est très heureuse pour toi. Ton résultat a bien été enregistré dans ton dossier."
        : "Ton résultat a bien été enregistré. Rien n'est perdu : nous allons travailler les erreurs précisées sur ta fiche résultat et préparer une nouvelle présentation à l'examen.";
    return `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#1a1a2e;line-height:1.6;">
            <h1 style="color:#16a34a;">${title}</h1>
            <p>Bonjour ${escapeHtml(exam.student_name || '')},</p>
            <p>${message}</p>
            <p>Merci pour ta confiance. L'Auto-Ecole Breteuil reste à tes côtés jusqu'au bout.</p>
            <p style="font-weight:700;">Auto-Ecole Breteuil</p>
        </div>
    `;
}

module.exports = {
    examResultRequestHtml,
    examScheduledHtml,
    resultReceivedHtml,
    sendResendEmail
};
