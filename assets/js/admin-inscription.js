// Vérifier que l'utilisateur est admin
function requireAdmin() {
    const user = JSON.parse(localStorage.getItem('ae_user') || '{}');
    if (!user || !user.email) {
        return { ok: false };
    }
    const adminEmails = ['admin@breteuil.com', 'talysssanna43@gmail.com'];
    if (!adminEmails.includes(user.email.toLowerCase())) {
        return { ok: false };
    }
    return { ok: true, user };
}

function setFeedback(message, type) {
    const feedback = document.getElementById('formFeedback');
    if (!feedback) return;
    
    feedback.textContent = message;
    feedback.className = `form-feedback ${type}`;
    feedback.style.display = message ? 'block' : 'none';
}

async function handleSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const form = event.target;
    
    // Désactiver le bouton
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription en cours...';
    
    setFeedback('Création du compte en cours...', 'info');
    
    try {
        // Récupérer les données du formulaire
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');
        const prenom = formData.get('prenom');
        const nom = formData.get('nom');
        const telephone = formData.get('telephone');
        const dateNaissance = formData.get('dateNaissance');
        const adresse = formData.get('adresse');
        const codePostal = formData.get('codePostal');
        const ville = formData.get('ville');
        const pack = formData.get('pack');
        const permisInvalide = formData.get('permisInvalide');
        
        // Validation
        if (!email || !password || !prenom || !nom || !telephone || !pack) {
            setFeedback('Tous les champs obligatoires doivent être remplis', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Terminer l\'inscription';
            return;
        }
        
        // 1. Créer le compte utilisateur dans Supabase Auth
        const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    prenom: prenom,
                    nom: nom,
                    telephone: telephone
                }
            }
        });
        
        if (authError) {
            console.error('Auth error:', authError);
            setFeedback(`Erreur lors de la création du compte: ${authError.message}`, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Terminer l\'inscription';
            return;
        }
        
        console.log('Auth user created:', authData);
        
        // 2. Insérer dans la table users
        const { error: userError } = await window.supabaseClient
            .from('users')
            .insert({
                email: email,
                prenom: prenom,
                nom: nom,
                telephone: telephone,
                date_naissance: dateNaissance,
                adresse: adresse,
                code_postal: codePostal,
                ville: ville
            });
        
        if (userError) {
            console.error('User insert error:', userError);
            setFeedback(`Erreur lors de l'enregistrement des données: ${userError.message}`, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Terminer l\'inscription';
            return;
        }
        
        console.log('User data inserted');
        
        // 3. Insérer dans inscription_notifications
        const { error: inscriptionError } = await window.supabaseClient
            .from('inscription_notifications')
            .insert({
                user_email: email,
                user_name: `${prenom} ${nom}`,
                user_prenom: prenom,
                user_nom: nom,
                user_telephone: telephone,
                user_date_naissance: dateNaissance,
                user_adresse: adresse,
                user_code_postal: codePostal,
                user_ville: ville,
                pack: pack,
                permis_invalide: permisInvalide === 'oui',
                payment_method: 'cash',
                status: 'pending',
                documents_count: 0,
                created_at: new Date().toISOString()
            });
        
        if (inscriptionError) {
            console.error('Inscription notification error:', inscriptionError);
            setFeedback(`Erreur lors de l'enregistrement de l'inscription: ${inscriptionError.message}`, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Terminer l\'inscription';
            return;
        }
        
        console.log('Inscription notification created');
        
        // Succès !
        setFeedback(`✅ Inscription réussie ! L'élève ${prenom} ${nom} peut maintenant se connecter avec l'email ${email}`, 'success');
        
        // Réinitialiser le formulaire après 2 secondes
        setTimeout(() => {
            form.reset();
            setFeedback('', '');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Terminer l\'inscription';
        }, 3000);
        
    } catch (err) {
        console.error('Unexpected error:', err);
        setFeedback(`Erreur inattendue: ${err.message}`, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Terminer l\'inscription';
    }
}

// Initialisation
(function init() {
    // Vérifier que l'utilisateur est admin
    const check = requireAdmin();
    if (!check.ok) {
        window.location.href = 'connexion.html';
        return;
    }
    
    // Attacher l'événement de soumission
    const form = document.getElementById('adminInscriptionForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
    
    // Gérer la sélection des packs
    const packOptions = document.querySelectorAll('.pack-option');
    packOptions.forEach(option => {
        option.addEventListener('click', function() {
            const radio = this.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });
})();
