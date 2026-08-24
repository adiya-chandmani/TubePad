"use client";

import { formatTime } from "@/lib/format";

export function ChopYoutubePanel({
  currentTime,
  duration,
  markers,
  onTap,
  onRemove,
  onApply,
  onClose,
}: {
  currentTime: number;
  duration: number;
  markers: number[];
  onTap: () => void;
  onRemove: (index: number) => void;
  onApply: () => void;
  onClose: () => void;
}) {
  const sliceCount = Math.max(0, markers.length - 1);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
      <div className="w-[560px] max-w-[92vw] border-4 border-gold bg-navyDeep p-4 shadow-pixel">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-red text-xs">CHOP — YOUTUBE (MANUAL TAP)</h2>
          <button onClick={onClose} className="border-2 border-black bg-cream px-2 py-0.5 font-pixel text-navyDeep">
            ✕
          </button>
        </div>

        <p className="font-pixel text-base text-cream/70 mb-2">
          Play the video, hit TAP at each point you want a slice boundary. Consecutive taps become one slice
          each — {sliceCount} slice{sliceCount === 1 ? "" : "s"} so far.
        </p>

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

        <button
          onClick={onTap}
          className="w-full mb-3 border-2 border-black bg-red text-cream shadow-pixelSm px-3 py-2 font-display text-xs hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px]"
        >
          TAP MARKER — {formatTime(currentTime)}
        </button>

        <div className="flex flex-wrap gap-1 mb-3 max-h-24 overflow-y-auto">
          {markers.map((m, i) => (
            <span
              key={i}
              className="flex items-center gap-1 border-2 border-black bg-cream px-1 font-pixel text-sm text-navyDeep"
            >
              {formatTime(m)}
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
