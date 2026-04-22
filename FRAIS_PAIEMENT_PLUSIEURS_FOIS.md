# 💰 Frais de paiement en plusieurs fois - 3%

## ✅ Modification effectuée

Les **frais de paiement en plusieurs fois** ont été modifiés à **3% fixe** pour tous les forfaits et toutes les méthodes de paiement.

### Avant
- 2 mensualités : +4.32%
- 3 mensualités : +4.56%
- 4 mensualités : +5.76%

### Maintenant
- **Toutes les mensualités : +3%** (fixe)

---

## 📁 Fichiers modifiés

### 1. `assets/js/inscription.js`
- Fonction `updateInstallmentsPreview()` : Calcul des frais à 3%
- Fonction `updateSummary()` : Application des frais à 3%

### 2. `assets/js/alma-payment.js`
- Fonction `processAlmaPayment()` : Frais Alma à 3%

### 3. `assets/js/stripe-installments-payment.js`
- Fonction `processStripeInstallmentsPayment()` : Frais Stripe à 3%

### 4. `assets/js/paypal-payment.js`
- Méthode `renderButtons()` : Frais PayPal à 3%

---

## 💡 Exemples de calcul

| Forfait | Prix de base | Prix avec 3% | Différence |
|---------|--------------|--------------|------------|
| Code | 20€ | 21€ | +1€ |
| AM | 350€ | 361€ | +11€ |
| Boîte Auto | 859€ | 885€ | +26€ |
| 20h | 900€ | 927€ | +27€ |
| Zen | 995€ | 1,025€ | +30€ |
| Accéléré | 999€ | 1,029€ | +30€ |
| AAC | 1,190€ | 1,226€ | +36€ |
| Supervisée | 1,190€ | 1,226€ | +36€ |
| Second Chance | 569€ | 586€ | +17€ |

---

## 🧪 Test

Pour tester les nouveaux frais :

1. Va sur ton site : https://ton-site.netlify.app/inscription.html
2. Sélectionne un forfait
3. Choisis "Paiement en plusieurs fois"
4. Vérifie que le prix affiché = prix de base × 1.03

**Exemple :**
- Forfait Zen : 995€
- Avec paiement en plusieurs fois : **1,025€** (995 × 1.03)

---

## 📝 Note importante

Les **3% de frais** s'appliquent pour :
- ✅ Paiement Stripe en plusieurs fois
- ✅ Paiement Alma en plusieurs fois
- ✅ Paiement PayPal en plusieurs fois (Pay in 4)

Le **paiement comptant** (en une fois) reste **sans frais**.

---

## 🔄 Prochaine étape

Maintenant que les frais sont à 3%, tu peux :
1. **Configurer PayPal** (voir `PAYPAL_SETUP.md`)
2. **Déployer sur Netlify** (déjà fait avec le push)
3. **Tester les paiements**

**Tout est prêt ! 🚀**
