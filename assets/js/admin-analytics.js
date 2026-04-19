function startOfMonth(date) {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
}

function startOfYear(date) {
    const d = new Date(date);
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    return d;
}

function addMonths(date, delta) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + delta);
    return d;
}

function formatMonthLabel(date) {
    return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}

function setFeedback(el, text, type) {
    if (!el) return;
    el.textContent = text || '';
    el.className = `feedback${type ? ` ${type}` : ''}`;
}

function requireAdmin() {
    const raw = localStorage.getItem('ae_user');
    if (!raw) return { ok: false, error: new Error('NOT_AUTHENTICATED') };
    try {
        const user = JSON.parse(raw);
        if (!user.is_admin) return { ok: false, error: new Error('NOT_AUTHORIZED') };
        return { ok: true, email: user.email };
    } catch (e) {
        return { ok: false, error: new Error('NOT_AUTHENTICATED') };
    }
}

function logout() {
    localStorage.removeItem('ae_user');
    window.location.href = 'connexion.html';
}

function buildMonthBuckets(rangeStart, monthsCount) {
    const months = [];
    for (let i = 0; i < monthsCount; i += 1) {
        const mStart = startOfMonth(addMonths(rangeStart, i));
        const mEnd = startOfMonth(addMonths(mStart, 1));
        months.push({
            start: mStart,
            end: mEnd,
            label: formatMonthLabel(mStart),
            key: `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, '0')}`
        });
    }
    return months;
}

function bucketByMonth(items, getDate, months) {
    const map = new Map(months.map((m) => [m.key, 0]));
    items.forEach((it) => {
        const d = getDate(it);
        if (!d || Number.isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!map.has(key)) return;
        map.set(key, (map.get(key) || 0) + 1);
    });
    return months.map((m) => map.get(m.key) || 0);
}

function bucketSumByMonth(items, getDate, getValue, months) {
    const map = new Map(months.map((m) => [m.key, 0]));
    items.forEach((it) => {
        const d = getDate(it);
        if (!d || Number.isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!map.has(key)) return;
        map.set(key, (map.get(key) || 0) + (getValue(it) || 0));
    });
    return months.map((m) => map.get(m.key) || 0);
}

async function fetchSignups(rangeStart, rangeEnd) {
    // Compter depuis inscription_notifications (inscriptions validées par l'admin uniquement)
    console.log('📊 Récupération des inscriptions...');
    console.log('Plage de dates:', {
        debut: rangeStart.toISOString(),
        fin: rangeEnd.toISOString()
    });
    
    // Vérifier le total d'inscriptions approuvées (sans filtre de date)
    const { data: allApproved } = await window.supabaseClient
        .from('inscription_notifications')
        .select('id, created_at')
        .eq('status', 'approved');
    console.log('📊 TOTAL inscriptions approuvées (toutes dates confondues):', allApproved?.length || 0);
    
    const { data, error } = await window.supabaseClient
        .from('inscription_notifications')
        .select('id, created_at, pack, status')
        .gte('created_at', rangeStart.toISOString())
        .lt('created_at', rangeEnd.toISOString())
        .eq('status', 'approved'); // Uniquement les inscriptions approuvées

    if (error) {
        console.error('❌ Erreur récupération inscriptions:', error);
        throw error;
    }
    
    console.log('✅ Inscriptions approuvées dans la période:', data?.length || 0);
    if (data && data.length > 0) {
        console.log('Première inscription:', data[0]);
        console.log('Dernière inscription:', data[data.length - 1]);
    }
    
    return data || [];
}

async function fetchCodeRousseauPayments(rangeStart, rangeEnd) {
    const { data, error } = await window.supabaseClient
        .from('inscription_notifications')
        .select('id, created_at, amount_paid')
        .eq('pack', 'code')
        .gte('created_at', rangeStart.toISOString())
        .lt('created_at', rangeEnd.toISOString());

    if (error) throw error;
    return (data || []).map(item => ({
        ...item,
        montant: item.amount_paid || 20
    }));
}

async function fetchPayments(rangeStart, rangeEnd) {
    const { data, error } = await window.supabaseClient
        .from('inscription_notifications')
        .select('id, pack, created_at, hours_purchased, amount_paid, payment_method')
        .gte('created_at', rangeStart.toISOString())
        .lt('created_at', rangeEnd.toISOString());

    if (error) throw error;
    
    // Convertir les forfaits en montants euros (prix de la page tarifs)
    const packPrices = {
        'code': 20,
        'am': 350,
        'aac': 1190,
        'boite-auto': 859,
        'supervisee': 1190,
        'zen': 995,
        'accelere': 999,
        '20h': 900,
        'heures-conduite': 0,  // Ancien format sans données précises - exclu du CA
        'heure-conduite-manual': 90,  // Fallback si amount_paid absent
        'heure-conduite-auto': 100,    // Fallback si amount_paid absent
        'second-chance': 569
    };
    
    return (data || []).map(item => {
        // Pour heures-conduite ancien format : exclure si pas de amount_paid
        if (item.pack === 'heures-conduite' && !item.amount_paid) {
            console.warn('⚠️ Pack heures-conduite sans amount_paid exclu du CA:', item);
            return {
                ...item,
                amount_eur: 0,
                payment_method: item.payment_method || 'card'
            };
        }
        
        return {
            ...item,
            // Utiliser amount_paid si disponible, sinon prix par défaut
            amount_eur: item.amount_paid || packPrices[item.pack] || 0,
            payment_method: item.payment_method || 'card' // Par défaut card si non spécifié
        };
    });
}

async function fetchDoneHours(rangeStart, rangeEnd) {
    console.log('Fetching slots from', rangeStart.toISOString(), 'to', rangeEnd.toISOString());
    
    const { data, error } = await window.supabaseClient
        .from('slots')
        .select('start_at, end_at, status, reservations(email)')
        .eq('status', 'booked')
        .gte('start_at', rangeStart.toISOString())
        .lt('start_at', rangeEnd.toISOString());

    if (error) throw error;

    console.log('Slots récupérés:', data?.length || 0, data);

    // "Réalisé" = créneau réservé dont le début est passé
    const now = Date.now();
    const doneSlots = (data || []).filter((row) => {
        const t = new Date(row.start_at).getTime();
        const isPast = !Number.isNaN(t) && t < now;
        console.log('Slot:', row.start_at, 'isPast:', isPast, 'reservations:', row.reservations);
        return isPast;
    }).map(slot => ({
        ...slot,
        user_email: Array.isArray(slot.reservations) && slot.reservations.length > 0 
            ? slot.reservations[0].email 
            : null
    }));

    console.log('Slots réalisés (passés):', doneSlots.length);

    // Récupérer les forfaits des utilisateurs
    const emails = [...new Set(doneSlots.map(s => s.user_email).filter(Boolean))];
    if (emails.length === 0) {
        console.log('Aucun email trouvé dans les slots réalisés');
        return [];
    }

    console.log('Emails à chercher:', emails);

    const { data: inscriptions, error: inscError } = await window.supabaseClient
        .from('inscription_notifications')
        .select('user_email, pack')
        .in('user_email', emails);

    if (inscError) {
        console.warn('Erreur récupération forfaits:', inscError);
        return doneSlots;
    }

    console.log('Inscriptions trouvées:', inscriptions);

    // Créer un map email -> pack
    const emailToPack = {};
    (inscriptions || []).forEach(ins => {
        emailToPack[ins.user_email] = ins.pack;
    });

    // Ajouter le pack à chaque slot
    return doneSlots.map(slot => ({
        ...slot,
        pack: emailToPack[slot.user_email] || 'unknown'
    }));
}

function createOrUpdateChart(existing, canvas, config) {
    if (existing) {
        existing.data = config.data;
        existing.options = config.options;
        existing.update();
        return existing;
    }
    return new Chart(canvas, config);
}

(function init() {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const adminActions = document.getElementById('adminActions');
    const logoutBtn = document.getElementById('logoutBtn');

    const prevRangeBtn = document.getElementById('prevRangeBtn');
    const nextRangeBtn = document.getElementById('nextRangeBtn');
    const rangeLabel = document.getElementById('rangeLabel');

    const analyticsFeedback = document.getElementById('analyticsFeedback');

    const kpiSignups = document.getElementById('kpiSignups');
    const kpiRevenue = document.getElementById('kpiRevenue');
    const kpiHours = document.getElementById('kpiHours');

    const chartSignupsTotalCanvas = document.getElementById('chartSignupsTotal');
    const chartSignupsManualCanvas = document.getElementById('chartSignupsManual');
    const chartSignupsAutoCanvas = document.getElementById('chartSignupsAuto');
    const chartSignupsAmCanvas = document.getElementById('chartSignupsAm');
    const chartRevenueTotalCanvas = document.getElementById('chartRevenueTotal');
    const chartRevenueOnlineCanvas = document.getElementById('chartRevenueOnline');
    const chartRevenueAdminCanvas = document.getElementById('chartRevenueAdmin');
    const chartHoursTotalCanvas = document.getElementById('chartHoursTotal');
    const chartHoursManualCanvas = document.getElementById('chartHoursManual');
    const chartHoursAutoCanvas = document.getElementById('chartHoursAuto');
    const chartHoursAmCanvas = document.getElementById('chartHoursAm');

    let charts = { 
        signupsTotal: null, signupsManual: null, signupsAuto: null, signupsAm: null,
        revenueTotal: null, revenueOnline: null, revenueAdmin: null,
        hoursTotal: null, hoursManual: null, hoursAuto: null, hoursAm: null 
    };

    const monthsCount = 12;
    let state = {
        rangeStart: startOfYear(new Date())
    };

    function getRangeEnd() {
        return startOfMonth(addMonths(state.rangeStart, monthsCount));
    }

    function updateRangeLabel() {
        const year = state.rangeStart.getFullYear();
        rangeLabel.textContent = `${year}`;
    }

    async function refresh() {
        setFeedback(analyticsFeedback, 'Chargement des statistiques...', '');
        try {
            const check = requireAdmin();
            if (!check.ok) {
                window.location.href = 'connexion.html';
                return;
            }

            if (loginSection) loginSection.style.display = 'none';
            dashboardSection.classList.add('visible');
            if (adminActions) adminActions.style.display = '';

            updateRangeLabel();

            const rangeStart = state.rangeStart;
            const rangeEnd = getRangeEnd();
            const months = buildMonthBuckets(rangeStart, monthsCount);
            const labels = months.map((m) => m.label);

            const [signups, payments, doneSlots, codeRousseauPayments] = await Promise.all([
                fetchSignups(rangeStart, rangeEnd),
                fetchPayments(rangeStart, rangeEnd),
                fetchDoneHours(rangeStart, rangeEnd),
                fetchCodeRousseauPayments(rangeStart, rangeEnd)
            ]);

            // Debug inscriptions
            console.log('Inscriptions récupérées:', signups.length);
            console.log('Exemple inscription:', signups[0]);
            console.log('Packs des inscriptions:', signups.map(s => s.pack));
            
            // Filtrer les inscriptions par type de forfait
            const manualSignups = signups.filter(s => ['zen', 'aac', 'supervisee', 'accelere', '20h', 'heures-conduite', 'heure-conduite-manual', 'second-chance'].includes(s.pack));
            const autoSignups = signups.filter(s => s.pack === 'boite-auto' || s.pack === 'heure-conduite-auto');
            const amSignups = signups.filter(s => s.pack === 'am');
            const codeSignups = signups.filter(s => s.pack === 'code');
            
            console.log('Inscriptions filtrées:', {
                manual: manualSignups.length,
                auto: autoSignups.length,
                am: amSignups.length,
                code: codeSignups.length,
                total: signups.length
            });
            
            const signupsManualSeries = bucketByMonth(manualSignups, (it) => new Date(it.created_at), months);
            const signupsAutoSeries = bucketByMonth(autoSignups, (it) => new Date(it.created_at), months);
            const signupsAmSeries = bucketByMonth(amSignups, (it) => new Date(it.created_at), months);
            const signupsCodeSeries = bucketByMonth(codeSignups, (it) => new Date(it.created_at), months);
            
            console.log('Séries inscriptions:', {
                manual: signupsManualSeries,
                auto: signupsAutoSeries,
                am: signupsAmSeries,
                code: signupsCodeSeries
            });
            
            // Total pour le KPI - INCLUT MAINTENANT LE CODE
            const signupsSeries = months.map((m, i) => signupsManualSeries[i] + signupsAutoSeries[i] + signupsAmSeries[i] + signupsCodeSeries[i]);
            
            // Debug paiements
            console.log('Paiements récupérés:', payments.length);
            console.log('Exemple paiement:', payments[0]);
            console.log('Packs des paiements:', payments.map(p => ({ pack: p.pack, amount: p.amount_eur, method: p.payment_method })));
            
            // Séparer les paiements en ligne (card) et admin (cash)
            const onlinePayments = payments.filter(p => p.payment_method === 'card');
            const adminPayments = payments.filter(p => p.payment_method === 'cash');
            
            console.log('Paiements par méthode:', {
                online: onlinePayments.length,
                admin: adminPayments.length,
                total: payments.length
            });
            
            // Filtrer les paiements par type de forfait
            const manualPayments = payments.filter(p => ['zen', 'aac', 'supervisee', 'accelere', '20h', 'heures-conduite', 'heure-conduite-manual', 'second-chance'].includes(p.pack));
            const autoPayments = payments.filter(p => p.pack === 'boite-auto' || p.pack === 'heure-conduite-auto');
            const amPayments = payments.filter(p => p.pack === 'am');
            
            console.log('Paiements filtrés:', {
                manual: manualPayments.length,
                auto: autoPayments.length,
                am: amPayments.length,
                total: payments.length
            });
            
            const revenueManualSeries = bucketSumByMonth(manualPayments, (it) => new Date(it.created_at), (it) => Number(it.amount_eur || 0), months);
            const revenueAutoSeries = bucketSumByMonth(autoPayments, (it) => new Date(it.created_at), (it) => Number(it.amount_eur || 0), months);
            const revenueAmSeries = bucketSumByMonth(amPayments, (it) => new Date(it.created_at), (it) => Number(it.amount_eur || 0), months);
            
            console.log('Séries revenus:', {
                manual: revenueManualSeries,
                auto: revenueAutoSeries,
                am: revenueAmSeries
            });
            
            // Code Rousseau revenue
            const revenueCodeRousseauSeries = bucketSumByMonth(codeRousseauPayments, (it) => new Date(it.created_at), (it) => Number(it.montant || 0), months);
            
            console.log('Séries revenus Code Rousseau:', revenueCodeRousseauSeries);
            
            // CA en ligne (paiements card)
            const revenueOnlineSeries = bucketSumByMonth(onlinePayments, (it) => new Date(it.created_at), (it) => Number(it.amount_eur || 0), months);
            
            // CA admin (paiements cash)
            const revenueAdminSeries = bucketSumByMonth(adminPayments, (it) => new Date(it.created_at), (it) => Number(it.amount_eur || 0), months);
            
            // Total pour le KPI (inclut maintenant Code Rousseau)
            const revenueSeries = months.map((m, i) => revenueManualSeries[i] + revenueAutoSeries[i] + revenueAmSeries[i] + revenueCodeRousseauSeries[i]);
            
            // Fonction pour calculer la durée d'un slot en heures
            const calculateHours = (slot) => {
                const start = new Date(slot.start_at);
                const end = new Date(slot.end_at);
                const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                return Number.isFinite(diff) && diff > 0 ? diff : 0;
            };
            
            // Debug: afficher les slots avec leur pack
            console.log('Done slots avec pack:', doneSlots.map(s => ({ email: s.user_email, pack: s.pack, start: s.start_at })));
            
            // Filtrer les slots par type de forfait
            // Boîte manuelle: permis B, AAC, supervisée, conduite accélérée, 20h
            const manualSlots = doneSlots.filter(s => ['zen', 'aac', 'supervisee', 'accelere', '20h', 'heures-conduite', 'heure-conduite-manual', 'second-chance'].includes(s.pack));
            // Boîte auto
            const autoSlots = doneSlots.filter(s => s.pack === 'boite-auto' || s.pack === 'heure-conduite-auto');
            // Sans permis (AM)
            const amSlots = doneSlots.filter(s => s.pack === 'am');
            
            console.log('Slots filtrés:', {
                manual: manualSlots.length,
                auto: autoSlots.length,
                am: amSlots.length,
                total: doneSlots.length
            });
            
            const hoursManualSeries = bucketSumByMonth(manualSlots, (it) => new Date(it.start_at), calculateHours, months);
            const hoursAutoSeries = bucketSumByMonth(autoSlots, (it) => new Date(it.start_at), calculateHours, months);
            const hoursAmSeries = bucketSumByMonth(amSlots, (it) => new Date(it.start_at), calculateHours, months);
            
            console.log('Séries heures:', {
                manual: hoursManualSeries,
                auto: hoursAutoSeries,
                am: hoursAmSeries
            });
            
            // Total pour le KPI
            const hoursSeries = months.map((m, i) => hoursManualSeries[i] + hoursAutoSeries[i] + hoursAmSeries[i]);

            // Calculer le total annuel au lieu du dernier mois
            const signupsTotal = signupsSeries.reduce((sum, val) => sum + val, 0);
            const revenueTotal = revenueSeries.reduce((sum, val) => sum + val, 0);
            const hoursTotal = hoursSeries.reduce((sum, val) => sum + val, 0);

            if (kpiSignups) kpiSignups.textContent = String(signupsTotal);
            if (kpiRevenue) kpiRevenue.textContent = `${Math.round(revenueTotal)}€`;
            if (kpiHours) kpiHours.textContent = `${Math.round(hoursTotal)}h`;

            const signupsChartOptions = {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            };

            charts.signupsTotal = createOrUpdateChart(charts.signupsTotal, chartSignupsTotalCanvas, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Inscriptions (total)',
                        data: signupsSeries,
                        backgroundColor: 'rgba(233, 30, 99, 0.35)',
                        borderColor: 'rgba(233, 30, 99, 0.8)',
                        borderWidth: 1,
                        borderRadius: 10
                    }]
                },
                options: signupsChartOptions
            });

            charts.signupsManual = createOrUpdateChart(charts.signupsManual, chartSignupsManualCanvas, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Inscriptions - Boîte manuelle',
                        data: signupsManualSeries,
                        backgroundColor: 'rgba(34, 197, 94, 0.28)',
                        borderColor: 'rgba(34, 197, 94, 0.75)',
                        borderWidth: 1,
                        borderRadius: 10
                    }]
                },
                options: signupsChartOptions
            });

            charts.signupsAuto = createOrUpdateChart(charts.signupsAuto, chartSignupsAutoCanvas, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Inscriptions - Boîte auto',
                        data: signupsAutoSeries,
                        backgroundColor: 'rgba(251, 146, 60, 0.28)',
                        borderColor: 'rgba(251, 146, 60, 0.75)',
                        borderWidth: 1,
                        borderRadius: 10
                    }]
                },
                options: signupsChartOptions
            });

            charts.signupsAm = createOrUpdateChart(charts.signupsAm, chartSignupsAmCanvas, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Inscriptions - Sans permis (AM)',
                        data: signupsAmSeries,
                        backgroundColor: 'rgba(168, 85, 247, 0.28)',
                        borderColor: 'rgba(168, 85, 247, 0.75)',
                        borderWidth: 1,
                        borderRadius: 10
                    }]
                },
                options: signupsChartOptions
            });

            const revenueChartOptions = {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { 
                    y: { 
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + '€';
                            }
                        }
                    }
                }
            };

            charts.revenueTotal = createOrUpdateChart(charts.revenueTotal, chartRevenueTotalCanvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'CA Total (€)',
                        data: revenueSeries,
                        tension: 0.35,
                        borderColor: 'rgba(59, 130, 246, 0.85)',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        fill: true,
                        pointRadius: 4
                    }]
                },
                options: revenueChartOptions
            });

            charts.revenueOnline = createOrUpdateChart(charts.revenueOnline, chartRevenueOnlineCanvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'CA en ligne - Stripe (€)',
                        data: revenueOnlineSeries,
                        tension: 0.35,
                        borderColor: 'rgba(76, 175, 80, 0.85)',
                        backgroundColor: 'rgba(76, 175, 80, 0.15)',
                        fill: true,
                        pointRadius: 4
                    }]
                },
                options: revenueChartOptions
            });

            charts.revenueAdmin = createOrUpdateChart(charts.revenueAdmin, chartRevenueAdminCanvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'CA admin - Cash (€)',
                        data: revenueAdminSeries,
                        tension: 0.35,
                        borderColor: 'rgba(255, 152, 0, 0.85)',
                        backgroundColor: 'rgba(255, 152, 0, 0.15)',
                        fill: true,
                        pointRadius: 4
                    }]
                },
                options: revenueChartOptions
            });

            charts.hoursTotal = createOrUpdateChart(charts.hoursTotal, chartHoursTotalCanvas, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Heures réalisées (total)',
                        data: hoursSeries,
                        backgroundColor: 'rgba(34, 197, 94, 0.28)',
                        borderColor: 'rgba(34, 197, 94, 0.75)',
                        borderWidth: 1,
                        borderRadius: 10
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });

            charts.hoursManual = createOrUpdateChart(charts.hoursManual, chartHoursManualCanvas, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Heures - Boîte manuelle',
                        data: hoursManualSeries,
                        backgroundColor: 'rgba(34, 197, 94, 0.28)',
                        borderColor: 'rgba(34, 197, 94, 0.75)',
                        borderWidth: 1,
                        borderRadius: 10
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });

            charts.hoursAuto = createOrUpdateChart(charts.hoursAuto, chartHoursAutoCanvas, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Heures - Boîte auto',
                        data: hoursAutoSeries,
                        backgroundColor: 'rgba(251, 146, 60, 0.28)',
                        borderColor: 'rgba(251, 146, 60, 0.75)',
                        borderWidth: 1,
                        borderRadius: 10
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });

            charts.hoursAm = createOrUpdateChart(charts.hoursAm, chartHoursAmCanvas, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Heures - Sans permis (AM)',
                        data: hoursAmSeries,
                        backgroundColor: 'rgba(168, 85, 247, 0.28)',
                        borderColor: 'rgba(168, 85, 247, 0.75)',
                        borderWidth: 1,
                        borderRadius: 10
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });

            setFeedback(analyticsFeedback, '', '');
        } catch (err) {
            console.error(err);
            setFeedback(analyticsFeedback, 'Impossible de charger les analytics. Vérifie les tables/policies Supabase.', 'error');
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
        });
    }

    if (prevRangeBtn) {
        prevRangeBtn.addEventListener('click', async () => {
            const d = new Date(state.rangeStart);
            d.setFullYear(d.getFullYear() - 1);
            state.rangeStart = startOfYear(d);
            await refresh();
        });
    }

    if (nextRangeBtn) {
        nextRangeBtn.addEventListener('click', async () => {
            const d = new Date(state.rangeStart);
            d.setFullYear(d.getFullYear() + 1);
            state.rangeStart = startOfYear(d);
            await refresh();
        });
    }

    refresh();
})();
