/** Moteur audio central — BGM via HTML5 Audio (MP3 + crossfade 1.5 s)
 *  et SFX synthétisés via Web Audio API.
 *
 *  BGM tracks (dans public/audio/) :
 *    LOBBY → game-start.mp3   (menu / lobby / setup)
 *    NIGHT → night.mp3        (phases de nuit)
 *    DAY   → day.mp3          (phases de jour / vote)
 *
 *  Aucune dépendance externe ; SFX 100 % synthétisés. */

// ─────────────────────────────────────────────────────────────────────
//  Mute state
// ─────────────────────────────────────────────────────────────────────

const MUTE_KEY = "mvno-muted";
let muted = false;
const listeners = new Set<(m: boolean) => void>();

export function isMuted(): boolean {
  return muted;
}

export function initAudioPrefs() {
  if (typeof window === "undefined") return;
  muted = localStorage.getItem(MUTE_KEY) === "1";
  listeners.forEach((l) => l(muted));
}

export function subscribeMute(fn: (m: boolean) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function setMuted(next: boolean) {
  muted = next;
  try {
    localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (bgmEl) {
    if (next) {
      // Fade out quickly then pause
      fadeTo(bgmEl, 0, 400, () => {
        bgmEl?.pause();
      });
    } else {
      // Resume then fade in
      const el = bgmEl;
      el.play().catch(() => {});
      fadeTo(el, TARGET_VOL, 400);
    }
  }
  listeners.forEach((l) => l(next));
}

export function toggleMuted() {
  setMuted(!muted);
}

// ─────────────────────────────────────────────────────────────────────
//  BGM — HTML5 Audio with 1.5 s crossfade
// ─────────────────────────────────────────────────────────────────────

export type BgmTrack = "LOBBY" | "NIGHT" | "DAY";

const TRACK_FILES: Record<BgmTrack, string> = {
  LOBBY: "game-start.mp3",
  NIGHT: "night.mp3",
  DAY: "day.mp3",
};

const CROSSFADE_MS = 1500;
const TARGET_VOL = 0.65; // Comfortable ambient level

/** Active BGM element (may be fading in or playing at target volume). */
let bgmEl: HTMLAudioElement | null = null;
let bgmTrack: BgmTrack | null = null;

// Attach a fade-timer ID directly on the element to allow cancellation.
interface AEF extends HTMLAudioElement {
  __fadeId?: ReturnType<typeof setInterval>;
}

function fadeTo(
  el: HTMLAudioElement,
  to: number,
  ms: number,
  onDone?: () => void,
) {
  const e = el as AEF;
  if (e.__fadeId !== undefined) {
    clearInterval(e.__fadeId);
    e.__fadeId = undefined;
  }
  const from = e.volume;
  const diff = to - from;
  if (Math.abs(diff) < 0.001) {
    e.volume = to;
    onDone?.();
    return;
  }
  const TICK = 16; // ~60 fps
  const steps = Math.ceil(ms / TICK);
  let step = 0;
  e.__fadeId = setInterval(() => {
    step++;
    e.volume = Math.min(1, Math.max(0, from + diff * (step / steps)));
    if (step >= steps) {
      clearInterval(e.__fadeId!);
      e.__fadeId = undefined;
      e.volume = to;
      onDone?.();
    }
  }, TICK);
}

function trackSrc(track: BgmTrack): string {
  // BASE_URL has a trailing slash (Vite convention)
  return `${import.meta.env.BASE_URL}audio/${TRACK_FILES[track]}`;
}

/**
 * Start (or switch to) a BGM track with a 1.5 s crossfade.
 *  - If the same track is already playing, this is a no-op.
 *  - If a different track is playing, the outgoing track fades out
 *    while the incoming track fades in simultaneously.
 */
export function startBgm(track: BgmTrack): void {
  // Already playing this track — nothing to do
  if (bgmTrack === track && bgmEl && !bgmEl.paused) return;

  bgmTrack = track;
  const old = bgmEl;

  const el = new Audio(trackSrc(track));
  el.loop = true;
  el.volume = 0;
  bgmEl = el;

  if (!muted) {
    el.play().catch(() => {
      // Autoplay was blocked (e.g. no prior user gesture).
      // The audio will start naturally on the next call once the context
      // is unlocked via unlockAudio().
    });
    fadeTo(el, TARGET_VOL, CROSSFADE_MS);
  }

  // Fade out and release the outgoing track
  if (old) {
    fadeTo(old, 0, CROSSFADE_MS, () => {
      old.pause();
      old.src = ""; // release resource
    });
  }
}

/**
 * Fade the current BGM to silence and stop it.
 * Call when reaching the home screen or game over.
 */
export function clearBgm(): void {
  bgmTrack = null;
  const old = bgmEl;
  bgmEl = null;
  if (old) {
    fadeTo(old, 0, CROSSFADE_MS, () => {
      old.pause();
      old.src = "";
    });
  }
}

// ─────────────────────────────────────────────────────────────────────
//  Web Audio context — used exclusively for SFX
// ─────────────────────────────────────────────────────────────────────

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  ctx = ctx ?? new Ctor();
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}

/** Call on the first user interaction to unblock Web Audio on mobile. */
export function unlockAudio() {
  audioCtx();
}

// ─────────────────────────────────────────────────────────────────────
//  SFX helpers
// ─────────────────────────────────────────────────────────────────────

function sfx(fn: (c: AudioContext) => void) {
  if (muted) return;
  const c = audioCtx();
  if (!c) return;
  fn(c);
}

function tone(
  c: AudioContext,
  opts: {
    type: OscillatorType;
    from: number;
    to: number;
    start: number;
    dur: number;
    gain?: number;
  },
) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = opts.type;
  const t = c.currentTime + opts.start;
  osc.frequency.setValueAtTime(opts.from, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, opts.to), t + opts.dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.25, t + opts.dur * 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + opts.dur + 0.05);
}

function noise(c: AudioContext, start: number, dur: number, gain = 0.2) {
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++)
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 700;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(c.destination);
  src.start(c.currentTime + start);
}

// ─────────────────────────────────────────────────────────────────────
//  SFX exports
// ─────────────────────────────────────────────────────────────────────

/** Web Speech API narration for role names. */
export function speakRole(roleName: string, lang = "fr-FR") {
  if (muted) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(roleName);
  u.lang = lang;
  u.pitch = 0.7;
  u.rate = 0.85;
  u.volume = 1;
  window.speechSynthesis.speak(u);
}

/** Grognement d'ours */
export function playBearGrowl() {
  sfx((c) => {
    tone(c, { type: "sawtooth", from: 110, to: 45, start: 0, dur: 1.4, gain: 0.35 });
    tone(c, { type: "square", from: 70, to: 38, start: 0.1, dur: 1.2, gain: 0.2 });
    noise(c, 0, 1.4, 0.15);
  });
}

/** Hurlement de loup */
export function playWolfHowl() {
  sfx((c) => {
    tone(c, { type: "sine", from: 300, to: 620, start: 0, dur: 0.7, gain: 0.3 });
    tone(c, { type: "sine", from: 620, to: 240, start: 0.7, dur: 1.6, gain: 0.3 });
    tone(c, { type: "triangle", from: 150, to: 300, start: 0.2, dur: 1.8, gain: 0.12 });
  });
}

/** Clameur du village (victoire des Villageois) */
export function playCheer() {
  sfx((c) => {
    noise(c, 0, 1.8, 0.28);
    [523, 659, 784, 1046].forEach((f, i) =>
      tone(c, { type: "triangle", from: f, to: f, start: i * 0.12, dur: 0.5, gain: 0.18 }),
    );
  });
}

/** Alerte fin de temps de parole */
export function playTimeUpAlert() {
  sfx((c) => {
    [0, 0.3, 0.6].forEach((s) =>
      tone(c, { type: "square", from: 880, to: 880, start: s, dur: 0.18, gain: 0.25 }),
    );
  });
}

/** Tombée de la nuit : nappe descendante + souffle */
export function playNightFall() {
  sfx((c) => {
    tone(c, { type: "sine", from: 420, to: 60, start: 0, dur: 2.2, gain: 0.22 });
    tone(c, { type: "triangle", from: 210, to: 45, start: 0.15, dur: 2, gain: 0.14 });
    noise(c, 0, 2.2, 0.1);
  });
}

/** Cloche du matin */
export function playMorningBell() {
  sfx((c) => {
    [880, 1174, 1760].forEach((f, i) =>
      tone(c, { type: "sine", from: f, to: f * 0.99, start: i * 0.05, dur: 2.4, gain: 0.16 }),
    );
    tone(c, { type: "triangle", from: 440, to: 438, start: 0, dur: 2.6, gain: 0.1 });
  });
}

/** Marteau du Juge (égalité / arbitrage) */
export function playGavel() {
  sfx((c) => {
    [0, 0.22].forEach((s) => {
      tone(c, { type: "square", from: 180, to: 60, start: s, dur: 0.16, gain: 0.32 });
      noise(c, s, 0.16, 0.22);
    });
  });
}

/** Tic de comptage des voix */
export function playVoteTick() {
  sfx((c) => {
    tone(c, { type: "square", from: 1200, to: 900, start: 0, dur: 0.07, gain: 0.14 });
  });
}
