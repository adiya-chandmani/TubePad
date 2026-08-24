// Web Audio playback for builtin + uploaded pads (PRD §28-30, §57).
// YouTube pads are driven separately via the IFrame player (lib/youtube.ts).

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
const bufferCache = new Map<string, AudioBuffer>();

function getCtx(): { ctx: AudioContext; master: GainNode } {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
  }
  return { ctx, master: masterGain! };
}

export function setMasterVolume(v: number) {
  if (masterGain) masterGain.gain.value = v;
}

export function resumeAudio() {
  const { ctx } = getCtx();
  if (ctx.state === "suspended") void ctx.resume();
}

export async function decodeBlob(id: string, blob: Blob): Promise<AudioBuffer> {
  const cached = bufferCache.get(id);
  if (cached) return cached;
  const { ctx } = getCtx();
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
  bufferCache.set(id, buffer);
  return buffer;
}

export function cacheBuffer(id: string, buffer: AudioBuffer) {
  bufferCache.set(id, buffer);
}

export function getCachedBuffer(id: string): AudioBuffer | undefined {
  return bufferCache.get(id);
}

export interface PlayHandle {
  stop: () => void;
}

export function playBuffer(
  buffer: AudioBuffer,
  opts: { start: number; end: number; rate: number; volume: number; pan?: number; loop: boolean }
): PlayHandle {
  const { ctx, master } = getCtx();
  resumeAudio();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = opts.rate;

  const gain = ctx.createGain();
  gain.gain.value = opts.volume;
  const panner = ctx.createStereoPanner();
  panner.pan.value = opts.pan ?? 0;
  source.connect(gain);
  gain.connect(panner);
  panner.connect(master);

  const end = opts.end > opts.start ? opts.end : buffer.duration;

  if (opts.loop) {
    source.loop = true;
    source.loopStart = opts.start;
    source.loopEnd = end;
    source.start(0, opts.start);
  } else {
    const wallDuration = (end - opts.start) / opts.rate;
    source.start(0, opts.start);
    source.stop(ctx.currentTime + wallDuration);
  }

  return {
    stop: () => {
      try {
        source.stop();
      } catch {
        // already stopped
      }
    },
  };
}

// --- pure synth voice: live oscillator, no sample buffer at all ---------

export interface SynthParams {
  waveform: OscillatorType;
  note: number; // MIDI note number
  attack: number;
  decay: number;
  sustain: number; // 0..1
  release: number;
  filterCutoff: number;
  filterQ: number;
  volume: number;
  pan: number;
}

export function noteToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export interface SynthVoice {
  /** Begins the release ramp; the oscillator actually stops `release`
   * seconds later. Calling it twice is a no-op. */
  release: () => void;
}

export function startSynthVoice(params: SynthParams): SynthVoice {
  const { ctx, master } = getCtx();
  resumeAudio();

  const osc = ctx.createOscillator();
  osc.type = params.waveform;
  osc.frequency.value = noteToFrequency(params.note);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = params.filterCutoff;
  filter.Q.value = params.filterQ;

  const gain = ctx.createGain();
  const panner = ctx.createStereoPanner();
  panner.pan.value = params.pan;

  const now = ctx.currentTime;
  const attack = Math.max(params.attack, 0.005);
  const decay = Math.max(params.decay, 0.005);
  const peak = Math.max(params.volume, 0.0001);
  const sustainLevel = Math.max(peak * params.sustain, 0.0001);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + attack);
  gain.gain.exponentialRampToValueAtTime(sustainLevel, now + attack + decay);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(panner);
  panner.connect(master);
  osc.start(now);

  let released = false;
  return {
    release: () => {
      if (released) return;
      released = true;
      const t = ctx.currentTime;
      const releaseTime = Math.max(params.release, 0.02);
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + releaseTime);
      osc.stop(t + releaseTime + 0.02);
    },
  };
}

const reversedCache = new Map<string, AudioBuffer>();

/** Reversed copy of a buffer, cached per source id. A sample trimmed to
 * [start, end] and then reversed plays back as [duration-end, duration-start]
 * of the reversed buffer — the caller is responsible for that translation. */
export function getReversedBuffer(id: string, buffer: AudioBuffer): AudioBuffer {
  const cached = reversedCache.get(id);
  if (cached) return cached;
  const { ctx } = getCtx();
  const reversed = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    reversed.copyToChannel(Float32Array.from(buffer.getChannelData(ch)).reverse(), ch);
  }
  reversedCache.set(id, reversed);
  return reversed;
}
