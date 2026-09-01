(function () {
    const replacements = [
        [/Ã‰/g, '\u00c9'], [/Ãˆ/g, '\u00c8'], [/ÃŠ/g, '\u00ca'], [/Ã‹/g, '\u00cb'],
        [/Ã€/g, '\u00c0'], [/Ã‚/g, '\u00c2'], [/Ã‡/g, '\u00c7'], [/Ã”/g, '\u00d4'],
        [/Ãœ/g, '\u00dc'], [/Ã™/g, '\u00d9'], [/Ã›/g, '\u00db'], [/ÃŽ/g, '\u00ce'],
        [/Ã¯/g, '\u00ef'], [/Ã®/g, '\u00ee'], [/Ã´/g, '\u00f4'], [/Ã¶/g, '\u00f6'],
        [/Ã¹/g, '\u00f9'], [/Ã»/g, '\u00fb'], [/Ã¼/g, '\u00fc'], [/Ã§/g, '\u00e7'],
        [/Ã /g, '\u00e0'], [/Ã¢/g, '\u00e2'], [/Ãª/g, '\u00ea'], [/Ã¨/g, '\u00e8'],
        [/Ã©/g, '\u00e9'], [/Ã«/g, '\u00eb'], [/Ã±/g, '\u00f1'], [/Â°/g, '\u00b0'],
        [/Â€/g, '\u20ac'], [/Â /g, ' '], [/â€™/g, '\u2019'], [/â€œ/g, '\u201c'],
        [/â€\u009d/g, '\u201d'], [/â€“/g, '\u2013'], [/â€”/g, '\u2014'],
        [/â†’/g, '\u2192'], [/âœ“/g, '\u2713'], [/âœ…/g, '\u2705'],
        [/âŒ/g, '\u274c'], [/âš /g, '\u26a0'], [/â„–/g, 'N\u00b0'],

        [/\bD\?tails\b/g, 'D\u00e9tails'],
        [/\bd\?tails\b/g, 'd\u00e9tails'],
        [/\bCR\?NEAU\b/g, 'CR\u00c9NEAU'],
        [/\bCr\?neau\b/g, 'Cr\u00e9neau'],
        [/\bcr\?neau\b/g, 'cr\u00e9neau'],
        [/\bCR\?NEAUX\b/g, 'CR\u00c9NEAUX'],
        [/\bCr\?neaux\b/g, 'Cr\u00e9neaux'],
        [/\bcr\?neaux\b/g, 'cr\u00e9neaux'],
        [/\bPR\?NOM\b/g, 'PR\u00c9NOM'],
        [/\bPr\?nom\b/g, 'Pr\u00e9nom'],
        [/\bpr\?nom\b/g, 'pr\u00e9nom'],
        [/\bT\?L\?PHONE\b/g, 'T\u00c9L\u00c9PHONE'],
        [/\bT\?l\?phone\b/g, 'T\u00e9l\u00e9phone'],
        [/\bt\?l\?phone\b/g, 't\u00e9l\u00e9phone'],
        [/\bR\?SERV\?\b/g, 'R\u00c9SERV\u00c9'],
        [/\bR\?serv\?\b/g, 'R\u00e9serv\u00e9'],
        [/\br\?serv\?\b/g, 'r\u00e9serv\u00e9'],
        [/\bR\?servation\b/g, 'R\u00e9servation'],
        [/\br\?servation\b/g, 'r\u00e9servation'],
        [/\bR\?alis\?\b/g, 'R\u00e9alis\u00e9'],
        [/\br\?alis\?\b/g, 'r\u00e9alis\u00e9'],
        [/\bS\?ANCES\b/g, 'S\u00c9ANCES'],
        [/\bS\?ance\b/g, 'S\u00e9ance'],
        [/\bs\?ance\b/g, 's\u00e9ance'],
        [/\bS\?ances\b/g, 'S\u00e9ances'],
        [/\bs\?ances\b/g, 's\u00e9ances'],
        [/\bLib\?r\?\b/g, 'Lib\u00e9r\u00e9'],
        [/\blib\?r\?\b/g, 'lib\u00e9r\u00e9'],
        [/\brecr\?dit\?e\b/g, 'recr\u00e9dit\u00e9e'],
        [/\brecr\?dit\?\b/g, 'recr\u00e9dit\u00e9'],
        [/\bEffectu\?\b/g, 'Effectu\u00e9'],
        [/\beffectu\?\b/g, 'effectu\u00e9'],
        [/\bAjout\?\b/g, 'Ajout\u00e9'],
        [/\bajout\?\b/g, 'ajout\u00e9'],
        [/\bR\?cup\?ration\b/g, 'R\u00e9cup\u00e9ration'],
        [/\br\?cup\?ration\b/g, 'r\u00e9cup\u00e9ration'],
        [/\bR\?cup\?rer\b/g, 'R\u00e9cup\u00e9rer'],
        [/\br\?cup\?rer\b/g, 'r\u00e9cup\u00e9rer'],
        [/\bD\?j\?\b/g, 'D\u00e9j\u00e0'],
        [/\bd\?j\?\b/g, 'd\u00e9j\u00e0'],
        [/\bsucc\?s\b/g, 'succ\u00e8s'],
        [/\bm\?me\b/g, 'm\u00eame'],
        [/\bapr\?s\b/g, 'apr\u00e8s'],
        [/\btr\?s\b/g, 'tr\u00e8s'],
        [/\bc\?t\?\b/g, 'c\u00f4t\u00e9'],
        [/\bqualit\?\b/g, 'qualit\u00e9'],
        [/\bauto-\?cole\b/gi, 'auto-\u00e9cole'],
        [/\b\?quipe\b/g, '\u00e9quipe'],
        [/\bl'\?quipe\b/g, 'l\u2019\u00e9quipe'],
        [/\b\?l\?ve\b/g, '\u00e9l\u00e8ve'],
        [/\b\?l\?ves\b/g, '\u00e9l\u00e8ves'],
        [/l'\?l\?ve/g, 'l\u2019\u00e9l\u00e8ve'],
        [/d'\?l\?ve/g, 'd\u2019\u00e9l\u00e8ve'],
        [/\? ajouter/g, '\u00e0 ajouter'],
        [/\? l'\?l\?ve/g, '\u00e0 l\u2019\u00e9l\u00e8ve'],
        [/\? l\u2019\u00e9l\u00e8ve/g, '\u00e0 l\u2019\u00e9l\u00e8ve'],

        [/\?Ys-\s*/g, ''],
        [/\?YsT\s*/g, ''],
        [/\bMyl\?ne\b/g, 'Myl\u00e8ne'],
        [/\bmyl\?ne\b/g, 'myl\u00e8ne'],
        [/\bNon renseign\?e\b/g, 'Non renseign\u00e9e'],
        [/\bNon renseign\?\b/g, 'Non renseign\u00e9'],
        [/\bnon renseign\?e\b/g, 'non renseign\u00e9e'],
        [/\bnon renseign\?\b/g, 'non renseign\u00e9'],
        [/\bNon d\?fini\b/g, 'Non d\u00e9fini'],
        [/\bNum\?ro\b/g, 'Num\u00e9ro'],
        [/\bnum\?ro\b/g, 'num\u00e9ro'],
        [/\bInformations compl\?tes\b/g, 'Informations compl\u00e8tes'],
        [/\bRepr\?sentant l\?gal\b/g, 'Repr\u00e9sentant l\u00e9gal'],
        [/\bPermis invalid\?\b/g, 'Permis invalid\u00e9'],
        [/\bH\?berg\?\(e\)/g, 'H\u00e9berg\u00e9(e)'],
        [/\bValid\?e\b/g, 'Valid\u00e9e'],
        [/\bvalid\?e\b/g, 'valid\u00e9e'],
        [/\bRefus\?e\b/g, 'Refus\u00e9e'],
        [/\brefus\?e\b/g, 'refus\u00e9e'],
        [/\bAnnul\?e\b/g, 'Annul\u00e9e'],
        [/\bannul\?e\b/g, 'annul\u00e9e'],
        [/\benregistr\?e\b/g, 'enregistr\u00e9e'],
        [/\bEnregistr\?e\b/g, 'Enregistr\u00e9e'],
        [/\br\?alis\?es\b/g, 'r\u00e9alis\u00e9es'],
        [/\bR\?alis\?es\b/g, 'R\u00e9alis\u00e9es'],
        [/\beffectu\?es\b/g, 'effectu\u00e9es'],
        [/\bEffectu\?es\b/g, 'Effectu\u00e9es'],
        [/\bTelecharger\b/g, 'T\u00e9l\u00e9charger'],
        [/\bT\?l\?charger\b/g, 'T\u00e9l\u00e9charger'],
        [/\br\?sultat\b/g, 'r\u00e9sultat'],
        [/\bR\?sultat\b/g, 'R\u00e9sultat'],
        [/\bdifferent\b/g, 'diff\u00e9rent'],
        [/\bdemandee\b/g, 'demand\u00e9e'],
        [/\bApr\?s\b/g, 'Apr\u00e8s'],
        [/\bforfait \?puis\?\b/g, 'forfait \u00e9puis\u00e9'],
        [/\bv\?hicule\b/g, 'v\u00e9hicule'],
        [/\bV\?hicule\b/g, 'V\u00e9hicule'],
        [/\bVehicule\b/g, 'V\u00e9hicule'],
        [/\bseance\b/g, 's\u00e9ance'],
        [/\bSeance\b/g, 'S\u00e9ance'],
        [/\bpr\?senter\b/g, 'pr\u00e9senter'],
        [/\bPr\?senter\b/g, 'Pr\u00e9senter'],
        [/\bcontr\?le\b/g, 'contr\u00f4le'],
        [/\bContr\?le\b/g, 'Contr\u00f4le'],
        [/\bs\?curit\?\b/g, 's\u00e9curit\u00e9'],
        [/\bS\?curit\?\b/g, 'S\u00e9curit\u00e9'],
        [/\bvisibilit\?\b/g, 'visibilit\u00e9'],
        [/\bd\?lai\b/g, 'd\u00e9lai'],
        [/\bD\?lai\b/g, 'D\u00e9lai'],
        [/\b\?tre\b/g, '\u00eatre'],
        [/\bEtre\b/g, '\u00catre'],
        [/\bsi\?ge\b/g, 'si\u00e8ge'],
        [/\barri\?re\b/g, 'arri\u00e8re'],
        [/\bporti\?re\b/g, 'porti\u00e8re'],
        [/\bint\?rieur\b/g, 'int\u00e9rieur'],
        [/\bfr\?quence\b/g, 'fr\u00e9quence'],
        [/\bpr\?conis\?\b/g, 'pr\u00e9conis\u00e9'],
        [/\bv\?rifier\b/g, 'v\u00e9rifier'],
        [/\bV\?rifier\b/g, 'V\u00e9rifier'],
        [/\br\?servoir\b/g, 'r\u00e9servoir'],
        [/\bl\?gale\b/g, 'l\u00e9gale'],
        [/\bpr\?caution\b/g, 'pr\u00e9caution'],
        [/\bpr\?cise\b/g, 'pr\u00e9cise'],
        [/\bm\?dias\b/g, 'm\u00e9dias'],
        [/\bsir\?nes\b/g, 'sir\u00e8nes'],
        [/\br\?seaux\b/g, 'r\u00e9seaux'],
        [/\bd\?gagement\b/g, 'd\u00e9gagement'],
        [/\bD\?gagement\b/g, 'D\u00e9gagement'],
        [/\br\?aliser\b/g, 'r\u00e9aliser'],
        [/\bR\?aliser\b/g, 'R\u00e9aliser'],
        [/\br\?alis\?e\b/g, 'r\u00e9alis\u00e9e'],
        [/\br\?alis\?\b/g, 'r\u00e9alis\u00e9'],
        [/\br\?el\b/g, 'r\u00e9el'],
        [/\bimm\?diat\b/g, 'imm\u00e9diat'],
        [/\bg\?ne\b/g, 'g\u00eane'],
        [/\bpr\?venir\b/g, 'pr\u00e9venir'],
        [/\bpr\?signalisation\b/g, 'pr\u00e9signalisation'],
        [/\b\?clairantes\b/g, '\u00e9clairantes'],
        [/\bd\?sactiver\b/g, 'd\u00e9sactiver'],
        [/\bd\?clenchement\b/g, 'd\u00e9clenchement'],
        [/\bd\?partement\b/g, 'd\u00e9partement'],
        [/\bD\?partement\b/g, 'D\u00e9partement'],
        [/\bcr\?puscule\b/g, 'cr\u00e9puscule'],
        [/\bCr\?er\b/g, 'Cr\u00e9er'],
        [/\bcr\?ant\b/g, 'cr\u00e9ant'],
        [/\br\?sistance\b/g, 'r\u00e9sistance'],
        [/\bstationn\?\b/g, 'stationn\u00e9'],
        [/\bman\?uvre\b/g, 'man\u0153uvre'],
        [/\bman\?uvres\b/g, 'man\u0153uvres'],
        [/\bn\?cessaire\b/g, 'n\u00e9cessaire'],
        [/\bN\?cessaire\b/g, 'N\u00e9cessaire'],
        [/\b\?troite\b/g, '\u00e9troite'],
        [/\bpriorit\?s\b/g, 'priorit\u00e9s'],
        [/\bt\?l\?phoner\b/g, 't\u00e9l\u00e9phoner'],
        [/\bT\?l\?phoner\b/g, 'T\u00e9l\u00e9phoner'],
        [/\bkilom\?trique\b/g, 'kilom\u00e9trique'],
        [/\b\?co-conduite\b/g, '\u00e9co-conduite'],
        [/\b\? atteindre\b/g, '\u00e0 atteindre'],
        [/\b\? transmettre\b/g, '\u00e0 transmettre'],
        [/\b\? 5\b/g, '\u00e0 5'],
        [/\b\? l'aube\b/g, '\u00e0 l\u2019aube'],
        [/\b\?toiles\b/g, '\u00e9toiles'],
        [/\bexp\?rience\b/g, 'exp\u00e9rience'],
        [/\badministration\b/g, 'administration'],
        [/l\?administration/g, 'l\u2019administration'],
        [/J\?ai/g, 'J\u2019ai'],
        [/j\?ai/g, 'j\u2019ai'],
        [/l\?ayant/g, 'l\u2019ayant'],
        [/\b\?tait\b/g, '\u00e9tait'],
        [/\b\?tait\b/g, '\u00e9tait'],
        [/\br\?ellement\b/g, 'r\u00e9ellement'],
        [/\bp\?dagogues\b/g, 'p\u00e9dagogues'],
        [/\bpersonnalis\?\b/g, 'personnalis\u00e9'],
        [/\bGr\?ce\b/g, 'Gr\u00e2ce'],
        [/\bgr\?ce\b/g, 'gr\u00e2ce'],
        [/\bdisponibilit\?\b/g, 'disponibilit\u00e9'],
        [/\br\?ussir\b/g, 'r\u00e9ussir'],
        [/\bR\?ussir\b/g, 'R\u00e9ussir'],
        [/\br\?ussite\b/g, 'r\u00e9ussite'],
        [/\bv\?ritable\b/g, 'v\u00e9ritable'],
        [/\br\?pondre\b/g, 'r\u00e9pondre'],
        [/\bR\?pondre\b/g, 'R\u00e9pondre'],
        [/\bg\?rer\b/g, 'g\u00e9rer'],
        [/\bG\?rer\b/g, 'G\u00e9rer'],
        [/\bR\?solu\b/g, 'R\u00e9solu'],
        [/\br\?solu\b/g, 'r\u00e9solu'],
        [/\bPubli\?s\b/g, 'Publi\u00e9s'],
        [/\bRejet\?s\b/g, 'Rejet\u00e9s'],
        [/\bconnect\?\b/g, 'connect\u00e9'],
        [/\bconnect\?e\b/g, 'connect\u00e9e']
    ];

    function fixText(value) {
        if (!value || typeof value !== 'string') return value;
        let fixed = value;
        for (const [pattern, replacement] of replacements) {
            fixed = fixed.replace(pattern, replacement);
        }
        return fixed;
    }

    function fixTextNode(node) {
        const fixed = fixText(node.nodeValue);
        if (fixed !== node.nodeValue) node.nodeValue = fixed;
    }

    function fixElementAttributes(element) {
        for (const attr of ['title', 'placeholder', 'aria-label', 'alt']) {
            if (!element.hasAttribute?.(attr)) continue;
            const current = element.getAttribute(attr);
            const fixed = fixText(current);
            if (fixed !== current) element.setAttribute(attr, fixed);
        }
    }

    function walk(root) {
        if (!root) return;
        if (root.nodeType === Node.TEXT_NODE) {
            fixTextNode(root);
            return;
        }
        if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) {
            return;
        }
        if (root.nodeType === Node.ELEMENT_NODE) fixElementAttributes(root);
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        let node = walker.nextNode();
        while (node) {
            if (node.nodeType === Node.TEXT_NODE) fixTextNode(node);
            else fixElementAttributes(node);
            node = walker.nextNode();
        }
    }

    function start() {
        walk(document.body || document.documentElement);
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(walk);
                if (mutation.type === 'characterData') fixTextNode(mutation.target);
                if (mutation.type === 'attributes') fixElementAttributes(mutation.target);
            }
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['title', 'placeholder', 'aria-label', 'alt']
        });
        window.fixTextEncoding = walk;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
