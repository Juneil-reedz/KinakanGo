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

// Every email gets the KinakanGo header (logo + name) and a small footer, in
// the app's dark look. The logo is the box emblem on a see-through background
// (icons/email-logo.png, made from favicon.svg).
//
// Gmail's dark mode on iPhone flips every colour, which turned the dark
// header light. Two guards keep the email dark everywhere:
//  - backgrounds are also set as a one-colour background-image, which mail
//    apps never recolour;
//  - text sits inside two Gmail-only blend layers (screen + difference) that
//    undo the flip on text (the "u + .body" selector only matches in Gmail).
const APP_URL = (process.env.APP_URL || 'https://kinakan-go.vercel.app').replace(/\/$/, '');

const BG = '#15110e', CARD = '#211b17', LINE = '#3a312a';
const solid = (c) => `background-color:${c};background-image:linear-gradient(${c},${c});`;

// The templates were written for a white page: give them the dark palette
const DARK_COLOURS = [
  [/color:#1a1a1a/gi, 'color:#f6f0ea'],
  [/color:#(?:555|666)\b/gi, 'color:#c9bdb2'],
  [/color:#(?:888|999)\b/gi, 'color:#a3968b'],
  [/solid #(?:ddd|eee)\b/gi, `solid ${LINE}`],
];
const darken = (html) => DARK_COLOURS.reduce((h, [re, to]) => h.replace(re, to), html);

// Text inside this stays its own colour in Gmail's dark mode
const keepText = (html) => `<div class="gm-screen"><div class="gm-diff">${html}</div></div>`;

function brandEmail(inner) {
  return `<!doctype html><html><head>
  <meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
  <style>
    :root { color-scheme: dark; supported-color-schemes: dark; }
    u + .body .gm-screen { background:#000; mix-blend-mode:screen; }
    u + .body .gm-diff { background:#000; mix-blend-mode:difference; }
  </style></head>
  <body class="body" style="margin:0;padding:0;${solid(BG)}color:#f6f0ea"><u></u>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${solid(BG)}padding:24px 12px">
    <tr><td align="center" style="${solid(BG)}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;${solid(CARD)}border-radius:18px;overflow:hidden;border:1px solid ${LINE}">
        <tr><td style="${solid(CARD)}padding:20px 24px;border-bottom:1px solid ${LINE}">
          <a href="${APP_URL}" style="text-decoration:none">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td><img src="${APP_URL}/icons/email-logo.png" width="48" height="48" alt="KinakanGo" style="display:block;border:0"></td>
              <td style="padding-left:12px;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:800;letter-spacing:-0.5px">
                ${keepText('<span style="color:#ffffff">Kinakan</span><span style="color:#f7931e">Go</span>')}
              </td>
            </tr></table>
          </a>
        </td></tr>
        <tr><td style="${solid(CARD)}color:#f6f0ea">${keepText(darken(inner))}</td></tr>
        <tr><td style="${solid(CARD)}padding:14px 24px 20px;border-top:1px solid ${LINE};font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#a3968b;text-align:center">
          ${keepText(`KinakanGo &middot; Bongao, Tawi-Tawi &middot; <a href="${APP_URL}" style="color:#f7931e;text-decoration:none">Open KinakanGo</a>`)}
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
