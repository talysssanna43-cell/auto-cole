# Configuration PayPal - Paiement en plusieurs fois

## 📋 Étapes de configuration

### 1. Créer un compte PayPal Business

1. Va sur https://www.paypal.com/fr/business
2. Clique sur "Ouvrir un compte professionnel"
3. Remplis les informations de ton auto-école

### 2. Activer PayPal Developer (pour tester)

1. Va sur https://developer.paypal.com/
2. Connecte-toi avec ton compte PayPal
3. Va dans "Dashboard" → "Apps & Credentials"
4. Crée une nouvelle app :
   - Nom : "Auto-Ecole Breteuil"
   - Type : "Merchant"
5. Note les clés :
   - **Client ID** (commence par `A...`)
   - **Secret** (clique sur "Show" pour le voir)

### 3. Configurer dans Netlify

1. Va sur https://app.netlify.com
2. Sélectionne ton site
3. Va dans "Site settings" → "Environment variables"
4. Ajoute ces 3 variables :
   ```
   PAYPAL_CLIENT_ID = ton_client_id
   PAYPAL_CLIENT_SECRET = ton_secret
   PAYPAL_MODE = sandbox (pour test) ou live (pour production)
   ```

### 4. Activer le paiement en plusieurs fois

PayPal propose "Pay in 4" (paiement en 4 fois) automatiquement pour les montants entre 30€ et 2000€.

**Conditions :**
- Montant : 30€ - 2000€
- Disponible en France
- Activé automatiquement si le compte est éligible

### 5. Passer en production

Quand tout fonctionne en test :
1. Va dans PayPal Developer → ton app
2. Passe en mode "Live"
3. Copie les nouvelles clés Live
4. Dans Netlify, change :
   ```
   PAYPAL_MODE = live
   PAYPAL_CLIENT_ID = nouvelle_cle_live
   PAYPAL_CLIENT_SECRET = nouveau_secret_live
   ```

## 🧪 Tester le paiement

### Comptes de test PayPal

PayPal fournit des comptes de test :
- **Acheteur** : sb-buyer@personal.example.com
- **Mot de passe** : (généré dans Dashboard → Sandbox → Accounts)

### Cartes de test

Pour tester "Pay in 4" :
- Utilise le compte acheteur de test
- Le paiement en 4x apparaîtra automatiquement si le montant est éligible

## 📞 Support

Si problème :
- Documentation : https://developer.paypal.com/docs/checkout/
- Support PayPal : https://www.paypal.com/fr/smarthelp/contact-us
