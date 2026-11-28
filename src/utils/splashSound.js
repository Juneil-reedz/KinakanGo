// The KinakanGo opening jingle, made with the Web Audio API (no audio file to
// download). Timed to the opening scene in Splash.jsx:
//   0.1 s  soft whoosh as the badge pops in
//   1.7 s  the rider's scooter putts in
//   2.6 s  "Ki - na - kan" three bright notes as the name drops in
//   3.2 s  "Go!" a chord with a little thump as it stamps on
// Browsers only allow sound after the person has touched the page, so if the
// app opens without a tap the jingle starts on the first tap during the splash.

const PREF = 'kkg_sounds';
export const soundsOn = () => { try { return localStorage.getItem(PREF) !== 'off'; } catch { return true; } };
export const setSoundsOn = (on) => { try { localStorage.setItem(PREF, on ? 'on' : 'off'); } catch { /* ignore */ } };

// Schedules the whole jingle on `ctx`, starting at ctx time `start`.
// `skip` seconds of the timeline that already went by are left out.
export function scheduleJingle(ctx, start, skip = 0) {
  const out = ctx.createDynamicsCompressor();
  const master = ctx.createGain();
  master.gain.value = 0.55;
  out.connect(master).connect(ctx.destination);
  const at = (t) => start + t - skip;
  const later = (t) => t >= skip;

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

  // scooter: a buzzy low engine that revs up as it drives in, with a putt-putt wobble
  if (later(1.7)) {
    const t0 = at(1.7), t1 = at(2.75);
    const eng = ctx.createOscillator(); eng.type = 'sawtooth';
    eng.frequency.setValueAtTime(62, t0); eng.frequency.exponentialRampToValueAtTime(118, t0 + 0.55); eng.frequency.exponentialRampToValueAtTime(78, t1);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
    const putt = ctx.createGain(); putt.gain.value = 0.5;
    const lfo = ctx.createOscillator(); lfo.frequency.setValueAtTime(18, t0); lfo.frequency.linearRampToValueAtTime(30, t0 + 0.55);
    const lfoAmt = ctx.createGain(); lfoAmt.gain.value = 0.5;
    lfo.connect(lfoAmt).connect(putt.gain);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.35); g.gain.setValueAtTime(0.22, t1 - 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t1);
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { pan.pan.setValueAtTime(-0.8, t0); pan.pan.linearRampToValueAtTime(0.2, t1); }
    eng.connect(lp).connect(putt).connect(g);
    (pan ? g.connect(pan) : g).connect(out);
    eng.start(t0); lfo.start(t0); eng.stop(t1 + 0.05); lfo.stop(t1 + 0.05);
    // a little horn "beep-beep" as it arrives
    [[2.5, 0.07], [2.62, 0.1]].forEach(([t, dur]) => {
      if (!later(t)) return;
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 520;
      const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 655;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
      const hg = ctx.createGain();
      hg.gain.setValueAtTime(0.0001, at(t)); hg.gain.exponentialRampToValueAtTime(0.07, at(t) + 0.01); hg.gain.setValueAtTime(0.07, at(t + dur)); hg.gain.exponentialRampToValueAtTime(0.0001, at(t + dur) + 0.03);
      o.connect(f); o2.connect(f); f.connect(hg).connect(out);
      o.start(at(t)); o2.start(at(t)); o.stop(at(t + dur) + 0.05); o2.stop(at(t + dur) + 0.05);
    });
  }

  // bell-like note: a sine with a soft octave shimmer
  const bell = (t, freq, dur, vol) => {
    if (!later(t)) return;
    const s = at(t);
    [[1, vol], [2, vol * 0.28], [3, vol * 0.08]].forEach(([mul, v]) => {
      const o = ctx.createOscillator(); o.type = mul === 1 ? 'triangle' : 'sine'; o.frequency.value = freq * mul;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(v, s + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
      o.connect(g).connect(out); o.start(s); o.stop(s + dur + 0.05);
    });
  };
  // "Ki - na - kan"
  bell(2.6, 784.0, 0.35, 0.32);   // G5
  bell(2.78, 659.3, 0.35, 0.3);   // E5
  bell(2.96, 784.0, 0.4, 0.32);   // G5
  // "Go!": C major chord up top, with a bass thump
  [1046.5, 1318.5, 1568.0].forEach((f, i) => bell(3.18 + i * 0.012, f, 1.1, 0.24));
  bell(3.18, 523.3, 1.0, 0.2);
  if (later(3.18)) {
    const s = at(3.18);
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(150, s); o.frequency.exponentialRampToValueAtTime(48, s + 0.25);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.5, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.32);
    o.connect(g).connect(out); o.start(s); o.stop(s + 0.35);
  }
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
