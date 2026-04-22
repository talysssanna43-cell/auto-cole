# 🎯 Guide d'intégration PayPal - Paiement en plusieurs fois

## ✅ Ce qui a été fait

### 1. **Fichiers créés**

#### Backend (Netlify Functions)
- `netlify/functions/paypal-config.js` - Récupère le Client ID PayPal
- `netlify/functions/paypal-create-order.js` - Crée une commande PayPal
- `netlify/functions/paypal-capture-order.js` - Capture le paiement

#### Frontend
- `assets/js/paypal-payment.js` - Classe JavaScript pour gérer PayPal
- `test-paypal.html` - Page de test du paiement

#### Configuration
- `.env.example` - Variables d'environnement mises à jour
- `PAYPAL_SETUP.md` - Guide de configuration PayPal

---

## 🚀 Prochaines étapes

### Étape 1 : Configurer PayPal

1. **Créer un compte PayPal Business**
   - Va sur https://www.paypal.com/fr/business
   - Inscris-toi avec les infos de l'auto-école

2. **Obtenir les clés API**
   - Va sur https://developer.paypal.com/
   - Connecte-toi
   - Dashboard → Apps & Credentials
   - Crée une app "Auto-Ecole Breteuil"
   - Note le **Client ID** et le **Secret**

### Étape 2 : Configurer Netlify

1. Va sur https://app.netlify.com
2. Sélectionne ton site
3. Site settings → Environment variables
4. Ajoute ces 3 variables :
   ```
   PAYPAL_CLIENT_ID = ton_client_id_ici
   PAYPAL_CLIENT_SECRET = ton_secret_ici
   PAYPAL_MODE = sandbox (pour test) ou live (pour production)
   ```

### Étape 3 : Tester le paiement

1. Déploie le site sur Netlify (déjà fait avec le push)
2. Va sur `https://ton-site.netlify.app/test-paypal.html`
3. Clique sur le bouton PayPal
4. Utilise un compte PayPal Sandbox pour tester

**Comptes de test PayPal :**
- Crée-les dans https://developer.paypal.com/dashboard/accounts

### Étape 4 : Intégrer dans inscription.html

Maintenant que PayPal fonctionne, il faut l'ajouter au formulaire d'inscription.

#### Option 1 : Ajouter PayPal comme méthode de paiement alternative

Dans `inscription.html`, ajoute un choix de paiement :

```html
<!-- Après le formulaire Stripe -->
<div class="payment-method-selector">
    <h3>Choisissez votre mode de paiement</h3>
    <div class="payment-options">
        <button onclick="selectPaymentMethod('stripe')">
            💳 Carte bancaire (Stripe)
        </button>
        <button onclick="selectPaymentMethod('paypal')">
            🅿️ PayPal (Paiement en 4x)
        </button>
    </div>
</div>

<div id="stripe-payment-section" style="display:none;">
    <!-- Formulaire Stripe existant -->
</div>

<div id="paypal-payment-section" style="display:none;">
    <div id="paypal-button-container"></div>
</div>
```

#### Option 2 : Code JavaScript à ajouter dans inscription.js

```javascript
// Importer PayPal
let paypalPayment = null;

async function selectPaymentMethod(method) {
    if (method === 'stripe') {
        document.getElementById('stripe-payment-section').style.display = 'block';
        document.getElementById('paypal-payment-section').style.display = 'none';
    } else if (method === 'paypal') {
        document.getElementById('stripe-payment-section').style.display = 'none';
        document.getElementById('paypal-payment-section').style.display = 'block';
        
        // Initialiser PayPal
        if (!paypalPayment) {
            paypalPayment = new PayPalPayment();
            const clientId = await paypalPayment.getClientId();
            await paypalPayment.loadPayPalSDK(clientId);
        }
        
        // Rendre les boutons
        const amount = calculateTotalAmount(); // Ta fonction existante
        await paypalPayment.renderButtons(
            'paypal-button-container',
            amount,
            'Inscription Auto-École Breteuil',
            formData.email,
            formData.nom + ' ' + formData.prenom,
            handlePayPalSuccess,
            handlePayPalError
        );
    }
}

function handlePayPalSuccess(data) {
    console.log('✅ Paiement PayPal réussi:', data);
    // Enregistrer l'inscription dans Supabase
    // Rediriger vers la page de confirmation
}

function handlePayPalError(error) {
    console.error('❌ Erreur PayPal:', error);
    alert('Erreur lors du paiement : ' + error.message);
}
```

---

## 💰 Paiement en plusieurs fois

PayPal propose automatiquement **"Pay in 4"** (paiement en 4 fois sans frais) pour :
- Montants entre **30€ et 2000€**
- Clients en France
- Comptes PayPal éligibles

**Aucune configuration supplémentaire nécessaire !** PayPal affiche automatiquement l'option si le montant est éligible.

---

## 🧪 Tests

### Mode Sandbox (Test)
1. Utilise `PAYPAL_MODE = sandbox`
2. Crée des comptes de test sur https://developer.paypal.com/dashboard/accounts
3. Teste avec ces comptes

### Mode Live (Production)
1. Change `PAYPAL_MODE = live`
2. Utilise les clés Live de ton app PayPal
3. Les vrais paiements seront traités

---

## 📊 Suivi des paiements

Les paiements PayPal sont enregistrés avec :
- `orderId` : ID de la commande PayPal
- `captureId` : ID de la capture du paiement
- `payerEmail` : Email du payeur
- `amount` : Montant payé

Tu peux les stocker dans Supabase dans une table `payments` :

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    payment_method TEXT, -- 'stripe' ou 'paypal'
    payment_id TEXT, -- orderId ou payment_intent_id
    amount DECIMAL(10,2),
    status TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ❓ FAQ

**Q : Le paiement en 4x apparaît-il automatiquement ?**
R : Oui, si le montant est entre 30€ et 2000€ et que le compte PayPal est éligible.

**Q : Y a-t-il des frais pour le paiement en 4x ?**
R : Non pour le client. PayPal prend une commission sur le marchand (toi).

**Q : Comment voir mes paiements ?**
R : Dans ton compte PayPal Business → Activité

**Q : Puis-je forcer le paiement en 4x ?**
R : Non, c'est PayPal qui décide selon l'éligibilité du client.

---

## 🆘 Support

- Documentation PayPal : https://developer.paypal.com/docs/checkout/
- Support PayPal : https://www.paypal.com/fr/smarthelp/contact-us
- Fichier de test : `test-paypal.html`

---

## ✨ Avantages PayPal

✅ Paiement en 4x sans frais pour le client
✅ Interface familière et sécurisée
✅ Pas besoin de saisir sa carte
✅ Protection acheteur PayPal
✅ Augmente le taux de conversion

**Bonne chance ! 🚀**
