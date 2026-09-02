(function () {
    function ensureFooterAssets() {
        var hasPoppins = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(function (link) {
            return link.href.indexOf('family=Poppins') !== -1;
        });
        var hasFontAwesome = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(function (link) {
            return link.href.indexOf('font-awesome') !== -1 || link.href.indexOf('fontawesome') !== -1;
        });

        if (!hasPoppins) {
            var fontLink = document.createElement('link');
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap';
            document.head.appendChild(fontLink);
        }

        if (!hasFontAwesome) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(link);
        }
    }

    function injectNavigationStyles() {
        if (document.getElementById('siteNavigationStyles')) return;

        var style = document.createElement('style');
        style.id = 'siteNavigationStyles';
        style.textContent = `
            .navbar.site-unified-navigation,
            .formation-nav.site-unified-navigation {
                position: sticky;
                top: 0;
                z-index: 1000;
                width: 100%;
                background: #fff;
                border: 0;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }

            .navbar.site-unified-navigation .container,
            .formation-nav.site-unified-navigation .formation-container {
                width: 100%;
                max-width: none;
                margin-inline: auto;
                padding-inline: 80px;
            }

            .navbar.site-unified-navigation .nav-wrapper,
            .formation-nav.site-unified-navigation .formation-nav-inner {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 24px;
                min-height: 132px;
                padding-block: 0;
            }

            .navbar.site-unified-navigation .logo,
            .formation-nav.site-unified-navigation .formation-brand {
                display: flex;
                flex: 0 0 225px;
                width: 225px;
                align-items: center;
                gap: 12px;
                color: #1a1a2e;
                font-family: 'Poppins', sans-serif;
                font-size: 1.85rem;
                font-weight: 700;
                line-height: 1.2;
                text-decoration: none;
            }

            .navbar.site-unified-navigation .logo img,
            .formation-nav.site-unified-navigation .formation-brand img {
                width: auto;
                height: 34px;
                object-fit: contain;
            }

            .navbar.site-unified-navigation .logo strong,
            .formation-nav.site-unified-navigation .formation-brand strong {
                display: block;
                color: #ff69b4;
            }

            .navbar.site-unified-navigation .nav-menu,
            .formation-nav.site-unified-navigation .formation-links {
                display: flex;
                flex: 1 1 auto;
                align-items: center;
                justify-content: flex-start;
                min-width: 0;
                gap: 28px;
                margin-left: 0;
            }

            .navbar.site-unified-navigation .nav-menu > li {
                flex: 0 0 auto;
            }

            .navbar.site-unified-navigation .nav-menu a,
            .formation-nav.site-unified-navigation .formation-links > a,
            .navbar.site-unified-navigation .site-training-trigger,
            .formation-nav.site-unified-navigation .site-training-trigger {
                color: #1a1a2e;
                font-family: 'Poppins', sans-serif;
                font-size: 1.55rem;
                font-weight: 500;
                line-height: 1.3;
                text-decoration: none;
                white-space: nowrap;
            }

            .navbar.site-unified-navigation .nav-actions,
            .formation-nav.site-unified-navigation .formation-nav-actions {
                display: flex;
                flex: 0 0 auto;
                align-items: center;
                gap: 24px;
                margin-left: auto;
                padding-left: 34px;
                border-left: 1px solid #e3e4e8;
                white-space: nowrap;
            }

            .navbar.site-unified-navigation .nav-actions > .btn-primary,
            .navbar.site-unified-navigation .nav-actions > .btn-secondary,
            .formation-nav.site-unified-navigation .formation-nav-actions > .formation-button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 80px;
                padding: 20px 34px;
                border: 2px solid transparent;
                border-radius: 20px !important;
                font-family: 'Poppins', sans-serif;
                font-size: 1.45rem;
                font-weight: 600;
                line-height: 1.5;
                text-decoration: none;
                transition: transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease, color 150ms ease, border-color 150ms ease;
            }

            .navbar.site-unified-navigation .nav-actions > .btn-primary,
            .formation-nav.site-unified-navigation .formation-nav-actions > .formation-button-primary {
                color: #fff;
                background: linear-gradient(135deg, #ff69b4 0%, #e91e63 100%);
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }

            .navbar.site-unified-navigation .nav-actions > .btn-secondary,
            .formation-nav.site-unified-navigation .formation-nav-actions > .formation-button-secondary {
                min-width: 238px;
            }

            .navbar.site-unified-navigation .nav-actions > .btn-primary,
            .formation-nav.site-unified-navigation .formation-nav-actions > .formation-button-primary {
                min-width: 190px;
            }

            .navbar.site-unified-navigation .nav-actions > .btn-secondary,
            .formation-nav.site-unified-navigation .formation-nav-actions > .formation-button-secondary {
                color: #ff69b4;
                background: #fff;
                border-color: #ff69b4;
            }

            .formation-nav .formation-brand {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                color: #1a1a2e;
                font-size: 1.25rem;
                font-weight: 700;
                line-height: 1.15;
                text-decoration: none;
            }

            .formation-nav .formation-brand img {
                width: auto;
                height: 28px;
                object-fit: contain;
            }

            .formation-nav .formation-brand strong {
                display: block;
                color: #ff69b4;
            }

            .site-mobile-nav-actions {
                display: none;
            }

            .site-training-menu {
                position: relative;
            }

            .site-training-trigger {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.45rem;
                border: 0;
                background: transparent;
                color: #1a1a2e;
                font: inherit;
                font-weight: 600;
                line-height: 1.3;
                cursor: pointer;
                white-space: nowrap;
            }

            .site-training-trigger i {
                color: #ed2b7b;
                font-size: 0.72rem;
                transition: transform 160ms ease;
            }

            .site-training-menu.is-open .site-training-trigger i {
                transform: rotate(180deg);
            }

            .site-training-panel {
                position: absolute;
                top: calc(100% + 14px);
                left: 50%;
                z-index: 1200;
                width: min(340px, calc(100vw - 32px));
                padding: 0.65rem;
                border: 1px solid #dedfe4;
                border-top: 4px solid #ed2b7b;
                border-radius: 8px;
                background: #fff;
                box-shadow: 0 18px 45px rgba(26, 26, 46, 0.18);
                opacity: 0;
                visibility: hidden;
                transform: translate(-50%, 8px);
                transition: opacity 160ms ease, transform 160ms ease, visibility 160ms ease;
            }

            .site-training-menu.is-open .site-training-panel,
            .site-training-menu:focus-within .site-training-panel {
                opacity: 1;
                visibility: visible;
                transform: translate(-50%, 0);
            }

            .site-training-heading,
            .site-training-link {
                display: flex;
                align-items: center;
                gap: 0.7rem;
                width: 100%;
                color: #292a31 !important;
                text-decoration: none;
            }

            .site-training-heading {
                padding: 0.8rem 0.9rem;
                font-size: 1rem;
                font-weight: 750;
            }

            .site-training-heading i {
                color: #ed2b7b;
            }

            .site-training-link {
                min-height: 40px;
                padding: 0.55rem 0.9rem 0.55rem 2.45rem;
                border-radius: 5px;
                font-size: 0.92rem;
                font-weight: 550;
                line-height: 1.35;
            }

            .site-training-link:hover,
            .site-training-link[aria-current="page"] {
                background: #fff0f6 !important;
                color: #c91662 !important;
                transform: none !important;
            }

            .site-training-separator {
                height: 1px;
                margin: 0.55rem 0.35rem;
                background: #e5e6ea;
            }

            .site-training-link-secondary {
                padding-left: 0.9rem;
                font-weight: 650;
            }

            .site-training-link-secondary i {
                width: 1rem;
                color: #70727b;
                text-align: center;
            }

            .site-formation-menu-toggle {
                display: none;
                align-items: center;
                justify-content: center;
                width: 42px;
                height: 42px;
                flex: 0 0 42px;
                border: 1px solid #dedfe4;
                border-radius: 6px;
                background: #fff;
                color: #1a1a2e;
                cursor: pointer;
            }

            .formation-links.site-enhanced-links .site-training-trigger {
                color: #3e4046;
                font-size: 1.55rem;
                font-weight: 650;
            }

            @media (min-width: 1681px), (min-device-width: 1025px) {
                .nav-menu > .site-training-menu:hover .site-training-panel {
                    opacity: 1;
                    visibility: visible;
                    transform: translate(-50%, 0);
                }
            }

            @media (max-width: 1680px) and (min-device-width: 1025px) {
                .navbar.site-unified-navigation .nav-wrapper,
                .formation-nav.site-unified-navigation .formation-nav-inner {
                    flex-wrap: nowrap !important;
                }

                .navbar.site-unified-navigation .mobile-menu-toggle,
                .formation-nav.site-unified-navigation .site-formation-menu-toggle {
                    display: none !important;
                }

                .navbar.site-unified-navigation .nav-menu,
                .formation-nav.site-unified-navigation .formation-links.site-enhanced-links {
                    display: flex !important;
                    position: static !important;
                    width: auto;
                    height: auto;
                    flex-direction: row;
                    flex-wrap: nowrap !important;
                    align-items: center;
                    padding: 0 !important;
                    overflow: visible;
                    background: transparent;
                    box-shadow: none;
                    transform: none;
                }

                .navbar.site-unified-navigation .nav-actions,
                .formation-nav.site-unified-navigation .formation-nav-actions {
                    display: flex !important;
                    position: static !important;
                    width: auto !important;
                    flex-direction: row !important;
                    flex-wrap: nowrap !important;
                    margin-top: 0 !important;
                }

                .navbar.site-unified-navigation .nav-menu > li > a,
                .navbar.site-unified-navigation .nav-menu > .site-training-menu > .site-training-trigger,
                .formation-nav.site-unified-navigation .formation-links > a,
                .formation-nav.site-unified-navigation .site-training-trigger {
                    width: auto;
                    min-height: 0;
                    padding: 0 !important;
                    background: transparent;
                }

                .formation-links.site-enhanced-links .site-mobile-nav-actions {
                    display: none !important;
                }

                .navbar.site-unified-navigation .container,
                .formation-nav.site-unified-navigation .formation-container {
                    padding-inline: 4.22vw;
                }

                .navbar.site-unified-navigation .nav-wrapper,
                .formation-nav.site-unified-navigation .formation-nav-inner {
                    gap: 1.27vw;
                    min-height: 6.97vw;
                }

                .navbar.site-unified-navigation .logo,
                .formation-nav.site-unified-navigation .formation-brand {
                    flex-basis: 11.88vw;
                    width: 11.88vw;
                    gap: 0.63vw;
                    font-size: 1.56vw;
                }

                .navbar.site-unified-navigation .logo img,
                .formation-nav.site-unified-navigation .formation-brand img {
                    height: 1.8vw;
                }

                .navbar.site-unified-navigation .nav-menu,
                .formation-nav.site-unified-navigation .formation-links {
                    gap: 1.48vw;
                }

                .navbar.site-unified-navigation .nav-menu a,
                .formation-nav.site-unified-navigation .formation-links > a,
                .navbar.site-unified-navigation .site-training-trigger,
                .formation-nav.site-unified-navigation .site-training-trigger,
                .formation-links.site-enhanced-links .site-training-trigger {
                    font-size: 1.31vw;
                }

                .navbar.site-unified-navigation .nav-actions,
                .formation-nav.site-unified-navigation .formation-nav-actions {
                    gap: 1.27vw;
                    padding-left: 1.8vw;
                }

                .navbar.site-unified-navigation .nav-actions > .btn-primary,
                .navbar.site-unified-navigation .nav-actions > .btn-secondary,
                .formation-nav.site-unified-navigation .formation-nav-actions > .formation-button {
                    min-height: 4.22vw;
                    padding: 1.06vw 1.8vw;
                    border-radius: 1.06vw !important;
                    font-size: 1.225vw;
                }

                .navbar.site-unified-navigation .nav-actions > .btn-secondary,
                .formation-nav.site-unified-navigation .formation-nav-actions > .formation-button-secondary {
                    min-width: 12.57vw;
                }

                .navbar.site-unified-navigation .nav-actions > .btn-primary,
                .formation-nav.site-unified-navigation .formation-nav-actions > .formation-button-primary {
                    min-width: 10.03vw;
                }
            }

            @media (max-width: 1680px) and (max-device-width: 1024px) {
                .navbar.site-unified-navigation .container,
                .formation-nav.site-unified-navigation .formation-container {
                    padding-inline: 20px;
                }

                .navbar.site-unified-navigation .nav-wrapper,
                .formation-nav.site-unified-navigation .formation-nav-inner {
                    min-height: 86px;
                }

                .navbar.site-unified-navigation .logo,
                .formation-nav.site-unified-navigation .formation-brand {
                    flex: 0 1 auto;
                    width: auto;
                    gap: 8px;
                    font-size: 1.25rem;
                }

                .navbar.site-unified-navigation .logo img,
                .formation-nav.site-unified-navigation .formation-brand img {
                    height: 32px;
                }

                .formation-nav.site-unified-navigation .formation-links.site-enhanced-links {
                    display: none;
                }

                .formation-nav.site-unified-navigation .formation-links.site-enhanced-links.is-mobile-open {
                    display: flex;
                }

                .formation-nav.site-unified-navigation .formation-nav-actions {
                    display: none;
                }

                .formation-nav-inner {
                    position: relative;
                }

                .site-formation-menu-toggle {
                    display: inline-flex;
                    margin-left: auto;
                }

                .formation-links.site-enhanced-links {
                    display: none;
                    position: absolute;
                    top: calc(100% + 1px);
                    left: 0;
                    right: 0;
                    z-index: 1200;
                    flex-direction: column;
                    align-items: stretch;
                    gap: 0.25rem;
                    margin: 0;
                    padding: 0.8rem;
                    border: 1px solid #dedfe4;
                    border-top: 3px solid #ed2b7b;
                    border-radius: 0 0 8px 8px;
                    background: #fff;
                    box-shadow: 0 18px 35px rgba(26, 26, 46, 0.16);
                    max-height: calc(100vh - 86px);
                    max-height: calc(100dvh - 86px);
                    overflow-y: auto;
                }

                .formation-links.site-enhanced-links.is-mobile-open {
                    display: flex;
                }

                .formation-links.site-enhanced-links > a,
                .formation-links.site-enhanced-links > .site-training-menu > .site-training-trigger {
                    width: 100%;
                    min-height: 44px;
                    justify-content: flex-start;
                    padding: 0.7rem 0.8rem;
                }

                .formation-links.site-enhanced-links .site-training-panel {
                    position: static;
                    width: 100%;
                    margin-top: 0.2rem;
                    border-top-width: 1px;
                    box-shadow: none;
                    opacity: 1;
                    visibility: visible;
                    transform: none;
                    display: none;
                }

                .formation-links.site-enhanced-links .site-training-menu.is-open .site-training-panel {
                    display: block;
                }

                .formation-nav-actions {
                    display: none;
                    margin-left: 0;
                }

                .formation-links.site-enhanced-links .site-mobile-nav-actions {
                    display: flex;
                    gap: 0.75rem;
                    margin-top: 0.55rem;
                    padding-top: 0.8rem;
                    border-top: 1px solid #e5e5e5;
                }

                .formation-links.site-enhanced-links .site-mobile-nav-actions > * {
                    flex: 1 1 0;
                    min-width: 0;
                    min-height: 48px;
                    padding: 0.75rem;
                    font-size: 0.95rem;
                    justify-content: center;
                    text-align: center;
                    white-space: nowrap;
                }
            }

            @media (max-width: 1680px) and (max-device-width: 1024px) {
                .navbar.site-unified-navigation .mobile-menu-toggle {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 8px;
                    border: 0;
                    background: transparent;
                    cursor: pointer;
                }

                .navbar.site-unified-navigation .mobile-menu-toggle span {
                    display: block;
                    width: 25px;
                    height: 3px;
                    border-radius: 2px;
                    background: #1a1a2e;
                }

                .navbar.site-unified-navigation .nav-menu {
                    position: fixed;
                    top: 86px;
                    left: -100%;
                    z-index: 1100;
                    width: 100%;
                    height: calc(100vh - 86px);
                    height: calc(100dvh - 86px);
                    flex-direction: column;
                    align-items: stretch;
                    justify-content: flex-start;
                    gap: 0.25rem;
                    margin: 0;
                    padding: 1.25rem 1.25rem 6.75rem;
                    overflow-y: auto;
                    list-style: none;
                    background: #fff;
                    transition: left 180ms ease;
                }

                .navbar.site-unified-navigation .nav-menu.active {
                    left: 0;
                }

                .navbar.site-unified-navigation .nav-menu > li > a {
                    min-height: 52px;
                    padding: 1rem 1.25rem;
                    border-radius: 5px;
                }

                .navbar.site-unified-navigation .nav-actions {
                    display: none !important;
                }

                .navbar.site-unified-navigation .nav-menu.active ~ .nav-actions {
                    display: flex !important;
                    position: fixed;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    z-index: 1200;
                    gap: 0.75rem;
                    padding: 0.9rem 1.25rem;
                    border-top: 1px solid #e3e4e8;
                    border-left: 0;
                    background: #fff;
                }

                .navbar.site-unified-navigation .nav-menu.active ~ .nav-actions > .btn-primary,
                .navbar.site-unified-navigation .nav-menu.active ~ .nav-actions > .btn-secondary {
                    flex: 1 1 0;
                    min-width: 0;
                    min-height: 48px;
                    padding: 0.75rem;
                    font-size: 0.95rem;
                    white-space: nowrap;
                }

                .nav-menu > .site-training-menu {
                    width: 100%;
                }

                .nav-menu > .site-training-menu > .site-training-trigger {
                    width: 100%;
                    min-height: 52px;
                    justify-content: space-between;
                    padding: 1rem 1.25rem;
                    border-radius: 5px;
                    background: #f8f9fa;
                    color: #1a1a2e;
                    text-align: left;
                }

                .nav-menu > .site-training-menu .site-training-panel {
                    position: static;
                    display: none;
                    width: 100%;
                    margin-top: 0.4rem;
                    border-top-width: 1px;
                    box-shadow: none;
                    opacity: 1;
                    visibility: visible;
                    transform: none;
                }

                .nav-menu > .site-training-menu.is-open .site-training-panel {
                    display: block;
                }

                .nav-menu > .site-training-menu .site-training-heading,
                .nav-menu > .site-training-menu .site-training-link {
                    min-height: 42px;
                    padding-top: 0.6rem;
                    padding-bottom: 0.6rem;
                    background: transparent;
                }

                .nav-menu > .site-training-menu .site-training-link:not(.site-training-link-secondary) {
                    padding-left: 2.45rem;
                }
            }

            @media (max-width: 560px) and (max-device-width: 1024px) {
                .navbar.site-unified-navigation .container,
                .formation-nav.site-unified-navigation .formation-container {
                    padding-inline: 14px;
                }

                .navbar.site-unified-navigation .nav-wrapper,
                .formation-nav.site-unified-navigation .formation-nav-inner {
                    min-height: 78px;
                }

                .navbar.site-unified-navigation .logo,
                .formation-nav.site-unified-navigation .formation-brand {
                    gap: 7px;
                    font-size: clamp(1rem, 5.5vw, 1.25rem);
                }

                .navbar.site-unified-navigation .logo img,
                .formation-nav.site-unified-navigation .formation-brand img {
                    height: 28px;
                }

                .navbar.site-unified-navigation .nav-menu {
                    top: 78px;
                    height: calc(100vh - 78px);
                    height: calc(100dvh - 78px);
                    padding-inline: 14px;
                }

                .navbar.site-unified-navigation .nav-menu.active ~ .nav-actions {
                    gap: 8px;
                    padding: 10px 14px max(10px, env(safe-area-inset-bottom));
                }

                .navbar.site-unified-navigation .nav-menu.active ~ .nav-actions > .btn-primary,
                .navbar.site-unified-navigation .nav-menu.active ~ .nav-actions > .btn-secondary {
                    padding-inline: 8px;
                    font-size: clamp(0.78rem, 3.8vw, 0.95rem);
                }

                .formation-nav-inner {
                    gap: 10px;
                }

                .formation-links.site-enhanced-links {
                    max-height: calc(100vh - 78px);
                    max-height: calc(100dvh - 78px);
                }

                .formation-links.site-enhanced-links .site-mobile-nav-actions {
                    gap: 8px;
                }

                .formation-links.site-enhanced-links .site-mobile-nav-actions > * {
                    padding-inline: 8px;
                    font-size: clamp(0.78rem, 3.8vw, 0.95rem);
                }

                .site-formation-menu-toggle {
                    margin-left: auto;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function primaryNavigationMarkup() {
        return `
            <li><a href="index.html">Accueil</a></li>
            <li><a href="recrutement.html">Recrutement</a></li>
            <li><a href="qui-sommes-nous.html">Qui sommes-nous</a></li>
            <li><a href="tarifs.html">Tarifs</a></li>
            <li><a href="contact.html">Contact</a></li>
        `;
    }

    function formationNavigationMarkup() {
        return `
            <a href="index.html">Accueil</a>
            <a href="recrutement.html">Recrutement</a>
            <a href="qui-sommes-nous.html">Qui sommes-nous</a>
            <a href="tarifs.html">Tarifs</a>
            <a href="contact.html">Contact</a>
        `;
    }

    function normalizeClassicNavigation() {
        var header = document.querySelector('.navbar');
        var navMenu = header ? header.querySelector('.nav-menu') : null;
        if (!navMenu) return;

        header.classList.add('site-unified-navigation');
        navMenu.innerHTML = primaryNavigationMarkup();
        navMenu.dataset.unifiedNavigation = 'true';

        var wrapper = navMenu.closest('.nav-wrapper');
        var toggle = wrapper ? wrapper.querySelector('.mobile-menu-toggle') : null;
        if (!toggle && wrapper) {
            toggle = document.createElement('button');
            toggle.className = 'mobile-menu-toggle';
            toggle.id = 'mobileMenuToggle';
            toggle.innerHTML = '<span></span><span></span><span></span>';
            wrapper.insertBefore(toggle, navMenu);
        }
        if (!toggle) return;

        var cleanToggle = toggle.cloneNode(true);
        toggle.replaceWith(cleanToggle);
        cleanToggle.setAttribute('aria-label', 'Ouvrir le menu');
        cleanToggle.setAttribute('aria-expanded', 'false');

        function closeMenu() {
            navMenu.classList.remove('active');
            cleanToggle.classList.remove('active');
            cleanToggle.setAttribute('aria-expanded', 'false');
            cleanToggle.setAttribute('aria-label', 'Ouvrir le menu');
        }

        cleanToggle.addEventListener('click', function (event) {
            event.stopPropagation();
            var willOpen = !navMenu.classList.contains('active');
            navMenu.classList.toggle('active', willOpen);
            cleanToggle.classList.toggle('active', willOpen);
            cleanToggle.setAttribute('aria-expanded', String(willOpen));
            cleanToggle.setAttribute('aria-label', willOpen ? 'Fermer le menu' : 'Ouvrir le menu');
        });
        navMenu.addEventListener('click', function (event) {
            if (event.target.closest('a')) closeMenu();
        });
        document.addEventListener('click', function (event) {
            if (!event.target.closest('.navbar')) closeMenu();
        });
    }

    function normalizeFormationNavigation() {
        var header = document.querySelector('.formation-nav');
        if (!header) return;

        header.classList.add('site-unified-navigation');

        var brand = header.querySelector('.formation-brand');
        var links = header.querySelector('.formation-links');
        var actions = header.querySelector('.formation-nav-actions');
        if (brand) {
            brand.innerHTML = '<img src="assets/logo.png" alt="Auto-Ecole Breteuil"><span>Auto-Ecole <strong>Breteuil</strong></span>';
        }
        if (links) {
            links.innerHTML = formationNavigationMarkup();
            links.dataset.unifiedNavigation = 'true';
            if (actions) {
                var mobileActions = actions.cloneNode(true);
                mobileActions.className = 'site-mobile-nav-actions';
                mobileActions.removeAttribute('aria-hidden');
                links.appendChild(mobileActions);
            }
        }
    }

    function normalizeNavigation() {
        normalizeClassicNavigation();
        normalizeFormationNavigation();
    }

    function trainingMenuMarkup() {
        return `
            <button class="site-training-trigger" type="button" aria-expanded="false" aria-haspopup="true">
                <span>Permis de conduire</span>
                <i class="fas fa-chevron-down" aria-hidden="true"></i>
            </button>
            <div class="site-training-panel">
                <a class="site-training-heading" href="tarifs.html?formation=permis&transmission=manual#permis-b">
                    <i class="fas fa-car-side" aria-hidden="true"></i>
                    <span>Permis B</span>
                </a>
                <a class="site-training-link" href="tarifs.html?formation=permis&transmission=manual#permis-b">Boîte manuelle</a>
                <a class="site-training-link" href="tarifs.html?formation=permis&transmission=auto#permis-b">Boîte automatique</a>
                <a class="site-training-link" href="tarifs.html?formation=accelere#permis-b">Permis accéléré</a>
                <div class="site-training-separator" aria-hidden="true"></div>
                <a class="site-training-link site-training-link-secondary" href="tarifs.html?formation=aac&transmission=manual#conduite-accompagnee"><i class="fas fa-people-roof" aria-hidden="true"></i>Conduite accompagnée</a>
                <a class="site-training-link site-training-link-secondary" href="financement-permis.html"><i class="fas fa-wallet" aria-hidden="true"></i>Financement du permis</a>
                <a class="site-training-link site-training-link-secondary" href="devis.html"><i class="fas fa-file-signature" aria-hidden="true"></i>Demander un devis</a>
                <a class="site-training-link site-training-link-secondary" href="tarifs.html"><i class="fas fa-tags" aria-hidden="true"></i>Nos tarifs</a>
            </div>
        `;
    }

    function createTrainingMenu(tagName) {
        var menu = document.createElement(tagName || 'div');
        menu.className = 'site-training-menu';
        menu.innerHTML = trainingMenuMarkup();
        return menu;
    }

    function markCurrentNavigationLink(root) {
        var currentFile = window.location.pathname.split('/').pop() || 'index.html';
        root.querySelectorAll('a[href]').forEach(function (link) {
            var linkedUrl = new URL(link.getAttribute('href'), window.location.href);
            var linkedFile = linkedUrl.pathname.split('/').pop() || 'index.html';
            var samePage = linkedFile === currentFile;
            var sameView = linkedUrl.search
                ? linkedUrl.search === window.location.search
                : !window.location.search;
            if (samePage && sameView) link.setAttribute('aria-current', 'page');
        });
    }

    function bindTrainingMenu(menu) {
        var trigger = menu.querySelector('.site-training-trigger');
        if (!trigger) return;

        trigger.addEventListener('click', function (event) {
            event.stopPropagation();
            var willOpen = !menu.classList.contains('is-open');
            document.querySelectorAll('.site-training-menu.is-open').forEach(function (openMenu) {
                openMenu.classList.remove('is-open');
                var openTrigger = openMenu.querySelector('.site-training-trigger');
                if (openTrigger) openTrigger.setAttribute('aria-expanded', 'false');
            });
            menu.classList.toggle('is-open', willOpen);
            trigger.setAttribute('aria-expanded', String(willOpen));
        });

        menu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                menu.classList.remove('is-open');
                trigger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    function enhanceClassicNavigation() {
        var navMenu = document.querySelector('.nav-menu');
        if (!navMenu || navMenu.querySelector(':scope > .site-training-menu')) return;

        var menu = createTrainingMenu('li');
        var tariffItem = Array.from(navMenu.children).find(function (item) {
            var link = item.querySelector(':scope > a[href]');
            return link && link.getAttribute('href').split(/[?#]/)[0] === 'tarifs.html';
        });
        if (tariffItem) {
            tariffItem.replaceWith(menu);
        } else {
            navMenu.appendChild(menu);
        }
        markCurrentNavigationLink(menu);
        bindTrainingMenu(menu);
    }

    function enhanceFormationNavigation() {
        var links = document.querySelector('.formation-links');
        var navInner = document.querySelector('.formation-nav-inner');
        var actions = document.querySelector('.formation-nav-actions');
        if (!links || !navInner || links.classList.contains('site-enhanced-links')) return;

        var menu = createTrainingMenu('div');
        var tariffLink = Array.from(links.children).find(function (item) {
            return item.matches('a[href]') && item.getAttribute('href').split(/[?#]/)[0] === 'tarifs.html';
        });
        links.classList.add('site-enhanced-links');
        if (tariffLink) {
            tariffLink.replaceWith(menu);
        } else {
            links.appendChild(menu);
        }

        var toggle = document.createElement('button');
        toggle.className = 'site-formation-menu-toggle';
        toggle.type = 'button';
        toggle.setAttribute('aria-label', 'Ouvrir le menu des formations');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
        navInner.insertBefore(toggle, actions || null);

        toggle.addEventListener('click', function (event) {
            event.stopPropagation();
            var willOpen = !links.classList.contains('is-mobile-open');
            links.classList.toggle('is-mobile-open', willOpen);
            toggle.setAttribute('aria-expanded', String(willOpen));
            toggle.setAttribute('aria-label', willOpen ? 'Fermer le menu des formations' : 'Ouvrir le menu des formations');
            toggle.innerHTML = willOpen
                ? '<i class="fas fa-xmark" aria-hidden="true"></i>'
                : '<i class="fas fa-bars" aria-hidden="true"></i>';
        });

        links.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                links.classList.remove('is-mobile-open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });

        markCurrentNavigationLink(links);
        bindTrainingMenu(menu);
    }

    function enhanceNavigation() {
        injectNavigationStyles();
        normalizeNavigation();
        enhanceClassicNavigation();
        enhanceFormationNavigation();

        var currentNavigation = document.querySelector('.nav-menu, .formation-links');
        if (currentNavigation) markCurrentNavigationLink(currentNavigation);

        document.addEventListener('click', function (event) {
            if (!event.target.closest('.site-training-menu')) {
                document.querySelectorAll('.site-training-menu.is-open').forEach(function (menu) {
                    menu.classList.remove('is-open');
                    var trigger = menu.querySelector('.site-training-trigger');
                    if (trigger) trigger.setAttribute('aria-expanded', 'false');
                });
            }

            var formationLinks = document.querySelector('.formation-links.site-enhanced-links');
            var formationToggle = document.querySelector('.site-formation-menu-toggle');
            if (formationLinks && formationToggle && !event.target.closest('.formation-nav-inner')) {
                formationLinks.classList.remove('is-mobile-open');
                formationToggle.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape') return;
            document.querySelectorAll('.site-training-menu.is-open').forEach(function (menu) {
                menu.classList.remove('is-open');
                var trigger = menu.querySelector('.site-training-trigger');
                if (trigger) trigger.setAttribute('aria-expanded', 'false');
            });
            var formationLinks = document.querySelector('.formation-links.site-enhanced-links');
            var formationToggle = document.querySelector('.site-formation-menu-toggle');
            if (formationLinks) formationLinks.classList.remove('is-mobile-open');
            if (formationToggle) formationToggle.setAttribute('aria-expanded', 'false');
        });

        var desktopNavigationQuery = window.matchMedia('(min-width: 1681px)');
        var resetNavigationAfterBreakpointChange = function () {
            var classicMenu = document.querySelector('.navbar.site-unified-navigation .nav-menu');
            var classicToggle = document.querySelector('.navbar.site-unified-navigation .mobile-menu-toggle');
            var formationLinks = document.querySelector('.formation-links.site-enhanced-links');
            var formationToggle = document.querySelector('.site-formation-menu-toggle');

            if (classicMenu) classicMenu.classList.remove('active');
            if (classicToggle) {
                classicToggle.classList.remove('active');
                classicToggle.setAttribute('aria-expanded', 'false');
                classicToggle.setAttribute('aria-label', 'Ouvrir le menu');
            }
            if (formationLinks) formationLinks.classList.remove('is-mobile-open');
            if (formationToggle) {
                formationToggle.setAttribute('aria-expanded', 'false');
                formationToggle.setAttribute('aria-label', 'Ouvrir le menu des formations');
                formationToggle.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
            }
        };

        if (desktopNavigationQuery.addEventListener) {
            desktopNavigationQuery.addEventListener('change', resetNavigationAfterBreakpointChange);
        } else {
            desktopNavigationQuery.addListener(resetNavigationAfterBreakpointChange);
        }
    }

    function injectFooterStyles() {
        if (document.getElementById('siteFooterStyles')) return;

        var style = document.createElement('style');
        style.id = 'siteFooterStyles';
        style.textContent = `
            .footer {
                background: #1A1A2E;
                color: white;
                padding: 4rem 0 1.5rem;
                font-family: 'Poppins', sans-serif;
            }

            .footer .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 1.5rem;
            }

            .footer-grid {
                display: grid;
                grid-template-columns: 1.25fr repeat(4, minmax(165px, 1fr));
                gap: 2.5rem;
                margin-bottom: 2.5rem;
            }

            .footer-col h4 {
                color: white;
                margin: 0 0 1.5rem;
                font-size: 1.55rem;
                line-height: 1.2;
                font-weight: 800;
            }

            .footer-col p {
                color: rgba(255, 255, 255, 0.78);
                line-height: 1.7;
                margin: 0 0 1.5rem;
            }

            .footer-col ul {
                list-style: none;
                margin: 0;
                padding: 0;
            }

            .footer-col ul li,
            .footer-col ul li a {
                color: rgba(255, 255, 255, 0.86);
                text-decoration: none;
                font-size: 1rem;
                line-height: 1.55;
                transition: color 150ms ease-in-out;
            }

            .footer-col ul li {
                display: grid;
                grid-template-columns: auto 1fr;
                align-items: center;
                column-gap: 0.65rem;
                margin-bottom: 1.1rem;
                min-width: 0;
                overflow-wrap: anywhere;
            }

            .footer-col ul li a:hover {
                color: #FF69B4;
            }

            .footer-col ul li i {
                color: rgba(255, 255, 255, 0.9);
                width: 1.15rem;
                text-align: center;
                flex: 0 0 auto;
            }

            .footer-brand-hours {
                margin-bottom: 1.5rem !important;
            }

            .footer-mini-badges {
                display: flex;
                flex-wrap: wrap;
                gap: 0.55rem;
            }

            .footer-mini-badges span {
                display: inline-flex;
                align-items: center;
                gap: 0.45rem;
                padding: 0.5rem 0.75rem;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.08);
                color: rgba(255, 255, 255, 0.92);
                font-size: 0.86rem;
                font-weight: 800;
            }

            .footer-mini-badges i {
                color: #FF69B4;
            }

            .footer-col ul li.footer-email {
                white-space: nowrap;
                overflow-wrap: normal;
                font-size: 0.8rem;
            }

            .footer-bottom {
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                padding-top: 1.5rem;
                display: flex;
                justify-content: space-between;
                gap: 1.5rem;
                align-items: center;
            }

            .footer-bottom p {
                margin: 0;
                color: rgba(255, 255, 255, 0.78);
            }

            .footer-links {
                display: flex;
                flex-wrap: wrap;
                gap: 2rem;
            }

            .footer-links a {
                color: rgba(255, 255, 255, 0.9);
                text-decoration: none;
                transition: color 150ms ease-in-out;
            }

            .footer-links a:hover {
                color: #FF69B4;
            }

            @media (max-width: 900px) {
                .footer-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
            }

            @media (max-width: 520px) {
                .footer {
                    padding-top: 2.75rem;
                }

                .footer-grid {
                    grid-template-columns: 1fr;
                    gap: 2rem;
                }

                .footer-bottom {
                    flex-direction: column;
                    text-align: center;
                }

                .footer-links {
                    justify-content: center;
                    gap: 1.25rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function buildFooter() {
        var footer = document.createElement('footer');
        footer.className = 'footer';
        footer.innerHTML = `
            <div class="container">
                <div class="footer-grid">
                    <div class="footer-col">
                        <h4>Auto-Ecole Breteuil</h4>
                        <p>Votre auto-école à Marseille 13006. Formation de qualité au permis de conduire.</p>
                        <ul class="footer-brand-hours">
                            <li><i class="fas fa-car"></i> Conduite : Lun-Sam 7h-19h</li>
                            <li><i class="fas fa-house"></i> Bureau : Lun-Ven 17h-19h</li>
                        </ul>
                        <div class="footer-mini-badges">
                            <span><i class="fas fa-star"></i> 4,6/5 Google</span>
                            <span><i class="fas fa-location-dot"></i> Marseille 6e</span>
                        </div>
                    </div>

                    <div class="footer-col">
                        <h4>Pour commencer</h4>
                        <ul>
                            <li><a href="inscription.html">S'inscrire en ligne</a></li>
                            <li><a href="tarifs.html">Nos tarifs</a></li>
                            <li><a href="devis.html">Demander un devis</a></li>
                            <li><a href="code.html">Code de la route</a></li>
                            <li><a href="permis-b.html">Permis B</a></li>
                            <li><a href="permis-boite-manuelle.html">Permis boîte manuelle</a></li>
                            <li><a href="permis-boite-automatique.html">Permis boîte automatique</a></li>
                            <li><a href="conduite-accompagnee.html">Conduite accompagnée</a></li>
                        </ul>
                    </div>

                    <div class="footer-col">
                        <h4>Infos utiles</h4>
                        <ul>
                            <li><a href="qui-sommes-nous.html">Qui sommes-nous</a></li>
                            <li><a href="tarifs.html#faq">FAQ</a></li>
                            <li><a href="forfait-second-chance.html">Forfait seconde chance</a></li>
                            <li><a href="permis-accelere.html">Permis accéléré</a></li>
                            <li><a href="financement-permis.html">Financement du permis</a></li>
                            <li><a href="avis.html">Avis des élèves</a></li>
                        </ul>
                    </div>

                    <div class="footer-col">
                        <h4>Espace élève</h4>
                        <ul>
                            <li><a href="connexion.html">Mon espace élève</a></li>
                            <li><a href="reservation.html">Réserver une leçon</a></li>
                            <li><a href="contact.html">Modifier un rendez-vous</a></li>
                            <li><a href="contact.html">Poser une question</a></li>
                        </ul>
                    </div>

                    <div class="footer-col">
                        <h4>Notre localisation</h4>
                        <p>1A Rue Édouard Delanglade, 13006 Marseille</p>
                        <h4 style="margin-top: 1.5rem;">Contact</h4>
                        <ul>
                            <li><i class="fas fa-phone"></i> 04 91 53 36 98</li>
                            <li class="footer-email"><i class="fas fa-envelope"></i> breteuilautoecole@gmail.com</li>
                        </ul>
                    </div>
                </div>

                <div class="footer-bottom">
                    <p>&copy; 2026 Auto-Ecole Breteuil. Tous droits réservés.</p>
                    <div class="footer-links">
                        <a href="mentions-legales.html">Mentions légales</a>
                        <a href="cgv.html">CGV</a>
                        <a href="confidentialite.html">Confidentialité</a>
                    </div>
                </div>
            </div>
        `;
        return footer;
    }

    function renderSiteFooter() {
        ensureFooterAssets();
        enhanceNavigation();
        injectFooterStyles();

        document.querySelectorAll('footer').forEach(function (footer) {
            footer.remove();
        });

        document.body.appendChild(buildFooter());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderSiteFooter);
    } else {
        renderSiteFooter();
    }
})();
