// Configuration EmailJS
// IMPORTANT: Remplace ces valeurs par tes propres identifiants EmailJS
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

// Initialiser EmailJS
(function() {
    emailjs.init(EMAILJS_PUBLIC_KEY);
})();

// Gestion du formulaire de contact
document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const submitButton = this.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    // Désactiver le bouton et afficher un loader
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    
    // Récupérer les données du formulaire
    const formData = {
        prenom: document.getElementById('prenom').value,
        nom: document.getElementById('nom').value,
        email: document.getElementById('email').value,
        telephone: document.getElementById('telephone').value || 'Non renseigné',
        sujet: document.getElementById('sujet').value,
        message: document.getElementById('message').value,
        newsletter: document.getElementById('newsletter').checked ? 'Oui' : 'Non'
    };
    
    // Envoyer l'email via EmailJS
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, formData)
        .then(function(response) {
            console.log('SUCCESS!', response.status, response.text);
            
            // Afficher un message de succès
            showNotification('Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.', 'success');
            
            // Réinitialiser le formulaire
            document.getElementById('contactForm').reset();
            
            // Réactiver le bouton
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }, function(error) {
            console.log('FAILED...', error);
            
            // Afficher un message d'erreur
            showNotification('Une erreur est survenue lors de l\'envoi du message. Veuillez réessayer ou nous contacter par téléphone.', 'error');
            
            // Réactiver le bouton
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        });
});

// Fonction pour afficher les notifications
function showNotification(message, type) {
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Ajouter au body
    document.body.appendChild(notification);
    
    // Afficher avec animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}
