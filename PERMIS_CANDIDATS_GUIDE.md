# 🎓 Guide : Gestion des candidats au permis

## ✅ Fonctionnalité créée

Un système complet pour gérer **plusieurs candidats** lors des créneaux permis avec **autocomplétion** pour rechercher rapidement les élèves.

---

## 📍 Comment utiliser

### 1. Ouvrir la modal Permis

1. Va sur **Admin Planning**
2. Clique sur le bouton **"Permis"** (jaune avec icône carte)
3. La modal s'ouvre

### 2. Remplir les informations du permis

1. **Date** : Sélectionne la date de l'examen
2. **Heure de départ** : Ex: 13:00
3. **Heure de fin** : Ex: 17:00
4. **Moniteur** : Sélectionne le moniteur accompagnateur
5. **Lieu** : Sélectionne le lieu d'examen (Aubagne, Saint-Henri, etc.)

### 3. Ajouter les candidats

#### Recherche avec autocomplétion

1. Dans le champ **"Rechercher un élève"**, tape les premières lettres :
   - Du **prénom** (ex: "tal")
   - Du **nom** (ex: "san")
   - De l'**email** (ex: "taly")

2. Une liste de suggestions apparaît automatiquement
3. Clique sur l'élève pour l'ajouter

#### Ajouter plusieurs candidats

- Répète l'opération pour chaque candidat
- Ils s'affichent dans la liste en dessous
- Tu peux en ajouter autant que nécessaire

#### Retirer un candidat

- Clique sur le bouton **rouge (X)** à côté du nom du candidat

### 4. Valider

1. Vérifie que tous les candidats sont bien ajoutés
2. Clique sur **"Bloquer"**
3. Un message de confirmation s'affiche avec :
   - Le nombre de créneaux bloqués
   - La liste des candidats

---

## 📊 Affichage sur le planning

### Planning Admin

Les créneaux permis affichent :
- **PERMIS - [Lieu]**
- **Liste des candidats** (en petit en dessous)

**Exemple** :
```
PERMIS - Aubagne
Talyss Sanna, Jean Dupont, Marie Martin
```

### Planning Moniteur

Le moniteur concerné voit également :
- Le créneau permis dans son planning
- Le lieu de l'examen
- Les noms des candidats

---

## 🔍 Autocomplétion intelligente

### Recherche par :
- ✅ **Prénom** : "tal" → trouve "Talyss"
- ✅ **Nom** : "san" → trouve "Sanna"
- ✅ **Email** : "taly" → trouve "talysssanna43@gmail.com"

### Fonctionnalités :
- **Recherche en temps réel** (300ms de délai)
- **Maximum 10 résultats** affichés
- **Pas de doublons** : impossible d'ajouter 2 fois le même candidat
- **Réinitialisation automatique** du champ après sélection

---

## 💾 Stockage des données

### Format dans la base de données

Les candidats sont stockés dans le champ `notes` des créneaux :

```
PERMIS - Aubagne | Candidats: Talyss Sanna, Jean Dupont, Marie Martin
```

### Structure :
- **Partie 1** : `PERMIS - [Lieu]`
- **Séparateur** : `|`
- **Partie 2** : `Candidats: [Nom1], [Nom2], [Nom3]`

---

## 🎯 Cas d'usage

### Cas 1 : Examen avec 3 candidats

**Situation** : Examen à Aubagne le 26/04/2026 de 13h à 17h

**Étapes** :
1. Ouvre la modal Permis
2. Remplis : Date, Horaires, Moniteur (Mylène), Lieu (Aubagne)
3. Cherche "Talyss" → Sélectionne
4. Cherche "Jean" → Sélectionne
5. Cherche "Marie" → Sélectionne
6. Clique "Bloquer"

**Résultat** :
- ✅ 2 créneaux bloqués (13h-15h et 15h-17h)
- ✅ Les 3 candidats affichés sur chaque créneau
- ✅ Visible par l'admin et le moniteur

### Cas 2 : Retirer un candidat avant validation

**Situation** : Tu as ajouté 4 candidats mais tu veux en retirer 1

**Solution** :
1. Clique sur le **X rouge** à côté du candidat à retirer
2. Il disparaît de la liste
3. Valide avec les 3 candidats restants

---

## ⚠️ Important

### Validation obligatoire

- ❌ **Impossible de valider sans candidat**
- ✅ Un message d'erreur s'affiche : "Veuillez ajouter au moins un candidat au permis"

### Recherche minimale

- La recherche démarre à partir de **2 caractères**
- En dessous, aucune suggestion n'apparaît

### Affichage

- Les candidats sont affichés sur **tous les créneaux** du permis
- Si l'examen dure 4h (2 créneaux), les candidats apparaissent sur les 2

---

## 🧪 Test

Pour tester :

1. **Rafraîchis la page admin** (Ctrl+Shift+R)
2. Clique sur "Permis"
3. Remplis les infos
4. Cherche un élève (tape 2-3 lettres)
5. Ajoute plusieurs candidats
6. Valide
7. Vérifie que :
   - ✅ Les créneaux sont bloqués
   - ✅ Les candidats s'affichent sur le planning admin
   - ✅ Le moniteur voit les candidats dans son planning

---

## 📞 Support

Si problème :
- Vérifie la console du navigateur (F12)
- Regarde les logs dans Supabase
- Vérifie que les élèves existent dans la table `users`

**Tout fonctionne ! 🎉**
