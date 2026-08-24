"use client";

import { formatTime } from "@/lib/format";

export function TransportControls({
  start,
  end,
  armed,
  disabled,
  onSetStart,
  onSetEnd,
  onPreview,
  onAssign,
}: {
  start: number;
  end: number;
  armed: boolean;
  disabled: boolean;
  onSetStart: () => void;
  onSetEnd: () => void;
  onPreview: () => void;
  onAssign: () => void;
}) {
  const duration = Math.max(0, end - start);

  return (
    <div className="flex flex-col gap-1.5 shrink-0">
      <div className="flex justify-between font-pixel text-lg text-cream/90">
        <span>
          START <span className="text-gold">{formatTime(start)}</span>
        </span>
        <span>
          END <span className="text-gold">{formatTime(end)}</span>
        </span>
        <span className="text-cream/50">{duration.toFixed(3)}s</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={onSetStart} disabled={disabled} className={btnClass()}>
          SET START <span className="opacity-60">[I]</span>
        </button>
        <button onClick={onSetEnd} disabled={disabled} className={btnClass()}>
          SET END <span className="opacity-60">[O]</span>
        </button>
        <button onClick={onPreview} disabled={disabled || duration <= 0} className={btnClass()}>
          ▶ PREVIEW
        </button>
        <button
          onClick={onAssign}
          disabled={disabled || duration <= 0}
          className={btnClass(armed ? "bg-gold text-navyDeep" : "")}
        >
          {armed ? "SELECT PAD…" : "ASSIGN"}
        </button>
      </div>
    </div>
  );
}

function btnClass(extra = "") {
  return `rounded-none border-2 border-black bg-cream shadow-pixelSm px-2.5 py-1 font-pixel text-base text-navyDeep hover:brightness-95 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-30 disabled:shadow-none disabled:active:translate-x-0 disabled:active:translate-y-0 ${extra}`;
}
