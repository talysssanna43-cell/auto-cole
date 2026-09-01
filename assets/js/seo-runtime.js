(function () {
    var script = document.currentScript;
    var pagePath = script && script.dataset ? script.dataset.seoPage : '';
    if (!pagePath) return;

    var cacheKey = 'ae_seo_override_' + pagePath;
    var maxAge = 60 * 60 * 1000;

    function upsertMeta(selector, attribute, value) {
        if (!value) return;
        var meta = document.head.querySelector(selector);
        if (meta) meta.setAttribute(attribute, value);
    }

    function applySetting(setting) {
        if (!setting) return;
        if (setting.title) {
            document.title = setting.title;
            upsertMeta('meta[property="og:title"]', 'content', setting.title);
            upsertMeta('meta[name="twitter:title"]', 'content', setting.title);
        }
        if (setting.description) {
            upsertMeta('meta[name="description"]', 'content', setting.description);
            upsertMeta('meta[property="og:description"]', 'content', setting.description);
            upsertMeta('meta[name="twitter:description"]', 'content', setting.description);
        }
        if (setting.h1) {
            var h1 = document.querySelector('h1');
            var currentH1 = h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : '';
            var nextH1 = setting.h1.replace(/\s+/g, ' ').trim();
            if (h1 && currentH1 !== nextH1) h1.textContent = setting.h1;
        }
    }

    try {
        var cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
        if (cached && Date.now() - cached.savedAt < maxAge) applySetting(cached.setting);
    } catch (error) {
        // Storage is optional.
    }

    fetch('/.netlify/functions/public-seo-settings?page=' + encodeURIComponent(pagePath), { cache: 'no-store' })
        .then(function (result) { return result.ok ? result.json() : null; })
        .then(function (payload) {
            if (!payload || !payload.ok) return;
            applySetting(payload.setting);
            try {
                localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), setting: payload.setting }));
            } catch (error) {
                // Storage is optional.
            }
        })
        .catch(function () {
            // Static metadata remains the fallback if the API is unavailable.
        });
})();
