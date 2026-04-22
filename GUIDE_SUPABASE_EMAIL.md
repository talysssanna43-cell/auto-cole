# 📧 Guide de configuration des emails via Supabase

## Étape 1 : Créer un compte Resend

1. Va sur [resend.com](https://resend.com)
2. Crée un compte gratuit (100 emails/jour)
3. Vérifie ton email
4. Va dans **API Keys** et crée une nouvelle clé
5. Copie la clé (commence par `re_...`)

---

## Étape 2 : Déployer la Edge Function

### Option A : Via Supabase CLI (Recommandé)

```bash
# Installer Supabase CLI si pas déjà fait
npm install -g supabase

# Se connecter à Supabase
supabase login

# Lier ton projet
supabase link --project-ref TON_PROJECT_REF

# Définir les secrets (variables d'environnement)
supabase secrets set RESEND_API_KEY=re_ta_cle_api_resend
supabase secrets set SITE_URL=https://ton-site.com

# Déployer la fonction
supabase functions deploy send-inscription-email
```

### Option B : Via Dashboard Supabase

1. Va dans ton projet Supabase
2. Clique sur **Edge Functions** dans le menu
3. Clique sur **New Function**
4. Nom : `send-inscription-email`
5. Copie-colle le contenu de `supabase/functions/send-inscription-email/index.ts`
6. Va dans **Settings → Edge Functions → Secrets**
7. Ajoute :
   - `RESEND_API_KEY` = ta clé Resend
   - `SITE_URL` = l'URL de ton site

---

## Étape 3 : Obtenir l'URL de la fonction

Après déploiement, l'URL sera :
```
https://TON_PROJECT_REF.supabase.co/functions/v1/send-inscription-email
```

Remplace `TON_PROJECT_REF` par ton vrai project ref (visible dans Settings → General)

---

## Étape 4 : Tester la fonction

```bash
curl -X POST https://TON_PROJECT_REF.supabase.co/functions/v1/send-inscription-email \
  -H "Authorization: Bearer TON_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "userName": "Test User",
    "decision": "approved",
    "rejectionMessage": ""
  }'
```

---

## Étape 5 : Configuration dans le code

L'URL de la fonction a déjà été configurée dans `admin-planning.js`.

Tu dois juste remplacer :
- `TON_PROJECT_REF` par ton vrai project ref
- `TON_ANON_KEY` par ta clé anon (visible dans Settings → API)

---

## 🎯 Avantages de cette solution

✅ **Gratuit** : 100 emails/jour avec Resend  
✅ **Sécurisé** : Clés API côté serveur (Edge Function)  
✅ **Rapide** : Edge Functions déployées mondialement  
✅ **Centralisé** : Tout dans Supabase  
✅ **Scalable** : Peut gérer des milliers d'emails  

---

## 🔧 Dépannage

**Erreur CORS** : Vérifie que les headers CORS sont bien configurés  
**Email non reçu** : Vérifie les logs dans Supabase Dashboard → Edge Functions → Logs  
**Clé API invalide** : Vérifie que `RESEND_API_KEY` est bien configurée dans les secrets  

---

## 📝 Notes

- Les emails de Resend gratuit viennent de `onboarding@resend.dev`
- Pour utiliser ton propre domaine (ex: `contact@auto-ecole-breteuil.fr`), il faut :
  1. Vérifier ton domaine dans Resend
  2. Ajouter les enregistrements DNS
  3. Changer `from:` dans la fonction
