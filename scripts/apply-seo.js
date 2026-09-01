const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const configPath = path.join(root, 'seo', 'pages.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const SEO_START = '<!-- AUTO-SEO:START -->';
const SEO_END = '<!-- AUTO-SEO:END -->';

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function pageUrl(page) {
    return `${config.site.baseUrl}${page.path}`;
}

function schemaFor(page) {
    const site = config.site;
    const url = pageUrl(page);
    const graph = [
        {
            '@type': 'LocalBusiness',
            '@id': `${site.baseUrl}/#business`,
            name: site.name,
            url: site.baseUrl,
            image: `${site.baseUrl}${site.defaultImage}`,
            logo: `${site.baseUrl}/assets/logo.png`,
            telephone: site.telephone,
            email: site.email,
            priceRange: site.priceRange,
            address: {
                '@type': 'PostalAddress',
                streetAddress: site.streetAddress,
                postalCode: site.postalCode,
                addressLocality: site.city,
                addressCountry: 'FR'
            },
            geo: {
                '@type': 'GeoCoordinates',
                latitude: site.latitude,
                longitude: site.longitude
            },
            hasMap: site.googleMapsUrl,
            areaServed: {
                '@type': 'City',
                name: 'Marseille'
            },
            openingHoursSpecification: [
                {
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    opens: '17:00',
                    closes: '19:00'
                }
            ],
            hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Formations au permis de conduire',
                itemListElement: site.services.map((service) => ({
                    '@type': 'Offer',
                    url: `${site.baseUrl}${service.path}`,
                    itemOffered: {
                        '@type': 'Service',
                        name: service.name,
                        provider: { '@id': `${site.baseUrl}/#business` },
                        areaServed: { '@type': 'City', name: site.city }
                    }
                }))
            }
        },
        {
            '@type': 'WebSite',
            '@id': `${site.baseUrl}/#website`,
            url: site.baseUrl,
            name: site.name,
            inLanguage: site.language,
            publisher: { '@id': `${site.baseUrl}/#business` }
        },
        {
            '@type': page.type || 'WebPage',
            '@id': `${url}#webpage`,
            url,
            name: page.title,
            description: page.description,
            inLanguage: site.language,
            isPartOf: { '@id': `${site.baseUrl}/#website` },
            about: { '@id': `${site.baseUrl}/#business` }
        }
    ];

    if (page.path !== '/') {
        graph.push({
            '@type': 'BreadcrumbList',
            '@id': `${url}#breadcrumb`,
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Accueil',
                    item: `${site.baseUrl}/`
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: page.title.split('|')[0].trim(),
                    item: url
                }
            ]
        });
    }

    return { '@context': 'https://schema.org', '@graph': graph };
}

function seoBlock(page) {
    const site = config.site;
    const url = pageUrl(page);
    const image = `${site.baseUrl}${page.image || site.defaultImage}`;
    return [
        `    ${SEO_START}`,
        `    <title>${escapeHtml(page.title)}</title>`,
        `    <meta name="description" content="${escapeHtml(page.description)}">`,
        '    <meta name="robots" content="index,follow,max-image-preview:large">',
        `    <link rel="canonical" href="${escapeHtml(url)}">`,
        '    <meta property="og:type" content="website">',
        `    <meta property="og:locale" content="${escapeHtml(site.language.replace('-', '_'))}">`,
        `    <meta property="og:site_name" content="${escapeHtml(site.name)}">`,
        `    <meta property="og:url" content="${escapeHtml(url)}">`,
        `    <meta property="og:title" content="${escapeHtml(page.title)}">`,
        `    <meta property="og:description" content="${escapeHtml(page.description)}">`,
        `    <meta property="og:image" content="${escapeHtml(image)}">`,
        '    <meta name="twitter:card" content="summary_large_image">',
        `    <meta name="twitter:title" content="${escapeHtml(page.title)}">`,
        `    <meta name="twitter:description" content="${escapeHtml(page.description)}">`,
        `    <meta name="twitter:image" content="${escapeHtml(image)}">`,
        `    <script type="application/ld+json">${JSON.stringify(schemaFor(page))}</script>`,
        `    <script src="/assets/js/seo-runtime.js?v=1" data-seo-page="${escapeHtml(page.path)}" defer></script>`,
        `    ${SEO_END}`
    ].join('\n');
}

function stripLegacySeo(head) {
    return head
        .replace(/\s*<!-- AUTO-SEO:START -->[\s\S]*?<!-- AUTO-SEO:END -->\s*/i, '\n')
        .replace(/\s*<title\b[^>]*>[\s\S]*?<\/title>\s*/i, '\n')
        .replace(/\s*<meta\b[^>]*(?:name=["'](?:description|robots|twitter:[^"']+)["']|property=["'](?:og:[^"']+|twitter:[^"']+)["'])[^>]*>\s*/gi, '\n')
        .replace(/\s*<link\b[^>]*rel=["']canonical["'][^>]*>\s*/gi, '\n')
        .replace(/\s*<!-- (?:Favicon et )?Open Graph[^>]*-->\s*/gi, '\n')
        .replace(/\s*<!-- Open Graph \/ Facebook -->\s*/gi, '\n')
        .replace(/\s*<!-- Twitter Card -->\s*/gi, '\n');
}

function normalizeVisibleText(value) {
    return String(value || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

function updateHtml(page) {
    const filePath = path.join(root, page.file);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Page SEO introuvable: ${page.file}`);
    }

    const html = fs.readFileSync(filePath, 'utf8');
    const headMatch = html.match(/<head>([\s\S]*?)<\/head>/i);
    if (!headMatch) throw new Error(`Balise head introuvable: ${page.file}`);

    let head = stripLegacySeo(headMatch[1]);
    const viewportPattern = /(<meta\b[^>]*name=["']viewport["'][^>]*>)/i;
    if (!viewportPattern.test(head)) throw new Error(`Viewport introuvable: ${page.file}`);
    head = head.replace(viewportPattern, `$1\n${seoBlock(page)}`);
    let updated = html.replace(headMatch[0], `<head>${head}</head>`);
    if (page.h1Override) {
        const h1Match = updated.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
        const currentH1 = h1Match ? normalizeVisibleText(h1Match[1]) : '';
        if (normalizeVisibleText(page.h1Override) !== currentH1) {
            updated = updated.replace(
                /(<h1\b[^>]*>)[\s\S]*?(<\/h1>)/i,
                `$1${escapeHtml(page.h1Override)}$2`
            );
        }
    }
    fs.writeFileSync(filePath, updated, 'utf8');
}

async function loadPublishedOverrides() {
    const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
    const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '');
    if (!url || !key || typeof fetch !== 'function') return new Map();

    try {
        const result = await fetch(`${url}/rest/v1/site_seo_settings?select=page_path,title,description,h1`, {
            headers: { apikey: key, Authorization: `Bearer ${key}` }
        });
        if (!result.ok) {
            console.warn(`Overrides SEO ignorés (${result.status}).`);
            return new Map();
        }
        const rows = await result.json();
        return new Map((rows || []).map((row) => [row.page_path, row]));
    } catch (error) {
        console.warn(`Overrides SEO indisponibles: ${error.message}`);
        return new Map();
    }
}

function writeSitemap() {
    const lastmod = '2026-09-01';
    const urls = config.pages.map((page) => [
        '  <url>',
        `    <loc>${pageUrl(page)}</loc>`,
        `    <lastmod>${page.lastmod || lastmod}</lastmod>`,
        `    <changefreq>${page.changefreq || 'monthly'}</changefreq>`,
        `    <priority>${page.priority || '0.5'}</priority>`,
        '  </url>'
    ].join('\n')).join('\n');
    fs.writeFileSync(
        path.join(root, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        'utf8'
    );
}

function writeRobots() {
    const content = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin-',
        'Disallow: /espace-',
        'Disallow: /connexion',
        'Disallow: /inscription',
        'Disallow: /reservation',
        'Disallow: /reset-password',
        'Disallow: /devis-envoye',
        'Disallow: /recrutement-merci',
        'Disallow: /parrainage',
        'Disallow: /cours-theorique',
        'Disallow: /instructor-',
        'Disallow: /moniteur-',
        'Disallow: /test-',
        'Disallow: /debug-',
        'Disallow: /check-',
        'Disallow: /fix-',
        'Disallow: /auto-',
        'Disallow: /sync-',
        'Disallow: /.netlify/',
        '',
        `Sitemap: ${config.site.baseUrl}/sitemap.xml`,
        ''
    ].join('\n');
    fs.writeFileSync(path.join(root, 'robots.txt'), content, 'utf8');
}

async function main() {
    const overrides = await loadPublishedOverrides();
    for (const page of config.pages) {
        const override = overrides.get(page.path);
        updateHtml(override ? {
            ...page,
            title: override.title || page.title,
            description: override.description || page.description,
            h1Override: override.h1 || ''
        } : page);
    }
    writeSitemap();
    writeRobots();
    console.log(`SEO appliqué à ${config.pages.length} pages (${overrides.size} personnalisation(s)).`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
