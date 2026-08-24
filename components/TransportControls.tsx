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
    <div className="flex flex-col gap-2">
      <div className="flex justify-between font-mono text-sm text-white/90">
        <span>
          START <span className="text-padActive">{formatTime(start)}</span>
        </span>
        <span>
          END <span className="text-padActive">{formatTime(end)}</span>
        </span>
        <span className="text-white/50">{duration.toFixed(3)}s</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={onSetStart} disabled={disabled} className={btnClass()}>
          SET START <kbd className="opacity-50">I</kbd>
        </button>
        <button onClick={onSetEnd} disabled={disabled} className={btnClass()}>
          SET END <kbd className="opacity-50">O</kbd>
        </button>
        <button onClick={onPreview} disabled={disabled || duration <= 0} className={btnClass()}>
          ▶ PREVIEW
        </button>
        <button
          onClick={onAssign}
          disabled={disabled || duration <= 0}
          className={btnClass(armed ? "bg-fx text-black" : "")}
        >
          {armed ? "SELECT PAD…" : "ASSIGN"}
        </button>
      </div>
    </div>
  );
}

function btnClass(extra = "") {
  return `rounded border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 ${extra}`;
}
