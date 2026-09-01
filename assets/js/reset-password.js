document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('resetForm');
    const success = document.getElementById('successMessage');
    const error = document.getElementById('errorMessage');
    const token = new URLSearchParams(window.location.search).get('token');
    const emailGroup = document.getElementById('emailGroup');
    const passwordFields = document.getElementById('passwordFields');
    const infoBox = document.getElementById('resetInfo');
    const submitButton = form?.querySelector('button[type="submit"]');

    if (!form || !submitButton) return;

    function showMessage(target, message) {
        success.style.display = target === success ? 'block' : 'none';
        error.style.display = target === error ? 'block' : 'none';
        target.textContent = message;
    }

    if (token) {
        emailGroup.hidden = true;
        passwordFields.hidden = false;
        infoBox.textContent = 'Choisis un nouveau mot de passe d’au moins 10 caractères, avec une majuscule, une minuscule et un chiffre.';
        submitButton.innerHTML = '<i class="fas fa-key"></i> Enregistrer le nouveau mot de passe';
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        submitButton.disabled = true;
        const originalLabel = submitButton.innerHTML;
        submitButton.textContent = 'Traitement en cours...';

        try {
            if (token) {
                const password = document.getElementById('newPassword').value;
                const confirmation = document.getElementById('confirmPassword').value;
                if (password !== confirmation) throw new Error('Les deux mots de passe ne correspondent pas.');

                const response = await fetch('/.netlify/functions/confirm-password-reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, password })
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(result.error === 'RESET_LINK_INVALID'
                        ? 'Ce lien est invalide ou a expiré. Demande un nouveau lien.'
                        : 'Le mot de passe doit contenir au moins 10 caractères, une majuscule, une minuscule et un chiffre.');
                }
                showMessage(success, 'Ton mot de passe a été modifié. Tu peux maintenant te connecter.');
                form.reset();
                setTimeout(() => window.location.replace('connexion.html'), 1800);
            } else {
                const email = document.getElementById('email').value.trim().toLowerCase();
                const response = await fetch('/.netlify/functions/request-password-reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                if (!response.ok) throw new Error('Le service est momentanément indisponible. Réessaie plus tard.');
                showMessage(success, 'Si un compte correspond à cette adresse, un lien de réinitialisation vient d’être envoyé. Vérifie aussi tes spams.');
                form.reset();
            }
        } catch (submissionError) {
            showMessage(error, submissionError.message || 'Une erreur est survenue. Réessaie.');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalLabel;
        }
    });
});
