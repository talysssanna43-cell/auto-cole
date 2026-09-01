(function () {
    var state = { config: null, overrides: new Map(), selected: null, baseH1: new Map(), tableReady: true };
    var els = {};

    function token() {
        return window.authSession && window.authSession.getToken ? window.authSession.getToken() : '';
    }

    function setStatus(text, error) {
        els.status.textContent = text;
        els.status.classList.toggle('error', Boolean(error));
    }

    function setFeedback(text, error) {
        els.feedback.textContent = text || '';
        els.feedback.classList.toggle('error', Boolean(error));
    }

    function pageLabel(page) {
        return page.path === '/' ? 'Page d’accueil' : page.title.split('|')[0].trim();
    }

    function pageHref(page) {
        return page.path === '/' ? 'index.html' : page.path.replace(/^\//, '');
    }

    async function readBaseH1(page) {
        if (state.baseH1.has(page.path)) return state.baseH1.get(page.path);
        var response = await fetch(pageHref(page), { cache: 'no-store' });
        var html = await response.text();
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var h1 = doc.querySelector('h1');
        var value = h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : '';
        state.baseH1.set(page.path, value);
        return value;
    }

    function renderPageList() {
        els.pageList.innerHTML = state.config.pages.map(function (page) {
            var active = state.selected && state.selected.path === page.path;
            var edited = state.overrides.has(page.path);
            return '<button class="seo-page-button' + (active ? ' active' : '') + '" type="button" data-page="' + page.path + '">' +
                '<span><strong>' + pageLabel(page) + '</strong><small>' + page.path + '</small></span>' +
                '<i class="fas fa-circle' + (edited ? '' : ' base') + '" title="' + (edited ? 'Personnalisée' : 'Version livrée') + '"></i></button>';
        }).join('');
        els.pageList.querySelectorAll('[data-page]').forEach(function (button) {
            button.addEventListener('click', function () {
                var page = state.config.pages.find(function (item) { return item.path === button.dataset.page; });
                selectPage(page);
            });
        });
    }

    function updatePreview() {
        els.titleCount.textContent = els.title.value.length + ' / 70';
        els.descriptionCount.textContent = els.description.value.length + ' / 180';
        els.h1Count.textContent = els.h1.value.length + ' / 140';
        els.previewTitle.textContent = els.title.value;
        els.previewDescription.textContent = els.description.value;
    }

    async function selectPage(page) {
        if (!page) return;
        state.selected = page;
        renderPageList();
        setFeedback('');
        var baseH1 = await readBaseH1(page);
        var override = state.overrides.get(page.path);
        els.editorTitle.textContent = pageLabel(page);
        els.editorPath.textContent = state.config.site.baseUrl + page.path;
        els.openPage.href = pageHref(page);
        els.previewUrl.textContent = state.config.site.baseUrl + page.path;
        els.title.value = override ? override.title : page.title;
        els.description.value = override ? override.description : page.description;
        els.h1.value = override ? override.h1 : baseH1;
        els.reset.disabled = !override || !state.tableReady;
        els.save.disabled = !state.tableReady;
        updatePreview();
    }

    async function loadOverrides() {
        var response = await fetch('/.netlify/functions/admin-seo-settings', {
            headers: { Authorization: 'Bearer ' + token() },
            cache: 'no-store'
        });
        var payload = await response.json().catch(function () { return { ok: false, error: 'INVALID_RESPONSE' }; });
        if (response.status === 424 && payload.error === 'SEO_SETTINGS_TABLE_MISSING') {
            state.tableReady = false;
            setStatus('Configuration à installer', true);
            setFeedback('La configuration SQL doit être appliquée avant la première modification.', true);
            return;
        }
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'SEO_LOAD_FAILED');
        (payload.settings || []).forEach(function (setting) { state.overrides.set(setting.page_path, setting); });
        setStatus(state.overrides.size ? state.overrides.size + ' page(s) personnalisée(s)' : 'Configuration prête', false);
    }

    async function saveSelected(event) {
        event.preventDefault();
        if (!state.selected || !state.tableReady) return;
        if (els.title.value.trim().length < 20 || els.description.value.trim().length < 80 || els.h1.value.trim().length < 10) {
            setFeedback('Le titre, la description ou le H1 est trop court.', true);
            return;
        }
        els.save.disabled = true;
        setFeedback('Enregistrement…');
        try {
            var response = await fetch('/.netlify/functions/admin-seo-settings', {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ page_path: state.selected.path, title: els.title.value, description: els.description.value, h1: els.h1.value })
            });
            var payload = await response.json().catch(function () { return { ok: false, error: 'INVALID_RESPONSE' }; });
            if (!response.ok || !payload.ok) throw new Error(payload.error || 'SEO_SAVE_FAILED');
            state.overrides.set(state.selected.path, payload.setting);
            renderPageList();
            els.reset.disabled = false;
            setFeedback(payload.buildTriggered ? 'Enregistré. La publication a été relancée.' : 'Enregistré. La page publique prendra la modification en compte automatiquement.');
        } catch (error) {
            setFeedback(error.message === 'AUTH_REQUIRED' ? 'Session expirée. Reconnecte-toi.' : 'Impossible d’enregistrer la modification.', true);
        } finally {
            els.save.disabled = false;
        }
    }

    async function resetSelected() {
        if (!state.selected || !state.tableReady || !state.overrides.has(state.selected.path)) return;
        els.reset.disabled = true;
        try {
            var response = await fetch('/.netlify/functions/admin-seo-settings', {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ page_path: state.selected.path })
            });
            var payload = await response.json().catch(function () { return { ok: false }; });
            if (!response.ok || !payload.ok) throw new Error(payload.error || 'SEO_RESET_FAILED');
            state.overrides.delete(state.selected.path);
            await selectPage(state.selected);
            setFeedback('La version livrée est de nouveau utilisée.');
        } catch (error) {
            setFeedback('Impossible de rétablir la version livrée.', true);
            els.reset.disabled = false;
        }
    }

    async function init() {
        els = {
            status: document.getElementById('seoStatus'), pageList: document.getElementById('seoPageList'),
            editorTitle: document.getElementById('seoEditorTitle'), editorPath: document.getElementById('seoEditorPath'),
            openPage: document.getElementById('seoOpenPage'), form: document.getElementById('seoForm'),
            title: document.getElementById('seoTitle'), description: document.getElementById('seoDescription'), h1: document.getElementById('seoH1'),
            titleCount: document.getElementById('seoTitleCount'), descriptionCount: document.getElementById('seoDescriptionCount'), h1Count: document.getElementById('seoH1Count'),
            previewUrl: document.getElementById('seoPreviewUrl'), previewTitle: document.getElementById('seoPreviewTitle'), previewDescription: document.getElementById('seoPreviewDescription'),
            save: document.getElementById('seoSave'), reset: document.getElementById('seoReset'), feedback: document.getElementById('seoFeedback')
        };
        els.form.addEventListener('submit', saveSelected);
        els.reset.addEventListener('click', resetSelected);
        [els.title, els.description, els.h1].forEach(function (input) { input.addEventListener('input', updatePreview); });
        try {
            state.config = await fetch('seo/pages.json', { cache: 'no-store' }).then(function (result) { return result.json(); });
            await loadOverrides();
            renderPageList();
            await selectPage(state.config.pages[0]);
        } catch (error) {
            setStatus('Chargement impossible', true);
            setFeedback('Le module de référencement n’a pas pu être chargé.', true);
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
