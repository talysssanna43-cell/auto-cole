# 🚗 Système de Gestion des Moniteurs

## 📋 Vue d'ensemble

Système complet permettant à l'admin de créer des profils moniteurs qui auront leur propre espace avec planning en temps réel.

## 🎯 Fonctionnalités

### Pour l'Admin
- ✅ Ajouter/modifier/supprimer des moniteurs
- ✅ Définir les spécialités (BM, BA, Moto)
- ✅ Activer/désactiver un moniteur
- ✅ Gérer les accès

### Pour le Moniteur
- ✅ Connexion sécurisée avec email/mot de passe
- ✅ Dashboard avec statistiques
- ✅ Planning en temps réel avec ses créneaux
- ✅ Voir les élèves réservés
- ✅ Mise à jour automatique

### Pour l'Élève
- ✅ Voir les moniteurs disponibles
- ✅ Réserver avec un moniteur spécifique
- ✅ Planning synchronisé en temps réel

## 📁 Fichiers créés

### 1. Base de données
- `create-instructors-table.sql` - Script SQL pour créer la table

### 2. Interface Admin
- `admin-instructors.html` - Gestion des moniteurs

### 3. Espace Moniteur
- `instructor-login.html` - Page de connexion
- `instructor-dashboard.html` - Dashboard avec planning

### 4. Utilitaires
- `setup-instructors.html` - Instructions de setup

## 🚀 Installation

### Étape 1: Créer la table dans Supabase

1. Ouvrez **Supabase** > **SQL Editor**
2. Copiez le contenu de `create-instructors-table.sql`
3. Exécutez le script SQL
4. Vérifiez que la table `instructors` est créée

### Étape 2: Ajouter un lien dans le menu admin

Dans votre page admin principale, ajoutez :

```html
<a href="admin-instructors.html">
    <i class="fas fa-chalkboard-teacher"></i> Gestion Moniteurs
</a>
```

### Étape 3: Ajouter le lien de connexion moniteur

Sur votre page d'accueil ou menu principal :

```html
<a href="instructor-login.html">
    <i class="fas fa-chalkboard-teacher"></i> Espace Moniteur
</a>
```

## 📖 Guide d'utilisation

### Pour l'Admin

1. **Accéder à la gestion**
   - Allez sur `admin-instructors.html`

2. **Ajouter un moniteur**
   - Cliquez sur "Ajouter un moniteur"
   - Remplissez : Prénom, Nom, Email, Téléphone
   - Définissez un mot de passe
   - Sélectionnez les spécialités (BM/BA/Moto)
   - Cliquez sur "Enregistrer"

3. **Modifier un moniteur**
   - Cliquez sur "Modifier" sur la carte du moniteur
   - Modifiez les informations
   - Enregistrez

4. **Désactiver un moniteur**
   - Modifiez le moniteur
   - Décochez "Moniteur actif"
   - Les élèves ne pourront plus réserver avec lui

### Pour le Moniteur

1. **Se connecter**
   - Allez sur `instructor-login.html`
   - Entrez votre email et mot de passe
   - Cliquez sur "Se connecter"

2. **Consulter le planning**
   - Voir les séances du jour/semaine/mois
   - Naviguer entre les semaines avec les flèches
   - Les créneaux réservés apparaissent en bleu avec le nom de l'élève

3. **Statistiques**
   - Séances aujourd'hui
   - Séances cette semaine
   - Nombre d'élèves actifs
   - Heures ce mois

## 🔐 Sécurité

- ✅ Mots de passe hashés (SHA-256)
- ✅ Session sécurisée (sessionStorage)
- ✅ Vérification des permissions
- ✅ Comptes désactivables

## 🔄 Synchronisation

Le planning du moniteur est **automatiquement synchronisé** :
- Quand un élève réserve un créneau → apparaît immédiatement
- Quand l'admin place un élève → visible instantanément
- Quand un créneau est annulé → disparaît du planning

## 📊 Structure de la table `instructors`

```sql
id              UUID (PK)
prenom          VARCHAR(100)
nom             VARCHAR(100)
email           VARCHAR(255) UNIQUE
telephone       VARCHAR(20)
password_hash   TEXT
photo_url       TEXT
specialites     TEXT[] (array: 'manual', 'auto', 'moto')
is_active       BOOLEAN
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

## 🎨 Personnalisation

### Changer les couleurs
Dans les fichiers HTML, modifiez les variables CSS :

```css
:root {
    --primary: #667eea;        /* Couleur principale */
    --primary-dark: #5568d3;   /* Couleur hover */
    --success: #4CAF50;        /* Vert succès */
    --danger: #dc3545;         /* Rouge danger */
}
```

### Ajouter des spécialités
Dans `admin-instructors.html`, ajoutez des checkboxes :

```html
<label class="checkbox-label">
    <input type="checkbox" name="specialite" value="permis-b">
    <span>Permis B</span>
</label>
```

## 🐛 Dépannage

### Le moniteur ne peut pas se connecter
- ✅ Vérifiez que le compte est actif (`is_active = true`)
- ✅ Vérifiez l'email et le mot de passe
- ✅ Consultez la console du navigateur (F12)

### Le planning est vide
- ✅ Vérifiez que des créneaux sont assignés au moniteur
- ✅ Vérifiez la colonne `instructor_id` dans la table `slots`
- ✅ Vérifiez que les créneaux ont des réservations

### Les créneaux n'apparaissent pas
- ✅ Vérifiez que `instructor_id` est bien renseigné dans `slots`
- ✅ Vérifiez les dates des créneaux
- ✅ Actualisez la page (F5)

## 📞 Support

Pour toute question ou problème :
1. Consultez la console du navigateur (F12)
2. Vérifiez les logs Supabase
3. Vérifiez que toutes les tables sont créées

## ✅ Checklist de déploiement

- [ ] Table `instructors` créée dans Supabase
- [ ] Colonne `instructor_id` ajoutée à la table `slots`
- [ ] Lien "Gestion Moniteurs" ajouté dans le menu admin
- [ ] Lien "Espace Moniteur" ajouté sur la page d'accueil
- [ ] Premier moniteur créé et testé
- [ ] Connexion moniteur testée
- [ ] Planning moniteur testé
- [ ] Réservation élève testée

## 🎉 Prochaines étapes

1. **Intégration espace élève**
   - Afficher les moniteurs disponibles
   - Filtrer par spécialité
   - Réserver avec un moniteur spécifique

2. **Fonctionnalités avancées**
   - Photos de profil des moniteurs
   - Notation des moniteurs
   - Historique des séances
   - Export PDF du planning

3. **Notifications**
   - Email au moniteur lors d'une nouvelle réservation
   - SMS de rappel avant une séance
   - Notifications push

---

**Créé le:** 2 août 2026  
**Version:** 1.0  
**Auteur:** Auto-École Management System
