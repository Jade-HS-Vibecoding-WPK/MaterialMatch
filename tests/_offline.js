/* Hilfsdatei für alle Tests: Die Seite lädt die Schrift „Nunito“ von Google Fonts. Die Tests laufen ohne Internet
   und sollen nicht davon abhängen. Darum werden Anfragen an fonts.googleapis.com / fonts.gstatic.com hier mit einer leeren
   Antwort beantwortet; die Seite fällt dann auf die Systemschrift zurück (so wie bei einem Besucher ohne Internet).
   Einbindung: require('./_offline.js') direkt nach require('playwright'). */
const { chromium } = require('playwright');
if (!chromium.__mmOffline) {
  chromium.__mmOffline = true;
  const leer = ctx => ctx.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, r => r.fulfill({ status: 200, contentType: r.request().url().includes('gstatic') ? 'font/woff2' : 'text/css', body: '' }));
  const launch = chromium.launch.bind(chromium);
  chromium.launch = async (...a) => {
    const b = await launch(...a);
    const np = b.newPage.bind(b), nc = b.newContext.bind(b);
    // MaterialMatch 3.7: Logo-Auftakt und Hinweis „Kurz vorab“ sind in den Tests aus (window.__MM_OHNE_START__); ?start=ja schaltet sie in test54 wieder ein
    const ohneStart = ctx => ctx.addInitScript(() => { window.__MM_OHNE_START__ = true; });
    b.newPage = async (...x) => { const p = await np(...x); await leer(p.context()); await ohneStart(p.context()); return p; };
    b.newContext = async (...x) => { const c = await nc(...x); await leer(c); await ohneStart(c); return c; };
    return b;
  };
}
