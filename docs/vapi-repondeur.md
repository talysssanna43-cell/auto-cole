# Repondeur Vapi - Auto-Ecole Breteuil

Ce projet est un site statique deploye sur Netlify avec des fonctions serveur dans `netlify/functions`.
L'integration Vapi reste donc cote serveur: aucune cle Vapi privee ne doit etre ajoutee dans le frontend.

## Fichiers ajoutes

- `netlify/functions/vapi-webhook.js`: endpoint Vapi public pour les tool calls et evenements d'appel.
- `scripts/vapi-assistant-config.js`: configuration de l'assistant Vapi.
- `scripts/setup-vapi-assistant.js`: creation ou mise a jour de l'assistant via l'API Vapi.

## Variables d'environnement Netlify

Dans Netlify, ajouter ces variables dans Site configuration > Environment variables:

- `VAPI_PRIVATE_KEY`: cle privee Vapi, uniquement pour le script de creation/mise a jour.
- `VAPI_WEBHOOK_SECRET`: secret partage envoye par Vapi en header `x-vapi-secret`.
- `VAPI_WEBHOOK_URL`: optionnel. Par defaut: `https://auto-ecole-breteuil.fr/.netlify/functions/vapi-webhook`.
- `VAPI_TRANSFER_PHONE_E164`: optionnel mais recommande, numero humain au format E.164, exemple `+33491533698`.
- `VAPI_ASSISTANT_ID`: optionnel, a renseigner apres creation si on veut mettre a jour le meme assistant.
- `VAPI_API_BASE_URL`: optionnel. Utiliser `https://api.eu.vapi.ai` si l'organisation Vapi est en region Europe.
- `VAPI_MODEL`: optionnel, par defaut `gpt-4o-mini`.
- `VAPI_VOICE_PROVIDER` et `VAPI_VOICE_ID`: optionnels pour choisir la voix.

Les variables Supabase existantes (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) sont utilisees pour enregistrer les demandes de rappel dans `contact_requests`.

## Configuration dans le dashboard Vapi

1. Creer l'assistant
   - Vapi Dashboard > Assistants > Create Assistant.
   - Nom: `Auto-Ecole Breteuil - Repondeur`.
   - First message: `Bonjour, vous etes bien chez Auto-Ecole Breteuil. Comment puis-je vous aider ?`
   - Langue/transcription: francais.
   - Model: OpenAI `gpt-4o-mini` ou modele equivalent rapide.
   - System prompt: reprendre le prompt genere par `scripts/vapi-assistant-config.js`.

2. Ajouter le Server URL
   - Assistant > Advanced > Server URL:
     `https://auto-ecole-breteuil.fr/.netlify/functions/vapi-webhook`
   - Si vous utilisez un secret, configurer l'envoi de `x-vapi-secret` avec la meme valeur que `VAPI_WEBHOOK_SECRET`.
   - Les docs Vapi indiquent que les server URLs peuvent etre definies au niveau organisation, numero, assistant ou fonction. Ici le niveau assistant/fonction est le plus adapte.

3. Ajouter les tools
   - Tool `get_business_info`, type Function, Server URL identique au webhook.
   - Tool `collect_lead`, type Function, Server URL identique au webhook.
   - Tool `transferCall`, destination vers le numero humain au format E.164.
   - Tool `endCall`.

4. Attacher le numero
   - Vapi Dashboard > Phone Numbers.
   - Creer/importer un numero, puis assigner l'assistant en inbound.
   - En France, importer un numero existant via Twilio/Vonage/SIP si necessaire. Les numeros gratuits Vapi sont surtout pour l'usage national US.

## Creation par API

En local ou dans un terminal Netlify avec les variables d'environnement chargees:

```bash
npm run vapi:setup
```

Sans `VAPI_ASSISTANT_ID`, le script cree un assistant. Avec `VAPI_ASSISTANT_ID`, il met a jour l'assistant existant.

## Test webhook

Test local de la fonction sans appeler Vapi:

```bash
npm run test:vapi-webhook
```

Test reel:

1. Publier le site sur Netlify.
2. Verifier que `/.netlify/functions/vapi-webhook` repond en POST.
3. Dans Vapi, utiliser "Talk to Assistant" ou appeler le numero.
4. Dire: "Je veux etre rappele pour une inscription, je m'appelle Test Dupont, mon numero est 06 12 34 56 78."
5. Verifier dans l'admin du site que la demande apparait dans Contact.

## Notes de securite

- Ne jamais mettre `VAPI_PRIVATE_KEY` dans `index.html`, `assets/js/*` ou une page publique.
- Garder `VAPI_WEBHOOK_SECRET` prive et different des autres secrets.
- Les tarifs sont repris du catalogue serveur du projet, mais l'assistant doit toujours rappeler que le tarif valide est celui confirme sur le site ou par l'equipe.
