# Connexion des avis Google

Objectif : récupérer les vrais avis Google Business Profile et les afficher sur `avis.html`.

## 1. Créer l'accès Google Cloud

1. Ouvre Google Cloud Console.
2. Crée ou choisis un projet.
3. Active les API :
   - Google Business Profile API
   - Business Profile Account Management API
   - Business Profile Business Information API
4. Crée un identifiant OAuth `Application Web`.
5. Ajoute cette URI de redirection autorisée :
   `http://localhost:3000/api/google/oauth/callback`

## 2. Configurer le serveur

Copie `.env.example` en `.env`, puis remplis :

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Lance ensuite l'API :

```bash
npm run dev
```

## 3. Se connecter au compte propriétaire Google Business

Ouvre :

```text
http://localhost:3000/api/google/oauth/start
```

Connecte-toi au compte qui possède ou gère la fiche `Auto-Ecole Breteuil`.
Après validation, le serveur ajoute automatiquement `GOOGLE_REFRESH_TOKEN` dans `.env`.

## 4. Trouver l'établissement Google Business

Ouvre :

```text
http://localhost:3000/api/google/business/locations
```

Repère `Auto-Ecole Breteuil`, puis copie dans `.env` :

```env
GOOGLE_BUSINESS_ACCOUNT_ID=
GOOGLE_BUSINESS_LOCATION_ID=
GOOGLE_PLACE_ID=
```

Redémarre l'API. La route suivante doit alors retourner les vrais avis :

```text
http://localhost:3000/api/google-reviews
```

La page `avis.html` affichera tous les avis retournés par Google.
