"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { isPadEmpty, RATE_STEPS } from "@/lib/types";
import { createPlayer, extractVideoId, TubePadPlayer, YT_STATE } from "@/lib/youtube";
import { PlaybackEngine } from "@/lib/engine";
import { setMasterVolume, decodeBlob, cacheBuffer } from "@/lib/audio";
import { saveAsset } from "@/lib/db";
import { BUILTIN_SOUNDS, renderBuiltinSound } from "@/lib/builtinSounds";
import { BUILTIN_DRAG_TYPE } from "./SampleLibrary";

import { YouTubePlayerPanel } from "./YouTubePlayerPanel";
import { TransportControls } from "./TransportControls";
import { PadGrid } from "./PadGrid";
import { DisplayScreen } from "./DisplayScreen";
import { SampleEditor } from "./SampleEditor";
import { SampleLibrary } from "./SampleLibrary";
import { ProjectManager } from "./ProjectManager";

function nearestRateStep(rate: number, dir: 1 | -1): number {
  const idx = RATE_STEPS.findIndex((r) => r > rate - 1e-6);
  if (dir === 1) {
    const next = RATE_STEPS.find((r) => r > rate + 1e-6);
    return next ?? RATE_STEPS[RATE_STEPS.length - 1];
  }
  const rev = [...RATE_STEPS].reverse();
  const prev = rev.find((r) => r < rate - 1e-6);
  return prev ?? RATE_STEPS[0];
}

export function MPCShell() {
  const { state, dispatch } = useStore();
  const engineRef = useRef<PlaybackEngine>(new PlaybackEngine());
  const [ytPlayer, setYtPlayer] = useState<TubePadPlayer | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const isPlayingRef = useRef(false);

  const selectedPad = state.selectedPadId ? state.project.pads[state.selectedPadId] : null;
  const editStart = selectedPad ? selectedPad.start : state.pending.start;
  const editEnd = selectedPad ? selectedPad.end : state.pending.end;
  const editRate = selectedPad ? selectedPad.playbackRate : state.pending.rate;
  const editVolume = selectedPad ? selectedPad.volume : state.pending.volume;
  const editLoop = selectedPad ? selectedPad.loop : state.pending.loop;
  const editMode = selectedPad ? selectedPad.mode : state.pending.mode;
  const editName = selectedPad ? selectedPad.name : state.pending.name;
  const editSourceType = selectedPad ? selectedPad.sourceType : state.pending.sourceType;

  const patchEdit = useCallback(
    (patch: {
      start?: number;
      end?: number;
      rate?: number;
      volume?: number;
      loop?: boolean;
      mode?: "oneshot" | "hold";
      name?: string;
    }) => {
      if (state.selectedPadId) {
        const padPatch: Record<string, unknown> = { ...patch };
        if ("rate" in padPatch) {
          padPatch.playbackRate = padPatch.rate;
          delete padPatch.rate;
        }
        dispatch({ type: "UPDATE_PAD", padId: state.selectedPadId, patch: padPatch });
      } else {
        dispatch({ type: "SET_PENDING", patch });
      }
    },
    [state.selectedPadId, dispatch]
  );

  // --- YouTube player lifecycle -------------------------------------
  async function handleLoadUrl(url: string) {
    const videoId = extractVideoId(url);
    if (!videoId) {
      alert("Could not read a video id from that URL.");
      return;
    }
    ytPlayer?.destroy();
    const player = await createPlayer("tubepad-yt-player", videoId, {
      onReady: (title, duration) => {
        dispatch({ type: "LOAD_VIDEO", videoId, title, duration });
      },
      onStateChange: (s) => {
        if (s === YT_STATE.PLAYING) isPlayingRef.current = true;
        if (s === YT_STATE.PAUSED || s === YT_STATE.ENDED) isPlayingRef.current = false;
      },
    });
    engineRef.current.setYoutubePlayer(player);
    setYtPlayer(player);
  }

  // Pre-render every builtin sound once at startup so the first press of
  // any pad never has to wait on OfflineAudioContext rendering — that
  // render (not the Web Audio playback itself) was the perceptible delay.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const sound of BUILTIN_SOUNDS) {
        const buffer = await renderBuiltinSound(sound);
        if (cancelled) return;
        cacheBuffer(sound.id, buffer);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ytPlayer) return;
    const id = setInterval(() => {
      setCurrentTime(ytPlayer.player.getCurrentTime());
    }, 100);
    return () => clearInterval(id);
  }, [ytPlayer]);

  useEffect(() => {
    setMasterVolume(state.project.masterVolume);
    ytPlayer?.player.setVolume(state.project.masterVolume * 100);
  }, [state.project.masterVolume, ytPlayer]);

  // --- pad trigger (shared by mouse + keyboard) ----------------------
  const handlePadDown = useCallback(
    (padId: string, repeat: boolean) => {
      if (state.armed) {
        if (!repeat) dispatch({ type: "ASSIGN_PENDING_TO_PAD", padId });
        return;
      }
      const pad = state.project.pads[padId];
      if (!pad) return;
      if (!repeat) dispatch({ type: "SELECT_PAD", padId });
      if (!isPadEmpty(pad)) {
        engineRef.current.triggerDown(pad, { repeat });
        if (!repeat) setPressed((prev) => new Set(prev).add(padId));
      }
    },
    [state.armed, state.project.pads, dispatch]
  );

  const handlePadUp = useCallback(
    (padId: string) => {
      setPressed((prev) => {
        if (!prev.has(padId)) return prev;
        const next = new Set(prev);
        next.delete(padId);
        return next;
      });
      const pad = state.project.pads[padId];
      if (pad) engineRef.current.triggerUp(pad);
    },
    [state.project.pads]
  );

  // --- global keyboard shortcuts (§10, §14, §20, §49) -----------------
  useEffect(() => {
    const keyToPad = new Map<string, string>();
    for (const id of Object.keys(state.project.pads)) keyToPad.set(id.toLowerCase(), id);

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const key = e.key.toLowerCase();
      const padId = keyToPad.get(key);
      if (padId) {
        e.preventDefault();
        handlePadDown(padId, e.repeat);
        return;
      }

      if (e.repeat) return;

      switch (e.key) {
        case " ": {
          e.preventDefault();
          const p = ytPlayer?.player;
          if (!p) return;
          if (isPlayingRef.current) p.pauseVideo();
          else p.playVideo();
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          const p = ytPlayer?.player;
          if (!p) return;
          p.seekTo(Math.max(0, p.getCurrentTime() - (e.shiftKey ? 1 : 5)), true);
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          const p = ytPlayer?.player;
          if (!p) return;
          p.seekTo(p.getCurrentTime() + (e.shiftKey ? 1 : 5), true);
          break;
        }
        case "i":
        case "I": {
          const t = ytPlayer?.player.getCurrentTime() ?? 0;
          patchEdit({ start: t });
          break;
        }
        case "o":
        case "O": {
          const t = ytPlayer?.player.getCurrentTime() ?? 0;
          patchEdit({ end: t });
          break;
        }
        case "[":
          patchEdit({ rate: nearestRateStep(editRate, -1) });
          break;
        case "]":
          patchEdit({ rate: nearestRateStep(editRate, 1) });
          break;
        case "\\":
          patchEdit({ rate: 1 });
          break;
        case "Backspace":
        case "Delete":
          if (state.selectedPadId) dispatch({ type: "DELETE_PAD", padId: state.selectedPadId });
          break;
        case "Escape":
          dispatch({ type: "SELECT_PAD", padId: null });
          dispatch({ type: "DISARM" });
          break;
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      const padId = keyToPad.get(e.key.toLowerCase());
      if (padId) handlePadUp(padId);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [state.project.pads, state.selectedPadId, ytPlayer, editRate, handlePadDown, handlePadUp, patchEdit, dispatch]);

  // --- drag & drop onto pads (builtin sound or local file) ------------
  async function handleDropAsset(padId: string, e: React.DragEvent) {
    if (e.dataTransfer.files?.length) {
      const file = e.dataTransfer.files[0];
      const assetId = crypto.randomUUID();
      await saveAsset(assetId, file);
      const buffer = await decodeBlob(assetId, file);
      dispatch({
        type: "ASSIGN_ASSET_TO_PAD",
        padId,
        patch: {
          sourceType: "upload",
          audioAssetId: assetId,
          start: 0,
          end: buffer.duration,
          name: file.name.replace(/\.[^.]+$/, ""),
          playbackRate: 1,
          volume: 1,
          loop: false,
          mode: "oneshot",
        },
      });
      return;
    }
    const builtinId = e.dataTransfer.getData(BUILTIN_DRAG_TYPE);
    if (builtinId) {
      const sound = BUILTIN_SOUNDS.find((s) => s.id === builtinId);
      if (!sound) return;
      dispatch({
        type: "ASSIGN_ASSET_TO_PAD",
        padId,
        patch: {
          sourceType: "builtin",
          audioAssetId: sound.id,
          start: 0,
          end: sound.duration,
          name: sound.name,
          playbackRate: 1,
          volume: 1,
          loop: false,
          mode: "oneshot",
        },
      });
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-navy text-cream flex items-center justify-center p-3">
      <div className="hidden max-[900px]:block fixed inset-x-0 top-0 bg-gold text-navyDeep text-center text-xs py-1 z-30 font-pixel">
        TubePad works best on desktop. Open this site on a computer for the full MPC experience.
      </div>

      <div className="relative w-full max-w-6xl h-full max-h-[900px] flex flex-col rounded-none bg-navyDeep p-3 border-4 border-gold shadow-pixel">
        <div className="flex items-center justify-between mb-3 shrink-0 gap-3">
          <h1 className="font-display text-red text-[13px] leading-none tracking-tight [text-shadow:2px_2px_0_#000]">
            TUBEPAD
          </h1>
          <label className="flex items-center gap-2 font-pixel text-lg text-cream/80">
            MAIN VOL
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={state.project.masterVolume}
              onChange={(e) => dispatch({ type: "SET_MASTER_VOLUME", value: Number(e.target.value) })}
              className="w-24 accent-gold"
            />
          </label>
          <ProjectManager />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 flex-1 min-h-0">
          <div className="flex flex-col gap-2 min-h-0">
            <YouTubePlayerPanel
              title={state.project.videoTitle}
              currentTime={currentTime}
              duration={state.duration}
              onLoad={handleLoadUrl}
            />

            <TransportControls
              start={editStart}
              end={editEnd}
              armed={state.armed}
              disabled={!ytPlayer}
              onSetStart={() => patchEdit({ start: ytPlayer?.player.getCurrentTime() ?? 0 })}
              onSetEnd={() => patchEdit({ end: ytPlayer?.player.getCurrentTime() ?? 0 })}
              onPreview={() =>
                engineRef.current.preview({
                  sourceType: editSourceType,
                  start: editStart,
                  end: editEnd,
                  rate: editRate,
                })
              }
              onAssign={() => dispatch({ type: state.armed ? "DISARM" : "ARM" })}
            />

            <PadGrid
              pressedIds={pressed}
              onDropAsset={handleDropAsset}
              onPadDown={(id) => handlePadDown(id, false)}
              onPadUp={(id) => handlePadUp(id)}
            />
          </div>

          <div className="flex flex-col gap-2 min-h-0">
            <DisplayScreen />
            <SampleEditor
              editingPadLabel={state.selectedPadId}
              values={{ name: editName, rate: editRate, volume: editVolume, loop: editLoop, mode: editMode }}
              onChange={(patch) => patchEdit(patch)}
              onDelete={
                state.selectedPadId
                  ? () => dispatch({ type: "DELETE_PAD", padId: state.selectedPadId! })
                  : undefined
              }
            />
            <SampleLibrary
              onImportStaged={(assetId, name, duration) => {
                dispatch({
                  type: "SET_PENDING",
                  patch: { sourceType: "upload", audioAssetId: assetId, start: 0, end: duration, name },
                });
                dispatch({ type: "ARM" });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
