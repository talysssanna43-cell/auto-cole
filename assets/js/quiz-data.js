const quizSessions = [
  {
    "id": 1,
    "title": "Conduite & Sécurité 1",
    "icon": "fas fa-shield-alt",
    "color": "#3b82f6",
    "description": "Ceinture, appui-tête, Isofix, rétroviseur, voyants, freins, pneus, secourisme",
    "questions": [
      {
        "q": "En règle générale, à partir de quel âge un enfant peut-il être installé à l'avant ?",
        "choices": [
          "8 ans",
          "10 ans",
          "12 ans",
          "6 ans"
        ],
        "correct": 1,
        "explanation": "Un enfant peut être installé à l'avant à partir de 10 ans.",
        "img": "assets/images/quiz/quiz-img-002.jpeg"
      },
      {
        "q": "Quelle est l'utilité de l'appui-tête du siège conducteur ?",
        "choices": [
          "Améliorer le confort",
          "Retenir la tête en cas de choc et limiter les blessures cervicales",
          "Maintenir la tête droite",
          "Empêcher de s'endormir"
        ],
        "correct": 1,
        "explanation": "L'appui-tête retient le mouvement de la tête en cas de choc arrière (coup du lapin).",
        "img": "assets/images/quiz/quiz-img-003.jpeg"
      },
      {
        "q": "Peut-on fixer tout type de siège enfant sur des attaches Isofix ?",
        "choices": [
          "Oui tous",
          "Non, uniquement ceux compatibles avec ce système",
          "Oui mais seulement à l'arrière",
          "Non, Isofix n'est plus autorisé"
        ],
        "correct": 1,
        "explanation": "Seuls les sièges compatibles Isofix peuvent y être fixés.",
        "img": "assets/images/quiz/quiz-img-004.jpeg"
      },
      {
        "q": "Quel réglage est essentiel pour le rétroviseur intérieur ?",
        "choices": [
          "Position nuit",
          "Le régler pour voir l'ensemble de la lunette arrière",
          "Le tourner vers le bas",
          "Le désactiver de jour"
        ],
        "correct": 1,
        "explanation": "Régler pour voir l'ensemble de la lunette arrière sans bouger la tête.",
        "img": "assets/images/quiz/quiz-img-016.jpeg"
      },
      {
        "q": "Quelles précautions lors du remplissage du réservoir ?",
        "choices": [
          "Laisser le moteur tourner",
          "Arrêter le moteur, ne pas fumer, ne pas téléphoner",
          "Remplir à ras bord",
          "Garder les phares allumés"
        ],
        "correct": 1,
        "explanation": "Arrêter le moteur, ne pas fumer et ne pas téléphoner.",
        "img": "assets/images/quiz/quiz-img-005.jpeg"
      },
      {
        "q": "Que signifie le voyant en forme de burette d'huile avec STOP ?",
        "choices": [
          "Niveau d'huile correct",
          "Pression d'huile insuffisante, s'arrêter immédiatement",
          "Vidange prochaine",
          "Température d'huile idéale"
        ],
        "correct": 1,
        "explanation": "S'arrêter immédiatement pour éviter la casse moteur.",
        "img": "assets/images/quiz/quiz-img-007.jpeg"
      },
      {
        "q": "Comment détecter l'usure des essuie-glaces ?",
        "choices": [
          "Par le bruit",
          "Lorsqu'ils laissent des traces sur le pare-brise",
          "En les inspectant chaque mois",
          "Quand le lave-glace ne fonctionne plus"
        ],
        "correct": 1,
        "explanation": "Des essuie-glaces usés laissent des traces ou zones non essuyées.",
        "img": "assets/images/quiz/quiz-img-017.jpeg"
      },
      {
        "q": "Quelle est la profondeur minimale légale des sculptures d'un pneu ?",
        "choices": [
          "1 mm",
          "1,6 mm",
          "2,5 mm",
          "3 mm"
        ],
        "correct": 1,
        "explanation": "La profondeur minimale légale est de 1,6 mm.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Quels sont les numéros d'urgence à composer ?",
        "choices": [
          "15-17-18 uniquement",
          "18 pompiers, 15 Samu, 112 urgence européen",
          "112 uniquement",
          "17 police, 119 enfance"
        ],
        "correct": 1,
        "explanation": "18 (pompiers), 15 (Samu), 112 (numéro d'urgence européen).",
        "img": "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=520&h=260&fit=crop"
      },
      {
        "q": "Qu'est-ce qu'un défibrillateur automatisé externe (DAE) ?",
        "choices": [
          "Appareil pour mesurer la tension",
          "Appareil qui rétablit une activité cardiaque normale",
          "Outil pour arrêter une hémorragie",
          "Masque de respiration"
        ],
        "correct": 1,
        "explanation": "Le DAE analyse le rythme cardiaque et délivre un choc si nécessaire.",
        "img": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=520&h=260&fit=crop"
      },
      {
        "q": "De quelle couleur est le voyant de défaillance du freinage ?",
        "choices": [
          "Orange",
          "Vert",
          "Rouge",
          "Bleu"
        ],
        "correct": 2,
        "explanation": "Le voyant de freinage est rouge : danger critique, arrêt impératif.",
        "img": "assets/images/quiz/quiz-img-009.jpeg"
      },
      {
        "q": "Où se situent les attaches Isofix sur ce véhicule ?",
        "choices": [
          "Sièges avant",
          "Entre l'assise et le dossier des sièges arrière",
          "Dans le coffre",
          "Banquette centrale"
        ],
        "correct": 1,
        "explanation": "Les attaches Isofix se trouvent entre l'assise et le dossier de la banquette arrière.",
        "img": "assets/images/quiz/quiz-img-004.jpeg"
      },
      {
        "q": "Citez 2 éléments pour un désembuage efficace.",
        "choices": [
          "Klaxon et clignotants",
          "Ventilateur vers le pare-brise et air chaud ou climatisation",
          "Essuie-glaces et lave-glace",
          "Feux de route et brouillard"
        ],
        "correct": 1,
        "explanation": "Diriger le ventilateur vers le pare-brise + air chaud ou climatisation.",
        "img": "assets/images/quiz/quiz-img-018.jpeg"
      },
      {
        "q": "Pourquoi utiliser un liquide lave-glace spécial en hiver ?",
        "choices": [
          "Meilleur nettoyage",
          "Pour éviter le gel du liquide",
          "Protéger les essuie-glaces",
          "Parfumer l'habitacle"
        ],
        "correct": 1,
        "explanation": "Le liquide hiver contient un antigel.",
        "img": "assets/images/quiz/quiz-img-025.jpeg"
      },
      {
        "q": "Sur autoroute, comment indiquer les lieux d'un accident ?",
        "choices": [
          "Décrire le paysage",
          "Numéro d'autoroute, sens de circulation et point kilométrique",
          "Ville la plus proche",
          "Activer le GPS"
        ],
        "correct": 1,
        "explanation": "Indiquer le numéro de l'autoroute, le sens et le point kilométrique.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel équipement est obligatoire en cas de panne ?",
        "choices": [
          "Lampe de poche",
          "Gilet haute visibilité et triangle de présignalisation",
          "Trousse de secours",
          "Extincteur"
        ],
        "correct": 1,
        "explanation": "Le gilet et le triangle sont obligatoires.",
        "img": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment arrêter une hémorragie ?",
        "choices": [
          "Mettre un garrot",
          "Appuyer fortement sur l'endroit qui saigne avec un tissu propre",
          "Surélever le membre",
          "Mettre de l'eau froide"
        ],
        "correct": 1,
        "explanation": "Appuyer fortement et directement sur la plaie avec un tissu propre.",
        "img": "https://images.unsplash.com/photo-1584515933487-779824d29309?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le voyant de charge batterie allumé en roulant ?",
        "choices": [
          "Batterie pleine",
          "Le système de charge est défaillant",
          "Moteur va accélérer",
          "Essuie-glaces vont s'arrêter"
        ],
        "correct": 1,
        "explanation": "L'alternateur ne charge plus la batterie. Limiter la consommation et s'arrêter.",
        "img": "assets/images/quiz/quiz-img-008.jpeg"
      },
      {
        "q": "À quelle distance placer le triangle de présignalisation ?",
        "choices": [
          "10 mètres",
          "30 mètres",
          "50 mètres",
          "100 mètres"
        ],
        "correct": 1,
        "explanation": "Le triangle se place à environ 30 mètres de l'obstacle.",
        "img": "assets/images/quiz/quiz-img-048.jpeg"
      },
      {
        "q": "Quels sont les signes d'un arrêt cardiaque ?",
        "choices": [
          "Douleur à la poitrine",
          "Ne répond pas, ne réagit pas, ne respire pas ou respiration anormale",
          "Transpire beaucoup",
          "Yeux ouverts"
        ],
        "correct": 1,
        "explanation": "Absence de réponse, absence de réaction ET absence de respiration normale.",
        "img": "https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 2,
    "title": "Conduite & Sécurité 2",
    "icon": "fas fa-car",
    "color": "#ef4444",
    "description": "Voyants, portières, climatisation, capot, pression pneus, PLS, alerter",
    "questions": [
      {
        "q": "Quel est l'intérêt de la position nuit du rétroviseur intérieur ?",
        "choices": [
          "Mieux voir la nuit",
          "Ne pas être ébloui par les feux du véhicule suiveur",
          "Voir les panneaux",
          "Augmenter le champ de vision"
        ],
        "correct": 1,
        "explanation": "La position nuit évite l'éblouissement par les phares arrière.",
        "img": "assets/images/quiz/quiz-img-016.jpeg"
      },
      {
        "q": "Que signifie le voyant de température du liquide de refroidissement ?",
        "choices": [
          "Moteur froid",
          "Moteur en surchauffe, s'arrêter rapidement",
          "Climatisation active",
          "Huile basse"
        ],
        "correct": 1,
        "explanation": "Voyant rouge = surchauffe moteur. S'arrêter et laisser refroidir.",
        "img": "assets/images/quiz/quiz-img-028.jpeg"
      },
      {
        "q": "Dans quel cas utiliser les feux de détresse (warnings) ?",
        "choices": [
          "Stationner en double file",
          "Panne, accident ou fort ralentissement soudain",
          "Forte pluie",
          "Remercier un conducteur"
        ],
        "correct": 1,
        "explanation": "Les warnings s'utilisent en panne, accident ou ralentissement soudain.",
        "img": "assets/images/quiz/quiz-img-019.jpeg"
      },
      {
        "q": "Montrez le bouchon du lave-glace. De quelle couleur est-il ?",
        "choices": [
          "Rouge",
          "Bleu",
          "Jaune",
          "Noir"
        ],
        "correct": 1,
        "explanation": "Le bouchon du réservoir de lave-glace est bleu.",
        "img": "assets/images/quiz/quiz-img-025.jpeg"
      },
      {
        "q": "Quel risque si on ouvre le bouchon de refroidissement moteur chaud ?",
        "choices": [
          "Débordement",
          "Brûlure par vapeur sous pression",
          "Moteur cale",
          "Liquide inefficace"
        ],
        "correct": 1,
        "explanation": "Moteur chaud, le liquide est sous pression. Ouvrir libère de la vapeur brûlante.",
        "img": "assets/images/quiz/quiz-img-028.jpeg"
      },
      {
        "q": "Où trouver la pression recommandée des pneus ?",
        "choices": [
          "Tableau de bord",
          "Étiquette dans la portière du conducteur",
          "Sur les pneus",
          "Au contrôle technique"
        ],
        "correct": 1,
        "explanation": "L'étiquette de pression est dans l'encadrement de la portière conducteur.",
        "img": "assets/images/quiz/quiz-img-038.jpeg"
      },
      {
        "q": "Que signifie le voyant des portières ouvertes ?",
        "choices": [
          "Coffre ouvert",
          "Une ou plusieurs portières sont mal fermées",
          "Surchauffe moteur",
          "Frein à main serré"
        ],
        "correct": 1,
        "explanation": "Ce voyant indique qu'une ou plusieurs portières ne sont pas correctement fermées.",
        "img": "assets/images/quiz/quiz-img-011.jpeg"
      },
      {
        "q": "Pourquoi l'alerte aux secours doit-elle être rapide et précise ?",
        "choices": [
          "Éviter une amende",
          "Permettre aux secours d'apporter les moyens adaptés rapidement",
          "Informer la police",
          "Obtenir un numéro de dossier"
        ],
        "correct": 1,
        "explanation": "Une alerte rapide et précise permet des secours adaptés au plus vite.",
        "img": "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=520&h=260&fit=crop"
      },
      {
        "q": "Dans quel cas positionner une victime en PLS ?",
        "choices": [
          "Quand elle a mal au dos",
          "Si elle ne répond pas, ne réagit pas mais respire",
          "Quand elle saigne",
          "Quand elle est fatiguée"
        ],
        "correct": 1,
        "explanation": "La PLS s'applique si la victime est inconsciente mais respire.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle conséquence d'une panne de dégivrage de la lunette arrière ?",
        "choices": [
          "Panne de chauffage",
          "Absence de visibilité vers l'arrière",
          "Dysfonctionnement essuie-glaces",
          "Surconsommation"
        ],
        "correct": 1,
        "explanation": "Sans dégivrage, la lunette reste embuée, réduisant la visibilité arrière.",
        "img": "assets/images/quiz/quiz-img-006.jpeg"
      },
      {
        "q": "Quel risque de rouler avec des pneus sous-gonflés ?",
        "choices": [
          "Consomme moins",
          "Risque d'éclatement et usure anormale",
          "Freins plus efficaces",
          "Meilleur confort"
        ],
        "correct": 1,
        "explanation": "Pneus sous-gonflés : surchauffe, usure inégale, risque d'éclatement.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Différence entre voyant orange et voyant rouge ?",
        "choices": [
          "Pas de différence",
          "Orange = défaut à vérifier, Rouge = danger, arrêt impératif",
          "Orange = danger, Rouge = info",
          "Orange = position, Rouge = stop"
        ],
        "correct": 1,
        "explanation": "Rouge = anomalie grave (arrêt). Orange = défaut important à vérifier.",
        "img": "assets/images/quiz/quiz-img-012.jpeg"
      },
      {
        "q": "Quel risque de circuler avec un frein de parking mal desserré ?",
        "choices": [
          "Aucun",
          "Surchauffe et dégradation du système de freinage",
          "Panne de direction",
          "Problème de clim"
        ],
        "correct": 1,
        "explanation": "Rouler frein de parking serré = surchauffe et usure prématurée des freins.",
        "img": "assets/images/quiz/quiz-img-009.jpeg"
      },
      {
        "q": "Quelles 3 informations transmettre aux secours ?",
        "choices": [
          "Nom, prénom, adresse",
          "Numéro de téléphone, nature du problème, localisation",
          "Numéro de plaque, couleur, marque",
          "Heure, lieu, nombre de véhicules"
        ],
        "correct": 1,
        "explanation": "Donner : votre numéro, la nature du problème et la localisation précise.",
        "img": "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez la commande d'essuie-glaces. Où se trouve-t-elle ?",
        "choices": [
          "Commodo gauche",
          "Commodo droit, derrière le volant",
          "Bouton au tableau de bord",
          "Sur le volant"
        ],
        "correct": 1,
        "explanation": "La commande d'essuie-glaces est sur le commodo droit, derrière le volant.",
        "img": "assets/images/quiz/quiz-img-017.jpeg"
      },
      {
        "q": "Quelle est la conséquence d'un niveau insuffisant de liquide de frein ?",
        "choices": [
          "Freins plus réactifs",
          "Perte d'efficacité du freinage",
          "Moteur cale",
          "Essuie-glaces lents"
        ],
        "correct": 1,
        "explanation": "Un manque de liquide de frein = perte d'efficacité du freinage.",
        "img": "assets/images/quiz/quiz-img-027.jpeg"
      },
      {
        "q": "Qu'est-ce qu'une hémorragie ?",
        "choices": [
          "Simple saignement de nez",
          "Perte de sang prolongée qui ne s'arrête pas, imbibe un mouchoir en secondes",
          "Bleu ou hématome",
          "Coupure superficielle"
        ],
        "correct": 1,
        "explanation": "Saignement abondant qui ne s'arrête pas spontanément.",
        "img": "https://images.unsplash.com/photo-1584515933487-779824d29309?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel risque d'un capot mal fermé en roulant ?",
        "choices": [
          "Surchauffe",
          "Le capot peut s'ouvrir et bloquer la visibilité",
          "Fuite de refroidissement",
          "Décharge batterie"
        ],
        "correct": 1,
        "explanation": "Un capot mal fermé peut s'ouvrir brusquement et bloquer totalement la visibilité.",
        "img": "assets/images/quiz/quiz-img-032.jpeg"
      },
      {
        "q": "À quoi servent les catadioptres sur un véhicule ?",
        "choices": [
          "Éclairer la route",
          "Rendre le véhicule visible en réfléchissant la lumière",
          "Indiquer un changement de direction",
          "Mesurer la distance"
        ],
        "correct": 1,
        "explanation": "Les catadioptres reflètent la lumière, rendant le véhicule visible phares éteints.",
        "img": "assets/images/quiz/quiz-img-040.jpeg"
      },
      {
        "q": "Pourquoi pratiquer immédiatement une réanimation sur un arrêt cardiaque ?",
        "choices": [
          "Pour réchauffer",
          "Les lésions du cerveau surviennent dès les premières minutes sans oxygène",
          "Pour attendre les secours",
          "Pour vérifier la respiration"
        ],
        "correct": 1,
        "explanation": "Le cerveau ne supporte pas plus de 3-5 min sans oxygène.",
        "img": "https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 3,
    "title": "Conduite & Sécurité 3",
    "icon": "fas fa-lightbulb",
    "color": "#f59e0b",
    "description": "Éclairage, commandes, huile moteur, extérieur, secourisme",
    "questions": [
      {
        "q": "Quel est le risque de maintenir les feux de route lors d'un croisement ?",
        "choices": [
          "Aucun",
          "Éblouir les autres usagers et provoquer un accident",
          "Panne batterie",
          "Surchauffe phares"
        ],
        "correct": 1,
        "explanation": "Les feux de route éblouissent les conducteurs en face.",
        "img": "assets/images/quiz/quiz-img-013.jpeg"
      },
      {
        "q": "Comment reconnaît-on le voyant des feux de route ?",
        "choices": [
          "Vert avec traits horizontaux",
          "Bleu avec traits horizontaux",
          "Rouge en forme de phare",
          "Orange clignotant"
        ],
        "correct": 1,
        "explanation": "Le voyant des feux de route est bleu avec des traits horizontaux.",
        "img": "assets/images/quiz/quiz-img-013.jpeg"
      },
      {
        "q": "Comment passer des feux de croisement aux feux de route ?",
        "choices": [
          "Tourner la molette",
          "Pousser le commodo vers l'avant",
          "Tirer le commodo vers soi",
          "Appuyer sur un bouton au volant"
        ],
        "correct": 1,
        "explanation": "Pousser le commodo d'éclairage vers l'avant (loin du conducteur).",
        "img": "assets/images/quiz/quiz-img-013.jpeg"
      },
      {
        "q": "Quelles conditions pour contrôler le niveau d'huile ?",
        "choices": [
          "Moteur chaud en pente",
          "Moteur froid et terrain plat",
          "Moteur en marche",
          "Peu importe"
        ],
        "correct": 1,
        "explanation": "Vérifier l'huile moteur froid et sur terrain plat.",
        "img": "assets/images/quiz/quiz-img-007.jpeg"
      },
      {
        "q": "Montrez la jauge d'huile. Comment l'utiliser ?",
        "choices": [
          "Retirer, essuyer, replonger, retirer pour lire",
          "Secouer et lire",
          "Tremper dans l'eau",
          "Observer sans retirer"
        ],
        "correct": 0,
        "explanation": "Retirer, essuyer, replonger, retirer pour lire entre MIN et MAX.",
        "img": "assets/images/quiz/quiz-img-029.jpeg"
      },
      {
        "q": "Quel est le principal risque d'un manque d'huile moteur ?",
        "choices": [
          "Surconsommation",
          "Détérioration ou casse du moteur",
          "Plus de bruit",
          "Freins moins efficaces"
        ],
        "correct": 1,
        "explanation": "L'huile lubrifie les pièces. Un manque peut détruire le moteur.",
        "img": "assets/images/quiz/quiz-img-029.jpeg"
      },
      {
        "q": "Les pneus du même essieu doivent-ils être identiques ?",
        "choices": [
          "Non",
          "Oui, même marque, dimension et type",
          "Seulement à l'avant",
          "Seulement en hiver"
        ],
        "correct": 1,
        "explanation": "Pneus du même essieu : identiques pour un comportement sûr.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Quels feux utiliser dans un tunnel éclairé ?",
        "choices": [
          "Feux de route",
          "Feux de croisement",
          "Feux de position",
          "Aucun"
        ],
        "correct": 1,
        "explanation": "Dans un tunnel, même éclairé, allumer les feux de croisement.",
        "img": "https://images.unsplash.com/photo-1545987796-200677ee1011?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le risque d'un pare-brise sale ou endommagé ?",
        "choices": [
          "Use les essuie-glaces",
          "Réduit la visibilité et provoque des éblouissements",
          "Ralentit le véhicule",
          "Empêche la clim"
        ],
        "correct": 1,
        "explanation": "Un pare-brise sale réduit la visibilité, surtout face au soleil ou phares.",
        "img": "assets/images/quiz/quiz-img-045.jpeg"
      },
      {
        "q": "Que faire face à une victime inconsciente qui ne respire pas ?",
        "choices": [
          "La mettre en PLS",
          "Appeler le 15 et commencer un massage cardiaque",
          "Lui donner de l'eau",
          "Attendre qu'elle se réveille"
        ],
        "correct": 1,
        "explanation": "Appeler les secours et commencer la réanimation cardio-pulmonaire (RCP).",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment vérifier la respiration d'une victime ?",
        "choices": [
          "Prendre son pouls",
          "Basculer la tête en arrière, approcher la joue de sa bouche, regarder le thorax",
          "Lui parler",
          "La secouer"
        ],
        "correct": 1,
        "explanation": "Libérer les voies aériennes, approcher sa joue et observer le thorax pendant 10 secondes.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le bouchon de remplissage d'huile. Quel est son symbole ?",
        "choices": [
          "Goutte d'eau",
          "Burette d'huile (arrosoir)",
          "Thermomètre",
          "Clé à molette"
        ],
        "correct": 1,
        "explanation": "Le bouchon porte le symbole d'une burette d'huile.",
        "img": "assets/images/quiz/quiz-img-031.jpeg"
      },
      {
        "q": "Comment repérer le témoin d'usure TWI sur un pneu ?",
        "choices": [
          "Marque rouge sur le flanc",
          "Triangle TWI sur le flanc indiquant l'emplacement dans la rainure",
          "Date inscrite",
          "Pression de gonflage"
        ],
        "correct": 1,
        "explanation": "Le marquage TWI indique les témoins d'usure dans les rainures principales.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Quand faut-il vérifier la pression des pneus ?",
        "choices": [
          "Après un long trajet",
          "À froid, avant de rouler",
          "En roulant",
          "Au contrôle technique"
        ],
        "correct": 1,
        "explanation": "La pression se vérifie à froid car la chaleur fausse la mesure.",
        "img": "assets/images/quiz/quiz-img-038.jpeg"
      },
      {
        "q": "Quel équipement de sécurité enfiler AVANT de sortir du véhicule en panne ?",
        "choices": [
          "Casque",
          "Gilet haute visibilité",
          "Gants",
          "Brassard"
        ],
        "correct": 1,
        "explanation": "Le gilet doit être enfilé AVANT de sortir pour être visible.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez les feux arrière. Combien de fonctions assurent-ils ?",
        "choices": [
          "2",
          "Au moins 5 : position, stop, clignotants, recul, brouillard",
          "3",
          "1"
        ],
        "correct": 1,
        "explanation": "Feux arrière : position, stop, clignotants, recul et brouillard arrière.",
        "img": "assets/images/quiz/quiz-img-041.jpeg"
      },
      {
        "q": "Par quels moyens réaliser l'alerte des secours ?",
        "choices": [
          "Uniquement portable",
          "Téléphone portable, fixe ou borne d'appel d'urgence",
          "En allant aux urgences",
          "Par courrier"
        ],
        "correct": 1,
        "explanation": "Téléphone portable, fixe ou borne d'appel d'urgence (autoroute : tous les 2 km).",
        "img": "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=520&h=260&fit=crop"
      },
      {
        "q": "À quoi sert la molette de réglage de hauteur des phares ?",
        "choices": [
          "Éclairer les panneaux",
          "Adapter l'inclinaison selon la charge du véhicule",
          "Allumer les feux de route",
          "Activer l'éclairage intérieur"
        ],
        "correct": 1,
        "explanation": "Quand le véhicule est chargé, le correcteur ajuste pour ne pas éblouir.",
        "img": "assets/images/quiz/quiz-img-015.jpeg"
      },
      {
        "q": "Quel est le risque d'un éclairage défaillant à l'arrière ?",
        "choices": [
          "Amende légère",
          "Ne pas être vu par les véhicules suivants, risque de collision",
          "Surchauffe",
          "Freins moins efficaces"
        ],
        "correct": 1,
        "explanation": "Un feu arrière défaillant rend le véhicule invisible aux suiveurs.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "À partir de quel âge peut-on apprendre les gestes de premiers secours ?",
        "choices": [
          "18 ans",
          "10 ans",
          "14 ans",
          "Aucun âge minimum"
        ],
        "correct": 3,
        "explanation": "Il n'y a aucun âge minimum pour apprendre les gestes de premiers secours.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 4,
    "title": "Conduite & Sécurité 4",
    "icon": "fas fa-cogs",
    "color": "#8b5cf6",
    "description": "Régulateur, recyclage air, batterie, plaque, sécurité enfant, RCP",
    "questions": [
      {
        "q": "Comment désactiver rapidement le régulateur de vitesse ?",
        "choices": [
          "Tourner le volant",
          "Appuyer sur le frein ou l'embrayage",
          "Éteindre les phares",
          "Changer de radio"
        ],
        "correct": 1,
        "explanation": "Le régulateur se désactive en appuyant sur le frein ou l'embrayage.",
        "img": "assets/images/quiz/quiz-img-020.jpeg"
      },
      {
        "q": "Différence entre régulateur et limiteur de vitesse ?",
        "choices": [
          "Aucune",
          "Régulateur = vitesse constante, limiteur = vitesse max à ne pas dépasser",
          "Limiteur = vitesse constante",
          "Les deux freinent automatiquement"
        ],
        "correct": 1,
        "explanation": "Régulateur : vitesse constante. Limiteur : vitesse maximale à ne pas dépasser.",
        "img": "assets/images/quiz/quiz-img-023.jpeg"
      },
      {
        "q": "Quel risque du recyclage d'air prolongé ?",
        "choices": [
          "Surconsommation",
          "Apparition de buée sur les vitres",
          "Panne de clim",
          "Aucun"
        ],
        "correct": 1,
        "explanation": "Le recyclage prolongé provoque de la buée sur les surfaces vitrées.",
        "img": "assets/images/quiz/quiz-img-022.jpeg"
      },
      {
        "q": "Montrez la batterie sous le capot. Comment la repérer ?",
        "choices": [
          "Plus gros élément noir avec bornes + et -",
          "Bocal transparent",
          "Filtre à air",
          "Radiateur"
        ],
        "correct": 0,
        "explanation": "La batterie est un boîtier noir avec des bornes + (rouge) et - (noir).",
        "img": "assets/images/quiz/quiz-img-030.jpeg"
      },
      {
        "q": "Quelle solution en cas de panne de batterie ?",
        "choices": [
          "Attendre",
          "Brancher des câbles de démarrage depuis une batterie chargée",
          "Pousser le véhicule",
          "Appuyer sur le démarreur"
        ],
        "correct": 1,
        "explanation": "Brancher des câbles : + avec +, - avec - (ou masse métallique).",
        "img": "assets/images/quiz/quiz-img-030.jpeg"
      },
      {
        "q": "Que vérifier sur la plaque d'immatriculation ?",
        "choices": [
          "Couleur du fond",
          "Lisible, propre, non détériorée et bien fixée",
          "Numéro de département",
          "Date mise en circulation"
        ],
        "correct": 1,
        "explanation": "Plaque lisible, propre et correctement fixée. Illisible = amende.",
        "img": "assets/images/quiz/quiz-img-044.jpeg"
      },
      {
        "q": "Montrez les feux de recul. Quand s'allument-ils ?",
        "choices": [
          "Quand on freine",
          "Automatiquement en marche arrière",
          "Quand on allume les phares",
          "Quand on met le clignotant"
        ],
        "correct": 1,
        "explanation": "Les feux de recul (blancs) s'allument automatiquement en marche arrière.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "Où se situe la sécurité enfant sur ce véhicule ?",
        "choices": [
          "Tableau de bord",
          "Sur la tranche de chaque portière arrière",
          "Sous le siège",
          "Boîte à gants"
        ],
        "correct": 1,
        "explanation": "La sécurité enfant est sur la tranche des portières arrière.",
        "img": "https://images.unsplash.com/photo-1590362891818-a0a26e4ec3a6?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel voyant s'allume quand le frein de stationnement est activé ?",
        "choices": [
          "Vert en forme de P",
          "Rouge avec cercle et point d'exclamation ou lettre P",
          "Bleu",
          "Voyant ABS"
        ],
        "correct": 1,
        "explanation": "Le voyant frein de stationnement est rouge, un cercle avec ! ou P.",
        "img": "assets/images/quiz/quiz-img-009.jpeg"
      },
      {
        "q": "Pourquoi attendre que les secours autorisent à raccrocher ?",
        "choices": [
          "Politesse",
          "Ils peuvent donner des instructions de secours en attendant leur arrivée",
          "Obligation légale",
          "Pour noter le numéro de dossier"
        ],
        "correct": 1,
        "explanation": "Les secours peuvent guider vos gestes en attendant leur arrivée.",
        "img": "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=520&h=260&fit=crop"
      },
      {
        "q": "Que peut provoquer la décharge batterie moteur éteint ?",
        "choices": [
          "Frein à main",
          "Feux ou accessoires électriques laissés en fonctionnement",
          "Pneus sous-gonflés",
          "Liquide refroidissement"
        ],
        "correct": 1,
        "explanation": "Feux, radio, accessoires laissés allumés déchargent la batterie.",
        "img": "assets/images/quiz/quiz-img-008.jpeg"
      },
      {
        "q": "Pourquoi vérifier les feux avant un trajet de nuit ?",
        "choices": [
          "Contrôle technique",
          "Voir et être vu correctement",
          "Économiser la batterie",
          "Par habitude"
        ],
        "correct": 1,
        "explanation": "Feux sales ou défaillants réduisent l'éclairage et la visibilité.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment vérifier visuellement l'état d'un pneu ?",
        "choices": [
          "Le toucher",
          "Vérifier témoins d'usure, absence de coupures et déformations",
          "Le peser",
          "Mesurer sa température"
        ],
        "correct": 1,
        "explanation": "Vérifier témoins d'usure, absence de coupures, hernies, déformations.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Quel risque de rouler avec des pneus surgonflés ?",
        "choices": [
          "Pneus durent plus",
          "Usure au centre, moins d'adhérence",
          "Véhicule va plus vite",
          "Aucun"
        ],
        "correct": 1,
        "explanation": "Surgonflés : usure au centre, moins d'adhérence, freinage plus long.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Comment faire un appel de phares ?",
        "choices": [
          "Pousser le commodo",
          "Tirer le commodo vers soi (position instable)",
          "Bouton au volant",
          "Allumer les warnings"
        ],
        "correct": 1,
        "explanation": "Appel de phares : tirer brièvement le commodo vers soi.",
        "img": "assets/images/quiz/quiz-img-035.jpeg"
      },
      {
        "q": "Pourquoi vérifier les niveaux avant un long trajet ?",
        "choices": [
          "Gagner du temps au péage",
          "S'assurer du bon fonctionnement et éviter les pannes",
          "Obligation légale",
          "Économiser du carburant"
        ],
        "correct": 1,
        "explanation": "Un long trajet sollicite davantage. Vérifier les niveaux prévient les pannes.",
        "img": "assets/images/quiz/quiz-img-036.jpeg"
      },
      {
        "q": "Que faire si le voyant STOP s'allume en roulant ?",
        "choices": [
          "Continuer",
          "S'arrêter immédiatement en toute sécurité",
          "Accélérer",
          "Éteindre les phares"
        ],
        "correct": 1,
        "explanation": "Voyant STOP = danger critique. S'arrêter et couper le moteur.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Que risque un inconscient laissé sur le dos ?",
        "choices": [
          "Rien",
          "L'obstruction des voies aériennes par la langue",
          "Douleurs au dos",
          "Hypothermie"
        ],
        "correct": 1,
        "explanation": "La langue peut basculer et obstruer les voies aériennes. D'où la PLS.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "À quoi sert le voyant de préchauffage diesel ?",
        "choices": [
          "Problème moteur",
          "Les bougies chauffent pour faciliter le démarrage à froid",
          "Carburant bas",
          "Surchauffe"
        ],
        "correct": 1,
        "explanation": "Les bougies de préchauffage facilitent le démarrage à froid d'un diesel.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quand utiliser le feu de brouillard arrière ?",
        "choices": [
          "Toujours par pluie",
          "Uniquement en cas de brouillard ou neige",
          "Sur autoroute uniquement",
          "Si visibilité réduite"
        ],
        "correct": 1,
        "explanation": "Le feu de brouillard arrière : uniquement en brouillard ou neige.",
        "img": "assets/images/quiz/quiz-img-011.jpeg"
      }
    ]
  },
  {
    "id": 5,
    "title": "Conduite & Sécurité 5",
    "icon": "fas fa-tools",
    "color": "#10b981",
    "description": "Entretien, ampoules, ceinture, commandes éclairage, massage cardiaque",
    "questions": [
      {
        "q": "Montrez l'emplacement des ampoules de feux de croisement. Comment vérifier ?",
        "choices": [
          "Les toucher",
          "Allumer les feux et vérifier devant un mur",
          "Vérifier le voyant",
          "Écouter un bruit"
        ],
        "correct": 1,
        "explanation": "Allumer les feux et vérifier visuellement devant un mur ou avec de l'aide.",
        "img": "assets/images/quiz/quiz-img-013.jpeg"
      },
      {
        "q": "Comment ajuster la ceinture pour qu'elle soit efficace ?",
        "choices": [
          "Sous le bras",
          "Sur l'os de la hanche et au milieu de l'épaule",
          "Serrer le plus possible",
          "Seulement sur autoroute"
        ],
        "correct": 1,
        "explanation": "La ceinture : sur l'os de la hanche (bas) et au milieu de l'épaule (haut).",
        "img": null
      },
      {
        "q": "Quand porter la ceinture ?",
        "choices": [
          "Sur autoroute",
          "À haute vitesse",
          "À chaque trajet même court, tous les occupants",
          "Seulement le conducteur"
        ],
        "correct": 2,
        "explanation": "Obligatoire pour tous les occupants à chaque trajet, quelle que soit la distance.",
        "img": null
      },
      {
        "q": "Quel voyant indique que le système ABS est défaillant ?",
        "choices": [
          "Vert ABS",
          "Orange ou rouge ABS",
          "Voyant frein classique",
          "Voyant batterie"
        ],
        "correct": 1,
        "explanation": "Voyant ABS orange ou rouge : l'antiblocage ne fonctionne plus.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez la commande d'éclairage. Comment allumer les feux de croisement ?",
        "choices": [
          "Première position molette",
          "Deuxième position (symbole 2 faisceaux)",
          "Pousser le commodo",
          "Tirer le commodo"
        ],
        "correct": 1,
        "explanation": "Feux de croisement : tourner la bague du commodo sur la position appropriée.",
        "img": "assets/images/quiz/quiz-img-013.jpeg"
      },
      {
        "q": "Que signifie un voyant ESP/ASR allumé en orange ?",
        "choices": [
          "Fonctionnement normal",
          "Le contrôle de stabilité intervient ou est désactivé",
          "Surchauffe",
          "Feux mal réglés"
        ],
        "correct": 1,
        "explanation": "ESP clignotant = le système intervient. Fixe = désactivé ou en panne.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "À quoi sert le liquide de refroidissement ?",
        "choices": [
          "Lubrifier le moteur",
          "Maintenir le moteur à bonne température",
          "Alimenter les essuie-glaces",
          "Freiner"
        ],
        "correct": 1,
        "explanation": "Le liquide de refroidissement circule pour absorber la chaleur via le radiateur.",
        "img": "assets/images/quiz/quiz-img-028.jpeg"
      },
      {
        "q": "Quel est le rôle de l'alternateur ?",
        "choices": [
          "Démarrer le moteur",
          "Recharger la batterie et alimenter les équipements électriques",
          "Refroidir le moteur",
          "Filtrer l'huile"
        ],
        "correct": 1,
        "explanation": "L'alternateur produit du courant pour recharger la batterie.",
        "img": "assets/images/quiz/quiz-img-030.jpeg"
      },
      {
        "q": "À quelle fréquence vérifier la pression des pneus ?",
        "choices": [
          "Tous les 6 mois",
          "Une fois par mois et avant chaque long trajet",
          "Une fois par an",
          "Au contrôle technique"
        ],
        "correct": 1,
        "explanation": "Vérifier la pression une fois par mois et avant chaque long trajet, à froid.",
        "img": "assets/images/quiz/quiz-img-038.jpeg"
      },
      {
        "q": "Montrez le bouton des feux de détresse. Quel est son symbole ?",
        "choices": [
          "Cercle rouge",
          "Triangle rouge",
          "Carré orange",
          "Losange blanc"
        ],
        "correct": 1,
        "explanation": "Le bouton des feux de détresse porte le symbole d'un triangle rouge.",
        "img": "assets/images/quiz/quiz-img-019.jpeg"
      },
      {
        "q": "Quel est le risque principal d'un airbag défectueux ?",
        "choices": [
          "Véhicule ne démarre pas",
          "L'airbag ne se déclenchera pas en cas de choc",
          "Ceintures ne fonctionnent plus",
          "Moteur cale"
        ],
        "correct": 1,
        "explanation": "Un airbag défectueux ne protégera pas les occupants en cas d'accident.",
        "img": "assets/images/quiz/quiz-img-001.jpeg"
      },
      {
        "q": "Comment réaliser un massage cardiaque sur un adulte ?",
        "choices": [
          "30 insufflations puis 2 compressions",
          "30 compressions thoraciques puis 2 insufflations",
          "10 compressions puis 5 insufflations",
          "Uniquement des insufflations"
        ],
        "correct": 1,
        "explanation": "RCP adulte : 30 compressions thoraciques puis 2 insufflations.",
        "img": "https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=520&h=260&fit=crop"
      },
      {
        "q": "Où placer les mains pour un massage cardiaque ?",
        "choices": [
          "Sur le ventre",
          "Au centre de la poitrine, entre les deux mamelons",
          "Sur le côté gauche",
          "Sur le cou"
        ],
        "correct": 1,
        "explanation": "Placer les mains au centre de la poitrine, sur le sternum.",
        "img": "https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel risque d'un manque de liquide de refroidissement ?",
        "choices": [
          "Chauffage ne marche plus",
          "Surchauffe et casse du moteur",
          "Freins moins efficaces",
          "Direction dure"
        ],
        "correct": 1,
        "explanation": "Sans refroidissement suffisant, le moteur surchauffe et peut casser.",
        "img": "assets/images/quiz/quiz-img-028.jpeg"
      },
      {
        "q": "Montrez la commande de recyclage d'air. Quand l'utiliser ?",
        "choices": [
          "En permanence",
          "En cas de mauvaises odeurs ou pollution, temporairement",
          "Jamais",
          "Uniquement en hiver"
        ],
        "correct": 1,
        "explanation": "Le recyclage d'air s'utilise temporairement en cas de pollution ou odeurs.",
        "img": "assets/images/quiz/quiz-img-022.jpeg"
      },
      {
        "q": "Comment identifier le bocal de liquide de frein ?",
        "choices": [
          "Il est bleu",
          "Transparent, près du maître-cylindre, avec symbole de frein",
          "Il est jaune",
          "Près du radiateur"
        ],
        "correct": 1,
        "explanation": "Le bocal est transparent, situé près du maître-cylindre.",
        "img": "assets/images/quiz/quiz-img-027.jpeg"
      },
      {
        "q": "Que vérifier avant de compléter un niveau de liquide ?",
        "choices": [
          "Couleur",
          "Le type de liquide recommandé par le constructeur",
          "Marque du véhicule",
          "Rien"
        ],
        "correct": 1,
        "explanation": "Toujours utiliser le liquide recommandé par le constructeur.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Principal risque d'une absence de liquide lave-glace ?",
        "choices": [
          "Usure essuie-glaces",
          "Mauvaise visibilité si pare-brise sale",
          "Problème freinage",
          "Surchauffe"
        ],
        "correct": 1,
        "explanation": "Sans lave-glace, impossible de nettoyer le pare-brise.",
        "img": "assets/images/quiz/quiz-img-033.jpeg"
      },
      {
        "q": "Peut-on installer un siège enfant dos à la route à l'avant ?",
        "choices": [
          "Oui sans condition",
          "Oui si l'airbag passager est désactivé",
          "Non jamais",
          "Après 2 ans seulement"
        ],
        "correct": 1,
        "explanation": "Siège dos à la route à l'avant uniquement si airbag passager désactivé.",
        "img": "assets/images/quiz/quiz-img-004.jpeg"
      },
      {
        "q": "Qu'est-ce que le DAE peut faire automatiquement ?",
        "choices": [
          "Diagnostiquer toutes les maladies",
          "Analyser le rythme cardiaque et décider si un choc est nécessaire",
          "Appeler les secours",
          "Administrer un médicament"
        ],
        "correct": 1,
        "explanation": "Le DAE analyse le rythme et décide seul si un choc électrique est nécessaire.",
        "img": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 6,
    "title": "Conduite & Sécurité 6",
    "icon": "fas fa-eye",
    "color": "#06b6d4",
    "description": "Visibilité, voyants avancés, pneumatiques, secours routier",
    "questions": [
      {
        "q": "Pourquoi faut-il régler le siège conducteur avant de démarrer ?",
        "choices": [
          "Confort",
          "Atteindre facilement les pédales et bien voir la route",
          "Obligation légale",
          "Ne pas user le siège"
        ],
        "correct": 1,
        "explanation": "Bon réglage = accès pédales, bonne vision route et rétroviseurs.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment vérifier que toutes les portières sont bien fermées ?",
        "choices": [
          "Vérifier le voyant",
          "Tirer chaque poignée",
          "Écouter un clic",
          "Les trois à la fois"
        ],
        "correct": 3,
        "explanation": "Voyant du tableau de bord + tirer les poignées + écouter le clic.",
        "img": "assets/images/quiz/quiz-img-011.jpeg"
      },
      {
        "q": "Que faire si le voyant airbag reste allumé ?",
        "choices": [
          "Rien c'est normal",
          "Faire vérifier par un professionnel rapidement",
          "Débrancher la batterie",
          "Retirer le fusible"
        ],
        "correct": 1,
        "explanation": "Voyant airbag allumé = dysfonctionnement. Consulter un garagiste.",
        "img": "assets/images/quiz/quiz-img-001.jpeg"
      },
      {
        "q": "Quelle est la fonction du prétensionneur de ceinture ?",
        "choices": [
          "Détendre la ceinture",
          "Rétracter la ceinture au moment de l'impact",
          "Allumer le voyant",
          "Bloquer en freinage normal"
        ],
        "correct": 1,
        "explanation": "Le prétensionneur rétracte la ceinture au moment du choc.",
        "img": "assets/images/quiz/quiz-img-002.jpeg"
      },
      {
        "q": "Lisez l'étiquette de pression. Quelle pression pour véhicule chargé ?",
        "choices": [
          "2,1 bars",
          "2,6 bars",
          "3,0 bars",
          "1,8 bars"
        ],
        "correct": 1,
        "explanation": "L'étiquette indique 2,6 bars pour le véhicule chargé.",
        "img": "assets/images/quiz/quiz-img-038.jpeg"
      },
      {
        "q": "Montrez le bouton de désembuage pare-brise avant.",
        "choices": [
          "Bouton ventilateur",
          "Bouton avec pare-brise et flèches ondulées",
          "Bouton A/C",
          "Bouton recyclage"
        ],
        "correct": 1,
        "explanation": "Le bouton porte le symbole d'un pare-brise avec des flèches ondulées.",
        "img": "assets/images/quiz/quiz-img-018.jpeg"
      },
      {
        "q": "Pour la visibilité arrière par pluie, quelle commande en plus de l'essuie-glace ?",
        "choices": [
          "Brouillard",
          "Dégivrage/désembuage lunette arrière",
          "Feux de recul",
          "Lave-glace avant"
        ],
        "correct": 1,
        "explanation": "Le désembuage arrière élimine la buée sur la lunette arrière.",
        "img": "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel risque de mélanger deux types d'huile moteur ?",
        "choices": [
          "Aucun",
          "Réactions chimiques pouvant endommager le moteur",
          "Moteur tourne mieux",
          "Huile plus fluide"
        ],
        "correct": 1,
        "explanation": "Mélanger des huiles incompatibles peut altérer leurs propriétés.",
        "img": "assets/images/quiz/quiz-img-029.jpeg"
      },
      {
        "q": "Que signifie le voyant TPMS (pneu avec point d'exclamation) ?",
        "choices": [
          "Pneus en bon état",
          "Un ou plusieurs pneus ont une pression anormale",
          "Changer les pneus",
          "Frein à main serré"
        ],
        "correct": 1,
        "explanation": "Voyant TPMS = pression anormale. Vérifier immédiatement.",
        "img": "assets/images/quiz/quiz-img-014.jpeg"
      },
      {
        "q": "Où ranger le gilet haute visibilité ?",
        "choices": [
          "Dans le coffre",
          "À portée de main dans l'habitacle (sous le siège ou portière)",
          "Sous le capot",
          "Dans la boîte à gants"
        ],
        "correct": 1,
        "explanation": "Le gilet doit être accessible depuis l'habitacle pour l'enfiler avant de sortir.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment protéger la zone d'un accident ?",
        "choices": [
          "Klaxonner",
          "Baliser avec les warnings, le triangle et le gilet",
          "Rester dans la voiture",
          "Appeler la police d'abord"
        ],
        "correct": 1,
        "explanation": "Allumer les warnings, enfiler le gilet, poser le triangle à 30m.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie PLS ?",
        "choices": [
          "Position Latérale Simple",
          "Position Latérale de Sécurité",
          "Premiers Lieux de Secours",
          "Protection Locale des Secours"
        ],
        "correct": 1,
        "explanation": "PLS = Position Latérale de Sécurité pour les victimes inconscientes qui respirent.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le rythme du massage cardiaque sur un adulte ?",
        "choices": [
          "50 compressions/min",
          "100 à 120 compressions/min",
          "200 compressions/min",
          "30 compressions/min"
        ],
        "correct": 1,
        "explanation": "Le rythme est de 100 à 120 compressions par minute.",
        "img": "https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=520&h=260&fit=crop"
      },
      {
        "q": "Faut-il retirer le casque d'un motard accidenté ?",
        "choices": [
          "Toujours",
          "Non, sauf s'il ne respire pas et uniquement pour libérer les voies aériennes",
          "Oui pour vérifier son identité",
          "Seulement si le casque est abîmé"
        ],
        "correct": 1,
        "explanation": "Ne retirer le casque que si la victime ne respire pas, à deux de préférence.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez l'emplacement de l'antenne sur ce véhicule.",
        "choices": [
          "Sur le capot",
          "Sur le toit (antenne requin)",
          "Sur le pare-chocs",
          "Sur le coffre"
        ],
        "correct": 1,
        "explanation": "L'antenne est sur le toit, souvent en forme de requin.",
        "img": null
      },
      {
        "q": "Comment reconnaît-on le voyant du feu de brouillard arrière ?",
        "choices": [
          "Symbole vert",
          "Orange/ambre avec traits ondulés",
          "Bleu",
          "Rouge"
        ],
        "correct": 1,
        "explanation": "Voyant feu brouillard arrière = orange/ambre avec un phare et traits ondulés.",
        "img": "assets/images/quiz/quiz-img-011.jpeg"
      },
      {
        "q": "Que faire si la batterie est déchargée moteur éteint ?",
        "choices": [
          "Attendre",
          "Utiliser des câbles de démarrage ou appeler l'assistance",
          "Pousser le véhicule",
          "Changer les bougies"
        ],
        "correct": 1,
        "explanation": "Câbles de démarrage ou assistance routière.",
        "img": "assets/images/quiz/quiz-img-030.jpeg"
      },
      {
        "q": "Un DAE est-il utilisable par un non-professionnel ?",
        "choices": [
          "Non, réservé aux médecins",
          "Oui, il guide l'utilisateur par des instructions vocales",
          "Uniquement par les pompiers",
          "Après une formation obligatoire"
        ],
        "correct": 1,
        "explanation": "Le DAE est conçu pour être utilisé par n'importe qui, il donne des instructions vocales.",
        "img": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=520&h=260&fit=crop"
      },
      {
        "q": "Pourquoi connaître la signification des voyants ?",
        "choices": [
          "Impressionner le moniteur",
          "Réagir correctement face à une anomalie",
          "Pas important",
          "Passer le contrôle technique"
        ],
        "correct": 1,
        "explanation": "Connaître les voyants = réagir vite : s'arrêter si rouge, vérifier si orange.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la conduite à tenir face à un blessé qui saigne abondamment ?",
        "choices": [
          "Mettre un garrot",
          "Allonger la victime, appuyer sur la plaie, appeler les secours",
          "Donner de l'eau",
          "Faire marcher la victime"
        ],
        "correct": 1,
        "explanation": "Allonger la victime, appuyer fortement sur la plaie et alerter les secours.",
        "img": null
      }
    ]
  },
  {
    "id": 7,
    "title": "Conduite & Sécurité 7",
    "icon": "fas fa-road",
    "color": "#ec4899",
    "description": "Conduite de nuit, mécanique, pression, premiers secours avancés",
    "questions": [
      {
        "q": "Quelle commande utiliser pour le lave-glace avant ?",
        "choices": [
          "Pousser commodo",
          "Tirer ou pousser le commodo d'essuie-glace vers le volant",
          "Tourner la bague",
          "Bouton au tableau de bord"
        ],
        "correct": 1,
        "explanation": "Le lave-glace s'actionne en manipulant le commodo d'essuie-glace.",
        "img": "assets/images/quiz/quiz-img-025.jpeg"
      },
      {
        "q": "Quand faut-il utiliser les feux de croisement ?",
        "choices": [
          "Uniquement la nuit",
          "Nuit et quand visibilité insuffisante (pluie, brouillard, tunnel)",
          "En agglomération",
          "Sur autoroute"
        ],
        "correct": 1,
        "explanation": "Feux de croisement : nuit et de jour si visibilité réduite.",
        "img": "assets/images/quiz/quiz-img-013.jpeg"
      },
      {
        "q": "Montrez le voyant de niveau de carburant. Quel risque si vide ?",
        "choices": [
          "Moteur tourne mieux",
          "Désamorçage du circuit et panne sèche",
          "Voyant reste éteint",
          "Liquide frein baisse"
        ],
        "correct": 1,
        "explanation": "Réservoir vide = désamorçage du circuit (surtout diesel) et panne sèche.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le rôle du catalyseur dans le système d'échappement ?",
        "choices": [
          "Augmenter la puissance",
          "Réduire les émissions polluantes",
          "Diminuer le bruit",
          "Refroidir les gaz"
        ],
        "correct": 1,
        "explanation": "Le catalyseur transforme les gaz polluants en gaz moins nocifs.",
        "img": null
      },
      {
        "q": "Comment reconnaître une fuite de liquide sous le véhicule ?",
        "choices": [
          "En écoutant",
          "En repérant des taches colorées sur le sol sous le véhicule",
          "En vérifiant le compteur",
          "En sentant l'habitacle"
        ],
        "correct": 1,
        "explanation": "Taches sous le véhicule : rouge/rose = refroidissement, marron = huile, transparent = eau clim.",
        "img": null
      },
      {
        "q": "Quel est le risque de rouler avec un seul feu de croisement ?",
        "choices": [
          "Aucun risque",
          "Être confondu avec un deux-roues et réduire l'éclairage",
          "La batterie se décharge",
          "Le moteur surchauffe"
        ],
        "correct": 1,
        "explanation": "Un seul feu = confusion avec un deux-roues et éclairage insuffisant.",
        "img": "assets/images/quiz/quiz-img-035.jpeg"
      },
      {
        "q": "Que signifie le voyant de direction assistée allumé ?",
        "choices": [
          "La direction est trop légère",
          "Un dysfonctionnement de la direction assistée",
          "Le volant est mal positionné",
          "La vitesse est trop élevée"
        ],
        "correct": 1,
        "explanation": "Voyant direction assistée = dysfonctionnement. La direction devient plus dure.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment vérifier le bon fonctionnement des feux stop ?",
        "choices": [
          "Les toucher",
          "Demander à quelqu'un d'observer pendant qu'on appuie sur le frein",
          "Vérifier le voyant",
          "Écouter un bruit"
        ],
        "correct": 1,
        "explanation": "Appuyer sur la pédale de frein pendant qu'une personne vérifie à l'arrière.",
        "img": "assets/images/quiz/quiz-img-041.jpeg"
      },
      {
        "q": "Comment réagir si le voyant de pression d'huile s'allume en conduisant ?",
        "choices": [
          "Continuer",
          "S'arrêter immédiatement et vérifier le niveau d'huile",
          "Accélérer",
          "Couper la clim"
        ],
        "correct": 1,
        "explanation": "S'arrêter immédiatement. Rouler sans pression d'huile détruit le moteur en minutes.",
        "img": "assets/images/quiz/quiz-img-014.jpeg"
      },
      {
        "q": "Quel document doit être à jour et présent dans le véhicule ?",
        "choices": [
          "Le livret de famille",
          "Le certificat d'immatriculation (carte grise)",
          "Le passeport",
          "Le carnet de santé"
        ],
        "correct": 1,
        "explanation": "La carte grise doit être à jour et présente lors de tout contrôle.",
        "img": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire en premier face à un accident de la route ?",
        "choices": [
          "Filmer avec son téléphone",
          "Protéger, alerter, secourir (PAS)",
          "Déplacer les victimes",
          "Chercher les papiers"
        ],
        "correct": 1,
        "explanation": "PAS : Protéger la zone, Alerter les secours, Secourir les victimes.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment protéger un accident sur autoroute ?",
        "choices": [
          "Rester sur la voie",
          "Se garer après l'accident, allumer les warnings, enfiler le gilet, placer le triangle",
          "Faire demi-tour",
          "Klaxonner"
        ],
        "correct": 1,
        "explanation": "Se garer en aval, warnings, gilet avant de sortir, triangle 30m en amont.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la position correcte pour la PLS ?",
        "choices": [
          "Sur le dos",
          "Sur le côté, bouche ouverte orientée vers le sol, une jambe pliée",
          "Assis",
          "Sur le ventre"
        ],
        "correct": 1,
        "explanation": "PLS : sur le côté, bouche ouverte vers le sol pour que les liquides s'écoulent.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire si une victime convulse ?",
        "choices": [
          "La maintenir fermement",
          "Protéger sa tête, ne rien mettre dans sa bouche, attendre la fin de la crise",
          "Lui donner de l'eau",
          "La réveiller"
        ],
        "correct": 1,
        "explanation": "Protéger la tête, ne rien mettre dans la bouche, appeler les secours après la crise.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment vérifier que les clignotants fonctionnent ?",
        "choices": [
          "Les toucher",
          "Mettre le contact, actionner le clignotant et vérifier visuellement",
          "Écouter seulement",
          "Vérifier la batterie"
        ],
        "correct": 1,
        "explanation": "Mettre le contact, actionner chaque clignotant et vérifier visuellement.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel pneu est le plus sollicité en virage à droite ?",
        "choices": [
          "Arrière droit",
          "Avant gauche",
          "Arrière gauche",
          "Avant droit"
        ],
        "correct": 1,
        "explanation": "En virage à droite, le pneu avant gauche supporte le plus de charge (force centrifuge).",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Pourquoi faut-il permuter les pneus régulièrement ?",
        "choices": [
          "Pour le style",
          "Pour uniformiser l'usure entre l'avant et l'arrière",
          "Pour consommer moins",
          "Ce n'est pas nécessaire"
        ],
        "correct": 1,
        "explanation": "La permutation uniformise l'usure car les pneus avant s'usent plus vite.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Que peut causer un filtre à air encrassé ?",
        "choices": [
          "Améliore les performances",
          "Surconsommation et perte de puissance",
          "Les freins sont moins efficaces",
          "La direction est dure"
        ],
        "correct": 1,
        "explanation": "Un filtre à air encrassé augmente la consommation et réduit la puissance.",
        "img": null
      },
      {
        "q": "Qu'est-ce que le « survirage » ?",
        "choices": [
          "Le véhicule tourne trop peu",
          "L'arrière du véhicule dérape vers l'extérieur du virage",
          "Le volant vibre",
          "Le moteur accélère seul"
        ],
        "correct": 1,
        "explanation": "Survirage : l'arrière du véhicule part vers l'extérieur du virage.",
        "img": null
      },
      {
        "q": "Que faire si une victime est coincée dans un véhicule après un accident ?",
        "choices": [
          "La tirer de force",
          "Ne pas la déplacer sauf danger vital imminent, couper le contact, alerter",
          "Casser la vitre",
          "Pousser le véhicule"
        ],
        "correct": 1,
        "explanation": "Ne pas déplacer sauf danger vital. Couper le contact et alerter les secours.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 8,
    "title": "Conduite & Sécurité 8",
    "icon": "fas fa-tachometer-alt",
    "color": "#f97316",
    "description": "Tableau de bord, entretien courant, visibilité, urgences",
    "questions": [
      {
        "q": "Que signifie le voyant du moteur (check engine) allumé en orange ?",
        "choices": [
          "Le moteur va casser",
          "Un défaut moteur ou antipollution à faire vérifier",
          "Le réservoir est plein",
          "La vidange est faite"
        ],
        "correct": 1,
        "explanation": "Voyant moteur orange = défaut moteur/antipollution à faire vérifier rapidement.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la durée de vie moyenne d'une batterie de voiture ?",
        "choices": [
          "1 an",
          "4 à 5 ans",
          "10 ans",
          "Illimitée"
        ],
        "correct": 1,
        "explanation": "Une batterie dure en moyenne 4 à 5 ans selon les conditions d'utilisation.",
        "img": "assets/images/quiz/quiz-img-030.jpeg"
      },
      {
        "q": "Montrez où se branchent les câbles de démarrage sur la batterie.",
        "choices": [
          "N'importe où",
          "Le + sur la borne +, le - sur la borne - ou sur une masse métallique",
          "Le - sur la borne +",
          "Uniquement sur le +"
        ],
        "correct": 1,
        "explanation": "Le câble rouge sur + des deux batteries, le noir sur - puis sur une masse métallique.",
        "img": "assets/images/quiz/quiz-img-030.jpeg"
      },
      {
        "q": "Quand utiliser la climatisation en hiver ?",
        "choices": [
          "Jamais",
          "Pour désembuer les vitres rapidement",
          "Uniquement en été",
          "Quand il fait très froid"
        ],
        "correct": 1,
        "explanation": "La climatisation assèche l'air et aide à désembuer rapidement les vitres.",
        "img": null
      },
      {
        "q": "Comment ajuster la hauteur des phares quand le véhicule est chargé ?",
        "choices": [
          "Rien à faire",
          "Utiliser la molette de réglage pour abaisser les faisceaux",
          "Allumer les feux de route",
          "Mettre les warnings"
        ],
        "correct": 1,
        "explanation": "Utiliser la molette de réglage de hauteur pour ne pas éblouir les autres.",
        "img": "assets/images/quiz/quiz-img-035.jpeg"
      },
      {
        "q": "Quel est le risque d'un essuie-glace usé par forte pluie ?",
        "choices": [
          "Aucun",
          "Mauvaise visibilité pouvant provoquer un accident",
          "Le moteur surchauffe",
          "La batterie se décharge"
        ],
        "correct": 1,
        "explanation": "Essuie-glaces usés = mauvaise visibilité, très dangereux par forte pluie.",
        "img": "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le voyant de porte ouverte avec un coffre ?",
        "choices": [
          "Le capot est ouvert",
          "Le coffre n'est pas correctement fermé",
          "Le moteur est en panne",
          "Le réservoir est ouvert"
        ],
        "correct": 1,
        "explanation": "Ce voyant indique que le coffre n'est pas fermé correctement.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel liquide a un bouchon jaune sous le capot ?",
        "choices": [
          "Lave-glace",
          "Liquide de refroidissement",
          "Huile moteur (jauge)",
          "Liquide de frein"
        ],
        "correct": 2,
        "explanation": "La jauge d'huile a souvent une poignée jaune pour la repérer facilement.",
        "img": null
      },
      {
        "q": "Quelle est la principale cause d'accident mortel en France ?",
        "choices": [
          "Vitesse",
          "L'alcool au volant",
          "Pneus usés",
          "Météo"
        ],
        "correct": 0,
        "explanation": "La vitesse excessive est la première cause d'accident mortel en France.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le taux d'alcool maximal autorisé pour un conducteur novice ?",
        "choices": [
          "0,5 g/l",
          "0,2 g/l",
          "0 g/l",
          "0,8 g/l"
        ],
        "correct": 1,
        "explanation": "Pour un permis probatoire, le taux maximal est de 0,2 g/l de sang.",
        "img": "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=520&h=260&fit=crop"
      },
      {
        "q": "Que vérifier sur les essuie-glaces régulièrement ?",
        "choices": [
          "La couleur",
          "L'état des balais (fissures, déformations, traces)",
          "Le nombre de vitesses",
          "La marque"
        ],
        "correct": 1,
        "explanation": "Vérifier que les balais ne sont pas fissurés, déformés ou laissent des traces.",
        "img": "assets/images/quiz/quiz-img-017.jpeg"
      },
      {
        "q": "Comment savoir de quel côté est la trappe à carburant ?",
        "choices": [
          "Au hasard",
          "La petite flèche à côté du symbole de pompe sur la jauge",
          "En regardant le toit",
          "En lisant le manuel"
        ],
        "correct": 1,
        "explanation": "Une petite flèche à côté du symbole de pompe indique le côté de la trappe.",
        "img": "assets/images/quiz/quiz-img-046.jpeg"
      },
      {
        "q": "Que signifie l'allumage de tous les voyants au démarrage ?",
        "choices": [
          "Une panne grave",
          "Un test automatique normal, ils doivent s'éteindre rapidement",
          "La batterie est faible",
          "Les fusibles sont grillés"
        ],
        "correct": 1,
        "explanation": "Au démarrage, tous les voyants s'allument pour un auto-test puis s'éteignent.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "À quoi sert le filtre d'habitacle ?",
        "choices": [
          "Filtrer l'huile",
          "Filtrer l'air entrant dans l'habitacle (poussières, pollen, odeurs)",
          "Refroidir le moteur",
          "Filtrer le carburant"
        ],
        "correct": 1,
        "explanation": "Le filtre d'habitacle purifie l'air entrant dans le véhicule.",
        "img": null
      },
      {
        "q": "Comment réagir face à un accident avec une victime qui ne bouge plus ?",
        "choices": [
          "La déplacer",
          "Vérifier sa conscience, sa respiration, alerter et commencer les gestes de secours",
          "Lui donner de l'eau",
          "Attendre la police"
        ],
        "correct": 1,
        "explanation": "Vérifier conscience et respiration, alerter les secours, agir selon l'état.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Combien de temps peut-on maintenir un massage cardiaque ?",
        "choices": [
          "5 minutes",
          "Jusqu'à l'arrivée des secours ou l'utilisation d'un DAE",
          "10 minutes",
          "30 secondes"
        ],
        "correct": 1,
        "explanation": "Le massage cardiaque se poursuit jusqu'à l'arrivée des secours ou du DAE.",
        "img": "https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire si un enfant s'étouffe ?",
        "choices": [
          "Lui donner de l'eau",
          "5 tapes dans le dos entre les omoplates, puis 5 compressions abdominales",
          "Attendre que ça passe",
          "Le mettre tête en bas"
        ],
        "correct": 1,
        "explanation": "5 tapes dans le dos puis 5 compressions (Heimlich pour adulte/enfant).",
        "img": "https://images.unsplash.com/photo-1590362891818-a0a26e4ec3a6?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est l'angle mort d'un véhicule ?",
        "choices": [
          "Zone derrière le véhicule",
          "Zone non visible dans les rétroviseurs, à tourner la tête pour vérifier",
          "Zone devant le véhicule",
          "Le toit du véhicule"
        ],
        "correct": 1,
        "explanation": "L'angle mort est la zone non couverte par les rétroviseurs. Tourner la tête pour vérifier.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Pourquoi ne pas téléphoner au volant ?",
        "choices": [
          "Ça use la batterie",
          "Cela détourne l'attention et multiplie le risque d'accident par 3",
          "Ce n'est pas interdit",
          "Le signal est mauvais"
        ],
        "correct": 1,
        "explanation": "Téléphoner au volant multiplie le risque d'accident par 3 à 5.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire si le volant vibre à haute vitesse ?",
        "choices": [
          "Accélérer",
          "Faire vérifier l'équilibrage des roues",
          "Freiner brusquement",
          "Tourner le volant"
        ],
        "correct": 1,
        "explanation": "Des vibrations au volant indiquent souvent un déséquilibrage des roues.",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 9,
    "title": "Conduite & Sécurité 9",
    "icon": "fas fa-gas-pump",
    "color": "#14b8a6",
    "description": "Carburant, éco-conduite, signalisation, gestes d'urgence",
    "questions": [
      {
        "q": "Quel carburant utiliser pour ce véhicule ?",
        "choices": [
          "Diesel",
          "Celui indiqué sur la trappe à carburant et dans le carnet d'entretien",
          "N'importe lequel",
          "Le moins cher"
        ],
        "correct": 1,
        "explanation": "Toujours utiliser le carburant indiqué par le constructeur. Erreur = panne grave.",
        "img": null
      },
      {
        "q": "Que se passe-t-il si l'on met du diesel dans un moteur essence ?",
        "choices": [
          "Rien",
          "Le moteur peut être gravement endommagé",
          "Le véhicule roule mieux",
          "La consommation baisse"
        ],
        "correct": 1,
        "explanation": "Erreur de carburant = dommages importants au moteur. Ne pas démarrer.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment adopter une éco-conduite ?",
        "choices": [
          "Accélérer fort",
          "Anticiper, rouler à vitesse stable, rétrograder au lieu de freiner",
          "Rouler en roue libre",
          "Ne jamais utiliser la clim"
        ],
        "correct": 1,
        "explanation": "Éco-conduite : anticiper, vitesse stable, utiliser le frein moteur.",
        "img": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le panneau rond rouge avec un trait blanc horizontal ?",
        "choices": [
          "Stationnement interdit",
          "Sens interdit",
          "Interdiction de tourner",
          "Fin de zone"
        ],
        "correct": 1,
        "explanation": "Cercle rouge avec barre blanche = sens interdit.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie un triangle rouge pointe en haut ?",
        "choices": [
          "Sens interdit",
          "Cédez le passage",
          "Stop",
          "Priorité"
        ],
        "correct": 1,
        "explanation": "Triangle rouge pointe en haut = cédez le passage.",
        "img": "assets/images/quiz/quiz-img-048.jpeg"
      },
      {
        "q": "Quelle distance de sécurité sur autoroute à 130 km/h ?",
        "choices": [
          "50 mètres",
          "Au moins 2 secondes soit environ 70 mètres",
          "30 mètres",
          "100 mètres"
        ],
        "correct": 1,
        "explanation": "Distance de sécurité = 2 secondes minimum, soit ~70m à 130 km/h.",
        "img": "https://images.unsplash.com/photo-1545987796-200677ee1011?w=520&h=260&fit=crop"
      },
      {
        "q": "En cas de crevaison, où s'arrêter de préférence ?",
        "choices": [
          "Sur la voie de droite",
          "Sur une bande d'arrêt d'urgence ou un endroit plat et dégagé",
          "Au milieu de la route",
          "Sur la voie de gauche"
        ],
        "correct": 1,
        "explanation": "Bande d'arrêt d'urgence ou endroit plat, dégagé et en sécurité.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Que contient la roue de secours (ou kit de gonflage) de ce véhicule ?",
        "choices": [
          "Un pneu neuf",
          "Une bombe anti-crevaison ou une roue galette",
          "Un cric hydraulique",
          "Des câbles"
        ],
        "correct": 1,
        "explanation": "Les véhicules récents ont souvent un kit anti-crevaison ou une roue galette.",
        "img": "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le risque de rouler avec un pneu crevé ?",
        "choices": [
          "Aucun à basse vitesse",
          "Dommage à la jante et perte de contrôle du véhicule",
          "Le moteur surchauffe",
          "La batterie se décharge"
        ],
        "correct": 1,
        "explanation": "Pneu crevé = perte de contrôle et dommage irréversible à la jante.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Que vérifier après avoir changé une roue ?",
        "choices": [
          "Rien",
          "Le serrage des écrous après 50-100 km",
          "La peinture",
          "Les essuie-glaces"
        ],
        "correct": 1,
        "explanation": "Resserrer les écrous après 50-100 km car ils peuvent se desserrer.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quand changer les balais d'essuie-glaces ?",
        "choices": [
          "Tous les mois",
          "Au moins une fois par an ou dès qu'ils laissent des traces",
          "Tous les 5 ans",
          "Jamais"
        ],
        "correct": 1,
        "explanation": "Changer les balais au moins une fois par an ou dès qu'ils sont inefficaces.",
        "img": "assets/images/quiz/quiz-img-017.jpeg"
      },
      {
        "q": "Comment savoir si les plaquettes de frein sont usées ?",
        "choices": [
          "Voyant d'usure plaquettes ou bruit de grincement métallique",
          "En regardant les pneus",
          "En vérifiant l'huile",
          "Par la couleur du liquide de frein"
        ],
        "correct": 0,
        "explanation": "Le voyant d'usure ou un bruit de grincement métallique signale l'usure.",
        "img": "assets/images/quiz/quiz-img-009.jpeg"
      },
      {
        "q": "Quelle est la bonne pratique pour freiner sur route mouillée ?",
        "choices": [
          "Freiner fort d'un coup",
          "Anticiper, freiner progressivement et doucement",
          "Ne pas freiner",
          "Utiliser le frein à main"
        ],
        "correct": 1,
        "explanation": "Sur route mouillée, freiner progressivement pour éviter le blocage des roues.",
        "img": "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment réagir en cas d'aquaplaning ?",
        "choices": [
          "Accélérer",
          "Ne pas freiner, relâcher l'accélérateur et maintenir le volant droit",
          "Tourner le volant",
          "Freiner fort"
        ],
        "correct": 1,
        "explanation": "Aquaplaning : ne pas freiner, relâcher l'accélérateur, volant droit.",
        "img": "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel geste faire si une personne s'étouffe et tousse encore ?",
        "choices": [
          "5 tapes dans le dos",
          "L'encourager à continuer de tousser",
          "Heimlich immédiat",
          "Lui donner de l'eau"
        ],
        "correct": 1,
        "explanation": "Si la personne tousse encore efficacement, l'encourager à tousser pour expulser l'objet.",
        "img": null
      },
      {
        "q": "Comment positionner un blessé conscient qui saigne d'une jambe ?",
        "choices": [
          "Debout",
          "Allongé, jambe surélevée si possible, comprimer la plaie",
          "Assis",
          "Sur le ventre"
        ],
        "correct": 1,
        "explanation": "Allonger la victime, surélever le membre si possible et comprimer la plaie.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le voyant d'anti-démarrage. Que signifie-t-il ?",
        "choices": [
          "Le moteur est en marche",
          "La clé n'est pas reconnue par le système d'anti-démarrage",
          "Les portières sont fermées",
          "La batterie est pleine"
        ],
        "correct": 1,
        "explanation": "Voyant anti-démarrage = la clé n'est pas reconnue. Le moteur ne démarrera pas.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Qu'est-ce que le sous-virage ?",
        "choices": [
          "L'arrière dérape",
          "Le véhicule tourne moins que voulu, l'avant part vers l'extérieur",
          "Le moteur cale",
          "Le volant vibre"
        ],
        "correct": 1,
        "explanation": "Sous-virage : l'avant du véhicule dérive vers l'extérieur du virage.",
        "img": null
      },
      {
        "q": "À quelle vitesse adapter sa conduite par temps de pluie ?",
        "choices": [
          "Même vitesse",
          "Réduire d'au moins 20 km/h par rapport à la limite",
          "Doubler la vitesse",
          "Rouler à 30 km/h"
        ],
        "correct": 1,
        "explanation": "Par temps de pluie, réduire la vitesse d'au moins 20 km/h.",
        "img": "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment savoir si le liquide de refroidissement est suffisant ?",
        "choices": [
          "Toucher le radiateur",
          "Vérifier le niveau entre MIN et MAX sur le vase d'expansion",
          "Goûter le liquide",
          "Écouter le moteur"
        ],
        "correct": 1,
        "explanation": "Vérifier visuellement le niveau entre les repères MIN et MAX sur le vase d'expansion.",
        "img": "assets/images/quiz/quiz-img-028.jpeg"
      }
    ]
  },
  {
    "id": 10,
    "title": "Conduite & Sécurité 10",
    "icon": "fas fa-user-shield",
    "color": "#6366f1",
    "description": "Sécurité routière, comportement, mécanique avancée, secourisme",
    "questions": [
      {
        "q": "Quelle est la vitesse maximale sur autoroute par temps de pluie ?",
        "choices": [
          "130 km/h",
          "110 km/h",
          "90 km/h",
          "100 km/h"
        ],
        "correct": 1,
        "explanation": "Par temps de pluie, la vitesse maximale sur autoroute est réduite à 110 km/h.",
        "img": "https://images.unsplash.com/photo-1545987796-200677ee1011?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est l'effet de la fatigue sur la conduite ?",
        "choices": [
          "Améliore les réflexes",
          "Diminue la vigilance, allonge le temps de réaction",
          "Améliore la vision",
          "Aucun effet"
        ],
        "correct": 1,
        "explanation": "La fatigue diminue la vigilance et allonge le temps de réaction.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "Tous les combien faire une pause sur autoroute ?",
        "choices": [
          "Toutes les 4 heures",
          "Toutes les 2 heures minimum",
          "Toutes les 30 minutes",
          "Pas de pause nécessaire"
        ],
        "correct": 1,
        "explanation": "Pause toutes les 2 heures minimum pour lutter contre la fatigue.",
        "img": "https://images.unsplash.com/photo-1545987796-200677ee1011?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le panneau carré bleu avec un P blanc ?",
        "choices": [
          "Passage piéton",
          "Zone de stationnement autorisé",
          "Poste de police",
          "Parking payant"
        ],
        "correct": 1,
        "explanation": "Carré bleu avec P = zone de stationnement autorisé.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment réagir si un témoin d'accident arrive le premier ?",
        "choices": [
          "Fuir",
          "Protéger, alerter, secourir (PAS)",
          "Déplacer les véhicules",
          "Filmer la scène"
        ],
        "correct": 1,
        "explanation": "PAS : Protéger, Alerter les secours (15/18/112), Secourir.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Que vérifier régulièrement sur les feux du véhicule ?",
        "choices": [
          "La couleur",
          "Que toutes les ampoules fonctionnent (avant, arrière, stop, clignotants)",
          "Le voltage",
          "La marque"
        ],
        "correct": 1,
        "explanation": "Vérifier régulièrement toutes les ampoules : avant, arrière, stop, clignotants.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la pression correcte pour ce véhicule à vide ?",
        "choices": [
          "1,8 bars",
          "2,1 bars à l'avant et 2,1 bars à l'arrière",
          "3,0 bars",
          "1,5 bars"
        ],
        "correct": 1,
        "explanation": "L'étiquette portière indique 2,1 bars avant et arrière à vide.",
        "img": null
      },
      {
        "q": "Pourquoi ne pas laisser tourner le moteur à l'arrêt ?",
        "choices": [
          "Par obligation",
          "Pollution, surconsommation et risque d'intoxication au CO",
          "Le moteur s'abîme",
          "La batterie se décharge"
        ],
        "correct": 1,
        "explanation": "Moteur au ralenti = pollution, gaspillage et risque d'intoxication au CO en espace fermé.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire si le voyant de liquide de frein s'allume ?",
        "choices": [
          "Continuer",
          "S'arrêter et vérifier le niveau, ne pas rouler si niveau trop bas",
          "Accélérer",
          "Appuyer fort sur le frein"
        ],
        "correct": 1,
        "explanation": "S'arrêter, vérifier le niveau. Si trop bas, ne pas rouler : faire remorquer.",
        "img": "assets/images/quiz/quiz-img-027.jpeg"
      },
      {
        "q": "Qu'est-ce qu'un témoin d'usure sur un disque de frein ?",
        "choices": [
          "Une marque rouge",
          "Une rainure qui émet un sifflement quand le disque est usé",
          "Un voyant au tableau de bord",
          "Une vibration du volant"
        ],
        "correct": 0,
        "explanation": "Une rainure sur le disque émet un bruit quand l'épaisseur minimale est atteinte.",
        "img": null
      },
      {
        "q": "Comment fonctionne le système ABS en freinage d'urgence ?",
        "choices": [
          "Bloque les roues",
          "Empêche le blocage des roues pour garder le contrôle directionnel",
          "Accélère le véhicule",
          "Coupe le moteur"
        ],
        "correct": 1,
        "explanation": "L'ABS empêche le blocage des roues, permettant de garder le contrôle et d'éviter un obstacle.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Quand allumer les feux de position ?",
        "choices": [
          "La nuit en ville",
          "Au crépuscule ou à l'aube, quand la visibilité diminue",
          "En plein jour",
          "Jamais seuls"
        ],
        "correct": 1,
        "explanation": "Feux de position : au crépuscule/aube. La nuit, passer aux feux de croisement.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment vérifier le niveau du liquide de direction assistée ?",
        "choices": [
          "En tournant le volant",
          "Vérifier la jauge sur le bocal, à froid, moteur éteint",
          "En écoutant",
          "Au contrôle technique"
        ],
        "correct": 1,
        "explanation": "Vérifier le niveau sur la jauge du bocal, moteur éteint et à froid.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le marquage 185/65 R15 sur un pneu ?",
        "choices": [
          "La marque du pneu",
          "Largeur 185mm, hauteur 65%, radial, diamètre jante 15 pouces",
          "Le prix",
          "La date de fabrication"
        ],
        "correct": 1,
        "explanation": "185=largeur en mm, 65=rapport hauteur/largeur, R=radial, 15=diamètre jante pouces.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Comment se comporter en zone 30 km/h ?",
        "choices": [
          "Rouler à 50",
          "Rouler à 30 km/h max, être attentif aux piétons et vélos",
          "Klaxonner les piétons",
          "Se garer n'importe où"
        ],
        "correct": 1,
        "explanation": "Zone 30 : vitesse max 30 km/h, priorité aux piétons et cyclistes.",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire face à une brûlure thermique ?",
        "choices": [
          "Mettre du beurre",
          "Refroidir sous l'eau froide pendant 10-15 minutes",
          "Percer les cloques",
          "Mettre un pansement sec"
        ],
        "correct": 1,
        "explanation": "Refroidir immédiatement la brûlure sous l'eau froide pendant 10-15 minutes.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel numéro appeler pour une urgence médicale ?",
        "choices": [
          "17",
          "15 (Samu)",
          "18",
          "112"
        ],
        "correct": 1,
        "explanation": "Le 15 est le numéro du Samu pour les urgences médicales.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la réaction correcte face à un malaise d'un passager ?",
        "choices": [
          "Continuer à rouler",
          "S'arrêter en sécurité, demander ce qu'il ressent, appeler les secours si nécessaire",
          "Accélérer pour arriver vite",
          "Ouvrir les fenêtres uniquement"
        ],
        "correct": 1,
        "explanation": "S'arrêter en sécurité, évaluer l'état du passager et appeler les secours si besoin.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Pourquoi le filtre à particules est-il important ?",
        "choices": [
          "Pour le confort",
          "Il réduit les émissions de particules fines polluantes",
          "Pour le bruit",
          "Pour la puissance"
        ],
        "correct": 1,
        "explanation": "Le filtre à particules capture les particules fines émises par le moteur.",
        "img": null
      },
      {
        "q": "Comment se positionner sur la route pour tourner à gauche ?",
        "choices": [
          "À droite",
          "Se déporter vers le milieu de la chaussée, près de la ligne médiane",
          "Rester au centre",
          "Sur le trottoir"
        ],
        "correct": 1,
        "explanation": "Pour tourner à gauche, se positionner près de la ligne médiane ou au centre de la voie.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 11,
    "title": "Conduite & Sécurité 11",
    "icon": "fas fa-wrench",
    "color": "#d946ef",
    "description": "Entretien approfondi, signalisation, comportement, secourisme",
    "questions": [
      {
        "q": "À quoi sert la courroie de distribution ?",
        "choices": [
          "Charger la batterie",
          "Synchroniser les mouvements du moteur (pistons et soupapes)",
          "Entraîner les essuie-glaces",
          "Refroidir le moteur"
        ],
        "correct": 1,
        "explanation": "La courroie de distribution synchronise les pièces mobiles du moteur.",
        "img": null
      },
      {
        "q": "Quel risque en cas de rupture de la courroie de distribution ?",
        "choices": [
          "Aucun",
          "Casse moteur complète",
          "Panne de batterie",
          "Fuite de liquide"
        ],
        "correct": 1,
        "explanation": "La rupture de la courroie provoque une casse moteur très coûteuse.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la signification d'un panneau rond à fond blanc avec bordure rouge ?",
        "choices": [
          "Obligation",
          "Interdiction",
          "Indication",
          "Danger"
        ],
        "correct": 1,
        "explanation": "Rond blanc bordé de rouge = panneau d'interdiction.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie un panneau rond à fond bleu ?",
        "choices": [
          "Interdiction",
          "Obligation",
          "Indication",
          "Danger"
        ],
        "correct": 1,
        "explanation": "Rond bleu = panneau d'obligation (direction, vitesse minimale, etc.).",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment réagir face à un piéton qui s'engage sur un passage protégé ?",
        "choices": [
          "Klaxonner",
          "S'arrêter et lui céder le passage",
          "Accélérer pour passer avant",
          "Contourner par la gauche"
        ],
        "correct": 1,
        "explanation": "Le piéton engagé sur un passage a toujours la priorité. S'arrêter.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel équipement est obligatoire pour les cyclistes de nuit ?",
        "choices": [
          "Casque uniquement",
          "Éclairage avant blanc, arrière rouge et gilet rétro-réfléchissant hors agglo",
          "Klaxon",
          "Rétroviseur"
        ],
        "correct": 1,
        "explanation": "Éclairage avant/arrière obligatoire + gilet rétro-réfléchissant hors agglomération.",
        "img": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment réagir si un voyant rouge s'allume en conduisant ?",
        "choices": [
          "Ignorer",
          "S'arrêter dès que possible en toute sécurité",
          "Accélérer",
          "Éteindre le voyant"
        ],
        "correct": 1,
        "explanation": "Voyant rouge = danger. S'arrêter en sécurité et identifier le problème.",
        "img": "assets/images/quiz/quiz-img-012.jpeg"
      },
      {
        "q": "Montrez le réservoir de lave-glace. Quel est le risque s'il est vide ?",
        "choices": [
          "Aucun",
          "Mauvaise visibilité si le pare-brise est sali",
          "Panne moteur",
          "Surchauffe"
        ],
        "correct": 1,
        "explanation": "Sans lave-glace, le pare-brise reste sale, réduisant dangereusement la visibilité.",
        "img": "assets/images/quiz/quiz-img-025.jpeg"
      },
      {
        "q": "Quand doit-on changer le liquide de frein ?",
        "choices": [
          "Jamais",
          "Tous les 2 ans environ ou selon le carnet d'entretien",
          "Tous les 10 ans",
          "Quand il est noir"
        ],
        "correct": 1,
        "explanation": "Le liquide de frein absorbe l'humidité. Le changer tous les 2 ans.",
        "img": "assets/images/quiz/quiz-img-027.jpeg"
      },
      {
        "q": "Quel est l'intérêt d'un contrôle technique régulier ?",
        "choices": [
          "Obligation uniquement",
          "Vérifier la sécurité du véhicule et réduire la pollution",
          "Augmenter la valeur",
          "Changer de couleur"
        ],
        "correct": 1,
        "explanation": "Le contrôle technique vérifie les points de sécurité et les émissions polluantes.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment reconnaître un panneau de priorité à droite ?",
        "choices": [
          "Triangle",
          "Losange jaune avec bordure blanche",
          "Carré bleu",
          "Rond rouge"
        ],
        "correct": 1,
        "explanation": "Le losange jaune bordé de blanc indique que vous êtes sur une route prioritaire.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire en cas de panne sur une voie rapide ?",
        "choices": [
          "Rester dans la voiture",
          "Se garer à droite, warnings, gilet, sortir côté droit, aller derrière la glissière",
          "Marcher sur la chaussée",
          "Appeler depuis la route"
        ],
        "correct": 1,
        "explanation": "Se garer à droite, warnings, gilet AVANT de sortir, se mettre en sécurité derrière la glissière.",
        "img": "https://images.unsplash.com/photo-1545987796-200677ee1011?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle distance de sécurité en agglomération à 50 km/h ?",
        "choices": [
          "5 mètres",
          "Au moins 2 secondes soit environ 28 mètres",
          "50 mètres",
          "1 seconde"
        ],
        "correct": 1,
        "explanation": "Distance de sécurité = 2 secondes minimum, soit ~28m à 50 km/h.",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      },
      {
        "q": "Peut-on utiliser des pneus hiver toute l'année ?",
        "choices": [
          "Oui sans problème",
          "Oui mais ils s'usent plus vite sur route sèche et chaude",
          "Non c'est interdit",
          "Seulement en montagne"
        ],
        "correct": 1,
        "explanation": "Possible mais les pneus hiver s'usent plus vite par temps chaud et sont moins performants.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Que faire face à une victime qui fait un malaise cardiaque ?",
        "choices": [
          "Lui donner de l'aspirine",
          "L'asseoir, la rassurer, appeler le 15 et surveiller",
          "La faire marcher",
          "Lui donner de l'eau"
        ],
        "correct": 1,
        "explanation": "L'asseoir confortablement, la rassurer, appeler le 15 et surveiller.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment reconnaître un AVC (Accident Vasculaire Cérébral) ?",
        "choices": [
          "Douleur au bras",
          "Paralysie faciale, difficulté à parler, faiblesse d'un côté",
          "Maux de ventre",
          "Toux sèche"
        ],
        "correct": 1,
        "explanation": "FAST : Face (paralysie), Arms (bras faible), Speech (trouble parole), Time (appeler vite).",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le sigle ESP ?",
        "choices": [
          "Extra Speed Power",
          "Electronic Stability Program (contrôle de stabilité)",
          "Emergency Signal Protocol",
          "Electric Steering Power"
        ],
        "correct": 1,
        "explanation": "ESP = Electronic Stability Program, aide à maintenir la trajectoire en virage.",
        "img": null
      },
      {
        "q": "Comment fonctionne l'aide au démarrage en côte ?",
        "choices": [
          "Accélère automatiquement",
          "Maintient les freins brièvement pour éviter le recul au démarrage",
          "Bloque le volant",
          "Active le frein à main"
        ],
        "correct": 1,
        "explanation": "L'aide au démarrage en côte maintient le freinage 2-3 secondes pour éviter le recul.",
        "img": null
      },
      {
        "q": "Pourquoi vérifier la date de fabrication des pneus ?",
        "choices": [
          "Pour la garantie",
          "Les pneus vieillissent même sans rouler, les changer après 5-6 ans",
          "Par curiosité",
          "Pour le style"
        ],
        "correct": 1,
        "explanation": "Le caoutchouc vieillit. Changer les pneus après 5-6 ans même s'ils semblent bons.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Que signifie le marquage DOT sur un pneu ?",
        "choices": [
          "Le fabricant",
          "La date de fabrication (semaine et année) sur 4 chiffres",
          "Le prix",
          "La taille"
        ],
        "correct": 1,
        "explanation": "DOT suivi de 4 chiffres : les 2 premiers = semaine, les 2 derniers = année de fabrication.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      }
    ]
  },
  {
    "id": 12,
    "title": "Conduite & Sécurité 12",
    "icon": "fas fa-cloud-sun-rain",
    "color": "#0ea5e9",
    "description": "Conditions météo, angles morts, stationnement, urgences",
    "questions": [
      {
        "q": "Quelle distance de freinage sur route mouillée par rapport à route sèche ?",
        "choices": [
          "Identique",
          "Environ le double",
          "La moitié",
          "Triple"
        ],
        "correct": 1,
        "explanation": "La distance de freinage est environ doublée sur route mouillée.",
        "img": "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment réagir en cas de brouillard dense ?",
        "choices": [
          "Allumer les feux de route",
          "Allumer les feux de brouillard, réduire la vitesse, augmenter les distances",
          "Continuer normalement",
          "S'arrêter sur la chaussée"
        ],
        "correct": 1,
        "explanation": "Feux de brouillard, vitesse réduite et distances de sécurité augmentées.",
        "img": "assets/images/quiz/quiz-img-011.jpeg"
      },
      {
        "q": "Que signifie un feu clignotant orange à une intersection ?",
        "choices": [
          "Passage libre",
          "Ralentir et céder le passage",
          "S'arrêter",
          "Accélérer"
        ],
        "correct": 1,
        "explanation": "Feu clignotant orange = ralentir, céder le passage, prudence.",
        "img": null
      },
      {
        "q": "Quel est le danger principal des angles morts en ville ?",
        "choices": [
          "Aucun",
          "Ne pas voir un piéton, cycliste ou deux-roues",
          "Le moteur surchauffe",
          "La batterie se décharge"
        ],
        "correct": 1,
        "explanation": "Les angles morts cachent des usagers vulnérables (piétons, vélos, motos).",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment vérifier l'angle mort avant de changer de voie ?",
        "choices": [
          "Seulement les rétroviseurs",
          "Rétroviseurs + tourner brièvement la tête du côté concerné",
          "Klaxonner",
          "Mettre le clignotant suffit"
        ],
        "correct": 1,
        "explanation": "Rétroviseurs + contrôle visuel rapide en tournant la tête.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la règle de stationnement en sens unique ?",
        "choices": [
          "Toujours à droite",
          "Des deux côtés, sauf indication contraire",
          "Uniquement à gauche",
          "Au milieu"
        ],
        "correct": 1,
        "explanation": "En sens unique, on peut stationner des deux côtés sauf signalisation contraire.",
        "img": "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment se garer en créneau ?",
        "choices": [
          "En fonçant tout droit",
          "Se positionner parallèlement, braquer à fond en reculant, contrebraquer",
          "Monter sur le trottoir",
          "Se garer en diagonale"
        ],
        "correct": 1,
        "explanation": "Créneau : se positionner, braquer en reculant, contrebraquer pour aligner.",
        "img": null
      },
      {
        "q": "Montrez le frein de stationnement. Comment l'activer ?",
        "choices": [
          "Appuyer sur l'accélérateur",
          "Tirer le levier ou activer le bouton de frein électrique",
          "Tourner la clé",
          "Appuyer sur le frein"
        ],
        "correct": 1,
        "explanation": "Le frein de stationnement s'active en tirant le levier ou en appuyant sur le bouton.",
        "img": "assets/images/quiz/quiz-img-009.jpeg"
      },
      {
        "q": "Pourquoi ne pas stationner près d'un virage ?",
        "choices": [
          "Par habitude",
          "Le véhicule n'est pas visible pour les autres usagers qui arrivent",
          "La pente",
          "Le vent"
        ],
        "correct": 1,
        "explanation": "Un véhicule stationné en virage n'est pas visible, créant un danger pour les autres.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment éviter l'éblouissement par le soleil bas ?",
        "choices": [
          "Fermer les yeux",
          "Utiliser le pare-soleil, porter des lunettes de soleil, réduire la vitesse",
          "Allumer les feux de route",
          "Accélérer"
        ],
        "correct": 1,
        "explanation": "Pare-soleil, lunettes de soleil et vitesse réduite en cas de soleil bas.",
        "img": null
      },
      {
        "q": "Que faire sur route verglacée ?",
        "choices": [
          "Freiner fort",
          "Réduire la vitesse, pas de geste brusque, augmenter les distances",
          "Accélérer",
          "Rouler en roue libre"
        ],
        "correct": 1,
        "explanation": "Verglas : vitesse très réduite, gestes doux, grandes distances.",
        "img": null
      },
      {
        "q": "Que signifie le panneau triangulaire avec un bonhomme de neige ?",
        "choices": [
          "Zone de ski",
          "Risque de verglas ou de neige",
          "Bonhomme de neige interdit",
          "Zone froide"
        ],
        "correct": 1,
        "explanation": "Triangle avec flocon/bonhomme de neige = risque de verglas ou neige.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel véhicule est prioritaire avec un gyrophare bleu et une sirène ?",
        "choices": [
          "Aucun",
          "Véhicule de secours en intervention (ambulance, pompiers, police)",
          "Taxi",
          "Bus"
        ],
        "correct": 1,
        "explanation": "Gyrophare bleu + sirène = véhicule prioritaire en intervention.",
        "img": "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment réagir face à un véhicule de secours ?",
        "choices": [
          "Ignorer",
          "Se ranger à droite et s'arrêter si nécessaire pour le laisser passer",
          "Accélérer",
          "Klaxonner"
        ],
        "correct": 1,
        "explanation": "Se ranger à droite et s'arrêter si nécessaire. Ne jamais bloquer le passage.",
        "img": "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie une ligne continue blanche ?",
        "choices": [
          "Interdiction de stationner",
          "Interdiction de franchir ou chevaucher la ligne",
          "Voie réservée",
          "Obligation de tourner"
        ],
        "correct": 1,
        "explanation": "Ligne continue = interdiction de la franchir ou la chevaucher.",
        "img": null
      },
      {
        "q": "Comment réagir si un passager fait une crise d'épilepsie en voiture ?",
        "choices": [
          "Continuer",
          "S'arrêter en sécurité, protéger la tête, ne rien mettre dans la bouche",
          "Donner de l'eau",
          "Le secouer"
        ],
        "correct": 1,
        "explanation": "S'arrêter, protéger la tête du passager, ne rien mettre dans la bouche.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la sanction pour non-port de ceinture ?",
        "choices": [
          "Avertissement",
          "Amende de 135€ et retrait de 3 points",
          "Amende de 35€",
          "Aucune sanction"
        ],
        "correct": 1,
        "explanation": "Non-port de ceinture = amende de 135€ et retrait de 3 points.",
        "img": "assets/images/quiz/quiz-img-002.jpeg"
      },
      {
        "q": "Montrez le voyant de température. Quand s'allume-t-il en bleu ?",
        "choices": [
          "En surchauffe",
          "Quand le moteur est froid et n'a pas atteint sa température de fonctionnement",
          "Quand le feu bleu est allumé",
          "Quand la clim est en marche"
        ],
        "correct": 1,
        "explanation": "Voyant bleu = moteur froid. Il s'éteint quand le moteur atteint sa température.",
        "img": "assets/images/quiz/quiz-img-010.jpeg"
      },
      {
        "q": "Que faire si le véhicule tombe en panne de nuit sur une route sans éclairage ?",
        "choices": [
          "Rester dans le noir",
          "Allumer les warnings, enfiler le gilet, utiliser une lampe, poser le triangle",
          "Utiliser les feux de route",
          "Allumer les phares"
        ],
        "correct": 1,
        "explanation": "Warnings, gilet haute visibilité, lampe pour être visible et triangle.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment réagir si un bébé s'étouffe ?",
        "choices": [
          "Heimlich classique",
          "5 tapes dans le dos sur l'avant-bras, puis 5 compressions thoraciques",
          "Lui donner de l'eau",
          "Le retourner tête en bas"
        ],
        "correct": 1,
        "explanation": "Bébé : 5 tapes dans le dos, puis 5 compressions thoraciques (pas Heimlich).",
        "img": null
      }
    ]
  },
  {
    "id": 13,
    "title": "Conduite & Sécurité 13",
    "icon": "fas fa-map-signs",
    "color": "#84cc16",
    "description": "Signalisation avancée, rond-point, autoroute, mécanique",
    "questions": [
      {
        "q": "Qui est prioritaire dans un rond-point ?",
        "choices": [
          "Ceux qui entrent",
          "Ceux qui sont déjà engagés dans le rond-point",
          "Les véhicules venant de droite",
          "Personne"
        ],
        "correct": 1,
        "explanation": "Dans un rond-point, les véhicules déjà engagés sont prioritaires.",
        "img": null
      },
      {
        "q": "Quel clignotant mettre pour entrer dans un rond-point ?",
        "choices": [
          "Droit",
          "Aucun clignotant pour entrer, le droit pour sortir",
          "Gauche",
          "Les deux"
        ],
        "correct": 1,
        "explanation": "Pas de clignotant pour entrer. Clignotant droit pour sortir.",
        "img": null
      },
      {
        "q": "Que signifie un panneau carré bleu avec une flèche blanche ?",
        "choices": [
          "Sens interdit",
          "Sens obligatoire",
          "Interdiction de tourner",
          "Passage piéton"
        ],
        "correct": 1,
        "explanation": "Carré bleu avec flèche blanche = sens obligatoire dans la direction indiquée.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle vitesse maximale sur route nationale hors agglomération ?",
        "choices": [
          "90 km/h",
          "80 km/h",
          "110 km/h",
          "70 km/h"
        ],
        "correct": 1,
        "explanation": "80 km/h sur route nationale à double sens depuis juillet 2018.",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment utiliser les voies d'insertion sur autoroute ?",
        "choices": [
          "S'arrêter et attendre",
          "Accélérer dans la voie d'accélération pour atteindre la vitesse du flux",
          "Entrer lentement",
          "Klaxonner"
        ],
        "correct": 1,
        "explanation": "Utiliser la voie d'accélération pour adapter sa vitesse au flux autoroutier.",
        "img": "https://images.unsplash.com/photo-1545987796-200677ee1011?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le panneau avec un trait rouge sur un fond blanc ?",
        "choices": [
          "Fin d'interdiction",
          "Fin de toutes les interdictions précédemment signalées",
          "Début de zone",
          "Sens interdit"
        ],
        "correct": 1,
        "explanation": "Panneau rond blanc avec barre oblique = fin de toutes les interdictions.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez la commande de recyclage d'air. Pourquoi ne pas l'utiliser en continu ?",
        "choices": [
          "Ça use le moteur",
          "Risque de buée et d'air vicié dans l'habitacle",
          "Surconsommation",
          "Panne de clim"
        ],
        "correct": 1,
        "explanation": "Recyclage continu = buée et air vicié. Utiliser temporairement.",
        "img": "assets/images/quiz/quiz-img-022.jpeg"
      },
      {
        "q": "Comment réagir si le voyant d'huile clignote ?",
        "choices": [
          "Continuer",
          "Vérifier le niveau d'huile dès que possible",
          "Accélérer",
          "Ignorer"
        ],
        "correct": 1,
        "explanation": "Voyant huile clignotant = niveau bas. Vérifier et compléter si nécessaire.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le rôle du liquide de direction assistée ?",
        "choices": [
          "Refroidir le moteur",
          "Transmettre la pression pour faciliter le braquage du volant",
          "Nettoyer le pare-brise",
          "Freiner"
        ],
        "correct": 1,
        "explanation": "Le liquide hydraulique de direction assistée facilite le braquage.",
        "img": null
      },
      {
        "q": "Pourquoi les pneus hiver sont-ils plus efficaces par temps froid ?",
        "choices": [
          "Ils sont plus gonflés",
          "Leur gomme reste souple en dessous de 7°C",
          "Ils ont plus de pression",
          "Ils sont plus grands"
        ],
        "correct": 1,
        "explanation": "La gomme des pneus hiver reste souple sous 7°C, assurant une meilleure adhérence.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Comment actionner le lave-glace arrière sur ce véhicule ?",
        "choices": [
          "Commodo gauche",
          "En poussant le commodo d'essuie-glace vers l'avant",
          "Bouton au tableau de bord",
          "Sur le volant"
        ],
        "correct": 1,
        "explanation": "Le lave-glace arrière s'actionne en poussant le commodo vers l'avant.",
        "img": "assets/images/quiz/quiz-img-025.jpeg"
      },
      {
        "q": "Que signifie un panneau triangulaire avec des vagues ?",
        "choices": [
          "Rivière",
          "Risque de vent latéral",
          "Risque d'inondation",
          "Zone de surf"
        ],
        "correct": 1,
        "explanation": "Triangle avec vagues = risque de vent latéral.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment positionner le triangle en virage ?",
        "choices": [
          "Dans le virage",
          "Avant le virage pour être visible des véhicules qui arrivent",
          "Après le virage",
          "Au sommet du virage"
        ],
        "correct": 1,
        "explanation": "Le triangle doit être visible en amont : le placer avant le virage.",
        "img": "assets/images/quiz/quiz-img-048.jpeg"
      },
      {
        "q": "Quelle est la signification d'une double ligne continue ?",
        "choices": [
          "Voie rapide",
          "Interdiction absolue de dépasser",
          "Zone de stationnement",
          "Voie de bus"
        ],
        "correct": 1,
        "explanation": "Double ligne continue = interdiction absolue de franchir.",
        "img": null
      },
      {
        "q": "Comment vérifier l'éclairage avant du véhicule ?",
        "choices": [
          "En conduisant",
          "Se placer devant un mur, allumer les feux et vérifier",
          "En écoutant",
          "Au contrôle technique"
        ],
        "correct": 1,
        "explanation": "Se placer face à un mur, allumer les feux et vérifier leur fonctionnement.",
        "img": "assets/images/quiz/quiz-img-035.jpeg"
      },
      {
        "q": "Quel geste face à une victime qui ne respire plus ?",
        "choices": [
          "La mettre en PLS",
          "Commencer le massage cardiaque immédiatement",
          "Lui donner de l'eau",
          "La secouer"
        ],
        "correct": 1,
        "explanation": "Pas de respiration = commencer le massage cardiaque et appeler les secours.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Que vérifier sur un DAE avant utilisation ?",
        "choices": [
          "La date de fabrication",
          "Que la poitrine de la victime est sèche, que personne ne touche la victime",
          "Le voltage",
          "La marque"
        ],
        "correct": 1,
        "explanation": "Poitrine sèche, pas de bijou métallique, personne ne touche la victime pendant le choc.",
        "img": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment nettoyer les phares pour maintenir une bonne visibilité ?",
        "choices": [
          "Avec de l'huile",
          "Avec un chiffon humide et du produit nettoyant",
          "Avec du sable",
          "Avec le lave-glace"
        ],
        "correct": 1,
        "explanation": "Un chiffon humide et du produit nettoyant. Les phares sales réduisent l'éclairage de 30%.",
        "img": "assets/images/quiz/quiz-img-035.jpeg"
      },
      {
        "q": "Que faire face à un animal sur la route ?",
        "choices": [
          "Accélérer",
          "Freiner progressivement si possible, ne pas donner de coup de volant brusque",
          "Klaxonner fort",
          "Foncer dessus"
        ],
        "correct": 1,
        "explanation": "Freiner progressivement, ne pas faire d'écart brusque qui pourrait causer un accident.",
        "img": "https://images.unsplash.com/photo-1484406566174-9da645c1d1e2?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la distance d'arrêt à 50 km/h sur route sèche ?",
        "choices": [
          "10 mètres",
          "Environ 25-28 mètres",
          "50 mètres",
          "5 mètres"
        ],
        "correct": 1,
        "explanation": "Distance d'arrêt à 50 km/h ≈ 25-28m (temps de réaction + freinage).",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 14,
    "title": "Conduite & Sécurité 14",
    "icon": "fas fa-traffic-light",
    "color": "#f43f5e",
    "description": "Feux tricolores, dépassement, ceinture, mécanique fine",
    "questions": [
      {
        "q": "Que signifie un feu rouge ?",
        "choices": [
          "Ralentir",
          "Arrêt obligatoire",
          "Passage prioritaire",
          "Attention"
        ],
        "correct": 0,
        "explanation": "Feu rouge = arrêt obligatoire à la ligne d'effet.",
        "img": null
      },
      {
        "q": "Que signifie un feu orange fixe ?",
        "choices": [
          "Accélérer pour passer",
          "S'arrêter si possible sans danger",
          "Priorité",
          "Prudence"
        ],
        "correct": 1,
        "explanation": "Feu orange fixe = s'arrêter si possible sans danger.",
        "img": null
      },
      {
        "q": "Peut-on dépasser par la droite ?",
        "choices": [
          "Oui toujours",
          "Non, sauf si le véhicule devant tourne à gauche ou en file",
          "Oui sur autoroute",
          "Non jamais"
        ],
        "correct": 1,
        "explanation": "Dépassement par la droite interdit sauf si le véhicule devant tourne à gauche.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle distance respecter pour doubler un cycliste hors agglo ?",
        "choices": [
          "0,5 mètre",
          "1,5 mètre minimum",
          "1 mètre",
          "2 mètres"
        ],
        "correct": 1,
        "explanation": "Hors agglomération : 1,5 mètre minimum pour doubler un cycliste.",
        "img": "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle distance pour doubler un cycliste en ville ?",
        "choices": [
          "0,5 mètre",
          "1 mètre minimum",
          "1,5 mètre",
          "2 mètres"
        ],
        "correct": 1,
        "explanation": "En agglomération : 1 mètre minimum pour doubler un cycliste.",
        "img": "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez comment régler l'appui-tête. À quelle hauteur ?",
        "choices": [
          "Épaules",
          "Sommet de la tête ou des yeux",
          "Cou",
          "Peu importe"
        ],
        "correct": 1,
        "explanation": "L'appui-tête doit être à hauteur du sommet de la tête ou des yeux minimum.",
        "img": "assets/images/quiz/quiz-img-003.jpeg"
      },
      {
        "q": "Montrez le bocal de liquide de frein. Comment vérifier ?",
        "choices": [
          "Appuyer sur la pédale",
          "Regarder le niveau entre MIN et MAX sur le bocal",
          "Écouter les freins",
          "Vérifier les plaquettes"
        ],
        "correct": 1,
        "explanation": "Le bocal transparent a des repères MIN et MAX visibles.",
        "img": "assets/images/quiz/quiz-img-027.jpeg"
      },
      {
        "q": "À quoi sert la ceinture de sécurité en cas de retournement ?",
        "choices": [
          "Rien",
          "Maintenir les occupants dans leur siège et éviter l'éjection",
          "Activer l'airbag",
          "Bloquer le volant"
        ],
        "correct": 1,
        "explanation": "La ceinture maintient les occupants et évite l'éjection en cas de tonneau.",
        "img": "assets/images/quiz/quiz-img-002.jpeg"
      },
      {
        "q": "Quel est le temps de réaction moyen d'un conducteur ?",
        "choices": [
          "0,5 seconde",
          "1 à 2 secondes",
          "5 secondes",
          "Instantané"
        ],
        "correct": 1,
        "explanation": "Le temps de réaction moyen est d'environ 1 à 2 secondes.",
        "img": null
      },
      {
        "q": "Comment adapter sa vitesse en descente ?",
        "choices": [
          "Accélérer",
          "Rétrograder pour utiliser le frein moteur avant la descente",
          "Mettre au point mort",
          "Utiliser uniquement le frein"
        ],
        "correct": 1,
        "explanation": "Rétrograder avant la descente pour utiliser le frein moteur.",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le panneau triangulaire avec un virage ?",
        "choices": [
          "Virage interdit",
          "Attention virage dangereux",
          "Sens unique",
          "Déviation"
        ],
        "correct": 1,
        "explanation": "Triangle avec virage = danger, virage dangereux à venir.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le bouchon du liquide de refroidissement.",
        "choices": [
          "Le bleu",
          "Celui avec un pictogramme d'avertissement (ne pas ouvrir à chaud)",
          "Le jaune",
          "Le noir"
        ],
        "correct": 1,
        "explanation": "Le bouchon de refroidissement porte un pictogramme d'avertissement.",
        "img": "assets/images/quiz/quiz-img-028.jpeg"
      },
      {
        "q": "Comment vérifier l'état de la courroie d'accessoire ?",
        "choices": [
          "En la touchant",
          "Visuellement : fissures, effilochage, tension correcte",
          "En l'écoutant uniquement",
          "Au contrôle technique"
        ],
        "correct": 1,
        "explanation": "Vérifier visuellement : fissures, effilochage et tension de la courroie.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire si les essuie-glaces ne fonctionnent plus sous la pluie ?",
        "choices": [
          "Continuer",
          "S'arrêter en sécurité, allumer les warnings",
          "Accélérer",
          "Sortir la tête"
        ],
        "correct": 1,
        "explanation": "S'arrêter en sécurité car la visibilité est nulle.",
        "img": "assets/images/quiz/quiz-img-017.jpeg"
      },
      {
        "q": "Montrez le dégivrage lunette arrière. Comment l'activer ?",
        "choices": [
          "Commodo gauche",
          "Bouton sur le panneau central de climatisation",
          "Sur le volant",
          "Sur la portière"
        ],
        "correct": 1,
        "explanation": "Le dégivrage arrière s'active via le bouton sur le panneau central.",
        "img": "assets/images/quiz/quiz-img-006.jpeg"
      },
      {
        "q": "Que faire si le volant tire d'un côté ?",
        "choices": [
          "Normal",
          "Faire vérifier le parallélisme et la pression des pneus",
          "Tourner dans l'autre sens",
          "Accélérer"
        ],
        "correct": 1,
        "explanation": "Un véhicule qui tire peut indiquer un problème de parallélisme ou pression inégale.",
        "img": null
      },
      {
        "q": "Que signifie le mot « aquaplaning » ?",
        "choices": [
          "Freinage sur l'eau",
          "Le pneu perd le contact avec la route à cause d'un film d'eau",
          "Conduite sous la pluie",
          "Nettoyage du pare-brise"
        ],
        "correct": 1,
        "explanation": "Aquaplaning : le pneu glisse sur un film d'eau, perte totale d'adhérence.",
        "img": "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=520&h=260&fit=crop"
      },
      {
        "q": "Quels sont les 3 comportements à risque au volant ?",
        "choices": [
          "Musique forte, passagers, pluie",
          "Alcool, vitesse excessive et téléphone au volant",
          "Fatigue, pneus neufs, phares",
          "Nuit, autoroute, diesel"
        ],
        "correct": 1,
        "explanation": "Alcool, vitesse excessive et téléphone au volant sont les principales causes d'accidents.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire si une victime saigne du nez abondamment ?",
        "choices": [
          "Pencher la tête en arrière",
          "Pencher la tête en avant, pincer les narines pendant 10 minutes",
          "Mettre du coton",
          "Souffler fort"
        ],
        "correct": 1,
        "explanation": "Tête penchée en avant, pincer les narines pendant 10 minutes.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Quand peut-on déplacer une victime d'accident ?",
        "choices": [
          "Toujours",
          "Uniquement en cas de danger vital imminent (incendie, explosion)",
          "Jamais",
          "Quand elle le demande"
        ],
        "correct": 1,
        "explanation": "Ne déplacer que si danger vital imminent (incendie, risque d'explosion).",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 15,
    "title": "Conduite & Sécurité 15",
    "icon": "fas fa-parking",
    "color": "#a855f7",
    "description": "Stationnement, intersections, manœuvres, secours avancés",
    "questions": [
      {
        "q": "Que signifie le panneau d'interdiction de stationner (fond bleu, barre rouge) ?",
        "choices": [
          "Arrêt interdit",
          "Stationnement interdit",
          "Parking payant",
          "Zone piétonne"
        ],
        "correct": 1,
        "explanation": "Fond bleu avec barre rouge oblique = stationnement interdit.",
        "img": "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=520&h=260&fit=crop"
      },
      {
        "q": "Différence entre arrêt et stationnement ?",
        "choices": [
          "Aucune",
          "Arrêt = conducteur reste au volant, stationnement = conducteur quitte le véhicule",
          "Arrêt = moteur coupé",
          "Stationnement = moteur allumé"
        ],
        "correct": 1,
        "explanation": "Arrêt : conducteur reste au volant. Stationnement : conducteur quitte le véhicule.",
        "img": "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle manœuvre est interdite sur autoroute ?",
        "choices": [
          "Doubler",
          "Faire demi-tour, marche arrière ou s'arrêter sur la chaussée",
          "Changer de voie",
          "Accélérer"
        ],
        "correct": 1,
        "explanation": "Demi-tour, marche arrière et arrêt sur la chaussée sont interdits sur autoroute.",
        "img": "https://images.unsplash.com/photo-1545987796-200677ee1011?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment entrer dans une voie d'insertion ?",
        "choices": [
          "Lentement",
          "Accélérer pour atteindre la vitesse du flux et s'insérer en douceur",
          "S'arrêter au bout",
          "Klaxonner"
        ],
        "correct": 1,
        "explanation": "Accélérer dans la voie pour atteindre la vitesse du trafic, s'insérer en vérifiant.",
        "img": null
      },
      {
        "q": "Que signifie le panneau « STOP » ?",
        "choices": [
          "Ralentir",
          "Arrêt obligatoire à la ligne d'arrêt, même si la voie est libre",
          "Céder le passage",
          "Attention danger"
        ],
        "correct": 1,
        "explanation": "STOP = arrêt obligatoire marqué, même si personne ne vient.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le voyant de frein. Quand s'allume-t-il hors frein à main ?",
        "choices": [
          "Phares allumés",
          "Niveau de liquide de frein trop bas ou défaillance du système",
          "Batterie faible",
          "Moteur chaud"
        ],
        "correct": 1,
        "explanation": "Voyant frein hors frein à main = niveau liquide bas ou défaillance.",
        "img": "assets/images/quiz/quiz-img-009.jpeg"
      },
      {
        "q": "Comment réaliser un demi-tour en sécurité ?",
        "choices": [
          "En une seule manœuvre",
          "Vérifier la visibilité, les priorités et réaliser en plusieurs manœuvres si nécessaire",
          "En reculant uniquement",
          "En accélérant fort"
        ],
        "correct": 1,
        "explanation": "Vérifier visibilité et priorités, réaliser en plusieurs manœuvres si la voie est étroite.",
        "img": null
      },
      {
        "q": "Que faire si le feu passe à l'orange et qu'on ne peut pas s'arrêter ?",
        "choices": [
          "S'arrêter quand même",
          "Passer en toute prudence si l'arrêt serait dangereux",
          "Accélérer",
          "Reculer"
        ],
        "correct": 1,
        "explanation": "Passer si l'arrêt brutal serait dangereux, sinon s'arrêter.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le bouchon d'huile moteur. Quand ajouter de l'huile ?",
        "choices": [
          "Quand le voyant s'allume",
          "Quand le niveau est en dessous du repère MIN sur la jauge",
          "Tous les mois",
          "Jamais"
        ],
        "correct": 1,
        "explanation": "Ajouter de l'huile quand le niveau est sous le repère MIN de la jauge.",
        "img": "assets/images/quiz/quiz-img-031.jpeg"
      },
      {
        "q": "Comment se positionner pour tourner à droite ?",
        "choices": [
          "Au centre",
          "Serrer à droite, mettre le clignotant droit",
          "À gauche",
          "N'importe où"
        ],
        "correct": 1,
        "explanation": "Tourner à droite : se placer à droite, clignotant droit, vérifier les angles morts.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la vitesse maximale en agglomération ?",
        "choices": [
          "30 km/h",
          "50 km/h",
          "70 km/h",
          "90 km/h"
        ],
        "correct": 1,
        "explanation": "50 km/h en agglomération sauf signalisation contraire.",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez la jauge d'huile sous le capot. À quoi sert-elle ?",
        "choices": [
          "Mesurer le carburant",
          "Vérifier le niveau d'huile moteur entre les repères MIN et MAX",
          "Vérifier la pression",
          "Mesurer la température"
        ],
        "correct": 1,
        "explanation": "La jauge permet de vérifier visuellement le niveau d'huile moteur.",
        "img": "assets/images/quiz/quiz-img-029.jpeg"
      },
      {
        "q": "Que faire en cas de crevaison lente ?",
        "choices": [
          "Ignorer",
          "Regonfler le pneu et se rendre au garage rapidement",
          "Changer de voiture",
          "Rouler plus vite"
        ],
        "correct": 1,
        "explanation": "Regonfler si possible et aller au garage pour réparer ou remplacer.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Que faire si le liquide de refroidissement est sous le MIN ?",
        "choices": [
          "Normal",
          "Compléter avec le liquide préconisé par le constructeur, moteur froid",
          "Ajouter de l'eau du robinet",
          "Rouler quand même"
        ],
        "correct": 1,
        "explanation": "Compléter avec le liquide préconisé, toujours moteur froid.",
        "img": "assets/images/quiz/quiz-img-028.jpeg"
      },
      {
        "q": "Quel est le rôle du frein moteur ?",
        "choices": [
          "Accélérer",
          "Ralentir le véhicule en relâchant l'accélérateur, économise les freins",
          "Arrêter le moteur",
          "Consommer plus"
        ],
        "correct": 1,
        "explanation": "Le frein moteur ralentit le véhicule sans user les freins.",
        "img": null
      },
      {
        "q": "Que signifie une ligne discontinue blanche ?",
        "choices": [
          "Interdiction de doubler",
          "Possibilité de franchir pour doubler si c'est sûr",
          "Voie réservée",
          "Zone de stationnement"
        ],
        "correct": 1,
        "explanation": "Ligne discontinue = possibilité de franchir si c'est sûr et autorisé.",
        "img": null
      },
      {
        "q": "Que faire face à une victime en état de choc ?",
        "choices": [
          "La faire marcher",
          "L'allonger, surélever ses jambes, la couvrir et la rassurer",
          "Lui donner à boire",
          "La laisser debout"
        ],
        "correct": 1,
        "explanation": "Allonger, surélever les jambes, couvrir et rassurer en attendant les secours.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment reconnaître un choc anaphylactique ?",
        "choices": [
          "Douleur au bras",
          "Gonflement du visage, difficulté à respirer, démangeaisons",
          "Mal de tête",
          "Fièvre"
        ],
        "correct": 1,
        "explanation": "Gonflement, difficulté à respirer, urticaire : appeler le 15 immédiatement.",
        "img": null
      },
      {
        "q": "Comment placer les électrodes d'un DAE ?",
        "choices": [
          "N'importe où",
          "Une sous la clavicule droite, une sous l'aisselle gauche",
          "Sur le ventre",
          "Sur les bras"
        ],
        "correct": 1,
        "explanation": "Électrode droite sous la clavicule droite, gauche sous l'aisselle gauche.",
        "img": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=520&h=260&fit=crop"
      },
      {
        "q": "Faut-il continuer le massage en attendant le DAE ?",
        "choices": [
          "Non",
          "Oui, le massage ne s'arrête que pour l'analyse et le choc du DAE",
          "Seulement 1 minute",
          "Alterner"
        ],
        "correct": 1,
        "explanation": "Le massage continue jusqu'à ce que le DAE demande de s'écarter pour l'analyse.",
        "img": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 16,
    "title": "Conduite & Sécurité 16",
    "icon": "fas fa-car-crash",
    "color": "#e11d48",
    "description": "Accidents, distances, réglementation, mécanique, secours",
    "questions": [
      {
        "q": "Quelle est la distance d'arrêt à 90 km/h sur route sèche ?",
        "choices": [
          "30 mètres",
          "Environ 60-70 mètres",
          "100 mètres",
          "20 mètres"
        ],
        "correct": 1,
        "explanation": "À 90 km/h : ~25m réaction + ~40m freinage = ~65m d'arrêt.",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la distance d'arrêt à 130 km/h ?",
        "choices": [
          "60 mètres",
          "Environ 120-130 mètres",
          "200 mètres",
          "50 mètres"
        ],
        "correct": 1,
        "explanation": "À 130 km/h : ~36m réaction + ~90m freinage ≈ 125m d'arrêt.",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      },
      {
        "q": "Que risque un conducteur avec un taux d'alcool supérieur à 0,5 g/l ?",
        "choices": [
          "Un avertissement",
          "Amende de 135€, retrait de 6 points, suspension de permis",
          "Rien",
          "Amende de 35€"
        ],
        "correct": 1,
        "explanation": "Alcool > 0.5g/l : 135€ d'amende, 6 points retirés, suspension possible.",
        "img": "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le voyant batterie. Quelle action en cas d'allumage prolongé ?",
        "choices": [
          "Rien",
          "Faire vérifier le circuit de charge (alternateur, batterie)",
          "Couper la radio",
          "Éteindre les feux"
        ],
        "correct": 1,
        "explanation": "Voyant batterie prolongé = circuit de charge défaillant à vérifier.",
        "img": "assets/images/quiz/quiz-img-030.jpeg"
      },
      {
        "q": "Que vérifier sur les rétroviseurs extérieurs ?",
        "choices": [
          "La couleur",
          "Qu'ils sont propres, bien réglés et non fissurés",
          "La marque",
          "Le chauffage"
        ],
        "correct": 1,
        "explanation": "Rétroviseurs propres, bien réglés pour couvrir les zones latérales.",
        "img": "assets/images/quiz/quiz-img-016.jpeg"
      },
      {
        "q": "Comment vérifier le fonctionnement des feux stop sans aide ?",
        "choices": [
          "Impossible",
          "Reculer près d'un mur ou vitrine et appuyer sur le frein en regardant le reflet",
          "En écoutant",
          "Au contrôle technique"
        ],
        "correct": 1,
        "explanation": "Reculer près d'une surface réfléchissante et appuyer sur le frein.",
        "img": "assets/images/quiz/quiz-img-041.jpeg"
      },
      {
        "q": "Que signifie le panneau d'agglomération (fond blanc, nom de ville) ?",
        "choices": [
          "Route nationale",
          "Entrée en agglomération : vitesse limitée à 50 km/h",
          "Zone piétonne",
          "Autoroute"
        ],
        "correct": 1,
        "explanation": "Panneau de localité = entrée en agglomération, vitesse max 50 km/h.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le panneau de sortie d'agglomération (barré en rouge) ?",
        "choices": [
          "Interdiction",
          "Fin de la limitation à 50 km/h, retour à la vitesse hors agglo",
          "Sens interdit",
          "Zone dangereuse"
        ],
        "correct": 1,
        "explanation": "Panneau barré = sortie d'agglomération, vitesse hors agglo s'applique.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le commodo d'éclairage. Quelle position pour les feux de position ?",
        "choices": [
          "Position 0",
          "Première position de la bague rotative",
          "Deuxième position",
          "Troisième position"
        ],
        "correct": 1,
        "explanation": "Les feux de position s'allument sur la première position de la bague.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment fonctionne l'éclairage automatique ?",
        "choices": [
          "Toujours allumé",
          "Un capteur de luminosité allume et éteint les feux selon la lumière ambiante",
          "On le programme",
          "Il suit le GPS"
        ],
        "correct": 1,
        "explanation": "Le capteur adapte l'éclairage automatiquement selon la luminosité extérieure.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le rôle des plaquettes de frein ?",
        "choices": [
          "Accélérer",
          "Créer une friction sur le disque pour ralentir le véhicule",
          "Refroidir",
          "Diriger"
        ],
        "correct": 1,
        "explanation": "Les plaquettes frottent le disque pour transformer l'énergie cinétique en chaleur.",
        "img": "assets/images/quiz/quiz-img-009.jpeg"
      },
      {
        "q": "Montrez le liquide de refroidissement. De quelle couleur est-il généralement ?",
        "choices": [
          "Noir",
          "Vert, rose ou orange selon le type",
          "Transparent",
          "Bleu"
        ],
        "correct": 1,
        "explanation": "Le liquide de refroidissement est coloré (vert, rose ou orange) pour le distinguer.",
        "img": "assets/images/quiz/quiz-img-028.jpeg"
      },
      {
        "q": "Comment réagir face à un feu de véhicule ?",
        "choices": [
          "Ouvrir le capot",
          "Couper le contact, évacuer, appeler les pompiers, ne pas ouvrir le capot",
          "Éteindre avec de l'eau",
          "Accélérer"
        ],
        "correct": 1,
        "explanation": "Couper le contact, évacuer tous les occupants et appeler les pompiers (18).",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire si l'on est témoin d'un accident sans blessé ?",
        "choices": [
          "Partir",
          "Protéger la zone, échanger les informations, remplir un constat",
          "Appeler la police",
          "Déplacer les véhicules d'abord"
        ],
        "correct": 1,
        "explanation": "Protéger, échanger informations et remplir un constat amiable.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Que contient un constat amiable ?",
        "choices": [
          "Uniquement les noms",
          "Circonstances, croquis, identités, assurances, signatures des deux parties",
          "Juste les plaques",
          "Un seul témoignage"
        ],
        "correct": 1,
        "explanation": "Le constat contient les circonstances, croquis, identités, assurances et signatures.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire si la victime vomit pendant la PLS ?",
        "choices": [
          "La mettre sur le dos",
          "La bouche doit être orientée vers le sol pour que les liquides s'écoulent",
          "L'asseoir",
          "Lui donner de l'eau"
        ],
        "correct": 1,
        "explanation": "En PLS, la bouche est orientée vers le sol pour l'évacuation des liquides.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le délai pour déclarer un accident à l'assurance ?",
        "choices": [
          "1 mois",
          "5 jours ouvrés maximum",
          "48 heures",
          "10 jours"
        ],
        "correct": 1,
        "explanation": "L'accident doit être déclaré à l'assurance dans les 5 jours ouvrés.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Pourquoi le sous-gonflage augmente la consommation ?",
        "choices": [
          "Il ne l'augmente pas",
          "La surface de contact augmente, créant plus de résistance au roulement",
          "Les freins frottent",
          "Le moteur surchauffe"
        ],
        "correct": 1,
        "explanation": "Pneus sous-gonflés = plus de surface au sol = plus de résistance = surconsommation.",
        "img": null
      },
      {
        "q": "Que vérifier sur un extincteur de voiture ?",
        "choices": [
          "La couleur",
          "La date de péremption et que la goupille est en place",
          "Le poids",
          "La marque"
        ],
        "correct": 1,
        "explanation": "Vérifier la date de péremption et que l'extincteur est accessible et fonctionnel.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment réagir si un passager fait un malaise hypoglycémique ?",
        "choices": [
          "L'ignorer",
          "S'arrêter, lui donner du sucre rapide (jus, bonbon) et surveiller",
          "Le faire marcher",
          "Lui donner de l'eau"
        ],
        "correct": 1,
        "explanation": "S'arrêter, donner du sucre rapide et surveiller l'amélioration.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 17,
    "title": "Conduite & Sécurité 17",
    "icon": "fas fa-bicycle",
    "color": "#0891b2",
    "description": "Partage de la route, usagers vulnérables, environnement, urgences",
    "questions": [
      {
        "q": "Quelle précaution prendre en présence d'un cycliste ?",
        "choices": [
          "Klaxonner",
          "Ralentir, respecter 1m en ville / 1,5m hors ville, vérifier les angles morts",
          "Accélérer pour le doubler vite",
          "Rester derrière"
        ],
        "correct": 1,
        "explanation": "Respecter la distance latérale minimale et vérifier les angles morts.",
        "img": "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment réagir face à un bus scolaire à l'arrêt ?",
        "choices": [
          "Continuer normalement",
          "Ralentir et être prêt à s'arrêter (enfants peuvent traverser)",
          "Accélérer",
          "Klaxonner"
        ],
        "correct": 1,
        "explanation": "Ralentir car des enfants peuvent traverser devant ou derrière le bus.",
        "img": "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le bouton de chauffage du pare-brise. Son avantage en hiver ?",
        "choices": [
          "Aucun",
          "Dégivre rapidement le pare-brise sans attendre le moteur",
          "Chauffe l'habitacle",
          "Économise du carburant"
        ],
        "correct": 1,
        "explanation": "Le chauffage du pare-brise dégivre rapidement la vitre avant.",
        "img": "assets/images/quiz/quiz-img-018.jpeg"
      },
      {
        "q": "Comment contribuer à la protection de l'environnement en conduisant ?",
        "choices": [
          "Rouler vite",
          "Éco-conduite, entretien régulier, vérifier la pression des pneus",
          "Utiliser le recyclage d'air",
          "Rouler fenêtres ouvertes"
        ],
        "correct": 1,
        "explanation": "Éco-conduite, entretien régulier et pneus bien gonflés réduisent les émissions.",
        "img": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le label Crit'Air ?",
        "choices": [
          "La puissance du moteur",
          "Le niveau de pollution du véhicule pour les zones à faibles émissions",
          "La vitesse max",
          "La consommation"
        ],
        "correct": 1,
        "explanation": "Crit'Air classe les véhicules selon leur niveau de pollution.",
        "img": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le voyant de température. Pourquoi surveiller la température en été ?",
        "choices": [
          "Par habitude",
          "Le risque de surchauffe augmente avec la chaleur et les embouteillages",
          "Pour la clim",
          "Pour les pneus"
        ],
        "correct": 1,
        "explanation": "En été, chaleur + embouteillages augmentent le risque de surchauffe moteur.",
        "img": "assets/images/quiz/quiz-img-010.jpeg"
      },
      {
        "q": "Quel est l'impact de la vitesse sur la consommation ?",
        "choices": [
          "Aucun",
          "La consommation augmente exponentiellement avec la vitesse",
          "La consommation baisse",
          "Ça dépend du carburant"
        ],
        "correct": 1,
        "explanation": "La consommation augmente fortement avec la vitesse (résistance de l'air).",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment stationner en côte montante ?",
        "choices": [
          "Roues droites",
          "Braquer les roues vers le trottoir à gauche, serrer le frein de parking",
          "Braquer à droite",
          "Ne pas mettre le frein"
        ],
        "correct": 1,
        "explanation": "En côte montante, braquer les roues à gauche (vers la route) et serrer le frein.",
        "img": "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment stationner en côte descendante ?",
        "choices": [
          "Roues droites",
          "Braquer les roues vers le trottoir à droite, serrer le frein de parking, 1ère vitesse",
          "Braquer à gauche",
          "Point mort"
        ],
        "correct": 1,
        "explanation": "En descente, braquer vers le trottoir (droite) et mettre en 1ère ou P.",
        "img": "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le panneau bleu avec un vélo blanc ?",
        "choices": [
          "Vélo interdit",
          "Piste cyclable obligatoire",
          "Zone piétonne",
          "Stationnement vélo"
        ],
        "correct": 1,
        "explanation": "Rond bleu avec vélo blanc = piste cyclable obligatoire.",
        "img": "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le bouchon de lave-glace. Quel produit utiliser ?",
        "choices": [
          "De l'eau",
          "Du liquide lave-glace avec antigel adapté à la saison",
          "Du savon",
          "Du vinaigre"
        ],
        "correct": 1,
        "explanation": "Utiliser du liquide lave-glace avec antigel en hiver.",
        "img": "assets/images/quiz/quiz-img-025.jpeg"
      },
      {
        "q": "Quel est le risque de stationner sur un passage piéton ?",
        "choices": [
          "Aucun",
          "Mettre en danger les piétons et recevoir une amende",
          "Juste une amende",
          "Usure des pneus"
        ],
        "correct": 1,
        "explanation": "Stationner sur un passage piéton met les piétons en danger et est verbalisé.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le rôle du pot catalytique ?",
        "choices": [
          "Augmenter la puissance",
          "Transformer les gaz polluants en gaz moins nocifs",
          "Diminuer le bruit",
          "Refroidir l'échappement"
        ],
        "correct": 1,
        "explanation": "Le catalyseur convertit CO, NOx et hydrocarbures en CO2, N2 et H2O.",
        "img": null
      },
      {
        "q": "Montrez le voyant de pression d'huile. Sa forme ?",
        "choices": [
          "Thermomètre",
          "Burette d'huile (petit arrosoir)",
          "Batterie",
          "Frein"
        ],
        "correct": 1,
        "explanation": "Le voyant d'huile a la forme d'une burette (petit arrosoir) avec une goutte.",
        "img": "assets/images/quiz/quiz-img-014.jpeg"
      },
      {
        "q": "Que faire si le véhicule émet une fumée noire excessive ?",
        "choices": [
          "Normal",
          "Faire vérifier le moteur (problème d'injection ou de filtre)",
          "Accélérer",
          "Couper la clim"
        ],
        "correct": 1,
        "explanation": "Fumée noire excessive = problème de combustion à faire vérifier.",
        "img": null
      },
      {
        "q": "Comment aider une victime consciente en attendant les secours ?",
        "choices": [
          "La faire marcher",
          "La rassurer, la couvrir, surveiller son état et ne pas lui donner à boire/manger",
          "Lui donner des médicaments",
          "La faire bouger"
        ],
        "correct": 1,
        "explanation": "Rassurer, couvrir, surveiller. Ne rien donner à boire ni à manger.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le numéro européen d'urgence ?",
        "choices": [
          "17",
          "112",
          "18",
          "911"
        ],
        "correct": 1,
        "explanation": "Le 112 est le numéro d'urgence européen, valable dans tous les pays de l'UE.",
        "img": "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment signaler un danger sur la route aux autres conducteurs ?",
        "choices": [
          "Klaxonner continuellement",
          "Allumer les feux de détresse et ralentir progressivement",
          "Faire des appels de phares uniquement",
          "Rien"
        ],
        "correct": 1,
        "explanation": "Warnings et ralentissement progressif pour avertir les suiveurs.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est l'impact des pneus sur la consommation de carburant ?",
        "choices": [
          "Aucun",
          "Des pneus sous-gonflés augmentent la consommation de 3 à 5%",
          "Les pneus neufs consomment plus",
          "Ça dépend de la marque"
        ],
        "correct": 1,
        "explanation": "Pneus sous-gonflés = +3 à 5% de consommation à cause de la résistance au roulement.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Que faire si le DAE dit « choc non recommandé » ?",
        "choices": [
          "Éteindre le DAE",
          "Reprendre immédiatement le massage cardiaque",
          "Retirer les électrodes",
          "Appeler les secours"
        ],
        "correct": 1,
        "explanation": "Si le DAE dit « choc non recommandé », reprendre le massage cardiaque immédiatement.",
        "img": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 18,
    "title": "Conduite & Sécurité 18",
    "icon": "fas fa-moon",
    "color": "#7c3aed",
    "description": "Conduite de nuit, fatigue, alcool, drogues, mécanique",
    "questions": [
      {
        "q": "Pourquoi la conduite de nuit est-elle plus dangereuse ?",
        "choices": [
          "Moins de trafic",
          "Visibilité réduite, fatigue, éblouissement",
          "Plus de vent",
          "La route est plus glissante"
        ],
        "correct": 1,
        "explanation": "Nuit : visibilité réduite, fatigue accrue, risque d'éblouissement.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "À quelle distance voit-on avec les feux de croisement ?",
        "choices": [
          "100 mètres",
          "Environ 30 à 40 mètres",
          "10 mètres",
          "200 mètres"
        ],
        "correct": 1,
        "explanation": "Les feux de croisement éclairent à environ 30-40 mètres devant.",
        "img": "assets/images/quiz/quiz-img-013.jpeg"
      },
      {
        "q": "À quelle distance voit-on avec les feux de route ?",
        "choices": [
          "50 mètres",
          "Environ 100 mètres",
          "200 mètres",
          "30 mètres"
        ],
        "correct": 1,
        "explanation": "Les feux de route éclairent à environ 100 mètres devant.",
        "img": "assets/images/quiz/quiz-img-013.jpeg"
      },
      {
        "q": "Comment lutter contre la somnolence au volant ?",
        "choices": [
          "Mettre la clim à fond",
          "S'arrêter et faire une sieste de 15-20 minutes",
          "Boire un café et continuer",
          "Ouvrir la fenêtre"
        ],
        "correct": 1,
        "explanation": "La seule solution efficace : s'arrêter et dormir 15-20 minutes.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est l'effet du cannabis sur la conduite ?",
        "choices": [
          "Améliore la concentration",
          "Diminue l'attention, allonge le temps de réaction, altère la perception",
          "Aucun effet",
          "Améliore la vision"
        ],
        "correct": 1,
        "explanation": "Cannabis : baisse d'attention, temps de réaction allongé, perception altérée.",
        "img": "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez les feux de route. Pourquoi les éteindre en croisement ?",
        "choices": [
          "Pour économiser la batterie",
          "Pour ne pas éblouir les conducteurs en face",
          "Par habitude",
          "Ce n'est pas obligatoire"
        ],
        "correct": 1,
        "explanation": "Les feux de route éblouissent les conducteurs en face, risque d'accident.",
        "img": "assets/images/quiz/quiz-img-013.jpeg"
      },
      {
        "q": "Que signifie le panneau triangulaire avec un cerf ?",
        "choices": [
          "Zoo",
          "Passage d'animaux sauvages",
          "Chasse interdite",
          "Forêt"
        ],
        "correct": 1,
        "explanation": "Triangle avec animal sauvage = risque de traversée d'animaux.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment adapter sa vitesse la nuit ?",
        "choices": [
          "Rouler à la même vitesse",
          "Adapter pour pouvoir s'arrêter dans la zone éclairée par les phares",
          "Rouler plus vite car il y a moins de trafic",
          "Au feeling"
        ],
        "correct": 1,
        "explanation": "Ne jamais rouler plus vite que la distance éclairée par les phares.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le commodo d'éclairage. Position AUTO signifie quoi ?",
        "choices": [
          "Toujours allumé",
          "Les feux s'allument et s'éteignent automatiquement selon la luminosité",
          "Mode turbo",
          "Feux de route auto"
        ],
        "correct": 1,
        "explanation": "AUTO : le capteur allume/éteint les feux selon la luminosité ambiante.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle sanction pour conduite sous stupéfiants ?",
        "choices": [
          "Avertissement",
          "Jusqu'à 2 ans de prison, 4500€ d'amende, retrait de 6 points, annulation de permis",
          "Amende de 68€",
          "Retrait de 1 point"
        ],
        "correct": 1,
        "explanation": "Stupéfiants au volant : 2 ans prison, 4500€, 6 points, annulation de permis.",
        "img": "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment vérifier que les phares sont bien réglés ?",
        "choices": [
          "Au bruit",
          "Se placer face à un mur, les faisceaux doivent être symétriques et légèrement inclinés vers le bas",
          "En roulant",
          "Au contrôle technique uniquement"
        ],
        "correct": 1,
        "explanation": "Face à un mur : faisceaux symétriques, légèrement inclinés vers le bas et la droite.",
        "img": "assets/images/quiz/quiz-img-035.jpeg"
      },
      {
        "q": "Montrez le voyant de frein à main électrique. Comment le désactiver ?",
        "choices": [
          "Tirer le levier",
          "Appuyer sur le bouton du frein électrique en appuyant sur le frein",
          "Tourner la clé",
          "Mettre le contact"
        ],
        "correct": 1,
        "explanation": "Frein électrique : appuyer sur le bouton en tenant la pédale de frein.",
        "img": "assets/images/quiz/quiz-img-009.jpeg"
      },
      {
        "q": "Que signifie le clignotement rapide d'un clignotant ?",
        "choices": [
          "Fonctionnement normal",
          "Une ampoule de clignotant est grillée",
          "La batterie est faible",
          "Le feu est trop puissant"
        ],
        "correct": 1,
        "explanation": "Un clignotement anormalement rapide indique qu'une ampoule est grillée.",
        "img": null
      },
      {
        "q": "Quel est le risque de conduire avec des médicaments ?",
        "choices": [
          "Aucun",
          "Certains médicaments diminuent les réflexes et la vigilance",
          "Améliore la conduite",
          "Seulement les antibiotiques"
        ],
        "correct": 1,
        "explanation": "Certains médicaments (pictogramme sur la boîte) altèrent la conduite.",
        "img": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment réduire la pollution sonore en conduisant ?",
        "choices": [
          "Rouler vite",
          "Rouler à vitesse modérée, entretenir le pot d'échappement",
          "Klaxonner moins",
          "Mettre de la musique"
        ],
        "correct": 1,
        "explanation": "Vitesse modérée et pot d'échappement en bon état réduisent le bruit.",
        "img": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=520&h=260&fit=crop"
      },
      {
        "q": "Que vérifier sur les balais d'essuie-glaces ?",
        "choices": [
          "La couleur",
          "L'état du caoutchouc (fissuré, décollé) et l'efficacité d'essuyage",
          "La longueur",
          "Le poids"
        ],
        "correct": 1,
        "explanation": "Vérifier que le caoutchouc n'est pas fissuré ou décollé.",
        "img": "assets/images/quiz/quiz-img-017.jpeg"
      },
      {
        "q": "Montrez les phares. Comment changer une ampoule sur ce véhicule ?",
        "choices": [
          "Par le dessus",
          "Accéder par le compartiment moteur, tourner le support d'ampoule",
          "Par la carrosserie",
          "Au garage uniquement"
        ],
        "correct": 1,
        "explanation": "Accéder par l'arrière du bloc optique sous le capot.",
        "img": "assets/images/quiz/quiz-img-035.jpeg"
      },
      {
        "q": "Que faire si les freins ne répondent plus ?",
        "choices": [
          "Sauter du véhicule",
          "Pomper la pédale, utiliser le frein moteur (rétrograder), frein de parking en dernier recours",
          "Tourner la clé",
          "Accélérer"
        ],
        "correct": 1,
        "explanation": "Pomper la pédale, frein moteur en rétrogradant, frein de parking en dernier recours.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment évaluer l'état de conscience d'une victime ?",
        "choices": [
          "La secouer violemment",
          "Lui parler fort, lui demander de serrer la main, lui pincer légèrement",
          "La gifler",
          "Lui verser de l'eau"
        ],
        "correct": 1,
        "explanation": "Stimuler verbalement et physiquement : parler, demander de serrer la main.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire si la victime d'un accident de moto porte un casque et respire ?",
        "choices": [
          "Retirer le casque",
          "Ne pas retirer le casque, détacher la jugulaire et surveiller la respiration",
          "Rien",
          "La déplacer"
        ],
        "correct": 1,
        "explanation": "Laisser le casque, détacher la jugulaire et surveiller la respiration.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 19,
    "title": "Conduite & Sécurité 19",
    "icon": "fas fa-hands-helping",
    "color": "#059669",
    "description": "Éco-conduite avancée, partage route, technique, secours pratique",
    "questions": [
      {
        "q": "Qu'est-ce que l'éco-conduite apporte concrètement ?",
        "choices": [
          "Rien",
          "Économie de carburant, moins de pollution, moins d'usure, plus de sécurité",
          "Plus de puissance",
          "Une conduite plus rapide"
        ],
        "correct": 1,
        "explanation": "L'éco-conduite réduit la consommation de 10-15%, l'usure et les risques.",
        "img": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=520&h=260&fit=crop"
      },
      {
        "q": "Pourquoi anticiper le trafic en regardant loin ?",
        "choices": [
          "Par curiosité",
          "Pour adapter sa vitesse et éviter les freinages brusques",
          "Pour aller plus vite",
          "Pour le GPS"
        ],
        "correct": 1,
        "explanation": "Anticiper permet une conduite plus fluide, sûre et économique.",
        "img": null
      },
      {
        "q": "Montrez le voyant de pression pneus. Que faire s'il s'allume ?",
        "choices": [
          "Continuer",
          "Vérifier la pression de tous les pneus dès que possible",
          "Ignorer",
          "Gonfler au hasard"
        ],
        "correct": 1,
        "explanation": "Vérifier la pression de tous les pneus et ajuster selon l'étiquette portière.",
        "img": "assets/images/quiz/quiz-img-014.jpeg"
      },
      {
        "q": "Comment adapter sa conduite dans une zone scolaire ?",
        "choices": [
          "Vitesse normale",
          "Rouler à 30 km/h max, être très vigilant aux enfants",
          "Klaxonner pour prévenir",
          "Accélérer pour quitter vite la zone"
        ],
        "correct": 1,
        "explanation": "Zone scolaire : 30 km/h max, vigilance extrême aux heures d'entrée/sortie.",
        "img": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le bocal de refroidissement. Comment vérifier sans ouvrir ?",
        "choices": [
          "Impossible",
          "Regarder le niveau à travers le bocal transparent entre MIN et MAX",
          "Toucher le bocal",
          "Écouter"
        ],
        "correct": 1,
        "explanation": "Le bocal est transparent : vérifier visuellement entre MIN et MAX.",
        "img": "assets/images/quiz/quiz-img-028.jpeg"
      },
      {
        "q": "Que signifie le terme « zone de rencontre » ?",
        "choices": [
          "Zone de parking",
          "Zone limitée à 20 km/h où le piéton est prioritaire",
          "Zone industrielle",
          "Zone 30"
        ],
        "correct": 1,
        "explanation": "Zone de rencontre : 20 km/h max, piétons prioritaires sur toute la chaussée.",
        "img": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment réagir si un pneu éclate en roulant ?",
        "choices": [
          "Freiner fort",
          "Maintenir le volant fermement, ne pas freiner brusquement, ralentir progressivement",
          "Accélérer",
          "Lâcher le volant"
        ],
        "correct": 1,
        "explanation": "Maintenir le volant, relâcher l'accélérateur doucement, ne pas freiner brusquement.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Quel est l'intérêt d'un régulateur adaptatif (ACC) ?",
        "choices": [
          "Aucun",
          "Il adapte la vitesse et la distance au véhicule précédent automatiquement",
          "Il freine uniquement",
          "Il accélère uniquement"
        ],
        "correct": 1,
        "explanation": "Le régulateur adaptatif maintient la vitesse ET adapte la distance au véhicule devant.",
        "img": "assets/images/quiz/quiz-img-020.jpeg"
      },
      {
        "q": "Montrez la commande du klaxon. Dans quel cas l'utiliser hors agglo ?",
        "choices": [
          "Pour saluer",
          "Pour prévenir d'un danger",
          "Pour exprimer sa colère",
          "Pour doubler"
        ],
        "correct": 1,
        "explanation": "Hors agglomération, le klaxon s'utilise pour prévenir d'un danger.",
        "img": "assets/images/quiz/quiz-img-021.jpeg"
      },
      {
        "q": "Que signifie le panneau avec un cercle rouge et « 30 » ?",
        "choices": [
          "Minimum 30",
          "Vitesse limitée à 30 km/h maximum",
          "30 mètres avant un stop",
          "Zone 30 facultative"
        ],
        "correct": 1,
        "explanation": "Cercle rouge avec 30 = vitesse limitée à 30 km/h.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment réagir si de la fumée blanche sort du capot ?",
        "choices": [
          "Normal",
          "S'arrêter immédiatement : possible fuite de liquide de refroidissement",
          "Accélérer",
          "Ajouter de l'huile"
        ],
        "correct": 1,
        "explanation": "Fumée blanche = probable fuite de refroidissement. S'arrêter et ne pas ouvrir le capot.",
        "img": null
      },
      {
        "q": "Montrez la jauge de carburant. Que signifie la petite flèche ?",
        "choices": [
          "La vitesse",
          "Le côté du véhicule où se trouve la trappe à carburant",
          "Le niveau d'huile",
          "La direction du vent"
        ],
        "correct": 1,
        "explanation": "La petite flèche à côté du symbole indique le côté de la trappe.",
        "img": null
      },
      {
        "q": "Quel type de permis pour conduire un véhicule de plus de 3,5 tonnes ?",
        "choices": [
          "Permis B",
          "Permis C",
          "Permis A",
          "Permis D"
        ],
        "correct": 1,
        "explanation": "Le permis C est nécessaire pour les véhicules de plus de 3,5 tonnes.",
        "img": null
      },
      {
        "q": "Comment faire le point de patinage en côte ?",
        "choices": [
          "Accélérer à fond",
          "Relâcher doucement l'embrayage jusqu'à sentir le véhicule tirer",
          "Lâcher tout d'un coup",
          "Mettre le frein à main uniquement"
        ],
        "correct": 1,
        "explanation": "Relâcher l'embrayage doucement jusqu'au point de patinage (le véhicule « tire »).",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire face à un tramway ?",
        "choices": [
          "Le doubler par la droite",
          "Ne jamais s'engager sur les rails, lui céder la priorité",
          "Le suivre de près",
          "Klaxonner"
        ],
        "correct": 1,
        "explanation": "Ne jamais s'engager sur les rails et toujours céder la priorité au tramway.",
        "img": "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le risque d'une température d'huile trop élevée ?",
        "choices": [
          "Aucun",
          "Dégradation de l'huile et risque de casse moteur",
          "Le moteur va mieux",
          "Les freins sont meilleurs"
        ],
        "correct": 1,
        "explanation": "Huile trop chaude perd ses propriétés lubrifiantes = risque de casse moteur.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment réagir face à un piéton aveugle (canne blanche) ?",
        "choices": [
          "Klaxonner",
          "S'arrêter complètement et attendre qu'il ait fini de traverser",
          "Contourner",
          "Accélérer"
        ],
        "correct": 1,
        "explanation": "Toujours s'arrêter et attendre qu'un piéton aveugle ait fini de traverser.",
        "img": "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment pratiquer le bouche-à-bouche ?",
        "choices": [
          "Souffler fort dans le nez",
          "Pincer le nez, basculer la tête, souffler 2 fois dans la bouche",
          "Souffler dans l'oreille",
          "Appuyer sur le thorax"
        ],
        "correct": 1,
        "explanation": "Basculer la tête, pincer le nez, souffler 2 fois progressivement dans la bouche.",
        "img": "https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment reconnaître un arrêt respiratoire ?",
        "choices": [
          "Le ventre bouge",
          "Aucun mouvement du thorax, aucun souffle, aucun bruit respiratoire pendant 10 secondes",
          "Les yeux sont ouverts",
          "La personne tousse"
        ],
        "correct": 1,
        "explanation": "Aucun signe de respiration pendant 10 secondes = arrêt respiratoire.",
        "img": "https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le sigle RCP ?",
        "choices": [
          "Réparation Complète du Pneu",
          "Réanimation Cardio-Pulmonaire",
          "Régulation de la Circulation Publique",
          "Rapport de Contrôle Périodique"
        ],
        "correct": 1,
        "explanation": "RCP = Réanimation Cardio-Pulmonaire (massage cardiaque + insufflations).",
        "img": "https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 20,
    "title": "Conduite & Sécurité 20",
    "icon": "fas fa-flag-checkered",
    "color": "#1e40af",
    "description": "Révision générale : tous les thèmes, préparation à l'examen",
    "questions": [
      {
        "q": "Montrez le tableau de bord. Quel voyant est le plus dangereux ?",
        "choices": [
          "Orange moteur",
          "Un voyant rouge, car il impose un arrêt immédiat",
          "Bleu feux de route",
          "Vert clignotant"
        ],
        "correct": 1,
        "explanation": "Un voyant rouge signale un danger critique nécessitant un arrêt immédiat.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez l'étiquette de pression. Pourquoi deux pressions différentes ?",
        "choices": [
          "Erreur fabricant",
          "Pression à vide et pression à charge (passagers + bagages)",
          "Avant et arrière",
          "Été et hiver"
        ],
        "correct": 1,
        "explanation": "Deux pressions : à vide (usage normal) et à pleine charge (véhicule chargé).",
        "img": "assets/images/quiz/quiz-img-038.jpeg"
      },
      {
        "q": "Montrez la batterie. Quel risque si les bornes sont oxydées ?",
        "choices": [
          "Aucun",
          "Mauvais contact, difficultés de démarrage",
          "Le moteur surchauffe",
          "Les freins faiblissent"
        ],
        "correct": 1,
        "explanation": "Des bornes oxydées empêchent le bon passage du courant = problèmes de démarrage.",
        "img": "assets/images/quiz/quiz-img-030.jpeg"
      },
      {
        "q": "Citez les 5 niveaux à vérifier sous le capot.",
        "choices": [
          "Huile, eau, alcool, essence, air",
          "Huile moteur, liquide frein, refroidissement, lave-glace, direction assistée",
          "Huile, diesel, air, azote, eau",
          "Un seul suffit"
        ],
        "correct": 1,
        "explanation": "Les 5 niveaux : huile, liquide frein, refroidissement, lave-glace, direction assistée.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le bouchon d'huile. Quel symbole le distingue ?",
        "choices": [
          "Thermomètre",
          "Burette d'huile (arrosoir)",
          "Batterie",
          "Goutte d'eau"
        ],
        "correct": 1,
        "explanation": "Le bouchon d'huile porte le symbole d'une burette d'huile.",
        "img": "assets/images/quiz/quiz-img-031.jpeg"
      },
      {
        "q": "Montrez les feux arrière. Quels feux sont rouges en permanence ?",
        "choices": [
          "Clignotants",
          "Feux de position arrière et feux stop",
          "Feux de recul",
          "Feux de brouillard"
        ],
        "correct": 1,
        "explanation": "Les feux de position arrière sont rouges fixes, les feux stop rouges au freinage.",
        "img": "assets/images/quiz/quiz-img-041.jpeg"
      },
      {
        "q": "Comment vérifier l'usure des pneus avec une pièce de monnaie ?",
        "choices": [
          "Mettre une pièce de 1€ dans la rainure, si le bord doré est visible, le pneu est usé",
          "Mesurer avec un mètre",
          "Peser le pneu",
          "Par la couleur"
        ],
        "correct": 0,
        "explanation": "Insérer une pièce de 1€ : si le bord doré est visible, profondeur < 3mm, usure avancée.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Quels gestes de premiers secours doit connaître tout conducteur ?",
        "choices": [
          "Aucun",
          "PAS (Protéger/Alerter/Secourir), PLS, massage cardiaque, arrêt hémorragie",
          "Uniquement appeler les secours",
          "Le massage cardiaque uniquement"
        ],
        "correct": 1,
        "explanation": "Tout conducteur doit connaître : PAS, PLS, massage cardiaque et compression hémorragie.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la meilleure position du siège pour conduire ?",
        "choices": [
          "Très proche du volant",
          "Bras légèrement fléchis sur le volant, dos calé, pied gauche à plat",
          "Très loin du volant",
          "Dossier très incliné"
        ],
        "correct": 1,
        "explanation": "Bras légèrement fléchis, dos calé contre le dossier, pied gauche posé à plat.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le commodo droit. À quoi sert-il ?",
        "choices": [
          "Éclairage",
          "Essuie-glaces et lave-glace",
          "Clignotants",
          "Régulateur"
        ],
        "correct": 1,
        "explanation": "Le commodo droit commande les essuie-glaces et le lave-glace avant/arrière.",
        "img": null
      },
      {
        "q": "Montrez le commodo gauche. À quoi sert-il ?",
        "choices": [
          "Essuie-glaces",
          "Éclairage (feux de position, croisement, route) et clignotants",
          "Klaxon",
          "Régulateur"
        ],
        "correct": 1,
        "explanation": "Le commodo gauche commande l'éclairage et les clignotants.",
        "img": null
      },
      {
        "q": "Comment réagir si le moteur ne démarre pas par temps froid ?",
        "choices": [
          "Insister sur le démarreur",
          "Vérifier la batterie, attendre quelques secondes entre les tentatives",
          "Pousser le véhicule",
          "Ajouter de l'eau chaude"
        ],
        "correct": 1,
        "explanation": "Vérifier la batterie. Ne pas insister : risque de noyer le moteur ou user le démarreur.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est l'importance du contrôle des angles morts avant chaque manœuvre ?",
        "choices": [
          "Aucune",
          "Essentielle : les angles morts cachent des usagers vulnérables",
          "Optionnelle",
          "Uniquement en ville"
        ],
        "correct": 1,
        "explanation": "Les angles morts peuvent cacher piétons, vélos et motos. Toujours vérifier.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le coffre. Quels équipements de sécurité y trouver ?",
        "choices": [
          "Rien",
          "Gilet haute visibilité, triangle de présignalisation, roue/kit de secours",
          "Uniquement un cric",
          "Des outils"
        ],
        "correct": 1,
        "explanation": "Gilet (accessible depuis l'habitacle), triangle et roue de secours ou kit anti-crevaison.",
        "img": null
      },
      {
        "q": "Résumez les étapes de la chaîne de secours.",
        "choices": [
          "Appeler puis partir",
          "1.Protéger 2.Alerter les secours 3.Secourir selon l'état de la victime",
          "1.Secourir 2.Alerter 3.Protéger",
          "1.Alerter 2.Protéger 3.Partir"
        ],
        "correct": 1,
        "explanation": "PAS : 1.Protéger la zone 2.Alerter (15/18/112) 3.Secourir la victime.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel document justifie l'assurance du véhicule ?",
        "choices": [
          "La carte grise",
          "La carte verte (attestation d'assurance)",
          "Le permis de conduire",
          "Le contrôle technique"
        ],
        "correct": 1,
        "explanation": "La carte verte (attestation d'assurance) doit être présente dans le véhicule.",
        "img": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=520&h=260&fit=crop"
      },
      {
        "q": "Quels documents avoir obligatoirement dans le véhicule ?",
        "choices": [
          "Permis uniquement",
          "Permis de conduire, carte grise et attestation d'assurance",
          "Carte d'identité et permis",
          "Carnet de santé"
        ],
        "correct": 1,
        "explanation": "Les 3 documents obligatoires : permis, carte grise et attestation d'assurance.",
        "img": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=520&h=260&fit=crop"
      },
      {
        "q": "Pourquoi vérifier l'ensemble du véhicule régulièrement ?",
        "choices": [
          "Par obligation",
          "Pour garantir la sécurité, éviter les pannes et maintenir les performances",
          "Pour le revendre plus cher",
          "Par habitude"
        ],
        "correct": 1,
        "explanation": "Un entretien régulier garantit sécurité, fiabilité et performances du véhicule.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel geste résume le mieux la conduite responsable ?",
        "choices": [
          "Rouler vite pour gagner du temps",
          "Anticiper, respecter les règles, partager la route et être attentif aux autres",
          "Suivre les autres véhicules",
          "Klaxonner souvent"
        ],
        "correct": 1,
        "explanation": "Conduite responsable = anticipation, respect des règles, partage de la route et vigilance.",
        "img": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le volant. Quelle position des mains est recommandée ?",
        "choices": [
          "En haut",
          "9h15 ou 10h10 (quart gauche et quart droit)",
          "En bas",
          "Une seule main suffit"
        ],
        "correct": 1,
        "explanation": "Position recommandée : 9h15 ou 10h10, mains symétriques pour un bon contrôle.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      }
    ]
  }
];
