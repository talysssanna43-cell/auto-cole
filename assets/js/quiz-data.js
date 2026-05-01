const quizSessions = [
  {
    id: 1,
    title: "Sécurité & Intérieur",
    icon: "fas fa-shield-alt",
    color: "#3b82f6",
    description: "Ceinture, appui-tête, sièges enfants, rétroviseurs",
    questions: [
      {
        q: "En règle générale, à partir de quel âge un enfant peut-il être installé sur le siège passager avant du véhicule ?",
        choices: ["8 ans", "10 ans", "12 ans", "6 ans"],
        correct: 1,
        explanation: "Un enfant peut être installé à l'avant à partir de 10 ans. Avant cet âge, il doit être installé à l'arrière avec un dispositif adapté."
      },
      {
        q: "Quelle est l'utilité de l'appui-tête du siège conducteur ?",
        choices: ["Améliorer le confort de conduite", "Retenir le mouvement de la tête en cas de choc et limiter les blessures", "Maintenir la tête droite pour mieux voir la route", "Empêcher le conducteur de s'endormir"],
        correct: 1,
        explanation: "L'appui-tête permet de retenir le mouvement de la tête en cas de choc arrière et ainsi limiter les blessures cervicales (coup du lapin)."
      },
      {
        q: "Peut-on fixer tout type de siège enfant sur des attaches de type Isofix ?",
        choices: ["Oui, tous les sièges sont compatibles", "Non, uniquement ceux compatibles avec ce système d'attache", "Oui, mais seulement à l'arrière", "Non, les attaches Isofix ne sont plus autorisées"],
        correct: 1,
        explanation: "Seuls les sièges enfants compatibles avec le système Isofix peuvent y être fixés. Il faut vérifier la compatibilité avant l'achat."
      },
      {
        q: "Avant de démarrer, quel réglage est essentiel pour le rétroviseur intérieur ?",
        choices: ["Le mettre en position nuit", "Le régler pour voir l'ensemble de la lunette arrière", "Le tourner vers le bas", "Le désactiver en conduite de jour"],
        correct: 1,
        explanation: "Le rétroviseur intérieur doit être réglé pour voir l'ensemble de la lunette arrière sans bouger la tête, afin d'avoir la meilleure visibilité."
      },
      {
        q: "Quel est l'intérêt de la position nuit du rétroviseur intérieur ?",
        choices: ["Mieux voir la route la nuit", "Ne pas être ébloui par les feux du véhicule qui me suit", "Voir les panneaux de signalisation", "Augmenter le champ de vision"],
        correct: 1,
        explanation: "La position nuit permet de ne pas être ébloui par les phares du véhicule qui vous suit, tout en gardant une vision de l'arrière."
      },
      {
        q: "Quelle précaution prendre pour que les enfants installés à l'arrière ne puissent pas ouvrir leur portière ?",
        choices: ["Fermer les vitres arrière", "Actionner la sécurité enfant sur les deux portières arrière", "Mettre le verrouillage centralisé", "Attacher les enfants avec deux ceintures"],
        correct: 1,
        explanation: "La sécurité enfant, située sur la tranche des portières arrière, empêche l'ouverture de la portière depuis l'intérieur."
      },
      {
        q: "Comment doit-on ajuster la ceinture de sécurité pour qu'elle soit efficace ?",
        choices: ["La passer sous le bras pour plus de confort", "La placer sur l'os de la hanche et au milieu de l'épaule", "La serrer le plus possible", "La mettre uniquement sur autoroute"],
        correct: 1,
        explanation: "La ceinture doit passer sur l'os de la hanche (partie basse) et au milieu de l'épaule (partie haute) pour retenir correctement le corps en cas de choc."
      },
      {
        q: "Montrez le voyant signalant la mauvaise fermeture d'une portière. Quel risque cela représente-t-il ?",
        choices: ["Un risque de panne moteur", "Un risque d'ouverture de la portière en roulant", "Un risque de surchauffe", "Aucun risque particulier"],
        correct: 1,
        explanation: "Une portière mal fermée peut s'ouvrir en roulant, ce qui représente un danger grave pour les passagers et les autres usagers."
      },
      {
        q: "Quel est le rôle du témoin lumineux de la ceinture de sécurité ?",
        choices: ["Indiquer que la ceinture est usée", "Alerter que la ceinture du conducteur ou d'un passager n'est pas bouclée", "Signaler un problème de prétensionneur", "Indiquer que l'airbag est activé"],
        correct: 1,
        explanation: "Le voyant de ceinture s'allume et un signal sonore retentit lorsque le conducteur ou un passager n'a pas bouclé sa ceinture."
      },
      {
        q: "Avant de prendre la route, quels éléments de confort et sécurité devez-vous régler ?",
        choices: ["Uniquement les rétroviseurs", "Le siège, les rétroviseurs, l'appui-tête et la ceinture", "Seulement la ceinture de sécurité", "Le volant et l'autoradio"],
        correct: 1,
        explanation: "Avant de démarrer, il faut régler le siège, le volant, les rétroviseurs (intérieur et extérieurs), l'appui-tête et attacher la ceinture."
      },
      {
        q: "Quand doit-on porter la ceinture de sécurité ?",
        choices: ["Uniquement sur autoroute", "Uniquement si l'on roule vite", "À chaque trajet, même court", "Seulement le conducteur"],
        correct: 2,
        explanation: "La ceinture est obligatoire pour tous les occupants du véhicule, à chaque trajet, quelle que soit la distance ou la vitesse."
      },
      {
        q: "Pourquoi est-il dangereux de conduire avec un pare-brise sale ou endommagé ?",
        choices: ["Cela use les essuie-glaces", "Cela réduit la visibilité et peut provoquer des éblouissements", "Cela ralentit le véhicule", "Cela empêche la climatisation de fonctionner"],
        correct: 1,
        explanation: "Un pare-brise sale ou fissuré réduit considérablement la visibilité, surtout avec le soleil ou les phares de nuit qui créent des éblouissements."
      },
      {
        q: "Quel est le risque principal d'un airbag défectueux ?",
        choices: ["Le véhicule ne démarre pas", "En cas de choc, l'airbag ne se déclenchera pas pour protéger les occupants", "Les ceintures ne fonctionnent plus", "Le moteur peut caler"],
        correct: 1,
        explanation: "Si l'airbag est défectueux, il ne se déclenchera pas lors d'un accident et ne pourra pas protéger les occupants contre les chocs."
      },
      {
        q: "Où se situe généralement la commande de verrouillage centralisé des portières ?",
        choices: ["Sur le volant", "Sur la portière du conducteur ou la télécommande de clé", "Sous le siège passager", "Dans la boîte à gants"],
        correct: 1,
        explanation: "La commande de verrouillage centralisé se trouve généralement sur la portière du conducteur et sur la télécommande de la clé."
      }
    ]
  },
  {
    id: 2,
    title: "Voyants du tableau de bord",
    icon: "fas fa-tachometer-alt",
    color: "#ef4444",
    description: "Voyants d'alerte, niveaux, température, batterie",
    questions: [
      {
        q: "Quelles sont les précautions à prendre lors du remplissage du réservoir de carburant ?",
        choices: ["Laisser le moteur tourner", "Arrêter le moteur, ne pas fumer, ne pas téléphoner", "Remplir le réservoir à ras bord", "Garder les phares allumés"],
        correct: 1,
        explanation: "Lors du remplissage, il faut arrêter le moteur, ne pas fumer et ne pas téléphoner pour éviter tout risque d'incendie ou d'explosion."
      },
      {
        q: "Quelle peut être la conséquence d'une panne de dégivrage de la lunette arrière ?",
        choices: ["Une panne de chauffage", "Une insuffisance ou une absence de visibilité vers l'arrière", "Un dysfonctionnement des essuie-glaces", "Une surconsommation de carburant"],
        correct: 1,
        explanation: "Sans dégivrage, la lunette arrière peut rester embuée ou givrée, réduisant fortement la visibilité vers l'arrière."
      },
      {
        q: "Quelles sont les conditions à respecter pour contrôler ou compléter le niveau d'huile ?",
        choices: ["Moteur chaud et en pente", "Moteur froid et terrain plat", "Moteur en marche et terrain plat", "Peu importe les conditions"],
        correct: 1,
        explanation: "Le contrôle d'huile doit se faire moteur froid (pour que l'huile soit redescendue dans le carter) et sur terrain plat (pour une mesure fiable)."
      },
      {
        q: "Qu'est-ce qui peut provoquer la décharge de la batterie, moteur éteint ?",
        choices: ["Le frein à main serré", "Les feux ou accessoires électriques en fonctionnement", "Les pneus sous-gonflés", "Le liquide de refroidissement"],
        correct: 1,
        explanation: "Les feux, la radio ou tout accessoire électrique laissé en fonctionnement moteur éteint consomment la batterie et peuvent la décharger."
      },
      {
        q: "De quelle couleur est le voyant qui indique une défaillance du système de freinage ?",
        choices: ["Orange", "Vert", "Rouge", "Bleu"],
        correct: 2,
        explanation: "Le voyant de freinage est rouge car il signale un danger critique. Un voyant rouge impose un arrêt immédiat du véhicule."
      },
      {
        q: "Quel est le risque de circuler avec un frein de parking mal desserré ?",
        choices: ["Aucun risque", "Une dégradation du système de freinage", "Une panne de direction", "Un problème de climatisation"],
        correct: 1,
        explanation: "Rouler avec le frein de parking serré entraîne une surchauffe et une usure prématurée des freins, réduisant leur efficacité."
      },
      {
        q: "Quelle est la conséquence d'une température trop élevée du liquide de refroidissement ?",
        choices: ["Les vitres se couvrent de buée", "Une surchauffe ou une casse moteur", "Les freins deviennent plus efficaces", "La batterie se charge plus vite"],
        correct: 1,
        explanation: "Un liquide de refroidissement surchauffé ne refroidit plus le moteur correctement, ce qui peut entraîner une surchauffe ou une casse moteur."
      },
      {
        q: "Quelle est la différence entre un voyant orange et un voyant rouge ?",
        choices: ["Orange = danger, Rouge = information", "Orange = élément important, Rouge = anomalie ou danger", "Pas de différence", "Orange = feux de position, Rouge = feux de stop"],
        correct: 1,
        explanation: "Un voyant rouge signale une anomalie grave ou un danger (arrêt impératif). Un voyant orange signale un élément important nécessitant une attention."
      },
      {
        q: "Quel est le risque de maintenir les feux de route lors d'un croisement avec d'autres usagers ?",
        choices: ["Aucun risque", "Risque d'éblouissement des autres usagers", "Risque de panne de batterie", "Risque de surchauffe des phares"],
        correct: 1,
        explanation: "Les feux de route éblouissent les conducteurs venant en face, ce qui peut provoquer un accident. Il faut passer en feux de croisement."
      },
      {
        q: "À quelle fréquence est-il préconisé de vérifier la pression d'air des pneus ?",
        choices: ["Tous les 6 mois", "Une fois par mois", "Une fois par an", "Seulement avant un long trajet"],
        correct: 1,
        explanation: "Il est recommandé de vérifier la pression des pneus une fois par mois et avant chaque long trajet, à froid de préférence."
      },
      {
        q: "Pouvez-vous utiliser le feu de brouillard arrière par forte pluie ?",
        choices: ["Oui, toujours", "Non", "Oui, mais seulement sur autoroute", "Oui, si la visibilité est réduite à moins de 200 m"],
        correct: 1,
        explanation: "Le feu de brouillard arrière ne doit être utilisé qu'en cas de brouillard ou de chute de neige, jamais par forte pluie car il éblouit les conducteurs suivants."
      },
      {
        q: "Pourquoi doit-on régler la hauteur des feux ?",
        choices: ["Pour mieux éclairer la route", "Pour ne pas éblouir les autres usagers", "Pour économiser la batterie", "Pour éviter les contrôles de police"],
        correct: 1,
        explanation: "Le réglage de la hauteur des feux permet de ne pas éblouir les conducteurs en face tout en gardant un éclairage suffisant de la route."
      },
      {
        q: "Que signifie un voyant en forme de batterie qui s'allume sur le tableau de bord ?",
        choices: ["La batterie est pleine", "Un défaut de charge de la batterie", "Le moteur est froid", "Les phares sont allumés"],
        correct: 1,
        explanation: "Le voyant de batterie signale un problème dans le circuit de charge. L'alternateur ne recharge peut-être plus la batterie."
      },
      {
        q: "Que signifie le voyant d'huile moteur qui s'allume en rouge ?",
        choices: ["Le niveau d'huile est correct", "La pression d'huile est insuffisante, il faut s'arrêter immédiatement", "Il faut vidanger prochainement", "La température d'huile est idéale"],
        correct: 1,
        explanation: "Le voyant d'huile rouge indique une pression insuffisante. Il faut s'arrêter immédiatement pour éviter la casse du moteur."
      }
    ]
  },
  {
    id: 3,
    title: "Commandes du véhicule",
    icon: "fas fa-sliders-h",
    color: "#8b5cf6",
    description: "Essuie-glaces, avertisseur, régulateur, désembuage",
    questions: [
      {
        q: "Comment détecter l'usure des essuie-glaces en circulation ?",
        choices: ["Par le bruit qu'ils font", "Lorsqu'ils laissent des traces sur le pare-brise", "En les inspectant visuellement chaque mois", "Quand le lave-glace ne fonctionne plus"],
        correct: 1,
        explanation: "Des essuie-glaces usés laissent des traces, des traînées ou des zones non essuyées sur le pare-brise, réduisant la visibilité."
      },
      {
        q: "Citez 2 éléments complémentaires permettant un désembuage efficace.",
        choices: ["Klaxon et clignotants", "Ventilateur et commande air chaud ou climatisation", "Essuie-glaces et lave-glace", "Feux de route et feux de brouillard"],
        correct: 1,
        explanation: "Pour désembuer efficacement, il faut utiliser la commande de vitesse du ventilateur combinée à l'air chaud ou la climatisation."
      },
      {
        q: "Dans quel cas utilise-t-on les feux de détresse ?",
        choices: ["Pour stationner en double file", "En cas de panne, accident ou fort ralentissement", "Quand il pleut fort", "Pour remercier un autre conducteur"],
        correct: 1,
        explanation: "Les feux de détresse (warnings) s'utilisent en cas de panne, d'accident ou de fort ralentissement pour prévenir les autres usagers du danger."
      },
      {
        q: "Sans actionner la commande, comment désactiver rapidement le régulateur de vitesse ?",
        choices: ["En tournant le volant", "En appuyant sur le frein ou l'embrayage", "En éteignant les phares", "En changeant de station radio"],
        correct: 1,
        explanation: "Le régulateur de vitesse se désactive immédiatement en appuyant sur la pédale de frein ou d'embrayage."
      },
      {
        q: "Dans quel cas peut-on utiliser l'avertisseur sonore en agglomération ?",
        choices: ["Pour saluer quelqu'un", "En cas de danger immédiat", "Pour signaler un embouteillage", "À tout moment si nécessaire"],
        correct: 1,
        explanation: "En agglomération, l'avertisseur sonore (klaxon) ne doit être utilisé qu'en cas de danger immédiat, jamais par convenance ou impatience."
      },
      {
        q: "Quel peut être le risque de maintenir le recyclage de l'air de manière prolongée ?",
        choices: ["Une surconsommation de carburant", "Un risque de mauvaise visibilité par l'apparition de buée sur les surfaces vitrées", "Une panne de climatisation", "Aucun risque"],
        correct: 1,
        explanation: "Le recyclage prolongé de l'air empêche le renouvellement d'air frais, ce qui provoque l'apparition de buée sur les vitres et réduit la visibilité."
      },
      {
        q: "Quelle est l'utilité d'un limiteur de vitesse ?",
        choices: ["Maintenir une vitesse constante", "Ne pas dépasser la vitesse programmée par le conducteur", "Freiner automatiquement dans les virages", "Adapter la vitesse à la circulation"],
        correct: 1,
        explanation: "Le limiteur de vitesse empêche le véhicule de dépasser la vitesse maximale programmée, contrairement au régulateur qui maintient une vitesse constante."
      },
      {
        q: "Pour une bonne visibilité arrière, en plus de l'essuie-glace, quelle commande pouvez-vous actionner par temps de pluie ?",
        choices: ["Les feux de brouillard", "La commande de désembuage ou dégivrage arrière", "Les feux de recul", "Le lave-glace avant"],
        correct: 1,
        explanation: "La commande de désembuage (ou dégivrage) arrière permet d'éliminer la buée ou le givre sur la lunette arrière pour une meilleure visibilité."
      },
      {
        q: "Quelle est la différence entre le régulateur et le limiteur de vitesse ?",
        choices: ["Il n'y a pas de différence", "Le régulateur maintient la vitesse, le limiteur empêche de la dépasser", "Le limiteur maintient la vitesse, le régulateur freine", "Les deux maintiennent la vitesse"],
        correct: 1,
        explanation: "Le régulateur maintient automatiquement une vitesse constante. Le limiteur fixe une vitesse maximale que le conducteur ne peut pas dépasser."
      },
      {
        q: "Comment diriger l'air vers le pare-brise pour le désembuer ?",
        choices: ["En ouvrant les fenêtres", "En positionnant la commande d'orientation d'air vers le pare-brise", "En allumant les feux de route", "En accélérant"],
        correct: 1,
        explanation: "Il faut positionner la commande de ventilation pour diriger l'air vers le pare-brise, en utilisant de l'air chaud ou la climatisation."
      },
      {
        q: "Que faire si le voyant du liquide de lave-glace s'allume ?",
        choices: ["Rien, ce n'est pas grave", "Compléter le niveau de liquide lave-glace dès que possible", "Changer les essuie-glaces", "Aller au contrôle technique"],
        correct: 1,
        explanation: "Un manque de liquide lave-glace peut compromettre la visibilité en cas de salissure du pare-brise. Il faut le compléter rapidement."
      },
      {
        q: "À quoi sert la commande de réglage de hauteur des feux ?",
        choices: ["À éclairer les panneaux en hauteur", "À adapter l'inclinaison des feux selon la charge du véhicule pour ne pas éblouir", "À allumer les feux de route", "À activer l'éclairage intérieur"],
        correct: 1,
        explanation: "Quand le véhicule est chargé, l'arrière s'abaisse et les feux montent. Le correcteur permet d'ajuster pour ne pas éblouir."
      },
      {
        q: "Quand faut-il utiliser les feux de croisement ?",
        choices: ["Uniquement la nuit", "La nuit et lorsque la visibilité est insuffisante (pluie, brouillard, tunnel)", "Seulement en agglomération", "Uniquement sur autoroute"],
        correct: 1,
        explanation: "Les feux de croisement s'utilisent la nuit, mais aussi de jour lorsque la visibilité est réduite : pluie, brouillard, neige, tunnel."
      },
      {
        q: "Quels feux utiliser dans un tunnel éclairé ?",
        choices: ["Feux de route", "Feux de croisement", "Feux de position uniquement", "Aucun feu"],
        correct: 1,
        explanation: "Dans un tunnel, même éclairé, il faut allumer les feux de croisement pour être visible et voir correctement."
      }
    ]
  },
  {
    id: 4,
    title: "Sous le capot",
    icon: "fas fa-car-battery",
    color: "#f59e0b",
    description: "Huile, liquide de refroidissement, batterie, freins",
    questions: [
      {
        q: "Pourquoi est-il préférable d'utiliser un liquide lave-glace spécial en hiver ?",
        choices: ["Pour un meilleur nettoyage", "Pour éviter le gel du liquide", "Pour protéger les essuie-glaces", "Pour parfumer l'habitacle"],
        correct: 1,
        explanation: "En hiver, un liquide lave-glace classique peut geler dans le réservoir ou les canalisations. Le liquide spécial hiver contient un antigel."
      },
      {
        q: "Quelle est la conséquence d'un niveau insuffisant du liquide de frein ?",
        choices: ["Les freins deviennent plus réactifs", "Perte d'efficacité du freinage", "Le moteur cale", "Les essuie-glaces ralentissent"],
        correct: 1,
        explanation: "Un manque de liquide de frein entraîne une perte d'efficacité du freinage, ce qui est extrêmement dangereux."
      },
      {
        q: "Quel est le danger si l'on complète le niveau du liquide de refroidissement lorsque le moteur est chaud ?",
        choices: ["Le liquide va déborder", "Un risque de brûlure", "Le moteur va caler", "Le liquide ne sera pas efficace"],
        correct: 1,
        explanation: "Ouvrir le bouchon moteur chaud libère de la vapeur sous pression pouvant causer des brûlures graves."
      },
      {
        q: "Quel est le principal risque d'un manque d'huile moteur ?",
        choices: ["Une surconsommation de carburant", "Risque de détérioration ou casse du moteur", "Le moteur fait plus de bruit", "Les freins sont moins efficaces"],
        correct: 1,
        explanation: "L'huile lubrifie les pièces mécaniques du moteur. Un manque d'huile provoque des frottements excessifs pouvant détruire le moteur."
      },
      {
        q: "Quelle est la solution en cas de panne de batterie pour démarrer le véhicule sans le déplacer ?",
        choices: ["Attendre qu'elle se recharge seule", "Brancher une 2ème batterie en parallèle ou la remplacer", "Pousser le véhicule", "Appuyer plusieurs fois sur le démarreur"],
        correct: 1,
        explanation: "On peut brancher des câbles de démarrage entre la batterie à plat et une batterie chargée (les + ensemble et les - ensemble) ou remplacer la batterie."
      },
      {
        q: "En roulant, quel est le risque d'une mauvaise fermeture du capot ?",
        choices: ["Le moteur surchauffe", "Un risque d'ouverture pouvant provoquer un accident", "Le liquide de refroidissement fuit", "La batterie se décharge"],
        correct: 1,
        explanation: "Un capot mal fermé peut s'ouvrir brusquement en roulant, bloquant totalement la visibilité et provoquant un accident grave."
      },
      {
        q: "Quel est le principal risque d'une absence de liquide lave-glace ?",
        choices: ["L'usure des essuie-glaces", "Une mauvaise visibilité", "Un problème de freinage", "La surchauffe du moteur"],
        correct: 1,
        explanation: "Sans liquide lave-glace, impossible de nettoyer le pare-brise en cas de projection de boue ou d'insectes, réduisant dangereusement la visibilité."
      },
      {
        q: "À quoi sert le liquide de refroidissement ?",
        choices: ["À lubrifier le moteur", "À maintenir le moteur à bonne température", "À alimenter les essuie-glaces", "À freiner le véhicule"],
        correct: 1,
        explanation: "Le liquide de refroidissement circule dans le moteur pour absorber la chaleur et la dissiper via le radiateur, évitant la surchauffe."
      },
      {
        q: "Comment vérifier le niveau du liquide de frein ?",
        choices: ["En appuyant sur la pédale de frein", "En regardant le niveau entre les repères min et max sur le bocal transparent", "En écoutant le bruit des freins", "En vérifiant l'usure des plaquettes"],
        correct: 1,
        explanation: "Le bocal de liquide de frein est transparent avec des repères MIN et MAX. Le niveau doit se situer entre ces deux repères."
      },
      {
        q: "Quel est le rôle de l'alternateur ?",
        choices: ["Démarrer le moteur", "Recharger la batterie et alimenter les équipements électriques quand le moteur tourne", "Refroidir le moteur", "Filtrer l'huile"],
        correct: 1,
        explanation: "L'alternateur, entraîné par le moteur, produit du courant électrique pour recharger la batterie et alimenter les équipements du véhicule."
      },
      {
        q: "Où doit-on vérifier le niveau d'huile moteur ?",
        choices: ["Sur le tableau de bord", "Sur la jauge d'huile sous le capot", "Dans le filtre à huile", "Au niveau des roues"],
        correct: 1,
        explanation: "On vérifie le niveau d'huile en retirant la jauge située sous le capot. Le niveau doit se situer entre les repères MIN et MAX."
      },
      {
        q: "Que faire si le voyant de température moteur s'allume en rouge ?",
        choices: ["Continuer à rouler normalement", "S'arrêter dès que possible et laisser le moteur refroidir", "Accélérer pour ventiler le moteur", "Ajouter immédiatement de l'eau froide"],
        correct: 1,
        explanation: "Il faut s'arrêter rapidement et couper le moteur pour le laisser refroidir. Ne jamais ouvrir le bouchon du radiateur tant que le moteur est chaud."
      },
      {
        q: "Pourquoi faut-il vérifier les niveaux avant un long trajet ?",
        choices: ["Pour gagner du temps au péage", "Pour s'assurer du bon fonctionnement du véhicule et éviter les pannes", "Par obligation légale uniquement", "Pour économiser du carburant"],
        correct: 1,
        explanation: "Un long trajet sollicite davantage le véhicule. Vérifier les niveaux (huile, liquide de refroidissement, frein, lave-glace) prévient les pannes."
      },
      {
        q: "Quel est le risque d'un manque de liquide de refroidissement ?",
        choices: ["Le chauffage ne fonctionne plus", "La surchauffe et la casse du moteur", "Les freins sont moins efficaces", "La direction devient dure"],
        correct: 1,
        explanation: "Sans liquide de refroidissement suffisant, le moteur surchauffe rapidement et peut subir des dommages irréversibles (casse moteur)."
      }
    ]
  },
  {
    id: 5,
    title: "Pneumatiques & Extérieur",
    icon: "fas fa-tire",
    color: "#10b981",
    description: "Pneus, éclairage, plaques, carrosserie",
    questions: [
      {
        q: "Quelle est la profondeur minimale légale des sculptures d'un pneu ?",
        choices: ["1 mm", "1,6 mm", "2,5 mm", "3 mm"],
        correct: 1,
        explanation: "La profondeur minimale légale est de 1,6 mm. En dessous, le pneu est usé et doit être remplacé car l'adhérence est insuffisante."
      },
      {
        q: "Quel est le principal risque de rouler avec des pneus sous-gonflés ?",
        choices: ["Le véhicule consomme moins", "Un risque d'éclatement et une usure anormale", "Les freins sont plus efficaces", "Le confort est meilleur"],
        correct: 1,
        explanation: "Des pneus sous-gonflés surchauffent, s'usent de manière inégale et risquent d'éclater, surtout à haute vitesse."
      },
      {
        q: "Quel est le principal risque de rouler avec des pneus surgonflés ?",
        choices: ["Les pneus durent plus longtemps", "Une usure au centre de la bande de roulement et moins d'adhérence", "Le véhicule va plus vite", "Il n'y a aucun risque"],
        correct: 1,
        explanation: "Des pneus surgonflés s'usent au centre, offrent moins d'adhérence et réduisent le confort, augmentant les distances de freinage."
      },
      {
        q: "Où trouver les informations sur la pression recommandée des pneus ?",
        choices: ["Sur le tableau de bord", "Sur l'étiquette dans la portière du conducteur ou dans le manuel", "Sur les pneus eux-mêmes", "Au centre de contrôle technique"],
        correct: 1,
        explanation: "La pression recommandée est indiquée sur une étiquette dans l'encadrement de la portière conducteur et dans le carnet d'entretien du véhicule."
      },
      {
        q: "Les pneus du même essieu doivent-ils être identiques ?",
        choices: ["Non, ce n'est pas obligatoire", "Oui, ils doivent être de même marque, dimension et type", "Seulement sur l'essieu avant", "Seulement en hiver"],
        correct: 1,
        explanation: "Les pneus d'un même essieu doivent obligatoirement être identiques (même marque, dimension, structure et indice) pour garantir un comportement sûr."
      },
      {
        q: "Comment vérifier visuellement l'état d'un pneu ?",
        choices: ["En le touchant", "En vérifiant les témoins d'usure, l'absence de coupures et de déformations", "En le pesant", "En mesurant sa température"],
        correct: 1,
        explanation: "Il faut vérifier les témoins d'usure (petits plots dans les rainures), l'absence de coupures, hernies ou déformations sur les flancs."
      },
      {
        q: "Quel équipement est obligatoire dans le véhicule en cas de panne ?",
        choices: ["Une lampe de poche", "Un gilet haute visibilité et un triangle de présignalisation", "Une trousse de secours", "Un extincteur"],
        correct: 1,
        explanation: "Le gilet haute visibilité et le triangle de présignalisation sont obligatoires. Le gilet doit être enfilé avant de sortir du véhicule."
      },
      {
        q: "À quelle distance de la panne ou de l'accident doit-on placer le triangle de présignalisation ?",
        choices: ["10 mètres", "30 mètres", "50 mètres", "100 mètres"],
        correct: 1,
        explanation: "Le triangle doit être placé à environ 30 mètres de l'obstacle, ou avant un virage ou un sommet de côte pour être visible des autres usagers."
      },
      {
        q: "Quel équipement de sécurité doit être porté avant de quitter le véhicule en cas de panne ?",
        choices: ["Un casque", "Le gilet haute visibilité", "Des gants", "Un brassard réfléchissant"],
        correct: 1,
        explanation: "Le gilet haute visibilité doit être enfilé AVANT de sortir du véhicule pour être visible des autres conducteurs."
      },
      {
        q: "À quoi servent les catadioptres (réflecteurs) sur un véhicule ?",
        choices: ["À éclairer la route", "À rendre le véhicule visible en réfléchissant la lumière des autres", "À indiquer un changement de direction", "À mesurer la distance avec le véhicule suivant"],
        correct: 1,
        explanation: "Les catadioptres reflètent la lumière des phares des autres véhicules, rendant votre véhicule visible même phares éteints."
      },
      {
        q: "Pourquoi faut-il vérifier l'état et la propreté des feux avant un trajet de nuit ?",
        choices: ["Pour le contrôle technique", "Pour voir et être vu correctement", "Pour économiser la batterie", "Par simple habitude"],
        correct: 1,
        explanation: "Des feux sales ou défaillants réduisent l'éclairage et la visibilité du véhicule par les autres usagers, augmentant le risque d'accident."
      },
      {
        q: "Quand faut-il vérifier la pression des pneus ?",
        choices: ["Après un long trajet", "À froid, avant de rouler", "En roulant", "Uniquement au contrôle technique"],
        correct: 1,
        explanation: "La pression doit être vérifiée à froid (avant de rouler ou après moins de 3 km) car la chaleur augmente la pression et fausse la mesure."
      },
      {
        q: "Quel est le risque d'un éclairage défaillant à l'arrière du véhicule ?",
        choices: ["Une amende légère", "Ne pas être vu par les véhicules qui suivent, risque de collision", "Le moteur surchauffe", "Les freins sont moins efficaces"],
        correct: 1,
        explanation: "Un feu arrière défaillant rend le véhicule invisible aux conducteurs suivants, surtout la nuit, augmentant fortement le risque de collision."
      },
      {
        q: "Que doit-on vérifier sur la plaque d'immatriculation ?",
        choices: ["La couleur du fond", "Qu'elle est lisible, propre, non détériorée et bien fixée", "Le numéro de département", "La date de mise en circulation"],
        correct: 1,
        explanation: "La plaque doit être lisible, propre et correctement fixée. Une plaque illisible ou détériorée est passible d'une amende."
      }
    ]
  },
  {
    id: 6,
    title: "Premiers secours : Protéger & Alerter",
    icon: "fas fa-phone-alt",
    color: "#ec4899",
    description: "Protection, alerte des secours, numéros d'urgence, SAIP",
    questions: [
      {
        q: "Quels sont les numéros d'urgence à composer ?",
        choices: ["15 - 17 - 18 uniquement", "18 : pompiers - 15 : Samu - 112 : appels d'urgence européen", "112 uniquement", "17 : police - 119 : enfance"],
        correct: 1,
        explanation: "Les 3 numéros principaux sont : 18 (pompiers), 15 (Samu) et 112 (numéro d'urgence européen valide dans toute l'UE)."
      },
      {
        q: "Sur autoroute, comment indiquer avec précision les lieux de l'accident depuis un téléphone portable ?",
        choices: ["En décrivant le paysage", "En indiquant le numéro de l'autoroute, le sens de circulation et le point kilométrique", "En donnant le nom de la ville la plus proche", "En activant le GPS"],
        correct: 1,
        explanation: "Sur autoroute, les bornes kilométriques permettent de localiser précisément l'accident. Il faut indiquer le numéro de l'autoroute, le sens et le PK."
      },
      {
        q: "Pourquoi l'alerte auprès des services de secours doit-elle être rapide et précise ?",
        choices: ["Pour éviter une amende", "Pour permettre aux secours d'apporter les moyens adaptés dans le délai le plus court", "Pour informer la police", "Pour obtenir un numéro de dossier"],
        correct: 1,
        explanation: "Une alerte rapide et précise permet aux secours de venir avec les moyens adaptés (ambulance, pompiers, etc.) le plus vite possible."
      },
      {
        q: "Quelles sont les trois informations à transmettre aux services de secours ?",
        choices: ["Nom, prénom, adresse", "Numéro de téléphone, nature du problème, localisation précise", "Numéro de plaque, couleur du véhicule, marque", "Heure, lieu, nombre de véhicules"],
        correct: 1,
        explanation: "Il faut donner : votre numéro de téléphone, la nature du problème (accident, malaise...) et la localisation la plus précise possible."
      },
      {
        q: "Par quels moyens doit être réalisée l'alerte des secours ?",
        choices: ["Uniquement par téléphone portable", "Par téléphone portable, téléphone fixe ou borne d'appel d'urgence", "En allant directement aux urgences", "Par courrier recommandé"],
        correct: 1,
        explanation: "L'alerte peut être donnée par téléphone portable, téléphone fixe ou borne d'appel d'urgence (sur autoroute tous les 2 km)."
      },
      {
        q: "Pourquoi devez-vous attendre que votre correspondant des secours vous autorise à raccrocher ?",
        choices: ["Par politesse", "Car il peut nous conseiller ou nous guider dans les gestes à faire jusqu'à l'arrivée des secours", "Pour confirmer notre identité", "Pour enregistrer l'appel"],
        correct: 1,
        explanation: "Le correspondant peut avoir besoin d'informations complémentaires ou vous guider pour porter assistance à la victime en attendant les secours."
      },
      {
        q: "Comment vérifier la respiration d'une victime ?",
        choices: ["En lui prenant le pouls", "En regardant si le ventre et la poitrine se soulèvent et en sentant l'air à l'expiration", "En lui parlant fort", "En lui mettant un miroir devant la bouche"],
        correct: 1,
        explanation: "On vérifie la respiration en regardant si le ventre/la poitrine se soulèvent, en écoutant les bruits de respiration et en sentant l'air expiré."
      },
      {
        q: "Si un dégagement d'urgence de la victime est nécessaire, où doit-elle être placée ?",
        choices: ["Sur le bord de la route", "Dans un endroit suffisamment éloigné du danger et de ses conséquences", "Dans le véhicule accidenté", "N'importe où"],
        correct: 1,
        explanation: "La victime doit être déplacée dans un endroit sûr, éloigné du danger (incendie, explosion, trafic) tout en respectant l'axe tête-cou-tronc."
      },
      {
        q: "Dans quelle situation peut-on déplacer une victime ?",
        choices: ["Quand elle le demande", "En présence d'un danger réel, immédiat et incontrôlable", "Quand les secours tardent", "Toujours pour la mettre à l'aise"],
        correct: 1,
        explanation: "On ne déplace une victime qu'en présence d'un danger réel, immédiat et incontrôlable (incendie, explosion imminente). Ce geste doit rester exceptionnel."
      },
      {
        q: "Citez trois manières d'évaluer l'état de conscience d'une victime.",
        choices: ["Vérifier le pouls, la température, la tension", "Lui poser des questions simples, lui secouer doucement les épaules, lui demander de serrer la main", "Regarder ses pupilles, prendre son pouls, écouter sa respiration", "L'asperger d'eau, la gifler, crier"],
        correct: 1,
        explanation: "Pour évaluer la conscience : poser des questions simples (comment vous appelez-vous ?), secouer doucement les épaules, demander de serrer la main."
      },
      {
        q: "Quels comportements adopter en cas de diffusion du signal d'alerte SAIP ?",
        choices: ["Sortir pour voir ce qui se passe", "Se mettre en sécurité, s'informer via les médias et respecter les consignes des autorités", "Appeler immédiatement le 112", "Prendre sa voiture pour fuir"],
        correct: 1,
        explanation: "En cas d'alerte SAIP : se mettre en sécurité (se confiner), s'informer via Radio France/France Télévision, respecter les consignes des autorités."
      },
      {
        q: "Comment est composé le signal d'alerte national SAIP diffusé par les sirènes ?",
        choices: ["Un signal continu de 2 minutes", "Une variation du signal sur 3 cycles successifs", "Trois coups brefs", "Un signal intermittent de 5 minutes"],
        correct: 1,
        explanation: "Le signal national d'alerte est une variation du signal sur 3 cycles successifs (montée et descente du son). Le signal de fin d'alerte est un signal continu."
      },
      {
        q: "Comment est diffusée l'alerte SAIP ?",
        choices: ["Uniquement par sirènes", "Par sirènes, médias (Radio France, France Télévision) et l'application SAIP", "Uniquement par SMS", "Par les réseaux sociaux"],
        correct: 1,
        explanation: "L'alerte SAIP est diffusée par les sirènes, les médias officiels (Radio France, France Télévision) et l'application mobile SAIP."
      },
      {
        q: "Quel est l'objectif du signal d'Alerte et d'Information aux Populations (SAIP) ?",
        choices: ["Annoncer la fin d'un danger", "Avertir la population d'un danger imminent ou qu'un évènement grave est en cours", "Tester les sirènes chaque mois", "Signaler un embouteillage"],
        correct: 1,
        explanation: "Le SAIP a pour objectif d'avertir la population d'un danger imminent ou qu'un événement grave (attentat, catastrophe naturelle) est en train de se produire."
      }
    ]
  },
  {
    id: 7,
    title: "Premiers secours : Secourir",
    icon: "fas fa-first-aid",
    color: "#dc2626",
    description: "PLS, arrêt cardiaque, hémorragie, défibrillateur",
    questions: [
      {
        q: "Qu'est-ce qu'un défibrillateur automatisé externe (DAE) ?",
        choices: ["Un appareil pour mesurer la tension", "Un appareil qui peut permettre de rétablir une activité cardiaque normale", "Un outil pour arrêter une hémorragie", "Un masque de respiration"],
        correct: 1,
        explanation: "Le DAE est un appareil qui analyse le rythme cardiaque et, si nécessaire, délivre un choc électrique pour rétablir un rythme normal."
      },
      {
        q: "Qu'est-ce qu'une perte de connaissance ?",
        choices: ["La victime dort profondément", "La victime ne répond pas et ne réagit pas mais respire", "La victime a les yeux fermés", "La victime ne se souvient plus de l'accident"],
        correct: 1,
        explanation: "Une perte de connaissance se définit par une victime qui ne répond pas aux questions, ne réagit pas aux stimulations, mais respire normalement."
      },
      {
        q: "Comment arrêter une hémorragie ?",
        choices: ["Mettre un garrot immédiatement", "Appuyer fortement sur l'endroit qui saigne avec les doigts ou la paume en mettant un tissu propre", "Surélever le membre blessé", "Mettre de l'eau froide sur la plaie"],
        correct: 1,
        explanation: "Il faut appuyer fortement et directement sur l'endroit qui saigne avec les doigts ou la paume de la main, en interposant un tissu propre."
      },
      {
        q: "Dans quel cas peut-on positionner une victime en position latérale de sécurité (PLS) ?",
        choices: ["Quand elle a mal au dos", "Si la victime ne répond pas, ne réagit pas et respire", "Quand elle saigne", "Quand elle est consciente mais fatiguée"],
        correct: 1,
        explanation: "La PLS s'applique uniquement si la victime est inconsciente (ne répond pas, ne réagit pas) mais respire. Cela évite l'étouffement."
      },
      {
        q: "À partir de quel âge peut-on suivre une formation aux premiers secours ?",
        choices: ["14 ans", "10 ans", "12 ans", "16 ans"],
        correct: 1,
        explanation: "Dès 10 ans, on peut suivre une formation aux premiers secours (PSC1). C'est un geste citoyen accessible à tous."
      },
      {
        q: "Pourquoi faut-il pratiquer immédiatement une réanimation cardio-pulmonaire sur une victime en arrêt cardiaque ?",
        choices: ["Pour la réchauffer", "Car les lésions du cerveau surviennent dès les premières minutes par manque d'oxygène", "Pour attendre les secours", "Pour vérifier si elle respire"],
        correct: 1,
        explanation: "Le cerveau ne supporte pas plus de 3 à 5 minutes sans oxygène. La réanimation immédiate permet de maintenir un flux sanguin minimal vers le cerveau."
      },
      {
        q: "Quels sont les risques pour une personne inconsciente allongée sur le dos ?",
        choices: ["Elle va se réveiller", "L'arrêt respiratoire et l'arrêt cardiaque", "Elle va avoir froid", "Aucun risque particulier"],
        correct: 1,
        explanation: "Une personne inconsciente sur le dos risque que sa langue ou ses vomissements obstruent les voies aériennes, entraînant un arrêt respiratoire puis cardiaque."
      },
      {
        q: "L'utilisation d'un défibrillateur sur une personne qui n'est pas en arrêt cardiaque présente-t-elle un risque ?",
        choices: ["Oui, cela peut provoquer un arrêt cardiaque", "Non, car le défibrillateur est automatisé et ne se déclenche que si nécessaire", "Oui, cela provoque des brûlures", "On ne sait pas"],
        correct: 1,
        explanation: "Le DAE analyse automatiquement le rythme cardiaque et ne délivre un choc que si c'est nécessaire. Il n'y a donc aucun risque pour une personne non en arrêt."
      },
      {
        q: "Qu'est-ce qu'une hémorragie ?",
        choices: ["Un simple saignement de nez", "Une perte de sang prolongée qui ne s'arrête pas et imbibe un mouchoir en quelques secondes", "Un bleu ou un hématome", "Une coupure superficielle"],
        correct: 1,
        explanation: "Une hémorragie est un saignement abondant qui ne s'arrête pas spontanément. Le sang imbibe un mouchoir en quelques secondes."
      },
      {
        q: "Quels sont les risques pour une victime d'hémorragie ?",
        choices: ["Un simple malaise", "Une détresse circulatoire ou un arrêt cardiaque", "Un mal de tête", "Une infection seulement"],
        correct: 1,
        explanation: "Une hémorragie non contrôlée entraîne une perte de sang importante pouvant provoquer une détresse circulatoire (choc) puis un arrêt cardiaque."
      },
      {
        q: "Quels sont les signes d'un arrêt cardiaque ?",
        choices: ["La victime a mal à la poitrine", "La victime ne répond pas, ne réagit pas et ne respire pas ou a une respiration anormale", "La victime transpire beaucoup", "La victime a les yeux ouverts"],
        correct: 1,
        explanation: "L'arrêt cardiaque se reconnaît par l'absence de réponse, l'absence de réaction ET l'absence de respiration (ou une respiration anormale/gasps)."
      },
      {
        q: "Qu'est-ce qu'un arrêt cardiaque ?",
        choices: ["Un ralentissement du cœur", "Le cœur ne fonctionne plus ou fonctionne de façon anarchique", "Une crise d'angoisse", "Un essoufflement"],
        correct: 1,
        explanation: "L'arrêt cardiaque signifie que le cœur a cessé de battre efficacement ou bat de manière anarchique (fibrillation), empêchant la circulation du sang."
      },
      {
        q: "Quel est le risque principal d'un arrêt cardiaque sans intervention des secours ?",
        choices: ["Un handicap léger", "La mort de la victime qui survient en quelques minutes", "La victime se réveille seule", "Un simple malaise"],
        correct: 1,
        explanation: "Sans réanimation, la mort survient en quelques minutes. Chaque minute sans massage cardiaque réduit de 10% les chances de survie."
      },
      {
        q: "Quels comportements adopter en présence d'une victime inconsciente qui respire ?",
        choices: ["La secouer pour la réveiller", "La placer en PLS, alerter les secours, surveiller sa respiration", "Lui donner de l'eau", "Attendre qu'elle se réveille"],
        correct: 1,
        explanation: "Il faut : 1) Placer la victime en Position Latérale de Sécurité 2) Alerter les secours (15 ou 112) 3) Surveiller sa respiration jusqu'à leur arrivée."
      }
    ]
  }
];
