const { getSupabaseAdmin } = require('./_lib/auth');
const { sendResendEmail } = require('./_lib/exam-email');
const { requireScheduledInvocation } = require('./_lib/scheduled');

const SENT_MARKER = '[PREP_REMINDER_SENT_AT:';
const TOTAL_SESSIONS = 7;
const PREP_SESSIONS = [
    { id: 1, title: 'Documents et installation' },
    { id: 2, title: 'Voyants du tableau de bord' },
    { id: 3, title: 'Commandes et securite' },
    { id: 4, title: 'Pneus, niveaux et entretien' },
    { id: 5, title: 'Chargement et passagers' },
    { id: 6, title: 'Eco-conduite et risques' },
    { id: 7, title: 'Premiers secours' }
];

function siteUrl() {
    return String(process.env.URL || process.env.SITE_URL || 'https://autoecolebreteuil.com').replace(/\/$/, '');
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function cleanEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function hasReminderBeenSent(notes) {
    return String(notes || '').includes(SENT_MARKER);
}

function formatDateTime(startAt, endAt) {
    const start = new Date(startAt);
    const end = new Date(endAt);
    if (Number.isNaN(start.getTime())) return { date: '', start: '', end: '' };
    return {
        date: start.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }),
        start: start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).replace(':', 'h'),
        end: Number.isNaN(end.getTime()) ? '' : end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).replace(':', 'h')
    };
}

function isDrivingPack(user) {
    const pack = String(user?.forfait || user?.pack || '').toLowerCase();
    const goal = Number(user?.hours_goal || user?.hours_purchased || 0);
    if (goal > 0) return true;
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

function missingTable(error) {
    const message = String(error?.message || error?.details || '');
    return error?.code === '42P01' || error?.code === 'PGRST205' || /schema cache|does not exist|driving_prep_progress/i.test(message);
}

async function loadProgress(supabase, email) {
    const { data, error } = await supabase
        .from('driving_prep_progress')
        .select('session_id,session_title,best_percent,last_reviewed_at')
        .ilike('student_email', email)
        .order('session_id', { ascending: true });
    if (error) {
        if (missingTable(error)) return [];
        throw error;
    }
    return data || [];
}

function progressSummary(items) {
    const bySession = new Map((items || []).map((item) => [Number(item.session_id), item]));
    const todo = PREP_SESSIONS
        .filter((session) => Number(bySession.get(session.id)?.best_percent || 0) < 70)
        .slice(0, 4);
    const validated = PREP_SESSIONS.length - PREP_SESSIONS.filter((session) => Number(bySession.get(session.id)?.best_percent || 0) < 70).length;
    return { todo, validated };
}

function reminderHtml({ reservation, slot, user, progress }) {
    const studentName = escapeHtml(`${user?.prenom || reservation.first_name || ''} ${user?.nom || reservation.last_name || ''}`.trim() || 'Bonjour');
    const instructor = escapeHtml(slot.instructor || 'ton moniteur');
    const when = formatDateTime(slot.start_at, slot.end_at);
    const prepUrl = `${siteUrl()}/cours-theorique.html`;
    const { todo, validated } = progressSummary(progress);
    const todoHtml = todo.length
        ? `<ul style="margin:12px 0 0;padding-left:20px;color:#334155;">
                ${todo.map((item) => `<li>${escapeHtml(item.title)}</li>`).join('')}
           </ul>`
        : '<p style="margin:12px 0 0;color:#15803d;font-weight:700;">Toutes les séances de préparation sont validées. Une relecture rapide suffit.</p>';

    return `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#17172a;line-height:1.65;background:#ffffff;">
            <div style="background:#17172a;border-radius:22px 22px 0 0;padding:28px 30px;">
                <h1 style="margin:0;color:#ec4899;font-size:26px;">Prépare ton cours de demain</h1>
                <p style="margin:8px 0 0;color:#fff;font-size:16px;">15 minutes pour arriver plus à l'aise au volant.</p>
            </div>
            <div style="border:1px solid #eef2f7;border-top:0;border-radius:0 0 22px 22px;padding:30px;background:#fff;">
                <p>Bonjour <strong>${studentName}</strong>,</p>
                <p>Ton cours de conduite est prévu demain avec <strong>${instructor}</strong>.</p>
                <div style="background:#f8fbff;border:1px solid #dbeafe;border-radius:16px;padding:18px;margin:20px 0;">
                    <p style="margin:0;"><strong>Date :</strong> ${escapeHtml(when.date)}</p>
                    <p style="margin:6px 0 0;"><strong>Horaire :</strong> ${escapeHtml(when.start)}${when.end ? ` - ${escapeHtml(when.end)}` : ''}</p>
                </div>
                <p>Avant le cours, prends un moment pour réviser la préparation en ligne. Elle est faite pour t'aider à mieux comprendre ce que tu vas travailler en voiture.</p>
                <div style="background:#fdf2f8;border:1px solid #fbcfe8;border-radius:16px;padding:18px;margin:20px 0;">
                    <p style="margin:0;font-weight:700;color:#be185d;">À revoir en priorité</p>
                    <p style="margin:8px 0 0;color:#64748b;">${validated}/${TOTAL_SESSIONS} séances déjà validées.</p>
                    ${todoHtml}
                </div>
                <p style="margin:26px 0;">
                    <a href="${prepUrl}" style="display:inline-block;background:#13ce66;color:#fff;text-decoration:none;font-weight:800;padding:14px 24px;border-radius:999px;">Ouvrir ma préparation permis</a>
                </p>
                <p style="color:#64748b;">Ce suivi permet aussi à l'auto-école de voir ce qui est acquis et ce qui mérite d'être repris avec toi.</p>
                <p style="font-weight:700;">Auto-Ecole Breteuil</p>
            </div>
        </div>
    `;
}

async function fetchUpcomingReservations(supabase, fromIso, toIso) {
    const { data, error } = await supabase
        .from('slots')
        .select('id,start_at,end_at,instructor,status,notes,reservations(id,email,first_name,last_name,status,notes)')
        .eq('status', 'booked')
        .gte('start_at', fromIso)
        .lt('start_at', toIso)
        .order('start_at', { ascending: true })
        .limit(80);
    if (error) throw error;

    const rows = [];
    (data || []).forEach((slot) => {
        (slot.reservations || []).forEach((reservation) => {
            const status = String(reservation.status || '').toLowerCase();
            if (!['upcoming', 'booked', 'pending'].includes(status)) return;
            if (!cleanEmail(reservation.email) || hasReminderBeenSent(reservation.notes)) return;
            rows.push({ slot, reservation });
        });
    });
    return rows;
}

async function loadUsersByEmail(supabase, emails) {
    if (!emails.length) return new Map();
    const uniqueEmails = [...new Set(emails.map(cleanEmail).filter(Boolean))];
    const { data, error } = await supabase
        .from('users')
        .select('email,prenom,nom,forfait,hours_goal,lesson_unit_minutes')
        .in('email', uniqueEmails);
    if (error) throw error;
    return new Map((data || []).map((user) => [cleanEmail(user.email), user]));
}

async function markSent(supabase, reservation) {
    const stamp = `${SENT_MARKER}${new Date().toISOString()}]`;
    const notes = String(reservation.notes || '').trim();
    const nextNotes = notes ? `${notes} ${stamp}` : stamp;
    const { error } = await supabase
        .from('reservations')
        .update({ notes: nextNotes })
        .eq('id', reservation.id);
    if (error) throw error;
}

exports.handler = async (event) => {
    const blocked = requireScheduledInvocation(event);
    if (blocked) return blocked;

    const now = new Date();
    const from = new Date(now.getTime() + ((23 * 60) + 45) * 60 * 1000);
    const to = new Date(now.getTime() + ((24 * 60) + 15) * 60 * 1000);
    const supabase = getSupabaseAdmin();

    const rows = await fetchUpcomingReservations(supabase, from.toISOString(), to.toISOString());
    const usersByEmail = await loadUsersByEmail(supabase, rows.map((row) => row.reservation.email));
    const results = [];

    for (const row of rows) {
        const email = cleanEmail(row.reservation.email);
        const user = usersByEmail.get(email);
        if (user && !isDrivingPack(user)) {
            results.push({ id: row.reservation.id, email, skipped: 'NO_DRIVING_PACK' });
            continue;
        }

        try {
            const progress = await loadProgress(supabase, email);
            await sendResendEmail({
                to: email,
                subject: 'Ta préparation avant ton cours de conduite de demain',
                html: reminderHtml({ reservation: row.reservation, slot: row.slot, user, progress })
            });
            await markSent(supabase, row.reservation);
            results.push({ id: row.reservation.id, email, ok: true });
        } catch (error) {
            console.error('driving prep reminder:', row.reservation.id, error.message);
            results.push({ id: row.reservation.id, email, ok: false });
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, checked: rows.length, sent: results.filter((item) => item.ok).length, results })
    };
};
