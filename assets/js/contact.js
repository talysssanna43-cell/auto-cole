// ===== CONTACT FORM HANDLING =====
// Désactivé pour permettre l'envoi via Formspree

/*
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
});

function handleContactSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Validate form
    if (!validateContactForm(data)) {
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        console.log('Contact form submitted:', data);
        
        // Show success message
        showContactSuccess();
        
        // Reset form
        e.target.reset();
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 1500);
}

function validateContactForm(data) {
    // Validate email
    if (!validateEmail(data.email)) {
        alert('Veuillez entrer une adresse email valide');
        return false;
    }
    
    // Validate required fields
    if (!data.prenom || !data.nom || !data.sujet || !data.message) {
        alert('Veuillez remplir tous les champs obligatoires');
        return false;
    }
    
    // Validate message length
    if (data.message.length < 10) {
        alert('Votre message doit contenir au moins 10 caractères');
        return false;
    }
    
    return true;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}
*/

function showContactSuccess() {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <div>
                <strong>Message envoyé !</strong>
                <p>Nous te répondrons dans les plus brefs délais.</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

function openChat() {
    alert('Fonctionnalité de chat en cours de développement. Merci de nous contacter par téléphone ou email.');
}

// Add styles for contact page
const style = document.createElement('style');
style.textContent = `
    .contact-section {
        padding: 120px 0 var(--spacing-2xl);
        background: var(--bg-light);
    }
    
    .contact-grid {
        display: grid;
        grid-template-columns: 1fr 1.5fr;
        gap: var(--spacing-2xl);
        align-items: start;
    }
    
    .contact-info h1 {
        color: var(--text-dark);
        margin-bottom: var(--spacing-md);
    }
    
    .contact-info > p {
        color: var(--text-light);
        font-size: 1.125rem;
        margin-bottom: var(--spacing-xl);
    }
    
    .contact-methods {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-2xl);
    }
    
    .contact-method {
        display: flex;
        gap: var(--spacing-md);
        padding: var(--spacing-lg);
        background: white;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        transition: all var(--transition-base);
    }
    
    .contact-method:hover {
        transform: translateX(5px);
        box-shadow: var(--shadow-md);
    }
    
    .method-icon {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: white;
        flex-shrink: 0;
    }
    
    .method-content h3 {
        margin-bottom: var(--spacing-xs);
        color: var(--text-dark);
        font-size: 1.125rem;
    }
    
    .method-content p {
        color: var(--text-dark);
        font-weight: 600;
        margin-bottom: 0.25rem;
    }
    
    .method-content span {
        color: var(--text-light);
        font-size: 0.875rem;
    }
    
    .method-content a {
        color: var(--primary-color);
        text-decoration: underline;
    }
    
    .social-section {
        padding: var(--spacing-lg);
        background: white;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
    }
    
    .social-section h3 {
        margin-bottom: var(--spacing-md);
        color: var(--text-dark);
    }
    
    .social-section .social-links {
        display: flex;
        gap: var(--spacing-sm);
    }
    
    .social-section .social-links a {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: var(--bg-light);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-dark);
        font-size: 1.25rem;
        transition: all var(--transition-base);
    }
    
    .social-section .social-links a:hover {
        background: var(--primary-color);
        color: white;
        transform: translateY(-3px);
    }
    
    .contact-form-wrapper {
        background: white;
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-lg);
        padding: var(--spacing-2xl);
    }
    
    .contact-form h2 {
        margin-bottom: var(--spacing-xl);
        color: var(--text-dark);
    }
    
    .map-section {
        background: white;
        padding: var(--spacing-2xl) 0;
    }
    
    .map-placeholder {
        background: var(--bg-light);
        border-radius: var(--radius-xl);
        padding: var(--spacing-2xl);
        text-align: center;
        min-height: 400px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-md);
    }
    
    .map-placeholder i {
        font-size: 5rem;
        color: var(--primary-color);
        opacity: 0.5;
    }
    
    .map-placeholder p {
        font-size: 1.25rem;
        color: var(--text-light);
    }
    
    .faq-quick {
        background: var(--bg-light);
        padding: var(--spacing-2xl) 0;
    }
    
    .faq-quick-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-xl);
    }
    
    .faq-quick-card {
        background: white;
        padding: var(--spacing-xl);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        text-align: center;
        transition: all var(--transition-base);
    }
    
    .faq-quick-card:hover {
        transform: translateY(-5px);
        box-shadow: var(--shadow-md);
    }
    
    .faq-quick-card i {
        font-size: 2.5rem;
        color: var(--primary-color);
        margin-bottom: var(--spacing-md);
    }
    
    .faq-quick-card h3 {
        margin-bottom: var(--spacing-sm);
        color: var(--text-dark);
        font-size: 1.125rem;
    }
    
    .faq-quick-card p {
        color: var(--text-light);
        line-height: 1.6;
    }
    
    .success-notification {
        position: fixed;
        top: 100px;
        right: -400px;
        background: white;
        padding: var(--spacing-lg);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
        z-index: 9999;
        transition: right var(--transition-base);
        max-width: 350px;
    }
    
    .success-notification.show {
        right: var(--spacing-lg);
    }
    
    .notification-content {
        display: flex;
        gap: var(--spacing-md);
        align-items: flex-start;
    }
    
    .notification-content i {
        font-size: 2rem;
        color: var(--success-color);
        flex-shrink: 0;
    }
    
    .notification-content strong {
        display: block;
        color: var(--text-dark);
        margin-bottom: 0.25rem;
    }
    
    .notification-content p {
        color: var(--text-light);
        font-size: 0.875rem;
        margin: 0;
    }
    
    @media (max-width: 968px) {
        .contact-grid {
            grid-template-columns: 1fr;
        }
        
        .contact-form-wrapper {
            padding: var(--spacing-lg);
        }
        
        .faq-quick-grid {
            grid-template-columns: 1fr;
        }
        
        .success-notification {
            left: var(--spacing-md);
            right: var(--spacing-md);
            max-width: none;
        }
        
        .success-notification.show {
            right: var(--spacing-md);
        }
    }
`;
document.head.appendChild(style);
