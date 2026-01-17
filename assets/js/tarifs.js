// ===== FAQ ACCORDION =====
document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all FAQ items
            faqItems.forEach(faq => {
                faq.classList.remove('active');
                faq.querySelector('.faq-answer').style.maxHeight = null;
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                item.classList.add('active');
                const answer = item.querySelector('.faq-answer');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });
});

// Add styles for FAQ
const style = document.createElement('style');
style.textContent = `
    .page-hero {
        background: linear-gradient(135deg, var(--secondary-color), var(--secondary-dark));
        color: white;
        padding: 150px 0 80px;
        text-align: center;
    }
    
    .page-hero h1 {
        color: white;
        margin-bottom: var(--spacing-sm);
    }
    
    .page-hero p {
        font-size: 1.25rem;
        opacity: 0.9;
    }
    
    .services-section {
        background: var(--bg-light);
    }
    
    .services-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--spacing-lg);
    }
    
    .service-card {
        background: white;
        padding: var(--spacing-xl);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-sm);
        text-align: center;
        transition: all var(--transition-base);
    }
    
    .service-card:hover {
        transform: translateY(-5px);
        box-shadow: var(--shadow-lg);
    }
    
    .service-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto var(--spacing-md);
        background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        color: white;
    }
    
    .service-card h3 {
        margin-bottom: var(--spacing-sm);
        color: var(--text-dark);
    }
    
    .service-price {
        font-size: 2rem;
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: var(--spacing-sm);
    }
    
    .service-card p {
        color: var(--text-light);
    }
    
    .payment-section {
        background: white;
    }
    
    .payment-options-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--spacing-lg);
    }
    
    .payment-card {
        background: var(--bg-light);
        padding: var(--spacing-xl);
        border-radius: var(--radius-xl);
        text-align: center;
    }
    
    .payment-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto var(--spacing-md);
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        color: var(--primary-color);
        box-shadow: var(--shadow-md);
    }
    
    .payment-card h3 {
        margin-bottom: var(--spacing-sm);
        color: var(--text-dark);
    }
    
    .payment-card p {
        color: var(--text-light);
        line-height: 1.6;
    }
    
    .faq-section {
        background: var(--bg-light);
    }
    
    .faq-container {
        max-width: 800px;
        margin: 0 auto;
    }
    
    .faq-item {
        background: white;
        border-radius: var(--radius-lg);
        margin-bottom: var(--spacing-md);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
        transition: all var(--transition-base);
    }
    
    .faq-item:hover {
        box-shadow: var(--shadow-md);
    }
    
    .faq-question {
        padding: var(--spacing-lg);
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        user-select: none;
    }
    
    .faq-question h3 {
        margin: 0;
        font-size: 1.125rem;
        color: var(--text-dark);
    }
    
    .faq-question i {
        color: var(--primary-color);
        transition: transform var(--transition-base);
    }
    
    .faq-item.active .faq-question i {
        transform: rotate(180deg);
    }
    
    .faq-answer {
        max-height: 0;
        overflow: hidden;
        transition: max-height var(--transition-base);
    }
    
    .faq-answer p {
        padding: 0 var(--spacing-lg) var(--spacing-lg);
        color: var(--text-light);
        line-height: 1.6;
    }
    
    @media (max-width: 768px) {
        .page-hero {
            padding: 120px 0 60px;
        }
        
        .services-grid,
        .payment-options-grid {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(style);
