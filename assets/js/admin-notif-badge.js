// Script pour afficher les badges de notifications admin
(async function() {
    'use strict';
    
    async function updateCodeRousseuBadge() {
        try {
            const { data, error } = await window.supabaseClient
                .from('code_rousseau_paiements')
                .select('id', { count: 'exact', head: false })
                .eq('vu', false);
            
            if (!error && data) {
                const count = data.length;
                const badge = document.getElementById('codeRousseuBadge');
                if (badge && count > 0) {
                    badge.textContent = count;
                    badge.style.display = 'inline-flex';
                } else if (badge && count === 0) {
                    badge.style.display = 'none';
                }
            }
        } catch (err) {
            console.error('Erreur chargement notifications Code Rousseau:', err);
        }
    }
    
    async function updateSupportBadge() {
        try {
            const { data, error } = await window.supabaseClient
                .from('support_tickets')
                .select('id', { count: 'exact', head: false })
                .eq('status', 'pending');
            
            if (!error && data) {
                const count = data.length;
                const badge = document.getElementById('supportBadge');
                if (badge && count > 0) {
                    badge.textContent = count;
                    badge.style.display = 'inline-flex';
                } else if (badge && count === 0) {
                    badge.style.display = 'none';
                }
            }
        } catch (err) {
            console.error('Erreur chargement notifications Support:', err);
        }
    }
    
    async function updateCandidaturesBadge() {
        try {
            const { data, error } = await window.supabaseClient
                .from('candidatures')
                .select('id', { count: 'exact', head: false });
            
            if (!error && data) {
                const count = data.length;
                const badge = document.getElementById('candidaturesBadge');
                if (badge && count > 0) {
                    badge.textContent = count;
                    badge.style.display = 'inline-flex';
                } else if (badge && count === 0) {
                    badge.style.display = 'none';
                }
            }
        } catch (err) {
            console.error('Erreur chargement notifications Candidatures:', err);
        }
    }
    
    async function updateContactBadge() {
        try {
            const { data, error } = await window.supabaseClient
                .from('contact_requests')
                .select('id', { count: 'exact', head: false })
                .eq('status', 'nouveau');
            
            if (!error && data) {
                const count = data.length;
                const badge = document.getElementById('contactBadge');
                if (badge && count > 0) {
                    badge.textContent = count;
                    badge.style.display = 'inline-flex';
                } else if (badge && count === 0) {
                    badge.style.display = 'none';
                }
            }
        } catch (err) {
            console.error('Erreur chargement notifications Contact:', err);
        }
    }
    
    async function updateAllBadges() {
        await updateCodeRousseuBadge();
        await updateSupportBadge();
        await updateCandidaturesBadge();
        await updateContactBadge();
    }
    
    // Attendre que Supabase soit disponible
    function waitForSupabase() {
        if (!window.supabaseClient) {
            setTimeout(waitForSupabase, 100);
            return;
        }
        updateAllBadges();
        // Mettre à jour toutes les 30 secondes
        setInterval(updateAllBadges, 30000);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForSupabase);
    } else {
        waitForSupabase();
    }
})();
