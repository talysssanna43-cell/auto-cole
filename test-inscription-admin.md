# Test d'inscription admin - Diagnostic

## Étapes à suivre pour diagnostiquer le problème

### 1. Vérifier dans Supabase

1. **Ouvrir Supabase Dashboard**
2. **Aller dans Table Editor → inscription_notifications**
3. **Vérifier** :
   - Y a-t-il une nouvelle ligne avec l'email que tu viens d'inscrire ?
   - Quelle est la valeur de `created_at` ? (doit être la date/heure actuelle)
   - Quelle est la valeur de `pack` ?
   - Tous les champs sont-ils remplis ?

### 2. Vérifier dans la console du navigateur

1. **Ouvrir la page Analytics** : http://localhost:8000/admin-analytics.html
2. **Ouvrir la console** (F12)
3. **Chercher ces logs** :
   - `Inscriptions récupérées: X` (combien d'inscriptions sont récupérées ?)
   - `Exemple inscription:` (affiche les données)
   - `Packs des inscriptions:` (liste des packs)
   - `Inscriptions filtrées:` (combien par catégorie)

### 3. Vérifier la plage de dates

**Important** : Les analytics affichent les données par année.

- En haut de la page, il y a un sélecteur d'année
- **Vérifie que l'année sélectionnée est 2026** (année actuelle)
- Si c'est une autre année, change-la

### 4. Problèmes possibles

#### A. L'inscription n'est pas dans Supabase
- Le code d'inscription admin a échoué
- Vérifier les erreurs dans la console lors de l'inscription

#### B. L'inscription est dans Supabase mais pas comptée
- La plage de dates ne correspond pas (mauvaise année sélectionnée)
- Le pack n'est pas reconnu (vérifier le nom du pack)

#### C. Le champ `created_at` est mal formaté
- Doit être au format ISO : `2026-03-25T08:24:00.000Z`
- Si c'est une chaîne de texte simple, la requête ne fonctionnera pas

## Solutions

### Si l'inscription n'est pas dans Supabase

Exécuter ce SQL dans Supabase pour vérifier :

```sql
-- Vérifier les inscriptions récentes
SELECT * FROM inscription_notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- Compter les inscriptions d'aujourd'hui
SELECT COUNT(*) as total 
FROM inscription_notifications 
WHERE created_at::date = CURRENT_DATE;
```

### Si le problème persiste

Partage-moi :
1. Une capture d'écran de la table `inscription_notifications` dans Supabase
2. Les logs de la console sur la page Analytics
3. L'année sélectionnée dans le sélecteur
