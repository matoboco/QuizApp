export type SoundName =
  | 'click' | 'submit' | 'correct' | 'incorrect' | 'partial'
  | 'tick' | 'tickUrgent' | 'timeUp'
  | 'reveal' | 'gameStart' | 'gameEnd'
  | 'score' | 'streak'
  | 'leaderboard' | 'podium1' | 'podium2' | 'podium3'
  | 'confetti' | 'join' | 'kicked';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private _muted: boolean;
  private _volume: number;

  constructor() {
    this._muted = typeof localStorage !== 'undefined' && localStorage.getItem('quiz_sound_muted') === 'true';
    this._volume = typeof localStorage !== 'undefined'
      ? parseFloat(localStorage.getItem('quiz_sound_volume') || '0.5')
      : 0.5;
  }

  get muted(): boolean { return this._muted; }
  set muted(val: boolean) {
    this._muted = val;
    try { localStorage.setItem('quiz_sound_muted', String(val)); } catch { /* noop */ }
  }

  get volume(): number { return this._volume; }
  set volume(val: number) {
    this._volume = Math.max(0, Math.min(1, val));
    try { localStorage.setItem('quiz_sound_volume', String(this._volume)); } catch { /* noop */ }
  }

  play(name: SoundName): void {
    if (this._muted) return;
    try {
      this.registry[name]();
    } catch { /* audio is not critical */ }
  }

  // ---------------------------------------------------------------------------
  // Audio context
  // ---------------------------------------------------------------------------

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  // ---------------------------------------------------------------------------
  // Primitives
  // ---------------------------------------------------------------------------

  /** Single tone with exponential decay. */
  private beep(freq: number, dur: number, type: OscillatorType = 'sine', time?: number, vol = 0.3): void {
    const ctx = this.ensureCtx();
    const t = time ?? ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(Math.max(vol * this._volume, 0.001), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** Frequency sweep with exponential decay. */
  private sweep(from: number, to: number, dur: number, type: OscillatorType = 'sine', time?: number, vol = 0.25): void {
    const ctx = this.ensureCtx();
    const t = time ?? ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.linearRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(Math.max(vol * this._volume, 0.001), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** Arpeggio — sequence of beeps. */
  private arp(freqs: number[], dur: number, gap: number, type: OscillatorType = 'sine', vol = 0.25): void {
    const ctx = this.ensureCtx();
    const t = ctx.currentTime;
    freqs.forEach((f, i) => this.beep(f, dur, type, t + i * gap, vol));
  }

  /** Band-passed noise burst. */
  private noiseBurst(dur: number, filterFreq: number, time?: number, vol = 0.2): void {
    const ctx = this.ensureCtx();
    const t = time ?? ctx.currentTime;
    const len = Math.max(Math.floor(ctx.sampleRate * dur), 1);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(filterFreq, t);
    f.Q.setValueAtTime(1, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(Math.max(vol * this._volume, 0.001), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  // ---------------------------------------------------------------------------
  // Sound registry
  // ---------------------------------------------------------------------------

  private registry: Record<SoundName, () => void> = {
    // Player interactions
    click:     () => this.beep(800, 0.06, 'sine', undefined, 0.3),
    submit:    () => this.arp([784, 1047], 0.08, 0.07, 'sine', 0.25),

    // Answer feedback
    correct:   () => this.arp([523, 659, 784], 0.12, 0.08, 'sine', 0.3),
    incorrect: () => this.arp([440, 349], 0.18, 0.12, 'sawtooth', 0.15),
    partial:   () => this.arp([523, 622], 0.12, 0.1, 'triangle', 0.2),

    // Countdown
    tick:        () => this.beep(1000, 0.03, 'sine', undefined, 0.15),
    tickUrgent:  () => this.beep(1200, 0.05, 'sine', undefined, 0.3),
    timeUp:      () => this.sweep(500, 200, 0.4, 'square', undefined, 0.25),

    // Phase transitions
    reveal:    () => this.sweep(400, 900, 0.25, 'sine', undefined, 0.25),
    gameStart: () => this.beep(880, 0.15, 'sine', undefined, 0.3),
    gameEnd:   () => {
      const t = this.ensureCtx().currentTime;
      this.beep(196, 1.5, 'sine', t, 0.3);
      this.beep(392, 1.2, 'sine', t, 0.15);
    },

    // Scoring
    score:  () => this.arp([1319, 1568, 1976], 0.06, 0.04, 'sine', 0.2),
    streak: () => {
      const t = this.ensureCtx().currentTime;
      this.sweep(300, 1000, 0.3, 'sine', t, 0.2);
      this.noiseBurst(0.25, 1500, t, 0.15);
    },

    // Leaderboard & podium
    leaderboard: () => this.arp([784, 1047], 0.1, 0.08, 'triangle', 0.2),
    podium3:     () => this.arp([262, 330], 0.2, 0.15, 'triangle', 0.3),
    podium2:     () => this.arp([262, 330, 392], 0.18, 0.12, 'triangle', 0.35),
    podium1:     () => {
      const t = this.ensureCtx().currentTime;
      this.beep(262, 0.15, 'triangle', t, 0.35);
      this.beep(330, 0.15, 'triangle', t + 0.12, 0.35);
      this.beep(392, 0.15, 'triangle', t + 0.24, 0.35);
      this.beep(523, 0.5, 'sine', t + 0.36, 0.4);
    },

    // Celebration
    confetti: () => {
      const t = this.ensureCtx().currentTime;
      for (let i = 0; i < 8; i++) {
        this.beep(800 + Math.random() * 1200, 0.06, 'sine', t + i * 0.04, 0.15);
      }
      this.noiseBurst(0.3, 2000, t, 0.15);
    },

    // Lobby
    join:   () => {
      const t = this.ensureCtx().currentTime;
      this.beep(1200, 0.15, 'sine', t, 0.2);
      this.beep(1800, 0.2, 'sine', t + 0.02, 0.1);
    },
    kicked: () => this.beep(150, 0.3, 'sawtooth', undefined, 0.25),
  };
}

export const soundEngine = new SoundEngine();
