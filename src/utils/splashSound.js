// The KinakanGo opening jingle, made with the Web Audio API (no audio file to
// download). Timed to the opening scene in Splash.jsx:
//   0.1 s  soft whoosh as the badge pops in
//   0.35 s a whoosh as the food box zooms in
//   0.9 s  a quick, high bloop run as the box's vinta stripes fill in
//   2.6 s  "Ki - na - kan": three bubbly plinks, with a tiny high voice
//          singing "Ki-na-kan GO!" (public/sounds/kinakan-voice.mp3)
//   3.2 s  "Go!" a whistle zips up into a bright ding, then sparkles
// Browsers only allow sound after the person has touched the page, so if the
// app opens without a tap the jingle starts on the first tap during the splash.

const PREF = 'kkg_sounds';
export const soundsOn = () => { try { return localStorage.getItem(PREF) !== 'off'; } catch { return true; } };
export const setSoundsOn = (on) => { try { localStorage.setItem(PREF, on ? 'on' : 'off'); } catch { /* ignore */ } };

// The voice clip starts VOICE_AT seconds into the splash, so "Ki" lands on the
// first plink and "GO" on the stamp.
const VOICE_AT = 2.62;
const VOICE_URL = `${import.meta.env.BASE_URL}sounds/kinakan-voice.mp3`;
let voiceBytes = null;
// Start downloading the clip as soon as this file loads (it is about 6 KB)
const loadVoice = () => {
  if (!voiceBytes) voiceBytes = fetch(VOICE_URL).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null);
  return voiceBytes;
};
if (typeof window !== 'undefined' && soundsOn()) loadVoice();

function scheduleVoice(ctx, start, skip, out) {
  loadVoice().then(bytes => {
    if (!bytes || ctx.state === 'closed') return;
    // decodeAudioData takes the buffer away, so give it a copy
    return new Promise((ok, fail) => ctx.decodeAudioData(bytes.slice(0), ok, fail)).then(buf => {
      const when = start + VOICE_AT - skip;                  // ctx time the clip should start
      const into = Math.max(0, skip - VOICE_AT) + Math.max(0, ctx.currentTime + 0.01 - when);
      if (into >= buf.duration - 0.25) return;               // too late, nothing worth hearing left
      const src = ctx.createBufferSource(); src.buffer = buf;
      const g = ctx.createGain(); g.gain.value = 1.1;
      src.connect(g).connect(out);
      src.start(Math.max(when, ctx.currentTime + 0.01), into);
    });
  }).catch(() => {});
}

// Schedules the whole jingle on `ctx`, starting at ctx time `start`.
// `skip` seconds of the timeline that already went by are left out.
export function scheduleJingle(ctx, start, skip = 0, { voice = true } = {}) {
  const out = ctx.createDynamicsCompressor();
  const master = ctx.createGain();
  master.gain.value = 0.55;
  out.connect(master).connect(ctx.destination);
  const at = (t) => start + t - skip;
  const later = (t) => t >= skip;
  if (voice) scheduleVoice(ctx, start, skip, out);

  // soft whoosh: filtered noise sweeping up
  if (later(0.1)) {
    const len = Math.floor(ctx.sampleRate * 0.6);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(400, at(0.1)); bp.frequency.exponentialRampToValueAtTime(3200, at(0.6));
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at(0.1)); g.gain.exponentialRampToValueAtTime(0.25, at(0.3)); g.gain.exponentialRampToValueAtTime(0.0001, at(0.7));
    src.connect(bp).connect(g).connect(out); src.start(at(0.1)); src.stop(at(0.72));
  }

  // the box zooming in: a soft whoosh drifting left to right
  if (later(0.35)) {
    const t0 = at(0.35), t1 = at(1.6);
    const len = Math.floor(ctx.sampleRate * 1.4);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(500, t0); lp.frequency.linearRampToValueAtTime(1400, t0 + 0.6); lp.frequency.linearRampToValueAtTime(600, t1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t1);
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { pan.pan.setValueAtTime(-0.7, t0); pan.pan.linearRampToValueAtTime(0.3, t1); }
    src.connect(lp).connect(g);
    (pan ? g.connect(pan) : g).connect(out);
    src.start(t0); src.stop(t1 + 0.05);
  }

  addSparkle(ctx, out, at, later);
}

// --- KinakanGo's own sound kit ---------------------------------------------
// Bright and high: little "bloop" plinks that bend up into their note, a
// whistle that zips up on "Go!", and a sprinkle of sparkles to finish.

// A bubbly plink: a sine that bends up into `freq`, with a glassy overtone.
export function bloop(ctx, out, s, freq, vol = 0.3, dur = 0.22) {
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(freq * 0.62, s); o.frequency.exponentialRampToValueAtTime(freq, s + 0.045);
  const o2 = ctx.createOscillator(); o2.type = 'triangle';
  o2.frequency.setValueAtTime(freq * 1.24, s); o2.frequency.exponentialRampToValueAtTime(freq * 2, s + 0.045);
  const g = ctx.createGain(), g2 = ctx.createGain();
  g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(vol, s + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
  g2.gain.setValueAtTime(0.0001, s); g2.gain.exponentialRampToValueAtTime(vol * 0.22, s + 0.008); g2.gain.exponentialRampToValueAtTime(0.0001, s + dur * 0.6);
  o.connect(g).connect(out); o2.connect(g2).connect(out);
  o.start(s); o2.start(s); o.stop(s + dur + 0.05); o2.stop(s + dur + 0.05);
}

// A bell-like ding: a sine with a soft octave shimmer.
export function ding(ctx, out, s, freq, vol = 0.2, dur = 0.9) {
  [[1, vol], [2, vol * 0.3], [3, vol * 0.1]].forEach(([mul, v]) => {
    const o = ctx.createOscillator(); o.type = mul === 1 ? 'triangle' : 'sine'; o.frequency.value = freq * mul;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(v, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + dur / mul);
    o.connect(g).connect(out); o.start(s); o.stop(s + dur + 0.05);
  });
}

// A whistle that zips up from `from` to `to` Hz.
function zip(ctx, out, s, from, to, len, vol) {
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(from, s); o.frequency.exponentialRampToValueAtTime(to, s + len);
  const lfo = ctx.createOscillator(), lg = ctx.createGain();
  lfo.frequency.value = 28; lg.gain.value = to * 0.012; lfo.connect(lg).connect(o.frequency);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(vol, s + 0.03); g.gain.setValueAtTime(vol, s + len * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, s + len + 0.08);
  o.connect(g).connect(out); o.start(s); lfo.start(s); o.stop(s + len + 0.1); lfo.stop(s + len + 0.1);
}

function addSparkle(ctx, out, at, later) {
  // the box's five vinta stripes fill in to a quick, high bloop run
  [1046.5, 1174.7, 1318.5, 1568.0, 1760.0].forEach((f, i) => {
    const t = 0.9 + i * 0.09;
    if (later(t)) bloop(ctx, out, at(t), f, 0.13, 0.18);
  });
  // "Ki - na - kan": three bubbly plinks as the name drops in
  [[2.62, 1568.0], [2.8, 1318.5], [2.98, 2093.0]].forEach(([t, f]) => { if (later(t)) bloop(ctx, out, at(t), f, 0.26); });
  // "Go!": a whistle zips up into a bright C major ding, with a little thump
  if (later(3.06)) zip(ctx, out, at(3.06), 1046.5, 2093.0, 0.14, 0.12);
  if (later(3.18)) {
    const s = at(3.18);
    [2093.0, 2637.0, 3136.0].forEach((f, i) => ding(ctx, out, s + i * 0.015, f, 0.16, 1.0));
    ding(ctx, out, s, 1046.5, 0.16, 0.8);
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(220, s); o.frequency.exponentialRampToValueAtTime(70, s + 0.18);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.35, s + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.22);
    o.connect(g).connect(out); o.start(s); o.stop(s + 0.25);
  }
  // sparkles twinkling down after "Go!"
  [[3.32, 4186], [3.4, 3520], [3.47, 3951], [3.55, 3136], [3.64, 3520]].forEach(([t, f]) => {
    if (later(t)) ding(ctx, out, at(t), f, 0.045, 0.3);
  });
}

// The in-app notification tone: "ki-na-GO!" in under a second.
export function playNotifySound() {
  if (!soundsOn()) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    const ctx = notifyCtx || (notifyCtx = new AC());
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    scheduleNotify(ctx, ctx.currentTime + 0.03);
  } catch { /* ignore */ }
}
let notifyCtx = null;
export function scheduleNotify(ctx, s) {
  const out = ctx.createDynamicsCompressor();
  const master = ctx.createGain(); master.gain.value = 1.0;
  out.connect(master).connect(ctx.destination);
  bloop(ctx, out, s, 1568.0, 0.28, 0.16);
  bloop(ctx, out, s + 0.11, 2093.0, 0.28, 0.16);
  zip(ctx, out, s + 0.2, 1568.0, 2637.0, 0.09, 0.08);
  [2637.0, 3136.0, 3951.0].forEach((f, i) => ding(ctx, out, s + 0.28 + i * 0.012, f, 0.12, 0.6));
}

// Plays the jingle for a splash that began at performance.now() === startedAt.
// Returns { stop, tapUnlockedSound }: stop() ends it if the splash goes away;
// tapUnlockedSound() says whether the latest tap was used to turn the sound on
// (so the splash doesn't treat that same tap as "skip").
// onLocked(true|false) tells the splash whether it is waiting for a tap to play.
const NOOP = { stop: () => {}, tapUnlockedSound: () => false };
export function playSplashJingle(startedAt, { onLocked } = {}) {
  if (!soundsOn()) return NOOP;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return NOOP;
  // iPhone: play through the media channel, so the ringer's silent switch
  // doesn't mute it (Safari 17+; older versions ignore this)
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* ignore */ }
  let ctx;
  try { ctx = new AC(); } catch { return NOOP; }
  let started = false, unlockTap = false;
  // iOS only lets audio start inside a finished tap (touchend / click), not on touchstart
  const events = ['touchend', 'pointerup', 'click', 'keydown'];
  const detach = () => events.forEach(e => window.removeEventListener(e, unlock, true));
  const begin = () => {
    if (started || ctx.state !== 'running') return;
    started = true;
    detach();
    onLocked?.(false);
    const elapsed = Math.max(0, (performance.now() - startedAt) / 1000);
    // Late tap: still give them the "Go!" ending rather than nothing
    const skip = elapsed < 3.1 ? elapsed : 3.1;
    if (elapsed < 4.6) scheduleJingle(ctx, ctx.currentTime + 0.02, skip);
  };
  function unlock() {
    if (started) return;
    unlockTap = true;
    // A tiny silent sound inside the tap is what really wakes audio on older iPhones
    try {
      const b = ctx.createBuffer(1, 1, 22050), src = ctx.createBufferSource();
      src.buffer = b; src.connect(ctx.destination); src.start(0);
    } catch { /* ignore */ }
    const r = ctx.resume();
    if (r && r.then) r.then(begin).catch(() => {}); else begin();
  }
  const r0 = ctx.resume();
  if (r0 && r0.then) r0.then(begin).catch(() => {});
  if (ctx.state !== 'running') {
    events.forEach(e => window.addEventListener(e, unlock, true));
    // Only show the hint if the browser really is holding the sound back
    setTimeout(() => { if (!started) onLocked?.(true); }, 250);
  }
  return {
    stop() {
      detach();
      onLocked?.(false);
      // let the last notes ring out a moment, then free the audio device
      setTimeout(() => { try { ctx.close(); } catch { /* ignore */ } }, 1500);
    },
    tapUnlockedSound() { const was = unlockTap; unlockTap = false; return was; },
  };
}
