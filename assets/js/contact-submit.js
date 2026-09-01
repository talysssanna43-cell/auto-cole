// Shared secure contact form submission. contact.html also uses the same endpoint.
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const feedback = document.getElementById('contactFeedback');
        const originalText = submitButton?.innerHTML || '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
        }

        try {
            const response = await fetch('/.netlify/functions/submit-contact-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prenom: document.getElementById('prenom')?.value,
                    nom: document.getElementById('nom')?.value,
                    email: document.getElementById('email')?.value,
                    telephone: document.getElementById('telephone')?.value,
                    sujet: document.getElementById('sujet')?.value,
                    message: document.getElementById('message')?.value,
                    newsletter: document.getElementById('newsletter')?.checked === true
                })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.ok) throw new Error('CONTACT_REQUEST_FAILED');

            if (feedback) {
                feedback.style.display = 'block';
                feedback.style.background = '#d4edda';
                feedback.style.color = '#155724';
                feedback.textContent = 'Message envoye avec succes. Nous te repondrons rapidement.';
            }
            contactForm.reset();
        } catch (error) {
            if (feedback) {
                feedback.style.display = 'block';
                feedback.style.background = '#f8d7da';
                feedback.style.color = '#721c24';
                feedback.textContent = 'Impossible d\'envoyer le message pour le moment. Reessaie plus tard.';
            }
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }
        }
    });
});
