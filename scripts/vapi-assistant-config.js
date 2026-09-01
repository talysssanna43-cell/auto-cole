const DEFAULT_SITE_URL = 'https://autoecolebreteuil.com';

function env(name, fallback = '') {
    return process.env[name] || fallback;
}

function publicFunctionUrl(path) {
    const siteUrl = env('URL', DEFAULT_SITE_URL).replace(/\/$/, '');
    return `${siteUrl}/.netlify/functions/${path}`;
}

function buildSystemPrompt() {
    return `Tu es le repondeur telephonique officiel d'Auto-Ecole Breteuil a Marseille.

Objectif: accueillir les appels, repondre simplement aux questions courantes et collecter les demandes qui doivent etre traitees par l'equipe.

Informations fiables:
- Nom: Auto-Ecole Breteuil.
- Adresse: 1A Rue Edouard Delanglade, 13006 Marseille.
- Telephone: 04 91 53 36 98.
- Email: breteuilautoecole@gmail.com.
- Site: https://autoecolebreteuil.com.
- Permis B boite manuelle: minimum legal 20 heures. Offres promotionnelles: Chill 5 cours 239 EUR, 10 cours 489 EUR, 20 cours 699 EUR, 25 cours 965 EUR; Premium 5 cours 389 EUR, 10 cours 599 EUR, 20 cours 799 EUR, 25 cours 1095 EUR; Accelere 5 cours 489 EUR, 10 cours 749 EUR, 20 cours 899 EUR, 25 cours 1199 EUR.
- Permis B boite automatique: minimum legal 13 heures. Offres connues: Chill 5 cours 269 EUR, Chill 13 cours 499 EUR, Premium 5 cours 379 EUR, Premium 13 cours 599 EUR, Accelere 5 cours 499 EUR, Accelere 13 cours 749 EUR.
- Cours de conduite a l'unite: 45 EUR en boite manuelle, 50 EUR en boite automatique.
- Code de la route: offres connues a 15 EUR et 20 EUR selon la formule.
- Permis accelere: disponible; les cours du samedi sont reserves en priorite aux eleves en accelere.
- Les inscriptions peuvent se faire sur le site. Pour une situation personnelle, prendre les coordonnees.

Regles de conversation:
- Parle en francais naturel, clair et rassurant.
- Commence par: "Bonjour, vous etes bien chez Auto-Ecole Breteuil. Comment puis-je vous aider ?"
- Fais des reponses courtes, adaptees au telephone, idealement moins de 30 mots.
- Ne promets jamais une place d'examen, une date, un financement ou une disponibilite sans validation humaine.
- Si l'appel concerne une urgence, une reclamation, un paiement bloque, une annulation proche, un examen, un dossier administratif delicat, un mineur, ou si la personne insiste pour parler a quelqu'un, propose un transfert vers l'equipe.
- Si tu ne peux pas transferer ou si l'equipe ne repond pas, collecte nom, telephone et motif avec collect_lead.
- Pour une demande de rappel, collecte toujours nom, telephone, motif et creneau prefere avec collect_lead.
- Repete le numero de telephone collecte pour confirmer.
- N'invente pas d'horaires d'ouverture. Si on demande les horaires et qu'ils ne sont pas dans les informations, explique que tu peux prendre une demande de rappel ou inviter a consulter le site.
- Pour les tarifs, indique que les prix peuvent evoluer et que le tarif valide est celui affiche sur le site ou confirme par l'equipe.
- Termine poliment et raccroche avec endCall quand la demande est traitee.`;
}

function buildAssistantConfig() {
    const webhookUrl = env('VAPI_WEBHOOK_URL', publicFunctionUrl('vapi-webhook'));
    const humanTransferNumber = env('VAPI_TRANSFER_PHONE_E164');
    const tools = [
        {
            type: 'function',
            function: {
                name: 'get_business_info',
                description: "Recupere les informations officielles de l'auto-ecole pour repondre aux questions courantes.",
                parameters: {
                    type: 'object',
                    properties: {
                        topic: {
                            type: 'string',
                            description: 'Sujet demande: horaires, tarifs, code, inscription, permis manuel, permis automatique, accelere, adresse.'
                        }
                    }
                }
            },
            server: { url: webhookUrl }
        },
        {
            type: 'function',
            function: {
                name: 'collect_lead',
                description: 'Enregistre une demande de rappel ou de suivi pour l equipe Auto-Ecole Breteuil.',
                parameters: {
                    type: 'object',
                    properties: {
                        prenom: { type: 'string' },
                        nom: { type: 'string' },
                        nomComplet: { type: 'string' },
                        telephone: { type: 'string' },
                        email: { type: 'string' },
                        sujet: {
                            type: 'string',
                            enum: ['inscription', 'tarifs', 'planning', 'cpf', 'reclamation', 'autre']
                        },
                        motif: { type: 'string' },
                        creneauRappel: { type: 'string' }
                    },
                    required: ['telephone', 'motif']
                }
            },
            server: { url: webhookUrl },
            messages: [
                { type: 'request-start', content: 'Je note votre demande, un instant.' },
                { type: 'request-complete', content: "C'est note, l'equipe pourra vous recontacter." },
                { type: 'request-failed', content: "Je n'arrive pas a enregistrer la demande automatiquement. Vous pouvez rappeler le standard." }
            ]
        },
        { type: 'endCall' }
    ];

    if (humanTransferNumber) {
        tools.push({
            type: 'transferCall',
            function: { name: 'transfer_to_human' },
            destinations: [
                {
                    type: 'number',
                    number: humanTransferNumber,
                    message: "Je vous mets en relation avec l'equipe. Merci de patienter."
                }
            ],
            messages: [
                { type: 'request-start', content: "Je vous transfere vers l'equipe. Merci de patienter." },
                { type: 'request-failed', content: "Je n'arrive pas a joindre l'equipe. Je peux prendre votre nom et votre telephone pour un rappel." }
            ]
        });
    }

    return {
        name: 'Auto-Ecole Breteuil - Repondeur',
        firstMessage: 'Bonjour, vous etes bien chez Auto-Ecole Breteuil. Comment puis-je vous aider ?',
        firstMessageInterruptionsEnabled: true,
        transcriber: {
            provider: 'deepgram',
            language: 'fr'
        },
        voice: {
            provider: env('VAPI_VOICE_PROVIDER', '11labs'),
            voiceId: env('VAPI_VOICE_ID', '21m00Tcm4TlvDq8ikWAM')
        },
        model: {
            provider: 'openai',
            model: env('VAPI_MODEL', 'gpt-4o-mini'),
            temperature: 0.2,
            messages: [
                {
                    role: 'system',
                    content: buildSystemPrompt()
                }
            ],
            tools
        },
        server: {
            url: webhookUrl
        }
    };
}

module.exports = {
    buildAssistantConfig,
    buildSystemPrompt
};
