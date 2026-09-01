// Temporary public notice displayed while the school is closed.
(function showHolidayNotice() {
    const noticeEndsAt = new Date(2026, 7, 23).getTime();
    if (Date.now() >= noticeEndsAt) return;

    window.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('holidayNoticeModal')) return;

        document.body.insertAdjacentHTML('beforeend', `
            <div id="holidayNoticeModal" role="dialog" aria-modal="true" aria-labelledby="holidayNoticeTitle" style="position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(23,23,42,.68)">
                <div style="width:min(100%,500px);padding:32px 28px;border-radius:16px;background:#fff;box-shadow:0 24px 64px rgba(0,0,0,.25);text-align:center">
                    <div aria-hidden="true" style="width:64px;height:64px;margin:0 auto 18px;border-radius:50%;display:grid;place-items:center;background:#ff5aa5;color:#fff;font-size:30px;font-weight:700">i</div>
                    <h2 id="holidayNoticeTitle" style="margin:0 0 14px;color:#17172a;font-size:1.65rem">Information importante</h2>
                    <p style="margin:0;color:#4b5563;font-size:1.05rem;line-height:1.6">L'Auto-Ecole Breteuil est actuellement en cong&eacute; jusqu'au <strong style="color:#ec4899">22 ao&ucirc;t</strong>.</p>
                    <p style="margin:12px 0 24px;color:#6b7280;line-height:1.55">Nous vous remercions pour votre compr&eacute;hension et vous r&eacute;pondrons d&egrave;s notre retour.</p>
                    <button id="holidayNoticeClose" type="button" style="border:0;border-radius:8px;padding:12px 26px;background:#ec4899;color:#fff;font:inherit;font-weight:700;cursor:pointer">J'ai compris</button>
                </div>
            </div>
        `);

        document.getElementById('holidayNoticeClose')?.addEventListener('click', () => {
            document.getElementById('holidayNoticeModal')?.remove();
        });
    }, { once: true });
})();
