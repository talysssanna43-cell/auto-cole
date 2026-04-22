// ===== AUTH & SESSION MANAGEMENT =====
const AUTH_STORAGE_KEY = 'ae_user';
let navActionsDefaultHTML = null;
let navActionsDefaultCaptured = false;

function getLoginUrl(redirectTo) {
    const target = redirectTo || window.location.href;
    return `connexion.html?redirect=${encodeURIComponent(target)}`;
}

function bindLoginLinks(scope = document) {
    if (!scope) return;
    scope.querySelectorAll('[data-login-link], .nav-actions a[href="connexion.html"]').forEach(link => {
        if (link.dataset.loginBound === 'true') return;
        link.dataset.loginBound = 'true';
        link.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = getLoginUrl(window.location.href);
        });
    });
}

function getStoredUser() {
    try {
        // Essayer localStorage d'abord
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
        
        // Fallback vers sessionStorage si localStorage est bloqué
        const sessionStored = sessionStorage.getItem(AUTH_STORAGE_KEY);
        return sessionStored ? JSON.parse(sessionStored) : null;
    } catch (error) {
        console.warn('Erreur lecture utilisateur stocké', error);
        // Dernier recours: essayer sessionStorage
        try {
            const sessionStored = sessionStorage.getItem(AUTH_STORAGE_KEY);
            return sessionStored ? JSON.parse(sessionStored) : null;
        } catch (sessionError) {
            console.error('Erreur sessionStorage:', sessionError);
            return null;
        }
    }
}

function logoutUser() {
    try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
        console.warn('Erreur suppression localStorage:', e);
    }
    try {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
        console.warn('Erreur suppression sessionStorage:', e);
    }
    updateAuthUI();
    window.location.href = 'index.html';
}

function bindLogoutButton(container) {
    if (!container) return;
    const logoutButton = container.querySelector('[data-logout]');
    if (logoutButton) {
        logoutButton.addEventListener('click', logoutUser);
    }
}

function attachProtectedButtonHandlers() {
    document.querySelectorAll('[data-auth-required]').forEach(button => {
        if (button.dataset.authBound === 'true') return;
        button.dataset.authBound = 'true';
        button.addEventListener('click', (event) => {
            const user = getStoredUser();
            if (!user) {
                event.preventDefault();
                window.location.href = button.dataset.authRedirect || 'connexion.html';
                return;
            }
            if (button.dataset.authTarget) {
                button.setAttribute('href', button.dataset.authTarget);
            }
        });
    });
}

function updateAuthUI() {
    const navActionsContainer = document.querySelector('.nav-actions');
    if (navActionsContainer && !navActionsDefaultCaptured) {
        navActionsDefaultHTML = navActionsContainer.innerHTML;
        navActionsDefaultCaptured = true;
    }

    const user = getStoredUser();
    document.body.classList.toggle('is-authenticated', !!user);

    if (navActionsContainer) {
        if (user) {
            // Utilisateur connecté : afficher Mon espace et Se déconnecter
            navActionsContainer.innerHTML = `
                <a href="espace-eleve.html" class="btn-secondary">Mon espace</a>
                <button type="button" class="btn-primary" data-logout>Se déconnecter</button>
            `;
        } else {
            // Utilisateur non connecté : afficher Se connecter et S'inscrire
            navActionsContainer.innerHTML = navActionsDefaultHTML;
        }
        bindLogoutButton(navActionsContainer);
        bindLoginLinks(navActionsContainer);
    }

    attachProtectedButtonHandlers();
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    bindLoginLinks(document);
});

// In case the script is loaded after DOMContentLoaded (e.g., placed at the end of body)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    updateAuthUI();
    bindLoginLinks(document);
}

// ===== MOBILE MENU TOGGLE =====
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar') && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
    }
});

// Close mobile menu when clicking on a link
const navLinks = document.querySelectorAll('.nav-menu a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            navMenu.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        }
    });
});

// ===== NAVBAR SCROLL EFFECT =====
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
    }
    
    lastScroll = currentScroll;
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href !== 'javascript:void(0);') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// ===== HOURS OPTIONS TOGGLE =====
const hourButtons = document.querySelectorAll('.hour-btn');

hourButtons.forEach(button => {
    button.addEventListener('click', () => {
        hourButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Here you could update prices based on selected hours
        const hours = button.textContent.trim();
        console.log(`Selected: ${hours}`);
    });
});

// ===== INTERSECTION OBSERVER FOR ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
const animateElements = document.querySelectorAll('.feature-card, .pack-card, .testimonial-card');
animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
});

// ===== PACK CARD HOVER EFFECT =====
const packCards = document.querySelectorAll('.pack-card');

packCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        packCards.forEach(otherCard => {
            if (otherCard !== card) {
                otherCard.style.opacity = '0.7';
            }
        });
    });
    
    card.addEventListener('mouseleave', () => {
        packCards.forEach(otherCard => {
            otherCard.style.opacity = '1';
        });
    });
});

// ===== FORM VALIDATION (for future forms) =====
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\d\s\-\+\(\)]{10,}$/;
    return re.test(phone);
}

// ===== LOADING ANIMATION =====
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// ===== HERO STATS COUNTER ANIMATION (DISABLED) =====
// Animation disabled - stats remain static
// function animateCounter(element, target, duration = 2000) {
//     let start = 0;
//     const increment = target / (duration / 16);
//     
//     const timer = setInterval(() => {
//         start += increment;
//         if (start >= target) {
//             element.textContent = target + (element.dataset.suffix || '');
//             clearInterval(timer);
//         } else {
//             element.textContent = Math.floor(start) + (element.dataset.suffix || '');
//         }
//     }, 16);
// }

// const statsObserver = new IntersectionObserver((entries) => {
//     entries.forEach(entry => {
//         if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
//             const statNumber = entry.target.querySelector('.stat-number');
//             const targetValue = parseInt(statNumber.textContent);
//             const suffix = statNumber.textContent.replace(/[0-9]/g, '');
//             statNumber.dataset.suffix = suffix;
//             animateCounter(statNumber, targetValue);
//             entry.target.classList.add('animated');
//         }
//     });
// }, { threshold: 0.5 });

// document.querySelectorAll('.stat').forEach(stat => {
//     statsObserver.observe(stat);
// });

// ===== TESTIMONIALS SLIDER (optional enhancement) =====
let currentTestimonial = 0;
const testimonials = document.querySelectorAll('.testimonial-card');

function showTestimonial(index) {
    testimonials.forEach((testimonial, i) => {
        if (i === index) {
            testimonial.style.display = 'block';
        } else {
            testimonial.style.display = 'none';
        }
    });
}

// Auto-rotate testimonials (optional)
// setInterval(() => {
//     currentTestimonial = (currentTestimonial + 1) % testimonials.length;
//     showTestimonial(currentTestimonial);
// }, 5000);

// ===== CONSOLE WELCOME MESSAGE =====
console.log('%c🚗 AutoÉcole Pro', 'font-size: 20px; font-weight: bold; color: #FF6B35;');
console.log('%cBienvenue sur notre site !', 'font-size: 14px; color: #004E89;');

// ===== PERFORMANCE MONITORING =====
if ('performance' in window) {
    window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`⚡ Page loaded in ${pageLoadTime}ms`);
    });
}
