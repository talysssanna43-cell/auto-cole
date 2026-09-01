// Admin Support Tickets Management
(function() {
    'use strict';

    let currentFilter = 'all';
    let tickets = [];

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[character]);
    }

    function safeAttachmentUrl(value) {
        const url = String(value || '');
        return /^(https:\/\/|data:(image\/(png|jpe?g|webp)|application\/pdf);base64,)/i.test(url) ? url : '';
    }

    // Vérifier l'authentification admin
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

    // Charger les tickets
    async function loadTickets() {
        try {
            const result = await adminRequest('support');
            tickets = result.items || [];
            renderTickets();
        } catch (err) {
            console.error('Error loading tickets:', err);
            document.getElementById('ticketsList').innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Erreur lors du chargement des signalements.</p>
                </div>
            `;
        }
    }

    // Afficher les tickets
    function renderTickets() {
        const container = document.getElementById('ticketsList');
        
        let filteredTickets = tickets;
        if (currentFilter !== 'all') {
            filteredTickets = tickets.filter(t => t.status === currentFilter);
        }

        if (filteredTickets.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #999;">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Aucun signalement ${currentFilter === 'pending' ? 'en attente' : currentFilter === 'resolved' ? 'résolu' : ''}.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredTickets.map(ticket => {
            const date = new Date(ticket.created_at);
            const dateStr = date.toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const statusColor = ticket.status === 'pending' ? '#ffc107' : '#28a745';
            const statusText = ticket.status === 'pending' ? 'En attente' : 'Résolu';
            const statusIcon = ticket.status === 'pending' ? 'clock' : 'check-circle';

            return `
                <div class="ticket-card" data-id="${ticket.id}" style="background: white; padding: 1.25rem; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.06);">
                    <!-- Header: Name + Status -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                        <h3 style="margin: 0; color: #1d1d1f; font-size: 1rem; font-weight: 600;">
                            <i class="fas fa-user" style="color: #86868b; margin-right: 0.5rem;"></i>${escapeHtml(ticket.user_name || 'Utilisateur')}
                        </h3>
                        <span style="padding: 0.35rem 0.75rem; background: ${ticket.status === 'pending' ? 'rgba(255,193,7,0.15)' : 'rgba(52,199,89,0.15)'}; color: ${ticket.status === 'pending' ? '#a07000' : '#0a8e47'}; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                            ${statusText}
                        </span>
                    </div>
                    
                    <!-- Contact Info -->
                    <div style="display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; padding-left: 1.5rem;">
                        <p style="margin: 0; color: #86868b; font-size: 0.85rem; word-break: break-all;">
                            ${escapeHtml(ticket.user_email)}
                        </p>
                        <p style="margin: 0; color: #86868b; font-size: 0.8rem;">
                            ${dateStr}
                        </p>
                    </div>

                    <!-- Message -->
                    <div style="background: #f5f5f7; padding: 0.875rem; border-radius: 12px; margin-bottom: 0.875rem;">
                        <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: #86868b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em;">Message</p>
                        <p style="margin: 0; white-space: pre-wrap; color: #1d1d1f; font-size: 0.9rem; line-height: 1.5;">${escapeHtml(ticket.message)}</p>
                    </div>

                    ${safeAttachmentUrl(ticket.attachment_url) ? `
                        <div style="margin-bottom: 0.875rem;">
                            <a href="${escapeHtml(safeAttachmentUrl(ticket.attachment_url))}" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 0.5rem; color: #0071e3; text-decoration: none; font-weight: 500; font-size: 0.85rem;">
                                <i class="fas fa-paperclip"></i> Pièce jointe
                            </a>
                        </div>
                    ` : ''}

                    <!-- Actions -->
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        ${ticket.status === 'pending' ? `
                            <button class="resolve-btn" data-id="${ticket.id}" style="flex: 1; min-width: 120px; padding: 0.625rem 0.875rem; background: #34c759; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 0.8rem;">
                                <i class="fas fa-check"></i> Résolu
                            </button>
                        ` : `
                            <button class="reopen-btn" data-id="${ticket.id}" style="flex: 1; min-width: 120px; padding: 0.625rem 0.875rem; background: #ff9500; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 0.8rem;">
                                <i class="fas fa-undo"></i> Rouvrir
                            </button>
                        `}
                        <button class="delete-btn" data-id="${ticket.id}" style="flex: 1; min-width: 100px; padding: 0.625rem 0.875rem; background: #ff3b30; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 0.8rem;">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Ajouter les event listeners
        document.querySelectorAll('.resolve-btn').forEach(btn => {
            btn.addEventListener('click', () => updateTicketStatus(btn.dataset.id, 'resolved'));
        });

        document.querySelectorAll('.reopen-btn').forEach(btn => {
            btn.addEventListener('click', () => updateTicketStatus(btn.dataset.id, 'pending'));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteTicket(btn.dataset.id));
        });
    }

    // Mettre à jour le statut d'un ticket
    async function updateTicketStatus(ticketId, newStatus) {
        try {
            const updateData = {
                status: newStatus
            };

            if (newStatus === 'resolved') {
                updateData.resolved_at = new Date().toISOString();
            } else {
                updateData.resolved_at = null;
            }

            await adminRequest('support', {
                method: 'POST',
                body: JSON.stringify({ action: 'update', id: ticketId, ...updateData })
            });

            await loadTickets();
        } catch (err) {
            console.error('Error updating ticket:', err);
            alert('Erreur lors de la mise à jour du ticket.');
        }
    }

    // Supprimer un ticket
    async function deleteTicket(ticketId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) {
            return;
        }

        try {
            await adminRequest('support', {
                method: 'POST',
                body: JSON.stringify({ action: 'delete', id: ticketId })
            });

            await loadTickets();
        } catch (err) {
            console.error('Error deleting ticket:', err);
            alert('Erreur lors de la suppression du ticket.');
        }
    }

    // Initialiser
    async function init() {
        // Filtres
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'white';
                    b.style.color = b.dataset.status === 'pending' ? '#ffc107' : b.dataset.status === 'resolved' ? '#28a745' : 'var(--primary-color)';
                });
                
                this.classList.add('active');
                this.style.background = this.dataset.status === 'pending' ? '#ffc107' : this.dataset.status === 'resolved' ? '#28a745' : 'var(--primary-color)';
                this.style.color = 'white';
                
                currentFilter = this.dataset.status;
                renderTickets();
            });
        });

        // Déconnexion
        document.getElementById('logoutBtn').addEventListener('click', function() {
            window.authSession?.logout?.();
            localStorage.removeItem('ae_user');
            localStorage.removeItem('ae_access_token');
            sessionStorage.removeItem('ae_user');
            sessionStorage.removeItem('ae_access_token');
            window.location.href = 'index.html';
        });

        // Charger les tickets
        await loadTickets();

        // Auto-refresh toutes les 30 secondes
        setInterval(loadTickets, 30000);
    }

    window.addEventListener('auth-session-ready', init, { once: true });
})();
