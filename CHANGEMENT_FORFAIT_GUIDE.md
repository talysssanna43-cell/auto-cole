# 🔄 Guide : Changement de forfait élève

## ✅ Fonctionnalité créée

Un système complet pour **changer le forfait d'un élève** avec transfert automatique des heures effectuées et mise à jour du type de transmission (BM/BA).

---

## 📍 Comment utiliser

### 1. Accéder à la fiche élève

1. Va sur **Admin Planning**
2. Cherche un élève avec la barre de recherche
3. Clique sur l'élève pour ouvrir sa fiche

### 2. Changer le forfait

1. Dans la fiche élève, clique sur **"Changer de forfait"** (bouton jaune)
2. Une modal s'ouvre avec :
   - Les informations actuelles (forfait, heures effectuées)
   - Tous les forfaits disponibles
   - Les heures restantes pour chaque forfait

### 3. Sélectionner le nouveau forfait

1. Clique sur le forfait souhaité
2. Si le forfait permet de choisir (AAC, Zen, etc.), sélectionne **BM** ou **BA**
3. Clique sur **"Confirmer le changement"**

---

## 🔢 Calcul automatique

### Exemple 1 : Passage de Zen (20h) à AAC (20h)
- **Heures effectuées** : 8h
- **Nouveau forfait** : AAC (20h incluses)
- **Heures restantes** : 20h - 8h = **12h**

### Exemple 2 : Passage de BM à BA
- **Ancien forfait** : Zen BM
- **Nouveau forfait** : Boîte Auto BA
- **Type de transmission** : Automatiquement mis à jour en **BA**
- **Planning** : Tous les futurs créneaux seront en BA

---

## 🚗 Mise à jour automatique

### Type de transmission (BM/BA)

Quand tu changes le forfait :
- ✅ Le type de transmission est mis à jour dans la base de données
- ✅ Les **futurs créneaux** réservés seront en BM ou BA selon le nouveau forfait
- ✅ Le **planning** affiche automatiquement le bon type

### Heures restantes

- ✅ Les heures déjà effectuées sont **déduites** du nouveau forfait
- ✅ Le compteur d'heures restantes est mis à jour
- ✅ L'élève voit les bonnes infos dans son espace

---

## 📦 Forfaits disponibles

| Forfait | Heures | Type transmission |
|---------|--------|-------------------|
| Code | 0h | - |
| AM (VSP) | 8h | BA (fixe) |
| Boîte Auto | 13h | BA (fixe) |
| 20h Conduite | 20h | BM (fixe) |
| Zen | 20h | BM ou BA (choix) |
| Accéléré | 20h | BM ou BA (choix) |
| AAC | 20h | BM ou BA (choix) |
| Supervisée | 20h | BM ou BA (choix) |
| Second Chance | 6h | BM ou BA (choix) |

---

## 🔄 Mise à jour du planning

### Après changement de forfait :

1. **Fiche élève** : Mise à jour automatique
2. **Planning admin** : Rafraîchi automatiquement
3. **Espace élève** : L'élève voit son nouveau forfait
4. **Futures réservations** : Utilisent le nouveau type de transmission

---

## 💡 Cas d'usage

### Cas 1 : Élève passe de BM à BA
**Situation** : Un élève en Zen BM a du mal avec la boîte manuelle

**Solution** :
1. Ouvre sa fiche
2. Clique "Changer de forfait"
3. Sélectionne "Boîte Auto" (BA)
4. Confirme

**Résultat** :
- ✅ Type de transmission : **BA**
- ✅ Heures transférées
- ✅ Futurs créneaux en BA

### Cas 2 : Élève change de formule
**Situation** : Un élève en 20h veut passer en AAC

**Solution** :
1. Ouvre sa fiche
2. Clique "Changer de forfait"
3. Sélectionne "AAC"
4. Choisis BM ou BA
5. Confirme

**Résultat** :
- ✅ Nouveau forfait : AAC
- ✅ Heures déjà faites déduites
- ✅ Type de transmission mis à jour

---

## ⚠️ Important

### Heures effectuées
- Les heures **déjà faites** sont **conservées**
- Elles sont **déduites** du nouveau forfait
- Si l'élève a fait 15h et passe à un forfait de 13h, il aura **-2h** (il devra acheter des heures)

### Type de transmission
- Le changement de BM à BA (ou inverse) est **immédiat**
- Les **anciens créneaux** gardent leur type d'origine
- Les **nouveaux créneaux** utilisent le nouveau type

### Planning
- Le planning se rafraîchit automatiquement
- L'élève voit les changements dans son espace
- Les moniteurs voient les infos à jour

---

## 🧪 Test

Pour tester :
1. Crée un élève de test avec un forfait
2. Réserve quelques créneaux (ex: 4h)
3. Change son forfait
4. Vérifie que :
   - ✅ Les heures restantes sont correctes
   - ✅ Le type de transmission est mis à jour
   - ✅ Le planning affiche les bonnes infos

---

## 📞 Support

Si problème :
- Vérifie la console du navigateur (F12)
- Regarde les logs dans Supabase
- Vérifie que la colonne `transmission_type` existe dans la table `users`

**Tout fonctionne ! 🎉**
