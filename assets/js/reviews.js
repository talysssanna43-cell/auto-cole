// Avis Google - aucune donn?e d'avis invent?e.
const GOOGLE_MAPS_URL = 'https://www.google.com/maps/place/Auto-Ecole+Breteuil/@43.2897957,5.3785036,15.24z/data=!3m1!5s0x12c9c0b775ba4549:0xbfe923b2b6f00aec!4m8!3m7!1s0x12c9c0b776a83425:0x6d9a5634af880116!8m2!3d43.2892337!4d5.3758786!9m1!1b1!16s%2Fg%2F1tfhpphl?entry=ttu&g_ep=EgoyMDI2MDgwNC4wIKXMDSoASAFQAw%3D%3D';
const GOOGLE_FALLBACK = {
    rating: 4.6,
    total: 184,
    reviews: [
        {
            author_name: 'Adrien GABOURG',
            author_reviews: '3 avis',
            rating: 5,
            relative_time_description: 'il y a 9 mois',
            text: "Je vous recommande l'auto-?cole Breteuil !\n\nApr?s plusieurs ?checs au permis, et ne pouvant plus me permettre d'?tendre sur plusieurs mois mes cours de conduite, j'ai fait appel ? cette auto-?cole sp?cialis?e dans la conduite acc?l?r?e. Les ?changes ont ?t? fluides, et j'ai eu rapidement une date d'examen. Mention sp?ciale ? mon moniteur Diego. Tr?s gentil et p?dagogue, vous progresserez rapidement avec lui. J'ai finalement valid? mon permis avec un excellent score ? l'issue de mon stage acc?l?r?.\n\nRien ? signaler, vous pouvez foncer.",
            visit: 'Visit? en septembre 2025'
        },
        {
            author_name: 'In?s Douat',
            author_reviews: '2 avis',
            rating: 5,
            relative_time_description: 'il y a 4 mois',
            text: "Je mets 5 ?toiles ? cette auto-?cole. En effet, de l'accueil jusqu'? l'obtention de mon permis les moniteurs ont juste ?t? super ! Nelly, Samy et Milenne sont tr?s p?dagogiques et bienveillants, ils m'ont appris m?thodiquement la conduite et m'ont pouss? vers la r?ussite. Je recommande.",
            visit: 'Visit? en mars'
        },
        {
            author_name: 'Milo Abitbol',
            author_reviews: '11 avis',
            rating: 5,
            relative_time_description: 'il y a 5 mois',
            text: "Je met 5 ?toiles car mon exp?rience la bas ?tait tout simplement parfaite, de l?administration aux heures de conduites, le personnel est exceptionnel, je pense surtout ? Samy avec qui j?ai beaucoup rigol? et appris, qui a fait de mon permis une vrai partie de plaisir, c?est vraiment une personne en or. Merci aussi ? Myl?ne qui avec un peu plus de s?rieux ma permis de mieux comprendre le fonctionnement de la voiture et pour finir Nelly, qui a ?tait tout simplement extraordinaire de l?organisation de mon dossier a la recherche de dates d?examen en passant par l?organisation de mes heures de cours. J?ai obtenu mon permis en 2 mois ? 28/31 en l?ayant loup? 1 fois, je recommande grandement cette auto ?cole\nMerci ? toute l??quipe",
            visit: 'Visit? en f?vrier'
        },
        {
            author_name: 'Marie boussioux',
            author_reviews: '1 avis',
            rating: 4,
            relative_time_description: 'il y a 4 mois',
            text: "Les moniteurs sont r?ellement investis, tr?s p?dagogues et assurent un suivi personnalis? pour que chaque ?l?ve progresse ? son rythme.\nJe recommande vivement cette auto-?cole pour la qualit? de son accompagnement tout au long de mon parcours.\nGr?ce ? leur organisation, leur disponibilit? et leurs conseils, j?ai pu obtenir mon permis en seulement 2 mois, ce qui ?tait un v?ritable objectif pour moi.\nUne auto-?cole professionnelle, bienveillante et efficace, que je recommande les yeux ferm?s ? toute personne souhaitant r?ussir son permis dans les meilleures conditions.\nUn grand merci ? toute l??quipe pour votre soutien et votre implication !",
            visit: 'Visit? en mars'
        }
    ],
    url: GOOGLE_MAPS_URL,
    reviewUrl: GOOGLE_MAPS_URL
};

function googleStars(rating) {
    const rounded = Math.round(rating * 2) / 2;
    return Array.from({ length: 5 }, (_, index) => {
        const value = index + 1;
        if (rounded >= value) return '<i class="fas fa-star"></i>';
        if (rounded >= value - 0.5) return '<i class="fas fa-star-half-alt"></i>';
        return '<i class="far fa-star"></i>';
    }).join('');
}

function escapeHtml(text = '') {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function fetchGoogleReviews() {
    const endpoints = ['/.netlify/functions/google-reviews', '/api/google-reviews', 'http://localhost:3000/api/google-reviews'];
    let fallbackData = null;

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint, { cache: 'no-store' });
            if (!response.ok) continue;
            const data = await response.json();
            if (data.configured === false || data.source === 'fallback') {
                fallbackData = data;
                continue;
            }
            const reviews = Array.isArray(data.reviews) && data.reviews.length
                ? data.reviews
                : GOOGLE_FALLBACK.reviews;
            return {
                ...GOOGLE_FALLBACK,
                ...data,
                reviews
            };
        } catch (error) {
            // Try the next endpoint, then fall back to a truthful Google summary.
        }
    }

    return fallbackData
        ? { ...GOOGLE_FALLBACK, ...fallbackData, reviews: [] }
        : GOOGLE_FALLBACK;
}

function renderReviewCard(review) {
    const name = review.author_name || 'Avis Google';
    const initial = name.trim().charAt(0).toUpperCase() || 'G';
    const date = review.relative_time_description || '';
    const text = (review.text || '').split(/\n\s*\n\(Translated by Google\)/i)[0].trim();
    const rating = Number(review.rating || 5);
    const isLong = text.length > 360;
    const avatar = review.profile_photo_url
        ? `<img src="${escapeHtml(review.profile_photo_url)}" alt="" loading="lazy">`
        : escapeHtml(initial);

    return `
        <div class="review-card avis-card">
            <div class="avis-card-header">
                <div class="avis-card-avatar">${avatar}</div>
                <div class="avis-card-meta">
                    <div class="avis-card-name">${escapeHtml(name)}</div>
                    <div class="avis-card-date">${escapeHtml(date)}</div>
                </div>
                <div class="avis-card-stars review-stars" aria-label="${rating} étoiles sur 5">${googleStars(rating)}<i class="fab fa-google avis-google-mark" aria-hidden="true"></i></div>
            </div>
            <p class="review-text avis-card-text${isLong ? ' is-collapsed' : ''}">${escapeHtml(text)}</p>
            ${isLong ? '<button type="button" class="avis-read-more" aria-expanded="false">Lire la suite</button>' : ''}
            ${review.visit ? `<p class="avis-card-date">${escapeHtml(review.visit)}</p>` : ''}
        </div>
    `;
}

function renderGoogleFallback(url) {
    return `
        <div class="review-card google-review-summary">
            <p class="review-text">
                Connexion aux avis Google en attente. Une fois Google Business Profile connecté, tous les avis Google disponibles apparaîtront ici automatiquement.
            </p>
            <div class="review-footer">
                <span class="review-author">Avis vérifiés sur Google</span>
                <div class="review-stars">${googleStars(GOOGLE_FALLBACK.rating)}</div>
            </div>
            <a href="${url}" target="_blank" rel="noopener" class="btn-outline-dark google-review-link">Voir les avis Google</a>
        </div>
    `;
}

function updateSummary(data) {
    const rating = Number(data.rating || GOOGLE_FALLBACK.rating);
    const total = Number(data.total || GOOGLE_FALLBACK.total);

    document.querySelectorAll('.rating-number').forEach((element) => {
        element.textContent = rating.toFixed(1).replace('.', ',');
    });

    document.querySelectorAll('.testimonials-count').forEach((element) => {
        element.textContent = `${total} avis Google`;
    });

    document.querySelectorAll('.testimonials-source').forEach((element) => {
        element.textContent = 'avis vérifiés sur Google Maps';
    });

    document.querySelectorAll('.rating-stars-big').forEach((element) => {
        element.innerHTML = googleStars(rating);
    });

    document.querySelectorAll('.avis-count').forEach((element) => {
        element.textContent = `${total} avis Google`;
    });
}

function updateLinks(url) {
    document.querySelectorAll('[data-google-reviews-link]').forEach((link) => {
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener';
    });
}

function renderAvisPage(avisGrid, reviews) {
    const pageSize = 9;
    const moreWrap = document.getElementById('avisMoreWrap');
    let visibleCount = Math.min(pageSize, reviews.length);

    const refresh = () => {
        avisGrid.innerHTML = reviews.slice(0, visibleCount).map(renderReviewCard).join('');
        if (!moreWrap) return;

        if (visibleCount >= reviews.length) {
            moreWrap.hidden = true;
            moreWrap.innerHTML = '';
            return;
        }

        moreWrap.hidden = false;
        moreWrap.innerHTML = `
            <button type="button" class="avis-more-button">Afficher plus d'avis</button>
            <span class="avis-visible-count">${visibleCount} avis affichés sur ${reviews.length}</span>
        `;
        moreWrap.querySelector('.avis-more-button').addEventListener('click', () => {
            visibleCount = Math.min(visibleCount + pageSize, reviews.length);
            refresh();
        });
    };

    refresh();
}

async function loadPublishedReviews() {
    const data = await fetchGoogleReviews();
    const url = data.url || GOOGLE_MAPS_URL;
    const reviewUrl = data.reviewUrl || url;
    const reviews = data.reviews.filter((review) => review && review.text);

    updateSummary(data);
    updateLinks(reviewUrl);

    const testimonialsRight = document.getElementById('testimonialsRight');
    if (testimonialsRight) {
        testimonialsRight.innerHTML = reviews.length
            ? reviews.slice(0, 4).map(renderReviewCard).join('')
            : renderGoogleFallback(url);
    }

    const avisGrid = document.querySelector('.avis-grid');
    if (avisGrid) {
        if (reviews.length) {
            renderAvisPage(avisGrid, reviews);
        } else {
            avisGrid.innerHTML = renderGoogleFallback(url);
        }
    }

    const avisPageTitle = document.querySelector('.avis-section-title');
    if (avisPageTitle && reviews.length > 4) {
        avisPageTitle.textContent = `Tous nos avis Google`;
    }
}

document.addEventListener('click', (event) => {
    const button = event.target.closest('.avis-read-more');
    if (!button) return;
    const text = button.previousElementSibling;
    if (!text || !text.classList.contains('avis-card-text')) return;

    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!isExpanded));
    button.textContent = isExpanded ? 'Lire la suite' : 'Réduire';
    text.classList.toggle('is-collapsed', isExpanded);
});

document.addEventListener('DOMContentLoaded', loadPublishedReviews);
