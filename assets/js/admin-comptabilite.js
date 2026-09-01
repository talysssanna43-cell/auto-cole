const accountingState = {
    month: new Date(),
    data: null,
    charts: {},
    selectedInvoiceIndexes: new Set()
};

const detailConfig = {
    encaissements: { title: 'Detail des encaissements', subtitle: 'Chaque paiement ou facture trouvee sur le mois.', formula: 'Total des factures et paiements encaisses sur le mois.', total: 'encaissements' },
    decaissements: { title: 'Detail des decaissements', subtitle: 'Charges fixes, salaires, frais variables saisis et bonus du mois.', formula: 'Charges fixes + salaires Eric et Elodie + charges variables + bonus.', total: 'decaissements' },
    soldeTresorerieDisponible: { title: 'Detail du solde de tresorerie', subtitle: 'Encaissements moins decaissements du mois.', formula: 'Solde disponible = encaissements - decaissements.', total: 'soldeTresorerieDisponible' },
    variationTresorerie: { title: 'Variation de tresorerie', subtitle: 'Comparaison entre le solde du mois courant et celui du mois precedent.', formula: 'Variation = solde du mois courant - solde du mois precedent.', total: 'variationTresorerie' },
    creditTvaEstime: { title: 'Credit TVA estime', subtitle: 'TVA deductible moins TVA collectee sur le mois.', formula: 'Credit TVA = TVA deductible sur charges eligibles - TVA collectee sur les ventes.', total: 'creditTvaEstime' },
    valeurAjoutee: { title: 'Valeur ajoutee', subtitle: 'Encaissements moins charges externes estimees.', formula: 'Valeur ajoutee = encaissements - charges externes.', total: 'valeurAjoutee' },
    ebe: { title: "EBE (Excedent brut d'exploitation)", subtitle: 'Valeur ajoutee moins les salaires fixes Eric et Elodie.', formula: 'EBE = valeur ajoutee - salaires Eric et Elodie.', total: 'ebe' },
    dettePedagogique: { title: 'Dette pedagogique', subtitle: 'Heures et cours vendus mais pas encore realises. Les cours nouveaux valent 43 min et ne sont pas additionnes aux heures.', formula: 'Valeur = reste a realiser x prix moyen paye par unite.', total: 'debtValue' },
};

function monthStart(date) {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
}

function addMonths(date, count) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + count);
    return d;
}

function formatEuro(value) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('fr-FR');
}

function accountingIndex(item) {
    const ratio = Number(item.ratio || 0);
    const value = Number(item.value || 0);
    if (item.label.includes('Valeur')) {
        if (ratio > 40) return { status: 'ok', label: 'Bon signe', rule: 'VA > 40%' };
        if (ratio < 30) return { status: 'danger', label: 'Mauvais signe', rule: 'VA < 30%' };
        return { status: 'warning', label: 'Zone moyenne', rule: '30% <= VA <= 40%' };
    }
    if (item.label.includes('EBE')) {
        return ratio > 8
            ? { status: 'ok', label: 'Bon signe', rule: 'EBE > 8%' }
            : { status: 'danger', label: 'Mauvais signe', rule: 'EBE <= 8%' };
    }
    if (item.label.includes('exploitation')) {
        return value > 0
            ? { status: 'ok', label: 'Bon signe', rule: 'RE > 0' }
            : { status: 'danger', label: 'Mauvais signe', rule: 'RE <= 0' };
    }
    if (item.label.includes('net')) {
        if (ratio > 2 && ratio < 5) return { status: 'ok', label: 'Bon signe', rule: '2% < RN < 5%' };
        if (ratio < 1) return { status: 'danger', label: 'Mauvais signe', rule: 'RN < 1%' };
        return { status: 'warning', label: 'Zone moyenne', rule: 'RN hors zone cible' };
    }
    return value >= 0
        ? { status: 'ok', label: 'Solde positif', rule: 'Solde >= 0' }
        : { status: 'danger', label: 'Solde negatif', rule: 'Solde < 0' };
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function setFeedback(text, type = '') {
    const element = document.getElementById('accountingFeedback');
    if (!element) return;
    element.textContent = text || '';
    element.className = `feedback ${type}`;
}

function setExpenseFeedback(text, type = '') {
    const element = document.getElementById('expenseFormFeedback');
    if (!element) return;
    element.textContent = text || '';
    element.className = `expense-feedback ${type}`;
}

async function fetchAccountingData(start, end) {
    const token = window.authSession?.getToken();
    if (!token) throw new Error('AUTH_REQUIRED');
    const response = await fetch(`/.netlify/functions/admin-accounting-data?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
    });
    const payload = await response.json().catch(() => ({ ok: false, error: 'INVALID_SERVER_RESPONSE' }));
    if (!response.ok || !payload.ok) throw new Error(payload.error || 'ACCOUNTING_LOAD_FAILED');
    return payload;
}

async function postAccountingExpense(data) {
    const token = window.authSession?.getToken();
    if (!token) throw new Error('AUTH_REQUIRED');
    const response = await fetch('/.netlify/functions/admin-accounting-expense', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    const payload = await response.json().catch(() => ({ ok: false, error: 'INVALID_SERVER_RESPONSE' }));
    if (!response.ok || !payload.ok) throw new Error(payload.error || 'ACCOUNTING_EXPENSE_FAILED');
    return payload;
}

async function postTransferInvoices(to) {
    const token = window.authSession?.getToken();
    if (!token) throw new Error('AUTH_REQUIRED');
    const payload = accountingState.data || {};
    const invoices = selectedInvoices();
    const response = await fetch('/.netlify/functions/admin-transfer-accounting-invoices', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            to,
            monthLabel: document.getElementById('monthLabel')?.textContent || '',
            invoices,
            summary: payload.summary || {}
        })
    });
    const result = await response.json().catch(() => ({ ok: false, error: 'INVALID_SERVER_RESPONSE' }));
    if (!response.ok || !result.ok) throw new Error(result.error || 'TRANSFER_FAILED');
    return result;
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file) return resolve('');
        const allowed = ['image/jpeg', 'application/pdf'];
        if (!allowed.includes(file.type)) return reject(new Error('INVALID_FILE_TYPE'));
        if (file.size > 900000) return reject(new Error('FILE_TOO_LARGE'));
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('FILE_READ_FAILED'));
        reader.readAsDataURL(file);
    });
}

function showExpensePanel() {
    const panel = document.getElementById('accountingExpensePanel');
    const decaissementsCard = document.querySelector('.kpi[data-detail="decaissements"]');
    if (!panel) return;
    if (decaissementsCard && !decaissementsCard.contains(panel)) {
        decaissementsCard.appendChild(panel);
    }
    panel.classList.add('active');
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderKpis(summary) {
    setText('kpiEncaissements', formatEuro(summary.encaissements));
    setText('kpiDecaissements', formatEuro(summary.decaissements));
    setText('kpiSolde', formatEuro(summary.soldeTresorerieDisponible));
    setText('kpiVariation', formatEuro(summary.variationTresorerie));
    setText('kpiVat', formatEuro(summary.creditTvaEstime));
    setText('kpiVa', formatEuro(summary.valeurAjoutee));
    setText('kpiEbe', formatEuro(summary.ebe));
    const debt = document.getElementById('kpiDebt');
    if (debt) {
        debt.innerHTML = `${formatEuro(summary.debtValue)}<small>${Number(summary.debtOldHours || 0).toLocaleString('fr-FR')}h anciennes = ${formatEuro(summary.debtOldValue)} / ${Number(summary.debtNewCourses || 0).toLocaleString('fr-FR')} cours de 43 min = ${formatEuro(summary.debtNewValue)}</small>`;
    }
    document.querySelectorAll('[data-money-status]').forEach((element) => {
        const value = Number(summary[element.dataset.moneyStatus] || 0);
        element.classList.toggle('is-negative', value < 0);
        element.classList.toggle('is-positive', value >= 0);
    });
}

function chartColor(metric) {
    if (['decaissements'].includes(metric)) return '#ff3b30';
    if (['soldeTresorerieDisponible', 'ebe'].includes(metric)) return '#34c759';
    if (['variationTresorerie'].includes(metric)) return '#ff9500';
    if (['creditTvaEstime'].includes(metric)) return '#f52b86';
    return '#0071e3';
}

function chartLabel(metric) {
    return {
        encaissements: 'Encaissements',
        decaissements: 'Decaissements',
        soldeTresorerieDisponible: 'Solde tresorerie',
        variationTresorerie: 'Variation tresorerie',
        creditTvaEstime: 'Credit TVA estime',
        valeurAjoutee: 'Valeur ajoutee',
        ebe: 'EBE',
        dettePedagogique: 'Dette pedagogique'
    }[metric] || metric;
}

function renderDebtChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    const trend = accountingState.data?.trend || [];
    if (!canvas || typeof Chart === 'undefined' || !trend.length) return;
    accountingState.charts[canvasId]?.destroy();
    accountingState.charts[canvasId] = new Chart(canvas, {
        type: 'line',
        data: {
            labels: trend.map((item) => item.label),
            datasets: [
                {
                    label: 'Anciens packs - heures dues',
                    data: trend.map((item) => Number(item.debtOldHours || 0)),
                    borderColor: '#0071e3',
                    backgroundColor: 'rgba(0,113,227,0.10)',
                    fill: false,
                    tension: 0.28,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#0071e3',
                    pointBorderWidth: 2,
                    borderWidth: 2.5
                },
                {
                    label: 'Nouveaux packs - cours 43 min dus',
                    data: trend.map((item) => Number(item.debtNewCourses || 0)),
                    borderColor: '#f52b86',
                    backgroundColor: 'rgba(245,43,134,0.10)',
                    fill: false,
                    tension: 0.28,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#f52b86',
                    pointBorderWidth: 2,
                    borderWidth: 2.5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: true, labels: { boxWidth: 12, color: '#1d1d1f', font: { weight: '700' } } },
                tooltip: {
                    callbacks: {
                        title: (items) => items[0]?.label || '',
                        label: (ctx) => {
                            const month = trend[ctx.dataIndex] || {};
                            const value = ctx.datasetIndex === 0 ? month.debtOldValue : month.debtNewValue;
                            return `${ctx.dataset.label} : ${Number(ctx.parsed.y || 0).toLocaleString('fr-FR')} (${formatEuro(value)})`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: { display: true, text: 'Mois', color: '#6e6e73', font: { weight: '700', size: 11 } },
                    ticks: { color: '#6e6e73', maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
                    grid: { color: 'rgba(0,0,0,0.06)' }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    title: { display: true, text: 'Volumes restants separes', color: '#6e6e73', font: { weight: '700', size: 11 } },
                    ticks: { color: '#6e6e73', precision: 0 },
                    grid: { color: 'rgba(0,0,0,0.08)' }
                }
            }
        }
    });
}

function renderSparkline(canvasId, metric) {
    const canvas = document.getElementById(canvasId);
    const trend = accountingState.data?.trend || [];
    if (!canvas || typeof Chart === 'undefined' || !trend.length) return;
    accountingState.charts[canvasId]?.destroy();
    const color = chartColor(metric);
    const label = chartLabel(metric);
    accountingState.charts[canvasId] = new Chart(canvas, {
        type: 'line',
        data: {
            labels: trend.map((item) => item.label),
            datasets: [{
                label,
                data: trend.map((item) => Number(item[metric] || 0)),
                borderColor: color,
                backgroundColor: `${color}18`,
                fill: true,
                tension: 0.28,
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBackgroundColor: '#fff',
                pointBorderColor: color,
                pointBorderWidth: 2,
                borderWidth: 2.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => items[0]?.label || '',
                        label: (ctx) => `${label} : ${formatEuro(ctx.parsed.y)}`
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: { display: true, text: 'Mois', color: '#6e6e73', font: { weight: '700', size: 11 } },
                    ticks: { color: '#6e6e73', maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
                    grid: { color: 'rgba(0,0,0,0.06)' }
                },
                y: {
                    display: true,
                    title: { display: true, text: 'Montant', color: '#6e6e73', font: { weight: '700', size: 11 } },
                    ticks: { color: '#6e6e73', callback: (value) => formatEuro(value) },
                    grid: { color: 'rgba(0,0,0,0.08)' }
                }
            }
        }
    });
}

function renderCharts() {
    [
        ['chartEncaissements', 'encaissements'],
        ['chartDecaissements', 'decaissements'],
        ['chartSolde', 'soldeTresorerieDisponible'],
        ['chartVariation', 'variationTresorerie'],
        ['chartVat', 'creditTvaEstime'],
        ['chartVa', 'valeurAjoutee'],
        ['chartEbe', 'ebe']
    ].forEach(([id, metric]) => renderSparkline(id, metric));
    renderDebtChart('chartDebt');
}

function renderBreakdown(summary) {
    const rows = [
        ['Encaissements en ligne', summary.onlineRevenue],
        ['Encaissements bureau / cash', summary.cashRevenue],
        ['Autres encaissements', summary.otherRevenue],
        ['Charges fixes mensuelles', summary.fixedCosts],
        ['Charges variables saisies', summary.variableExpenses],
        ['Decaissements', summary.decaissements],
        ['TVA collectee sur ventes', summary.vatCollected],
        ['TVA deductible', summary.vatDeductible],
        ['Salaires Eric + Elodie', summary.salaryCharges],
        ['Bonus moniteurs', summary.bonusCharges]
    ];
    const container = document.getElementById('accountingBreakdown');
    if (!container) return;
    container.innerHTML = rows.map(([label, value]) => `
        <div class="breakdown-row">
            <span>${label}</span>
            <strong>${formatEuro(value)}</strong>
        </div>
    `).join('');
}

function renderIndicators(payload) {
    const container = document.getElementById('indicatorGrid');
    if (!container) return;
    container.innerHTML = (payload.indicators || []).map((item) => {
        const indice = accountingIndex(item);
        return `
        <article class="indicator-card ${indice.status}">
            <div>
                <h3>${item.label}</h3>
                <p>${item.label.includes('/') ? `${item.ratio}% du CA` : formatEuro(item.value)}</p>
                <small>${indice.rule}</small>
            </div>
            <span>${indice.label}</span>
        </article>
    `;
    }).join('');

    const sig = payload.sig2025 || {};
    setText('sigCa', formatEuro(sig.ca));
    setText('sigVa', formatEuro(sig.valeurAjoutee));
    setText('sigEbe', formatEuro(sig.ebe));
}

function selectedInvoices() {
    const invoices = accountingState.data?.invoices || [];
    return invoices.filter((_, index) => accountingState.selectedInvoiceIndexes.has(index));
}

function updateInvoiceSelectionCount(total) {
    const count = document.getElementById('invoiceCount');
    if (!count) return;
    const selected = accountingState.selectedInvoiceIndexes.size;
    count.textContent = `${selected}/${total} facture${total > 1 ? 's' : ''} selectionnee${selected > 1 ? 's' : ''}`;
}

function renderInvoices(invoices) {
    const tbody = document.getElementById('invoiceRows');
    accountingState.selectedInvoiceIndexes = new Set(invoices.map((_, index) => index));
    updateInvoiceSelectionCount(invoices.length);
    if (!tbody) return;
    if (!invoices.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-cell">Aucune facture trouvee pour ce mois.</td></tr>';
        return;
    }
    tbody.innerHTML = invoices.map((invoice, index) => `
        <tr>
            <td class="invoice-select-cell"><input type="checkbox" class="invoice-select" data-index="${index}" checked aria-label="Inclure cette facture dans le PDF"></td>
            <td>${formatDate(invoice.payment_date)}</td>
            <td>${invoice.invoice_number || '-'}</td>
            <td>
                <strong>${invoice.customer || '-'}</strong>
                <small>${invoice.email || ''}</small>
            </td>
            <td>${invoice.pack || '-'}</td>
            <td>${invoice.payment_channel || '-'}</td>
            <td class="num">${formatEuro(invoice.amount)}</td>
            <td>${invoice.hours_purchased || '-'}</td>
        </tr>
    `).join('');
    tbody.querySelectorAll('.invoice-select').forEach((checkbox) => {
        checkbox.addEventListener('change', (event) => {
            const index = Number(event.currentTarget.dataset.index);
            if (event.currentTarget.checked) accountingState.selectedInvoiceIndexes.add(index);
            else accountingState.selectedInvoiceIndexes.delete(index);
            updateInvoiceSelectionCount(invoices.length);
        });
    });
}

function signedEuro(value) {
    return formatEuro(value);
}

function detailTableHtml(type, rows) {
    if (type === 'encaissements') {
        const body = rows.length ? rows.map((row) => `
            <tr>
                <td>${formatDate(row.payment_date)}</td>
                <td><strong>${row.customer || '-'}</strong></td>
                <td>${row.email || '-'}</td>
                <td>${row.invoice_number || '-'}</td>
                <td>${row.pack || '-'}</td>
                <td>${row.payment_channel || '-'}</td>
                <td class="num">${formatEuro(row.amount)}</td>
            </tr>
        `).join('') : '<tr><td colspan="7" class="empty-cell">Aucun encaissement sur ce mois.</td></tr>';
        return `
            <table>
                <thead><tr><th>Date</th><th>Eleve</th><th>Email</th><th>Facture</th><th>Forfait</th><th>Paiement</th><th>Montant</th></tr></thead>
                <tbody>${body}</tbody>
            </table>
        `;
    }

    if (type === 'dettePedagogique') {
        const body = rows.length ? rows.map((row) => `
            <tr>
                <td><strong>${row.customer || '-'}</strong><small>${row.email || ''}</small></td>
                <td>${row.pack || '-'}</td>
                <td>Vendu ${Number(row.oldSold || 0).toLocaleString('fr-FR')}h<br>Realise ${Number(row.oldCompleted || 0).toLocaleString('fr-FR')}h<br><strong>Reste ${Number(row.oldDebt || 0).toLocaleString('fr-FR')}h</strong></td>
                <td class="num">${formatEuro(row.oldDebtValue)}</td>
                <td>Vendu ${Number(row.newSold || 0).toLocaleString('fr-FR')} cours<br>Realise ${Number(row.newCompleted || 0).toLocaleString('fr-FR')} cours<br><strong>Reste ${Number(row.newDebt || 0).toLocaleString('fr-FR')} cours de 43 min</strong></td>
                <td class="num">${formatEuro(row.newDebtValue)}</td>
                <td class="num"><strong>${formatEuro(row.debtValue)}</strong></td>
            </tr>
        `).join('') : '<tr><td colspan="7" class="empty-cell">Aucune dette pedagogique a cette date.</td></tr>';
        return `
            <table>
                <thead><tr><th>Eleve</th><th>Forfait</th><th>Anciens packs</th><th>Valeur heures</th><th>Nouveaux packs</th><th>Valeur cours</th><th>Total du</th></tr></thead>
                <tbody>${body}</tbody>
            </table>
        `;
    }

    const body = rows.length ? rows.map((row) => `
        <tr>
            <td>${formatDate(row.date)}</td>
            <td>${row.type || 'Calcul'}</td>
            <td><strong>${row.label || '-'}</strong></td>
            <td>${row.source || '-'}</td>
            <td>${row.attachment ? `<a href="${row.attachment}" target="_blank" rel="noopener">Voir</a>` : '-'}</td>
            <td class="num ${Number(row.amount || 0) < 0 ? 'is-negative' : 'is-positive'}">${signedEuro(row.amount)}</td>
        </tr>
    `).join('') : '<tr><td colspan="6" class="empty-cell">Aucun detail disponible.</td></tr>';
    return `
        <table>
            <thead><tr><th>Date</th><th>Type</th><th>Libelle</th><th>Source</th><th>Piece</th><th>Montant</th></tr></thead>
            <tbody>${body}</tbody>
        </table>
    `;
}

function renderDetail(type, trigger = null) {
    const payload = accountingState.data;
    if (!payload) return;
    const config = detailConfig[type];
    if (!config) return;

    const card = trigger?.closest?.('.kpi');
    if (card) {
        document.querySelectorAll('.kpi-detail-inline.active').forEach((panel) => {
            if (!card.contains(panel)) panel.classList.remove('active');
        });
        let inline = card.querySelector('.kpi-detail-inline');
        if (!inline) {
            inline = document.createElement('div');
            inline.className = 'kpi-detail-inline';
            card.appendChild(inline);
        }
        const rows = payload.details?.[type] || [];
        inline.innerHTML = `
            <div class="kpi-detail-head">
                <strong>${config.title} : ${type === 'dettePedagogique' ? `${formatEuro(payload.summary?.debtValue)} (${Number(payload.summary?.debtOldHours || 0).toLocaleString('fr-FR')}h anciennes / ${Number(payload.summary?.debtNewCourses || 0).toLocaleString('fr-FR')} cours de 43 min)` : formatEuro(payload.summary?.[config.total] || 0)}</strong>
                <span>${config.subtitle}</span>
                <div class="kpi-detail-formula">${config.formula}</div>
            </div>
            <div class="kpi-detail-table">${detailTableHtml(type, rows)}</div>
        `;
        inline.classList.toggle('active');
        return;
    }

    const panel = document.getElementById('accountingDetailPanel');
    const head = document.getElementById('detailHead');
    const body = document.getElementById('detailRows');
    if (!panel || !head || !body) return;

    setText('detailTitle', config.title);
    setText('detailSubtitle', `${config.subtitle} ${config.formula}`);
    setText('detailTotal', formatEuro(payload.summary?.[config.total] || 0));

    if (type === 'encaissements') {
        const rows = payload.details?.encaissements || [];
        head.innerHTML = '<tr><th>Date</th><th>Eleve</th><th>Email</th><th>Facture</th><th>Forfait</th><th>Paiement</th><th>Montant</th></tr>';
        body.innerHTML = rows.length ? rows.map((row) => `
            <tr>
                <td>${formatDate(row.payment_date)}</td>
                <td><strong>${row.customer || '-'}</strong></td>
                <td>${row.email || '-'}</td>
                <td>${row.invoice_number || '-'}</td>
                <td>${row.pack || '-'}</td>
                <td>${row.payment_channel || '-'}</td>
                <td class="num">${formatEuro(row.amount)}</td>
            </tr>
        `).join('') : '<tr><td colspan="7" class="empty-cell">Aucun encaissement sur ce mois.</td></tr>';
    } else if (type === 'dettePedagogique') {
        const rows = payload.details?.dettePedagogique || [];
        head.innerHTML = '<tr><th>Eleve</th><th>Forfait</th><th>Anciens packs</th><th>Valeur heures</th><th>Nouveaux packs</th><th>Valeur cours</th><th>Total du</th></tr>';
        body.innerHTML = rows.length ? rows.map((row) => `
            <tr>
                <td><strong>${row.customer || '-'}</strong><small>${row.email || ''}</small></td>
                <td>${row.pack || '-'}</td>
                <td>Vendu ${Number(row.oldSold || 0).toLocaleString('fr-FR')}h<br>Realise ${Number(row.oldCompleted || 0).toLocaleString('fr-FR')}h<br><strong>Reste ${Number(row.oldDebt || 0).toLocaleString('fr-FR')}h</strong></td>
                <td class="num">${formatEuro(row.oldDebtValue)}</td>
                <td>Vendu ${Number(row.newSold || 0).toLocaleString('fr-FR')} cours<br>Realise ${Number(row.newCompleted || 0).toLocaleString('fr-FR')} cours<br><strong>Reste ${Number(row.newDebt || 0).toLocaleString('fr-FR')} cours de 43 min</strong></td>
                <td class="num">${formatEuro(row.newDebtValue)}</td>
                <td class="num"><strong>${formatEuro(row.debtValue)}</strong></td>
            </tr>
        `).join('') : '<tr><td colspan="7" class="empty-cell">Aucune dette pedagogique a cette date.</td></tr>';
    } else {
        const rows = payload.details?.[type] || [];
        head.innerHTML = '<tr><th>Date</th><th>Type</th><th>Libelle</th><th>Source</th><th>Piece</th><th>Montant</th></tr>';
        body.innerHTML = rows.length ? rows.map((row) => `
            <tr>
                <td>${formatDate(row.date)}</td>
                <td>${row.type || 'Calcul'}</td>
                <td><strong>${row.label || '-'}</strong></td>
                <td>${row.source || '-'}</td>
                <td>${row.attachment ? `<a href="${row.attachment}" target="_blank" rel="noopener">Voir</a>` : '-'}</td>
                <td class="num ${Number(row.amount || 0) < 0 ? 'is-negative' : 'is-positive'}">${signedEuro(row.amount)}</td>
            </tr>
        `).join('') : '<tr><td colspan="6" class="empty-cell">Aucun detail disponible.</td></tr>';
    }

    panel.classList.add('active');
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function csvEscape(value) {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
}

function pdfSafe(value) {
    return String(value ?? '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/[\\()]/g, '\\$&');
}

function pdfLine(text, x, y, size = 9, bold = false, color = '0 0 0') {
    return `BT ${color} rg /F${bold ? '2' : '1'} ${size} Tf ${x} ${y} Td (${pdfSafe(text)}) Tj ET\n`;
}

function pdfRect(x, y, width, height, color) {
    return `q ${color} rg ${x} ${y} ${width} ${height} re f Q\n`;
}

function downloadInvoicesCsv() {
    const invoices = selectedInvoices();
    if (!invoices.length) {
        setFeedback('Selectionne au moins une facture a integrer au PDF.', 'error');
        return;
    }
    const summary = accountingState.data?.summary || {};
    const monthLabel = document.getElementById('monthLabel')?.textContent || '';
    const pink = '0.96 0.17 0.53';
    const blue = '0.00 0.44 0.89';
    const green = '0.20 0.78 0.35';
    const navy = '0.07 0.08 0.16';
    const softPink = '1.00 0.93 0.97';
    const softBlue = '0.93 0.97 1.00';
    const light = '0.97 0.98 1.00';
    let y = 0;
    let content = '';

    content += pdfRect(0, 760, 595, 82, pink);
    content += pdfLine('Auto-Ecole Breteuil', 42, 804, 22, true, '1 1 1');
    content += pdfLine('Recapitulatif comptable des factures et forfaits vendus', 42, 782, 11, false, '1 1 1');
    content += pdfLine(monthLabel, 450, 804, 13, true, '1 1 1');

    y = 704;
    [
        ['Encaissements', summary.encaissements, blue, softBlue],
        ['Decaissements', summary.decaissements, pink, softPink],
        ['Solde tresorerie', summary.soldeTresorerieDisponible, green, '0.93 1.00 0.95']
    ].forEach(([label, value, color, bg], index) => {
        const x = 42 + index * 170;
        content += pdfRect(x, y, 150, 52, bg);
        content += pdfLine(label, x + 12, y + 32, 8, true, navy);
        content += pdfLine(formatEuro(value), x + 12, y + 12, 15, true, color);
    });

    y = 650;
    content += pdfLine('Factures du mois', 42, y, 15, true, navy);
    content += pdfLine(`${invoices.length} facture${invoices.length > 1 ? 's' : ''} trouvee${invoices.length > 1 ? 's' : ''}`, 430, y, 9, true, pink);
    y -= 26;
    content += pdfRect(42, y - 6, 512, 22, navy);
    content += pdfLine('Date', 52, y, 8, true, '1 1 1');
    content += pdfLine('Facture', 104, y, 8, true, '1 1 1');
    content += pdfLine('Client', 190, y, 8, true, '1 1 1');
    content += pdfLine('Forfait', 340, y, 8, true, '1 1 1');
    content += pdfLine('Montant', 500, y, 8, true, '1 1 1');
    y -= 20;

    invoices.slice(0, 26).forEach((invoice, index) => {
        if (index % 2 === 0) content += pdfRect(42, y - 5, 512, 18, light);
        content += pdfLine(formatDate(invoice.payment_date), 52, y, 7.5, false, navy);
        content += pdfLine(String(invoice.invoice_number || '-').slice(0, 18), 104, y, 7.5, false, navy);
        content += pdfLine(String(invoice.customer || invoice.email || '-').slice(0, 30), 190, y, 7.5, true, navy);
        content += pdfLine(String(invoice.pack || '-').slice(0, 28), 340, y, 7.5, false, navy);
        content += pdfLine(formatEuro(invoice.amount), 500, y, 7.5, true, pink);
        y -= 18;
    });
    if (!invoices.length) content += pdfLine('Aucune facture disponible sur ce mois.', 52, y, 10, false, navy);
    if (invoices.length > 26) content += pdfLine(`... ${invoices.length - 26} ligne(s) supplementaire(s) visibles dans le site`, 42, y, 8, true, navy);

    content += pdfRect(0, 0, 595, 34, navy);
    content += pdfLine('Auto-Ecole Breteuil - 04 91 53 36 98 - breteuilautoecole@gmail.com', 42, 14, 8, false, '1 1 1');

    const stream = `<< /Length ${new Blob([content]).size} >>\nstream\n${content}endstream`;
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
        stream
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [];
    objects.forEach((object, index) => {
        offsets.push(new Blob([pdf]).size);
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = new Blob([pdf]).size;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    const blob = new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const month = accountingState.month.toISOString().slice(0, 7);
    a.href = url;
    a.download = `factures-auto-ecole-breteuil-${month}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

async function transferInvoicesByEmail() {
    if (!selectedInvoices().length) {
        setFeedback('Selectionne au moins une facture a transferer.', 'error');
        return;
    }
    const to = await requestInvoiceTransferEmail();
    if (!to) return;
    try {
        setFeedback('Transfert du PDF en cours...');
        await postTransferInvoices(to);
        setFeedback('PDF transfere avec succes.', '');
    } catch (error) {
        console.error('Transfert factures:', error);
        const messages = {
            INVALID_EMAIL: 'Adresse e-mail invalide.',
            EMAIL_NOT_CONFIGURED: "L'envoi d'e-mail n'est pas configure sur le serveur.",
            AUTH_REQUIRED: 'Connexion admin requise.'
        };
        setFeedback(messages[error.message] || 'Impossible de transferer le PDF pour le moment.', 'error');
    }
}

function requestInvoiceTransferEmail() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);padding:20px;';
        overlay.innerHTML = `
            <div role="dialog" aria-modal="true" aria-labelledby="invoiceTransferTitle" style="width:min(440px,100%);background:#fff;border-radius:8px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.25);">
                <h3 id="invoiceTransferTitle" style="margin:0 0 8px;">Transferer les factures</h3>
                <p style="margin:0 0 16px;color:#60646c;">Indique l adresse e-mail du destinataire.</p>
                <input type="email" data-transfer-email autocomplete="email" placeholder="comptable@exemple.fr" style="width:100%;padding:12px;border:1px solid #d1d5db;border-radius:8px;font:inherit;">
                <p data-transfer-error style="display:none;margin:8px 0 0;color:#b42318;font-size:.88rem;">Saisis une adresse e-mail valide.</p>
                <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px;">
                    <button type="button" data-transfer-cancel style="padding:10px 16px;border:1px solid #d1d5db;border-radius:8px;background:#fff;cursor:pointer;">Annuler</button>
                    <button type="button" data-transfer-submit style="padding:10px 16px;border:0;border-radius:8px;background:#111827;color:#fff;font-weight:600;cursor:pointer;">Transferer</button>
                </div>
            </div>`;
        const input = overlay.querySelector('[data-transfer-email]');
        const finish = (value) => {
            document.removeEventListener('keydown', onKeydown);
            overlay.remove();
            resolve(value);
        };
        const submit = () => {
            const value = input.value.trim();
            if (!input.checkValidity() || !value) {
                overlay.querySelector('[data-transfer-error]').style.display = 'block';
                input.focus();
                return;
            }
            finish(value);
        };
        const onKeydown = (event) => {
            if (event.key === 'Escape') finish(null);
            if (event.key === 'Enter') submit();
        };
        overlay.querySelector('[data-transfer-cancel]').addEventListener('click', () => finish(null));
        overlay.querySelector('[data-transfer-submit]').addEventListener('click', submit);
        overlay.addEventListener('click', (event) => { if (event.target === overlay) finish(null); });
        document.addEventListener('keydown', onKeydown);
        document.body.appendChild(overlay);
        input.focus();
    });
}

function renderMonthLabel() {
    const start = monthStart(accountingState.month);
    setText('monthLabel', start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
    const input = document.getElementById('monthPicker');
    if (input) input.value = start.toISOString().slice(0, 7);
}

async function submitAccountingExpense(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = document.getElementById('expenseAttachment')?.files?.[0] || null;
    try {
        setExpenseFeedback('Enregistrement en cours...');
        const attachmentDataUrl = await fileToDataUrl(file);
        await postAccountingExpense({
            category: document.getElementById('expenseCategory')?.value,
            date: document.getElementById('expenseDate')?.value,
            label: document.getElementById('expenseLabel')?.value,
            amount: document.getElementById('expenseAmount')?.value,
            vendor: document.getElementById('expenseVendor')?.value,
            reference: document.getElementById('expenseReference')?.value,
            notes: document.getElementById('expenseNotes')?.value,
            attachmentDataUrl
        });
        form.reset();
        const dateInput = document.getElementById('expenseDate');
        if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
        setExpenseFeedback('Charge enregistree et ajoutee aux decaissements.', 'success');
        await loadAccounting();
    } catch (error) {
        console.error('Charge comptable:', error);
        const messages = {
            INVALID_FILE_TYPE: 'Piece jointe refusee. Utilise seulement un fichier JPG ou PDF.',
            FILE_TOO_LARGE: 'Piece jointe trop lourde. Utilise une image ou un PDF plus leger.',
            FILE_READ_FAILED: 'Impossible de lire la piece jointe.',
            INVALID_CATEGORY: 'Categorie invalide.',
            MISSING_LABEL: 'Indique le libelle de la charge.',
            INVALID_AMOUNT: 'Indique un montant valide.',
            INVALID_DATE: 'Indique une date valide.',
            AUTH_REQUIRED: 'Connexion admin requise.'
        };
        setExpenseFeedback(messages[error.message] || "Impossible d'enregistrer cette charge.", 'error');
    }
}

async function loadAccounting() {
    try {
        setFeedback('Chargement de la comptabilite...');
        renderMonthLabel();
        const start = monthStart(accountingState.month);
        const end = addMonths(start, 1);
        const payload = await fetchAccountingData(start, end);
        accountingState.data = payload;
        renderKpis(payload.summary);
        renderBreakdown(payload.summary);
        renderIndicators(payload);
        renderInvoices(payload.invoices || []);
        renderCharts();
        setFeedback('');
    } catch (error) {
        console.error('Comptabilite:', error);
        setFeedback('Impossible de charger la comptabilite pour le moment.', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    accountingState.month = monthStart(new Date());
    document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
        accountingState.month = addMonths(accountingState.month, -1);
        loadAccounting();
    });
    document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
        accountingState.month = addMonths(accountingState.month, 1);
        loadAccounting();
    });
    document.getElementById('monthPicker')?.addEventListener('change', (event) => {
        if (!event.target.value) return;
        accountingState.month = monthStart(new Date(`${event.target.value}-01T12:00:00`));
        loadAccounting();
    });
    document.getElementById('downloadInvoicesBtn')?.addEventListener('click', downloadInvoicesCsv);
    document.getElementById('transferInvoicesBtn')?.addEventListener('click', transferInvoicesByEmail);
    const expenseDate = document.getElementById('expenseDate');
    if (expenseDate && !expenseDate.value) expenseDate.value = new Date().toISOString().slice(0, 10);
    document.getElementById('accountingExpenseForm')?.addEventListener('submit', submitAccountingExpense);
    document.getElementById('detailCloseBtn')?.addEventListener('click', () => {
        document.getElementById('accountingDetailPanel')?.classList.remove('active');
    });
    document.querySelectorAll('.kpi[data-detail]').forEach((card) => {
        const hint = card.querySelector('.kpi-hint');
        if (hint) {
            const extra = card.dataset.detail === 'decaissements'
                ? '<button type="button" class="charge-toggle" id="openExpenseFormBtn"><i class="fas fa-plus"></i> Entrer des charges</button>'
                : '';
            hint.innerHTML = `<button type="button" class="detail-toggle" data-detail="${card.dataset.detail}">D&eacute;tails</button>${extra}`;
        }
    });
    document.querySelectorAll('.detail-toggle[data-detail]').forEach((button) => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            renderDetail(button.dataset.detail, button);
        });
    });
    document.getElementById('openExpenseFormBtn')?.addEventListener('click', (event) => {
        event.stopPropagation();
        showExpensePanel();
    });
    loadAccounting();
});
