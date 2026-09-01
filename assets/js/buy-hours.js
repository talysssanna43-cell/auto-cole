const PRICE_PER_COURSE = Object.freeze({ manual: 50, auto: 60, automatic: 60 });

function getStudentSession() {
    const user = window.dashboardState?.user || window.authSession?.getCachedUser();
    const token = window.authSession?.getToken();
    return { user, token };
}

window.buyAdditionalHours = async function buyAdditionalHours(quantity, totalAmount, gearboxType = 'manual') {
    const courses = Number(quantity);
    const transmission = ['auto', 'automatic'].includes(gearboxType) ? 'auto' : 'manual';
    const { user, token } = getStudentSession();

    if (!user?.email || !token) {
        alert('Ta session a expiré. Reconnecte-toi avant de payer.');
        window.location.href = 'connexion.html?redirect=espace-eleve.html';
        return;
    }

    if (!Number.isInteger(courses) || courses < 1 || courses > 40) {
        alert('Choisis un nombre de cours compris entre 1 et 40.');
        return;
    }

    try {
        sessionStorage.setItem('pendingHoursPurchase', JSON.stringify({
            quantity: courses,
            gearboxType: transmission,
            totalAmount: totalAmount || courses * PRICE_PER_COURSE[transmission]
        }));

        const response = await fetch('/.netlify/functions/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                quantity: courses,
                gearboxType: transmission,
                customerEmail: user.email
            })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.url) {
            throw new Error(result.message || 'Impossible de créer la session de paiement.');
        }

        if (typeof window.closeBuyHoursModal === 'function') window.closeBuyHoursModal();
        window.location.assign(result.url);
    } catch (error) {
        console.error('Achat de cours:', error);
        alert(`${error.message}\n\nTu peux contacter l'auto-école au 04 91 53 36 98.`);
    }
};

async function confirmCheckoutReturn(checkoutSessionId) {
    const { token } = getStudentSession();
    if (!token) throw new Error('Ta session a expiré. Reconnecte-toi pour vérifier le paiement.');

    const response = await fetch('/.netlify/functions/confirm-payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ checkoutSessionId })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
        throw new Error('La confirmation du paiement est encore en cours. Recharge la page dans quelques instants.');
    }
    return result.result || {};
}

window.addEventListener('DOMContentLoaded', async () => {
    const url = new URL(window.location.href);
    const paymentSuccess = url.searchParams.get('payment_success');
    if (paymentSuccess === 'false') {
        alert('Le paiement a été annulé. Aucun cours n’a été ajouté.');
        url.searchParams.delete('payment_success');
        window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
        return;
    }
    if (paymentSuccess !== 'true') return;

    const checkoutSessionId = url.searchParams.get('session_id');
    if (!checkoutSessionId) {
        alert("Référence de paiement manquante. Contacte l'auto-école si ton compte a été débité.");
        return;
    }

    try {
        const confirmation = await confirmCheckoutReturn(checkoutSessionId);
        const pending = JSON.parse(sessionStorage.getItem('pendingHoursPurchase') || '{}');
        sessionStorage.removeItem('pendingHoursPurchase');
        const coursesAvailable = Number(confirmation.hours_available);
        const added = Number(pending.quantity);
        alert(`Paiement confirmé.${Number.isFinite(added) ? ` ${added} cours ont été ajoutés.` : ''}${Number.isFinite(coursesAvailable) ? `\n\nTotal disponible : ${coursesAvailable} cours` : ''}`);

        if (typeof window.loadUserData === 'function') await window.loadUserData();
        if (typeof window.renderStats === 'function') window.renderStats();
        url.searchParams.delete('payment_success');
        url.searchParams.delete('session_id');
        window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
    } catch (error) {
        console.error('Confirmation du paiement:', error);
        alert(error.message);
    }
});
