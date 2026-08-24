export type PadSource = "youtube" | "builtin" | "upload";

export type PadMode = "oneshot" | "hold";

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
  reverse: boolean; // builtin/upload only, same reason.
  loop: boolean;
  mode: PadMode;
}

export interface Project {
  id: string;
  name: string;
  videoId: string | null;
  videoTitle: string | null;
  masterVolume: number;
  pads: Record<string, Pad>;
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
    updatedAt: Date.now(),
  };
}
