const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, response } = require('./_lib/http');
const { getHourlyPriceCents, getPackDefinition } = require('./_lib/catalog');

const SIG_2025 = Object.freeze({
    ca: 127659,
    valeurAjoutee: 84919,
    ebe: 12029,
    resultatExploitation: 2508,
    resultatNet: 1937,
    ratios: {
        valeurAjoutee: 0.6652018267415537,
        ebe: 0.09422759069082477,
        resultatExploitation: 0.019646088407397833,
        resultatNet: 0.015173234946223925
    }
});

const DEFAULT_MONTHLY_FIXED_COSTS = Object.freeze({
    localRent: 670,
    vehicleInsurance: 1500,
    entoria: 300,
    mutuelle: 150,
    trainingOrganization: 700,
    ericSalary: 1600,
    elodieSalary: 1600,
    taxes: 0,
    depreciation: 0,
    exceptionalCharges: 0
});

const STAFF_SALARY_START = Object.freeze({ year: 2026, month: 9 });
const COURSE_UNIT_MINUTES = 43;
const OLD_HOUR_UNIT_MINUTES = 60;

function parisYearMonth(date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Paris',
        year: 'numeric',
        month: '2-digit'
    }).formatToParts(date);
    return {
        year: Number(parts.find((part) => part.type === 'year')?.value),
        month: Number(parts.find((part) => part.type === 'month')?.value)
    };
}

function staffSalariesApply(start) {
    const { year, month } = parisYearMonth(start);
    return year > STAFF_SALARY_START.year || (year === STAFF_SALARY_START.year && month >= STAFF_SALARY_START.month);
}

function staffSalaryCosts(start) {
    if (!staffSalariesApply(start)) {
        return { ericSalary: 0, elodieSalary: 0, total: 0 };
    }
    const ericSalary = DEFAULT_MONTHLY_FIXED_COSTS.ericSalary;
    const elodieSalary = DEFAULT_MONTHLY_FIXED_COSTS.elodieSalary;
    return { ericSalary, elodieSalary, total: ericSalary + elodieSalary };
}

function parseDate(value, fallback) {
    const date = new Date(value || fallback);
    return Number.isNaN(date.getTime()) ? new Date(fallback) : date;
}

function monthBounds(params = {}) {
    const now = new Date();
    const fallbackStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const fallbackEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const start = parseDate(params.start, fallbackStart.toISOString());
    const end = parseDate(params.end, fallbackEnd.toISOString());
    if (end <= start) return { start: fallbackStart, end: fallbackEnd };
    return { start, end };
}

function previousMonthBounds(start) {
    const previousStart = new Date(start);
    previousStart.setMonth(previousStart.getMonth() - 1);
    const previousEnd = new Date(start);
    return { start: previousStart, end: previousEnd };
}

function addMonths(date, delta) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + delta);
    return next;
}

function monthLabel(date) {
    return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit', timeZone: 'Europe/Paris' });
}

async function fetchAll(buildQuery) {
    const pageSize = 1000;
    const rows = [];
    for (let from = 0; from < 10000; from += pageSize) {
        const { data, error } = await buildQuery().range(from, from + pageSize - 1);
        if (error) throw error;
        rows.push(...(data || []));
        if (!data || data.length < pageSize) break;
    }
    return rows;
}

async function safeFetchAll(buildQuery, fallback = []) {
    try {
        return await fetchAll(buildQuery);
    } catch (error) {
        const code = String(error?.code || '');
        const message = String(error?.message || '').toLowerCase();
        if (['42P01', 'PGRST205', 'PGRST204'].includes(code) || message.includes('schema cache')) {
            return fallback;
        }
        throw error;
    }
}

async function fetchFirst(candidates, fallback = []) {
    let lastSchemaError = null;
    for (const buildQuery of candidates) {
        try {
            return await fetchAll(buildQuery);
        } catch (error) {
            const code = String(error?.code || '');
            const message = String(error?.message || '').toLowerCase();
            if (['42P01', 'PGRST205', 'PGRST204', '42703'].includes(code) || message.includes('schema cache') || message.includes('column')) {
                lastSchemaError = error;
                continue;
            }
            throw error;
        }
    }
    if (lastSchemaError) return fallback;
    return fallback;
}

function amountValue(row, fields) {
    for (const field of fields) {
        const value = row?.[field];
        const number = Number(value);
        if (Number.isFinite(number) && number > 0) {
            return number > 20000 && !String(value).includes('.') ? number / 100 : number;
        }
    }
    return 0;
}

function textValue(...values) {
    return values.find((value) => String(value || '').trim()) || '';
}

function isOnlinePayment(method) {
    const value = String(method || '').toLowerCase();
    return ['card', 'stripe', 'paypal', 'oney', 'alma'].some((key) => value.includes(key));
}

function isCashPayment(method) {
    const value = String(method || '').toLowerCase();
    return ['cash', 'admin', 'espece', 'espèce', 'cheque', 'chèque', 'virement'].some((key) => value.includes(key));
}

function normaliseInvoice(row, source) {
    const amount = amountValue(row, ['amount', 'amount_eur', 'amount_paid', 'total_amount', 'price']);
    const paymentDate = textValue(row.payment_date, row.created_at, row.updated_at);
    const paymentMethod = textValue(row.payment_method, row.method, row.source, source);
    const customer = textValue(row.user_name, row.customer_name, `${row.user_prenom || ''} ${row.user_nom || ''}`.trim(), row.name);
    const pack = textValue(row.forfait, row.pack_label, row.pack, row.pack_id, row.description);
    return {
        id: row.id || `${source}-${paymentDate}-${row.user_email || row.customer_email || Math.random()}`,
        source,
        invoice_number: textValue(row.invoice_number, row.number, `AUTO-${String(row.id || '').slice(0, 8)}`),
        payment_date: paymentDate,
        customer,
        email: textValue(row.user_email, row.customer_email, row.email),
        pack,
        amount,
        payment_method: paymentMethod,
        payment_channel: isOnlinePayment(paymentMethod) ? 'En ligne' : isCashPayment(paymentMethod) ? 'Bureau / cash' : 'Autre',
        hours_purchased: Number(row.hours_purchased || row.courses_purchased || 0),
        lesson_unit_minutes: Number(row.lesson_unit_minutes || 0),
        stripe_payment_intent_id: row.stripe_payment_intent_id || row.payment_intent_id || null
    };
}

function inDateRange(row, start, end, fields) {
    return fields.some((field) => {
        const date = new Date(row?.[field] || '');
        return !Number.isNaN(date.getTime()) && date >= start && date < end;
    });
}

function dedupeInvoices(rows) {
    const seen = new Set();
    const result = [];
    rows.forEach((row) => {
        const paymentIntent = String(row.stripe_payment_intent_id || '').trim().toLowerCase();
        const invoiceNumber = String(row.invoice_number || '').trim().toLowerCase();
        const hasRealInvoiceNumber = invoiceNumber && !invoiceNumber.startsWith('auto-');
        const fallbackFingerprint = [
            String(row.email || '').trim().toLowerCase(),
            String(row.payment_date || '').slice(0, 10),
            Number(row.amount || 0).toFixed(2),
            String(row.pack || '').trim().toLowerCase(),
            Number(row.hours_purchased || 0)
        ].join('|');
        const key = paymentIntent
            ? `stripe:${paymentIntent}`
            : hasRealInvoiceNumber
                ? `invoice:${invoiceNumber}`
                : `fallback:${fallbackFingerprint}`;
        if (seen.has(key)) return;
        seen.add(key);
        result.push(row);
    });
    return result.sort((a, b) => new Date(b.payment_date || 0) - new Date(a.payment_date || 0));
}

function sum(rows, mapper) {
    return rows.reduce((total, row) => total + Number(mapper(row) || 0), 0);
}

function round(value) {
    return Number((Number(value) || 0).toFixed(2));
}

function indicator(label, value, ratio, target, kind = 'ratio') {
    let status = 'ok';
    if (kind === 'positive' && value < 0) status = 'danger';
    if (kind === 'ratio') {
        if (ratio < target.danger) status = 'danger';
        else if (ratio < target.warning) status = 'warning';
    }
    return {
        label,
        value: round(value),
        ratio: Number((ratio * 100).toFixed(1)),
        target,
        status
    };
}

function parseExpenseMeta(expense) {
    const motif = String(expense.motif || 'Frais');
    const categoryMatch = motif.match(/Categorie:\s*([^|]+)/i);
    const labelMatch = motif.match(/Libelle:\s*([^|]+)/i);
    return {
        category: categoryMatch ? categoryMatch[1].trim() : 'Frais saisis',
        label: labelMatch ? labelMatch[1].trim() : motif
    };
}

function isVatDeductibleExpense(expense) {
    const { category, label } = parseExpenseMeta(expense);
    const c = category.toLowerCase();
    const l = label.toLowerCase();
    if (['personnel', 'assurances', 'fiscalite & taxes', 'amortissements hors vehicules', 'dirigeant'].includes(c)) return false;
    if (c === 'vehicules') {
        return ['carburant', 'essence', 'gazole', 'diesel', 'entretien', 'reparation', 'garage', 'pneu', 'controle'].some((word) => l.includes(word));
    }
    return [
        'informatique & logiciels',
        'comptabilite & administratif',
        'marketing & commercial',
        'pedagogie & reglementation',
        'entretien general & fournitures',
        'telecommunications',
        'imprevus & pertes'
    ].includes(c);
}

function lower(value) {
    return String(value || '').trim().toLowerCase();
}

function isCancelledStatus(status) {
    return ['cancelled', 'canceled', 'annule', 'annulée', 'annulee', 'refunded', 'rejected'].some((word) => lower(status).includes(word));
}

function isCourseBasedPack(pack, lessonUnitMinutes = 0) {
    const id = lower(pack);
    if ([43, 45].includes(Number(lessonUnitMinutes))) return true;
    if (Number(lessonUnitMinutes) === 120) return false;
    return id.startsWith('tarif-') || id.includes('chill') || id.includes('premium') || id.includes('accelere');
}

function lessonUnitsFromDuration(startAt, endAt, lessonUnitMinutes) {
    const start = new Date(startAt || '');
    const end = new Date(endAt || '');
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return 0;
    const minutes = (end.getTime() - start.getTime()) / 60000;
    const unit = [43, 45].includes(Number(lessonUnitMinutes)) ? COURSE_UNIT_MINUTES : OLD_HOUR_UNIT_MINUTES;
    return Math.max(0, Math.round(minutes / unit));
}

function transmissionFromPack(pack) {
    const id = lower(pack);
    return id.includes('auto') || id.includes('ba') || id.includes('automatique') ? 'auto' : 'manual';
}

function estimatedSaleValue(sale, courseBased) {
    const amount = Number(sale.amount || 0);
    const units = Number(sale.hours_purchased || 0);
    if (amount > 0) return amount;

    const definition = getPackDefinition(sale.pack);
    const definitionAmount = Number(definition?.amounts?.[0] || 0);
    if (definitionAmount > 0 && Number(definition?.hours || 0) === units) return definitionAmount / 100;

    const cents = getHourlyPriceCents(transmissionFromPack(sale.pack));
    return units > 0 ? (units * cents) / 100 : 0;
}

function debtUnitValue(totalValue, soldUnits, saleFallback) {
    const sold = Number(soldUnits || 0);
    const value = Number(totalValue || 0);
    if (sold > 0 && value > 0) return value / sold;
    return saleFallback;
}

async function loadDebtData(supabase, cutoff) {
    const cutoffIso = cutoff.toISOString();
    const users = await fetchFirst([
        () => supabase
            .from('users')
            .select('email,prenom,nom,forfait,hours_goal,hours_completed_initial,lesson_unit_minutes'),
        () => supabase
            .from('users')
            .select('email,prenom,nom,forfait,hours_goal,hours_completed_initial')
    ]);

    const [invoicesTable, notifications, payments, reservations] = await Promise.all([
        fetchFirst([
            () => supabase
                .from('invoices')
                .select('id,invoice_number,user_email,payment_date,created_at,amount,description,forfait,hours_purchased,payment_method,stripe_payment_intent_id,lesson_unit_minutes')
                .lt('payment_date', cutoffIso),
            () => supabase
                .from('invoices')
                .select('id,invoice_number,user_email,created_at,amount,description,forfait,hours_purchased,payment_method,stripe_payment_intent_id')
                .lt('created_at', cutoffIso)
        ]),
        fetchFirst([
            () => supabase
                .from('inscription_notifications')
                .select('id,created_at,user_email,user_name,user_prenom,user_nom,pack,hours_purchased,amount_paid,payment_method,stripe_payment_intent_id,status,lesson_unit_minutes')
                .lt('created_at', cutoffIso),
            () => supabase
                .from('inscription_notifications')
                .select('id,created_at,user_email,pack,hours_purchased,amount_paid,payment_method,status')
                .lt('created_at', cutoffIso)
        ]),
        fetchFirst([
            () => supabase
                .from('payments')
                .select('id,created_at,user_email,customer_email,user_name,pack_id,pack_label,amount,amount_eur,hours_purchased,payment_method,stripe_payment_intent_id,lesson_unit_minutes')
                .lt('created_at', cutoffIso),
            () => supabase
                .from('payments')
                .select('id,created_at,user_email,pack_id,amount,amount_eur,hours_purchased,payment_method')
                .lt('created_at', cutoffIso)
        ]),
        fetchFirst([
            () => supabase
                .from('reservations')
                .select('id,email,first_name,last_name,status,created_at,slots(start_at,end_at,status)'),
            () => supabase
                .from('reservations')
                .select('id,email,status,created_at,slots(start_at,end_at)')
        ])
    ]);

    const userMap = new Map();
    users.forEach((user) => {
        const email = lower(user.email);
        if (!email) return;
        userMap.set(email, {
            email,
            name: `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email,
            pack: user.forfait || '',
            lesson_unit_minutes: Number(user.lesson_unit_minutes || 0),
            initialCompleted: Number(user.hours_completed_initial || 0)
        });
    });

    const sales = dedupeInvoices([
        ...invoicesTable.map((row) => normaliseInvoice(row, 'invoices')),
        ...notifications
            .filter((row) => !isCancelledStatus(row.status))
            .map((row) => normaliseInvoice(row, 'inscriptions')),
        ...payments.map((row) => normaliseInvoice(row, 'payments'))
    ]).filter((row) => row.hours_purchased > 0);

    const byStudent = new Map();
    function ensureStudent(email, fallback = {}) {
        const key = lower(email);
        if (!key) return null;
        const profile = userMap.get(key) || {};
        if (!byStudent.has(key)) {
            byStudent.set(key, {
                email: key,
                name: profile.name || fallback.name || key,
                pack: profile.pack || fallback.pack || '',
                lesson_unit_minutes: profile.lesson_unit_minutes || Number(fallback.lesson_unit_minutes || 0),
                oldSold: 0,
                oldCompleted: 0,
                oldSalesValue: 0,
                newSold: 0,
                newCompleted: 0,
                newSalesValue: 0
            });
        }
        const item = byStudent.get(key);
        if (!item.pack && fallback.pack) item.pack = fallback.pack;
        if (!item.lesson_unit_minutes && fallback.lesson_unit_minutes) item.lesson_unit_minutes = Number(fallback.lesson_unit_minutes);
        return item;
    }

    sales.forEach((sale) => {
        const item = ensureStudent(sale.email, {
            name: sale.customer,
            pack: sale.pack,
            lesson_unit_minutes: sale.lesson_unit_minutes
        });
        if (!item) return;
        const courses = isCourseBasedPack(sale.pack || item.pack, sale.lesson_unit_minutes || item.lesson_unit_minutes);
        const units = Number(sale.hours_purchased || 0);
        const saleValue = estimatedSaleValue(sale, courses);
        if (courses) {
            item.newSold += units;
            item.newSalesValue += saleValue;
        } else {
            item.oldSold += units;
            item.oldSalesValue += saleValue;
        }
    });

    userMap.forEach((profile) => {
        const item = ensureStudent(profile.email, profile);
        if (!item || !profile.initialCompleted) return;
        if (isCourseBasedPack(profile.pack, profile.lesson_unit_minutes)) item.newCompleted += profile.initialCompleted;
        else item.oldCompleted += profile.initialCompleted;
    });

    const now = new Date();
    reservations.forEach((reservation) => {
        if (isCancelledStatus(reservation.status) || isCancelledStatus(reservation.slots?.status)) return;
        const slot = reservation.slots || {};
        const endAt = new Date(slot.end_at || slot.start_at || '');
        if (Number.isNaN(endAt.getTime()) || endAt > cutoff || endAt > now) return;
        const item = ensureStudent(reservation.email, {
            name: `${reservation.first_name || ''} ${reservation.last_name || ''}`.trim()
        });
        if (!item) return;
        const courses = isCourseBasedPack(item.pack, item.lesson_unit_minutes);
        const completedUnits = lessonUnitsFromDuration(slot.start_at, slot.end_at, courses ? COURSE_UNIT_MINUTES : OLD_HOUR_UNIT_MINUTES);
        if (courses) item.newCompleted += completedUnits;
        else item.oldCompleted += completedUnits;
    });

    const rows = Array.from(byStudent.values()).map((item) => {
        const oldDebt = Math.max(0, item.oldSold - item.oldCompleted);
        const newDebt = Math.max(0, item.newSold - item.newCompleted);
        const oldUnitValue = debtUnitValue(item.oldSalesValue, item.oldSold, getHourlyPriceCents(transmissionFromPack(item.pack)) / 100);
        const newUnitValue = debtUnitValue(item.newSalesValue, item.newSold, getHourlyPriceCents(transmissionFromPack(item.pack)) / 100);
        const oldDebtValue = oldDebt * oldUnitValue;
        const newDebtValue = newDebt * newUnitValue;
        return {
            email: item.email,
            customer: item.name,
            pack: item.pack || '-',
            oldSold: round(item.oldSold),
            oldCompleted: round(item.oldCompleted),
            oldDebt: round(oldDebt),
            oldDebtValue: round(oldDebtValue),
            newSold: round(item.newSold),
            newCompleted: round(item.newCompleted),
            newDebt: round(newDebt),
            newDebtValue: round(newDebtValue),
            debtValue: round(oldDebtValue + newDebtValue)
        };
    }).filter((row) => row.oldDebt > 0 || row.newDebt > 0)
        .sort((a, b) => b.debtValue - a.debtValue);

    return {
        oldHoursDebt: round(sum(rows, (row) => row.oldDebt)),
        newCoursesDebt: round(sum(rows, (row) => row.newDebt)),
        oldHoursDebtValue: round(sum(rows, (row) => row.oldDebtValue)),
        newCoursesDebtValue: round(sum(rows, (row) => row.newDebtValue)),
        debtValue: round(sum(rows, (row) => row.debtValue)),
        rows
    };
}

async function loadMonthData(supabase, start, end) {
    const startIso = start.toISOString();
    const endIso = end.toISOString();
    const dateStart = startIso.slice(0, 10);
    const dateEnd = endIso.slice(0, 10);

    const [invoicesTable, notifications, payments, expenses, instructors, bonuses] = await Promise.all([
        fetchFirst([
            () => supabase
            .from('invoices')
                .select('id,invoice_number,user_email,payment_date,created_at,amount,description,forfait,hours_purchased,payment_method,stripe_payment_intent_id,lesson_unit_minutes')
                .gte('payment_date', startIso)
                .lt('payment_date', endIso)
                .order('payment_date', { ascending: false }),
            () => supabase
                .from('invoices')
                .select('id,invoice_number,user_email,created_at,amount,description,forfait,hours_purchased,payment_method,stripe_payment_intent_id')
                .gte('created_at', startIso)
                .lt('created_at', endIso)
                .order('created_at', { ascending: false })
        ]),
        fetchFirst([
            () => supabase
            .from('inscription_notifications')
                .select('id,created_at,user_email,user_name,user_prenom,user_nom,pack,hours_purchased,amount_paid,payment_method,stripe_payment_intent_id,status,lesson_unit_minutes')
                .gte('created_at', startIso)
                .lt('created_at', endIso)
                .order('created_at', { ascending: false }),
            () => supabase
                .from('inscription_notifications')
                .select('id,created_at,user_email,pack,hours_purchased,amount_paid,payment_method,status')
                .gte('created_at', startIso)
                .lt('created_at', endIso)
                .order('created_at', { ascending: false })
        ]),
        fetchFirst([
            () => supabase
            .from('payments')
                .select('id,created_at,user_email,customer_email,user_name,pack_id,pack_label,amount,amount_eur,hours_purchased,payment_method,stripe_payment_intent_id,lesson_unit_minutes')
                .gte('created_at', startIso)
                .lt('created_at', endIso)
                .order('created_at', { ascending: false }),
            () => supabase
                .from('payments')
                .select('id,created_at,user_email,pack_id,amount,amount_eur,hours_purchased,payment_method')
                .gte('created_at', startIso)
                .lt('created_at', endIso)
                .order('created_at', { ascending: false })
        ]),
        fetchFirst([
            () => supabase
            .from('expenses')
                .select('id,date,created_at,instructor_name,motif,montant,photo_url')
                .gte('date', dateStart)
                .lt('date', dateEnd)
                .order('date', { ascending: false }),
            () => supabase
                .from('expenses')
                .select('id,created_at,instructor_name,motif,montant,photo_url')
                .gte('created_at', startIso)
                .lt('created_at', endIso)
                .order('created_at', { ascending: false })
        ]),
        fetchFirst([
            () => supabase
            .from('instructors')
                .select('id,prenom,nom,is_active,monthly_salary_charges')
                .eq('is_active', true),
            () => supabase
                .from('instructors')
                .select('id,prenom,nom,is_active')
                .eq('is_active', true)
        ]),
        fetchFirst([
            () => supabase
            .from('instructor_bonuses')
                .select('id,instructor,bonus_amount,status,period_end,updated_at,created_at')
        ])
    ]);

    const invoiceRows = dedupeInvoices([
        ...invoicesTable.map((row) => normaliseInvoice(row, 'invoices')),
        ...notifications
            .filter((row) => String(row.status || '').toLowerCase() !== 'rejected')
            .map((row) => normaliseInvoice(row, 'inscriptions')),
        ...payments.map((row) => normaliseInvoice(row, 'payments'))
    ]).filter((row) => row.amount > 0);

    const bonusRows = bonuses.filter((bonus) => {
        const date = new Date(bonus.period_end || bonus.updated_at || bonus.created_at);
        return !Number.isNaN(date.getTime()) && date >= start && date < end;
    });

    const salaries = staffSalaryCosts(start);
    const salaryCharges = salaries.total;
    const variableExpenses = sum(expenses, (row) => amountValue(row, ['montant']));
    const bonusCharges = sum(bonusRows, (row) => amountValue(row, ['bonus_amount']));
    const encaissements = sum(invoiceRows, (row) => row.amount);
    const onlineRevenue = sum(invoiceRows.filter((row) => row.payment_channel === 'En ligne'), (row) => row.amount);
    const cashRevenue = sum(invoiceRows.filter((row) => row.payment_channel === 'Bureau / cash'), (row) => row.amount);
    const otherRevenue = encaissements - onlineRevenue - cashRevenue;

    const fixedExternalCharges =
        DEFAULT_MONTHLY_FIXED_COSTS.localRent
        + DEFAULT_MONTHLY_FIXED_COSTS.vehicleInsurance
        + DEFAULT_MONTHLY_FIXED_COSTS.entoria
        + DEFAULT_MONTHLY_FIXED_COSTS.mutuelle
        + DEFAULT_MONTHLY_FIXED_COSTS.trainingOrganization;
    const fixedCosts = fixedExternalCharges + salaryCharges;
    const externalCharges = variableExpenses + fixedExternalCharges;
    const taxes = DEFAULT_MONTHLY_FIXED_COSTS.taxes;
    const depreciation = DEFAULT_MONTHLY_FIXED_COSTS.depreciation;
    const exceptionalCharges = DEFAULT_MONTHLY_FIXED_COSTS.exceptionalCharges;
    const decaissements = fixedCosts + variableExpenses + bonusCharges;
    const valeurAjoutee = encaissements - externalCharges;
    const ebe = valeurAjoutee - salaryCharges - bonusCharges - taxes;
    const resultatExploitation = ebe - depreciation;
    const resultatNet = resultatExploitation - exceptionalCharges;
    const vatCollected = encaissements * 20 / 120;
    const vatDeductibleBase = sum(expenses.filter(isVatDeductibleExpense), (row) => amountValue(row, ['montant']));
    const vatDeductible = vatDeductibleBase * 20 / 120;
    const estimatedVatCredit = round(vatDeductible - vatCollected);

    return {
        invoices: invoiceRows,
        expenses,
        instructors,
        bonuses: bonusRows,
        summary: {
            encaissements: round(encaissements),
            onlineRevenue: round(onlineRevenue),
            cashRevenue: round(cashRevenue),
            otherRevenue: round(otherRevenue),
            decaissements: round(decaissements),
            salaryCharges: round(salaryCharges),
            externalCharges: round(externalCharges),
            variableExpenses: round(variableExpenses),
            bonusCharges: round(bonusCharges),
            fixedCosts: round(fixedCosts),
            vatCollected: round(vatCollected),
            vatDeductibleBase: round(vatDeductibleBase),
            vatDeductible: round(vatDeductible),
            soldeTresorerieDisponible: round(encaissements - decaissements),
            creditTvaEstime: estimatedVatCredit,
            valeurAjoutee: round(valeurAjoutee),
            ebe: round(ebe),
            resultatExploitation: round(resultatExploitation),
            resultatNet: round(resultatNet)
        }
    };
}

function buildDecaissementRows(data, assumptions) {
    const rows = [
        { type: 'Local', label: 'Loyer local', amount: assumptions.localRentMonthly, source: 'Charge fixe' },
        { type: 'Vehicules', label: 'Assurance vehicules', amount: assumptions.vehicleInsuranceMonthly, source: 'Charge fixe' },
        { type: 'Assurances', label: 'Entoria', amount: assumptions.entoriaMonthly, source: 'Charge fixe' },
        { type: 'Personnel', label: 'Mutuelle', amount: assumptions.mutuelleMonthly, source: 'Charge fixe' },
        { type: 'Pedagogie', label: 'Organisme de formation', amount: assumptions.trainingOrganizationMonthly, source: 'Charge fixe' },
        { type: 'Personnel', label: 'Salaire Eric', amount: assumptions.ericSalaryMonthly, source: 'Charge fixe' },
        { type: 'Personnel', label: 'Salaire Elodie', amount: assumptions.elodieSalaryMonthly, source: 'Charge fixe' }
    ];

    data.expenses.forEach((expense) => {
        const { category, label } = parseExpenseMeta(expense);
        rows.push({
            type: category,
            label,
            amount: amountValue(expense, ['montant']),
            date: expense.date || expense.created_at,
            source: expense.instructor_name || 'Non attribue',
            attachment: expense.photo_url || null
        });
    });

    data.bonuses.forEach((bonus) => {
        rows.push({
            type: 'Personnel',
            label: `Bonus moniteur - ${bonus.instructor || 'Non attribue'}`,
            amount: amountValue(bonus, ['bonus_amount']),
            date: bonus.period_end || bonus.updated_at || bonus.created_at,
            source: 'Bonus moniteur'
        });
    });

    return rows
        .filter((row) => Number(row.amount || 0) > 0)
        .map((row) => ({ ...row, amount: round(row.amount) }));
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'GET') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const session = verifySession(getBearerToken(event), ['admin']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        const { start, end } = monthBounds(event.queryStringParameters || {});
        const previous = previousMonthBounds(start);
        const assumptions = {
            localRentMonthly: DEFAULT_MONTHLY_FIXED_COSTS.localRent,
            vehicleInsuranceMonthly: DEFAULT_MONTHLY_FIXED_COSTS.vehicleInsurance,
            entoriaMonthly: DEFAULT_MONTHLY_FIXED_COSTS.entoria,
            mutuelleMonthly: DEFAULT_MONTHLY_FIXED_COSTS.mutuelle,
            trainingOrganizationMonthly: DEFAULT_MONTHLY_FIXED_COSTS.trainingOrganization,
            ericSalaryMonthly: staffSalaryCosts(start).ericSalary,
            elodieSalaryMonthly: staffSalaryCosts(start).elodieSalary,
            taxesMonthly: DEFAULT_MONTHLY_FIXED_COSTS.taxes,
            depreciationMonthly: DEFAULT_MONTHLY_FIXED_COSTS.depreciation,
            exceptionalChargesMonthly: DEFAULT_MONTHLY_FIXED_COSTS.exceptionalCharges,
            vatNote: 'Estimation technique a verifier par le comptable.'
        };
        const [current, previousData, currentDebt] = await Promise.all([
            loadMonthData(supabase, start, end),
            loadMonthData(supabase, previous.start, previous.end),
            loadDebtData(supabase, end)
        ]);

        const trendStarts = Array.from({ length: 12 }, (_, index) => addMonths(start, index - 11));
        const [trendData, trendDebtData] = await Promise.all([
            Promise.all(trendStarts.map((month) => loadMonthData(supabase, month, addMonths(month, 1)))),
            Promise.all(trendStarts.map((month) => loadDebtData(supabase, addMonths(month, 1))))
        ]);
        const trend = trendStarts.map((month, index) => {
            const item = trendData[index];
            const debt = trendDebtData[index];
            const previousItem = index > 0 ? trendData[index - 1] : null;
            return {
                label: monthLabel(month),
                start: month.toISOString(),
                encaissements: item.summary.encaissements,
                decaissements: item.summary.decaissements,
                soldeTresorerieDisponible: item.summary.soldeTresorerieDisponible,
                variationTresorerie: previousItem ? round(item.summary.soldeTresorerieDisponible - previousItem.summary.soldeTresorerieDisponible) : 0,
                creditTvaEstime: item.summary.creditTvaEstime,
                valeurAjoutee: item.summary.valeurAjoutee,
                ebe: item.summary.ebe,
                resultatExploitation: item.summary.resultatExploitation,
                resultatNet: item.summary.resultatNet,
                debtOldHours: debt.oldHoursDebt,
                debtNewCourses: debt.newCoursesDebt,
                debtOldValue: debt.oldHoursDebtValue,
                debtNewValue: debt.newCoursesDebtValue,
                debtValue: debt.debtValue
            };
        });

        const ca = current.summary.encaissements || 1;
        const variationTresorerie = current.summary.soldeTresorerieDisponible - previousData.summary.soldeTresorerieDisponible;
        const indicators = [
            indicator('Valeur ajoutee / CA', current.summary.valeurAjoutee, current.summary.valeurAjoutee / ca, { warning: 0.40, danger: 0.30 }),
            indicator('EBE / CA', current.summary.ebe, current.summary.ebe / ca, { warning: 0.08, danger: 0 }),
            indicator('Solde de tresorerie', current.summary.soldeTresorerieDisponible, 0, { warning: 0, danger: 0 }, 'positive')
        ];

        return response(200, {
            ok: true,
            range: { start: start.toISOString(), end: end.toISOString() },
            previousRange: { start: previous.start.toISOString(), end: previous.end.toISOString() },
            summary: {
                ...current.summary,
                variationTresorerie: round(variationTresorerie),
                debtOldHours: currentDebt.oldHoursDebt,
                debtNewCourses: currentDebt.newCoursesDebt,
                debtOldValue: currentDebt.oldHoursDebtValue,
                debtNewValue: currentDebt.newCoursesDebtValue,
                debtValue: currentDebt.debtValue
            },
            previous: previousData.summary,
            indicators,
            sig2025: SIG_2025,
            assumptions,
            trend,
            details: {
                encaissements: current.invoices,
                decaissements: buildDecaissementRows(current, assumptions),
                soldeTresorerieDisponible: [
                    { label: 'Encaissements', amount: current.summary.encaissements },
                    { label: 'Decaissements', amount: -current.summary.decaissements },
                    { label: 'Solde disponible', amount: current.summary.encaissements - current.summary.decaissements }
                ],
                variationTresorerie: [
                    { label: 'Solde du mois precedent', amount: previousData.summary.soldeTresorerieDisponible },
                    { label: 'Solde du mois courant', amount: current.summary.soldeTresorerieDisponible },
                    { label: 'Variation', amount: variationTresorerie }
                ],
                creditTvaEstime: [
                    { label: 'TVA deductible sur charges eligibles', amount: current.summary.vatDeductible },
                    { label: 'TVA collectee sur ventes', amount: -current.summary.vatCollected },
                    { label: 'Credit TVA estime', amount: current.summary.creditTvaEstime }
                ],
                valeurAjoutee: [
                    { label: 'Encaissements', amount: current.summary.encaissements },
                    { label: 'Charges externes', amount: -current.summary.externalCharges },
                    { label: 'Valeur ajoutee', amount: current.summary.valeurAjoutee }
                ],
                ebe: [
                    { label: 'Valeur ajoutee', amount: current.summary.valeurAjoutee },
                    { label: 'Salaires Eric + Elodie', amount: -current.summary.salaryCharges },
                    { label: 'Bonus moniteurs', amount: -current.summary.bonusCharges },
                    { label: "EBE (Excedent brut d'exploitation)", amount: current.summary.ebe }
                ],
                dettePedagogique: currentDebt.rows,
                resultatExploitation: [
                    { label: 'EBE', amount: current.summary.ebe },
                    { label: 'Dotations amortissements', amount: -assumptions.depreciationMonthly },
                    { label: 'Resultat exploitation', amount: current.summary.resultatExploitation }
                ],
                resultatNet: [
                    { label: 'Resultat exploitation', amount: current.summary.resultatExploitation },
                    { label: 'Charges exceptionnelles', amount: -assumptions.exceptionalChargesMonthly },
                    { label: 'Resultat net estime', amount: current.summary.resultatNet }
                ]
            },
            invoices: current.invoices,
            expenseCount: current.expenses.length,
            invoiceCount: current.invoices.length
        });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('admin-accounting-data:', error);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'ACCOUNTING_LOAD_FAILED' });
    }
};

exports._test = { dedupeInvoices };
