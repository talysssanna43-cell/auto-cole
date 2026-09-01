let examDateSearchTimer = null;

function escapeExamDateHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

window.openExamDateModal = function openExamDateModal() {
    const modal = document.getElementById('examDateModal');
    if (!modal) return;
    window.currentExamRequestId = '';
    document.getElementById('examDateForm')?.reset();
    document.getElementById('examDateStudentEmail').value = '';
    document.getElementById('examDateStudentName').value = '';
    document.getElementById('examDateSelectedStudent').style.display = 'none';
    document.getElementById('examDateStudentSuggestions').classList.remove('active');
    modal.style.display = 'flex';
};

window.closeExamDateModal = function closeExamDateModal() {
    const modal = document.getElementById('examDateModal');
    if (modal) modal.style.display = 'none';
};

function buildExamDateIso(date, time) {
    const value = new Date(`${date}T${time}:00`);
    if (Number.isNaN(value.getTime())) return '';
    return value.toISOString();
}

window.searchExamDateStudent = function searchExamDateStudent(value) {
    clearTimeout(examDateSearchTimer);
    const term = String(value || '').trim();
    const box = document.getElementById('examDateStudentSuggestions');
    if (!box || term.length < 2) {
        if (box) box.classList.remove('active');
        return;
    }

    examDateSearchTimer = setTimeout(async () => {
        try {
            const token = window.authSession?.getToken();
            if (!token) throw new Error('AUTH_REQUIRED');

            const response = await fetch(`/.netlify/functions/search-students?q=${encodeURIComponent(term)}`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.ok) throw new Error(result.error || 'STUDENT_SEARCH_FAILED');

            const students = result.students || [];
            if (students.length === 0) {
                box.innerHTML = '<div class="suggestion-item">Aucun élève trouvé</div>';
                box.classList.add('active');
                return;
            }

            box.innerHTML = students.map((student) => {
                const name = student.name || `${student.prenom || ''} ${student.nom || ''}`.trim() || student.email;
                return `
                    <div class="suggestion-item" onclick="selectExamDateStudent('${encodeURIComponent(student.email)}','${encodeURIComponent(name)}')">
                        <strong>${escapeExamDateHtml(name)}</strong>
                        <div class="suggestion-email">${escapeExamDateHtml(student.email)}</div>
                    </div>
                `;
            }).join('');
            box.classList.add('active');
        } catch (error) {
            console.error('Recherche élève examen:', error);
            box.innerHTML = `<div class="suggestion-item">${error.message === 'AUTH_REQUIRED' ? 'Reconnecte-toi à l’espace admin' : 'Erreur de recherche'}</div>`;
            box.classList.add('active');
        }
    }, 250);
};

window.selectExamDateStudent = function selectExamDateStudent(encodedEmail, encodedName) {
    const email = decodeURIComponent(encodedEmail);
    const name = decodeURIComponent(encodedName);
    document.getElementById('examDateStudentEmail').value = email;
    document.getElementById('examDateStudentName').value = name;
    document.getElementById('examDateStudentSearch').value = name;
    const selected = document.getElementById('examDateSelectedStudent');
    selected.textContent = `${name} - ${email}`;
    selected.style.display = 'block';
    document.getElementById('examDateStudentSuggestions').classList.remove('active');
};

window.submitExamDate = async function submitExamDate(event) {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    const original = submitButton.innerHTML;
    const payload = {
        student_email: document.getElementById('examDateStudentEmail').value,
        student_name: document.getElementById('examDateStudentName').value,
        location: document.getElementById('examDateLocation').value,
        exam_date: document.getElementById('examDateDate').value,
        start_time: document.getElementById('examDateStartTime').value,
        end_time: document.getElementById('examDateEndTime').value,
        start_at: buildExamDateIso(document.getElementById('examDateDate').value, document.getElementById('examDateStartTime').value),
        end_at: buildExamDateIso(document.getElementById('examDateDate').value, document.getElementById('examDateEndTime').value),
        instructor: document.getElementById('examDateInstructor').value,
        exam_request_id: window.currentExamRequestId || ''
    };

    if (!payload.student_email || !payload.student_name) {
        alert('Sélectionne un élève dans la liste.');
        return;
    }
    if (!payload.start_at || !payload.end_at || payload.end_at <= payload.start_at) {
        alert("Indique un créneau d'examen valide.");
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';
        const token = window.authSession?.getToken();
        const response = await fetch('/.netlify/functions/create-exam-date', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token || ''}`
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
            const error = new Error(result.error || 'EXAM_DATE_FAILED');
            error.details = result.message || '';
            throw error;
        }
        closeExamDateModal();
        if (typeof window.loadWeekSlots === 'function') {
            window.loadWeekSlots();
        } else if (typeof window.refresh === 'function') {
            window.refresh();
        }
        if (typeof window.loadExamRequests === 'function') {
            window.loadExamRequests();
        }
        window.currentExamRequestId = '';
        alert("Date d'examen enregistrée. Un mail de convocation a été envoyé à l'élève.");
    } catch (error) {
        console.error('Date examen:', error);
        if (error.message === 'EXAM_DATE_TABLE_MISSING') {
            alert("La fonctionnalité date d'examen doit être installée dans Supabase. Ouvre le fichier sql/exam-date-workflow.sql et exécute-le dans l'éditeur SQL Supabase.");
        } else if (error.message === 'EXAM_SLOT_ALREADY_BOOKED') {
            alert("Ce créneau est déjà réservé à un élève. Choisis un autre horaire ou libère le créneau avant d'enregistrer la date d'examen.");
        } else {
            alert("Impossible d'enregistrer la date d'examen. Vérifie les informations puis réessaie.");
        }
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = original;
    }
};
