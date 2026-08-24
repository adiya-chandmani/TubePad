"use client";

import { formatTime } from "@/lib/format";

const NUDGE_STEP = 0.01; // 10ms — the PRD's K1/K2 fine-adjust knobs, as nudge buttons

export function TransportControls({
  start,
  end,
  armed,
  disabled,
  hideTimeline,
  onSetStart,
  onSetEnd,
  onNudgeStart,
  onNudgeEnd,
  onPreview,
  onAssign,
}: {
  start: number;
  end: number;
  armed: boolean;
  disabled: boolean;
  hideTimeline?: boolean;
  onSetStart: () => void;
  onSetEnd: () => void;
  onNudgeStart: (deltaSeconds: number) => void;
  onNudgeEnd: (deltaSeconds: number) => void;
  onPreview: () => void;
  onAssign: () => void;
}) {
  const duration = Math.max(0, end - start);
  // A synth voice is always "ready" (defaults cover every param) — only
  // a sample's Start/End trim needs a real duration before it can be
  // previewed or assigned.
  const canPreviewOrAssign = hideTimeline || duration > 0;

  return (
    <div className="flex flex-col gap-1.5 shrink-0">
      {!hideTimeline && (
        <div className="flex justify-between font-pixel text-lg text-cream/90">
          <span className="flex items-center gap-1">
            START <span className="text-gold">{formatTime(start)}</span>
            <NudgeButtons disabled={disabled} onNudge={onNudgeStart} />
          </span>
          <span className="flex items-center gap-1">
            END <span className="text-gold">{formatTime(end)}</span>
            <NudgeButtons disabled={disabled} onNudge={onNudgeEnd} />
          </span>
          <span className="text-cream/50">{duration.toFixed(3)}s</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {!hideTimeline && (
          <>
            <button onClick={onSetStart} disabled={disabled} className={btnClass()}>
              SET START <span className="opacity-60">[I]</span>
            </button>
            <button onClick={onSetEnd} disabled={disabled} className={btnClass()}>
              SET END <span className="opacity-60">[O]</span>
            </button>
          </>
        )}
        <button onClick={onPreview} disabled={!canPreviewOrAssign} className={btnClass()}>
          ▶ PREVIEW
        </button>
        <button
          onClick={onAssign}
          disabled={!canPreviewOrAssign}
          className={btnClass(armed ? "bg-gold text-navyDeep" : "")}
        >
          {armed ? "SELECT PAD…" : "ASSIGN"}
        </button>
      </div>
    </div>
  );
}

function NudgeButtons({ disabled, onNudge }: { disabled: boolean; onNudge: (delta: number) => void }) {
  return (
    <span className="flex gap-0.5 text-sm">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onNudge(-NUDGE_STEP)}
        className="border border-black bg-cream px-1 text-navyDeep disabled:opacity-30"
        title={`-${NUDGE_STEP * 1000}ms`}
      >
        −
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onNudge(NUDGE_STEP)}
        className="border border-black bg-cream px-1 text-navyDeep disabled:opacity-30"
        title={`+${NUDGE_STEP * 1000}ms`}
      >
        +
      </button>
    </span>
  );
}

function btnClass(extra = "") {
  return `rounded-none border-2 border-black bg-cream shadow-pixelSm px-2.5 py-1 font-pixel text-base text-navyDeep hover:brightness-95 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-30 disabled:shadow-none disabled:active:translate-x-0 disabled:active:translate-y-0 ${extra}`;
}
