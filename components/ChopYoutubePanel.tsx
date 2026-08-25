"use client";

import { formatTime } from "@/lib/format";

const NUDGE_STEP = 0.01;

export function ChopYoutubePanel({
  currentTime,
  duration,
  markers,
  onTap,
  onPlayFromStart,
  onRemove,
  onNudge,
  onApply,
  onClose,
  autoDetectSupported,
  isAutoDetecting,
  autoDetectError,
  sensitivity,
  onSensitivityChange,
  onStartAutoDetect,
  onStopAutoDetect,
}: {
  currentTime: number;
  duration: number;
  markers: number[];
  onTap: () => void;
  onPlayFromStart: () => void;
  onRemove: (index: number) => void;
  onNudge: (index: number, deltaSeconds: number) => void;
  onApply: () => void;
  onClose: () => void;
  autoDetectSupported: boolean;
  isAutoDetecting: boolean;
  autoDetectError: string | null;
  sensitivity: number;
  onSensitivityChange: (v: number) => void;
  onStartAutoDetect: () => void;
  onStopAutoDetect: () => void;
}) {
  const sliceCount = Math.max(0, markers.length - 1);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
      <div className="w-[560px] max-w-[92vw] border-4 border-gold bg-navyDeep p-4 shadow-pixel">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-red text-xs">CHOP — YOUTUBE</h2>
          <button onClick={onClose} className="border-2 border-black bg-cream px-2 py-0.5 font-pixel text-navyDeep">
            ✕
          </button>
        </div>

        <button
          onClick={onPlayFromStart}
          className="w-full mb-3 border-2 border-black bg-gold shadow-pixelSm px-3 py-1.5 font-display text-[10px] text-navyDeep hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px]"
        >
          ⏮ PLAY FROM START
        </button>

        <div className="relative h-8 border-2 border-gold/50 bg-black/40 mb-3">
          {duration > 0 && (
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-cream"
              style={{ left: `${Math.min(100, (currentTime / duration) * 100)}%` }}
            />
          )}
          {markers.map((m, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-[2px] bg-red"
              style={{ left: `${duration > 0 ? (m / duration) * 100 : 0}%` }}
              title={formatTime(m)}
            />
          ))}
        </div>

        <p className="font-pixel text-base text-cream/70 mb-2">
          Play the video, hit TAP at each boundary (auto-compensated ~150ms for reaction lag — nudge markers below
          if still off). {sliceCount} slice{sliceCount === 1 ? "" : "s"} so far.
        </p>

        <button
          onClick={onTap}
          disabled={isAutoDetecting}
          className="w-full mb-2 border-2 border-black bg-red text-cream shadow-pixelSm px-3 py-2 font-display text-xs hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-40"
        >
          TAP MARKER — {formatTime(currentTime)}
        </button>

        {autoDetectSupported ? (
          <div className="mb-3 border-2 border-gold/40 p-2">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={isAutoDetecting ? onStopAutoDetect : onStartAutoDetect}
                className={`flex-1 border-2 border-black px-2 py-1 font-display text-[10px] ${
                  isAutoDetecting ? "bg-red text-cream animate-pulse" : "bg-gold text-navyDeep"
                }`}
              >
                {isAutoDetecting ? "● LISTENING — STOP" : "🎙 AUTO-DETECT (TAB AUDIO)"}
              </button>
            </div>
            {!isAutoDetecting && (
              <label className="flex flex-col gap-0.5 font-pixel text-sm text-cream/60">
                SENSITIVITY — {Math.round(sensitivity * 100)}
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={sensitivity}
                  onChange={(e) => onSensitivityChange(Number(e.target.value))}
                  className="accent-gold"
                />
              </label>
            )}
            <p className="font-pixel text-sm text-cream/40 mt-1">
              Picks up markers automatically while the video plays. Needs a browser permission prompt — pick this
              tab and check &quot;Share tab audio&quot;.
            </p>
            {autoDetectError && <p className="font-pixel text-sm text-red mt-1">{autoDetectError}</p>}
          </div>
        ) : (
          <p className="font-pixel text-sm text-cream/40 mb-3">
            Auto-detect (tab audio capture) isn&apos;t supported in this browser — manual tap only.
          </p>
        )}

        <div className="flex flex-wrap gap-1 mb-3 max-h-24 overflow-y-auto">
          {markers.map((m, i) => (
            <span
              key={i}
              className="flex items-center gap-1 border-2 border-black bg-cream px-1 font-pixel text-sm text-navyDeep"
            >
              <button onClick={() => onNudge(i, -NUDGE_STEP)} className="font-bold">
                −
              </button>
              {formatTime(m)}
              <button onClick={() => onNudge(i, NUDGE_STEP)} className="font-bold">
                +
              </button>
              <button onClick={() => onRemove(i)} className="font-bold text-red">
                ✕
              </button>
            </span>
          ))}
        </div>

        <button
          onClick={onApply}
          disabled={sliceCount < 1}
          className="w-full border-2 border-black bg-gold shadow-pixelSm px-3 py-2 font-display text-xs text-navyDeep disabled:opacity-40"
        >
          ASSIGN {sliceCount} SLICE{sliceCount === 1 ? "" : "S"} TO NEXT EMPTY PADS
        </button>
      </div>
    </div>
  );
}
