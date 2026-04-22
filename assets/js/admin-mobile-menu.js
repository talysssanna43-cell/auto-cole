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
