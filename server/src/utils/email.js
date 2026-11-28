// Transactional email via Brevo (needs BREVO_API_KEY and a verified BREVO_SENDER_EMAIL)
//
// The first call after the server wakes up sometimes fails to connect (or
// hangs), and the person had to ask for the code a second time. So each try
// has a time limit, and a failed connection or a busy reply (429 / 5xx) is
// tried again before giving up.
const TRIES = 3;
const TRY_TIMEOUT_MS = 8000;

const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function sendOnce({ to, subject, html }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key':      process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept':       'application/json',
    },
    body: JSON.stringify({
      sender:      { name: 'KinakanGo', email: process.env.BREVO_SENDER_EMAIL },
      to:          [{ email: to }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(TRY_TIMEOUT_MS),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw Object.assign(new Error(`Brevo send failed (${res.status}): ${body}`), { status: res.status });
  }
}

// Every email gets the KinakanGo header (logo + name) and a small footer.
// The logo is the app icon served by the web app (emails can't show SVG).
const APP_URL = (process.env.APP_URL || 'https://kinakan-go.vercel.app').replace(/\/$/, '');

function brandEmail(inner) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f6f1ea">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1ea;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden">
        <tr><td style="background:#1a1512;padding:18px 24px">
          <a href="${APP_URL}" style="text-decoration:none">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td><img src="${APP_URL}/icons/icon-192.png" width="44" height="44" alt="KinakanGo" style="display:block;border-radius:12px;border:0"></td>
              <td style="padding-left:12px;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:800;letter-spacing:-0.5px">
                <span style="color:#ffffff">Kinakan</span><span style="color:#f7931e">Go</span>
              </td>
            </tr></table>
          </a>
        </td></tr>
        <tr><td>${inner}</td></tr>
        <tr><td style="padding:14px 24px 20px;border-top:1px solid #eee;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#999;text-align:center">
          KinakanGo &middot; Bongao, Tawi-Tawi &middot; <a href="${APP_URL}" style="color:#e8540a;text-decoration:none">Open KinakanGo</a>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

async function sendEmail(msg) {
  msg = { ...msg, html: brandEmail(msg.html) };
  for (let i = 1; ; i++) {
    try {
      return await sendOnce(msg);
    } catch (err) {
      // 4xx (bad key, bad address...) won't fix itself; anything else is worth another try
      const retryable = !err.status || err.status === 429 || err.status >= 500;
      if (!retryable || i >= TRIES) throw err;
      console.warn(`email try ${i} failed, trying again:`, err.message);
      await wait(600 * i);
    }
  }
}

module.exports = { sendEmail, brandEmail };
