function sanitizeDocuments(documents, options = {}) {
    if (!documents || typeof documents !== 'object' || Array.isArray(documents)) return null;
    const maxDocumentLength = Number(options.maxDocumentLength || 1_000_000);
    const maxTotalLength = Number(options.maxTotalLength || 3_500_000);
    const maxDocuments = Number(options.maxDocuments || 12);
    const safe = {};
    let totalSize = 0;

    for (const [key, document] of Object.entries(documents).slice(0, maxDocuments)) {
        if (!document || typeof document !== 'object') continue;
        const data = String(document.data || '');
        if (!/^data:(image\/(png|jpeg|jpg|webp)|application\/pdf);base64,/i.test(data)) continue;
        if (data.length > maxDocumentLength || totalSize + data.length > maxTotalLength) continue;
        totalSize += data.length;
        safe[String(key).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60)] = {
            name: String(document.name || 'document').replace(/[\\/<>:"|?*]/g, '_').slice(0, 180),
            type: String(document.type || '').slice(0, 100),
            data
        };
    }

    return Object.keys(safe).length ? safe : null;
}

module.exports = { sanitizeDocuments };
