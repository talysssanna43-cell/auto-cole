(function supportTicketWidget() {
    const maxAttachmentSize = 700_000;

    function render() {
        if (document.getElementById('reportIssueBtn')) return;
        document.body.insertAdjacentHTML('beforeend', `
            <button id="reportIssueBtn" type="button" title="Signaler un probleme" style="position:fixed;right:20px;bottom:20px;width:56px;height:56px;border:0;border-radius:50%;background:#ec4899;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.18);font-size:1.35rem;cursor:pointer;z-index:9999"><i class="fas fa-exclamation-circle"></i></button>
            <div id="reportIssueModal" role="dialog" aria-modal="true" aria-labelledby="reportIssueTitle" style="display:none;position:fixed;inset:0;z-index:10000;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.5)">
                <form id="reportIssueForm" style="width:min(100%,560px);padding:28px;border-radius:12px;background:#fff;box-shadow:0 8px 28px rgba(0,0,0,.24)">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px">
                        <h2 id="reportIssueTitle" style="margin:0;color:#ec4899;font-size:1.35rem">Signaler un probleme</h2>
                        <button id="reportIssueClose" type="button" aria-label="Fermer" style="border:0;background:transparent;font-size:1.6rem;cursor:pointer">&times;</button>
                    </div>
                    <label for="reportMessage" style="display:block;margin-bottom:6px;font-weight:700">Decris le probleme rencontre *</label>
                    <textarea id="reportMessage" rows="6" required style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #cbd5e1;border-radius:6px;font:inherit"></textarea>
                    <label for="reportAttachment" style="display:block;margin:16px 0 6px;font-weight:700">Capture d'ecran ou PDF (optionnel)</label>
                    <input id="reportAttachment" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" style="width:100%">
                    <p style="margin:6px 0 0;color:#64748b;font-size:.85rem">700 Ko maximum.</p>
                    <p id="reportFeedback" role="alert" aria-live="polite" style="display:none;margin:16px 0 0;padding:10px;border-radius:6px"></p>
                    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px">
                        <button id="reportIssueCancel" type="button" style="padding:10px 16px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;cursor:pointer">Annuler</button>
                        <button id="reportIssueSubmit" type="submit" style="padding:10px 16px;border:0;border-radius:6px;background:#ec4899;color:#fff;font-weight:700;cursor:pointer">Envoyer</button>
                    </div>
                </form>
            </div>
        `);
    }

    function showFeedback(message, kind) {
        const feedback = document.getElementById('reportFeedback');
        if (!feedback) return;
        feedback.textContent = message;
        feedback.style.display = 'block';
        feedback.style.background = kind === 'error' ? '#fee2e2' : '#dcfce7';
        feedback.style.color = kind === 'error' ? '#991b1b' : '#166534';
    }

    function close() {
        const modal = document.getElementById('reportIssueModal');
        const form = document.getElementById('reportIssueForm');
        if (modal) modal.style.display = 'none';
        form?.reset();
        const feedback = document.getElementById('reportFeedback');
        if (feedback) feedback.style.display = 'none';
    }

    function toDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function submit(event) {
        event.preventDefault();
        const message = document.getElementById('reportMessage')?.value.trim();
        const file = document.getElementById('reportAttachment')?.files?.[0];
        const submitButton = document.getElementById('reportIssueSubmit');
        const token = window.authSession?.getToken();
        if (!token) {
            showFeedback('Connecte-toi pour signaler un probleme.', 'error');
            return;
        }
        if (!message) {
            showFeedback('Decris le probleme rencontre.', 'error');
            return;
        }
        if (file && file.size > maxAttachmentSize) {
            showFeedback('Le fichier est trop volumineux.', 'error');
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Envoi...';
        try {
            const response = await fetch('/.netlify/functions/submit-support-ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    message,
                    attachment: file ? { name: file.name, type: file.type, data: await toDataUrl(file) } : null
                })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.ok) {
                throw new Error(result.error || 'SUPPORT_TICKET_FAILED');
            }
            showFeedback('Ton signalement a ete envoye. L\'equipe te repondra rapidement.', 'success');
            setTimeout(close, 1400);
        } catch (error) {
            const message = error.message === 'INVALID_ATTACHMENT'
                ? 'Le format du fichier n\'est pas accepte.'
                : 'Impossible d\'envoyer le signalement pour le moment.';
            showFeedback(message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Envoyer';
        }
    }

    function bind() {
        render();
        const modal = document.getElementById('reportIssueModal');
        document.getElementById('reportIssueBtn')?.addEventListener('click', () => { modal.style.display = 'flex'; });
        document.getElementById('reportIssueClose')?.addEventListener('click', close);
        document.getElementById('reportIssueCancel')?.addEventListener('click', close);
        modal?.addEventListener('click', (event) => { if (event.target === modal) close(); });
        document.getElementById('reportIssueForm')?.addEventListener('submit', submit);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
    else bind();
})();
