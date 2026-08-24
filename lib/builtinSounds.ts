// Built-in sound library (PRD §28-29). No licensed sample pack — freesound.org
// gates every download behind login (even CC0) and 99sounds.org routes free
// packs through a Gumroad checkout, so neither is fetchable headlessly. Two
// FX sounds use real CC0 files from Kenney.nl (genuinely direct downloads,
// see public/sounds/CREDITS.md); everything else is synthesized in-browser
// with layered oscillators/filtered noise to sound less like a placeholder.

import { decodeBlob } from "./audio";

export type BuiltinCategory = "DRUMS" | "BASS" | "MELODY" | "VOCAL" | "FX";

export interface BuiltinSound {
  id: string;
  name: string;
  category: BuiltinCategory;
  duration: number;
  render?: (ctx: OfflineAudioContext) => void;
  url?: string;
}

interface FilterOpts {
  type: BiquadFilterType;
  freq: number;
  q?: number;
}

function connectThrough(ctx: OfflineAudioContext, node: AudioNode, filter?: FilterOpts): AudioNode {
  if (!filter) return node;
  const f = ctx.createBiquadFilter();
  f.type = filter.type;
  f.frequency.value = filter.freq;
  if (filter.q) f.Q.value = filter.q;
  node.connect(f);
  return f;
}

function noiseBurst(
  ctx: OfflineAudioContext,
  dur: number,
  decay: number,
  gainVal: number,
  filter?: FilterOpts
) {
  const bufferSize = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, decay);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = gainVal;
  const out = connectThrough(ctx, src, filter);
  out.connect(gain);
  gain.connect(ctx.destination);
  src.start(0);
}

function tone(
  ctx: OfflineAudioContext,
  freqStart: number,
  freqEnd: number,
  dur: number,
  type: OscillatorType,
  gainVal: number,
  filter?: FilterOpts,
  attack = 0.002
) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, 0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, 0);
  gain.gain.exponentialRampToValueAtTime(gainVal, attack);
  gain.gain.exponentialRampToValueAtTime(0.001, dur);
  const out = connectThrough(ctx, osc, filter);
  out.connect(gain);
  gain.connect(ctx.destination);
  osc.start(0);
  osc.stop(dur);
}

/** Detuned-oscillator stack for richer harmonic content (piano, pad). */
function chord(
  ctx: OfflineAudioContext,
  freqs: number[],
  type: OscillatorType,
  dur: number,
  gainVal: number,
  attack: number,
  filterFreq: number
) {
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  filter.connect(ctx.destination);

  for (const freq of freqs) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, 0);
    gain.gain.exponentialRampToValueAtTime(gainVal / freqs.length, attack);
    gain.gain.exponentialRampToValueAtTime(0.001, dur);
    osc.connect(gain);
    gain.connect(filter);
    osc.start(0);
    osc.stop(dur);
  }
}

/** Filtered noise transient + a short low tone — approximates a plucked
 * string attack without a true Karplus-Strong feedback loop. */
function pluck(ctx: OfflineAudioContext, freq: number, dur: number, gainVal: number) {
  noiseBurst(ctx, Math.min(0.05, dur), 8, gainVal * 0.6, { type: "bandpass", freq, q: 6 });
  tone(ctx, freq, freq * 0.98, dur, "triangle", gainVal, { type: "lowpass", freq: freq * 4 });
}

/** Sawtooth through two stacked bandpass filters at vowel-ish formant
 * frequencies — reads as vocal-adjacent rather than a bare synth tone. */
function formantVox(ctx: OfflineAudioContext, freqStart: number, freqEnd: number, dur: number, gainVal: number) {
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(freqStart, 0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), dur);

  const f1 = ctx.createBiquadFilter();
  f1.type = "bandpass";
  f1.frequency.value = 700;
  f1.Q.value = 8;
  const f2 = ctx.createBiquadFilter();
  f2.type = "bandpass";
  f2.frequency.value = 1200;
  f2.Q.value = 10;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, 0);
  gain.gain.exponentialRampToValueAtTime(gainVal, 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, dur);

  osc.connect(f1);
  osc.connect(f2);
  f1.connect(gain);
  f2.connect(gain);
  gain.connect(ctx.destination);
  osc.start(0);
  osc.stop(dur);
}

export const BUILTIN_SOUNDS: BuiltinSound[] = [
  // DRUMS
  { id: "kick-01", name: "Kick 01", category: "DRUMS", duration: 0.4, render: (c) => { tone(c, 150, 40, 0.35, "sine", 0.95); noiseBurst(c, 0.02, 10, 0.3, { type: "highpass", freq: 800 }); } },
  { id: "kick-02", name: "Kick 02 (Punchy)", category: "DRUMS", duration: 0.3, render: (c) => { tone(c, 180, 55, 0.25, "sine", 1, { type: "lowpass", freq: 900 }); noiseBurst(c, 0.015, 12, 0.35, { type: "highpass", freq: 1500 }); } },
  { id: "snare-01", name: "Snare 01", category: "DRUMS", duration: 0.25, render: (c) => { tone(c, 200, 150, 0.12, "triangle", 0.4); noiseBurst(c, 0.22, 3, 0.6, { type: "bandpass", freq: 1800, q: 1.2 }); } },
  { id: "hihat-closed", name: "Hi-Hat Closed", category: "DRUMS", duration: 0.1, render: (c) => noiseBurst(c, 0.09, 9, 0.45, { type: "highpass", freq: 7500 }) },
  { id: "hihat-open", name: "Hi-Hat Open", category: "DRUMS", duration: 0.45, render: (c) => noiseBurst(c, 0.42, 2.2, 0.4, { type: "highpass", freq: 6500 }) },
  { id: "crash-01", name: "Crash", category: "DRUMS", duration: 1.4, render: (c) => { noiseBurst(c, 1.35, 1.1, 0.4, { type: "highpass", freq: 4000 }); noiseBurst(c, 1.2, 1.6, 0.2, { type: "bandpass", freq: 9000, q: 0.7 }); } },
  { id: "conga-01", name: "Conga", category: "DRUMS", duration: 0.3, render: (c) => tone(c, 240, 190, 0.28, "sine", 0.7, { type: "lowpass", freq: 1200 }) },
  { id: "shaker-01", name: "Shaker", category: "DRUMS", duration: 0.15, render: (c) => noiseBurst(c, 0.14, 5, 0.35, { type: "highpass", freq: 8500 }) },

  // BASS
  { id: "bass-808", name: "808 Sub", category: "BASS", duration: 0.9, render: (c) => tone(c, 58, 42, 0.85, "sine", 0.9, { type: "lowpass", freq: 250 }) },
  { id: "bass-synth", name: "Synth Bass", category: "BASS", duration: 0.45, render: (c) => tone(c, 90, 85, 0.4, "sawtooth", 0.7, { type: "lowpass", freq: 500 }, 0.005) },
  { id: "bass-pluck", name: "Bass Pluck", category: "BASS", duration: 0.35, render: (c) => pluck(c, 82, 0.32, 0.8) },

  // MELODY
  { id: "synth-pluck", name: "Synth Pluck", category: "MELODY", duration: 0.3, render: (c) => pluck(c, 440, 0.28, 0.6) },
  { id: "piano-note", name: "Piano Note", category: "MELODY", duration: 1.1, render: (c) => chord(c, [261.6, 523.3, 784.9], "triangle", 1.05, 0.7, 0.006, 3500) },
  { id: "warm-pad", name: "Warm Pad", category: "MELODY", duration: 1.6, render: (c) => chord(c, [220, 277.2, 329.6, 440], "sawtooth", 1.5, 0.5, 0.3, 1200) },

  // VOCAL
  { id: "vocal-stab", name: "Vocal Stab", category: "VOCAL", duration: 0.35, render: (c) => formantVox(c, 380, 340, 0.33, 0.5) },
  { id: "vocal-rise", name: "Vocal Rise", category: "VOCAL", duration: 0.5, render: (c) => formantVox(c, 260, 620, 0.48, 0.45) },

  // FX — the two real (CC0, Kenney.nl) sounds live here alongside the synths
  { id: "laser-retro", name: "Laser Retro", category: "FX", duration: 0.29, url: "/sounds/fx/laser-retro.mp3" },
  { id: "impact-metal", name: "Impact Metal", category: "FX", duration: 0.21, url: "/sounds/fx/impact-metal.mp3" },
  { id: "noise-01", name: "Noise Riser", category: "FX", duration: 1.0, render: (c) => noiseBurst(c, 1.0, 0.3, 0.35) },
  { id: "vinyl-01", name: "Vinyl Crackle", category: "FX", duration: 1.2, render: (c) => noiseBurst(c, 1.2, 0.8, 0.15) },
  { id: "sweep-01", name: "Sweep Up", category: "FX", duration: 0.9, render: (c) => tone(c, 200, 3000, 0.9, "sawtooth", 0.25) },
];

const rendered = new Map<string, AudioBuffer>();

export async function renderBuiltinSound(sound: BuiltinSound): Promise<AudioBuffer> {
  const cached = rendered.get(sound.id);
  if (cached) return cached;

  let buffer: AudioBuffer;
  if (sound.url) {
    const res = await fetch(sound.url);
    buffer = await decodeBlob(sound.id, await res.blob());
  } else if (sound.render) {
    const ctx = new OfflineAudioContext(1, Math.ceil(44100 * sound.duration), 44100);
    sound.render(ctx);
    buffer = await ctx.startRendering();
  } else {
    throw new Error(`Builtin sound "${sound.id}" has neither url nor render`);
  }

  rendered.set(sound.id, buffer);
  return buffer;
}
