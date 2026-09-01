const quizSessions = [
  {
    "id": 1,
    "title": "Conduite & S?curit? 1",
    "icon": "fas fa-shield-alt",
    "color": "#3b82f6",
    "description": "Ceinture, appui-t?te, Isofix, r?troviseur, voyants, freins, pneus, secourisme",
    "questions": [
      {
        "q": "En r?gle g?n?rale, ? partir de quel ?ge un enfant peut-il ?tre install? ? l'avant ?",
        "choices": [
          "8 ans",
          "10 ans",
          "12 ans",
          "6 ans"
        ],
        "correct": 1,
        "explanation": "Un enfant peut ?tre install? ? l'avant ? partir de 10 ans.",
        "img": "assets/images/quiz/quiz-img-002.jpeg"
      },
      {
        "q": "Quelle est l'utilit? de l'appui-t?te du si?ge conducteur ?",
        "choices": [
          "Am?liorer le confort",
          "Retenir la t?te en cas de choc et limiter les blessures cervicales",
          "Maintenir la t?te droite",
          "Emp?cher de s'endormir"
        ],
        "correct": 1,
        "explanation": "L'appui-t?te retient le mouvement de la t?te en cas de choc arri?re (coup du lapin).",
        "img": "assets/images/quiz/quiz-img-003.jpeg"
      },
      {
        "q": "Peut-on fixer tout type de si?ge enfant sur des attaches Isofix ?",
        "choices": [
          "Oui tous",
          "Non, uniquement ceux compatibles avec ce syst?me",
          "Oui mais seulement ? l'arri?re",
          "Non, Isofix n'est plus autoris?"
        ],
        "correct": 1,
        "explanation": "Seuls les si?ges compatibles Isofix peuvent y ?tre fix?s.",
        "img": "assets/images/quiz/quiz-img-004.jpeg"
      },
      {
        "q": "Quel r?glage est essentiel pour le r?troviseur int?rieur ?",
        "choices": [
          "Position nuit",
          "Le r?gler pour voir l'ensemble de la lunette arri?re",
          "Le tourner vers le bas",
          "Le d?sactiver de jour"
        ],
        "correct": 1,
        "explanation": "R?gler pour voir l'ensemble de la lunette arri?re sans bouger la t?te.",
        "img": "assets/images/quiz/quiz-img-016.jpeg"
      },
      {
        "q": "Quelles pr?cautions lors du remplissage du r?servoir ?",
        "choices": [
          "Laisser le moteur tourner",
          "Arr?ter le moteur, ne pas fumer, ne pas t?l?phoner",
          "Remplir ? ras bord",
          "Garder les phares allum?s"
        ],
        "correct": 1,
        "explanation": "Arr?ter le moteur, ne pas fumer et ne pas t?l?phoner.",
        "img": "assets/images/quiz/quiz-img-005.jpeg"
      },
      {
        "q": "Que signifie le voyant en forme de burette d'huile avec STOP ?",
        "choices": [
          "Niveau d'huile correct",
          "Pression d'huile insuffisante, s'arr?ter imm?diatement",
          "Vidange prochaine",
          "Temp?rature d'huile id?ale"
        ],
        "correct": 1,
        "explanation": "S'arr?ter imm?diatement pour ?viter la casse moteur.",
        "img": "assets/images/quiz/quiz-img-007.jpeg"
      },
      {
        "q": "Comment d?tecter l'usure des essuie-glaces ?",
        "choices": [
          "Par le bruit",
          "Lorsqu'ils laissent des traces sur le pare-brise",
          "En les inspectant chaque mois",
          "Quand le lave-glace ne fonctionne plus"
        ],
        "correct": 1,
        "explanation": "Des essuie-glaces us?s laissent des traces ou zones non essuy?es.",
        "img": "assets/images/quiz/quiz-img-017.jpeg"
      },
      {
        "q": "Quelle est la profondeur minimale l?gale des sculptures d'un pneu ?",
        "choices": [
          "1 mm",
          "1,6 mm",
          "2,5 mm",
          "3 mm"
        ],
        "correct": 1,
        "explanation": "La profondeur minimale l?gale est de 1,6 mm.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Quels sont les num?ros d'urgence ? composer ?",
        "choices": [
          "15-17-18 uniquement",
          "18 pompiers, 15 Samu, 112 urgence europ?en",
          "112 uniquement",
          "17 police, 119 enfance"
        ],
        "correct": 1,
        "explanation": "18 (pompiers), 15 (Samu), 112 (num?ro d'urgence europ?en).",
        "img": "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=520&h=260&fit=crop"
      },
      {
        "q": "Qu'est-ce qu'un d?fibrillateur automatis? externe (DAE) ?",
        "choices": [
          "Appareil pour mesurer la tension",
          "Appareil qui r?tablit une activit? cardiaque normale",
          "Outil pour arr?ter une h?morragie",
          "Masque de respiration"
        ],
        "correct": 1,
        "explanation": "Le DAE analyse le rythme cardiaque et d?livre un choc si n?cessaire.",
        "img": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=520&h=260&fit=crop"
      },
      {
        "q": "De quelle couleur est le voyant de d?faillance du freinage ?",
        "choices": [
          "Orange",
          "Vert",
          "Rouge",
          "Bleu"
        ],
        "correct": 2,
        "explanation": "Le voyant de freinage est rouge : danger critique, arr?t imp?ratif.",
        "img": "assets/images/quiz/quiz-img-009.jpeg"
      },
      {
        "q": "O? se situent les attaches Isofix sur ce v?hicule ?",
        "choices": [
          "Si?ges avant",
          "Entre l'assise et le dossier des si?ges arri?re",
          "Dans le coffre",
          "Banquette centrale"
        ],
        "correct": 1,
        "explanation": "Les attaches Isofix se trouvent entre l'assise et le dossier de la banquette arri?re.",
        "img": "assets/images/quiz/quiz-img-004.jpeg"
      },
      {
        "q": "Citez 2 ?l?ments pour un d?sembuage efficace.",
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
        "q": "Pourquoi utiliser un liquide lave-glace sp?cial en hiver ?",
        "choices": [
          "Meilleur nettoyage",
          "Pour ?viter le gel du liquide",
          "Prot?ger les essuie-glaces",
          "Parfumer l'habitacle"
        ],
        "correct": 1,
        "explanation": "Le liquide hiver contient un antigel.",
        "img": "assets/images/quiz/quiz-img-025.jpeg"
      },
      {
        "q": "Sur autoroute, comment indiquer les lieux d'un accident ?",
        "choices": [
          "D?crire le paysage",
          "Num?ro d'autoroute, sens de circulation et point kilom?trique",
          "Ville la plus proche",
          "Activer le GPS"
        ],
        "correct": 1,
        "explanation": "Indiquer le num?ro de l'autoroute, le sens et le point kilom?trique.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel ?quipement est obligatoire en cas de panne ?",
        "choices": [
          "Lampe de poche",
          "Gilet haute visibilit? et triangle de pr?signalisation",
          "Trousse de secours",
          "Extincteur"
        ],
        "correct": 1,
        "explanation": "Le gilet et le triangle sont obligatoires.",
        "img": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment arr?ter une h?morragie ?",
        "choices": [
          "Mettre un garrot",
          "Appuyer fortement sur l'endroit qui saigne avec un tissu propre",
          "Sur?lever le membre",
          "Mettre de l'eau froide"
        ],
        "correct": 1,
        "explanation": "Appuyer fortement et directement sur la plaie avec un tissu propre.",
        "img": "https://images.unsplash.com/photo-1584515933487-779824d29309?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le voyant de charge batterie allum? en roulant ?",
        "choices": [
          "Batterie pleine",
          "Le syst?me de charge est d?faillant",
          "Moteur va acc?l?rer",
          "Essuie-glaces vont s'arr?ter"
        ],
        "correct": 1,
        "explanation": "L'alternateur ne charge plus la batterie. Limiter la consommation et s'arr?ter.",
        "img": "assets/images/quiz/quiz-img-008.jpeg"
      },
      {
        "q": "? quelle distance placer le triangle de pr?signalisation ?",
        "choices": [
          "10 m?tres",
          "30 m?tres",
          "50 m?tres",
          "100 m?tres"
        ],
        "correct": 1,
        "explanation": "Le triangle se place ? environ 30 m?tres de l'obstacle.",
        "img": "assets/images/quiz/quiz-img-048.jpeg"
      },
      {
        "q": "Quels sont les signes d'un arr?t cardiaque ?",
        "choices": [
          "Douleur ? la poitrine",
          "Ne r?pond pas, ne r?agit pas, ne respire pas ou respiration anormale",
          "Transpire beaucoup",
          "Yeux ouverts"
        ],
        "correct": 1,
        "explanation": "Absence de r?ponse, absence de r?action ET absence de respiration normale.",
        "img": "https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 2,
    "title": "Conduite & S?curit? 2",
    "icon": "fas fa-car",
    "color": "#ef4444",
    "description": "Voyants, porti?res, climatisation, capot, pression pneus, PLS, alerter",
    "questions": [
      {
        "q": "Quel est l'int?r?t de la position nuit du r?troviseur int?rieur ?",
        "choices": [
          "Mieux voir la nuit",
          "Ne pas ?tre ?bloui par les feux du v?hicule suiveur",
          "Voir les panneaux",
          "Augmenter le champ de vision"
        ],
        "correct": 1,
        "explanation": "La position nuit ?vite l'?blouissement par les phares arri?re.",
        "img": "assets/images/quiz/quiz-img-016.jpeg"
      },
      {
        "q": "Que signifie le voyant de temp?rature du liquide de refroidissement ?",
        "choices": [
          "Moteur froid",
          "Moteur en surchauffe, s'arr?ter rapidement",
          "Climatisation active",
          "Huile basse"
        ],
        "correct": 1,
        "explanation": "Voyant rouge = surchauffe moteur. S'arr?ter et laisser refroidir.",
        "img": "assets/images/quiz/quiz-img-028.jpeg"
      },
      {
        "q": "Dans quel cas utiliser les feux de d?tresse (warnings) ?",
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
        "explanation": "Le bouchon du r?servoir de lave-glace est bleu.",
        "img": "assets/images/quiz/quiz-img-025.jpeg"
      },
      {
        "q": "Quel risque si on ouvre le bouchon de refroidissement moteur chaud ?",
        "choices": [
          "D?bordement",
          "Br?lure par vapeur sous pression",
          "Moteur cale",
          "Liquide inefficace"
        ],
        "correct": 1,
        "explanation": "Moteur chaud, le liquide est sous pression. Ouvrir lib?re de la vapeur br?lante.",
        "img": "assets/images/quiz/quiz-img-028.jpeg"
      },
      {
        "q": "O? trouver la pression recommand?e des pneus ?",
        "choices": [
          "Tableau de bord",
          "?tiquette dans la porti?re du conducteur",
          "Sur les pneus",
          "Au contr?le technique"
        ],
        "correct": 1,
        "explanation": "L'?tiquette de pression est dans l'encadrement de la porti?re conducteur.",
        "img": "assets/images/quiz/quiz-img-038.jpeg"
      },
      {
        "q": "Que signifie le voyant des porti?res ouvertes ?",
        "choices": [
          "Coffre ouvert",
          "Une ou plusieurs porti?res sont mal ferm?es",
          "Surchauffe moteur",
          "Frein ? main serr?"
        ],
        "correct": 1,
        "explanation": "Ce voyant indique qu'une ou plusieurs porti?res ne sont pas correctement ferm?es.",
        "img": "assets/images/quiz/quiz-img-011.jpeg"
      },
      {
        "q": "Pourquoi l'alerte aux secours doit-elle ?tre rapide et pr?cise ?",
        "choices": [
          "?viter une amende",
          "Permettre aux secours d'apporter les moyens adapt?s rapidement",
          "Informer la police",
          "Obtenir un num?ro de dossier"
        ],
        "correct": 1,
        "explanation": "Une alerte rapide et pr?cise permet des secours adapt?s au plus vite.",
        "img": "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=520&h=260&fit=crop"
      },
      {
        "q": "Dans quel cas positionner une victime en PLS ?",
        "choices": [
          "Quand elle a mal au dos",
          "Si elle ne r?pond pas, ne r?agit pas mais respire",
          "Quand elle saigne",
          "Quand elle est fatigu?e"
        ],
        "correct": 1,
        "explanation": "La PLS s'applique si la victime est inconsciente mais respire.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle cons?quence d'une panne de d?givrage de la lunette arri?re ?",
        "choices": [
          "Panne de chauffage",
          "Absence de visibilit? vers l'arri?re",
          "Dysfonctionnement essuie-glaces",
          "Surconsommation"
        ],
        "correct": 1,
        "explanation": "Sans d?givrage, la lunette reste embu?e, r?duisant la visibilit? arri?re.",
        "img": "assets/images/quiz/quiz-img-006.jpeg"
      },
      {
        "q": "Quel risque de rouler avec des pneus sous-gonfl?s ?",
        "choices": [
          "Consomme moins",
          "Risque d'?clatement et usure anormale",
          "Freins plus efficaces",
          "Meilleur confort"
        ],
        "correct": 1,
        "explanation": "Pneus sous-gonfl?s : surchauffe, usure in?gale, risque d'?clatement.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Diff?rence entre voyant orange et voyant rouge ?",
        "choices": [
          "Pas de diff?rence",
          "Orange = d?faut ? v?rifier, Rouge = danger, arr?t imp?ratif",
          "Orange = danger, Rouge = info",
          "Orange = position, Rouge = stop"
        ],
        "correct": 1,
        "explanation": "Rouge = anomalie grave (arr?t). Orange = d?faut important ? v?rifier.",
        "img": "assets/images/quiz/quiz-img-012.jpeg"
      },
      {
        "q": "Quel risque de circuler avec un frein de parking mal desserr? ?",
        "choices": [
          "Aucun",
          "Surchauffe et d?gradation du syst?me de freinage",
          "Panne de direction",
          "Probl?me de clim"
        ],
        "correct": 1,
        "explanation": "Rouler frein de parking serr? = surchauffe et usure pr?matur?e des freins.",
        "img": "assets/images/quiz/quiz-img-009.jpeg"
      },
      {
        "q": "Quelles 3 informations transmettre aux secours ?",
        "choices": [
          "Nom, pr?nom, adresse",
          "Num?ro de t?l?phone, nature du probl?me, localisation",
          "Num?ro de plaque, couleur, marque",
          "Heure, lieu, nombre de v?hicules"
        ],
        "correct": 1,
        "explanation": "Donner : votre num?ro, la nature du probl?me et la localisation pr?cise.",
        "img": "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez la commande d'essuie-glaces. O? se trouve-t-elle ?",
        "choices": [
          "Commodo gauche",
          "Commodo droit, derri?re le volant",
          "Bouton au tableau de bord",
          "Sur le volant"
        ],
        "correct": 1,
        "explanation": "La commande d'essuie-glaces est sur le commodo droit, derri?re le volant.",
        "img": "assets/images/quiz/quiz-img-017.jpeg"
      },
      {
        "q": "Quelle est la cons?quence d'un niveau insuffisant de liquide de frein ?",
        "choices": [
          "Freins plus r?actifs",
          "Perte d'efficacit? du freinage",
          "Moteur cale",
          "Essuie-glaces lents"
        ],
        "correct": 1,
        "explanation": "Un manque de liquide de frein = perte d'efficacit? du freinage.",
        "img": "assets/images/quiz/quiz-img-027.jpeg"
      },
      {
        "q": "Qu'est-ce qu'une h?morragie ?",
        "choices": [
          "Simple saignement de nez",
          "Perte de sang prolong?e qui ne s'arr?te pas, imbibe un mouchoir en secondes",
          "Bleu ou h?matome",
          "Coupure superficielle"
        ],
        "correct": 1,
        "explanation": "Saignement abondant qui ne s'arr?te pas spontan?ment.",
        "img": "https://images.unsplash.com/photo-1584515933487-779824d29309?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel risque d'un capot mal ferm? en roulant ?",
        "choices": [
          "Surchauffe",
          "Le capot peut s'ouvrir et bloquer la visibilit?",
          "Fuite de refroidissement",
          "D?charge batterie"
        ],
        "correct": 1,
        "explanation": "Un capot mal ferm? peut s'ouvrir brusquement et bloquer totalement la visibilit?.",
        "img": "assets/images/quiz/quiz-img-032.jpeg"
      },
      {
        "q": "? quoi servent les catadioptres sur un v?hicule ?",
        "choices": [
          "?clairer la route",
          "Rendre le v?hicule visible en r?fl?chissant la lumi?re",
          "Indiquer un changement de direction",
          "Mesurer la distance"
        ],
        "correct": 1,
        "explanation": "Les catadioptres refl?tent la lumi?re, rendant le v?hicule visible phares ?teints.",
        "img": "assets/images/quiz/quiz-img-040.jpeg"
      },
      {
        "q": "Pourquoi pratiquer imm?diatement une r?animation sur un arr?t cardiaque ?",
        "choices": [
          "Pour r?chauffer",
          "Les l?sions du cerveau surviennent d?s les premi?res minutes sans oxyg?ne",
          "Pour attendre les secours",
          "Pour v?rifier la respiration"
        ],
        "correct": 1,
        "explanation": "Le cerveau ne supporte pas plus de 3-5 min sans oxyg?ne.",
        "img": "https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 3,
    "title": "Conduite & S?curit? 3",
    "icon": "fas fa-lightbulb",
    "color": "#f59e0b",
    "description": "?clairage, commandes, huile moteur, ext?rieur, secourisme",
    "questions": [
      {
        "q": "Quel est le risque de maintenir les feux de route lors d'un croisement ?",
        "choices": [
          "Aucun",
          "?blouir les autres usagers et provoquer un accident",
          "Panne batterie",
          "Surchauffe phares"
        ],
        "correct": 1,
        "explanation": "Les feux de route ?blouissent les conducteurs en face.",
        "img": "assets/images/quiz/quiz-img-013.jpeg"
      },
      {
        "q": "Comment reconna?t-on le voyant des feux de route ?",
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
        "explanation": "Pousser le commodo d'?clairage vers l'avant (loin du conducteur).",
        "img": "assets/images/quiz/quiz-img-013.jpeg"
      },
      {
        "q": "Quelles conditions pour contr?ler le niveau d'huile ?",
        "choices": [
          "Moteur chaud en pente",
          "Moteur froid et terrain plat",
          "Moteur en marche",
          "Peu importe"
        ],
        "correct": 1,
        "explanation": "V?rifier l'huile moteur froid et sur terrain plat.",
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
          "D?t?rioration ou casse du moteur",
          "Plus de bruit",
          "Freins moins efficaces"
        ],
        "correct": 1,
        "explanation": "L'huile lubrifie les pi?ces. Un manque peut d?truire le moteur.",
        "img": "assets/images/quiz/quiz-img-029.jpeg"
      },
      {
        "q": "Les pneus du m?me essieu doivent-ils ?tre identiques ?",
        "choices": [
          "Non",
          "Oui, m?me marque, dimension et type",
          "Seulement ? l'avant",
          "Seulement en hiver"
        ],
        "correct": 1,
        "explanation": "Pneus du m?me essieu : identiques pour un comportement s?r.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Quels feux utiliser dans un tunnel ?clair? ?",
        "choices": [
          "Feux de route",
          "Feux de croisement",
          "Feux de position",
          "Aucun"
        ],
        "correct": 1,
        "explanation": "Dans un tunnel, m?me ?clair?, allumer les feux de croisement.",
        "img": "https://images.unsplash.com/photo-1545987796-200677ee1011?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le risque d'un pare-brise sale ou endommag? ?",
        "choices": [
          "Use les essuie-glaces",
          "R?duit la visibilit? et provoque des ?blouissements",
          "Ralentit le v?hicule",
          "Emp?che la clim"
        ],
        "correct": 1,
        "explanation": "Un pare-brise sale r?duit la visibilit?, surtout face au soleil ou phares.",
        "img": "assets/images/quiz/quiz-img-045.jpeg"
      },
      {
        "q": "Que faire face ? une victime inconsciente qui ne respire pas ?",
        "choices": [
          "La mettre en PLS",
          "Appeler le 15 et commencer un massage cardiaque",
          "Lui donner de l'eau",
          "Attendre qu'elle se r?veille"
        ],
        "correct": 1,
        "explanation": "Appeler les secours et commencer la r?animation cardio-pulmonaire (RCP).",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment v?rifier la respiration d'une victime ?",
        "choices": [
          "Prendre son pouls",
          "Basculer la t?te en arri?re, approcher la joue de sa bouche, regarder le thorax",
          "Lui parler",
          "La secouer"
        ],
        "correct": 1,
        "explanation": "Lib?rer les voies a?riennes, approcher sa joue et observer le thorax pendant 10 secondes.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le bouchon de remplissage d'huile. Quel est son symbole ?",
        "choices": [
          "Goutte d'eau",
          "Burette d'huile (arrosoir)",
          "Thermom?tre",
          "Cl? ? molette"
        ],
        "correct": 1,
        "explanation": "Le bouchon porte le symbole d'une burette d'huile.",
        "img": "assets/images/quiz/quiz-img-031.jpeg"
      },
      {
        "q": "Comment rep?rer le t?moin d'usure TWI sur un pneu ?",
        "choices": [
          "Marque rouge sur le flanc",
          "Triangle TWI sur le flanc indiquant l'emplacement dans la rainure",
          "Date inscrite",
          "Pression de gonflage"
        ],
        "correct": 1,
        "explanation": "Le marquage TWI indique les t?moins d'usure dans les rainures principales.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Quand faut-il v?rifier la pression des pneus ?",
        "choices": [
          "Apr?s un long trajet",
          "? froid, avant de rouler",
          "En roulant",
          "Au contr?le technique"
        ],
        "correct": 1,
        "explanation": "La pression se v?rifie ? froid car la chaleur fausse la mesure.",
        "img": "assets/images/quiz/quiz-img-038.jpeg"
      },
      {
        "q": "Quel ?quipement de s?curit? enfiler AVANT de sortir du v?hicule en panne ?",
        "choices": [
          "Casque",
          "Gilet haute visibilit?",
          "Gants",
          "Brassard"
        ],
        "correct": 1,
        "explanation": "Le gilet doit ?tre enfil? AVANT de sortir pour ?tre visible.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez les feux arri?re. Combien de fonctions assurent-ils ?",
        "choices": [
          "2",
          "Au moins 5 : position, stop, clignotants, recul, brouillard",
          "3",
          "1"
        ],
        "correct": 1,
        "explanation": "Feux arri?re : position, stop, clignotants, recul et brouillard arri?re.",
        "img": "assets/images/quiz/quiz-img-041.jpeg"
      },
      {
        "q": "Par quels moyens r?aliser l'alerte des secours ?",
        "choices": [
          "Uniquement portable",
          "T?l?phone portable, fixe ou borne d'appel d'urgence",
          "En allant aux urgences",
          "Par courrier"
        ],
        "correct": 1,
        "explanation": "T?l?phone portable, fixe ou borne d'appel d'urgence (autoroute : tous les 2 km).",
        "img": "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=520&h=260&fit=crop"
      },
      {
        "q": "? quoi sert la molette de r?glage de hauteur des phares ?",
        "choices": [
          "?clairer les panneaux",
          "Adapter l'inclinaison selon la charge du v?hicule",
          "Allumer les feux de route",
          "Activer l'?clairage int?rieur"
        ],
        "correct": 1,
        "explanation": "Quand le v?hicule est charg?, le correcteur ajuste pour ne pas ?blouir.",
        "img": "assets/images/quiz/quiz-img-015.jpeg"
      },
      {
        "q": "Quel est le risque d'un ?clairage d?faillant ? l'arri?re ?",
        "choices": [
          "Amende l?g?re",
          "Ne pas ?tre vu par les v?hicules suivants, risque de collision",
          "Surchauffe",
          "Freins moins efficaces"
        ],
        "correct": 1,
        "explanation": "Un feu arri?re d?faillant rend le v?hicule invisible aux suiveurs.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "? partir de quel ?ge peut-on apprendre les gestes de premiers secours ?",
        "choices": [
          "18 ans",
          "10 ans",
          "14 ans",
          "Aucun ?ge minimum"
        ],
        "correct": 3,
        "explanation": "Il n'y a aucun ?ge minimum pour apprendre les gestes de premiers secours.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 4,
    "title": "Conduite & S?curit? 4",
    "icon": "fas fa-cogs",
    "color": "#8b5cf6",
    "description": "R?gulateur, recyclage air, batterie, plaque, s?curit? enfant, RCP",
    "questions": [
      {
        "q": "Comment d?sactiver rapidement le r?gulateur de vitesse ?",
        "choices": [
          "Tourner le volant",
          "Appuyer sur le frein ou l'embrayage",
          "?teindre les phares",
          "Changer de radio"
        ],
        "correct": 1,
        "explanation": "Le r?gulateur se d?sactive en appuyant sur le frein ou l'embrayage.",
        "img": "assets/images/quiz/quiz-img-020.jpeg"
      },
      {
        "q": "Diff?rence entre r?gulateur et limiteur de vitesse ?",
        "choices": [
          "Aucune",
          "R?gulateur = vitesse constante, limiteur = vitesse max ? ne pas d?passer",
          "Limiteur = vitesse constante",
          "Les deux freinent automatiquement"
        ],
        "correct": 1,
        "explanation": "R?gulateur : vitesse constante. Limiteur : vitesse maximale ? ne pas d?passer.",
        "img": "assets/images/quiz/quiz-img-023.jpeg"
      },
      {
        "q": "Quel risque du recyclage d'air prolong? ?",
        "choices": [
          "Surconsommation",
          "Apparition de bu?e sur les vitres",
          "Panne de clim",
          "Aucun"
        ],
        "correct": 1,
        "explanation": "Le recyclage prolong? provoque de la bu?e sur les surfaces vitr?es.",
        "img": "assets/images/quiz/quiz-img-022.jpeg"
      },
      {
        "q": "Montrez la batterie sous le capot. Comment la rep?rer ?",
        "choices": [
          "Plus gros ?l?ment noir avec bornes + et -",
          "Bocal transparent",
          "Filtre ? air",
          "Radiateur"
        ],
        "correct": 0,
        "explanation": "La batterie est un bo?tier noir avec des bornes + (rouge) et - (noir).",
        "img": "assets/images/quiz/quiz-img-030.jpeg"
      },
      {
        "q": "Quelle solution en cas de panne de batterie ?",
        "choices": [
          "Attendre",
          "Brancher des c?bles de d?marrage depuis une batterie charg?e",
          "Pousser le v?hicule",
          "Appuyer sur le d?marreur"
        ],
        "correct": 1,
        "explanation": "Brancher des c?bles : + avec +, - avec - (ou masse m?tallique).",
        "img": "assets/images/quiz/quiz-img-030.jpeg"
      },
      {
        "q": "Que v?rifier sur la plaque d'immatriculation ?",
        "choices": [
          "Couleur du fond",
          "Lisible, propre, non d?t?rior?e et bien fix?e",
          "Num?ro de d?partement",
          "Date mise en circulation"
        ],
        "correct": 1,
        "explanation": "Plaque lisible, propre et correctement fix?e. Illisible = amende.",
        "img": "assets/images/quiz/quiz-img-044.jpeg"
      },
      {
        "q": "Montrez les feux de recul. Quand s'allument-ils ?",
        "choices": [
          "Quand on freine",
          "Automatiquement en marche arri?re",
          "Quand on allume les phares",
          "Quand on met le clignotant"
        ],
        "correct": 1,
        "explanation": "Les feux de recul (blancs) s'allument automatiquement en marche arri?re.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "O? se situe la s?curit? enfant sur ce v?hicule ?",
        "choices": [
          "Tableau de bord",
          "Sur la tranche de chaque porti?re arri?re",
          "Sous le si?ge",
          "Bo?te ? gants"
        ],
        "correct": 1,
        "explanation": "La s?curit? enfant est sur la tranche des porti?res arri?re.",
        "img": "https://images.unsplash.com/photo-1590362891818-a0a26e4ec3a6?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel voyant s'allume quand le frein de stationnement est activ? ?",
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
        "q": "Pourquoi attendre que les secours autorisent ? raccrocher ?",
        "choices": [
          "Politesse",
          "Ils peuvent donner des instructions de secours en attendant leur arriv?e",
          "Obligation l?gale",
          "Pour noter le num?ro de dossier"
        ],
        "correct": 1,
        "explanation": "Les secours peuvent guider vos gestes en attendant leur arriv?e.",
        "img": "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=520&h=260&fit=crop"
      },
      {
        "q": "Que peut provoquer la d?charge batterie moteur ?teint ?",
        "choices": [
          "Frein ? main",
          "Feux ou accessoires ?lectriques laiss?s en fonctionnement",
          "Pneus sous-gonfl?s",
          "Liquide refroidissement"
        ],
        "correct": 1,
        "explanation": "Feux, radio, accessoires laiss?s allum?s d?chargent la batterie.",
        "img": "assets/images/quiz/quiz-img-008.jpeg"
      },
      {
        "q": "Pourquoi v?rifier les feux avant un trajet de nuit ?",
        "choices": [
          "Contr?le technique",
          "Voir et ?tre vu correctement",
          "?conomiser la batterie",
          "Par habitude"
        ],
        "correct": 1,
        "explanation": "Feux sales ou d?faillants r?duisent l'?clairage et la visibilit?.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment v?rifier visuellement l'?tat d'un pneu ?",
        "choices": [
          "Le toucher",
          "V?rifier t?moins d'usure, absence de coupures et d?formations",
          "Le peser",
          "Mesurer sa temp?rature"
        ],
        "correct": 1,
        "explanation": "V?rifier t?moins d'usure, absence de coupures, hernies, d?formations.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Quel risque de rouler avec des pneus surgonfl?s ?",
        "choices": [
          "Pneus durent plus",
          "Usure au centre, moins d'adh?rence",
          "V?hicule va plus vite",
          "Aucun"
        ],
        "correct": 1,
        "explanation": "Surgonfl?s : usure au centre, moins d'adh?rence, freinage plus long.",
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
        "explanation": "Appel de phares : tirer bri?vement le commodo vers soi.",
        "img": "assets/images/quiz/quiz-img-035.jpeg"
      },
      {
        "q": "Pourquoi v?rifier les niveaux avant un long trajet ?",
        "choices": [
          "Gagner du temps au p?age",
          "S'assurer du bon fonctionnement et ?viter les pannes",
          "Obligation l?gale",
          "?conomiser du carburant"
        ],
        "correct": 1,
        "explanation": "Un long trajet sollicite davantage. V?rifier les niveaux pr?vient les pannes.",
        "img": "assets/images/quiz/quiz-img-036.jpeg"
      },
      {
        "q": "Que faire si le voyant STOP s'allume en roulant ?",
        "choices": [
          "Continuer",
          "S'arr?ter imm?diatement en toute s?curit?",
          "Acc?l?rer",
          "?teindre les phares"
        ],
        "correct": 1,
        "explanation": "Voyant STOP = danger critique. S'arr?ter et couper le moteur.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Que risque un inconscient laiss? sur le dos ?",
        "choices": [
          "Rien",
          "L'obstruction des voies a?riennes par la langue",
          "Douleurs au dos",
          "Hypothermie"
        ],
        "correct": 1,
        "explanation": "La langue peut basculer et obstruer les voies a?riennes. D'o? la PLS.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "? quoi sert le voyant de pr?chauffage diesel ?",
        "choices": [
          "Probl?me moteur",
          "Les bougies chauffent pour faciliter le d?marrage ? froid",
          "Carburant bas",
          "Surchauffe"
        ],
        "correct": 1,
        "explanation": "Les bougies de pr?chauffage facilitent le d?marrage ? froid d'un diesel.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quand utiliser le feu de brouillard arri?re ?",
        "choices": [
          "Toujours par pluie",
          "Uniquement en cas de brouillard ou neige",
          "Sur autoroute uniquement",
          "Si visibilit? r?duite"
        ],
        "correct": 1,
        "explanation": "Le feu de brouillard arri?re : uniquement en brouillard ou neige.",
        "img": "assets/images/quiz/quiz-img-011.jpeg"
      }
    ]
  },
  {
    "id": 5,
    "title": "Conduite & S?curit? 5",
    "icon": "fas fa-tools",
    "color": "#10b981",
    "description": "Entretien, ampoules, ceinture, commandes ?clairage, massage cardiaque",
    "questions": [
      {
        "q": "Montrez l'emplacement des ampoules de feux de croisement. Comment v?rifier ?",
        "choices": [
          "Les toucher",
          "Allumer les feux et v?rifier devant un mur",
          "V?rifier le voyant",
          "?couter un bruit"
        ],
        "correct": 1,
        "explanation": "Allumer les feux et v?rifier visuellement devant un mur ou avec de l'aide.",
        "img": "assets/images/quiz/quiz-img-013.jpeg"
      },
      {
        "q": "Comment ajuster la ceinture pour qu'elle soit efficace ?",
        "choices": [
          "Sous le bras",
          "Sur l'os de la hanche et au milieu de l'?paule",
          "Serrer le plus possible",
          "Seulement sur autoroute"
        ],
        "correct": 1,
        "explanation": "La ceinture : sur l'os de la hanche (bas) et au milieu de l'?paule (haut).",
        "img": null
      },
      {
        "q": "Quand porter la ceinture ?",
        "choices": [
          "Sur autoroute",
          "? haute vitesse",
          "? chaque trajet m?me court, tous les occupants",
          "Seulement le conducteur"
        ],
        "correct": 2,
        "explanation": "Obligatoire pour tous les occupants ? chaque trajet, quelle que soit la distance.",
        "img": null
      },
      {
        "q": "Quel voyant indique que le syst?me ABS est d?faillant ?",
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
        "q": "Montrez la commande d'?clairage. Comment allumer les feux de croisement ?",
        "choices": [
          "Premi?re position molette",
          "Deuxi?me position (symbole 2 faisceaux)",
          "Pousser le commodo",
          "Tirer le commodo"
        ],
        "correct": 1,
        "explanation": "Feux de croisement : tourner la bague du commodo sur la position appropri?e.",
        "img": "assets/images/quiz/quiz-img-013.jpeg"
      },
      {
        "q": "Que signifie un voyant ESP/ASR allum? en orange ?",
        "choices": [
          "Fonctionnement normal",
          "Le contr?le de stabilit? intervient ou est d?sactiv?",
          "Surchauffe",
          "Feux mal r?gl?s"
        ],
        "correct": 1,
        "explanation": "ESP clignotant = le syst?me intervient. Fixe = d?sactiv? ou en panne.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "? quoi sert le liquide de refroidissement ?",
        "choices": [
          "Lubrifier le moteur",
          "Maintenir le moteur ? bonne temp?rature",
          "Alimenter les essuie-glaces",
          "Freiner"
        ],
        "correct": 1,
        "explanation": "Le liquide de refroidissement circule pour absorber la chaleur via le radiateur.",
        "img": "assets/images/quiz/quiz-img-028.jpeg"
      },
      {
        "q": "Quel est le r?le de l'alternateur ?",
        "choices": [
          "D?marrer le moteur",
          "Recharger la batterie et alimenter les ?quipements ?lectriques",
          "Refroidir le moteur",
          "Filtrer l'huile"
        ],
        "correct": 1,
        "explanation": "L'alternateur produit du courant pour recharger la batterie.",
        "img": "assets/images/quiz/quiz-img-030.jpeg"
      },
      {
        "q": "? quelle fr?quence v?rifier la pression des pneus ?",
        "choices": [
          "Tous les 6 mois",
          "Une fois par mois et avant chaque long trajet",
          "Une fois par an",
          "Au contr?le technique"
        ],
        "correct": 1,
        "explanation": "V?rifier la pression une fois par mois et avant chaque long trajet, ? froid.",
        "img": "assets/images/quiz/quiz-img-038.jpeg"
      },
      {
        "q": "Montrez le bouton des feux de d?tresse. Quel est son symbole ?",
        "choices": [
          "Cercle rouge",
          "Triangle rouge",
          "Carr? orange",
          "Losange blanc"
        ],
        "correct": 1,
        "explanation": "Le bouton des feux de d?tresse porte le symbole d'un triangle rouge.",
        "img": "assets/images/quiz/quiz-img-019.jpeg"
      },
      {
        "q": "Quel est le risque principal d'un airbag d?fectueux ?",
        "choices": [
          "V?hicule ne d?marre pas",
          "L'airbag ne se d?clenchera pas en cas de choc",
          "Ceintures ne fonctionnent plus",
          "Moteur cale"
        ],
        "correct": 1,
        "explanation": "Un airbag d?fectueux ne prot?gera pas les occupants en cas d'accident.",
        "img": "assets/images/quiz/quiz-img-001.jpeg"
      },
      {
        "q": "Comment r?aliser un massage cardiaque sur un adulte ?",
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
        "q": "O? placer les mains pour un massage cardiaque ?",
        "choices": [
          "Sur le ventre",
          "Au centre de la poitrine, entre les deux mamelons",
          "Sur le c?t? gauche",
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
          "Transparent, pr?s du ma?tre-cylindre, avec symbole de frein",
          "Il est jaune",
          "Pr?s du radiateur"
        ],
        "correct": 1,
        "explanation": "Le bocal est transparent, situ? pr?s du ma?tre-cylindre.",
        "img": "assets/images/quiz/quiz-img-027.jpeg"
      },
      {
        "q": "Que v?rifier avant de compl?ter un niveau de liquide ?",
        "choices": [
          "Couleur",
          "Le type de liquide recommand? par le constructeur",
          "Marque du v?hicule",
          "Rien"
        ],
        "correct": 1,
        "explanation": "Toujours utiliser le liquide recommand? par le constructeur.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Principal risque d'une absence de liquide lave-glace ?",
        "choices": [
          "Usure essuie-glaces",
          "Mauvaise visibilit? si pare-brise sale",
          "Probl?me freinage",
          "Surchauffe"
        ],
        "correct": 1,
        "explanation": "Sans lave-glace, impossible de nettoyer le pare-brise.",
        "img": "assets/images/quiz/quiz-img-033.jpeg"
      },
      {
        "q": "Peut-on installer un si?ge enfant dos ? la route ? l'avant ?",
        "choices": [
          "Oui sans condition",
          "Oui si l'airbag passager est d?sactiv?",
          "Non jamais",
          "Apr?s 2 ans seulement"
        ],
        "correct": 1,
        "explanation": "Si?ge dos ? la route ? l'avant uniquement si airbag passager d?sactiv?.",
        "img": "assets/images/quiz/quiz-img-004.jpeg"
      },
      {
        "q": "Qu'est-ce que le DAE peut faire automatiquement ?",
        "choices": [
          "Diagnostiquer toutes les maladies",
          "Analyser le rythme cardiaque et d?cider si un choc est n?cessaire",
          "Appeler les secours",
          "Administrer un m?dicament"
        ],
        "correct": 1,
        "explanation": "Le DAE analyse le rythme et d?cide seul si un choc ?lectrique est n?cessaire.",
        "img": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 6,
    "title": "Conduite & S?curit? 6",
    "icon": "fas fa-eye",
    "color": "#06b6d4",
    "description": "Visibilit?, voyants avanc?s, pneumatiques, secours routier",
    "questions": [
      {
        "q": "Pourquoi faut-il r?gler le si?ge conducteur avant de d?marrer ?",
        "choices": [
          "Confort",
          "Atteindre facilement les p?dales et bien voir la route",
          "Obligation l?gale",
          "Ne pas user le si?ge"
        ],
        "correct": 1,
        "explanation": "Bon r?glage = acc?s p?dales, bonne vision route et r?troviseurs.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment v?rifier que toutes les porti?res sont bien ferm?es ?",
        "choices": [
          "V?rifier le voyant",
          "Tirer chaque poign?e",
          "?couter un clic",
          "Les trois ? la fois"
        ],
        "correct": 3,
        "explanation": "Voyant du tableau de bord + tirer les poign?es + ?couter le clic.",
        "img": "assets/images/quiz/quiz-img-011.jpeg"
      },
      {
        "q": "Que faire si le voyant airbag reste allum? ?",
        "choices": [
          "Rien c'est normal",
          "Faire v?rifier par un professionnel rapidement",
          "D?brancher la batterie",
          "Retirer le fusible"
        ],
        "correct": 1,
        "explanation": "Voyant airbag allum? = dysfonctionnement. Consulter un garagiste.",
        "img": "assets/images/quiz/quiz-img-001.jpeg"
      },
      {
        "q": "Quelle est la fonction du pr?tensionneur de ceinture ?",
        "choices": [
          "D?tendre la ceinture",
          "R?tracter la ceinture au moment de l'impact",
          "Allumer le voyant",
          "Bloquer en freinage normal"
        ],
        "correct": 1,
        "explanation": "Le pr?tensionneur r?tracte la ceinture au moment du choc.",
        "img": "assets/images/quiz/quiz-img-002.jpeg"
      },
      {
        "q": "Lisez l'?tiquette de pression. Quelle pression pour v?hicule charg? ?",
        "choices": [
          "2,1 bars",
          "2,6 bars",
          "3,0 bars",
          "1,8 bars"
        ],
        "correct": 1,
        "explanation": "L'?tiquette indique 2,6 bars pour le v?hicule charg?.",
        "img": "assets/images/quiz/quiz-img-038.jpeg"
      },
      {
        "q": "Montrez le bouton de d?sembuage pare-brise avant.",
        "choices": [
          "Bouton ventilateur",
          "Bouton avec pare-brise et fl?ches ondul?es",
          "Bouton A/C",
          "Bouton recyclage"
        ],
        "correct": 1,
        "explanation": "Le bouton porte le symbole d'un pare-brise avec des fl?ches ondul?es.",
        "img": "assets/images/quiz/quiz-img-018.jpeg"
      },
      {
        "q": "Pour la visibilit? arri?re par pluie, quelle commande en plus de l'essuie-glace ?",
        "choices": [
          "Brouillard",
          "D?givrage/d?sembuage lunette arri?re",
          "Feux de recul",
          "Lave-glace avant"
        ],
        "correct": 1,
        "explanation": "Le d?sembuage arri?re ?limine la bu?e sur la lunette arri?re.",
        "img": "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel risque de m?langer deux types d'huile moteur ?",
        "choices": [
          "Aucun",
          "R?actions chimiques pouvant endommager le moteur",
          "Moteur tourne mieux",
          "Huile plus fluide"
        ],
        "correct": 1,
        "explanation": "M?langer des huiles incompatibles peut alt?rer leurs propri?t?s.",
        "img": "assets/images/quiz/quiz-img-029.jpeg"
      },
      {
        "q": "Que signifie le voyant TPMS (pneu avec point d'exclamation) ?",
        "choices": [
          "Pneus en bon ?tat",
          "Un ou plusieurs pneus ont une pression anormale",
          "Changer les pneus",
          "Frein ? main serr?"
        ],
        "correct": 1,
        "explanation": "Voyant TPMS = pression anormale. V?rifier imm?diatement.",
        "img": "assets/images/quiz/quiz-img-014.jpeg"
      },
      {
        "q": "O? ranger le gilet haute visibilit? ?",
        "choices": [
          "Dans le coffre",
          "? port?e de main dans l'habitacle (sous le si?ge ou porti?re)",
          "Sous le capot",
          "Dans la bo?te ? gants"
        ],
        "correct": 1,
        "explanation": "Le gilet doit ?tre accessible depuis l'habitacle pour l'enfiler avant de sortir.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment prot?ger la zone d'un accident ?",
        "choices": [
          "Klaxonner",
          "Baliser avec les warnings, le triangle et le gilet",
          "Rester dans la voiture",
          "Appeler la police d'abord"
        ],
        "correct": 1,
        "explanation": "Allumer les warnings, enfiler le gilet, poser le triangle ? 30m.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie PLS ?",
        "choices": [
          "Position Lat?rale Simple",
          "Position Lat?rale de S?curit?",
          "Premiers Lieux de Secours",
          "Protection Locale des Secours"
        ],
        "correct": 1,
        "explanation": "PLS = Position Lat?rale de S?curit? pour les victimes inconscientes qui respirent.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le rythme du massage cardiaque sur un adulte ?",
        "choices": [
          "50 compressions/min",
          "100 ? 120 compressions/min",
          "200 compressions/min",
          "30 compressions/min"
        ],
        "correct": 1,
        "explanation": "Le rythme est de 100 ? 120 compressions par minute.",
        "img": "https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=520&h=260&fit=crop"
      },
      {
        "q": "Faut-il retirer le casque d'un motard accident? ?",
        "choices": [
          "Toujours",
          "Non, sauf s'il ne respire pas et uniquement pour lib?rer les voies a?riennes",
          "Oui pour v?rifier son identit?",
          "Seulement si le casque est ab?m?"
        ],
        "correct": 1,
        "explanation": "Ne retirer le casque que si la victime ne respire pas, ? deux de pr?f?rence.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez l'emplacement de l'antenne sur ce v?hicule.",
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
        "q": "Comment reconna?t-on le voyant du feu de brouillard arri?re ?",
        "choices": [
          "Symbole vert",
          "Orange/ambre avec traits ondul?s",
          "Bleu",
          "Rouge"
        ],
        "correct": 1,
        "explanation": "Voyant feu brouillard arri?re = orange/ambre avec un phare et traits ondul?s.",
        "img": "assets/images/quiz/quiz-img-011.jpeg"
      },
      {
        "q": "Que faire si la batterie est d?charg?e moteur ?teint ?",
        "choices": [
          "Attendre",
          "Utiliser des c?bles de d?marrage ou appeler l'assistance",
          "Pousser le v?hicule",
          "Changer les bougies"
        ],
        "correct": 1,
        "explanation": "C?bles de d?marrage ou assistance routi?re.",
        "img": "assets/images/quiz/quiz-img-030.jpeg"
      },
      {
        "q": "Un DAE est-il utilisable par un non-professionnel ?",
        "choices": [
          "Non, r?serv? aux m?decins",
          "Oui, il guide l'utilisateur par des instructions vocales",
          "Uniquement par les pompiers",
          "Apr?s une formation obligatoire"
        ],
        "correct": 1,
        "explanation": "Le DAE est con?u pour ?tre utilis? par n'importe qui, il donne des instructions vocales.",
        "img": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=520&h=260&fit=crop"
      },
      {
        "q": "Pourquoi conna?tre la signification des voyants ?",
        "choices": [
          "Impressionner le moniteur",
          "R?agir correctement face ? une anomalie",
          "Pas important",
          "Passer le contr?le technique"
        ],
        "correct": 1,
        "explanation": "Conna?tre les voyants = r?agir vite : s'arr?ter si rouge, v?rifier si orange.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la conduite ? tenir face ? un bless? qui saigne abondamment ?",
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
    "title": "Conduite & S?curit? 7",
    "icon": "fas fa-road",
    "color": "#ec4899",
    "description": "Conduite de nuit, m?canique, pression, premiers secours avanc?s",
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
          "Nuit et quand visibilit? insuffisante (pluie, brouillard, tunnel)",
          "En agglom?ration",
          "Sur autoroute"
        ],
        "correct": 1,
        "explanation": "Feux de croisement : nuit et de jour si visibilit? r?duite.",
        "img": "assets/images/quiz/quiz-img-013.jpeg"
      },
      {
        "q": "Montrez le voyant de niveau de carburant. Quel risque si vide ?",
        "choices": [
          "Moteur tourne mieux",
          "D?samor?age du circuit et panne s?che",
          "Voyant reste ?teint",
          "Liquide frein baisse"
        ],
        "correct": 1,
        "explanation": "R?servoir vide = d?samor?age du circuit (surtout diesel) et panne s?che.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le r?le du catalyseur dans le syst?me d'?chappement ?",
        "choices": [
          "Augmenter la puissance",
          "R?duire les ?missions polluantes",
          "Diminuer le bruit",
          "Refroidir les gaz"
        ],
        "correct": 1,
        "explanation": "Le catalyseur transforme les gaz polluants en gaz moins nocifs.",
        "img": null
      },
      {
        "q": "Comment reconna?tre une fuite de liquide sous le v?hicule ?",
        "choices": [
          "En ?coutant",
          "En rep?rant des taches color?es sur le sol sous le v?hicule",
          "En v?rifiant le compteur",
          "En sentant l'habitacle"
        ],
        "correct": 1,
        "explanation": "Taches sous le v?hicule : rouge/rose = refroidissement, marron = huile, transparent = eau clim.",
        "img": null
      },
      {
        "q": "Quel est le risque de rouler avec un seul feu de croisement ?",
        "choices": [
          "Aucun risque",
          "?tre confondu avec un deux-roues et r?duire l'?clairage",
          "La batterie se d?charge",
          "Le moteur surchauffe"
        ],
        "correct": 1,
        "explanation": "Un seul feu = confusion avec un deux-roues et ?clairage insuffisant.",
        "img": "assets/images/quiz/quiz-img-035.jpeg"
      },
      {
        "q": "Que signifie le voyant de direction assist?e allum? ?",
        "choices": [
          "La direction est trop l?g?re",
          "Un dysfonctionnement de la direction assist?e",
          "Le volant est mal positionn?",
          "La vitesse est trop ?lev?e"
        ],
        "correct": 1,
        "explanation": "Voyant direction assist?e = dysfonctionnement. La direction devient plus dure.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment v?rifier le bon fonctionnement des feux stop ?",
        "choices": [
          "Les toucher",
          "Demander ? quelqu'un d'observer pendant qu'on appuie sur le frein",
          "V?rifier le voyant",
          "?couter un bruit"
        ],
        "correct": 1,
        "explanation": "Appuyer sur la p?dale de frein pendant qu'une personne v?rifie ? l'arri?re.",
        "img": "assets/images/quiz/quiz-img-041.jpeg"
      },
      {
        "q": "Comment r?agir si le voyant de pression d'huile s'allume en conduisant ?",
        "choices": [
          "Continuer",
          "S'arr?ter imm?diatement et v?rifier le niveau d'huile",
          "Acc?l?rer",
          "Couper la clim"
        ],
        "correct": 1,
        "explanation": "S'arr?ter imm?diatement. Rouler sans pression d'huile d?truit le moteur en minutes.",
        "img": "assets/images/quiz/quiz-img-014.jpeg"
      },
      {
        "q": "Quel document doit ?tre ? jour et pr?sent dans le v?hicule ?",
        "choices": [
          "Le livret de famille",
          "Le certificat d'immatriculation (carte grise)",
          "Le passeport",
          "Le carnet de sant?"
        ],
        "correct": 1,
        "explanation": "La carte grise doit ?tre ? jour et pr?sente lors de tout contr?le.",
        "img": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire en premier face ? un accident de la route ?",
        "choices": [
          "Filmer avec son t?l?phone",
          "Prot?ger, alerter, secourir (PAS)",
          "D?placer les victimes",
          "Chercher les papiers"
        ],
        "correct": 1,
        "explanation": "PAS : Prot?ger la zone, Alerter les secours, Secourir les victimes.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment prot?ger un accident sur autoroute ?",
        "choices": [
          "Rester sur la voie",
          "Se garer apr?s l'accident, allumer les warnings, enfiler le gilet, placer le triangle",
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
          "Sur le c?t?, bouche ouverte orient?e vers le sol, une jambe pli?e",
          "Assis",
          "Sur le ventre"
        ],
        "correct": 1,
        "explanation": "PLS : sur le c?t?, bouche ouverte vers le sol pour que les liquides s'?coulent.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire si une victime convulse ?",
        "choices": [
          "La maintenir fermement",
          "Prot?ger sa t?te, ne rien mettre dans sa bouche, attendre la fin de la crise",
          "Lui donner de l'eau",
          "La r?veiller"
        ],
        "correct": 1,
        "explanation": "Prot?ger la t?te, ne rien mettre dans la bouche, appeler les secours apr?s la crise.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment v?rifier que les clignotants fonctionnent ?",
        "choices": [
          "Les toucher",
          "Mettre le contact, actionner le clignotant et v?rifier visuellement",
          "?couter seulement",
          "V?rifier la batterie"
        ],
        "correct": 1,
        "explanation": "Mettre le contact, actionner chaque clignotant et v?rifier visuellement.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel pneu est le plus sollicit? en virage ? droite ?",
        "choices": [
          "Arri?re droit",
          "Avant gauche",
          "Arri?re gauche",
          "Avant droit"
        ],
        "correct": 1,
        "explanation": "En virage ? droite, le pneu avant gauche supporte le plus de charge (force centrifuge).",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Pourquoi faut-il permuter les pneus r?guli?rement ?",
        "choices": [
          "Pour le style",
          "Pour uniformiser l'usure entre l'avant et l'arri?re",
          "Pour consommer moins",
          "Ce n'est pas n?cessaire"
        ],
        "correct": 1,
        "explanation": "La permutation uniformise l'usure car les pneus avant s'usent plus vite.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Que peut causer un filtre ? air encrass? ?",
        "choices": [
          "Am?liore les performances",
          "Surconsommation et perte de puissance",
          "Les freins sont moins efficaces",
          "La direction est dure"
        ],
        "correct": 1,
        "explanation": "Un filtre ? air encrass? augmente la consommation et r?duit la puissance.",
        "img": null
      },
      {
        "q": "Qu'est-ce que le ? survirage ? ?",
        "choices": [
          "Le v?hicule tourne trop peu",
          "L'arri?re du v?hicule d?rape vers l'ext?rieur du virage",
          "Le volant vibre",
          "Le moteur acc?l?re seul"
        ],
        "correct": 1,
        "explanation": "Survirage : l'arri?re du v?hicule part vers l'ext?rieur du virage.",
        "img": null
      },
      {
        "q": "Que faire si une victime est coinc?e dans un v?hicule apr?s un accident ?",
        "choices": [
          "La tirer de force",
          "Ne pas la d?placer sauf danger vital imminent, couper le contact, alerter",
          "Casser la vitre",
          "Pousser le v?hicule"
        ],
        "correct": 1,
        "explanation": "Ne pas d?placer sauf danger vital. Couper le contact et alerter les secours.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 8,
    "title": "Conduite & S?curit? 8",
    "icon": "fas fa-tachometer-alt",
    "color": "#f97316",
    "description": "Tableau de bord, entretien courant, visibilit?, urgences",
    "questions": [
      {
        "q": "Que signifie le voyant du moteur (check engine) allum? en orange ?",
        "choices": [
          "Le moteur va casser",
          "Un d?faut moteur ou antipollution ? faire v?rifier",
          "Le r?servoir est plein",
          "La vidange est faite"
        ],
        "correct": 1,
        "explanation": "Voyant moteur orange = d?faut moteur/antipollution ? faire v?rifier rapidement.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la dur?e de vie moyenne d'une batterie de voiture ?",
        "choices": [
          "1 an",
          "4 ? 5 ans",
          "10 ans",
          "Illimit?e"
        ],
        "correct": 1,
        "explanation": "Une batterie dure en moyenne 4 ? 5 ans selon les conditions d'utilisation.",
        "img": "assets/images/quiz/quiz-img-030.jpeg"
      },
      {
        "q": "Montrez o? se branchent les c?bles de d?marrage sur la batterie.",
        "choices": [
          "N'importe o?",
          "Le + sur la borne +, le - sur la borne - ou sur une masse m?tallique",
          "Le - sur la borne +",
          "Uniquement sur le +"
        ],
        "correct": 1,
        "explanation": "Le c?ble rouge sur + des deux batteries, le noir sur - puis sur une masse m?tallique.",
        "img": "assets/images/quiz/quiz-img-030.jpeg"
      },
      {
        "q": "Quand utiliser la climatisation en hiver ?",
        "choices": [
          "Jamais",
          "Pour d?sembuer les vitres rapidement",
          "Uniquement en ?t?",
          "Quand il fait tr?s froid"
        ],
        "correct": 1,
        "explanation": "La climatisation ass?che l'air et aide ? d?sembuer rapidement les vitres.",
        "img": null
      },
      {
        "q": "Comment ajuster la hauteur des phares quand le v?hicule est charg? ?",
        "choices": [
          "Rien ? faire",
          "Utiliser la molette de r?glage pour abaisser les faisceaux",
          "Allumer les feux de route",
          "Mettre les warnings"
        ],
        "correct": 1,
        "explanation": "Utiliser la molette de r?glage de hauteur pour ne pas ?blouir les autres.",
        "img": "assets/images/quiz/quiz-img-035.jpeg"
      },
      {
        "q": "Quel est le risque d'un essuie-glace us? par forte pluie ?",
        "choices": [
          "Aucun",
          "Mauvaise visibilit? pouvant provoquer un accident",
          "Le moteur surchauffe",
          "La batterie se d?charge"
        ],
        "correct": 1,
        "explanation": "Essuie-glaces us?s = mauvaise visibilit?, tr?s dangereux par forte pluie.",
        "img": "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le voyant de porte ouverte avec un coffre ?",
        "choices": [
          "Le capot est ouvert",
          "Le coffre n'est pas correctement ferm?",
          "Le moteur est en panne",
          "Le r?servoir est ouvert"
        ],
        "correct": 1,
        "explanation": "Ce voyant indique que le coffre n'est pas ferm? correctement.",
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
        "explanation": "La jauge d'huile a souvent une poign?e jaune pour la rep?rer facilement.",
        "img": null
      },
      {
        "q": "Quelle est la principale cause d'accident mortel en France ?",
        "choices": [
          "Vitesse",
          "L'alcool au volant",
          "Pneus us?s",
          "M?t?o"
        ],
        "correct": 0,
        "explanation": "La vitesse excessive est la premi?re cause d'accident mortel en France.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le taux d'alcool maximal autoris? pour un conducteur novice ?",
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
        "q": "Que v?rifier sur les essuie-glaces r?guli?rement ?",
        "choices": [
          "La couleur",
          "L'?tat des balais (fissures, d?formations, traces)",
          "Le nombre de vitesses",
          "La marque"
        ],
        "correct": 1,
        "explanation": "V?rifier que les balais ne sont pas fissur?s, d?form?s ou laissent des traces.",
        "img": "assets/images/quiz/quiz-img-017.jpeg"
      },
      {
        "q": "Comment savoir de quel c?t? est la trappe ? carburant ?",
        "choices": [
          "Au hasard",
          "La petite fl?che ? c?t? du symbole de pompe sur la jauge",
          "En regardant le toit",
          "En lisant le manuel"
        ],
        "correct": 1,
        "explanation": "Une petite fl?che ? c?t? du symbole de pompe indique le c?t? de la trappe.",
        "img": "assets/images/quiz/quiz-img-046.jpeg"
      },
      {
        "q": "Que signifie l'allumage de tous les voyants au d?marrage ?",
        "choices": [
          "Une panne grave",
          "Un test automatique normal, ils doivent s'?teindre rapidement",
          "La batterie est faible",
          "Les fusibles sont grill?s"
        ],
        "correct": 1,
        "explanation": "Au d?marrage, tous les voyants s'allument pour un auto-test puis s'?teignent.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "? quoi sert le filtre d'habitacle ?",
        "choices": [
          "Filtrer l'huile",
          "Filtrer l'air entrant dans l'habitacle (poussi?res, pollen, odeurs)",
          "Refroidir le moteur",
          "Filtrer le carburant"
        ],
        "correct": 1,
        "explanation": "Le filtre d'habitacle purifie l'air entrant dans le v?hicule.",
        "img": null
      },
      {
        "q": "Comment r?agir face ? un accident avec une victime qui ne bouge plus ?",
        "choices": [
          "La d?placer",
          "V?rifier sa conscience, sa respiration, alerter et commencer les gestes de secours",
          "Lui donner de l'eau",
          "Attendre la police"
        ],
        "correct": 1,
        "explanation": "V?rifier conscience et respiration, alerter les secours, agir selon l'?tat.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Combien de temps peut-on maintenir un massage cardiaque ?",
        "choices": [
          "5 minutes",
          "Jusqu'? l'arriv?e des secours ou l'utilisation d'un DAE",
          "10 minutes",
          "30 secondes"
        ],
        "correct": 1,
        "explanation": "Le massage cardiaque se poursuit jusqu'? l'arriv?e des secours ou du DAE.",
        "img": "https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire si un enfant s'?touffe ?",
        "choices": [
          "Lui donner de l'eau",
          "5 tapes dans le dos entre les omoplates, puis 5 compressions abdominales",
          "Attendre que ?a passe",
          "Le mettre t?te en bas"
        ],
        "correct": 1,
        "explanation": "5 tapes dans le dos puis 5 compressions (Heimlich pour adulte/enfant).",
        "img": "https://images.unsplash.com/photo-1590362891818-a0a26e4ec3a6?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est l'angle mort d'un v?hicule ?",
        "choices": [
          "Zone derri?re le v?hicule",
          "Zone non visible dans les r?troviseurs, ? tourner la t?te pour v?rifier",
          "Zone devant le v?hicule",
          "Le toit du v?hicule"
        ],
        "correct": 1,
        "explanation": "L'angle mort est la zone non couverte par les r?troviseurs. Tourner la t?te pour v?rifier.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Pourquoi ne pas t?l?phoner au volant ?",
        "choices": [
          "?a use la batterie",
          "Cela d?tourne l'attention et multiplie le risque d'accident par 3",
          "Ce n'est pas interdit",
          "Le signal est mauvais"
        ],
        "correct": 1,
        "explanation": "T?l?phoner au volant multiplie le risque d'accident par 3 ? 5.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire si le volant vibre ? haute vitesse ?",
        "choices": [
          "Acc?l?rer",
          "Faire v?rifier l'?quilibrage des roues",
          "Freiner brusquement",
          "Tourner le volant"
        ],
        "correct": 1,
        "explanation": "Des vibrations au volant indiquent souvent un d?s?quilibrage des roues.",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 9,
    "title": "Conduite & S?curit? 9",
    "icon": "fas fa-gas-pump",
    "color": "#14b8a6",
    "description": "Carburant, ?co-conduite, signalisation, gestes d'urgence",
    "questions": [
      {
        "q": "Quel carburant utiliser pour ce v?hicule ?",
        "choices": [
          "Diesel",
          "Celui indiqu? sur la trappe ? carburant et dans le carnet d'entretien",
          "N'importe lequel",
          "Le moins cher"
        ],
        "correct": 1,
        "explanation": "Toujours utiliser le carburant indiqu? par le constructeur. Erreur = panne grave.",
        "img": null
      },
      {
        "q": "Que se passe-t-il si l'on met du diesel dans un moteur essence ?",
        "choices": [
          "Rien",
          "Le moteur peut ?tre gravement endommag?",
          "Le v?hicule roule mieux",
          "La consommation baisse"
        ],
        "correct": 1,
        "explanation": "Erreur de carburant = dommages importants au moteur. Ne pas d?marrer.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment adopter une ?co-conduite ?",
        "choices": [
          "Acc?l?rer fort",
          "Anticiper, rouler ? vitesse stable, r?trograder au lieu de freiner",
          "Rouler en roue libre",
          "Ne jamais utiliser la clim"
        ],
        "correct": 1,
        "explanation": "?co-conduite : anticiper, vitesse stable, utiliser le frein moteur.",
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
          "C?dez le passage",
          "Stop",
          "Priorit?"
        ],
        "correct": 1,
        "explanation": "Triangle rouge pointe en haut = c?dez le passage.",
        "img": "assets/images/quiz/quiz-img-048.jpeg"
      },
      {
        "q": "Quelle distance de s?curit? sur autoroute ? 130 km/h ?",
        "choices": [
          "50 m?tres",
          "Au moins 2 secondes soit environ 70 m?tres",
          "30 m?tres",
          "100 m?tres"
        ],
        "correct": 1,
        "explanation": "Distance de s?curit? = 2 secondes minimum, soit ~70m ? 130 km/h.",
        "img": "https://images.unsplash.com/photo-1545987796-200677ee1011?w=520&h=260&fit=crop"
      },
      {
        "q": "En cas de crevaison, o? s'arr?ter de pr?f?rence ?",
        "choices": [
          "Sur la voie de droite",
          "Sur une bande d'arr?t d'urgence ou un endroit plat et d?gag?",
          "Au milieu de la route",
          "Sur la voie de gauche"
        ],
        "correct": 1,
        "explanation": "Bande d'arr?t d'urgence ou endroit plat, d?gag? et en s?curit?.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Que contient la roue de secours (ou kit de gonflage) de ce v?hicule ?",
        "choices": [
          "Un pneu neuf",
          "Une bombe anti-crevaison ou une roue galette",
          "Un cric hydraulique",
          "Des c?bles"
        ],
        "correct": 1,
        "explanation": "Les v?hicules r?cents ont souvent un kit anti-crevaison ou une roue galette.",
        "img": "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le risque de rouler avec un pneu crev? ?",
        "choices": [
          "Aucun ? basse vitesse",
          "Dommage ? la jante et perte de contr?le du v?hicule",
          "Le moteur surchauffe",
          "La batterie se d?charge"
        ],
        "correct": 1,
        "explanation": "Pneu crev? = perte de contr?le et dommage irr?versible ? la jante.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Que v?rifier apr?s avoir chang? une roue ?",
        "choices": [
          "Rien",
          "Le serrage des ?crous apr?s 50-100 km",
          "La peinture",
          "Les essuie-glaces"
        ],
        "correct": 1,
        "explanation": "Resserrer les ?crous apr?s 50-100 km car ils peuvent se desserrer.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quand changer les balais d'essuie-glaces ?",
        "choices": [
          "Tous les mois",
          "Au moins une fois par an ou d?s qu'ils laissent des traces",
          "Tous les 5 ans",
          "Jamais"
        ],
        "correct": 1,
        "explanation": "Changer les balais au moins une fois par an ou d?s qu'ils sont inefficaces.",
        "img": "assets/images/quiz/quiz-img-017.jpeg"
      },
      {
        "q": "Comment savoir si les plaquettes de frein sont us?es ?",
        "choices": [
          "Voyant d'usure plaquettes ou bruit de grincement m?tallique",
          "En regardant les pneus",
          "En v?rifiant l'huile",
          "Par la couleur du liquide de frein"
        ],
        "correct": 0,
        "explanation": "Le voyant d'usure ou un bruit de grincement m?tallique signale l'usure.",
        "img": "assets/images/quiz/quiz-img-009.jpeg"
      },
      {
        "q": "Quelle est la bonne pratique pour freiner sur route mouill?e ?",
        "choices": [
          "Freiner fort d'un coup",
          "Anticiper, freiner progressivement et doucement",
          "Ne pas freiner",
          "Utiliser le frein ? main"
        ],
        "correct": 1,
        "explanation": "Sur route mouill?e, freiner progressivement pour ?viter le blocage des roues.",
        "img": "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment r?agir en cas d'aquaplaning ?",
        "choices": [
          "Acc?l?rer",
          "Ne pas freiner, rel?cher l'acc?l?rateur et maintenir le volant droit",
          "Tourner le volant",
          "Freiner fort"
        ],
        "correct": 1,
        "explanation": "Aquaplaning : ne pas freiner, rel?cher l'acc?l?rateur, volant droit.",
        "img": "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel geste faire si une personne s'?touffe et tousse encore ?",
        "choices": [
          "5 tapes dans le dos",
          "L'encourager ? continuer de tousser",
          "Heimlich imm?diat",
          "Lui donner de l'eau"
        ],
        "correct": 1,
        "explanation": "Si la personne tousse encore efficacement, l'encourager ? tousser pour expulser l'objet.",
        "img": null
      },
      {
        "q": "Comment positionner un bless? conscient qui saigne d'une jambe ?",
        "choices": [
          "Debout",
          "Allong?, jambe sur?lev?e si possible, comprimer la plaie",
          "Assis",
          "Sur le ventre"
        ],
        "correct": 1,
        "explanation": "Allonger la victime, sur?lever le membre si possible et comprimer la plaie.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le voyant d'anti-d?marrage. Que signifie-t-il ?",
        "choices": [
          "Le moteur est en marche",
          "La cl? n'est pas reconnue par le syst?me d'anti-d?marrage",
          "Les porti?res sont ferm?es",
          "La batterie est pleine"
        ],
        "correct": 1,
        "explanation": "Voyant anti-d?marrage = la cl? n'est pas reconnue. Le moteur ne d?marrera pas.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Qu'est-ce que le sous-virage ?",
        "choices": [
          "L'arri?re d?rape",
          "Le v?hicule tourne moins que voulu, l'avant part vers l'ext?rieur",
          "Le moteur cale",
          "Le volant vibre"
        ],
        "correct": 1,
        "explanation": "Sous-virage : l'avant du v?hicule d?rive vers l'ext?rieur du virage.",
        "img": null
      },
      {
        "q": "? quelle vitesse adapter sa conduite par temps de pluie ?",
        "choices": [
          "M?me vitesse",
          "R?duire d'au moins 20 km/h par rapport ? la limite",
          "Doubler la vitesse",
          "Rouler ? 30 km/h"
        ],
        "correct": 1,
        "explanation": "Par temps de pluie, r?duire la vitesse d'au moins 20 km/h.",
        "img": "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment savoir si le liquide de refroidissement est suffisant ?",
        "choices": [
          "Toucher le radiateur",
          "V?rifier le niveau entre MIN et MAX sur le vase d'expansion",
          "Go?ter le liquide",
          "?couter le moteur"
        ],
        "correct": 1,
        "explanation": "V?rifier visuellement le niveau entre les rep?res MIN et MAX sur le vase d'expansion.",
        "img": "assets/images/quiz/quiz-img-028.jpeg"
      }
    ]
  },
  {
    "id": 10,
    "title": "Conduite & S?curit? 10",
    "icon": "fas fa-user-shield",
    "color": "#6366f1",
    "description": "S?curit? routi?re, comportement, m?canique avanc?e, secourisme",
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
        "explanation": "Par temps de pluie, la vitesse maximale sur autoroute est r?duite ? 110 km/h.",
        "img": "https://images.unsplash.com/photo-1545987796-200677ee1011?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est l'effet de la fatigue sur la conduite ?",
        "choices": [
          "Am?liore les r?flexes",
          "Diminue la vigilance, allonge le temps de r?action",
          "Am?liore la vision",
          "Aucun effet"
        ],
        "correct": 1,
        "explanation": "La fatigue diminue la vigilance et allonge le temps de r?action.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "Tous les combien faire une pause sur autoroute ?",
        "choices": [
          "Toutes les 4 heures",
          "Toutes les 2 heures minimum",
          "Toutes les 30 minutes",
          "Pas de pause n?cessaire"
        ],
        "correct": 1,
        "explanation": "Pause toutes les 2 heures minimum pour lutter contre la fatigue.",
        "img": "https://images.unsplash.com/photo-1545987796-200677ee1011?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le panneau carr? bleu avec un P blanc ?",
        "choices": [
          "Passage pi?ton",
          "Zone de stationnement autoris?",
          "Poste de police",
          "Parking payant"
        ],
        "correct": 1,
        "explanation": "Carr? bleu avec P = zone de stationnement autoris?.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment r?agir si un t?moin d'accident arrive le premier ?",
        "choices": [
          "Fuir",
          "Prot?ger, alerter, secourir (PAS)",
          "D?placer les v?hicules",
          "Filmer la sc?ne"
        ],
        "correct": 1,
        "explanation": "PAS : Prot?ger, Alerter les secours (15/18/112), Secourir.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Que v?rifier r?guli?rement sur les feux du v?hicule ?",
        "choices": [
          "La couleur",
          "Que toutes les ampoules fonctionnent (avant, arri?re, stop, clignotants)",
          "Le voltage",
          "La marque"
        ],
        "correct": 1,
        "explanation": "V?rifier r?guli?rement toutes les ampoules : avant, arri?re, stop, clignotants.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la pression correcte pour ce v?hicule ? vide ?",
        "choices": [
          "1,8 bars",
          "2,1 bars ? l'avant et 2,1 bars ? l'arri?re",
          "3,0 bars",
          "1,5 bars"
        ],
        "correct": 1,
        "explanation": "L'?tiquette porti?re indique 2,1 bars avant et arri?re ? vide.",
        "img": null
      },
      {
        "q": "Pourquoi ne pas laisser tourner le moteur ? l'arr?t ?",
        "choices": [
          "Par obligation",
          "Pollution, surconsommation et risque d'intoxication au CO",
          "Le moteur s'ab?me",
          "La batterie se d?charge"
        ],
        "correct": 1,
        "explanation": "Moteur au ralenti = pollution, gaspillage et risque d'intoxication au CO en espace ferm?.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire si le voyant de liquide de frein s'allume ?",
        "choices": [
          "Continuer",
          "S'arr?ter et v?rifier le niveau, ne pas rouler si niveau trop bas",
          "Acc?l?rer",
          "Appuyer fort sur le frein"
        ],
        "correct": 1,
        "explanation": "S'arr?ter, v?rifier le niveau. Si trop bas, ne pas rouler : faire remorquer.",
        "img": "assets/images/quiz/quiz-img-027.jpeg"
      },
      {
        "q": "Qu'est-ce qu'un t?moin d'usure sur un disque de frein ?",
        "choices": [
          "Une marque rouge",
          "Une rainure qui ?met un sifflement quand le disque est us?",
          "Un voyant au tableau de bord",
          "Une vibration du volant"
        ],
        "correct": 0,
        "explanation": "Une rainure sur le disque ?met un bruit quand l'?paisseur minimale est atteinte.",
        "img": null
      },
      {
        "q": "Comment fonctionne le syst?me ABS en freinage d'urgence ?",
        "choices": [
          "Bloque les roues",
          "Emp?che le blocage des roues pour garder le contr?le directionnel",
          "Acc?l?re le v?hicule",
          "Coupe le moteur"
        ],
        "correct": 1,
        "explanation": "L'ABS emp?che le blocage des roues, permettant de garder le contr?le et d'?viter un obstacle.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Quand allumer les feux de position ?",
        "choices": [
          "La nuit en ville",
          "Au cr?puscule ou ? l'aube, quand la visibilit? diminue",
          "En plein jour",
          "Jamais seuls"
        ],
        "correct": 1,
        "explanation": "Feux de position : au cr?puscule/aube. La nuit, passer aux feux de croisement.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment v?rifier le niveau du liquide de direction assist?e ?",
        "choices": [
          "En tournant le volant",
          "V?rifier la jauge sur le bocal, ? froid, moteur ?teint",
          "En ?coutant",
          "Au contr?le technique"
        ],
        "correct": 1,
        "explanation": "V?rifier le niveau sur la jauge du bocal, moteur ?teint et ? froid.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le marquage 185/65 R15 sur un pneu ?",
        "choices": [
          "La marque du pneu",
          "Largeur 185mm, hauteur 65%, radial, diam?tre jante 15 pouces",
          "Le prix",
          "La date de fabrication"
        ],
        "correct": 1,
        "explanation": "185=largeur en mm, 65=rapport hauteur/largeur, R=radial, 15=diam?tre jante pouces.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Comment se comporter en zone 30 km/h ?",
        "choices": [
          "Rouler ? 50",
          "Rouler ? 30 km/h max, ?tre attentif aux pi?tons et v?los",
          "Klaxonner les pi?tons",
          "Se garer n'importe o?"
        ],
        "correct": 1,
        "explanation": "Zone 30 : vitesse max 30 km/h, priorit? aux pi?tons et cyclistes.",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire face ? une br?lure thermique ?",
        "choices": [
          "Mettre du beurre",
          "Refroidir sous l'eau froide pendant 10-15 minutes",
          "Percer les cloques",
          "Mettre un pansement sec"
        ],
        "correct": 1,
        "explanation": "Refroidir imm?diatement la br?lure sous l'eau froide pendant 10-15 minutes.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel num?ro appeler pour une urgence m?dicale ?",
        "choices": [
          "17",
          "15 (Samu)",
          "18",
          "112"
        ],
        "correct": 1,
        "explanation": "Le 15 est le num?ro du Samu pour les urgences m?dicales.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la r?action correcte face ? un malaise d'un passager ?",
        "choices": [
          "Continuer ? rouler",
          "S'arr?ter en s?curit?, demander ce qu'il ressent, appeler les secours si n?cessaire",
          "Acc?l?rer pour arriver vite",
          "Ouvrir les fen?tres uniquement"
        ],
        "correct": 1,
        "explanation": "S'arr?ter en s?curit?, ?valuer l'?tat du passager et appeler les secours si besoin.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Pourquoi le filtre ? particules est-il important ?",
        "choices": [
          "Pour le confort",
          "Il r?duit les ?missions de particules fines polluantes",
          "Pour le bruit",
          "Pour la puissance"
        ],
        "correct": 1,
        "explanation": "Le filtre ? particules capture les particules fines ?mises par le moteur.",
        "img": null
      },
      {
        "q": "Comment se positionner sur la route pour tourner ? gauche ?",
        "choices": [
          "? droite",
          "Se d?porter vers le milieu de la chauss?e, pr?s de la ligne m?diane",
          "Rester au centre",
          "Sur le trottoir"
        ],
        "correct": 1,
        "explanation": "Pour tourner ? gauche, se positionner pr?s de la ligne m?diane ou au centre de la voie.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 11,
    "title": "Conduite & S?curit? 11",
    "icon": "fas fa-wrench",
    "color": "#d946ef",
    "description": "Entretien approfondi, signalisation, comportement, secourisme",
    "questions": [
      {
        "q": "? quoi sert la courroie de distribution ?",
        "choices": [
          "Charger la batterie",
          "Synchroniser les mouvements du moteur (pistons et soupapes)",
          "Entra?ner les essuie-glaces",
          "Refroidir le moteur"
        ],
        "correct": 1,
        "explanation": "La courroie de distribution synchronise les pi?ces mobiles du moteur.",
        "img": null
      },
      {
        "q": "Quel risque en cas de rupture de la courroie de distribution ?",
        "choices": [
          "Aucun",
          "Casse moteur compl?te",
          "Panne de batterie",
          "Fuite de liquide"
        ],
        "correct": 1,
        "explanation": "La rupture de la courroie provoque une casse moteur tr?s co?teuse.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la signification d'un panneau rond ? fond blanc avec bordure rouge ?",
        "choices": [
          "Obligation",
          "Interdiction",
          "Indication",
          "Danger"
        ],
        "correct": 1,
        "explanation": "Rond blanc bord? de rouge = panneau d'interdiction.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie un panneau rond ? fond bleu ?",
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
        "q": "Comment r?agir face ? un pi?ton qui s'engage sur un passage prot?g? ?",
        "choices": [
          "Klaxonner",
          "S'arr?ter et lui c?der le passage",
          "Acc?l?rer pour passer avant",
          "Contourner par la gauche"
        ],
        "correct": 1,
        "explanation": "Le pi?ton engag? sur un passage a toujours la priorit?. S'arr?ter.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel ?quipement est obligatoire pour les cyclistes de nuit ?",
        "choices": [
          "Casque uniquement",
          "?clairage avant blanc, arri?re rouge et gilet r?tro-r?fl?chissant hors agglo",
          "Klaxon",
          "R?troviseur"
        ],
        "correct": 1,
        "explanation": "?clairage avant/arri?re obligatoire + gilet r?tro-r?fl?chissant hors agglom?ration.",
        "img": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment r?agir si un voyant rouge s'allume en conduisant ?",
        "choices": [
          "Ignorer",
          "S'arr?ter d?s que possible en toute s?curit?",
          "Acc?l?rer",
          "?teindre le voyant"
        ],
        "correct": 1,
        "explanation": "Voyant rouge = danger. S'arr?ter en s?curit? et identifier le probl?me.",
        "img": "assets/images/quiz/quiz-img-012.jpeg"
      },
      {
        "q": "Montrez le r?servoir de lave-glace. Quel est le risque s'il est vide ?",
        "choices": [
          "Aucun",
          "Mauvaise visibilit? si le pare-brise est sali",
          "Panne moteur",
          "Surchauffe"
        ],
        "correct": 1,
        "explanation": "Sans lave-glace, le pare-brise reste sale, r?duisant dangereusement la visibilit?.",
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
        "explanation": "Le liquide de frein absorbe l'humidit?. Le changer tous les 2 ans.",
        "img": "assets/images/quiz/quiz-img-027.jpeg"
      },
      {
        "q": "Quel est l'int?r?t d'un contr?le technique r?gulier ?",
        "choices": [
          "Obligation uniquement",
          "V?rifier la s?curit? du v?hicule et r?duire la pollution",
          "Augmenter la valeur",
          "Changer de couleur"
        ],
        "correct": 1,
        "explanation": "Le contr?le technique v?rifie les points de s?curit? et les ?missions polluantes.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment reconna?tre un panneau de priorit? ? droite ?",
        "choices": [
          "Triangle",
          "Losange jaune avec bordure blanche",
          "Carr? bleu",
          "Rond rouge"
        ],
        "correct": 1,
        "explanation": "Le losange jaune bord? de blanc indique que vous ?tes sur une route prioritaire.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire en cas de panne sur une voie rapide ?",
        "choices": [
          "Rester dans la voiture",
          "Se garer ? droite, warnings, gilet, sortir c?t? droit, aller derri?re la glissi?re",
          "Marcher sur la chauss?e",
          "Appeler depuis la route"
        ],
        "correct": 1,
        "explanation": "Se garer ? droite, warnings, gilet AVANT de sortir, se mettre en s?curit? derri?re la glissi?re.",
        "img": "https://images.unsplash.com/photo-1545987796-200677ee1011?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle distance de s?curit? en agglom?ration ? 50 km/h ?",
        "choices": [
          "5 m?tres",
          "Au moins 2 secondes soit environ 28 m?tres",
          "50 m?tres",
          "1 seconde"
        ],
        "correct": 1,
        "explanation": "Distance de s?curit? = 2 secondes minimum, soit ~28m ? 50 km/h.",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      },
      {
        "q": "Peut-on utiliser des pneus hiver toute l'ann?e ?",
        "choices": [
          "Oui sans probl?me",
          "Oui mais ils s'usent plus vite sur route s?che et chaude",
          "Non c'est interdit",
          "Seulement en montagne"
        ],
        "correct": 1,
        "explanation": "Possible mais les pneus hiver s'usent plus vite par temps chaud et sont moins performants.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Que faire face ? une victime qui fait un malaise cardiaque ?",
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
        "q": "Comment reconna?tre un AVC (Accident Vasculaire C?r?bral) ?",
        "choices": [
          "Douleur au bras",
          "Paralysie faciale, difficult? ? parler, faiblesse d'un c?t?",
          "Maux de ventre",
          "Toux s?che"
        ],
        "correct": 1,
        "explanation": "FAST : Face (paralysie), Arms (bras faible), Speech (trouble parole), Time (appeler vite).",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le sigle ESP ?",
        "choices": [
          "Extra Speed Power",
          "Electronic Stability Program (contr?le de stabilit?)",
          "Emergency Signal Protocol",
          "Electric Steering Power"
        ],
        "correct": 1,
        "explanation": "ESP = Electronic Stability Program, aide ? maintenir la trajectoire en virage.",
        "img": null
      },
      {
        "q": "Comment fonctionne l'aide au d?marrage en c?te ?",
        "choices": [
          "Acc?l?re automatiquement",
          "Maintient les freins bri?vement pour ?viter le recul au d?marrage",
          "Bloque le volant",
          "Active le frein ? main"
        ],
        "correct": 1,
        "explanation": "L'aide au d?marrage en c?te maintient le freinage 2-3 secondes pour ?viter le recul.",
        "img": null
      },
      {
        "q": "Pourquoi v?rifier la date de fabrication des pneus ?",
        "choices": [
          "Pour la garantie",
          "Les pneus vieillissent m?me sans rouler, les changer apr?s 5-6 ans",
          "Par curiosit?",
          "Pour le style"
        ],
        "correct": 1,
        "explanation": "Le caoutchouc vieillit. Changer les pneus apr?s 5-6 ans m?me s'ils semblent bons.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Que signifie le marquage DOT sur un pneu ?",
        "choices": [
          "Le fabricant",
          "La date de fabrication (semaine et ann?e) sur 4 chiffres",
          "Le prix",
          "La taille"
        ],
        "correct": 1,
        "explanation": "DOT suivi de 4 chiffres : les 2 premiers = semaine, les 2 derniers = ann?e de fabrication.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      }
    ]
  },
  {
    "id": 12,
    "title": "Conduite & S?curit? 12",
    "icon": "fas fa-cloud-sun-rain",
    "color": "#0ea5e9",
    "description": "Conditions m?t?o, angles morts, stationnement, urgences",
    "questions": [
      {
        "q": "Quelle distance de freinage sur route mouill?e par rapport ? route s?che ?",
        "choices": [
          "Identique",
          "Environ le double",
          "La moiti?",
          "Triple"
        ],
        "correct": 1,
        "explanation": "La distance de freinage est environ doubl?e sur route mouill?e.",
        "img": "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment r?agir en cas de brouillard dense ?",
        "choices": [
          "Allumer les feux de route",
          "Allumer les feux de brouillard, r?duire la vitesse, augmenter les distances",
          "Continuer normalement",
          "S'arr?ter sur la chauss?e"
        ],
        "correct": 1,
        "explanation": "Feux de brouillard, vitesse r?duite et distances de s?curit? augment?es.",
        "img": "assets/images/quiz/quiz-img-011.jpeg"
      },
      {
        "q": "Que signifie un feu clignotant orange ? une intersection ?",
        "choices": [
          "Passage libre",
          "Ralentir et c?der le passage",
          "S'arr?ter",
          "Acc?l?rer"
        ],
        "correct": 1,
        "explanation": "Feu clignotant orange = ralentir, c?der le passage, prudence.",
        "img": null
      },
      {
        "q": "Quel est le danger principal des angles morts en ville ?",
        "choices": [
          "Aucun",
          "Ne pas voir un pi?ton, cycliste ou deux-roues",
          "Le moteur surchauffe",
          "La batterie se d?charge"
        ],
        "correct": 1,
        "explanation": "Les angles morts cachent des usagers vuln?rables (pi?tons, v?los, motos).",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment v?rifier l'angle mort avant de changer de voie ?",
        "choices": [
          "Seulement les r?troviseurs",
          "R?troviseurs + tourner bri?vement la t?te du c?t? concern?",
          "Klaxonner",
          "Mettre le clignotant suffit"
        ],
        "correct": 1,
        "explanation": "R?troviseurs + contr?le visuel rapide en tournant la t?te.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la r?gle de stationnement en sens unique ?",
        "choices": [
          "Toujours ? droite",
          "Des deux c?t?s, sauf indication contraire",
          "Uniquement ? gauche",
          "Au milieu"
        ],
        "correct": 1,
        "explanation": "En sens unique, on peut stationner des deux c?t?s sauf signalisation contraire.",
        "img": "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment se garer en cr?neau ?",
        "choices": [
          "En fon?ant tout droit",
          "Se positionner parall?lement, braquer ? fond en reculant, contrebraquer",
          "Monter sur le trottoir",
          "Se garer en diagonale"
        ],
        "correct": 1,
        "explanation": "Cr?neau : se positionner, braquer en reculant, contrebraquer pour aligner.",
        "img": null
      },
      {
        "q": "Montrez le frein de stationnement. Comment l'activer ?",
        "choices": [
          "Appuyer sur l'acc?l?rateur",
          "Tirer le levier ou activer le bouton de frein ?lectrique",
          "Tourner la cl?",
          "Appuyer sur le frein"
        ],
        "correct": 1,
        "explanation": "Le frein de stationnement s'active en tirant le levier ou en appuyant sur le bouton.",
        "img": "assets/images/quiz/quiz-img-009.jpeg"
      },
      {
        "q": "Pourquoi ne pas stationner pr?s d'un virage ?",
        "choices": [
          "Par habitude",
          "Le v?hicule n'est pas visible pour les autres usagers qui arrivent",
          "La pente",
          "Le vent"
        ],
        "correct": 1,
        "explanation": "Un v?hicule stationn? en virage n'est pas visible, cr?ant un danger pour les autres.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment ?viter l'?blouissement par le soleil bas ?",
        "choices": [
          "Fermer les yeux",
          "Utiliser le pare-soleil, porter des lunettes de soleil, r?duire la vitesse",
          "Allumer les feux de route",
          "Acc?l?rer"
        ],
        "correct": 1,
        "explanation": "Pare-soleil, lunettes de soleil et vitesse r?duite en cas de soleil bas.",
        "img": null
      },
      {
        "q": "Que faire sur route verglac?e ?",
        "choices": [
          "Freiner fort",
          "R?duire la vitesse, pas de geste brusque, augmenter les distances",
          "Acc?l?rer",
          "Rouler en roue libre"
        ],
        "correct": 1,
        "explanation": "Verglas : vitesse tr?s r?duite, gestes doux, grandes distances.",
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
        "q": "Quel v?hicule est prioritaire avec un gyrophare bleu et une sir?ne ?",
        "choices": [
          "Aucun",
          "V?hicule de secours en intervention (ambulance, pompiers, police)",
          "Taxi",
          "Bus"
        ],
        "correct": 1,
        "explanation": "Gyrophare bleu + sir?ne = v?hicule prioritaire en intervention.",
        "img": "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment r?agir face ? un v?hicule de secours ?",
        "choices": [
          "Ignorer",
          "Se ranger ? droite et s'arr?ter si n?cessaire pour le laisser passer",
          "Acc?l?rer",
          "Klaxonner"
        ],
        "correct": 1,
        "explanation": "Se ranger ? droite et s'arr?ter si n?cessaire. Ne jamais bloquer le passage.",
        "img": "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie une ligne continue blanche ?",
        "choices": [
          "Interdiction de stationner",
          "Interdiction de franchir ou chevaucher la ligne",
          "Voie r?serv?e",
          "Obligation de tourner"
        ],
        "correct": 1,
        "explanation": "Ligne continue = interdiction de la franchir ou la chevaucher.",
        "img": null
      },
      {
        "q": "Comment r?agir si un passager fait une crise d'?pilepsie en voiture ?",
        "choices": [
          "Continuer",
          "S'arr?ter en s?curit?, prot?ger la t?te, ne rien mettre dans la bouche",
          "Donner de l'eau",
          "Le secouer"
        ],
        "correct": 1,
        "explanation": "S'arr?ter, prot?ger la t?te du passager, ne rien mettre dans la bouche.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la sanction pour non-port de ceinture ?",
        "choices": [
          "Avertissement",
          "Amende de 135? et retrait de 3 points",
          "Amende de 35?",
          "Aucune sanction"
        ],
        "correct": 1,
        "explanation": "Non-port de ceinture = amende de 135? et retrait de 3 points.",
        "img": "assets/images/quiz/quiz-img-002.jpeg"
      },
      {
        "q": "Montrez le voyant de temp?rature. Quand s'allume-t-il en bleu ?",
        "choices": [
          "En surchauffe",
          "Quand le moteur est froid et n'a pas atteint sa temp?rature de fonctionnement",
          "Quand le feu bleu est allum?",
          "Quand la clim est en marche"
        ],
        "correct": 1,
        "explanation": "Voyant bleu = moteur froid. Il s'?teint quand le moteur atteint sa temp?rature.",
        "img": "assets/images/quiz/quiz-img-010.jpeg"
      },
      {
        "q": "Que faire si le v?hicule tombe en panne de nuit sur une route sans ?clairage ?",
        "choices": [
          "Rester dans le noir",
          "Allumer les warnings, enfiler le gilet, utiliser une lampe, poser le triangle",
          "Utiliser les feux de route",
          "Allumer les phares"
        ],
        "correct": 1,
        "explanation": "Warnings, gilet haute visibilit?, lampe pour ?tre visible et triangle.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment r?agir si un b?b? s'?touffe ?",
        "choices": [
          "Heimlich classique",
          "5 tapes dans le dos sur l'avant-bras, puis 5 compressions thoraciques",
          "Lui donner de l'eau",
          "Le retourner t?te en bas"
        ],
        "correct": 1,
        "explanation": "B?b? : 5 tapes dans le dos, puis 5 compressions thoraciques (pas Heimlich).",
        "img": null
      }
    ]
  },
  {
    "id": 13,
    "title": "Conduite & S?curit? 13",
    "icon": "fas fa-map-signs",
    "color": "#84cc16",
    "description": "Signalisation avanc?e, rond-point, autoroute, m?canique",
    "questions": [
      {
        "q": "Qui est prioritaire dans un rond-point ?",
        "choices": [
          "Ceux qui entrent",
          "Ceux qui sont d?j? engag?s dans le rond-point",
          "Les v?hicules venant de droite",
          "Personne"
        ],
        "correct": 1,
        "explanation": "Dans un rond-point, les v?hicules d?j? engag?s sont prioritaires.",
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
        "q": "Que signifie un panneau carr? bleu avec une fl?che blanche ?",
        "choices": [
          "Sens interdit",
          "Sens obligatoire",
          "Interdiction de tourner",
          "Passage pi?ton"
        ],
        "correct": 1,
        "explanation": "Carr? bleu avec fl?che blanche = sens obligatoire dans la direction indiqu?e.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle vitesse maximale sur route nationale hors agglom?ration ?",
        "choices": [
          "90 km/h",
          "80 km/h",
          "110 km/h",
          "70 km/h"
        ],
        "correct": 1,
        "explanation": "80 km/h sur route nationale ? double sens depuis juillet 2018.",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment utiliser les voies d'insertion sur autoroute ?",
        "choices": [
          "S'arr?ter et attendre",
          "Acc?l?rer dans la voie d'acc?l?ration pour atteindre la vitesse du flux",
          "Entrer lentement",
          "Klaxonner"
        ],
        "correct": 1,
        "explanation": "Utiliser la voie d'acc?l?ration pour adapter sa vitesse au flux autoroutier.",
        "img": "https://images.unsplash.com/photo-1545987796-200677ee1011?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le panneau avec un trait rouge sur un fond blanc ?",
        "choices": [
          "Fin d'interdiction",
          "Fin de toutes les interdictions pr?c?demment signal?es",
          "D?but de zone",
          "Sens interdit"
        ],
        "correct": 1,
        "explanation": "Panneau rond blanc avec barre oblique = fin de toutes les interdictions.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez la commande de recyclage d'air. Pourquoi ne pas l'utiliser en continu ?",
        "choices": [
          "?a use le moteur",
          "Risque de bu?e et d'air vici? dans l'habitacle",
          "Surconsommation",
          "Panne de clim"
        ],
        "correct": 1,
        "explanation": "Recyclage continu = bu?e et air vici?. Utiliser temporairement.",
        "img": "assets/images/quiz/quiz-img-022.jpeg"
      },
      {
        "q": "Comment r?agir si le voyant d'huile clignote ?",
        "choices": [
          "Continuer",
          "V?rifier le niveau d'huile d?s que possible",
          "Acc?l?rer",
          "Ignorer"
        ],
        "correct": 1,
        "explanation": "Voyant huile clignotant = niveau bas. V?rifier et compl?ter si n?cessaire.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le r?le du liquide de direction assist?e ?",
        "choices": [
          "Refroidir le moteur",
          "Transmettre la pression pour faciliter le braquage du volant",
          "Nettoyer le pare-brise",
          "Freiner"
        ],
        "correct": 1,
        "explanation": "Le liquide hydraulique de direction assist?e facilite le braquage.",
        "img": null
      },
      {
        "q": "Pourquoi les pneus hiver sont-ils plus efficaces par temps froid ?",
        "choices": [
          "Ils sont plus gonfl?s",
          "Leur gomme reste souple en dessous de 7?C",
          "Ils ont plus de pression",
          "Ils sont plus grands"
        ],
        "correct": 1,
        "explanation": "La gomme des pneus hiver reste souple sous 7?C, assurant une meilleure adh?rence.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Comment actionner le lave-glace arri?re sur ce v?hicule ?",
        "choices": [
          "Commodo gauche",
          "En poussant le commodo d'essuie-glace vers l'avant",
          "Bouton au tableau de bord",
          "Sur le volant"
        ],
        "correct": 1,
        "explanation": "Le lave-glace arri?re s'actionne en poussant le commodo vers l'avant.",
        "img": "assets/images/quiz/quiz-img-025.jpeg"
      },
      {
        "q": "Que signifie un panneau triangulaire avec des vagues ?",
        "choices": [
          "Rivi?re",
          "Risque de vent lat?ral",
          "Risque d'inondation",
          "Zone de surf"
        ],
        "correct": 1,
        "explanation": "Triangle avec vagues = risque de vent lat?ral.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment positionner le triangle en virage ?",
        "choices": [
          "Dans le virage",
          "Avant le virage pour ?tre visible des v?hicules qui arrivent",
          "Apr?s le virage",
          "Au sommet du virage"
        ],
        "correct": 1,
        "explanation": "Le triangle doit ?tre visible en amont : le placer avant le virage.",
        "img": "assets/images/quiz/quiz-img-048.jpeg"
      },
      {
        "q": "Quelle est la signification d'une double ligne continue ?",
        "choices": [
          "Voie rapide",
          "Interdiction absolue de d?passer",
          "Zone de stationnement",
          "Voie de bus"
        ],
        "correct": 1,
        "explanation": "Double ligne continue = interdiction absolue de franchir.",
        "img": null
      },
      {
        "q": "Comment v?rifier l'?clairage avant du v?hicule ?",
        "choices": [
          "En conduisant",
          "Se placer devant un mur, allumer les feux et v?rifier",
          "En ?coutant",
          "Au contr?le technique"
        ],
        "correct": 1,
        "explanation": "Se placer face ? un mur, allumer les feux et v?rifier leur fonctionnement.",
        "img": "assets/images/quiz/quiz-img-035.jpeg"
      },
      {
        "q": "Quel geste face ? une victime qui ne respire plus ?",
        "choices": [
          "La mettre en PLS",
          "Commencer le massage cardiaque imm?diatement",
          "Lui donner de l'eau",
          "La secouer"
        ],
        "correct": 1,
        "explanation": "Pas de respiration = commencer le massage cardiaque et appeler les secours.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Que v?rifier sur un DAE avant utilisation ?",
        "choices": [
          "La date de fabrication",
          "Que la poitrine de la victime est s?che, que personne ne touche la victime",
          "Le voltage",
          "La marque"
        ],
        "correct": 1,
        "explanation": "Poitrine s?che, pas de bijou m?tallique, personne ne touche la victime pendant le choc.",
        "img": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment nettoyer les phares pour maintenir une bonne visibilit? ?",
        "choices": [
          "Avec de l'huile",
          "Avec un chiffon humide et du produit nettoyant",
          "Avec du sable",
          "Avec le lave-glace"
        ],
        "correct": 1,
        "explanation": "Un chiffon humide et du produit nettoyant. Les phares sales r?duisent l'?clairage de 30%.",
        "img": "assets/images/quiz/quiz-img-035.jpeg"
      },
      {
        "q": "Que faire face ? un animal sur la route ?",
        "choices": [
          "Acc?l?rer",
          "Freiner progressivement si possible, ne pas donner de coup de volant brusque",
          "Klaxonner fort",
          "Foncer dessus"
        ],
        "correct": 1,
        "explanation": "Freiner progressivement, ne pas faire d'?cart brusque qui pourrait causer un accident.",
        "img": "https://images.unsplash.com/photo-1484406566174-9da645c1d1e2?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la distance d'arr?t ? 50 km/h sur route s?che ?",
        "choices": [
          "10 m?tres",
          "Environ 25-28 m?tres",
          "50 m?tres",
          "5 m?tres"
        ],
        "correct": 1,
        "explanation": "Distance d'arr?t ? 50 km/h ? 25-28m (temps de r?action + freinage).",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 14,
    "title": "Conduite & S?curit? 14",
    "icon": "fas fa-traffic-light",
    "color": "#f43f5e",
    "description": "Feux tricolores, d?passement, ceinture, m?canique fine",
    "questions": [
      {
        "q": "Que signifie un feu rouge ?",
        "choices": [
          "Ralentir",
          "Arr?t obligatoire",
          "Passage prioritaire",
          "Attention"
        ],
        "correct": 0,
        "explanation": "Feu rouge = arr?t obligatoire ? la ligne d'effet.",
        "img": null
      },
      {
        "q": "Que signifie un feu orange fixe ?",
        "choices": [
          "Acc?l?rer pour passer",
          "S'arr?ter si possible sans danger",
          "Priorit?",
          "Prudence"
        ],
        "correct": 1,
        "explanation": "Feu orange fixe = s'arr?ter si possible sans danger.",
        "img": null
      },
      {
        "q": "Peut-on d?passer par la droite ?",
        "choices": [
          "Oui toujours",
          "Non, sauf si le v?hicule devant tourne ? gauche ou en file",
          "Oui sur autoroute",
          "Non jamais"
        ],
        "correct": 1,
        "explanation": "D?passement par la droite interdit sauf si le v?hicule devant tourne ? gauche.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle distance respecter pour doubler un cycliste hors agglo ?",
        "choices": [
          "0,5 m?tre",
          "1,5 m?tre minimum",
          "1 m?tre",
          "2 m?tres"
        ],
        "correct": 1,
        "explanation": "Hors agglom?ration : 1,5 m?tre minimum pour doubler un cycliste.",
        "img": "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle distance pour doubler un cycliste en ville ?",
        "choices": [
          "0,5 m?tre",
          "1 m?tre minimum",
          "1,5 m?tre",
          "2 m?tres"
        ],
        "correct": 1,
        "explanation": "En agglom?ration : 1 m?tre minimum pour doubler un cycliste.",
        "img": "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez comment r?gler l'appui-t?te. ? quelle hauteur ?",
        "choices": [
          "?paules",
          "Sommet de la t?te ou des yeux",
          "Cou",
          "Peu importe"
        ],
        "correct": 1,
        "explanation": "L'appui-t?te doit ?tre ? hauteur du sommet de la t?te ou des yeux minimum.",
        "img": "assets/images/quiz/quiz-img-003.jpeg"
      },
      {
        "q": "Montrez le bocal de liquide de frein. Comment v?rifier ?",
        "choices": [
          "Appuyer sur la p?dale",
          "Regarder le niveau entre MIN et MAX sur le bocal",
          "?couter les freins",
          "V?rifier les plaquettes"
        ],
        "correct": 1,
        "explanation": "Le bocal transparent a des rep?res MIN et MAX visibles.",
        "img": "assets/images/quiz/quiz-img-027.jpeg"
      },
      {
        "q": "? quoi sert la ceinture de s?curit? en cas de retournement ?",
        "choices": [
          "Rien",
          "Maintenir les occupants dans leur si?ge et ?viter l'?jection",
          "Activer l'airbag",
          "Bloquer le volant"
        ],
        "correct": 1,
        "explanation": "La ceinture maintient les occupants et ?vite l'?jection en cas de tonneau.",
        "img": "assets/images/quiz/quiz-img-002.jpeg"
      },
      {
        "q": "Quel est le temps de r?action moyen d'un conducteur ?",
        "choices": [
          "0,5 seconde",
          "1 ? 2 secondes",
          "5 secondes",
          "Instantan?"
        ],
        "correct": 1,
        "explanation": "Le temps de r?action moyen est d'environ 1 ? 2 secondes.",
        "img": null
      },
      {
        "q": "Comment adapter sa vitesse en descente ?",
        "choices": [
          "Acc?l?rer",
          "R?trograder pour utiliser le frein moteur avant la descente",
          "Mettre au point mort",
          "Utiliser uniquement le frein"
        ],
        "correct": 1,
        "explanation": "R?trograder avant la descente pour utiliser le frein moteur.",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le panneau triangulaire avec un virage ?",
        "choices": [
          "Virage interdit",
          "Attention virage dangereux",
          "Sens unique",
          "D?viation"
        ],
        "correct": 1,
        "explanation": "Triangle avec virage = danger, virage dangereux ? venir.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le bouchon du liquide de refroidissement.",
        "choices": [
          "Le bleu",
          "Celui avec un pictogramme d'avertissement (ne pas ouvrir ? chaud)",
          "Le jaune",
          "Le noir"
        ],
        "correct": 1,
        "explanation": "Le bouchon de refroidissement porte un pictogramme d'avertissement.",
        "img": "assets/images/quiz/quiz-img-028.jpeg"
      },
      {
        "q": "Comment v?rifier l'?tat de la courroie d'accessoire ?",
        "choices": [
          "En la touchant",
          "Visuellement : fissures, effilochage, tension correcte",
          "En l'?coutant uniquement",
          "Au contr?le technique"
        ],
        "correct": 1,
        "explanation": "V?rifier visuellement : fissures, effilochage et tension de la courroie.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire si les essuie-glaces ne fonctionnent plus sous la pluie ?",
        "choices": [
          "Continuer",
          "S'arr?ter en s?curit?, allumer les warnings",
          "Acc?l?rer",
          "Sortir la t?te"
        ],
        "correct": 1,
        "explanation": "S'arr?ter en s?curit? car la visibilit? est nulle.",
        "img": "assets/images/quiz/quiz-img-017.jpeg"
      },
      {
        "q": "Montrez le d?givrage lunette arri?re. Comment l'activer ?",
        "choices": [
          "Commodo gauche",
          "Bouton sur le panneau central de climatisation",
          "Sur le volant",
          "Sur la porti?re"
        ],
        "correct": 1,
        "explanation": "Le d?givrage arri?re s'active via le bouton sur le panneau central.",
        "img": "assets/images/quiz/quiz-img-006.jpeg"
      },
      {
        "q": "Que faire si le volant tire d'un c?t? ?",
        "choices": [
          "Normal",
          "Faire v?rifier le parall?lisme et la pression des pneus",
          "Tourner dans l'autre sens",
          "Acc?l?rer"
        ],
        "correct": 1,
        "explanation": "Un v?hicule qui tire peut indiquer un probl?me de parall?lisme ou pression in?gale.",
        "img": null
      },
      {
        "q": "Que signifie le mot ? aquaplaning ? ?",
        "choices": [
          "Freinage sur l'eau",
          "Le pneu perd le contact avec la route ? cause d'un film d'eau",
          "Conduite sous la pluie",
          "Nettoyage du pare-brise"
        ],
        "correct": 1,
        "explanation": "Aquaplaning : le pneu glisse sur un film d'eau, perte totale d'adh?rence.",
        "img": "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=520&h=260&fit=crop"
      },
      {
        "q": "Quels sont les 3 comportements ? risque au volant ?",
        "choices": [
          "Musique forte, passagers, pluie",
          "Alcool, vitesse excessive et t?l?phone au volant",
          "Fatigue, pneus neufs, phares",
          "Nuit, autoroute, diesel"
        ],
        "correct": 1,
        "explanation": "Alcool, vitesse excessive et t?l?phone au volant sont les principales causes d'accidents.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire si une victime saigne du nez abondamment ?",
        "choices": [
          "Pencher la t?te en arri?re",
          "Pencher la t?te en avant, pincer les narines pendant 10 minutes",
          "Mettre du coton",
          "Souffler fort"
        ],
        "correct": 1,
        "explanation": "T?te pench?e en avant, pincer les narines pendant 10 minutes.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Quand peut-on d?placer une victime d'accident ?",
        "choices": [
          "Toujours",
          "Uniquement en cas de danger vital imminent (incendie, explosion)",
          "Jamais",
          "Quand elle le demande"
        ],
        "correct": 1,
        "explanation": "Ne d?placer que si danger vital imminent (incendie, risque d'explosion).",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 15,
    "title": "Conduite & S?curit? 15",
    "icon": "fas fa-parking",
    "color": "#a855f7",
    "description": "Stationnement, intersections, man?uvres, secours avanc?s",
    "questions": [
      {
        "q": "Que signifie le panneau d'interdiction de stationner (fond bleu, barre rouge) ?",
        "choices": [
          "Arr?t interdit",
          "Stationnement interdit",
          "Parking payant",
          "Zone pi?tonne"
        ],
        "correct": 1,
        "explanation": "Fond bleu avec barre rouge oblique = stationnement interdit.",
        "img": "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=520&h=260&fit=crop"
      },
      {
        "q": "Diff?rence entre arr?t et stationnement ?",
        "choices": [
          "Aucune",
          "Arr?t = conducteur reste au volant, stationnement = conducteur quitte le v?hicule",
          "Arr?t = moteur coup?",
          "Stationnement = moteur allum?"
        ],
        "correct": 1,
        "explanation": "Arr?t : conducteur reste au volant. Stationnement : conducteur quitte le v?hicule.",
        "img": "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle man?uvre est interdite sur autoroute ?",
        "choices": [
          "Doubler",
          "Faire demi-tour, marche arri?re ou s'arr?ter sur la chauss?e",
          "Changer de voie",
          "Acc?l?rer"
        ],
        "correct": 1,
        "explanation": "Demi-tour, marche arri?re et arr?t sur la chauss?e sont interdits sur autoroute.",
        "img": "https://images.unsplash.com/photo-1545987796-200677ee1011?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment entrer dans une voie d'insertion ?",
        "choices": [
          "Lentement",
          "Acc?l?rer pour atteindre la vitesse du flux et s'ins?rer en douceur",
          "S'arr?ter au bout",
          "Klaxonner"
        ],
        "correct": 1,
        "explanation": "Acc?l?rer dans la voie pour atteindre la vitesse du trafic, s'ins?rer en v?rifiant.",
        "img": null
      },
      {
        "q": "Que signifie le panneau ? STOP ? ?",
        "choices": [
          "Ralentir",
          "Arr?t obligatoire ? la ligne d'arr?t, m?me si la voie est libre",
          "C?der le passage",
          "Attention danger"
        ],
        "correct": 1,
        "explanation": "STOP = arr?t obligatoire marqu?, m?me si personne ne vient.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le voyant de frein. Quand s'allume-t-il hors frein ? main ?",
        "choices": [
          "Phares allum?s",
          "Niveau de liquide de frein trop bas ou d?faillance du syst?me",
          "Batterie faible",
          "Moteur chaud"
        ],
        "correct": 1,
        "explanation": "Voyant frein hors frein ? main = niveau liquide bas ou d?faillance.",
        "img": "assets/images/quiz/quiz-img-009.jpeg"
      },
      {
        "q": "Comment r?aliser un demi-tour en s?curit? ?",
        "choices": [
          "En une seule man?uvre",
          "V?rifier la visibilit?, les priorit?s et r?aliser en plusieurs man?uvres si n?cessaire",
          "En reculant uniquement",
          "En acc?l?rant fort"
        ],
        "correct": 1,
        "explanation": "V?rifier visibilit? et priorit?s, r?aliser en plusieurs man?uvres si la voie est ?troite.",
        "img": null
      },
      {
        "q": "Que faire si le feu passe ? l'orange et qu'on ne peut pas s'arr?ter ?",
        "choices": [
          "S'arr?ter quand m?me",
          "Passer en toute prudence si l'arr?t serait dangereux",
          "Acc?l?rer",
          "Reculer"
        ],
        "correct": 1,
        "explanation": "Passer si l'arr?t brutal serait dangereux, sinon s'arr?ter.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le bouchon d'huile moteur. Quand ajouter de l'huile ?",
        "choices": [
          "Quand le voyant s'allume",
          "Quand le niveau est en dessous du rep?re MIN sur la jauge",
          "Tous les mois",
          "Jamais"
        ],
        "correct": 1,
        "explanation": "Ajouter de l'huile quand le niveau est sous le rep?re MIN de la jauge.",
        "img": "assets/images/quiz/quiz-img-031.jpeg"
      },
      {
        "q": "Comment se positionner pour tourner ? droite ?",
        "choices": [
          "Au centre",
          "Serrer ? droite, mettre le clignotant droit",
          "? gauche",
          "N'importe o?"
        ],
        "correct": 1,
        "explanation": "Tourner ? droite : se placer ? droite, clignotant droit, v?rifier les angles morts.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la vitesse maximale en agglom?ration ?",
        "choices": [
          "30 km/h",
          "50 km/h",
          "70 km/h",
          "90 km/h"
        ],
        "correct": 1,
        "explanation": "50 km/h en agglom?ration sauf signalisation contraire.",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez la jauge d'huile sous le capot. ? quoi sert-elle ?",
        "choices": [
          "Mesurer le carburant",
          "V?rifier le niveau d'huile moteur entre les rep?res MIN et MAX",
          "V?rifier la pression",
          "Mesurer la temp?rature"
        ],
        "correct": 1,
        "explanation": "La jauge permet de v?rifier visuellement le niveau d'huile moteur.",
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
        "explanation": "Regonfler si possible et aller au garage pour r?parer ou remplacer.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Que faire si le liquide de refroidissement est sous le MIN ?",
        "choices": [
          "Normal",
          "Compl?ter avec le liquide pr?conis? par le constructeur, moteur froid",
          "Ajouter de l'eau du robinet",
          "Rouler quand m?me"
        ],
        "correct": 1,
        "explanation": "Compl?ter avec le liquide pr?conis?, toujours moteur froid.",
        "img": "assets/images/quiz/quiz-img-028.jpeg"
      },
      {
        "q": "Quel est le r?le du frein moteur ?",
        "choices": [
          "Acc?l?rer",
          "Ralentir le v?hicule en rel?chant l'acc?l?rateur, ?conomise les freins",
          "Arr?ter le moteur",
          "Consommer plus"
        ],
        "correct": 1,
        "explanation": "Le frein moteur ralentit le v?hicule sans user les freins.",
        "img": null
      },
      {
        "q": "Que signifie une ligne discontinue blanche ?",
        "choices": [
          "Interdiction de doubler",
          "Possibilit? de franchir pour doubler si c'est s?r",
          "Voie r?serv?e",
          "Zone de stationnement"
        ],
        "correct": 1,
        "explanation": "Ligne discontinue = possibilit? de franchir si c'est s?r et autoris?.",
        "img": null
      },
      {
        "q": "Que faire face ? une victime en ?tat de choc ?",
        "choices": [
          "La faire marcher",
          "L'allonger, sur?lever ses jambes, la couvrir et la rassurer",
          "Lui donner ? boire",
          "La laisser debout"
        ],
        "correct": 1,
        "explanation": "Allonger, sur?lever les jambes, couvrir et rassurer en attendant les secours.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment reconna?tre un choc anaphylactique ?",
        "choices": [
          "Douleur au bras",
          "Gonflement du visage, difficult? ? respirer, d?mangeaisons",
          "Mal de t?te",
          "Fi?vre"
        ],
        "correct": 1,
        "explanation": "Gonflement, difficult? ? respirer, urticaire : appeler le 15 imm?diatement.",
        "img": null
      },
      {
        "q": "Comment placer les ?lectrodes d'un DAE ?",
        "choices": [
          "N'importe o?",
          "Une sous la clavicule droite, une sous l'aisselle gauche",
          "Sur le ventre",
          "Sur les bras"
        ],
        "correct": 1,
        "explanation": "?lectrode droite sous la clavicule droite, gauche sous l'aisselle gauche.",
        "img": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=520&h=260&fit=crop"
      },
      {
        "q": "Faut-il continuer le massage en attendant le DAE ?",
        "choices": [
          "Non",
          "Oui, le massage ne s'arr?te que pour l'analyse et le choc du DAE",
          "Seulement 1 minute",
          "Alterner"
        ],
        "correct": 1,
        "explanation": "Le massage continue jusqu'? ce que le DAE demande de s'?carter pour l'analyse.",
        "img": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 16,
    "title": "Conduite & S?curit? 16",
    "icon": "fas fa-car-crash",
    "color": "#e11d48",
    "description": "Accidents, distances, r?glementation, m?canique, secours",
    "questions": [
      {
        "q": "Quelle est la distance d'arr?t ? 90 km/h sur route s?che ?",
        "choices": [
          "30 m?tres",
          "Environ 60-70 m?tres",
          "100 m?tres",
          "20 m?tres"
        ],
        "correct": 1,
        "explanation": "? 90 km/h : ~25m r?action + ~40m freinage = ~65m d'arr?t.",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la distance d'arr?t ? 130 km/h ?",
        "choices": [
          "60 m?tres",
          "Environ 120-130 m?tres",
          "200 m?tres",
          "50 m?tres"
        ],
        "correct": 1,
        "explanation": "? 130 km/h : ~36m r?action + ~90m freinage ? 125m d'arr?t.",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      },
      {
        "q": "Que risque un conducteur avec un taux d'alcool sup?rieur ? 0,5 g/l ?",
        "choices": [
          "Un avertissement",
          "Amende de 135?, retrait de 6 points, suspension de permis",
          "Rien",
          "Amende de 35?"
        ],
        "correct": 1,
        "explanation": "Alcool > 0.5g/l : 135? d'amende, 6 points retir?s, suspension possible.",
        "img": "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le voyant batterie. Quelle action en cas d'allumage prolong? ?",
        "choices": [
          "Rien",
          "Faire v?rifier le circuit de charge (alternateur, batterie)",
          "Couper la radio",
          "?teindre les feux"
        ],
        "correct": 1,
        "explanation": "Voyant batterie prolong? = circuit de charge d?faillant ? v?rifier.",
        "img": "assets/images/quiz/quiz-img-030.jpeg"
      },
      {
        "q": "Que v?rifier sur les r?troviseurs ext?rieurs ?",
        "choices": [
          "La couleur",
          "Qu'ils sont propres, bien r?gl?s et non fissur?s",
          "La marque",
          "Le chauffage"
        ],
        "correct": 1,
        "explanation": "R?troviseurs propres, bien r?gl?s pour couvrir les zones lat?rales.",
        "img": "assets/images/quiz/quiz-img-016.jpeg"
      },
      {
        "q": "Comment v?rifier le fonctionnement des feux stop sans aide ?",
        "choices": [
          "Impossible",
          "Reculer pr?s d'un mur ou vitrine et appuyer sur le frein en regardant le reflet",
          "En ?coutant",
          "Au contr?le technique"
        ],
        "correct": 1,
        "explanation": "Reculer pr?s d'une surface r?fl?chissante et appuyer sur le frein.",
        "img": "assets/images/quiz/quiz-img-041.jpeg"
      },
      {
        "q": "Que signifie le panneau d'agglom?ration (fond blanc, nom de ville) ?",
        "choices": [
          "Route nationale",
          "Entr?e en agglom?ration : vitesse limit?e ? 50 km/h",
          "Zone pi?tonne",
          "Autoroute"
        ],
        "correct": 1,
        "explanation": "Panneau de localit? = entr?e en agglom?ration, vitesse max 50 km/h.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le panneau de sortie d'agglom?ration (barr? en rouge) ?",
        "choices": [
          "Interdiction",
          "Fin de la limitation ? 50 km/h, retour ? la vitesse hors agglo",
          "Sens interdit",
          "Zone dangereuse"
        ],
        "correct": 1,
        "explanation": "Panneau barr? = sortie d'agglom?ration, vitesse hors agglo s'applique.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le commodo d'?clairage. Quelle position pour les feux de position ?",
        "choices": [
          "Position 0",
          "Premi?re position de la bague rotative",
          "Deuxi?me position",
          "Troisi?me position"
        ],
        "correct": 1,
        "explanation": "Les feux de position s'allument sur la premi?re position de la bague.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment fonctionne l'?clairage automatique ?",
        "choices": [
          "Toujours allum?",
          "Un capteur de luminosit? allume et ?teint les feux selon la lumi?re ambiante",
          "On le programme",
          "Il suit le GPS"
        ],
        "correct": 1,
        "explanation": "Le capteur adapte l'?clairage automatiquement selon la luminosit? ext?rieure.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le r?le des plaquettes de frein ?",
        "choices": [
          "Acc?l?rer",
          "Cr?er une friction sur le disque pour ralentir le v?hicule",
          "Refroidir",
          "Diriger"
        ],
        "correct": 1,
        "explanation": "Les plaquettes frottent le disque pour transformer l'?nergie cin?tique en chaleur.",
        "img": "assets/images/quiz/quiz-img-009.jpeg"
      },
      {
        "q": "Montrez le liquide de refroidissement. De quelle couleur est-il g?n?ralement ?",
        "choices": [
          "Noir",
          "Vert, rose ou orange selon le type",
          "Transparent",
          "Bleu"
        ],
        "correct": 1,
        "explanation": "Le liquide de refroidissement est color? (vert, rose ou orange) pour le distinguer.",
        "img": "assets/images/quiz/quiz-img-028.jpeg"
      },
      {
        "q": "Comment r?agir face ? un feu de v?hicule ?",
        "choices": [
          "Ouvrir le capot",
          "Couper le contact, ?vacuer, appeler les pompiers, ne pas ouvrir le capot",
          "?teindre avec de l'eau",
          "Acc?l?rer"
        ],
        "correct": 1,
        "explanation": "Couper le contact, ?vacuer tous les occupants et appeler les pompiers (18).",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire si l'on est t?moin d'un accident sans bless? ?",
        "choices": [
          "Partir",
          "Prot?ger la zone, ?changer les informations, remplir un constat",
          "Appeler la police",
          "D?placer les v?hicules d'abord"
        ],
        "correct": 1,
        "explanation": "Prot?ger, ?changer informations et remplir un constat amiable.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Que contient un constat amiable ?",
        "choices": [
          "Uniquement les noms",
          "Circonstances, croquis, identit?s, assurances, signatures des deux parties",
          "Juste les plaques",
          "Un seul t?moignage"
        ],
        "correct": 1,
        "explanation": "Le constat contient les circonstances, croquis, identit?s, assurances et signatures.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire si la victime vomit pendant la PLS ?",
        "choices": [
          "La mettre sur le dos",
          "La bouche doit ?tre orient?e vers le sol pour que les liquides s'?coulent",
          "L'asseoir",
          "Lui donner de l'eau"
        ],
        "correct": 1,
        "explanation": "En PLS, la bouche est orient?e vers le sol pour l'?vacuation des liquides.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le d?lai pour d?clarer un accident ? l'assurance ?",
        "choices": [
          "1 mois",
          "5 jours ouvr?s maximum",
          "48 heures",
          "10 jours"
        ],
        "correct": 1,
        "explanation": "L'accident doit ?tre d?clar? ? l'assurance dans les 5 jours ouvr?s.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Pourquoi le sous-gonflage augmente la consommation ?",
        "choices": [
          "Il ne l'augmente pas",
          "La surface de contact augmente, cr?ant plus de r?sistance au roulement",
          "Les freins frottent",
          "Le moteur surchauffe"
        ],
        "correct": 1,
        "explanation": "Pneus sous-gonfl?s = plus de surface au sol = plus de r?sistance = surconsommation.",
        "img": null
      },
      {
        "q": "Que v?rifier sur un extincteur de voiture ?",
        "choices": [
          "La couleur",
          "La date de p?remption et que la goupille est en place",
          "Le poids",
          "La marque"
        ],
        "correct": 1,
        "explanation": "V?rifier la date de p?remption et que l'extincteur est accessible et fonctionnel.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment r?agir si un passager fait un malaise hypoglyc?mique ?",
        "choices": [
          "L'ignorer",
          "S'arr?ter, lui donner du sucre rapide (jus, bonbon) et surveiller",
          "Le faire marcher",
          "Lui donner de l'eau"
        ],
        "correct": 1,
        "explanation": "S'arr?ter, donner du sucre rapide et surveiller l'am?lioration.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 17,
    "title": "Conduite & S?curit? 17",
    "icon": "fas fa-bicycle",
    "color": "#0891b2",
    "description": "Partage de la route, usagers vuln?rables, environnement, urgences",
    "questions": [
      {
        "q": "Quelle pr?caution prendre en pr?sence d'un cycliste ?",
        "choices": [
          "Klaxonner",
          "Ralentir, respecter 1m en ville / 1,5m hors ville, v?rifier les angles morts",
          "Acc?l?rer pour le doubler vite",
          "Rester derri?re"
        ],
        "correct": 1,
        "explanation": "Respecter la distance lat?rale minimale et v?rifier les angles morts.",
        "img": "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment r?agir face ? un bus scolaire ? l'arr?t ?",
        "choices": [
          "Continuer normalement",
          "Ralentir et ?tre pr?t ? s'arr?ter (enfants peuvent traverser)",
          "Acc?l?rer",
          "Klaxonner"
        ],
        "correct": 1,
        "explanation": "Ralentir car des enfants peuvent traverser devant ou derri?re le bus.",
        "img": "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le bouton de chauffage du pare-brise. Son avantage en hiver ?",
        "choices": [
          "Aucun",
          "D?givre rapidement le pare-brise sans attendre le moteur",
          "Chauffe l'habitacle",
          "?conomise du carburant"
        ],
        "correct": 1,
        "explanation": "Le chauffage du pare-brise d?givre rapidement la vitre avant.",
        "img": "assets/images/quiz/quiz-img-018.jpeg"
      },
      {
        "q": "Comment contribuer ? la protection de l'environnement en conduisant ?",
        "choices": [
          "Rouler vite",
          "?co-conduite, entretien r?gulier, v?rifier la pression des pneus",
          "Utiliser le recyclage d'air",
          "Rouler fen?tres ouvertes"
        ],
        "correct": 1,
        "explanation": "?co-conduite, entretien r?gulier et pneus bien gonfl?s r?duisent les ?missions.",
        "img": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le label Crit'Air ?",
        "choices": [
          "La puissance du moteur",
          "Le niveau de pollution du v?hicule pour les zones ? faibles ?missions",
          "La vitesse max",
          "La consommation"
        ],
        "correct": 1,
        "explanation": "Crit'Air classe les v?hicules selon leur niveau de pollution.",
        "img": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le voyant de temp?rature. Pourquoi surveiller la temp?rature en ?t? ?",
        "choices": [
          "Par habitude",
          "Le risque de surchauffe augmente avec la chaleur et les embouteillages",
          "Pour la clim",
          "Pour les pneus"
        ],
        "correct": 1,
        "explanation": "En ?t?, chaleur + embouteillages augmentent le risque de surchauffe moteur.",
        "img": "assets/images/quiz/quiz-img-010.jpeg"
      },
      {
        "q": "Quel est l'impact de la vitesse sur la consommation ?",
        "choices": [
          "Aucun",
          "La consommation augmente exponentiellement avec la vitesse",
          "La consommation baisse",
          "?a d?pend du carburant"
        ],
        "correct": 1,
        "explanation": "La consommation augmente fortement avec la vitesse (r?sistance de l'air).",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment stationner en c?te montante ?",
        "choices": [
          "Roues droites",
          "Braquer les roues vers le trottoir ? gauche, serrer le frein de parking",
          "Braquer ? droite",
          "Ne pas mettre le frein"
        ],
        "correct": 1,
        "explanation": "En c?te montante, braquer les roues ? gauche (vers la route) et serrer le frein.",
        "img": "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment stationner en c?te descendante ?",
        "choices": [
          "Roues droites",
          "Braquer les roues vers le trottoir ? droite, serrer le frein de parking, 1?re vitesse",
          "Braquer ? gauche",
          "Point mort"
        ],
        "correct": 1,
        "explanation": "En descente, braquer vers le trottoir (droite) et mettre en 1?re ou P.",
        "img": "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le panneau bleu avec un v?lo blanc ?",
        "choices": [
          "V?lo interdit",
          "Piste cyclable obligatoire",
          "Zone pi?tonne",
          "Stationnement v?lo"
        ],
        "correct": 1,
        "explanation": "Rond bleu avec v?lo blanc = piste cyclable obligatoire.",
        "img": "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le bouchon de lave-glace. Quel produit utiliser ?",
        "choices": [
          "De l'eau",
          "Du liquide lave-glace avec antigel adapt? ? la saison",
          "Du savon",
          "Du vinaigre"
        ],
        "correct": 1,
        "explanation": "Utiliser du liquide lave-glace avec antigel en hiver.",
        "img": "assets/images/quiz/quiz-img-025.jpeg"
      },
      {
        "q": "Quel est le risque de stationner sur un passage pi?ton ?",
        "choices": [
          "Aucun",
          "Mettre en danger les pi?tons et recevoir une amende",
          "Juste une amende",
          "Usure des pneus"
        ],
        "correct": 1,
        "explanation": "Stationner sur un passage pi?ton met les pi?tons en danger et est verbalis?.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le r?le du pot catalytique ?",
        "choices": [
          "Augmenter la puissance",
          "Transformer les gaz polluants en gaz moins nocifs",
          "Diminuer le bruit",
          "Refroidir l'?chappement"
        ],
        "correct": 1,
        "explanation": "Le catalyseur convertit CO, NOx et hydrocarbures en CO2, N2 et H2O.",
        "img": null
      },
      {
        "q": "Montrez le voyant de pression d'huile. Sa forme ?",
        "choices": [
          "Thermom?tre",
          "Burette d'huile (petit arrosoir)",
          "Batterie",
          "Frein"
        ],
        "correct": 1,
        "explanation": "Le voyant d'huile a la forme d'une burette (petit arrosoir) avec une goutte.",
        "img": "assets/images/quiz/quiz-img-014.jpeg"
      },
      {
        "q": "Que faire si le v?hicule ?met une fum?e noire excessive ?",
        "choices": [
          "Normal",
          "Faire v?rifier le moteur (probl?me d'injection ou de filtre)",
          "Acc?l?rer",
          "Couper la clim"
        ],
        "correct": 1,
        "explanation": "Fum?e noire excessive = probl?me de combustion ? faire v?rifier.",
        "img": null
      },
      {
        "q": "Comment aider une victime consciente en attendant les secours ?",
        "choices": [
          "La faire marcher",
          "La rassurer, la couvrir, surveiller son ?tat et ne pas lui donner ? boire/manger",
          "Lui donner des m?dicaments",
          "La faire bouger"
        ],
        "correct": 1,
        "explanation": "Rassurer, couvrir, surveiller. Ne rien donner ? boire ni ? manger.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le num?ro europ?en d'urgence ?",
        "choices": [
          "17",
          "112",
          "18",
          "911"
        ],
        "correct": 1,
        "explanation": "Le 112 est le num?ro d'urgence europ?en, valable dans tous les pays de l'UE.",
        "img": "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment signaler un danger sur la route aux autres conducteurs ?",
        "choices": [
          "Klaxonner continuellement",
          "Allumer les feux de d?tresse et ralentir progressivement",
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
          "Des pneus sous-gonfl?s augmentent la consommation de 3 ? 5%",
          "Les pneus neufs consomment plus",
          "?a d?pend de la marque"
        ],
        "correct": 1,
        "explanation": "Pneus sous-gonfl?s = +3 ? 5% de consommation ? cause de la r?sistance au roulement.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Que faire si le DAE dit ? choc non recommand? ? ?",
        "choices": [
          "?teindre le DAE",
          "Reprendre imm?diatement le massage cardiaque",
          "Retirer les ?lectrodes",
          "Appeler les secours"
        ],
        "correct": 1,
        "explanation": "Si le DAE dit ? choc non recommand? ?, reprendre le massage cardiaque imm?diatement.",
        "img": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 18,
    "title": "Conduite & S?curit? 18",
    "icon": "fas fa-moon",
    "color": "#7c3aed",
    "description": "Conduite de nuit, fatigue, alcool, drogues, m?canique",
    "questions": [
      {
        "q": "Pourquoi la conduite de nuit est-elle plus dangereuse ?",
        "choices": [
          "Moins de trafic",
          "Visibilit? r?duite, fatigue, ?blouissement",
          "Plus de vent",
          "La route est plus glissante"
        ],
        "correct": 1,
        "explanation": "Nuit : visibilit? r?duite, fatigue accrue, risque d'?blouissement.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "? quelle distance voit-on avec les feux de croisement ?",
        "choices": [
          "100 m?tres",
          "Environ 30 ? 40 m?tres",
          "10 m?tres",
          "200 m?tres"
        ],
        "correct": 1,
        "explanation": "Les feux de croisement ?clairent ? environ 30-40 m?tres devant.",
        "img": "assets/images/quiz/quiz-img-013.jpeg"
      },
      {
        "q": "? quelle distance voit-on avec les feux de route ?",
        "choices": [
          "50 m?tres",
          "Environ 100 m?tres",
          "200 m?tres",
          "30 m?tres"
        ],
        "correct": 1,
        "explanation": "Les feux de route ?clairent ? environ 100 m?tres devant.",
        "img": "assets/images/quiz/quiz-img-013.jpeg"
      },
      {
        "q": "Comment lutter contre la somnolence au volant ?",
        "choices": [
          "Mettre la clim ? fond",
          "S'arr?ter et faire une sieste de 15-20 minutes",
          "Boire un caf? et continuer",
          "Ouvrir la fen?tre"
        ],
        "correct": 1,
        "explanation": "La seule solution efficace : s'arr?ter et dormir 15-20 minutes.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est l'effet du cannabis sur la conduite ?",
        "choices": [
          "Am?liore la concentration",
          "Diminue l'attention, allonge le temps de r?action, alt?re la perception",
          "Aucun effet",
          "Am?liore la vision"
        ],
        "correct": 1,
        "explanation": "Cannabis : baisse d'attention, temps de r?action allong?, perception alt?r?e.",
        "img": "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez les feux de route. Pourquoi les ?teindre en croisement ?",
        "choices": [
          "Pour ?conomiser la batterie",
          "Pour ne pas ?blouir les conducteurs en face",
          "Par habitude",
          "Ce n'est pas obligatoire"
        ],
        "correct": 1,
        "explanation": "Les feux de route ?blouissent les conducteurs en face, risque d'accident.",
        "img": "assets/images/quiz/quiz-img-013.jpeg"
      },
      {
        "q": "Que signifie le panneau triangulaire avec un cerf ?",
        "choices": [
          "Zoo",
          "Passage d'animaux sauvages",
          "Chasse interdite",
          "For?t"
        ],
        "correct": 1,
        "explanation": "Triangle avec animal sauvage = risque de travers?e d'animaux.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment adapter sa vitesse la nuit ?",
        "choices": [
          "Rouler ? la m?me vitesse",
          "Adapter pour pouvoir s'arr?ter dans la zone ?clair?e par les phares",
          "Rouler plus vite car il y a moins de trafic",
          "Au feeling"
        ],
        "correct": 1,
        "explanation": "Ne jamais rouler plus vite que la distance ?clair?e par les phares.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le commodo d'?clairage. Position AUTO signifie quoi ?",
        "choices": [
          "Toujours allum?",
          "Les feux s'allument et s'?teignent automatiquement selon la luminosit?",
          "Mode turbo",
          "Feux de route auto"
        ],
        "correct": 1,
        "explanation": "AUTO : le capteur allume/?teint les feux selon la luminosit? ambiante.",
        "img": "https://images.unsplash.com/photo-1506241537529-eefea1fae3e0?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle sanction pour conduite sous stup?fiants ?",
        "choices": [
          "Avertissement",
          "Jusqu'? 2 ans de prison, 4500? d'amende, retrait de 6 points, annulation de permis",
          "Amende de 68?",
          "Retrait de 1 point"
        ],
        "correct": 1,
        "explanation": "Stup?fiants au volant : 2 ans prison, 4500?, 6 points, annulation de permis.",
        "img": "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment v?rifier que les phares sont bien r?gl?s ?",
        "choices": [
          "Au bruit",
          "Se placer face ? un mur, les faisceaux doivent ?tre sym?triques et l?g?rement inclin?s vers le bas",
          "En roulant",
          "Au contr?le technique uniquement"
        ],
        "correct": 1,
        "explanation": "Face ? un mur : faisceaux sym?triques, l?g?rement inclin?s vers le bas et la droite.",
        "img": "assets/images/quiz/quiz-img-035.jpeg"
      },
      {
        "q": "Montrez le voyant de frein ? main ?lectrique. Comment le d?sactiver ?",
        "choices": [
          "Tirer le levier",
          "Appuyer sur le bouton du frein ?lectrique en appuyant sur le frein",
          "Tourner la cl?",
          "Mettre le contact"
        ],
        "correct": 1,
        "explanation": "Frein ?lectrique : appuyer sur le bouton en tenant la p?dale de frein.",
        "img": "assets/images/quiz/quiz-img-009.jpeg"
      },
      {
        "q": "Que signifie le clignotement rapide d'un clignotant ?",
        "choices": [
          "Fonctionnement normal",
          "Une ampoule de clignotant est grill?e",
          "La batterie est faible",
          "Le feu est trop puissant"
        ],
        "correct": 1,
        "explanation": "Un clignotement anormalement rapide indique qu'une ampoule est grill?e.",
        "img": null
      },
      {
        "q": "Quel est le risque de conduire avec des m?dicaments ?",
        "choices": [
          "Aucun",
          "Certains m?dicaments diminuent les r?flexes et la vigilance",
          "Am?liore la conduite",
          "Seulement les antibiotiques"
        ],
        "correct": 1,
        "explanation": "Certains m?dicaments (pictogramme sur la bo?te) alt?rent la conduite.",
        "img": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment r?duire la pollution sonore en conduisant ?",
        "choices": [
          "Rouler vite",
          "Rouler ? vitesse mod?r?e, entretenir le pot d'?chappement",
          "Klaxonner moins",
          "Mettre de la musique"
        ],
        "correct": 1,
        "explanation": "Vitesse mod?r?e et pot d'?chappement en bon ?tat r?duisent le bruit.",
        "img": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=520&h=260&fit=crop"
      },
      {
        "q": "Que v?rifier sur les balais d'essuie-glaces ?",
        "choices": [
          "La couleur",
          "L'?tat du caoutchouc (fissur?, d?coll?) et l'efficacit? d'essuyage",
          "La longueur",
          "Le poids"
        ],
        "correct": 1,
        "explanation": "V?rifier que le caoutchouc n'est pas fissur? ou d?coll?.",
        "img": "assets/images/quiz/quiz-img-017.jpeg"
      },
      {
        "q": "Montrez les phares. Comment changer une ampoule sur ce v?hicule ?",
        "choices": [
          "Par le dessus",
          "Acc?der par le compartiment moteur, tourner le support d'ampoule",
          "Par la carrosserie",
          "Au garage uniquement"
        ],
        "correct": 1,
        "explanation": "Acc?der par l'arri?re du bloc optique sous le capot.",
        "img": "assets/images/quiz/quiz-img-035.jpeg"
      },
      {
        "q": "Que faire si les freins ne r?pondent plus ?",
        "choices": [
          "Sauter du v?hicule",
          "Pomper la p?dale, utiliser le frein moteur (r?trograder), frein de parking en dernier recours",
          "Tourner la cl?",
          "Acc?l?rer"
        ],
        "correct": 1,
        "explanation": "Pomper la p?dale, frein moteur en r?trogradant, frein de parking en dernier recours.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment ?valuer l'?tat de conscience d'une victime ?",
        "choices": [
          "La secouer violemment",
          "Lui parler fort, lui demander de serrer la main, lui pincer l?g?rement",
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
          "Ne pas retirer le casque, d?tacher la jugulaire et surveiller la respiration",
          "Rien",
          "La d?placer"
        ],
        "correct": 1,
        "explanation": "Laisser le casque, d?tacher la jugulaire et surveiller la respiration.",
        "img": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 19,
    "title": "Conduite & S?curit? 19",
    "icon": "fas fa-hands-helping",
    "color": "#059669",
    "description": "?co-conduite avanc?e, partage route, technique, secours pratique",
    "questions": [
      {
        "q": "Qu'est-ce que l'?co-conduite apporte concr?tement ?",
        "choices": [
          "Rien",
          "?conomie de carburant, moins de pollution, moins d'usure, plus de s?curit?",
          "Plus de puissance",
          "Une conduite plus rapide"
        ],
        "correct": 1,
        "explanation": "L'?co-conduite r?duit la consommation de 10-15%, l'usure et les risques.",
        "img": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=520&h=260&fit=crop"
      },
      {
        "q": "Pourquoi anticiper le trafic en regardant loin ?",
        "choices": [
          "Par curiosit?",
          "Pour adapter sa vitesse et ?viter les freinages brusques",
          "Pour aller plus vite",
          "Pour le GPS"
        ],
        "correct": 1,
        "explanation": "Anticiper permet une conduite plus fluide, s?re et ?conomique.",
        "img": null
      },
      {
        "q": "Montrez le voyant de pression pneus. Que faire s'il s'allume ?",
        "choices": [
          "Continuer",
          "V?rifier la pression de tous les pneus d?s que possible",
          "Ignorer",
          "Gonfler au hasard"
        ],
        "correct": 1,
        "explanation": "V?rifier la pression de tous les pneus et ajuster selon l'?tiquette porti?re.",
        "img": "assets/images/quiz/quiz-img-014.jpeg"
      },
      {
        "q": "Comment adapter sa conduite dans une zone scolaire ?",
        "choices": [
          "Vitesse normale",
          "Rouler ? 30 km/h max, ?tre tr?s vigilant aux enfants",
          "Klaxonner pour pr?venir",
          "Acc?l?rer pour quitter vite la zone"
        ],
        "correct": 1,
        "explanation": "Zone scolaire : 30 km/h max, vigilance extr?me aux heures d'entr?e/sortie.",
        "img": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le bocal de refroidissement. Comment v?rifier sans ouvrir ?",
        "choices": [
          "Impossible",
          "Regarder le niveau ? travers le bocal transparent entre MIN et MAX",
          "Toucher le bocal",
          "?couter"
        ],
        "correct": 1,
        "explanation": "Le bocal est transparent : v?rifier visuellement entre MIN et MAX.",
        "img": "assets/images/quiz/quiz-img-028.jpeg"
      },
      {
        "q": "Que signifie le terme ? zone de rencontre ? ?",
        "choices": [
          "Zone de parking",
          "Zone limit?e ? 20 km/h o? le pi?ton est prioritaire",
          "Zone industrielle",
          "Zone 30"
        ],
        "correct": 1,
        "explanation": "Zone de rencontre : 20 km/h max, pi?tons prioritaires sur toute la chauss?e.",
        "img": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment r?agir si un pneu ?clate en roulant ?",
        "choices": [
          "Freiner fort",
          "Maintenir le volant fermement, ne pas freiner brusquement, ralentir progressivement",
          "Acc?l?rer",
          "L?cher le volant"
        ],
        "correct": 1,
        "explanation": "Maintenir le volant, rel?cher l'acc?l?rateur doucement, ne pas freiner brusquement.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Quel est l'int?r?t d'un r?gulateur adaptatif (ACC) ?",
        "choices": [
          "Aucun",
          "Il adapte la vitesse et la distance au v?hicule pr?c?dent automatiquement",
          "Il freine uniquement",
          "Il acc?l?re uniquement"
        ],
        "correct": 1,
        "explanation": "Le r?gulateur adaptatif maintient la vitesse ET adapte la distance au v?hicule devant.",
        "img": "assets/images/quiz/quiz-img-020.jpeg"
      },
      {
        "q": "Montrez la commande du klaxon. Dans quel cas l'utiliser hors agglo ?",
        "choices": [
          "Pour saluer",
          "Pour pr?venir d'un danger",
          "Pour exprimer sa col?re",
          "Pour doubler"
        ],
        "correct": 1,
        "explanation": "Hors agglom?ration, le klaxon s'utilise pour pr?venir d'un danger.",
        "img": "assets/images/quiz/quiz-img-021.jpeg"
      },
      {
        "q": "Que signifie le panneau avec un cercle rouge et ? 30 ? ?",
        "choices": [
          "Minimum 30",
          "Vitesse limit?e ? 30 km/h maximum",
          "30 m?tres avant un stop",
          "Zone 30 facultative"
        ],
        "correct": 1,
        "explanation": "Cercle rouge avec 30 = vitesse limit?e ? 30 km/h.",
        "img": "https://images.unsplash.com/photo-1566847926613-4bf4f25be5b6?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment r?agir si de la fum?e blanche sort du capot ?",
        "choices": [
          "Normal",
          "S'arr?ter imm?diatement : possible fuite de liquide de refroidissement",
          "Acc?l?rer",
          "Ajouter de l'huile"
        ],
        "correct": 1,
        "explanation": "Fum?e blanche = probable fuite de refroidissement. S'arr?ter et ne pas ouvrir le capot.",
        "img": null
      },
      {
        "q": "Montrez la jauge de carburant. Que signifie la petite fl?che ?",
        "choices": [
          "La vitesse",
          "Le c?t? du v?hicule o? se trouve la trappe ? carburant",
          "Le niveau d'huile",
          "La direction du vent"
        ],
        "correct": 1,
        "explanation": "La petite fl?che ? c?t? du symbole indique le c?t? de la trappe.",
        "img": null
      },
      {
        "q": "Quel type de permis pour conduire un v?hicule de plus de 3,5 tonnes ?",
        "choices": [
          "Permis B",
          "Permis C",
          "Permis A",
          "Permis D"
        ],
        "correct": 1,
        "explanation": "Le permis C est n?cessaire pour les v?hicules de plus de 3,5 tonnes.",
        "img": null
      },
      {
        "q": "Comment faire le point de patinage en c?te ?",
        "choices": [
          "Acc?l?rer ? fond",
          "Rel?cher doucement l'embrayage jusqu'? sentir le v?hicule tirer",
          "L?cher tout d'un coup",
          "Mettre le frein ? main uniquement"
        ],
        "correct": 1,
        "explanation": "Rel?cher l'embrayage doucement jusqu'au point de patinage (le v?hicule ? tire ?).",
        "img": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=520&h=260&fit=crop"
      },
      {
        "q": "Que faire face ? un tramway ?",
        "choices": [
          "Le doubler par la droite",
          "Ne jamais s'engager sur les rails, lui c?der la priorit?",
          "Le suivre de pr?s",
          "Klaxonner"
        ],
        "correct": 1,
        "explanation": "Ne jamais s'engager sur les rails et toujours c?der la priorit? au tramway.",
        "img": "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel est le risque d'une temp?rature d'huile trop ?lev?e ?",
        "choices": [
          "Aucun",
          "D?gradation de l'huile et risque de casse moteur",
          "Le moteur va mieux",
          "Les freins sont meilleurs"
        ],
        "correct": 1,
        "explanation": "Huile trop chaude perd ses propri?t?s lubrifiantes = risque de casse moteur.",
        "img": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment r?agir face ? un pi?ton aveugle (canne blanche) ?",
        "choices": [
          "Klaxonner",
          "S'arr?ter compl?tement et attendre qu'il ait fini de traverser",
          "Contourner",
          "Acc?l?rer"
        ],
        "correct": 1,
        "explanation": "Toujours s'arr?ter et attendre qu'un pi?ton aveugle ait fini de traverser.",
        "img": "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment pratiquer le bouche-?-bouche ?",
        "choices": [
          "Souffler fort dans le nez",
          "Pincer le nez, basculer la t?te, souffler 2 fois dans la bouche",
          "Souffler dans l'oreille",
          "Appuyer sur le thorax"
        ],
        "correct": 1,
        "explanation": "Basculer la t?te, pincer le nez, souffler 2 fois progressivement dans la bouche.",
        "img": "https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=520&h=260&fit=crop"
      },
      {
        "q": "Comment reconna?tre un arr?t respiratoire ?",
        "choices": [
          "Le ventre bouge",
          "Aucun mouvement du thorax, aucun souffle, aucun bruit respiratoire pendant 10 secondes",
          "Les yeux sont ouverts",
          "La personne tousse"
        ],
        "correct": 1,
        "explanation": "Aucun signe de respiration pendant 10 secondes = arr?t respiratoire.",
        "img": "https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=520&h=260&fit=crop"
      },
      {
        "q": "Que signifie le sigle RCP ?",
        "choices": [
          "R?paration Compl?te du Pneu",
          "R?animation Cardio-Pulmonaire",
          "R?gulation de la Circulation Publique",
          "Rapport de Contr?le P?riodique"
        ],
        "correct": 1,
        "explanation": "RCP = R?animation Cardio-Pulmonaire (massage cardiaque + insufflations).",
        "img": "https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=520&h=260&fit=crop"
      }
    ]
  },
  {
    "id": 20,
    "title": "Conduite & S?curit? 20",
    "icon": "fas fa-flag-checkered",
    "color": "#1e40af",
    "description": "R?vision g?n?rale : tous les th?mes, pr?paration ? l'examen",
    "questions": [
      {
        "q": "Montrez le tableau de bord. Quel voyant est le plus dangereux ?",
        "choices": [
          "Orange moteur",
          "Un voyant rouge, car il impose un arr?t imm?diat",
          "Bleu feux de route",
          "Vert clignotant"
        ],
        "correct": 1,
        "explanation": "Un voyant rouge signale un danger critique n?cessitant un arr?t imm?diat.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez l'?tiquette de pression. Pourquoi deux pressions diff?rentes ?",
        "choices": [
          "Erreur fabricant",
          "Pression ? vide et pression ? charge (passagers + bagages)",
          "Avant et arri?re",
          "?t? et hiver"
        ],
        "correct": 1,
        "explanation": "Deux pressions : ? vide (usage normal) et ? pleine charge (v?hicule charg?).",
        "img": "assets/images/quiz/quiz-img-038.jpeg"
      },
      {
        "q": "Montrez la batterie. Quel risque si les bornes sont oxyd?es ?",
        "choices": [
          "Aucun",
          "Mauvais contact, difficult?s de d?marrage",
          "Le moteur surchauffe",
          "Les freins faiblissent"
        ],
        "correct": 1,
        "explanation": "Des bornes oxyd?es emp?chent le bon passage du courant = probl?mes de d?marrage.",
        "img": "assets/images/quiz/quiz-img-030.jpeg"
      },
      {
        "q": "Citez les 5 niveaux ? v?rifier sous le capot.",
        "choices": [
          "Huile, eau, alcool, essence, air",
          "Huile moteur, liquide frein, refroidissement, lave-glace, direction assist?e",
          "Huile, diesel, air, azote, eau",
          "Un seul suffit"
        ],
        "correct": 1,
        "explanation": "Les 5 niveaux : huile, liquide frein, refroidissement, lave-glace, direction assist?e.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le bouchon d'huile. Quel symbole le distingue ?",
        "choices": [
          "Thermom?tre",
          "Burette d'huile (arrosoir)",
          "Batterie",
          "Goutte d'eau"
        ],
        "correct": 1,
        "explanation": "Le bouchon d'huile porte le symbole d'une burette d'huile.",
        "img": "assets/images/quiz/quiz-img-031.jpeg"
      },
      {
        "q": "Montrez les feux arri?re. Quels feux sont rouges en permanence ?",
        "choices": [
          "Clignotants",
          "Feux de position arri?re et feux stop",
          "Feux de recul",
          "Feux de brouillard"
        ],
        "correct": 1,
        "explanation": "Les feux de position arri?re sont rouges fixes, les feux stop rouges au freinage.",
        "img": "assets/images/quiz/quiz-img-041.jpeg"
      },
      {
        "q": "Comment v?rifier l'usure des pneus avec une pi?ce de monnaie ?",
        "choices": [
          "Mettre une pi?ce de 1? dans la rainure, si le bord dor? est visible, le pneu est us?",
          "Mesurer avec un m?tre",
          "Peser le pneu",
          "Par la couleur"
        ],
        "correct": 0,
        "explanation": "Ins?rer une pi?ce de 1? : si le bord dor? est visible, profondeur < 3mm, usure avanc?e.",
        "img": "assets/images/quiz/quiz-img-037.jpeg"
      },
      {
        "q": "Quels gestes de premiers secours doit conna?tre tout conducteur ?",
        "choices": [
          "Aucun",
          "PAS (Prot?ger/Alerter/Secourir), PLS, massage cardiaque, arr?t h?morragie",
          "Uniquement appeler les secours",
          "Le massage cardiaque uniquement"
        ],
        "correct": 1,
        "explanation": "Tout conducteur doit conna?tre : PAS, PLS, massage cardiaque et compression h?morragie.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est la meilleure position du si?ge pour conduire ?",
        "choices": [
          "Tr?s proche du volant",
          "Bras l?g?rement fl?chis sur le volant, dos cal?, pied gauche ? plat",
          "Tr?s loin du volant",
          "Dossier tr?s inclin?"
        ],
        "correct": 1,
        "explanation": "Bras l?g?rement fl?chis, dos cal? contre le dossier, pied gauche pos? ? plat.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le commodo droit. ? quoi sert-il ?",
        "choices": [
          "?clairage",
          "Essuie-glaces et lave-glace",
          "Clignotants",
          "R?gulateur"
        ],
        "correct": 1,
        "explanation": "Le commodo droit commande les essuie-glaces et le lave-glace avant/arri?re.",
        "img": null
      },
      {
        "q": "Montrez le commodo gauche. ? quoi sert-il ?",
        "choices": [
          "Essuie-glaces",
          "?clairage (feux de position, croisement, route) et clignotants",
          "Klaxon",
          "R?gulateur"
        ],
        "correct": 1,
        "explanation": "Le commodo gauche commande l'?clairage et les clignotants.",
        "img": null
      },
      {
        "q": "Comment r?agir si le moteur ne d?marre pas par temps froid ?",
        "choices": [
          "Insister sur le d?marreur",
          "V?rifier la batterie, attendre quelques secondes entre les tentatives",
          "Pousser le v?hicule",
          "Ajouter de l'eau chaude"
        ],
        "correct": 1,
        "explanation": "V?rifier la batterie. Ne pas insister : risque de noyer le moteur ou user le d?marreur.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Quelle est l'importance du contr?le des angles morts avant chaque man?uvre ?",
        "choices": [
          "Aucune",
          "Essentielle : les angles morts cachent des usagers vuln?rables",
          "Optionnelle",
          "Uniquement en ville"
        ],
        "correct": 1,
        "explanation": "Les angles morts peuvent cacher pi?tons, v?los et motos. Toujours v?rifier.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le coffre. Quels ?quipements de s?curit? y trouver ?",
        "choices": [
          "Rien",
          "Gilet haute visibilit?, triangle de pr?signalisation, roue/kit de secours",
          "Uniquement un cric",
          "Des outils"
        ],
        "correct": 1,
        "explanation": "Gilet (accessible depuis l'habitacle), triangle et roue de secours ou kit anti-crevaison.",
        "img": null
      },
      {
        "q": "R?sumez les ?tapes de la cha?ne de secours.",
        "choices": [
          "Appeler puis partir",
          "1.Prot?ger 2.Alerter les secours 3.Secourir selon l'?tat de la victime",
          "1.Secourir 2.Alerter 3.Prot?ger",
          "1.Alerter 2.Prot?ger 3.Partir"
        ],
        "correct": 1,
        "explanation": "PAS : 1.Prot?ger la zone 2.Alerter (15/18/112) 3.Secourir la victime.",
        "img": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel document justifie l'assurance du v?hicule ?",
        "choices": [
          "La carte grise",
          "La carte verte (attestation d'assurance)",
          "Le permis de conduire",
          "Le contr?le technique"
        ],
        "correct": 1,
        "explanation": "La carte verte (attestation d'assurance) doit ?tre pr?sente dans le v?hicule.",
        "img": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=520&h=260&fit=crop"
      },
      {
        "q": "Quels documents avoir obligatoirement dans le v?hicule ?",
        "choices": [
          "Permis uniquement",
          "Permis de conduire, carte grise et attestation d'assurance",
          "Carte d'identit? et permis",
          "Carnet de sant?"
        ],
        "correct": 1,
        "explanation": "Les 3 documents obligatoires : permis, carte grise et attestation d'assurance.",
        "img": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=520&h=260&fit=crop"
      },
      {
        "q": "Pourquoi v?rifier l'ensemble du v?hicule r?guli?rement ?",
        "choices": [
          "Par obligation",
          "Pour garantir la s?curit?, ?viter les pannes et maintenir les performances",
          "Pour le revendre plus cher",
          "Par habitude"
        ],
        "correct": 1,
        "explanation": "Un entretien r?gulier garantit s?curit?, fiabilit? et performances du v?hicule.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      },
      {
        "q": "Quel geste r?sume le mieux la conduite responsable ?",
        "choices": [
          "Rouler vite pour gagner du temps",
          "Anticiper, respecter les r?gles, partager la route et ?tre attentif aux autres",
          "Suivre les autres v?hicules",
          "Klaxonner souvent"
        ],
        "correct": 1,
        "explanation": "Conduite responsable = anticipation, respect des r?gles, partage de la route et vigilance.",
        "img": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=520&h=260&fit=crop"
      },
      {
        "q": "Montrez le volant. Quelle position des mains est recommand?e ?",
        "choices": [
          "En haut",
          "9h15 ou 10h10 (quart gauche et quart droit)",
          "En bas",
          "Une seule main suffit"
        ],
        "correct": 1,
        "explanation": "Position recommand?e : 9h15 ou 10h10, mains sym?triques pour un bon contr?le.",
        "img": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=520&h=260&fit=crop"
      }
    ]
  }
];
