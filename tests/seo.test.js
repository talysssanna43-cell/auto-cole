const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'seo', 'pages.json'), 'utf8'));

function visibleText(html) {
    return html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&eacute;/gi, 'é')
        .replace(/&egrave;/gi, 'è')
        .replace(/&agrave;/gi, 'à')
        .replace(/&ocirc;/gi, 'ô')
        .replace(/&icirc;/gi, 'î')
        .replace(/&amp;/gi, '&')
        .replace(/\s+/g, ' ')
        .trim();
}

test('chaque page SEO possède un titre, une description, une canonical et un seul H1', () => {
    const titles = new Set();
    const descriptions = new Set();
    for (const page of config.pages) {
        const html = fs.readFileSync(path.join(root, page.file), 'utf8');
        assert.equal((html.match(/<h1\b/gi) || []).length, 1, `${page.file}: H1`);
        assert.match(html, new RegExp(`<title>${page.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</title>`));
        const description = html.match(/<meta name="description" content="([^"]{80,180})">/)?.[1];
        assert.ok(description, `${page.file}: description`);
        assert.match(html, new RegExp(`<link rel="canonical" href="${config.site.baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
        assert.equal((html.match(/application\/ld\+json/gi) || []).length, 1, `${page.file}: JSON-LD`);
        assert.ok(!titles.has(page.title), `${page.file}: titre dupliqué`);
        assert.ok(!descriptions.has(description), `${page.file}: description dupliquée`);
        titles.add(page.title);
        descriptions.add(description);
    }
});

test('les données structurées locales sont valides sur toutes les pages', () => {
    for (const page of config.pages) {
        const html = fs.readFileSync(path.join(root, page.file), 'utf8');
        const source = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
        assert.ok(source, `${page.file}: JSON-LD absent`);
        const schema = JSON.parse(source);
        const graph = schema['@graph'] || [];
        const business = graph.find((item) => item['@type'] === 'LocalBusiness');
        assert.equal(business?.telephone, config.site.telephone, `${page.file}: téléphone structuré`);
        assert.equal(business?.address?.streetAddress, config.site.streetAddress, `${page.file}: adresse structurée`);
        assert.equal(business?.address?.postalCode, config.site.postalCode, `${page.file}: code postal structuré`);
        const offers = business?.hasOfferCatalog?.itemListElement || [];
        assert.equal(offers.length, config.site.services.length, `${page.file}: catalogue de formations`);
        assert.deepEqual(
            offers.map((offer) => offer.itemOffered?.name),
            config.site.services.map((service) => service.name),
            `${page.file}: noms des formations`
        );
    }
});

test('les H1 reprennent les intentions de recherche définies', () => {
    for (const page of config.pages) {
        const html = fs.readFileSync(path.join(root, page.file), 'utf8');
        const h1 = visibleText((html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i) || [''])[0]).toLocaleLowerCase('fr');
        for (const term of page.h1Includes) {
            assert.ok(h1.includes(term.toLocaleLowerCase('fr')), `${page.file}: H1 sans "${term}"`);
        }
    }
});

test('aucune URL de production ne dépend de l’ancien domaine inexistant', () => {
    const files = config.pages.map((page) => page.file).concat([
        'assets/js/site-footer.js',
        'scripts/vapi-assistant-config.js',
        'netlify/functions/vapi-webhook.js'
    ]);
    for (const file of files) {
        const content = fs.readFileSync(path.join(root, file), 'utf8');
        assert.doesNotMatch(content, /https:\/\/auto-ecole-breteuil\.fr/i, file);
    }
});

test('le sitemap ne contient que les URLs publiques configurées', () => {
    const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
    const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
    assert.deepEqual(urls, config.pages.map((page) => `${config.site.baseUrl}${page.path}`));
    assert.doesNotMatch(sitemap, /admin-|espace-|connexion|test-/);
});

test('l’accueil répond aux informations locales essentielles', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const text = visibleText(html);
    for (const expected of [
        '1A rue Édouard Delanglade',
        '13006 Marseille',
        'Castellane',
        'Préfecture',
        'Lodi',
        'Vauban',
        'Notre-Dame-du-Mont',
        'Lun-Ven 17h-19h',
        'Lun-Sam 7h-19h',
        'boîte manuelle',
        'boîte automatique',
        'conduite accompagnée',
        'formation accélérée'
    ]) {
        assert.ok(text.toLocaleLowerCase('fr').includes(expected.toLocaleLowerCase('fr')), `accueil sans ${expected}`);
    }
    for (const href of ['tel:+33491533698', 'devis.html', 'inscription.html', 'tarifs.html', 'avis.html']) {
        assert.match(html, new RegExp(`href=["']${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), `accueil sans lien ${href}`);
    }
});

test('les liens internes des pages SEO pointent vers des fichiers existants', () => {
    for (const page of config.pages) {
        const html = fs.readFileSync(path.join(root, page.file), 'utf8');
        const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map((match) => match[1]);
        for (const href of links) {
            if (/^(?:https?:|mailto:|tel:|javascript:|#)/i.test(href)) continue;
            const pathname = href.split(/[?#]/)[0];
            if (!pathname || pathname.startsWith('/.netlify/')) continue;
            const target = pathname === '/' ? 'index.html' : decodeURIComponent(pathname.replace(/^\//, ''));
            assert.ok(fs.existsSync(path.join(root, target)), `${page.file}: lien cassé vers ${href}`);
        }
    }
});

test('les pages privées restent hors index', () => {
    const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
    const netlify = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');
    for (const privatePath of ['/admin-', '/espace-', '/connexion', '/inscription']) {
        assert.ok(robots.includes(`Disallow: ${privatePath}`), `robots sans ${privatePath}`);
    }
    assert.match(robots, new RegExp(`Sitemap: ${config.site.baseUrl}/sitemap\\.xml`));
    assert.match(netlify, /X-Robots-Tag\s*=\s*"noindex,[^"]*noarchive"/);
    for (const sourcePath of ['/scripts/*', '/seo/*', '/docs/*', '/netlify/*', '/netlify.toml', '/.env*']) {
        assert.ok(netlify.includes(`from = "${sourcePath}"`), `source technique exposée: ${sourcePath}`);
    }
});

test('la preuve sociale Google reste cohérente dans les affichages de secours', () => {
    const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const reviewsPage = fs.readFileSync(path.join(root, 'avis.html'), 'utf8');
    const reviewsClient = fs.readFileSync(path.join(root, 'assets/js/reviews.js'), 'utf8');
    const reviewsFunction = fs.readFileSync(path.join(root, 'netlify/functions/google-reviews.js'), 'utf8');
    for (const [file, content] of [
        ['index.html', homepage],
        ['avis.html', reviewsPage]
    ]) {
        assert.match(content, /184 avis Google/, `${file}: nombre d'avis`);
        assert.match(content, /4,6/, `${file}: note Google`);
    }
    for (const [file, content] of [
        ['assets/js/reviews.js', reviewsClient],
        ['netlify/functions/google-reviews.js', reviewsFunction]
    ]) {
        assert.match(content, /rating:\s*4\.6/, `${file}: note de secours`);
        assert.match(content, /total:\s*184/, `${file}: nombre de secours`);
    }
});

test('la navigation publique regroupe clairement les formations au permis de conduire', () => {
    const navigation = fs.readFileSync(path.join(root, 'assets/js/site-footer.js'), 'utf8');
    assert.match(navigation, /Permis de conduire/);
    assert.match(navigation, /Formation traditionnelle/);
    for (const destination of [
        'permis-b.html',
        'permis-boite-manuelle.html',
        'permis-boite-automatique.html',
        'permis-accelere.html',
        'conduite-accompagnee.html',
        'tarifs.html?formation=vsp#vsp-section',
        'financement-permis.html',
        'conseiller.html'
    ]) {
        assert.match(navigation, new RegExp(destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `menu sans ${destination}`);
    }
    assert.match(navigation, /aria-expanded/);
    assert.match(navigation, /site-formation-menu-toggle/);
    assert.doesNotMatch(navigation, /stych\.fr/i);
});

test('les pages de formation affichent immédiatement les prix officiels', () => {
    const expectedPrices = {
        'permis-boite-manuelle.html': ['699 €', '799 €', '899 €'],
        'permis-boite-automatique.html': ['499 €', '599 €', '749 €'],
        'conduite-accompagnee.html': ['639 €', '889 €'],
        'permis-accelere.html': ['749 €', '899 €']
    };

    for (const [file, prices] of Object.entries(expectedPrices)) {
        const html = fs.readFileSync(path.join(root, file), 'utf8');
        assert.match(html, /formation-offers-section/, `${file}: résumé des offres absent`);
        assert.match(html, /formation-details/, `${file}: détails non repliables`);
        for (const price of prices) assert.ok(html.includes(price), `${file}: prix ${price} absent`);
    }

    const pricingPage = fs.readFileSync(path.join(root, 'tarifs.html'), 'utf8');
    assert.match(pricingPage, /data-formation="vsp"/);
    assert.match(pricingPage, /new URLSearchParams\(window\.location\.search\)\.get\('formation'\)/);
});
