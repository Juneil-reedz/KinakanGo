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

async function sendEmail(msg) {
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

module.exports = { sendEmail };
