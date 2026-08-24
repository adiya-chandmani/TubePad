"use client";

import { Pad as PadType, isPadEmpty, noteName } from "@/lib/types";

const SOURCE_BADGE: Record<PadType["sourceType"], string> = {
  youtube: "YT",
  builtin: "BI",
  upload: "UP",
  synth: "SY",
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
        "relative h-full w-full rounded-none flex flex-col items-start justify-between p-2 text-left border-2 border-black transition-transform duration-75",
        empty ? "bg-navy/60 border-dashed border-gold/40" : "bg-cream shadow-pixelSm",
        selected ? "outline outline-2 outline-offset-1 outline-gold" : "",
        pressed ? "translate-x-[2px] translate-y-[2px] shadow-none bg-red" : "",
      ].join(" ")}
    >
      <div className="flex w-full items-start justify-between">
        <span className={`font-display text-[10px] ${pressed ? "text-cream" : empty ? "text-cream/50" : "text-navyDeep"}`}>
          {pad.id}
        </span>
        {!empty && (
          <span className="bg-navyDeep px-1 text-[9px] font-pixel leading-tight text-gold">
            {SOURCE_BADGE[pad.sourceType]}
          </span>
        )}
      </div>
      {empty ? (
        <div className="w-full text-center font-pixel text-sm text-cream/40">
          <div className="text-lg leading-none">+</div>
          EMPTY
        </div>
      ) : (
        <div className="w-full">
          <div className={`truncate font-pixel text-sm leading-tight ${pressed ? "text-cream" : "text-navyDeep"}`}>
            {pad.name || pad.id}
          </div>
          <div className={`font-pixel text-xs ${pressed ? "text-cream/80" : "text-navyDeep/70"}`}>
            {pad.sourceType === "synth" ? noteName(pad.synthNote ?? 60) : `${pad.playbackRate.toFixed(2)}x`}
          </div>
        </div>
      )}
    </button>
  );
}
