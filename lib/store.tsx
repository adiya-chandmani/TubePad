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
import { Pad, PadMode, Project, newProject } from "./types";
import { saveProject, loadProject, LAST_PROJECT_KEY } from "./db";

interface Pending {
  start: number;
  end: number;
  rate: number;
  volume: number;
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
  loop: false,
  mode: "oneshot",
  name: "",
  sourceType: "youtube",
};

interface State {
  project: Project;
  selectedPadId: string | null;
  pending: Pending;
  armed: boolean;
  currentTime: number;
  duration: number;
  hydrated: boolean;
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
  | { type: "SET_MASTER_VOLUME"; value: number }
  | { type: "RENAME_PROJECT"; name: string }
  | { type: "NEW_PROJECT" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, project: action.project, hydrated: true };
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
      const cleared: Pad = {
        id: action.padId,
        name: "",
        sourceType: "youtube",
        start: 0,
        end: 0,
        playbackRate: 1,
        volume: 1,
        loop: false,
        mode: "oneshot",
      };
      return {
        ...state,
        project: {
          ...state.project,
          pads: { ...state.project.pads, [action.padId]: cleared },
        },
        selectedPadId: state.selectedPadId === action.padId ? null : state.selectedPadId,
      };
    }
    case "SET_MASTER_VOLUME":
      return { ...state, project: { ...state.project, masterVolume: action.value } };
    case "RENAME_PROJECT":
      return { ...state, project: { ...state.project, name: action.name } };
    case "NEW_PROJECT":
      return { ...state, project: newProject(), selectedPadId: null, armed: false };
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
