// Gestion des demandes de contact côté admin
let allContactRequests = [];

async function loadContactRequests() {
    const container = document.getElementById('contactRequestsContainer');
    const statusFilter = document.getElementById('statusFilter');
    
    if (!container) return;
    
    try {
        // Afficher le loader
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #86868b;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Chargement des demandes...</p>
            </div>
        `;
        
        // Charger toutes les demandes
        const { data: requests, error } = await window.supabaseClient
            .from('contact_requests')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading contact requests:', error);
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #ff3b30;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Erreur lors du chargement des demandes</p>
                </div>
            `;
            return;
        }
        
        allContactRequests = requests || [];
        
        // Mettre à jour les stats
        updateStats(allContactRequests);
        
        // Mettre à jour le badge de notification
        updateContactBadge(allContactRequests);
        
        // Filtrer selon le statut sélectionné
        const selectedStatus = statusFilter ? statusFilter.value : 'tous';
        const filteredRequests = selectedStatus === 'tous' 
            ? allContactRequests 
            : allContactRequests.filter(r => r.status === selectedStatus);
        
        // Afficher les demandes
        displayContactRequests(filteredRequests);
        
    } catch (err) {
        console.error('Error:', err);
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #ff3b30;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Erreur lors du chargement des demandes</p>
            </div>
        `;
    }
}

function updateStats(requests) {
    const statTotal = document.getElementById('statTotal');
    const statNew = document.getElementById('statNew');
    const statResolved = document.getElementById('statResolved');
    
    if (statTotal) statTotal.textContent = requests.length;
    if (statNew) statNew.textContent = requests.filter(r => r.status === 'nouveau').length;
    if (statResolved) statResolved.textContent = requests.filter(r => r.status === 'resolu').length;
}

function displayContactRequests(requests) {
    const container = document.getElementById('contactRequestsContainer');
    
    if (!requests || requests.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #86868b;">
                <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Aucune demande de contact</p>
            </div>
        `;
        return;
    }
    
    const statusColors = {
        'nouveau': '#ff9500',
        'en_cours': '#0071e3',
        'resolu': '#34c759'
    };
    
    const statusLabels = {
        'nouveau': 'Nouveau',
        'en_cours': 'En cours',
        'resolu': 'Résolu'
    };
    
    const sujetLabels = {
        'inscription': 'Inscription',
        'tarifs': 'Tarifs et paiement',
        'planning': 'Planning et réservation',
        'cpf': 'Financement CPF',
        'reclamation': 'Réclamation',
        'autre': 'Autre'
    };
    
    const requestsHTML = requests.map(request => {
        const statusColor = statusColors[request.status] || '#86868b';
        const statusLabel = statusLabels[request.status] || request.status;
        const sujetLabel = sujetLabels[request.sujet] || request.sujet;
        const createdDate = new Date(request.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div style="background: white; border-radius: 14px; padding: 1.25rem; margin-bottom: 1rem; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.06);">
                <!-- Header: Name + Status -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                    <h3 style="margin: 0; font-size: 1rem; color: #1d1d1f; font-weight: 600;">
                        <i class="fas fa-user" style="color: #86868b; margin-right: 0.5rem;"></i>${request.prenom} ${request.nom}
                    </h3>
                    <span style="padding: 0.35rem 0.75rem; background: ${statusColor === '#ff9500' ? 'rgba(255,149,0,0.15)' : statusColor === '#0071e3' ? 'rgba(0,113,227,0.15)' : 'rgba(52,199,89,0.15)'}; color: ${statusColor}; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                        ${statusLabel}
                    </span>
                </div>
                
                <!-- Contact Info -->
                <div style="display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; padding-left: 1.5rem;">
                    <p style="margin: 0; color: #86868b; font-size: 0.85rem; word-break: break-all;">
                        ${request.email}
                    </p>
                    ${request.telephone ? `<p style="margin: 0; color: #86868b; font-size: 0.85rem;">${request.telephone}</p>` : ''}
                    <p style="margin: 0; color: #86868b; font-size: 0.8rem;">
                        ${createdDate}
                    </p>
                </div>
                
                <!-- Actions: Status + Delete -->
                <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.875rem; flex-wrap: wrap;">
                    <select onchange="updateRequestStatus('${request.id}', this.value)" style="flex: 1; min-width: 120px; padding: 0.5rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); font-size: 0.85rem; background: white;">
                        <option value="nouveau" ${request.status === 'nouveau' ? 'selected' : ''}>Nouveau</option>
                        <option value="en_cours" ${request.status === 'en_cours' ? 'selected' : ''}>En cours</option>
                        <option value="resolu" ${request.status === 'resolu' ? 'selected' : ''}>Résolu</option>
                    </select>
                    <button onclick="deleteContactRequest('${request.id}')" style="width: 36px; height: 36px; border-radius: 8px; border: none; background: #ff3b30; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='#ff1f13'" onmouseout="this.style.background='#ff3b30'" title="Supprimer">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="background: #f5f5f7; padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <i class="fas fa-tag" style="color: #0071e3;"></i>
                        <strong style="color: #1d1d1f;">Sujet:</strong>
                        <span style="color: #0071e3;">${sujetLabel}</span>
                    </div>
                    <div style="margin-top: 0.75rem;">
                        <strong style="color: #1d1d1f; display: block; margin-bottom: 0.5rem;">
                            <i class="fas fa-comment"></i> Message:
                        </strong>
                        <p style="margin: 0; color: #1d1d1f; white-space: pre-wrap; line-height: 1.6;">
                            ${request.message}
                        </p>
                    </div>
                </div>
                
                <div style="display: flex; gap: 0.75rem; align-items: center;">
                    ${request.telephone ? `
                        <a href="tel:${request.telephone}" style="padding: 0.5rem 1rem; border-radius: 8px; background: #34c759; color: white; text-decoration: none; font-size: 0.9rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-phone"></i> Appeler
                        </a>
                    ` : ''}
                    <a href="mailto:${request.email}" style="padding: 0.5rem 1rem; border-radius: 8px; background: #0071e3; color: white; text-decoration: none; font-size: 0.9rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-envelope"></i> Répondre par email
                    </a>
                    ${request.newsletter ? '<span style="color: #86868b; font-size: 0.85rem;"><i class="fas fa-bell"></i> Inscrit à la newsletter</span>' : ''}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = requestsHTML;
}

async function updateRequestStatus(requestId, newStatus) {
    try {
        const { error } = await window.supabaseClient
            .from('contact_requests')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', requestId);
        
        if (error) {
            console.error('Error updating status:', error);
            alert('Erreur lors de la mise à jour du statut');
            return;
        }
        
        // Recharger les demandes
        loadContactRequests();
        
    } catch (err) {
        console.error('Error:', err);
        alert('Erreur lors de la mise à jour du statut');
    }
}

async function deleteContactRequest(requestId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande de contact ?')) {
        return;
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('contact_requests')
            .delete()
            .eq('id', requestId);
        
        if (error) {
            console.error('Error deleting contact request:', error);
            alert('Erreur lors de la suppression de la demande');
            return;
        }
        
        // Recharger les demandes
        loadContactRequests();
        
    } catch (err) {
        console.error('Error:', err);
        alert('Erreur lors de la suppression de la demande');
    }
}

function updateContactBadge(requests) {
    const badge = document.getElementById('contactBadge');
    if (!badge) return;
    
    const newCount = requests.filter(r => r.status === 'nouveau').length;
    
    if (newCount > 0) {
        badge.textContent = newCount;
        badge.style.display = 'inline-flex';
    } else {
        badge.style.display = 'none';
    }
}

window.updateRequestStatus = updateRequestStatus;
window.deleteContactRequest = deleteContactRequest;

// Charger les demandes au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadContactRequests();
    
    // Ajouter l'event listener pour le filtre de statut
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            const selectedStatus = statusFilter.value;
            const filteredRequests = selectedStatus === 'tous' 
                ? allContactRequests 
                : allContactRequests.filter(r => r.status === selectedStatus);
            displayContactRequests(filteredRequests);
        });
    }
});
