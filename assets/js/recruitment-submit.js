(function bindRecruitmentForm() {
    const form = document.querySelector('form[name="recrutement"]');
    if (!form) return;

    const maxFileSize = 1_500_000;
    const toDataUrl = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const showMessage = (message, error = false) => {
        form.querySelector('.local-msg')?.remove();
        const node = document.createElement('div');
        node.className = 'local-msg';
        if (error) {
            node.style.background = 'rgba(239, 68, 68, 0.08)';
            node.style.borderColor = 'rgba(239, 68, 68, 0.45)';
        }
        node.innerHTML = `<i class="fas fa-${error ? 'exclamation-circle' : 'check-circle'}"></i> ${message}`;
        form.appendChild(node);
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        const data = new FormData(form);
        const cv = data.get('cv');
        const lettre = data.get('lettre');
        if (!cv || !cv.size) {
            showMessage('Ajoute ton CV avant d\'envoyer la candidature.', true);
            return;
        }
        if (cv.size > maxFileSize || (lettre && lettre.size > maxFileSize)) {
            showMessage('Chaque document doit peser 1,5 Mo maximum.', true);
            return;
        }

        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
        try {
            const response = await fetch('/.netlify/functions/submit-candidature', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prenom: data.get('prenom'),
                    nom: data.get('nom'),
                    email: data.get('email'),
                    telephone: data.get('telephone'),
                    poste: data.get('poste'),
                    disponibilites: data.get('disponibilites'),
                    message: data.get('message'),
                    cv: await toDataUrl(cv),
                    lettre: lettre && lettre.size ? await toDataUrl(lettre) : null
                })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.ok) {
                throw new Error(result.error === 'INVALID_DOCUMENT'
                    ? 'Le format ou la taille d\'un document n\'est pas accepte.'
                    : result.error === 'TOO_MANY_REQUESTS'
                        ? 'Trop de candidatures ont ete envoyees. Reessaie plus tard.'
                        : 'Une erreur est survenue. Reessaie ou contacte-nous directement.');
            }
            form.reset();
            showMessage('Candidature envoyee avec succes ! Nous vous recontacterons rapidement.');
        } catch (error) {
            console.error('Recruitment submission:', error);
            showMessage(error.message || 'Une erreur est survenue. Reessaie plus tard.', true);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    });
})();
