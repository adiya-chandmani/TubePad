"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { Pad, PadMode, Project, RecordedEvent, SEQUENCER_STEPS, emptyPad, newProject, normalizeProject } from "./types";
import { saveProject, loadProject, LAST_PROJECT_KEY } from "./db";

interface Pending {
  start: number;
  end: number;
  rate: number;
  volume: number;
  pan: number;
  reverse: boolean;
  loop: boolean;
  mode: PadMode;
  name: string;
  sourceType: Pad["sourceType"];
  audioAssetId?: string;
}

const initialPending: Pending = {
  start: 0,
  end: 0,
  rate: 1,
  volume: 1,
  pan: 0,
  reverse: false,
  loop: false,
  mode: "oneshot",
  name: "",
  sourceType: "youtube",
};

const UNDO_STACK_LIMIT = 20;
interface UndoEntry {
  padId: string;
  prevPad: Pad;
}

interface State {
  project: Project;
  selectedPadId: string | null;
  pending: Pending;
  armed: boolean;
  currentTime: number;
  duration: number;
  hydrated: boolean;
  history: UndoEntry[];
}

type Action =
  | { type: "HYDRATE"; project: Project }
  | { type: "LOAD_VIDEO"; videoId: string; title: string; duration: number }
  | { type: "SET_TIME"; time: number }
  | { type: "SET_PENDING"; patch: Partial<Pending> }
  | { type: "ARM" }
  | { type: "DISARM" }
  | { type: "ASSIGN_PENDING_TO_PAD"; padId: string }
  | { type: "ASSIGN_ASSET_TO_PAD"; padId: string; patch: Partial<Pad> }
  | { type: "SELECT_PAD"; padId: string | null }
  | { type: "UPDATE_PAD"; padId: string; patch: Partial<Pad> }
  | { type: "DELETE_PAD"; padId: string }
  | { type: "UNDO" }
  | { type: "CLEAR_YOUTUBE_PADS" }
  | { type: "SET_MASTER_VOLUME"; value: number }
  | { type: "RENAME_PROJECT"; name: string }
  | { type: "NEW_PROJECT" }
  | { type: "SET_BPM"; value: number }
  | { type: "TOGGLE_STEP"; padId: string; stepIndex: number }
  | { type: "CLEAR_SEQUENCER" }
  | { type: "SET_RECORDED_SEQUENCE"; events: RecordedEvent[] };

function pushHistory(history: UndoEntry[], padId: string, prevPad: Pad): UndoEntry[] {
  const next = [...history, { padId, prevPad }];
  return next.length > UNDO_STACK_LIMIT ? next.slice(next.length - UNDO_STACK_LIMIT) : next;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return {
        ...state,
        project: normalizeProject(action.project),
        hydrated: true,
        history: [],
        selectedPadId: null,
        armed: false,
      };
    case "LOAD_VIDEO":
      return {
        ...state,
        project: {
          ...state.project,
          videoId: action.videoId,
          videoTitle: action.title,
        },
        duration: action.duration,
      };
    case "SET_TIME":
      return { ...state, currentTime: action.time };
    case "SET_PENDING":
      return { ...state, pending: { ...state.pending, ...action.patch } };
    case "ARM":
      return { ...state, armed: true };
    case "DISARM":
      return { ...state, armed: false };
    case "ASSIGN_PENDING_TO_PAD": {
      const p = state.pending;
      const prevPad = state.project.pads[action.padId];
      const pad: Pad = {
        id: action.padId,
        name: p.name || action.padId,
        sourceType: p.sourceType,
        videoId: p.sourceType === "youtube" ? state.project.videoId ?? undefined : undefined,
        videoTitle: p.sourceType === "youtube" ? state.project.videoTitle ?? undefined : undefined,
        audioAssetId: p.audioAssetId,
        start: p.start,
        end: p.end,
        playbackRate: p.rate,
        volume: p.volume,
        pan: p.pan,
        reverse: p.reverse,
        loop: p.loop,
        mode: p.mode,
      };
      return {
        ...state,
        project: {
          ...state.project,
          pads: { ...state.project.pads, [action.padId]: pad },
        },
        armed: false,
        selectedPadId: action.padId,
        pending: { ...initialPending, rate: p.rate },
        history: prevPad ? pushHistory(state.history, action.padId, prevPad) : state.history,
      };
    }
    case "ASSIGN_ASSET_TO_PAD": {
      const existing = state.project.pads[action.padId];
      const pad: Pad = { ...existing, ...action.patch, id: action.padId };
      return {
        ...state,
        project: {
          ...state.project,
          pads: { ...state.project.pads, [action.padId]: pad },
        },
        selectedPadId: action.padId,
        history: existing ? pushHistory(state.history, action.padId, existing) : state.history,
      };
    }
    case "SELECT_PAD":
      return { ...state, selectedPadId: action.padId };
    case "UPDATE_PAD": {
      const existing = state.project.pads[action.padId];
      if (!existing) return state;
      return {
        ...state,
        project: {
          ...state.project,
          pads: {
            ...state.project.pads,
            [action.padId]: { ...existing, ...action.patch },
          },
        },
      };
    }
    case "DELETE_PAD": {
      const existing = state.project.pads[action.padId];
      if (!existing) return state;
      return {
        ...state,
        project: {
          ...state.project,
          pads: { ...state.project.pads, [action.padId]: emptyPad(action.padId) },
        },
        selectedPadId: state.selectedPadId === action.padId ? null : state.selectedPadId,
        history: pushHistory(state.history, action.padId, existing),
      };
    }
    case "UNDO": {
      if (state.history.length === 0) return state;
      const entry = state.history[state.history.length - 1];
      return {
        ...state,
        project: {
          ...state.project,
          pads: { ...state.project.pads, [entry.padId]: entry.prevPad },
        },
        selectedPadId: entry.padId,
        history: state.history.slice(0, -1),
      };
    }
    case "CLEAR_YOUTUBE_PADS": {
      const pads = { ...state.project.pads };
      for (const [id, pad] of Object.entries(pads)) {
        if (pad.sourceType === "youtube" && pad.end > pad.start) pads[id] = emptyPad(id);
      }
      return { ...state, project: { ...state.project, pads } };
    }
    case "SET_MASTER_VOLUME":
      return { ...state, project: { ...state.project, masterVolume: action.value } };
    case "RENAME_PROJECT":
      return { ...state, project: { ...state.project, name: action.name } };
    case "NEW_PROJECT":
      return { ...state, project: newProject(), selectedPadId: null, armed: false, history: [] };
    case "SET_BPM":
      return { ...state, project: { ...state.project, bpm: Math.max(20, Math.min(300, action.value)) } };
    case "TOGGLE_STEP": {
      const steps = state.project.sequencerSteps[action.padId] ?? Array(SEQUENCER_STEPS).fill(false);
      const next = [...steps];
      next[action.stepIndex] = !next[action.stepIndex];
      return {
        ...state,
        project: {
          ...state.project,
          sequencerSteps: { ...state.project.sequencerSteps, [action.padId]: next },
        },
      };
    }
    case "CLEAR_SEQUENCER": {
      const steps: Record<string, boolean[]> = {};
      for (const id of Object.keys(state.project.sequencerSteps)) steps[id] = Array(SEQUENCER_STEPS).fill(false);
      return { ...state, project: { ...state.project, sequencerSteps: steps } };
    }
    case "SET_RECORDED_SEQUENCE":
      return { ...state, project: { ...state.project, recordedSequence: action.events } };
    default:
      return state;
  }
}

interface StoreValue {
  state: State;
  dispatch: React.Dispatch<Action>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    project: newProject(),
    selectedPadId: null,
    pending: initialPending,
    armed: false,
    currentTime: 0,
    duration: 0,
    hydrated: false,
    history: [],
  });

  useEffect(() => {
    const lastId = localStorage.getItem(LAST_PROJECT_KEY);
    if (lastId) {
      loadProject(lastId).then((p) => {
        if (p) dispatch({ type: "HYDRATE", project: p });
      });
    }
  }, []);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!state.hydrated && state.project.videoId === null) {
      // avoid persisting the very first empty project before any real edit
      const hasContent = Object.values(state.project.pads).some((p) => p.end > p.start || p.audioAssetId);
      if (!hasContent) return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveProject(state.project);
      localStorage.setItem(LAST_PROJECT_KEY, state.project.id);
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state.project]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

/** The pad currently loaded into the editor: the selected assigned pad if
 * one exists, otherwise a view of the pending (not-yet-assigned) draft. */
export function useEditTarget() {
  const { state } = useStore();
  const selected = state.selectedPadId ? state.project.pads[state.selectedPadId] : null;
  if (selected) return { kind: "pad" as const, pad: selected };
  return { kind: "pending" as const, pending: state.pending };
}
