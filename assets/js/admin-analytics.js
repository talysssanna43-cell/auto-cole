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

const analyticsDataCache = new Map();

async function fetchAnalyticsData(rangeStart, rangeEnd) {
    const token = window.authSession?.getToken();
    if (!token) throw new Error('AUTH_REQUIRED');

    const start = rangeStart.toISOString();
    const end = rangeEnd.toISOString();
    const key = `${start}|${end}`;
    if (analyticsDataCache.has(key)) return analyticsDataCache.get(key);

    const request = fetch(`/.netlify/functions/admin-analytics-data?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
    }).then(async (response) => {
        const payload = await response.json().catch(() => ({ ok: false, error: 'INVALID_SERVER_RESPONSE' }));
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'ANALYTICS_LOAD_FAILED');
        return payload;
    });

    analyticsDataCache.set(key, request);
    return request;
}

async function fetchProfitabilityData(rangeStart, rangeEnd, hourlyRate) {
    const token = window.authSession?.getToken();
    if (!token) throw new Error('AUTH_REQUIRED');

    const start = rangeStart.toISOString();
    const end = rangeEnd.toISOString();
    const rate = Number(hourlyRate || 45);
    const request = await fetch(`/.netlify/functions/admin-profitability-data?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&hourlyRate=${encodeURIComponent(rate)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
    });
    const payload = await request.json().catch(() => ({ ok: false, error: 'INVALID_SERVER_RESPONSE' }));
    if (!request.ok || !payload.ok) throw new Error(payload.error || 'PROFITABILITY_LOAD_FAILED');
    return payload;
}

async function saveProfitabilitySettings(data) {
    const token = window.authSession?.getToken();
    if (!token) throw new Error('AUTH_REQUIRED');
    const request = await fetch('/.netlify/functions/admin-profitability-settings', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    const payload = await request.json().catch(() => ({ ok: false, error: 'INVALID_SERVER_RESPONSE' }));
    if (!request.ok || !payload.ok) throw new Error(payload.error || 'PROFITABILITY_SETTINGS_FAILED');
    return payload.setting;
}

function requireAdmin() {
    const raw = localStorage.getItem('ae_user') || sessionStorage.getItem('ae_user');
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
    localStorage.removeItem('ae_access_token');
    sessionStorage.removeItem('ae_user');
    sessionStorage.removeItem('ae_access_token');
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
    const payload = await fetchAnalyticsData(rangeStart, rangeEnd);
    return payload.signups || [];
}

async function fetchCodeRousseauPayments(rangeStart, rangeEnd) {
    const payload = await fetchAnalyticsData(rangeStart, rangeEnd);
    return payload.codeRousseauPayments || [];
}

async function fetchPayments(rangeStart, rangeEnd) {
    const payload = await fetchAnalyticsData(rangeStart, rangeEnd);
    return payload.payments || [];
}

async function fetchDoneHours(rangeStart, rangeEnd) {
    const payload = await fetchAnalyticsData(rangeStart, rangeEnd);
    return payload.doneSlots || [];
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

function formatEuro(value) {
    return `${Math.round(Number(value || 0)).toLocaleString('fr-FR')}\u20ac`;
}

function lineDataset(label, data, color, fill = false) {
    return {
        label,
        data,
        tension: 0.35,
        borderColor: color,
        backgroundColor: color.replace('0.9', '0.12'),
        fill,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 3
    };
}

function lineOptions({ euro = false } = {}) {
    return {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: { usePointStyle: true, boxWidth: 8, padding: 16 }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback(value) {
                        return euro ? `${value}\u20ac` : value;
                    }
                }
            }
        }
    };
}

function profitabilityLevel(row) {
    const activityRate = Number(row?.activityRate || 0);
    const profit = Number(row?.profitability || 0);
    const fixedCharges = Number(row?.fixedCharges || 0);
    const base = fixedCharges > 0 ? fixedCharges : 1;
    let score;
    if (!row) return { color: 'gray', label: 'Pas encore mesure', score: 0 };
    if (profit < 0) {
        score = Math.max(8, 35 + (profit / base) * 25);
    } else if (profit < base * 0.25) {
        score = 36 + (profit / (base * 0.25)) * 29;
    } else {
        score = 66 + Math.min(34, (profit / base) * 34);
    }
    if (activityRate < 50) score = Math.min(score, 34);
    score = Math.max(0, Math.min(100, Math.round(score)));
    if (profit < 0 || activityRate < 50) return { color: 'red', label: 'A surveiller', score };
    if (profit < fixedCharges * 0.25) return { color: 'orange', label: 'A optimiser', score };
    return { color: 'green', label: 'Bonne rentabilite', score };
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function buildProfitabilityScale(items) {
    const values = (items || [])
        .map((item) => Number(item?.profitability || 0))
        .filter((value) => Number.isFinite(value));
    const minValue = Math.min(0, ...values);
    const maxValue = Math.max(0, ...values);
    const span = Math.max(1000, maxValue - minValue);
    const padding = Math.max(250, span * 0.12);
    const min = Math.floor((minValue - padding) / 100) * 100;
    const max = Math.ceil((maxValue + padding) / 100) * 100;
    return { min, max: max <= min ? min + 1000 : max };
}

function gaugeColorFromRatio(ratio) {
    if (ratio < 1 / 3) return 'red';
    if (ratio < 2 / 3) return 'orange';
    return 'green';
}

function gaugePosition(value, scale) {
    const min = Number(scale?.min ?? -1000);
    const max = Number(scale?.max ?? 1000);
    const clamped = clamp(Number(value || 0), min, max);
    const ratio = (clamped - min) / Math.max(1, max - min);
    return {
        ratio,
        color: gaugeColorFromRatio(ratio),
        rotation: -90 + (ratio * 180)
    };
}

function renderGauge(value, scale, label) {
    const gauge = gaugePosition(value, scale);
    return `
        <div class="profitability-gauge" aria-label="${label} ${Math.round(gauge.ratio * 100)}%">
            <div class="profitability-gauge-arc"></div>
            <span class="profitability-needle ${gauge.color}" style="transform: translateX(-50%) rotate(${gauge.rotation.toFixed(2)}deg);"></span>
            <span class="profitability-hub"></span>
            <span class="profitability-gauge-labels">
                <span>${formatEuro(scale.min)}</span>
                <span>${formatEuro(scale.max)}</span>
            </span>
        </div>
    `;
}

function startOfSelectedMonth(value) {
    const now = new Date();
    const match = String(value || '').match(/^(\d{4})-(\d{2})$/);
    if (!match) return new Date(now.getFullYear(), now.getMonth(), 1);
    return new Date(Number(match[1]), Number(match[2]) - 1, 1);
}

function selectedMonthRange() {
    const input = document.getElementById('profitabilityMonth');
    const start = startOfSelectedMonth(input?.value);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return { start, end };
}

function setDefaultProfitabilityMonth() {
    const input = document.getElementById('profitabilityMonth');
    if (!input || input.value) return;
    const now = new Date();
    input.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function todayInputValue() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function ensureProfitabilityModal() {
    let modal = document.getElementById('profitabilitySettingsModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'profitabilitySettingsModal';
    modal.className = 'profitability-modal-backdrop';
    modal.innerHTML = `
        <div class="profitability-modal" role="dialog" aria-modal="true" aria-labelledby="profitabilityModalTitle">
            <div class="profitability-modal-header">
                <div>
                    <h3 id="profitabilityModalTitle">Donnees moniteur</h3>
                    <p>Ces valeurs seront appliquees a partir de la date choisie.</p>
                </div>
                <button type="button" class="profitability-modal-close" aria-label="Fermer" onclick="closeProfitabilitySettings()">x</button>
            </div>
            <form id="profitabilitySettingsForm">
                <input type="hidden" id="profitabilityInstructorName">
                <div class="profitability-form-grid">
                    <label>Date d'effet
                        <input type="date" id="profitabilityEffectiveDate" required>
                    </label>
                    <label>Heures max / jour
                        <input type="number" id="profitabilityHoursPerDay" min="0" step="0.25" required>
                    </label>
                    <label>Salaire + charges / mois
                        <input type="number" id="profitabilitySalaryCharges" min="0" step="1" required>
                    </label>
                    <label>Autres charges fixes / mois
                        <input type="number" id="profitabilityExtraCharges" min="0" step="1">
                    </label>
                </div>
                <div class="profitability-modal-actions">
                    <button type="button" class="secondary" onclick="closeProfitabilitySettings()">Annuler</button>
                    <button type="submit" class="primary">Enregistrer</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#profitabilitySettingsForm').addEventListener('submit', submitProfitabilitySettings);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeProfitabilitySettings();
    });
    return modal;
}

function openProfitabilitySettings(encodedName) {
    const instructor = decodeURIComponent(encodedName);
    const row = (window.currentProfitabilityRows || []).find((item) => item.instructor === instructor);
    const modal = ensureProfitabilityModal();
    modal.querySelector('#profitabilityModalTitle').textContent = `Donnees - ${instructor}`;
    modal.querySelector('#profitabilityInstructorName').value = instructor;
    modal.querySelector('#profitabilityEffectiveDate').value = todayInputValue();
    modal.querySelector('#profitabilityHoursPerDay').value = row?.hoursPerDay || 10;
    modal.querySelector('#profitabilitySalaryCharges').value = row?.salaryAndSocialCharges || 2200;
    modal.querySelector('#profitabilityExtraCharges').value = row?.extraFixedCharges || 0;
    modal.classList.add('open');
}

function closeProfitabilitySettings() {
    document.getElementById('profitabilitySettingsModal')?.classList.remove('open');
}

async function submitProfitabilitySettings(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('.primary');
    button.disabled = true;
    button.textContent = 'Enregistrement...';
    try {
        const saved = await saveProfitabilitySettings({
            instructor_name: form.querySelector('#profitabilityInstructorName').value,
            effective_date: form.querySelector('#profitabilityEffectiveDate').value,
            hours_per_day: Number(form.querySelector('#profitabilityHoursPerDay').value),
            salary_and_social_charges: Number(form.querySelector('#profitabilitySalaryCharges').value),
            vehicle_insurance: 0,
            extra_fixed_charges: Number(form.querySelector('#profitabilityExtraCharges').value || 0)
        });
        closeProfitabilitySettings();
        if (saved?.partial) {
            alert("Le salaire du moniteur a ete mis a jour. Pour garder l'historique par date, installe aussi la migration SQL de rentabilite.");
        }
        await window.refreshAnalytics?.();
    } catch (error) {
        console.error(error);
        if (error.message === 'PROFITABILITY_SETTINGS_TABLE_MISSING') {
            alert("La table des donnees de rentabilite doit etre installee dans Supabase. Execute le fichier sql/instructor-profitability-settings.sql.");
        } else if (error.message === 'INSTRUCTOR_SALARY_COLUMN_MISSING') {
            alert("La colonne salaire des moniteurs manque dans Supabase. Execute la migration sql/profitability-storage.sql.");
        } else {
            alert("Impossible d'enregistrer ces donnees pour le moment.");
        }
    } finally {
        button.disabled = false;
        button.textContent = 'Enregistrer';
    }
}

window.openProfitabilitySettings = openProfitabilitySettings;
window.closeProfitabilitySettings = closeProfitabilitySettings;

function renderProfitability(payload) {
    const container = document.getElementById('profitabilityList');
    const vehicleContainer = document.getElementById('vehicleProfitabilityList');
    const totalContainer = document.getElementById('profitabilityTotal');
    const instructorScaleContainer = document.getElementById('instructorProfitabilityScale');
    const vehicleScaleContainer = document.getElementById('vehicleProfitabilityScale');
    const note = document.getElementById('profitabilityNote');
    if (!container) return;

    const rows = (payload.rows || [])
        .sort((a, b) => b.profitability - a.profitability);
    const vehicles = (payload.vehicles || []).sort((a, b) => b.profitability - a.profitability);
    const instructorScale = buildProfitabilityScale(rows);
    const vehicleScale = buildProfitabilityScale(vehicles);
    window.currentProfitabilityRows = rows;

    if (instructorScaleContainer) {
        instructorScaleContainer.textContent = `Echelle ${formatEuro(instructorScale.min)} -> ${formatEuro(instructorScale.max)}`;
    }
    if (vehicleScaleContainer) {
        vehicleScaleContainer.textContent = `Echelle ${formatEuro(vehicleScale.min)} -> ${formatEuro(vehicleScale.max)}`;
    }

    if (!rows.length) {
        container.innerHTML = '<div class="profitability-empty">Aucun moniteur actif trouve sur cette periode.</div>';
    } else {
        container.innerHTML = rows.map((row) => {
            const level = profitabilityLevel(row);
            const gauge = gaugePosition(row.profitability, instructorScale);
            const displayColor = gauge.color;
            const expenseCount = Array.isArray(row.expenseRows) ? row.expenseRows.length : 0;
            return `
                <article class="profitability-card">
                    <div class="profitability-card-top">
                        <div>
                            <div class="profitability-name">${row.instructor}</div>
    <div class="profitability-meta">${row.slots} creneau${row.slots > 1 ? 'x' : ''} passe${row.slots > 1 ? 's' : ''} - ${row.activityRate}% de la capacite mensuelle - salaire + charges ${formatEuro(row.salaryAndSocialCharges || 0)} - ${expenseCount} frais saisi${expenseCount > 1 ? 's' : ''}</div>
                        </div>
                        <div class="profitability-actions">
                            <button type="button" class="profitability-data-btn" onclick="openProfitabilitySettings('${encodeURIComponent(row.instructor)}')">
                                <i class="fas fa-sliders-h"></i> Donnees
                            </button>
                            <span class="profitability-status ${level.color}">
                                <i class="fas fa-circle"></i> ${level.label}
                            </span>
                        </div>
                    </div>
                    <div class="profitability-gauge-row">
                        ${renderGauge(row.profitability, instructorScale, `Rentabilite ${row.instructor}`)}
                        <div class="profitability-result">
                            <span>Rentabilite</span>
                            <strong class="${displayColor}">${formatEuro(row.profitability)}</strong>
                        </div>
                    </div>
                    <div class="profitability-values">
                        <span><strong>${row.hours}h / ${row.capacityHours}h</strong>Heures</span>
                        <span><strong>${formatEuro(row.revenue)}</strong>CA estime</span>
                        <span><strong>${formatEuro(row.fixedCharges)}</strong>Charges fixes</span>
                        <span><strong>${formatEuro(row.expenses)}</strong>Frais saisis</span>
                        <span><strong>${formatEuro(row.bonusCharges)}</strong>Bonus</span>
                        <span><strong>${formatEuro(row.totalCharges)}</strong>Charges totales</span>
                    </div>
                </article>
            `;
        }).join('');
    }

    if (vehicleContainer) {
        vehicleContainer.innerHTML = vehicles.length ? vehicles.map((vehicle) => {
            const level = profitabilityLevel(vehicle);
            const gauge = gaugePosition(vehicle.profitability, vehicleScale);
            const displayColor = gauge.color;
            const breakEvenStatus = vehicle.hours >= vehicle.breakEvenHours ? 'green' : 'red';
            return `
                <article class="profitability-card vehicle-profitability-card">
                    <div class="profitability-card-top">
                        <div>
                            <div class="profitability-name">${vehicle.name} <span class="vehicle-tag ${vehicle.transmission}">${vehicle.label}</span></div>
                            <div class="profitability-meta">${vehicle.slots} creneau${vehicle.slots > 1 ? 'x' : ''} passe${vehicle.slots > 1 ? 's' : ''} - ${vehicle.activityRate}% de la capacite vehicule - ${formatEuro(vehicle.hourlyRate)}/h</div>
                        </div>
                        <span class="profitability-status ${level.color}">
                            <i class="fas fa-circle"></i> ${level.label}
                        </span>
                    </div>
                    <div class="profitability-gauge-row">
                        ${renderGauge(vehicle.profitability, vehicleScale, `Rentabilite vehicule ${vehicle.name}`)}
                        <div class="profitability-result">
                            <span>Rentabilite vehicule</span>
                            <strong class="${displayColor}">${formatEuro(vehicle.profitability)}</strong>
                        </div>
                    </div>
                    <div class="profitability-values vehicle-values">
                        <span><strong>${vehicle.hours}h / ${vehicle.capacityHours}h</strong>Production</span>
                        <span><strong>${formatEuro(vehicle.revenue)}</strong>Produit</span>
                        <span><strong>${formatEuro(vehicle.insurance)}</strong>Assurance</span>
                        <span><strong>${formatEuro(vehicle.expenses)}</strong>Essence + reparations</span>
                        <span><strong class="${breakEvenStatus}">${vehicle.breakEvenHours}h</strong>Seuil de rentabilite</span>
                        <span><strong>${formatEuro(vehicle.totalCharges)}</strong>Frais totaux</span>
                    </div>
                </article>
            `;
        }).join('') : '<div class="profitability-empty">Aucun vehicule trouve sur cette periode.</div>';
    }

    if (totalContainer) {
        const totals = payload.totals || {};
        const instructorTotal = totals.instructors || {};
        const vehicleTotal = totals.vehicles || {};
        const globalProfit = Number(totals.profitability || 0);
        totalContainer.innerHTML = `
            <div class="profitability-total-card">
                <span>Renta moniteurs</span>
                <strong class="${Number(instructorTotal.profitability || 0) >= 0 ? 'green' : 'red'}">${formatEuro(instructorTotal.profitability)}</strong>
            </div>
            <div class="profitability-total-card">
                <span>Renta vehicules</span>
                <strong class="${Number(vehicleTotal.profitability || 0) >= 0 ? 'green' : 'red'}">${formatEuro(vehicleTotal.profitability)}</strong>
            </div>
            <div class="profitability-total-card total">
                <span>Rentabilite totale</span>
                <strong class="${globalProfit >= 0 ? 'green' : 'red'}">${formatEuro(globalProfit)}</strong>
            </div>
        `;
    }

    if (note) note.textContent = '';
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
    const profitabilityMonth = document.getElementById('profitabilityMonth');
    const profitabilityHourlyRate = document.getElementById('profitabilityHourlyRate');

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
            const profitMonth = selectedMonthRange();
            fetchProfitabilityData(profitMonth.start, profitMonth.end, profitabilityHourlyRate?.value || 45)
                .then(renderProfitability)
                .catch((error) => {
                    console.error(error);
                    const container = document.getElementById('profitabilityList');
                    if (container) container.innerHTML = '<div class="profitability-empty">Impossible de charger la rentabilite des moniteurs.</div>';
                });

            // Debug inscriptions
            console.log('Inscriptions recuperees:', signups.length);
            console.log('Exemple inscription:', signups[0]);
            console.log('Packs des inscriptions:', signups.map(s => s.pack));
            
            // Filtrer les inscriptions par type de forfait
            const manualPackIds = ['chill', 'zen', 'tarif-chill-5', 'tarif-chill-10', 'tarif-chill-20', 'tarif-chill-25', 'tarif-chill-30', 'tarif-zen-5', 'tarif-zen-10', 'tarif-zen-20', 'tarif-zen-25', 'tarif-zen-30', 'tarif-premium-5', 'tarif-premium-10', 'tarif-premium-20', 'tarif-premium-25', 'tarif-premium-30', 'tarif-accelere-5', 'tarif-accelere-10', 'tarif-accelere-20', 'tarif-accelere-25', 'tarif-accelere-30', 'aac', 'supervisee', 'accelere', '20h', 'heures-conduite', 'heure-conduite-manual', 'second-chance'];
            const autoPackIds = ['chill-auto', 'zen-auto', 'tarif-chill-auto-5', 'tarif-chill-auto-13', 'tarif-zen-auto-5', 'tarif-zen-auto-13', 'boite-auto', 'heure-conduite-auto'];
            const manualSignups = signups.filter(s => manualPackIds.includes(s.pack));
            const autoSignups = signups.filter(s => autoPackIds.includes(s.pack));
            const amSignups = signups.filter(s => s.pack === 'am');
            const codeSignups = signups.filter(s => s.pack === 'code');
            
            console.log('Inscriptions filtrees:', {
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
            
            console.log('Series inscriptions:', {
                manual: signupsManualSeries,
                auto: signupsAutoSeries,
                am: signupsAmSeries,
                code: signupsCodeSeries
            });
            
            // Total reel : inclut aussi les anciens libelles de packs et les dossiers admin/cash.
            const signupsSeries = bucketByMonth(signups, (it) => new Date(it.created_at), months);
            
            // Debug paiements
            console.log('Paiements recuperes:', payments.length);
            console.log('Exemple paiement:', payments[0]);
            console.log('Packs des paiements:', payments.map(p => ({ pack: p.pack, amount: p.amount_eur, method: p.payment_method })));
            
            // Separer les paiements en ligne (card) et admin (cash)
            const onlinePayments = payments.filter(p => p.payment_method === 'card');
            const adminPayments = payments.filter(p => p.payment_method === 'cash');
            
            console.log('Paiements par methode:', {
                online: onlinePayments.length,
                admin: adminPayments.length,
                total: payments.length
            });
            
            // Filtrer les paiements par type de forfait
            const manualPayments = payments.filter(p => manualPackIds.includes(p.pack));
            const autoPayments = payments.filter(p => autoPackIds.includes(p.pack));
            const amPayments = payments.filter(p => p.pack === 'am');
            
            console.log('Paiements filtres:', {
                manual: manualPayments.length,
                auto: autoPayments.length,
                am: amPayments.length,
                total: payments.length
            });
            
            const revenueManualSeries = bucketSumByMonth(manualPayments, (it) => new Date(it.created_at), (it) => Number(it.amount_eur || 0), months);
            const revenueAutoSeries = bucketSumByMonth(autoPayments, (it) => new Date(it.created_at), (it) => Number(it.amount_eur || 0), months);
            const revenueAmSeries = bucketSumByMonth(amPayments, (it) => new Date(it.created_at), (it) => Number(it.amount_eur || 0), months);
            
            console.log('Series revenus:', {
                manual: revenueManualSeries,
                auto: revenueAutoSeries,
                am: revenueAmSeries
            });
            
            // Code Rousseau revenue
            const revenueCodeRousseauSeries = bucketSumByMonth(codeRousseauPayments, (it) => new Date(it.created_at), (it) => Number(it.montant || 0), months);
            
            console.log('Series revenus Code Rousseau:', revenueCodeRousseauSeries);
            
            // CA en ligne (paiements card)
            const revenueOnlineSeries = bucketSumByMonth(onlinePayments, (it) => new Date(it.created_at), (it) => Number(it.amount_eur || 0), months);
            
            // CA admin (paiements cash)
            const revenueAdminSeries = bucketSumByMonth(adminPayments, (it) => new Date(it.created_at), (it) => Number(it.amount_eur || 0), months);
            
            // Total reel : inclut aussi les anciens libelles de packs et les paiements admin/cash.
            const revenueSeries = bucketSumByMonth(payments, (it) => new Date(it.created_at), (it) => Number(it.amount_eur || 0), months);
            
            // Fonction pour calculer la duree d'un slot en heures
            const calculateHours = (slot) => {
                const start = new Date(slot.start_at);
                const end = new Date(slot.end_at);
                const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                return Number.isFinite(diff) && diff > 0 ? diff : 0;
            };
            
            // Debug: afficher les slots avec leur pack
            console.log('Done slots avec pack:', doneSlots.map(s => ({ email: s.user_email, pack: s.pack, start: s.start_at })));
            
            // Filtrer les slots par type de forfait
            // Boite manuelle: permis B, AAC, supervisee, conduite acceleree, 20h
            const manualSlots = doneSlots.filter(s => manualPackIds.includes(s.pack));
            // Boite auto
            const autoSlots = doneSlots.filter(s => autoPackIds.includes(s.pack));
            // Sans permis (AM)
            const amSlots = doneSlots.filter(s => s.pack === 'am');
            
            console.log('Slots filtres:', {
                manual: manualSlots.length,
                auto: autoSlots.length,
                am: amSlots.length,
                total: doneSlots.length
            });
            
            const hoursManualSeries = bucketSumByMonth(manualSlots, (it) => new Date(it.start_at), calculateHours, months);
            const hoursAutoSeries = bucketSumByMonth(autoSlots, (it) => new Date(it.start_at), calculateHours, months);
            const hoursAmSeries = bucketSumByMonth(amSlots, (it) => new Date(it.start_at), calculateHours, months);
            
            console.log('Series heures:', {
                manual: hoursManualSeries,
                auto: hoursAutoSeries,
                am: hoursAmSeries
            });
            
            // Total reel : inclut aussi les anciens eleves ou packs non categorises.
            const hoursSeries = bucketSumByMonth(doneSlots, (it) => new Date(it.start_at), calculateHours, months);

            // Calculer le total annuel au lieu du dernier mois
            const signupsTotal = signupsSeries.reduce((sum, val) => sum + val, 0);
            const revenueTotal = revenueSeries.reduce((sum, val) => sum + val, 0);
            const hoursTotal = hoursSeries.reduce((sum, val) => sum + val, 0);

            if (kpiSignups) kpiSignups.textContent = String(signupsTotal);
            if (kpiRevenue) kpiRevenue.textContent = `${Math.round(revenueTotal)}\u20ac`;
            if (kpiHours) kpiHours.textContent = `${Math.round(hoursTotal)}h`;

            charts.signupsTotal = createOrUpdateChart(charts.signupsTotal, chartSignupsTotalCanvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        lineDataset('Total', signupsSeries, 'rgba(0, 113, 227, 0.9)'),
                        lineDataset('Boite manuelle', signupsManualSeries, 'rgba(34, 197, 94, 0.9)'),
                        lineDataset('Boite auto', signupsAutoSeries, 'rgba(251, 146, 60, 0.9)'),
                        lineDataset('Sans permis', signupsAmSeries, 'rgba(168, 85, 247, 0.9)')
                    ]
                },
                options: lineOptions()
            });

            charts.revenueTotal = createOrUpdateChart(charts.revenueTotal, chartRevenueTotalCanvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        lineDataset('CA total', revenueSeries, 'rgba(0, 113, 227, 0.9)', true),
                        lineDataset('CA en ligne', revenueOnlineSeries, 'rgba(34, 197, 94, 0.9)', true),
                        lineDataset('CA cash', revenueAdminSeries, 'rgba(255, 149, 0, 0.9)', true)
                    ]
                },
                options: lineOptions({ euro: true })
            });

            charts.hoursTotal = createOrUpdateChart(charts.hoursTotal, chartHoursTotalCanvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        lineDataset('Total', hoursSeries, 'rgba(0, 113, 227, 0.9)'),
                        lineDataset('Boite manuelle', hoursManualSeries, 'rgba(34, 197, 94, 0.9)'),
                        lineDataset('Boite auto', hoursAutoSeries, 'rgba(251, 146, 60, 0.9)'),
                        lineDataset('Sans permis', hoursAmSeries, 'rgba(168, 85, 247, 0.9)')
                    ]
                },
                options: lineOptions()
            });

            setFeedback(analyticsFeedback, '', '');
        } catch (err) {
            console.error(err);
            setFeedback(analyticsFeedback, 'Impossible de charger les analytics. Verifie les tables/policies Supabase.', 'error');
        }
    }

    window.refreshAnalytics = refresh;

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

    if (profitabilityHourlyRate) {
        profitabilityHourlyRate.addEventListener('change', async () => {
            await refresh();
        });
    }

    if (profitabilityMonth) {
        setDefaultProfitabilityMonth();
        profitabilityMonth.addEventListener('change', async () => {
            await refresh();
        });
    }

    refresh();
})();
