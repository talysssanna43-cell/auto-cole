const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function parseDate(value, fallback) {
    const date = new Date(value || fallback);
    return Number.isNaN(date.getTime()) ? new Date(fallback) : date;
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

function monthBounds(params = {}) {
    const now = new Date();
    const fallbackStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const fallbackEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const start = parseDate(params.start, fallbackStart.toISOString());
    const end = parseDate(params.end, fallbackEnd.toISOString());
    if (end <= start) return { start, end: fallbackEnd };
    return { start, end };
}

function countWeekdays(start, end) {
    let count = 0;
    const cursor = new Date(start);
    cursor.setHours(12, 0, 0, 0);
    const limit = new Date(end);
    limit.setHours(12, 0, 0, 0);
    while (cursor < limit) {
        const day = cursor.getDay();
        if (day >= 1 && day <= 5) count += 1;
        cursor.setDate(cursor.getDate() + 1);
    }
    return count;
}

function countOpenDays(start, end) {
    let count = 0;
    const cursor = new Date(start);
    cursor.setHours(12, 0, 0, 0);
    const limit = new Date(end);
    limit.setHours(12, 0, 0, 0);
    while (cursor < limit) {
        count += 1;
        cursor.setDate(cursor.getDate() + 1);
    }
    return count;
}

function hoursBetween(startAt, endAt) {
    const start = new Date(startAt).getTime();
    const end = new Date(endAt).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
    return (end - start) / 3600000;
}

function normaliseName(value) {
    return String(value || '').trim() || 'Non attribue';
}

function normaliseKey(value) {
    return String(value || '').trim().toLowerCase();
}

function isMissingColumnError(error) {
    const message = String(error?.message || '').toLowerCase();
    return error?.code === 'PGRST204' || message.includes('monthly_salary_charges') || message.includes('schema cache');
}

function isMissingSettingsTableError(error) {
    const message = String(error?.message || '').toLowerCase();
    return error?.code === '42P01' || error?.code === 'PGRST205' || message.includes('profitability_settings');
}

function moneyValue(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function isExcludedInstructor(value) {
    return normaliseKey(value) === 'sammy';
}

const STAFF_SALARY_START = Object.freeze({ year: 2026, month: 9 });

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

function staffSalaryApplies(start) {
    const { year, month } = parisYearMonth(start);
    return year > STAFF_SALARY_START.year || (year === STAFF_SALARY_START.year && month >= STAFF_SALARY_START.month);
}

function usesDeferredStaffSalary(instructorName) {
    const key = normaliseKey(instructorName)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    return key === 'eric' || key === 'elodie';
}

const VEHICLES = Object.freeze([
    { id: 'c3-1', name: 'C3 N°1 EW-426-SR', transmission: 'manual', label: 'BM', hourlyRate: 45, monthlyInsurance: 1500 },
    { id: 'c3-2', name: 'C3 N°2 permis', transmission: 'manual', label: 'BM', hourlyRate: 45, monthlyInsurance: 1500 },
    { id: 'c4', name: 'C4', transmission: 'auto', label: 'BA', hourlyRate: 50, monthlyInsurance: 1500 }
]);

function normaliseVehicleText(value) {
    return normaliseKey(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w]+/g, ' ')
        .trim();
}

function vehicleFromText(value) {
    const text = normaliseVehicleText(value);
    if (!text) return null;
    if (text.includes('ew 426 sr') || text.includes('c3 n 1') || text.includes('c3 1')) return VEHICLES[0];
    if (text.includes('c3 n 2') || text.includes('c3 2') || (text.includes('c3') && text.includes('permis'))) return VEHICLES[1];
    if (text.includes('c4')) return VEHICLES[2];
    return null;
}

function vehicleForSlot(slot, index = 0) {
    const explicit = vehicleFromText([
        slot.vehicle,
        slot.vehicule,
        slot.vehicle_name,
        slot.vehicle_plate,
        slot.notes
    ].filter(Boolean).join(' '));
    if (explicit) return explicit;

    const transmission = normaliseKey(slot.transmission_type || slot.transmission || slot.gearbox);
    if (transmission.includes('auto') || transmission === 'ba') return VEHICLES[2];

    const instructor = normaliseKey(slot.instructor).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (instructor === 'elodie') return VEHICLES[0];
    if (instructor === 'eric') return VEHICLES[1];

    const manualVehicles = VEHICLES.filter((vehicle) => vehicle.transmission === 'manual');
    return manualVehicles[index % manualVehicles.length] || VEHICLES[0];
}

function vehicleForExpense(expense) {
    return vehicleFromText([
        expense.vehicle,
        expense.vehicule,
        expense.vehicle_name,
        expense.vehicle_plate,
        expense.plaque,
        expense.motif,
        expense.notes
    ].filter(Boolean).join(' '));
}

function monthlyChargeModel(config = 2200) {
    const source = typeof config === 'object' && config !== null ? config : { salaryAndSocialCharges: config };
    const vehiclesCount = 3;
    const monitoredCount = vehiclesCount;
    const salaryCharges = moneyValue(source.salaryAndSocialCharges ?? source.salary_and_social_charges, 2200);
    const vehicleInsurance = moneyValue(source.vehicleInsurance ?? source.vehicle_insurance, 0);
    const entoriaShare = moneyValue(source.entoriaShare ?? source.entoria_share, 2700 / 12 / monitoredCount);
    const parkingShare = moneyValue(source.parkingShare ?? source.parking_share, 3000 / 12 / vehiclesCount);
    const maintenanceShare = moneyValue(source.maintenanceShare ?? source.maintenance_share, 5687 / 12 / vehiclesCount);
    const extraFixedCharges = moneyValue(source.extraFixedCharges ?? source.extra_fixed_charges, 0);
    const fixedCharges = salaryCharges + entoriaShare + parkingShare + maintenanceShare + extraFixedCharges;

    return {
        vehiclesCount,
        monitoredCount,
        salaryAndSocialCharges: Number(salaryCharges.toFixed(2)),
        vehicleInsurance: Number(vehicleInsurance.toFixed(2)),
        entoriaShare: Number(entoriaShare.toFixed(2)),
        parkingShare: Number(parkingShare.toFixed(2)),
        maintenanceShare: Number(maintenanceShare.toFixed(2)),
        extraFixedCharges: Number(extraFixedCharges.toFixed(2)),
        fixedCharges: Number(fixedCharges.toFixed(2))
    };
}

async function fetchActiveInstructors(supabase) {
    try {
        return await fetchAll(() => supabase
            .from('instructors')
            .select('prenom, nom, email, is_active, monthly_salary_charges')
            .eq('is_active', true)
            .order('prenom', { ascending: true }));
    } catch (error) {
        if (!isMissingColumnError(error)) throw error;
        return fetchAll(() => supabase
            .from('instructors')
            .select('prenom, nom, email, is_active')
            .eq('is_active', true)
            .order('prenom', { ascending: true }));
    }
}

async function fetchProfitabilitySettings(supabase, endIso) {
    try {
        return await fetchAll(() => supabase
            .from('instructor_profitability_settings')
            .select('*')
            .lt('effective_date', endIso.slice(0, 10))
            .order('effective_date', { ascending: true }));
    } catch (error) {
        if (isMissingSettingsTableError(error)) return [];
        throw error;
    }
}

function daysBetween(start, end) {
    return Math.max(0, (startOfDay(end).getTime() - startOfDay(start).getTime()) / 86400000);
}

function startOfDay(value) {
    const d = new Date(value);
    d.setHours(0, 0, 0, 0);
    return d;
}

function settingFromRow(row, fallbackSalary = 2200) {
    return {
        effectiveDate: row?.effective_date || null,
        hoursPerDay: moneyValue(row?.hours_per_day, 10),
        salaryAndSocialCharges: moneyValue(row?.salary_and_social_charges, fallbackSalary),
        vehicleInsurance: moneyValue(row?.vehicle_insurance, 0),
        entoriaShare: moneyValue(row?.entoria_share, 75),
        parkingShare: moneyValue(row?.parking_share, 83.33),
        maintenanceShare: moneyValue(row?.maintenance_share, 157.97),
        extraFixedCharges: moneyValue(row?.extra_fixed_charges, 0)
    };
}

function resolveMonthlySettings(baseSetting, settings, start, end) {
    const monthDays = Math.max(1, daysBetween(start, end));
    const sorted = settings
        .filter((setting) => setting.effectiveDate && startOfDay(setting.effectiveDate) < end)
        .sort((a, b) => startOfDay(a.effectiveDate) - startOfDay(b.effectiveDate));

    let active = baseSetting;
    sorted.forEach((setting) => {
        if (startOfDay(setting.effectiveDate) <= start) active = setting;
    });

    const segments = [];
    let cursor = startOfDay(start);
    sorted.forEach((setting) => {
        const effective = startOfDay(setting.effectiveDate);
        if (effective <= start || effective >= end) return;
        segments.push({ start: cursor, end: effective, setting: active });
        active = setting;
        cursor = effective;
    });
    segments.push({ start: cursor, end: startOfDay(end), setting: active });

    let capacityHours = 0;
    let fixedCharges = 0;
    segments.forEach((segment) => {
        const segmentDays = daysBetween(segment.start, segment.end);
        const model = monthlyChargeModel(segment.setting);
        capacityHours += countWeekdays(segment.start, segment.end) * segment.setting.hoursPerDay;
        fixedCharges += model.fixedCharges * (segmentDays / monthDays);
    });

    const current = active;
    const currentModel = monthlyChargeModel(current);
    return {
        ...current,
        capacityHours: Number(capacityHours.toFixed(2)),
        fixedCharges: Number(fixedCharges.toFixed(2)),
        currentChargeModel: currentModel
    };
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (!['GET', 'POST'].includes(event.httpMethod)) {
        return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
    }

    try {
        const session = verifySession(getBearerToken(event), ['admin']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        if (event.httpMethod === 'POST') {
            const body = parseJsonBody(event);
            if (!body) return response(400, { ok: false, error: 'INVALID_JSON' });

            const instructorName = normaliseName(body.instructor_name);
            const motif = String(body.motif || '').trim();
            const montant = Number(body.montant);
            const date = String(body.date || '').trim();
            const photoUrl = String(body.photo_url || '').trim() || null;

            if (!motif || !Number.isFinite(montant) || montant <= 0 || !date) {
                return response(400, { ok: false, error: 'INVALID_EXPENSE' });
            }

            const { data, error } = await supabase
                .from('expenses')
                .insert({
                    instructor_name: instructorName === 'Non attribue' ? null : instructorName,
                    motif,
                    montant,
                    date,
                    photo_url: photoUrl
                })
                .select('*')
                .single();

            if (error) throw error;
            return response(200, { ok: true, expense: data });
        }

        const { start, end } = monthBounds(event.queryStringParameters || {});
        const hourlyRate = Math.max(0, Number(event.queryStringParameters?.hourlyRate || 45));
        const startIso = start.toISOString();
        const endIso = end.toISOString();
        const weekdays = countWeekdays(start, end);
        const openDays = countOpenDays(start, end);
        const capacityHours = weekdays * 10;
        const vehicleCapacityHours = openDays * 12;

        const [instructors, slots, expenses, bonuses, settingsRows] = await Promise.all([
            fetchActiveInstructors(supabase),
            fetchAll(() => supabase
                .from('slots')
                .select('id, start_at, end_at, status, instructor, notes')
                .gte('start_at', startIso)
                .lt('start_at', endIso)
                .order('start_at', { ascending: true })),
            fetchAll(() => supabase
                .from('expenses')
                .select('id, motif, montant, date, created_at, instructor_name, photo_url')
                .gte('date', startIso.slice(0, 10))
                .lt('date', endIso.slice(0, 10))
                .order('date', { ascending: false })),
            fetchAll(() => supabase
                .from('instructor_bonuses')
                .select('id, instructor, bonus_amount, status, period_start, period_end, updated_at, created_at')
                .order('updated_at', { ascending: false })),
            fetchProfitabilitySettings(supabase, endIso)
        ]);

        const byInstructor = new Map();
        const aliases = new Map();
        const settingsByInstructor = new Map();

        function registerAlias(alias, canonical) {
            const key = normaliseKey(alias);
            if (key) aliases.set(key, canonical);
        }

        settingsRows.forEach((row) => {
            const key = normaliseKey(row.instructor_name);
            if (!key) return;
            if (!settingsByInstructor.has(key)) settingsByInstructor.set(key, []);
            settingsByInstructor.get(key).push(settingFromRow(row));
        });

        const planningInstructors = [
            { prenom: 'Nail', nom: '', email: null, monthly_salary_charges: 2200 },
            { prenom: 'Daho', nom: '', email: null, monthly_salary_charges: 2200 }
        ];

        [...planningInstructors, ...instructors].forEach((item) => {
            const canonical = normaliseName(item.prenom || item.nom || item.email);
            if (isExcludedInstructor(canonical)) return;
            const canonicalKey = normaliseKey(canonical);
            const salaryFallback = usesDeferredStaffSalary(canonical) && !staffSalaryApplies(start)
                ? 0
                : item.monthly_salary_charges;
            const baseSetting = settingFromRow(null, salaryFallback);
            const monthlySettings = resolveMonthlySettings(baseSetting, settingsByInstructor.get(canonicalKey) || [], start, end);
            const deferredSalaryInactive = usesDeferredStaffSalary(canonical) && !staffSalaryApplies(start);
            const fixedChargesOverride = deferredSalaryInactive
                ? Math.max(0, monthlySettings.fixedCharges - monthlySettings.salaryAndSocialCharges)
                : monthlySettings.fixedCharges;
            const salaryAndSocialCharges = deferredSalaryInactive ? 0 : monthlySettings.salaryAndSocialCharges;
            byInstructor.set(canonical, {
                instructor: canonical,
                fullName: normaliseName(`${item.prenom || ''} ${item.nom || ''}`),
                email: item.email || null,
                salaryAndSocialCharges,
                fixedChargeModel: monthlySettings.currentChargeModel,
                capacityHours: monthlySettings.capacityHours,
                fixedChargesOverride,
                hoursPerDay: monthlySettings.hoursPerDay,
                vehicleInsurance: monthlySettings.vehicleInsurance,
                extraFixedCharges: monthlySettings.extraFixedCharges,
                hours: 0,
                slots: 0,
                revenue: 0,
                expenses: 0,
                bonuses: 0,
                profitability: 0,
                expenseRows: []
            });
            registerAlias(item.prenom, canonical);
            registerAlias(`${item.prenom || ''} ${item.nom || ''}`, canonical);
            registerAlias(item.email, canonical);
        });

        function ensure(name) {
            if (isExcludedInstructor(name)) return null;
            const key = normaliseKey(name);
            const canonical = aliases.get(key);
            if (!canonical) return null;
            return byInstructor.get(canonical) || null;
        }

        function unknownRow() {
            if (!byInstructor.has('Non attribue')) {
                byInstructor.set('Non attribue', {
                    instructor: 'Non attribue',
                    fullName: 'Non attribue',
                    email: null,
                    salaryAndSocialCharges: 0,
                    fixedChargeModel: monthlyChargeModel(0),
                    hours: 0,
                    slots: 0,
                    revenue: 0,
                    expenses: 0,
                    bonuses: 0,
                    profitability: 0,
                    expenseRows: []
                });
            }
            return byInstructor.get('Non attribue');
        }

        const nowMs = Date.now();
        const vehicleRows = new Map(VEHICLES.map((vehicle) => [vehicle.id, {
            ...vehicle,
            capacityHours: vehicleCapacityHours,
            hours: 0,
            slots: 0,
            revenue: 0,
            expenses: 0,
            insurance: vehicle.monthlyInsurance,
            totalCharges: vehicle.monthlyInsurance,
            profitability: 0,
            breakEvenHours: 0,
            activityRate: 0,
            expenseRows: []
        }]));

        slots
            .filter((slot) => ['booked', 'done', 'completed'].includes(String(slot.status || '').toLowerCase()))
            .filter((slot) => new Date(slot.start_at).getTime() <= nowMs)
            .forEach((slot, index) => {
                const slotHours = hoursBetween(slot.start_at, slot.end_at);
                const row = ensure(slot.instructor);
                if (!row) return;
                row.slots += 1;
                row.hours += slotHours;

                const vehicle = vehicleForSlot(slot, index);
                const vehicleRow = vehicleRows.get(vehicle.id);
                if (vehicleRow) {
                    vehicleRow.slots += 1;
                    vehicleRow.hours += slotHours;
                    vehicleRow.revenue += slotHours * vehicle.hourlyRate;
                }
            });

        expenses.forEach((expense) => {
            const row = ensure(expense.instructor_name) || (!expense.instructor_name ? unknownRow() : null);
            const amount = Number(expense.montant || 0);
            if (row) {
                row.expenses += amount;
                row.expenseRows.push({ ...expense, montant: amount });
            }

            const vehicle = vehicleForExpense(expense);
            const vehicleRow = vehicle ? vehicleRows.get(vehicle.id) : null;
            if (vehicleRow) {
                vehicleRow.expenses += amount;
                vehicleRow.expenseRows.push({ ...expense, montant: amount });
            }
        });

        bonuses.forEach((bonus) => {
            const bonusDate = new Date(bonus.period_end || bonus.updated_at || bonus.created_at);
            if (Number.isNaN(bonusDate.getTime()) || bonusDate < start || bonusDate >= end) return;
            const amount = Number(bonus.bonus_amount || 0);
            if (amount <= 0) return;
            const row = ensure(bonus.instructor);
            if (!row) return;
            row.bonuses += amount;
        });

        const chargeModel = monthlyChargeModel();

        const rows = Array.from(byInstructor.values()).map((row) => {
            const revenue = row.hours * hourlyRate;
            const fixedCharges = row.instructor === 'Non attribue' ? 0 : row.fixedChargesOverride;
            const totalCharges = fixedCharges + row.expenses + row.bonuses;
            const profit = revenue - totalCharges;
            const rowCapacityHours = row.capacityHours ?? capacityHours;
            const activityRate = rowCapacityHours > 0 ? (row.hours / rowCapacityHours) * 100 : 0;
            const breakEvenHours = hourlyRate > 0 ? totalCharges / hourlyRate : 0;
            return {
                ...row,
                hours: Number(row.hours.toFixed(2)),
                capacityHours: rowCapacityHours,
                weekdays,
                activityRate: Number(activityRate.toFixed(1)),
                salaryAndSocialCharges: row.salaryAndSocialCharges,
                hoursPerDay: row.hoursPerDay || 10,
                vehicleInsurance: row.vehicleInsurance || 0,
                extraFixedCharges: row.extraFixedCharges || 0,
                fixedCharges: Number(fixedCharges.toFixed(2)),
                bonusCharges: Number(row.bonuses.toFixed(2)),
                totalCharges: Number(totalCharges.toFixed(2)),
                breakEvenHours: Number(breakEvenHours.toFixed(2)),
                revenue: Number(revenue.toFixed(2)),
                expenses: Number(row.expenses.toFixed(2)),
                profitability: Number(profit.toFixed(2))
            };
        }).sort((a, b) => b.profitability - a.profitability);

        const vehicles = Array.from(vehicleRows.values()).map((row) => {
            const totalCharges = row.insurance + row.expenses;
            const profit = row.revenue - totalCharges;
            const breakEvenHours = row.hourlyRate > 0 ? totalCharges / row.hourlyRate : 0;
            const activityRate = row.capacityHours > 0 ? (row.hours / row.capacityHours) * 100 : 0;
            return {
                ...row,
                openDays,
                hours: Number(row.hours.toFixed(2)),
                revenue: Number(row.revenue.toFixed(2)),
                expenses: Number(row.expenses.toFixed(2)),
                totalCharges: Number(totalCharges.toFixed(2)),
                profitability: Number(profit.toFixed(2)),
                breakEvenHours: Number(breakEvenHours.toFixed(2)),
                activityRate: Number(activityRate.toFixed(1))
            };
        }).sort((a, b) => b.profitability - a.profitability);

        const instructorTotals = {
            hours: Number(rows.reduce((sum, row) => sum + row.hours, 0).toFixed(2)),
            revenue: Number(rows.reduce((sum, row) => sum + row.revenue, 0).toFixed(2)),
            expenses: Number(rows.reduce((sum, row) => sum + row.totalCharges, 0).toFixed(2)),
            profitability: Number(rows.reduce((sum, row) => sum + row.profitability, 0).toFixed(2))
        };

        const vehicleTotals = {
            hours: Number(vehicles.reduce((sum, row) => sum + row.hours, 0).toFixed(2)),
            revenue: Number(vehicles.reduce((sum, row) => sum + row.revenue, 0).toFixed(2)),
            expenses: Number(vehicles.reduce((sum, row) => sum + row.totalCharges, 0).toFixed(2)),
            profitability: Number(vehicles.reduce((sum, row) => sum + row.profitability, 0).toFixed(2))
        };

        return response(200, {
            ok: true,
            range: { start: startIso, end: endIso },
            hourlyRate,
            capacity: {
                weekdays,
                openDays,
                dailyHours: 10,
                hours: capacityHours,
                vehicleDailyHours: 12,
                vehicleHours: vehicleCapacityHours
            },
            charges: chargeModel,
            rows,
            vehicles,
            totals: {
                instructors: instructorTotals,
                vehicles: vehicleTotals,
                hours: Number((instructorTotals.hours + vehicleTotals.hours).toFixed(2)),
                revenue: Number((instructorTotals.revenue + vehicleTotals.revenue).toFixed(2)),
                expenses: Number((instructorTotals.expenses + vehicleTotals.expenses).toFixed(2)),
                profitability: Number((instructorTotals.profitability + vehicleTotals.profitability).toFixed(2))
            }
        });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('admin-profitability-data:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'PROFITABILITY_LOAD_FAILED' });
    }
};

