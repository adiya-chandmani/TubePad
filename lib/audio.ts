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
  opts: { start: number; end: number; rate: number; volume: number; loop: boolean }
): PlayHandle {
  const { ctx, master } = getCtx();
  resumeAudio();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = opts.rate;

  const gain = ctx.createGain();
  gain.gain.value = opts.volume;
  source.connect(gain);
  gain.connect(master);

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
