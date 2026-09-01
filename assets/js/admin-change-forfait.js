// ===== CHANGEMENT DE FORFAIT ELEVE =====

const changeForfaitCatalog = Object.freeze({
    'tarif-chill-5': { label: 'Chill boite manuelle', price: 249, courses: 5, transmission: 'manual', group: 'Permis Chill' },
    'tarif-chill-10': { label: 'Chill boite manuelle', price: 499, courses: 10, transmission: 'manual', group: 'Permis Chill' },
    'tarif-chill-20': { label: 'Chill boite manuelle', price: 649, courses: 20, transmission: 'manual', group: 'Permis Chill' },
    'tarif-chill-30': { label: 'Chill boite manuelle', price: 1149, courses: 30, transmission: 'manual', group: 'Permis Chill' },
    'tarif-premium-5': { label: 'Premium boite manuelle', price: 395, courses: 5, transmission: 'manual', group: 'Permis Premium' },
    'tarif-premium-10': { label: 'Premium boite manuelle', price: 599, courses: 10, transmission: 'manual', group: 'Permis Premium' },
    'tarif-premium-20': { label: 'Premium boite manuelle', price: 749, courses: 20, transmission: 'manual', group: 'Permis Premium' },
    'tarif-premium-30': { label: 'Premium boite manuelle', price: 1249, courses: 30, transmission: 'manual', group: 'Permis Premium' },
    'tarif-accelere-5': { label: 'Accelere boite manuelle', price: 499, courses: 5, transmission: 'manual', group: 'Permis Accelere' },
    'tarif-accelere-10': { label: 'Accelere boite manuelle', price: 749, courses: 10, transmission: 'manual', group: 'Permis Accelere' },
    'tarif-accelere-20': { label: 'Accelere boite manuelle', price: 899, courses: 20, transmission: 'manual', group: 'Permis Accelere' },
    'tarif-accelere-30': { label: 'Accelere boite manuelle', price: 1399, courses: 30, transmission: 'manual', group: 'Permis Accelere' },
    'tarif-chill-auto-5': { label: 'Chill boite automatique', price: 269, courses: 5, transmission: 'auto', group: 'Chill BA' },
    'tarif-chill-auto-13': { label: 'Chill boite automatique', price: 499, courses: 13, transmission: 'auto', group: 'Chill BA' },
    'tarif-premium-auto-5': { label: 'Premium boite automatique', price: 379, courses: 5, transmission: 'auto', group: 'Premium BA' },
    'tarif-premium-auto-13': { label: 'Premium boite automatique', price: 599, courses: 13, transmission: 'auto', group: 'Premium BA' },
    'tarif-accelere-auto-5': { label: 'Accelere boite automatique', price: 499, courses: 5, transmission: 'auto', group: 'Accelere BA' },
    'tarif-accelere-auto-13': { label: 'Accelere boite automatique', price: 749, courses: 13, transmission: 'auto', group: 'Accelere BA' },
    'tarif-aac-20': { label: 'Conduite accompagnee', price: 889, courses: 20, transmission: 'manual', group: 'AAC' },
    'tarif-supervisee-20': { label: 'Conduite supervisee', price: 889, courses: 20, transmission: 'manual', group: 'Supervisee' },
    'tarif-aac-auto-13': { label: 'AAC boite automatique', price: 639, courses: 13, transmission: 'auto', group: 'AAC BA' },
    'tarif-supervisee-auto-13': { label: 'Supervisee boite automatique', price: 639, courses: 13, transmission: 'auto', group: 'Supervisee BA' },
    code: { label: 'Code classique', price: 20, courses: 0, transmission: 'none', group: 'Code' },
    'code-etudiant': { label: 'Code etudiant', price: 15, courses: 0, transmission: 'none', group: 'Code' },
    am: { label: 'Voiture sans permis AM', price: 350, courses: 8, transmission: 'auto', group: 'AM' },
    'second-chance': { label: 'Forfait Second Chance', price: 569, courses: 6, transmission: 'manual', group: 'Second Chance' },
    'boite-auto': { label: 'Chill boite automatique', price: 499, courses: 13, transmission: 'auto', group: 'Ancien alias' },
    '20h': { label: 'Chill boite manuelle', price: 649, courses: 20, transmission: 'manual', group: 'Ancien alias' },
    chill: { label: 'Chill boite manuelle', price: 649, courses: 20, transmission: 'manual', group: 'Ancien alias' },
    zen: { label: 'Chill boite manuelle', price: 649, courses: 20, transmission: 'manual', group: 'Ancien alias' },
    accelere: { label: 'Accelere boite manuelle', price: 899, courses: 20, transmission: 'manual', group: 'Ancien alias' },
    aac: { label: 'Conduite accompagnee', price: 889, courses: 20, transmission: 'manual', group: 'Ancien alias' },
    supervisee: { label: 'Conduite supervisee', price: 889, courses: 20, transmission: 'manual', group: 'Ancien alias' }
});

function changeForfaitEuro(value) {
    return `${Number(value || 0).toLocaleString('fr-FR')} EUR`;
}

function selectedChangeForfaitPack() {
    const selected = document.querySelector('.change-pack-card.selected');
    return selected ? selected.dataset.pack : null;
}

function renderChangeForfaitSummary(doneCourses) {
    const packId = selectedChangeForfaitPack();
    const currentPackId = document.getElementById('changeForfaitCurrentPack')?.value || '';
    const summary = document.getElementById('changeForfaitSummary');
    const confirmBtn = document.getElementById('confirmChangeForfait');
    if (!summary || !confirmBtn) return;

    const nextPack = changeForfaitCatalog[packId];
    const currentPack = changeForfaitCatalog[currentPackId] || { price: 0, courses: 0, label: currentPackId || 'Forfait actuel' };
    if (!nextPack) {
        summary.innerHTML = '';
        confirmBtn.disabled = true;
        return;
    }

    const alreadyDone = Math.max(0, Number(doneCourses || 0));
    const remainingAfter = Math.max(0, nextPack.courses - alreadyDone);
    const amountDue = Math.max(0, nextPack.price - Number(currentPack.price || 0));
    const sameOrLower = nextPack.price <= Number(currentPack.price || 0);

    summary.innerHTML = `
        <div class="change-forfait-summary">
            <div><span>Forfait actuel</span><strong>${currentPack.label}</strong></div>
            <div><span>Nouveau forfait</span><strong>${nextPack.label} - ${nextPack.courses} cours</strong></div>
            <div><span>Cours deja realises</span><strong>${alreadyDone}</strong></div>
            <div><span>Cours restants apres changement</span><strong>${remainingAfter}</strong></div>
            <div class="${amountDue > 0 ? 'due' : 'free'}">
                <span>${amountDue > 0 ? 'Difference a regler' : 'Complement a regler'}</span>
                <strong>${changeForfaitEuro(amountDue)}</strong>
            </div>
        </div>
        <p class="change-forfait-note">
            Les cours deja realises restent deduits du nouveau pack. ${sameOrLower ? "Aucun remboursement automatique n'est applique." : "Confirme seulement une fois la difference reglee."}
        </p>
    `;
    confirmBtn.disabled = false;
}

window.openChangeForfaitModal = function(email, prenom, nom, currentForfait, coursEffectues) {
    let modal = document.getElementById('changeForfaitModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'changeForfaitModal';
        modal.className = 'student-details-modal';
        document.body.appendChild(modal);
    }

    const doneCourses = Math.max(0, Number(coursEffectues || 0));
    const currentPack = changeForfaitCatalog[currentForfait] || { label: currentForfait || 'Non defini', price: 0 };
    const safeEmail = String(email || '').replace(/'/g, '&#39;');
    const cards = Object.entries(changeForfaitCatalog)
        .filter(([id]) => id.startsWith('tarif-') || ['code', 'code-etudiant', 'am', 'second-chance'].includes(id))
        .map(([id, pack]) => `
            <button type="button" class="change-pack-card" data-pack="${id}">
                <span>${pack.group}</span>
                <strong>${pack.label}</strong>
                <small>${pack.courses} cours</small>
                <b>${changeForfaitEuro(pack.price)}</b>
            </button>
        `).join('');

    modal.innerHTML = `
        <div class="student-details-content change-forfait-content">
            <div class="student-details-header">
                <h2><i class="fas fa-exchange-alt"></i> Changer de forfait</h2>
                <button class="close-btn" onclick="closeChangeForfaitModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="student-details-body">
                <input type="hidden" id="changeForfaitCurrentPack" value="${String(currentForfait || '').replace(/"/g, '&quot;')}">
                <div class="change-forfait-student">
                    <div>
                        <span>Eleve</span>
                        <strong>${prenom || ''} ${nom || ''}</strong>
                        <small>${email}</small>
                    </div>
                    <div>
                        <span>Forfait actuel</span>
                        <strong>${currentPack.label}</strong>
                        <small>${changeForfaitEuro(currentPack.price)}</small>
                    </div>
                    <div>
                        <span>Deja realise</span>
                        <strong>${doneCourses} cours</strong>
                        <small>conserve dans le nouveau calcul</small>
                    </div>
                </div>

                <h3 class="change-forfait-title">Choisir le nouveau pack</h3>
                <div class="change-pack-grid">${cards}</div>
                <div id="changeForfaitSummary"></div>

                <div class="change-forfait-actions">
                    <button type="button" class="btn-secondary" onclick="closeChangeForfaitModal()">Annuler</button>
                    <button type="button" id="confirmChangeForfait" class="btn-primary" onclick="confirmChangeForfait('${safeEmail}', ${doneCourses})" disabled>
                        <i class="fas fa-check"></i> Confirmer apres reglement
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
    document.querySelectorAll('.change-pack-card').forEach((card) => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.change-pack-card').forEach((item) => item.classList.remove('selected'));
            card.classList.add('selected');
            renderChangeForfaitSummary(doneCourses);
        });
    });
};

window.closeChangeForfaitModal = function() {
    const modal = document.getElementById('changeForfaitModal');
    if (modal) modal.style.display = 'none';
};

window.confirmChangeForfait = async function(email, coursEffectues) {
    const newPack = selectedChangeForfaitPack();
    if (!newPack) {
        alert('Selectionne un nouveau forfait.');
        return;
    }

    const confirmBtn = document.getElementById('confirmChangeForfait');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';

    try {
        const token = window.authSession?.getToken?.();
        if (!token) throw new Error('AUTH_REQUIRED');

        const response = await fetch('/.netlify/functions/admin-change-forfait', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                new_pack: newPack,
                completed_courses: Number(coursEffectues || 0)
            }),
            cache: 'no-store'
        });
        const payload = await response.json().catch(() => ({ ok: false, error: 'INVALID_SERVER_RESPONSE' }));
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'CHANGE_FORFAIT_FAILED');

        const info = payload.change || {};
        alert(
            `Forfait change avec succes.\n\n` +
            `Difference facturee : ${changeForfaitEuro(info.amount_due || 0)}\n` +
            `Cours restants : ${info.remaining_courses_after_change ?? 0}`
        );

        closeChangeForfaitModal();
        if (typeof window.displayStudentDetails === 'function' && payload.student) {
            await window.displayStudentDetails(payload.student);
        }
        if (typeof window.refresh === 'function') await window.refresh();
    } catch (error) {
        console.error('Erreur changement forfait:', error);
        alert("Impossible de changer le forfait : " + error.message);
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-check"></i> Confirmer apres reglement';
    }
};

const changeForfaitStyle = document.createElement('style');
changeForfaitStyle.textContent = `
    .change-forfait-content { max-width: 980px; }
    .change-forfait-student,
    .change-forfait-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
        gap: 0.8rem;
        margin-bottom: 1.2rem;
    }
    .change-forfait-student > div,
    .change-forfait-summary > div {
        background: #f7f9fc;
        border: 1px solid #e8edf5;
        border-radius: 12px;
        padding: 0.9rem;
    }
    .change-forfait-student span,
    .change-forfait-summary span {
        display: block;
        color: #6b7280;
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 0.35rem;
    }
    .change-forfait-student strong,
    .change-forfait-summary strong {
        display: block;
        color: #111827;
        font-size: 1.05rem;
    }
    .change-forfait-student small {
        display: block;
        color: #6b7280;
        margin-top: 0.25rem;
    }
    .change-forfait-title {
        color: #111827;
        margin: 1.2rem 0 0.9rem;
    }
    .change-pack-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 0.85rem;
        max-height: 340px;
        overflow: auto;
        padding: 0.2rem;
    }
    .change-pack-card {
        text-align: left;
        border: 2px solid #e5e7eb;
        background: #fff;
        border-radius: 14px;
        padding: 0.95rem;
        cursor: pointer;
        transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .change-pack-card:hover,
    .change-pack-card.selected {
        border-color: #ff5bb8;
        box-shadow: 0 10px 24px rgba(255, 91, 184, 0.16);
        transform: translateY(-2px);
    }
    .change-pack-card span {
        color: #ff5bb8;
        display: block;
        font-size: 0.78rem;
        font-weight: 800;
        text-transform: uppercase;
    }
    .change-pack-card strong {
        display: block;
        color: #111827;
        margin: 0.35rem 0;
    }
    .change-pack-card small {
        color: #6b7280;
        display: block;
    }
    .change-pack-card b {
        color: #12b76a;
        display: block;
        font-size: 1.2rem;
        margin-top: 0.5rem;
    }
    .change-forfait-summary {
        margin-top: 1.2rem;
    }
    .change-forfait-summary .due {
        background: #fff7ed;
        border-color: #fdba74;
    }
    .change-forfait-summary .due strong { color: #ea580c; }
    .change-forfait-summary .free {
        background: #ecfdf3;
        border-color: #86efac;
    }
    .change-forfait-summary .free strong { color: #16a34a; }
    .change-forfait-note {
        background: #eff6ff;
        border-left: 4px solid #0071e3;
        border-radius: 10px;
        color: #1f3b67;
        padding: 0.8rem 1rem;
        margin: 0.8rem 0 0;
        font-weight: 600;
    }
    .change-forfait-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1.6rem;
    }
    .change-forfait-actions button {
        flex: 1;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 800;
        padding: 0.9rem 1rem;
    }
    .change-forfait-actions .btn-secondary {
        background: #f3f4f6;
        color: #374151;
    }
    .change-forfait-actions .btn-primary {
        background: #12b76a;
        color: white;
    }
    .change-forfait-actions .btn-primary:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
`;
document.head.appendChild(changeForfaitStyle);
