# 🎁 Système de Parrainage - Auto-École Breteuil

## 📋 Vue d'ensemble

Le système de parrainage permet aux élèves inscrits de parrainer de nouveaux clients et de recevoir **1 heure de conduite gratuite** pour chaque filleul qui s'inscrit et paie son forfait.

## 🔧 Installation

### 1. Créer la table dans Supabase

Exécutez le fichier SQL `supabase-referrals-schema.sql` dans votre base de données Supabase :

```sql
-- Voir le fichier supabase-referrals-schema.sql pour le schéma complet
```

Ce fichier crée :
- ✅ La table `referrals` pour gérer les parrainages
- ✅ Les index pour optimiser les performances
- ✅ Les politiques RLS (Row Level Security) pour sécuriser l'accès
- ✅ La fonction `generate_referral_code()` pour générer des codes uniques
- ✅ La fonction `credit_referral_reward()` pour créditer automatiquement 1h au parrain

### 2. Vérifier la colonne `hours_remaining` dans la table `users`

Le système utilise la colonne `hours_remaining` pour créditer les heures gratuites. Assurez-vous qu'elle existe :

```sql
-- Si la colonne n'existe pas, l'ajouter
ALTER TABLE users ADD COLUMN IF NOT EXISTS hours_remaining INTEGER DEFAULT 0;
```

### 3. Déployer les fichiers

Les fichiers suivants ont été créés/modifiés :

**Nouveaux fichiers :**
- `parrainage.html` - Page de parrainage pour les élèves
- `assets/js/parrainage.js` - Logique JavaScript du système de parrainage
- `supabase-referrals-schema.sql` - Schéma SQL de la base de données

**Fichiers modifiés :**
- `assets/js/inscription.js` - Capture du code de parrainage et traitement
- `espace-eleve.html` - Ajout du lien vers la page de parrainage

## 🚀 Fonctionnement

### Pour le parrain (élève inscrit)

1. **Accéder à la page de parrainage**
   - Se connecter à l'espace élève
   - Cliquer sur "Parrainage" dans la navigation
   - URL : `https://votre-site.fr/parrainage.html`

2. **Obtenir son code de parrainage**
   - Un code unique de 8 caractères est généré automatiquement
   - Un QR code est créé pour faciliter le partage
   - Exemple de code : `A3F9K2L7`

3. **Partager son code**
   - **WhatsApp** : Partage direct avec message pré-rempli
   - **Copier le lien** : Lien d'inscription avec le code intégré
   - **Télécharger le QR code** : Image PNG à partager

4. **Suivre ses parrainages**
   - Statistiques en temps réel (parrainages en cours, validés, heures gagnées)
   - Liste détaillée de tous les filleuls
   - Statut du paiement et de la récompense

### Pour le filleul (nouveau client)

1. **S'inscrire via le lien de parrainage**
   - Cliquer sur le lien partagé par le parrain
   - Format : `https://votre-site.fr/inscription.html?ref=A3F9K2L7`
   - Ou scanner le QR code avec son smartphone

2. **Message de bienvenue**
   - Un message s'affiche confirmant le parrainage
   - Indication que le parrain recevra 1h gratuite

3. **Compléter l'inscription**
   - Remplir le formulaire normalement
   - Choisir un forfait
   - **Payer le forfait** (étape obligatoire)

4. **Validation automatique**
   - Dès le paiement validé, le parrainage est enregistré
   - Le parrain reçoit automatiquement 1h de conduite gratuite

## 🔐 Sécurité et validations

### Vérifications automatiques

1. **Code unique** : Chaque code de parrainage est unique et ne peut être utilisé qu'une fois
2. **Paiement vérifié** : L'heure gratuite n'est créditée que si le filleul a payé
3. **Pas de doublon** : Un code ne peut être utilisé qu'une seule fois
4. **RLS activé** : Les utilisateurs ne voient que leurs propres parrainages

### Prévention des abus

- ❌ Un code déjà utilisé ne peut pas être réutilisé
- ❌ Sans paiement validé, pas de récompense
- ❌ Les inscriptions en mode admin ne déclenchent pas de parrainage
- ✅ Traçabilité complète (dates, emails, statuts)

## 📊 Structure de la base de données

### Table `referrals`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `referrer_email` | TEXT | Email du parrain |
| `referrer_name` | TEXT | Nom du parrain |
| `referral_code` | TEXT | Code unique (8 caractères) |
| `referee_email` | TEXT | Email du filleul |
| `referee_name` | TEXT | Nom du filleul |
| `status` | TEXT | pending, completed, cancelled |
| `payment_verified` | BOOLEAN | Le filleul a-t-il payé ? |
| `reward_credited` | BOOLEAN | L'heure a-t-elle été créditée ? |
| `created_at` | TIMESTAMP | Date de création |
| `completed_at` | TIMESTAMP | Date de validation |

### Flux de données

```
1. Élève inscrit → Génération code unique → Stockage dans referrals
2. Nouveau client clique sur lien → Code capturé dans URL
3. Nouveau client s'inscrit → Code stocké temporairement
4. Nouveau client paie → Mise à jour referrals (referee_email, payment_verified)
5. Fonction RPC → Crédit automatique 1h au parrain
6. Mise à jour referrals → reward_credited = true, status = completed
```

## 🎨 Interface utilisateur

### Page de parrainage (`parrainage.html`)

**Sections :**
1. **Hero** : Titre et description du système
2. **Statistiques** : Parrainages en cours, validés, heures gagnées
3. **QR Code** : Code unique + QR code + boutons de partage
4. **Comment ça marche** : 4 étapes illustrées
5. **Liste des parrainages** : Historique détaillé

**Boutons de partage :**
- 🟢 WhatsApp : Partage direct
- 📋 Copier le lien : Copie dans le presse-papier
- 💾 Télécharger QR : Sauvegarde en PNG

### Intégration dans l'espace élève

Un bouton "🎁 Parrainage" a été ajouté dans la navigation de l'espace élève pour un accès facile.

## 🧪 Tests recommandés

### Test complet du flux

1. **Créer un compte parrain**
   - S'inscrire normalement
   - Se connecter à l'espace élève
   - Aller sur la page Parrainage
   - Vérifier la génération du code et du QR code

2. **Tester le partage**
   - Copier le lien de parrainage
   - Ouvrir en navigation privée
   - Vérifier l'affichage du message de bienvenue

3. **Inscription du filleul**
   - Remplir le formulaire d'inscription
   - Choisir un forfait
   - Payer (ou tester en mode local)
   - Vérifier l'enregistrement dans la table `referrals`

4. **Vérification du crédit**
   - Vérifier que `payment_verified = true`
   - Vérifier que `reward_credited = true`
   - Vérifier que `hours_remaining` du parrain a augmenté de 1
   - Vérifier le statut `completed`

5. **Vérifier les statistiques**
   - Retourner sur la page de parrainage du parrain
   - Vérifier les statistiques mises à jour
   - Vérifier l'affichage du filleul dans la liste

## 🐛 Dépannage

### Le code de parrainage ne se génère pas

**Vérifier :**
- La fonction `generate_referral_code()` existe dans Supabase
- Les permissions RLS permettent l'insertion
- La console du navigateur pour les erreurs

### L'heure gratuite n'est pas créditée

**Vérifier :**
- Le paiement a bien été validé (`payment_verified = true`)
- La fonction `credit_referral_reward()` existe
- La colonne `hours_remaining` existe dans la table `users`
- Les logs de la console pour les erreurs

### Le QR code ne s'affiche pas

**Vérifier :**
- La bibliothèque QRCode.js est bien chargée
- L'URL dans le `<script>` : `https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js`
- La console du navigateur pour les erreurs

## 📈 Améliorations futures possibles

1. **Notifications email**
   - Email au parrain quand un filleul s'inscrit
   - Email au parrain quand l'heure est créditée

2. **Paliers de récompenses**
   - 3 parrainages = 1h bonus supplémentaire
   - 5 parrainages = réduction sur le prochain forfait

3. **Statistiques avancées**
   - Graphiques d'évolution
   - Classement des meilleurs parrains

4. **Partage sur réseaux sociaux**
   - Facebook, Instagram, LinkedIn
   - Stories Instagram avec QR code

## 📞 Support

Pour toute question ou problème :
- Vérifier les logs de la console navigateur
- Vérifier les logs Supabase
- Consulter la documentation Supabase RLS

---

**Version** : 1.0  
**Date** : Mars 2026  
**Auteur** : Auto-École Breteuil
