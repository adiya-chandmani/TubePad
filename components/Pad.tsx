"use client";

import { Pad as PadType, isPadEmpty } from "@/lib/types";

const SOURCE_BADGE: Record<PadType["sourceType"], string> = {
  youtube: "YT",
  builtin: "BI",
  upload: "UP",
};

export function PadButton({
  pad,
  selected,
  pressed,
  onPressDown,
  onPressUp,
  onDragOver,
  onDrop,
}: {
  pad: PadType;
  selected: boolean;
  pressed: boolean;
  onPressDown: () => void;
  onPressUp: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}) {
  const empty = isPadEmpty(pad);

  return (
    <button
      type="button"
      onMouseDown={onPressDown}
      onMouseUp={onPressUp}
      onMouseLeave={onPressUp}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={[
        "relative aspect-square rounded-md flex flex-col items-start justify-between p-2 text-left transition-transform duration-75",
        empty ? "bg-pad/40 border border-dashed border-white/20" : "bg-pad border border-black/40",
        selected ? "ring-2 ring-padActive" : "",
        pressed ? "scale-95 shadow-[0_0_16px_4px_rgba(59,130,246,0.7)] bg-padActive/80" : "",
      ].join(" ")}
    >
      <div className="flex w-full items-start justify-between">
        <span className="font-mono text-[11px] font-bold text-black/70">{pad.id}</span>
        {!empty && (
          <span className="rounded bg-black/70 px-1 text-[9px] font-mono text-white/80">
            {SOURCE_BADGE[pad.sourceType]}
          </span>
        )}
      </div>
      {empty ? (
        <div className="w-full text-center text-[10px] text-black/40">
          <div className="text-lg leading-none">+</div>
          EMPTY
        </div>
      ) : (
        <div className="w-full">
          <div className="truncate text-[10px] font-semibold uppercase text-black/80">
            {pad.name || pad.id}
          </div>
          <div className="text-[10px] text-black/60">{pad.playbackRate.toFixed(2)}x</div>
        </div>
      )}
    </button>
  );
}
