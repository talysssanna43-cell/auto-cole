// Navbar functionality
(function() {
    'use strict';
    
    // Sticky navbar on scroll
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            } else {
                navbar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            }
        });
    }
})();
