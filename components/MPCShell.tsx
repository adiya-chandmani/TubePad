"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { isPadEmpty, PAD_IDS, RATE_STEPS, RecordedEvent, SEQUENCER_STEPS } from "@/lib/types";
import { createPlayer, extractVideoId, TubePadPlayer, YT_STATE } from "@/lib/youtube";
import { PlaybackEngine } from "@/lib/engine";
import { setMasterVolume, decodeBlob, cacheBuffer } from "@/lib/audio";
import { saveAsset, isStorageAvailable } from "@/lib/db";
import { BUILTIN_SOUNDS, renderBuiltinSound } from "@/lib/builtinSounds";
import { BUILTIN_DRAG_TYPE } from "./SampleLibrary";

import { YouTubePlayerPanel } from "./YouTubePlayerPanel";
import { TransportControls } from "./TransportControls";
import { PadGrid } from "./PadGrid";
import { SequencerGrid } from "./SequencerGrid";
import { BpmControl } from "./BpmControl";
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
  const [loadError, setLoadError] = useState<string | null>(null);
  // db.ts's availability check reads `typeof indexedDB` — always "available"
  // on the server, so this can't be decided during the SSR render or it
  // mismatches on hydration. Defer to a client-only effect instead.
  const [storageAvailable, setStorageAvailable] = useState(true);
  useEffect(() => setStorageAvailable(isStorageAvailable()), []);

  // --- performance record/playback + step sequencer -------------------
  const [seqMode, setSeqMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [isSeqPlaying, setIsSeqPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  // setInterval/setTimeout callbacks below are scheduled once and outlive
  // the render that created them, so they'd otherwise read a stale
  // `state.project` from closure — this ref keeps them reading current data.
  const projectRef = useRef(state.project);
  useEffect(() => {
    projectRef.current = state.project;
  }, [state.project]);

  const isRecordingRef = useRef(false);
  const recordStartRef = useRef(0);
  const recordedEventsRef = useRef<RecordedEvent[]>([]);
  const playbackTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const seqTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seqStepRef = useRef(0);

  const selectedPad = state.selectedPadId ? state.project.pads[state.selectedPadId] : null;
  const editStart = selectedPad ? selectedPad.start : state.pending.start;
  const editEnd = selectedPad ? selectedPad.end : state.pending.end;
  const editRate = selectedPad ? selectedPad.playbackRate : state.pending.rate;
  const editVolume = selectedPad ? selectedPad.volume : state.pending.volume;
  const editPan = selectedPad ? selectedPad.pan : state.pending.pan;
  const editReverse = selectedPad ? selectedPad.reverse : state.pending.reverse;
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
      pan?: number;
      reverse?: boolean;
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
      setLoadError("Could not read a video id from that URL.");
      return;
    }

    // Pads store start/end as raw seconds into whatever video was loaded
    // when they were assigned — swapping the video without clearing them
    // would seek YouTube pads to the wrong moments in a different video.
    const hasYoutubePads = Object.values(state.project.pads).some(
      (p) => p.sourceType === "youtube" && p.end > p.start
    );
    if (state.project.videoId && state.project.videoId !== videoId && hasYoutubePads) {
      const proceed = confirm(
        "This project has YouTube pads keyed to the current video. Loading a different video will clear them (builtin/upload pads are unaffected). Continue?"
      );
      if (!proceed) return;
      dispatch({ type: "CLEAR_YOUTUBE_PADS" });
    }

    setLoadError(null);
    ytPlayer?.destroy();
    try {
      const player = await createPlayer("tubepad-yt-player", videoId, {
        onReady: (title, duration) => {
          dispatch({ type: "LOAD_VIDEO", videoId, title, duration });
        },
        onStateChange: (s) => {
          if (s === YT_STATE.PLAYING) isPlayingRef.current = true;
          if (s === YT_STATE.PAUSED || s === YT_STATE.ENDED) isPlayingRef.current = false;
        },
        onError: (code) => {
          // createPlayer also rejects on error; this covers errors that
          // arrive after the player already resolved (e.g. a later cue).
          void code;
        },
      });
      engineRef.current.setYoutubePlayer(player);
      setYtPlayer(player);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Couldn't load this video.");
    }
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

  const stopPlayback = useCallback(() => {
    playbackTimeoutsRef.current.forEach(clearTimeout);
    playbackTimeoutsRef.current = [];
    setIsPlayingBack(false);
  }, []);

  const stopSequencer = useCallback(() => {
    if (seqTimerRef.current) clearInterval(seqTimerRef.current);
    seqTimerRef.current = null;
    setIsSeqPlaying(false);
    setCurrentStep(-1);
  }, []);

  const stopRecording = useCallback(
    (commit: boolean) => {
      isRecordingRef.current = false;
      setIsRecording(false);
      if (commit) dispatch({ type: "SET_RECORDED_SEQUENCE", events: recordedEventsRef.current });
    },
    [dispatch]
  );

  const toggleRecording = useCallback(() => {
    if (isRecordingRef.current) {
      stopRecording(true);
      return;
    }
    stopPlayback();
    stopSequencer();
    recordedEventsRef.current = [];
    recordStartRef.current = performance.now();
    isRecordingRef.current = true;
    setIsRecording(true);
  }, [stopPlayback, stopSequencer, stopRecording]);

  const playRecorded = useCallback(() => {
    const events = projectRef.current.recordedSequence;
    if (events.length === 0) return;
    stopRecording(false);
    stopSequencer();
    stopPlayback();
    setIsPlayingBack(true);
    for (const ev of events) {
      const t = setTimeout(() => {
        if (ev.kind === "down") handlePadDown(ev.padId, false);
        else handlePadUp(ev.padId);
      }, ev.time);
      playbackTimeoutsRef.current.push(t);
    }
    const endTimer = setTimeout(() => setIsPlayingBack(false), events[events.length - 1].time + 200);
    playbackTimeoutsRef.current.push(endTimer);
  }, [handlePadDown, handlePadUp, stopPlayback, stopRecording, stopSequencer]);

  // --- pad trigger entry points that a human actually pressed (mouse or
  // keyboard) — wraps handlePadDown/Up to also capture recording events.
  // Sequencer/playback trigger pads directly via handlePadDown/Up so they
  // don't re-record their own output.
  const userPadDown = useCallback(
    (padId: string, repeat: boolean) => {
      if (isRecordingRef.current && !repeat) {
        recordedEventsRef.current.push({ time: performance.now() - recordStartRef.current, padId, kind: "down" });
      }
      handlePadDown(padId, repeat);
    },
    [handlePadDown]
  );

  const userPadUp = useCallback(
    (padId: string) => {
      if (isRecordingRef.current) {
        recordedEventsRef.current.push({ time: performance.now() - recordStartRef.current, padId, kind: "up" });
      }
      handlePadUp(padId);
    },
    [handlePadUp]
  );

  const fireSequencerStep = useCallback((stepIndex: number) => {
    const project = projectRef.current;
    for (const padId of PAD_IDS) {
      if (!project.sequencerSteps[padId]?.[stepIndex]) continue;
      const pad = project.pads[padId];
      if (!pad || isPadEmpty(pad)) continue;
      engineRef.current.triggerDown(pad, { repeat: false });
      setPressed((prev) => new Set(prev).add(padId));
      setTimeout(() => {
        setPressed((prev) => {
          const next = new Set(prev);
          next.delete(padId);
          return next;
        });
      }, 80);
    }
  }, []);

  const playSequencer = useCallback(() => {
    stopRecording(false);
    stopPlayback();
    stopSequencer();
    const stepMs = 60000 / Math.max(1, projectRef.current.bpm) / 4; // 16th notes
    seqStepRef.current = 0;
    setCurrentStep(0);
    fireSequencerStep(0);
    seqTimerRef.current = setInterval(() => {
      seqStepRef.current = (seqStepRef.current + 1) % SEQUENCER_STEPS;
      setCurrentStep(seqStepRef.current);
      fireSequencerStep(seqStepRef.current);
    }, stepMs);
    setIsSeqPlaying(true);
  }, [fireSequencerStep, stopPlayback, stopRecording, stopSequencer]);

  // Stop every transport on unmount so intervals/timeouts don't fire after
  // the component (and its engine/AudioContext usage) is gone.
  useEffect(() => {
    return () => {
      playbackTimeoutsRef.current.forEach(clearTimeout);
      if (seqTimerRef.current) clearInterval(seqTimerRef.current);
    };
  }, []);

  // --- global keyboard shortcuts (§10, §14, §20, §49) -----------------
  useEffect(() => {
    const keyToPad = new Map<string, string>();
    for (const id of Object.keys(state.project.pads)) keyToPad.set(id.toLowerCase(), id);

    // Only a genuine typing field should eat pad-trigger keys. Checkboxes,
    // range sliders, and buttons keep DOM focus after a click but a stray
    // letter key on them shouldn't swallow the next pad press — that read
    // as "reverse got stuck on" when it was really just focus trapped on
    // the checkbox from the previous click.
    function isTypingTarget(target: HTMLElement): boolean {
      if (target.tagName === "TEXTAREA") return true;
      if (target.tagName !== "INPUT") return false;
      const type = (target as HTMLInputElement).type;
      return type === "text" || type === "search" || type === "email" || type === "url" || type === "number";
    }

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (isTypingTarget(target)) return;

      const key = e.key.toLowerCase();

      if ((e.metaKey || e.ctrlKey) && key === "z") {
        e.preventDefault();
        dispatch({ type: "UNDO" });
        return;
      }

      const padId = keyToPad.get(key);
      if (padId) {
        e.preventDefault();
        userPadDown(padId, e.repeat);
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
      if (isTypingTarget(target)) return;
      const padId = keyToPad.get(e.key.toLowerCase());
      if (padId) userPadUp(padId);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [state.project.pads, state.selectedPadId, ytPlayer, editRate, userPadDown, userPadUp, patchEdit, dispatch]);

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
      {!storageAvailable && (
        <div className="fixed inset-x-0 bottom-0 bg-red text-cream text-center text-xs py-1 z-30 font-pixel">
          Storage unavailable (private browsing?) — your project won't be saved after this tab closes.
        </div>
      )}

      <div className="relative w-full max-w-6xl h-full max-h-[900px] flex flex-col rounded-none bg-navyDeep p-3 border-4 border-gold shadow-pixel">
        <div className="flex items-center justify-between mb-3 shrink-0 gap-3 flex-wrap">
          <h1 className="font-display text-red text-[13px] leading-none tracking-tight [text-shadow:2px_2px_0_#000]">
            TUBEPAD
          </h1>

          <BpmControl bpm={state.project.bpm} onChange={(v) => dispatch({ type: "SET_BPM", value: v })} />

          <div className="flex items-center gap-1.5 font-pixel text-lg">
            <button
              type="button"
              onClick={() => setSeqMode((v) => !v)}
              className={`border-2 border-black px-2 py-0.5 whitespace-nowrap ${seqMode ? "bg-gold text-navyDeep" : "bg-cream text-navyDeep"}`}
              title="Toggle between the pad grid and the step sequencer"
            >
              SEQ
            </button>
            <button
              type="button"
              onClick={toggleRecording}
              className={`border-2 border-black px-2 py-0.5 whitespace-nowrap ${isRecording ? "bg-red text-cream animate-pulse" : "bg-cream text-navyDeep"}`}
              title="Record a live pad performance"
            >
              ● REC
            </button>
            <button
              type="button"
              onClick={seqMode ? playSequencer : playRecorded}
              disabled={seqMode ? isSeqPlaying : state.project.recordedSequence.length === 0}
              className="border-2 border-black bg-cream px-2 py-0.5 text-navyDeep whitespace-nowrap disabled:opacity-30"
              title={seqMode ? "Play the step sequencer" : "Play back the last recording"}
            >
              ▶ PLAY
            </button>
            <button
              type="button"
              onClick={() => {
                stopPlayback();
                stopSequencer();
                stopRecording(true);
              }}
              className="border-2 border-black bg-cream px-2 py-0.5 text-navyDeep whitespace-nowrap"
              title="Stop recording / playback / sequencer"
            >
              ■ STOP
            </button>
          </div>

          <label className="flex items-center gap-2 font-pixel text-lg text-cream/80">
            MAIN VOL
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={state.project.masterVolume}
              onChange={(e) => dispatch({ type: "SET_MASTER_VOLUME", value: Number(e.target.value) })}
              className="w-20 accent-gold"
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
              error={loadError}
              onLoad={handleLoadUrl}
            />

            <TransportControls
              start={editStart}
              end={editEnd}
              armed={state.armed}
              disabled={!ytPlayer}
              onSetStart={() => patchEdit({ start: ytPlayer?.player.getCurrentTime() ?? 0 })}
              onSetEnd={() => patchEdit({ end: ytPlayer?.player.getCurrentTime() ?? 0 })}
              onNudgeStart={(delta) => patchEdit({ start: Math.max(0, editStart + delta) })}
              onNudgeEnd={(delta) => patchEdit({ end: Math.max(editStart, editEnd + delta) })}
              onPreview={() =>
                engineRef.current.preview({
                  sourceType: editSourceType,
                  start: editStart,
                  end: editEnd,
                  rate: editRate,
                  pan: editPan,
                  reverse: editReverse,
                  audioAssetId: selectedPad?.audioAssetId ?? state.pending.audioAssetId,
                })
              }
              onAssign={() => dispatch({ type: state.armed ? "DISARM" : "ARM" })}
            />

            {seqMode ? (
              <SequencerGrid
                pads={state.project.pads}
                steps={state.project.sequencerSteps}
                currentStep={currentStep}
                onToggleStep={(padId, i) => dispatch({ type: "TOGGLE_STEP", padId, stepIndex: i })}
              />
            ) : (
              <PadGrid
                pressedIds={pressed}
                onDropAsset={handleDropAsset}
                onPadDown={(id) => userPadDown(id, false)}
                onPadUp={(id) => userPadUp(id)}
              />
            )}
          </div>

          <div className="flex flex-col gap-2 min-h-0">
            <DisplayScreen />
            <SampleEditor
              editingPadLabel={state.selectedPadId}
              sourceType={editSourceType}
              values={{
                name: editName,
                rate: editRate,
                volume: editVolume,
                pan: editPan,
                reverse: editReverse,
                loop: editLoop,
                mode: editMode,
              }}
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
                  patch: {
                    sourceType: "upload",
                    audioAssetId: assetId,
                    start: 0,
                    end: duration,
                    name,
                    pan: 0,
                    reverse: false,
                  },
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
