// Admin menu burger toggle
const adminMenuToggle = document.getElementById('adminMenuToggle');
const adminTabs = document.getElementById('adminTabs');

if (adminMenuToggle && adminTabs) {
    adminMenuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        adminTabs.classList.toggle('active');
        adminMenuToggle.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.topbar-inner') && !e.target.closest('.admin-topbar') && adminTabs.classList.contains('active')) {
            adminTabs.classList.remove('active');
            adminMenuToggle.classList.remove('active');
        }
    });
    
    // Close menu when clicking on a link
    const adminLinks = adminTabs.querySelectorAll('a');
    adminLinks.forEach(link => {
        link.addEventListener('click', () => {
            adminTabs.classList.remove('active');
            adminMenuToggle.classList.remove('active');
        });
    });
}

const adminLogoutBtn = document.getElementById('logoutBtn');
if (adminLogoutBtn && !adminLogoutBtn.dataset.logoutBound) {
    adminLogoutBtn.dataset.logoutBound = 'true';
    adminLogoutBtn.addEventListener('click', async () => {
        try {
            await window.authSession?.logout?.();
        } catch (error) {
            console.warn('Admin logout session cleanup failed:', error);
        }
        localStorage.removeItem('ae_user');
        localStorage.removeItem('ae_access_token');
        sessionStorage.removeItem('ae_user');
        sessionStorage.removeItem('ae_access_token');
        window.location.href = 'index.html';
    });
}
