"use client";

import { RATE_STEPS } from "@/lib/types";

export interface EditorValues {
  name: string;
  rate: number;
  volume: number;
  loop: boolean;
  mode: "oneshot" | "hold";
}

export function SampleEditor({
  values,
  onChange,
  onDelete,
  editingPadLabel,
}: {
  values: EditorValues;
  onChange: (patch: Partial<EditorValues>) => void;
  onDelete?: () => void;
  editingPadLabel: string | null;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-none border-2 border-gold/50 bg-black/20 p-2 shrink-0">
      <div className="flex items-center justify-between">
        <span className="font-pixel text-lg text-cream/70">
          {editingPadLabel ? `EDITING PAD ${editingPadLabel}` : "NEW SAMPLE"}
        </span>
        {onDelete && (
          <button
            onClick={onDelete}
            className="rounded-none border-2 border-black bg-red px-2 py-0.5 font-display text-[9px] text-cream hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px]"
          >
            ERASE
          </button>
        )}
      </div>

      <label className="flex flex-col gap-0.5 font-pixel text-base text-cream/70">
        NAME
        <input
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Vocal Chop"
          className="rounded-none bg-black/40 border-2 border-gold/40 px-2 py-0.5 font-pixel text-lg text-cream outline-none focus:border-gold"
        />
      </label>

      <label className="flex flex-col gap-0.5 font-pixel text-base text-cream/70">
        PLAY RATE — {values.rate.toFixed(2)}x
        <input
          type="range"
          min={RATE_STEPS[0]}
          max={RATE_STEPS[RATE_STEPS.length - 1]}
          step={0.05}
          value={values.rate}
          onChange={(e) => onChange({ rate: Number(e.target.value) })}
          className="accent-gold"
        />
        <div className="flex justify-between text-xs text-cream/40">
          {RATE_STEPS.map((r) => (
            <span key={r}>{r}x</span>
          ))}
        </div>
      </label>

      <label className="flex flex-col gap-0.5 font-pixel text-base text-cream/70">
        VOLUME — {Math.round(values.volume * 100)}
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={values.volume}
          onChange={(e) => onChange({ volume: Number(e.target.value) })}
          className="accent-gold"
        />
      </label>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 font-pixel text-base text-cream/70">
          <input
            type="checkbox"
            checked={values.loop}
            onChange={(e) => onChange({ loop: e.target.checked })}
          />
          LOOP
        </label>

        <div className="flex items-center gap-1 font-pixel text-base text-cream/70">
          MODE
          <button
            onClick={() => onChange({ mode: "oneshot" })}
            className={`rounded-none border-2 border-black px-2 py-0.5 ${values.mode === "oneshot" ? "bg-gold text-navyDeep" : "bg-black/30"}`}
          >
            ONE SHOT
          </button>
          <button
            onClick={() => onChange({ mode: "hold" })}
            className={`rounded-none border-2 border-black px-2 py-0.5 ${values.mode === "hold" ? "bg-gold text-navyDeep" : "bg-black/30"}`}
          >
            HOLD
          </button>
        </div>
      </div>
    </div>
  );
}
