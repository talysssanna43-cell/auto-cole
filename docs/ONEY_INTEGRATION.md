# Intégration Oney - Paiement en plusieurs fois

## 📋 Étapes d'activation du compte Oney

### 1. Inscription Oney Professionnel

**Site web** : https://www.oney.fr/professionnels

**Documents nécessaires** :
- KBIS de moins de 3 mois
- RIB professionnel
- Pièce d'identité du gérant
- Justificatif de domicile de moins de 3 mois

**Informations à fournir** :
- Secteur d'activité : Auto-école / Formation à la conduite
- Volume de transactions mensuel estimé
- Panier moyen : 500€ - 1500€

### 2. Obtenir les clés API

Une fois le compte validé, récupérer :
- **Merchant ID** (Identifiant marchand)
- **API Key** (Clé API de production)
- **API Secret** (Secret API de production)
- **Test API Key** (Clé de test pour développement)

### 3. Configuration dans Netlify

Ajouter les variables d'environnement dans Netlify :

```
ONEY_MERCHANT_ID=votre_merchant_id
ONEY_API_KEY=votre_api_key_production
ONEY_API_SECRET=votre_api_secret_production
ONEY_TEST_API_KEY=votre_api_key_test (optionnel)
```

## 🎯 Packs éligibles au paiement fractionné

### Packs avec paiement en plusieurs fois (2x, 3x, 4x) :
- ✅ **Conduite accompagnée (AAC)** - 1190€
- ✅ **Conduite supervisée** - 1190€
- ✅ **Permis Accéléré** - 999€
- ✅ **Forfait Seconde Chance** - 569€
- ✅ **Boîte Automatique** - 859€
- ✅ **Forfait Zen** - 1390€
- ✅ **AM (Voiture sans permis)** - 350€

### Packs exclus (paiement en 1x uniquement) :
- ❌ **Code Rousseau** - 30€ (montant trop faible)
- ❌ **Heures de conduite** - Variable (achat à l'unité)

## 💰 Options de paiement proposées

### Selon le montant du pack :

**Montant < 500€** :
- Paiement en 1x (gratuit)
- Paiement en 2x sans frais

**Montant 500€ - 1000€** :
- Paiement en 1x (gratuit)
- Paiement en 2x sans frais
- Paiement en 3x sans frais

**Montant > 1000€** :
- Paiement en 1x (gratuit)
- Paiement en 2x sans frais
- Paiement en 3x sans frais
- Paiement en 4x sans frais

## 🔧 Intégration technique

### Flux de paiement :

1. **Élève sélectionne un pack** sur inscription.html
2. **Choix du mode de paiement** :
   - Carte bancaire (Stripe) - 1x
   - Paiement fractionné (Oney) - 2x/3x/4x
3. **Redirection vers Oney** si paiement fractionné
4. **Callback de confirmation** → Création du compte élève
5. **Email de confirmation** avec calendrier des échéances

### Endpoints créés :

- `/.netlify/functions/oney-create-payment` - Création du paiement
- `/.netlify/functions/oney-webhook` - Réception des notifications
- `/.netlify/functions/oney-config` - Configuration publique

## 📞 Support Oney

**Service client professionnel** :
- Téléphone : 09 69 32 22 22
- Email : support.pro@oney.fr
- Documentation API : https://developer.oney.fr

## ⚠️ Points importants

1. **Commission Oney** : ~2-3% par transaction (à confirmer avec Oney)
2. **Délai de versement** : 24-48h après validation du paiement
3. **Taux d'acceptation** : ~85% (dépend du profil client)
4. **Montant minimum** : 100€ (à confirmer)
5. **Montant maximum** : 3000€ (à confirmer)

## 🚀 Prochaines étapes

1. ✅ Créer un compte Oney Professionnel
2. ✅ Obtenir les clés API
3. ✅ Configurer les variables d'environnement Netlify
4. ✅ Tester en mode sandbox
5. ✅ Activer en production
6. ✅ Former l'équipe sur le suivi des paiements fractionnés
