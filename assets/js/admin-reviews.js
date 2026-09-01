// Gestion des avis dans l'admin

let currentFilter = 'all';
let allReviews = [];

async function adminRequest(resource, options = {}) {
    const token = window.authSession?.getToken?.();
    if (!token) throw new Error('AUTH_REQUIRED');
    const response = await fetch(`/.netlify/functions/admin-page-data?resource=${encodeURIComponent(resource)}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(options.headers || {})
        }
    });
    const result = await response.json().catch(() => ({ ok: false, error: 'INVALID_SERVER_RESPONSE' }));
    if (!response.ok || !result.ok) {
        const error = new Error(result.error || 'ADMIN_REQUEST_FAILED');
        error.status = response.status;
        throw error;
    }
    return result;
}

// Charger les avis
async function loadReviews() {
    const reviewsGrid = document.getElementById('reviewsGrid');
    if (!reviewsGrid) return;
    
    try {
        const result = await adminRequest('reviews');
        allReviews = result.items || [];
        displayReviews();
        updateBadge();
        
    } catch (err) {
        console.error('Erreur:', err);
    }
}

// Afficher les avis filtrés
function displayReviews() {
    const reviewsGrid = document.getElementById('reviewsGrid');
    if (!reviewsGrid) return;
    
    const filteredReviews = currentFilter === 'all' 
        ? allReviews 
        : allReviews.filter(r => r.status === currentFilter);
    
    if (!filteredReviews || filteredReviews.length === 0) {
        reviewsGrid.innerHTML = '<div class="empty-state"><i class="fas fa-star"></i><p>Aucun avis à afficher.</p></div>';
        return;
    }
    
    reviewsGrid.innerHTML = filteredReviews.map(review => {
        const date = new Date(review.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const stars = Array(5).fill(0).map((_, i) => 
            i < review.note 
                ? '<i class="fas fa-star"></i>' 
                : '<i class="far fa-star"></i>'
        ).join('');
        
        const statusClass = `status-${review.status}`;
        const statusText = {
            'pending': 'En attente',
            'published': 'Publié',
            'rejected': 'Rejeté'
        }[review.status] || review.status;
        
        let actions = '';
        if (review.status === 'pending') {
            actions = `
                <button class="btn-action btn-publish" onclick="publishReview('${review.id}')">
                    <i class="fas fa-check"></i> Publier
                </button>
                <button class="btn-action btn-reject" onclick="rejectReview('${review.id}')">
                    <i class="fas fa-times"></i> Rejeter
                </button>
            `;
        } else if (review.status === 'published') {
            actions = `
                <button class="btn-action btn-reject" onclick="rejectReview('${review.id}')">
                    <i class="fas fa-times"></i> Rejeter
                </button>
                <button class="btn-action btn-delete" onclick="deleteReview('${review.id}')">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            `;
        } else {
            actions = `
                <button class="btn-action btn-publish" onclick="publishReview('${review.id}')">
                    <i class="fas fa-check"></i> Publier
                </button>
                <button class="btn-action btn-delete" onclick="deleteReview('${review.id}')">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            `;
        }
        
        return `
            <div class="review-card">
                <div class="review-header">
                    <div>
                        <div class="review-author">${escapeHtml(review.prenom)} ${escapeHtml(review.nom.charAt(0))}.</div>
                        <div class="review-date">${date}</div>
                    </div>
                    <span class="review-status ${statusClass}">${statusText}</span>
                </div>
                <div class="review-stars">${stars}</div>
                <p class="review-text">${escapeHtml(review.commentaire)}</p>
                <div class="review-actions">
                    ${actions}
                </div>
            </div>
        `;
    }).join('');
}

// Publier un avis
async function publishReview(reviewId) {
    if (!confirm('Voulez-vous vraiment publier cet avis ?')) return;
    
    try {
        await adminRequest('reviews', {
            method: 'POST',
            body: JSON.stringify({ action: 'update', id: reviewId, status: 'published' })
        });
        
        await loadReviews();
        alert('✅ Avis publié avec succès.');
        
    } catch (err) {
        console.error('Erreur:', err);
        alert('Erreur lors de la publication de l\'avis.');
    }
}

// Rejeter un avis
async function rejectReview(reviewId) {
    if (!confirm('Voulez-vous vraiment rejeter cet avis ?')) return;
    
    try {
        await adminRequest('reviews', {
            method: 'POST',
            body: JSON.stringify({ action: 'update', id: reviewId, status: 'rejected' })
        });
        
        await loadReviews();
        alert('✅ Avis rejeté.');
        
    } catch (err) {
        console.error('Erreur:', err);
        alert('Erreur lors du rejet de l\'avis.');
    }
}

// Supprimer un avis
async function deleteReview(reviewId) {
    if (!confirm('Voulez-vous vraiment supprimer cet avis ? Cette action est irréversible.')) return;
    
    try {
        await adminRequest('reviews', {
            method: 'POST',
            body: JSON.stringify({ action: 'delete', id: reviewId })
        });
        
        await loadReviews();
        alert('✅ Avis supprimé.');
        
    } catch (err) {
        console.error('Erreur:', err);
        alert('Erreur lors de la suppression de l\'avis.');
    }
}

// Filtrer les avis
function setupFilterTabs() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            displayReviews();
        });
    });
}

// Mettre à jour le badge
function updateBadge() {
    const badge = document.getElementById('reviewsBadge');
    if (!badge) return;
    
    const pendingCount = allReviews.filter(r => r.status === 'pending').length;
    if (pendingCount > 0) {
        badge.textContent = pendingCount;
        badge.style.display = 'inline';
    } else {
        badge.style.display = 'none';
    }
}

// Échapper les caractères HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialisation
window.addEventListener('auth-session-ready', () => {
    loadReviews();
    setupFilterTabs();
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.authSession?.logout?.();
            localStorage.removeItem('ae_user');
            localStorage.removeItem('ae_access_token');
            sessionStorage.removeItem('ae_user');
            sessionStorage.removeItem('ae_access_token');
            window.location.href = 'index.html';
        });
    }
}, { once: true });
