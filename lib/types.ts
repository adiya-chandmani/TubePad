export type PadSource = "youtube" | "builtin" | "upload" | "synth";

export type PadMode = "oneshot" | "hold";

export type SynthWaveform = "sine" | "square" | "sawtooth" | "triangle";

export interface Pad {
  id: string; // keyboard key, e.g. "A", "1"
  name: string;
  sourceType: PadSource;
  videoId?: string;
  videoTitle?: string;
  audioAssetId?: string; // key into IndexedDB "assets" store, for builtin/upload
  start: number;
  end: number;
  playbackRate: number;
  volume: number; // 0..1
  pan: number; // -1 (left) .. 1 (right). YouTube pads ignore this — the IFrame API has no pan control.
  reverse: boolean; // builtin/upload only, same reason (no audio buffer to reverse for synth either).
  loop: boolean;
  mode: PadMode;
  // synth-only — a live oscillator, not a sample, so no start/end/audioAssetId.
  // All-or-nothing: a pad is only ever assigned these together (see
  // ASSIGN_PENDING_TO_PAD), so synthNote's presence alone is a reliable
  // "is this pad actually a configured synth voice" check (isPadEmpty).
  synthWaveform?: SynthWaveform;
  synthNote?: number; // MIDI note number, 60 = C4
  synthAttack?: number; // seconds
  synthDecay?: number; // seconds
  synthSustain?: number; // 0..1 level held between decay and release
  synthRelease?: number; // seconds
  synthFilterCutoff?: number; // Hz
  synthFilterQ?: number;
}

export const DEFAULT_SYNTH = {
  waveform: "sawtooth" as SynthWaveform,
  note: 60,
  attack: 0.01,
  decay: 0.15,
  sustain: 0.6,
  release: 0.2,
  filterCutoff: 4000,
  filterQ: 1,
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function noteName(midiNote: number): string {
  const octave = Math.floor(midiNote / 12) - 1;
  return `${NOTE_NAMES[((midiNote % 12) + 12) % 12]}${octave}`;
}

export interface RecordedEvent {
  time: number; // ms since record start
  padId: string;
  kind: "down" | "up";
}

export interface Project {
  id: string;
  name: string;
  videoId: string | null;
  videoTitle: string | null;
  masterVolume: number;
  pads: Record<string, Pad>;
  bpm: number;
  sequencerSteps: Record<string, boolean[]>; // padId -> 16 step booleans
  recordedSequence: RecordedEvent[];
  updatedAt: number;
}

export const PAD_ROWS: string[][] = [
  ["1", "2", "3", "4"],
  ["Q", "W", "E", "R"],
  ["A", "S", "D", "F"],
  ["Z", "X", "C", "V"],
];

export const PAD_IDS: string[] = PAD_ROWS.flat();

export const RATE_STEPS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export const SEQUENCER_STEPS = 16;

function emptySteps(): Record<string, boolean[]> {
  const steps: Record<string, boolean[]> = {};
  for (const id of PAD_IDS) steps[id] = Array(SEQUENCER_STEPS).fill(false);
  return steps;
}

export function emptyPad(id: string): Pad {
  return {
    id,
    name: "",
    sourceType: "youtube",
    start: 0,
    end: 0,
    playbackRate: 1,
    volume: 1,
    pan: 0,
    reverse: false,
    loop: false,
    mode: "oneshot",
  };
}

export function isPadEmpty(pad: Pad): boolean {
  if (pad.sourceType === "synth") return pad.synthNote === undefined;
  return pad.end <= pad.start && !pad.audioAssetId;
}

export function newProject(name = "Untitled"): Project {
  const pads: Record<string, Pad> = {};
  for (const id of PAD_IDS) pads[id] = emptyPad(id);
  return {
    id: crypto.randomUUID(),
    name,
    videoId: null,
    videoTitle: null,
    masterVolume: 1,
    pads,
    bpm: 120,
    sequencerSteps: emptySteps(),
    recordedSequence: [],
    updatedAt: Date.now(),
  };
}

/** Projects saved by an older build may be missing bpm/sequencerSteps/
 * recordedSequence, or individual pads may be missing fields added later
 * (e.g. pan/reverse) — backfill defaults instead of crashing, or handing
 * React a `value={undefined}` on a controlled input, on load. */
export function normalizeProject(p: Project): Project {
  const pads: Record<string, Pad> = {};
  for (const id of PAD_IDS) {
    pads[id] = { ...emptyPad(id), ...p.pads[id] };
  }
  return {
    ...p,
    pads,
    bpm: p.bpm ?? 120,
    sequencerSteps: p.sequencerSteps ?? emptySteps(),
    recordedSequence: p.recordedSequence ?? [],
  };
}
