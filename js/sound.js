// Efeitos sonoros sintetizados com WebAudio (sem arquivos de áudio).
const Sound = (() => {
  let ctx = null;
  let muted = false;

  function ac() {
    if (muted) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {
      return null;
    }
    return ctx;
  }

  function tone(freq, dur, type = 'sine', vol = 0.2, freqEnd = null, delay = 0) {
    const c = ac();
    if (!c) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  // Ruído filtrado: chute, torcida, "uuuh".
  function noise(dur, vol, freq, q = 1, attack = 0.02) {
    const c = ac();
    if (!c) return;
    const t = c.currentTime;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(g).connect(c.destination);
    src.start(t);
  }

  return {
    unlock() { ac(); },
    isMuted: () => muted,
    toggle() { muted = !muted; return muted; },
    click() { tone(700, 0.05, 'square', 0.05); },
    kick() { tone(160, 0.18, 'sine', 0.6, 45); noise(0.06, 0.3, 1800, 1, 0.005); },
    whistle() { tone(2300, 0.18, 'sine', 0.12); tone(2300, 0.35, 'sine', 0.12, null, 0.25); },
    goal() {
      noise(2.2, 0.4, 1000, 0.6, 0.25);
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.12, null, i * 0.1));
    },
    save() { noise(1.0, 0.3, 600, 0.8, 0.1); tone(300, 0.3, 'sine', 0.15, 180); },
    post() { tone(1400, 0.5, 'triangle', 0.25, 1300); tone(2100, 0.4, 'sine', 0.1); },
    miss() { noise(1.0, 0.25, 500, 0.8, 0.1); tone(330, 0.5, 'sawtooth', 0.06, 160); },
  };
})();
