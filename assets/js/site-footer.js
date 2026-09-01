(function () {
    function ensureFooterAssets() {
        var hasFontAwesome = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(function (link) {
            return link.href.indexOf('font-awesome') !== -1 || link.href.indexOf('fontawesome') !== -1;
        });

        if (!hasFontAwesome) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(link);
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
                            <span><i class="fas fa-star"></i> 4,8/5 Google</span>
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
                            <li><a href="conduite-accompagnee.html">Conduite accompagnée</a></li>
                        </ul>
                    </div>

                    <div class="footer-col">
                        <h4>Infos utiles</h4>
                        <ul>
                            <li><a href="qui-sommes-nous.html">Qui sommes-nous</a></li>
                            <li><a href="tarifs.html#faq">FAQ</a></li>
                            <li><a href="forfait-second-chance.html">Forfait seconde chance</a></li>
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
                    <p>&copy; 2024 Auto-Ecole Breteuil. Tous droits réservés.</p>
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
