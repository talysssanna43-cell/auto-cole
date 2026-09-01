(function () {
    const modal = document.getElementById('advisorContactModal');
    const form = document.getElementById('advisorContactForm');
    const feedback = document.getElementById('advisorContactFeedback');
    const openButtons = document.querySelectorAll('[data-open-advisor-contact]');
    const closeButtons = document.querySelectorAll('[data-close-advisor-contact]');

    if (!form) return;

    const dateInput = form.querySelector('input[name="callback_date"]');
    if (dateInput) {
        const today = new Date();
        today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
        dateInput.min = today.toISOString().slice(0, 10);
    }

    function setFeedback(message, type = 'info') {
        if (!feedback) return;
        feedback.textContent = message || '';
        feedback.style.color = type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#e91e63';
    }

    function openModal() {
        if (!modal) return;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(() => (dateInput || document.getElementById('advisorSlot'))?.focus(), 30);
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        setFeedback('');
    }

    if (modal) {
        openButtons.forEach((button) => button.addEventListener('click', openModal));
        closeButtons.forEach((button) => button.addEventListener('click', closeModal));
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeModal();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.classList.contains('active')) closeModal();
        });
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton?.innerHTML || '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
        }
        setFeedback('Envoi de la demande...');

        const data = Object.fromEntries(new FormData(form).entries());

        try {
            const response = await fetch('/.netlify/functions/advisor-contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const payload = await response.json().catch(() => ({ ok: false }));
            if (!response.ok || !payload.ok) {
                throw new Error(payload.error || 'ADVISOR_CONTACT_FAILED');
            }
            if (payload.emailSent && payload.clientEmailSent) {
                setFeedback("Demande envoyée. Tu vas recevoir un e-mail de confirmation : un conseiller prendra le temps d'échanger avec toi et fera son maximum pour respecter ton créneau.", 'success');
            } else if (payload.emailSent) {
                setFeedback("Demande envoyée. L'auto-école a reçu ta demande et un conseiller reviendra vers toi sur le créneau choisi.", 'success');
            } else {
                setFeedback("Demande enregistrée. Un conseiller prendra le temps d'échanger avec toi et reviendra vers toi au plus proche du créneau choisi.", 'info');
            }
            form.reset();
            if (modal) setTimeout(closeModal, 4200);
        } catch (error) {
            console.error('advisor-contact:', error);
            setFeedback("Impossible d'envoyer la demande pour le moment. Tu peux appeler le 04 91 53 36 98.", 'error');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }
        }
    });
})();
