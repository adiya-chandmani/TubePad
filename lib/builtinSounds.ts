// Built-in sound library (PRD §28-29). Real sample packs need licensed
// audio assets we don't have; these are short synthesized placeholders
// covering the required categories so the drag-to-pad flow is real end to
// end. Swap generateBuffer() for fetch()+decodeAudioData() against real
// files later — BuiltinSound.id stays a stable asset id either way.

export type BuiltinCategory = "DRUMS" | "FX" | "BASS" | "VOCAL";

export interface BuiltinSound {
  id: string;
  name: string;
  category: BuiltinCategory;
  duration: number;
  render: (ctx: OfflineAudioContext) => void;
}

function noiseBurst(ctx: OfflineAudioContext, dur: number, decay: number, gainVal: number) {
  const bufferSize = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, decay);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = gainVal;
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(0);
}

function tone(
  ctx: OfflineAudioContext,
  freqStart: number,
  freqEnd: number,
  dur: number,
  type: OscillatorType,
  gainVal: number
) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, 0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainVal, 0);
  gain.gain.exponentialRampToValueAtTime(0.001, dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(0);
  osc.stop(dur);
}

export const BUILTIN_SOUNDS: BuiltinSound[] = [
  { id: "kick-01", name: "Kick 01", category: "DRUMS", duration: 0.4, render: (c) => tone(c, 150, 40, 0.35, "sine", 0.9) },
  { id: "kick-02", name: "Kick 02", category: "DRUMS", duration: 0.35, render: (c) => tone(c, 110, 35, 0.3, "sine", 0.9) },
  { id: "snare-01", name: "Snare 01", category: "DRUMS", duration: 0.25, render: (c) => { tone(c, 200, 150, 0.12, "triangle", 0.4); noiseBurst(c, 0.25, 3, 0.6); } },
  { id: "hihat-01", name: "Hi-Hat 01", category: "DRUMS", duration: 0.12, render: (c) => noiseBurst(c, 0.12, 6, 0.5) },
  { id: "hihat-02", name: "Hi-Hat Open", category: "DRUMS", duration: 0.35, render: (c) => noiseBurst(c, 0.35, 3, 0.4) },
  { id: "clap-01", name: "Clap 01", category: "DRUMS", duration: 0.3, render: (c) => noiseBurst(c, 0.3, 2.5, 0.6) },
  { id: "perc-01", name: "Perc 01", category: "DRUMS", duration: 0.2, render: (c) => tone(c, 600, 300, 0.2, "square", 0.3) },
  { id: "perc-02", name: "Perc 02", category: "DRUMS", duration: 0.18, render: (c) => tone(c, 900, 400, 0.18, "triangle", 0.3) },
  { id: "impact-01", name: "Impact 01", category: "FX", duration: 0.8, render: (c) => { tone(c, 80, 20, 0.8, "sine", 0.8); noiseBurst(c, 0.8, 1.5, 0.4); } },
  { id: "noise-01", name: "Noise Riser", category: "FX", duration: 1.0, render: (c) => noiseBurst(c, 1.0, 0.3, 0.35) },
  { id: "vinyl-01", name: "Vinyl Crackle", category: "FX", duration: 1.2, render: (c) => noiseBurst(c, 1.2, 0.8, 0.15) },
  { id: "sweep-01", name: "Sweep Up", category: "FX", duration: 0.9, render: (c) => tone(c, 200, 3000, 0.9, "sawtooth", 0.25) },
  { id: "bass-01", name: "Bass Hit", category: "BASS", duration: 0.5, render: (c) => tone(c, 90, 55, 0.5, "sawtooth", 0.6) },
  { id: "bass-02", name: "Sub Bass", category: "BASS", duration: 0.6, render: (c) => tone(c, 60, 40, 0.6, "sine", 0.7) },
  { id: "vocal-01", name: "Vocal Stab", category: "VOCAL", duration: 0.4, render: (c) => tone(c, 500, 350, 0.4, "sawtooth", 0.3) },
  { id: "vocal-02", name: "Vocal Rise", category: "VOCAL", duration: 0.5, render: (c) => tone(c, 300, 700, 0.5, "triangle", 0.3) },
];

const rendered = new Map<string, AudioBuffer>();

export async function renderBuiltinSound(sound: BuiltinSound): Promise<AudioBuffer> {
  const cached = rendered.get(sound.id);
  if (cached) return cached;
  const ctx = new OfflineAudioContext(1, Math.ceil(44100 * sound.duration), 44100);
  sound.render(ctx);
  const buffer = await ctx.startRendering();
  rendered.set(sound.id, buffer);
  return buffer;
}
