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
    <div className="flex flex-col gap-3 rounded border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase text-white/60">
          {editingPadLabel ? `Editing Pad ${editingPadLabel}` : "New Sample"}
        </span>
        {onDelete && (
          <button
            onClick={onDelete}
            className="rounded bg-rec/80 px-2 py-1 text-[10px] font-bold text-white hover:bg-rec"
          >
            ERASE
          </button>
        )}
      </div>

      <label className="flex flex-col gap-1 text-xs text-white/70">
        NAME
        <input
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Vocal Chop"
          className="rounded bg-black/40 border border-white/20 px-2 py-1 text-sm text-white outline-none focus:border-padActive"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-white/70">
        PLAY RATE — {values.rate.toFixed(2)}x
        <input
          type="range"
          min={RATE_STEPS[0]}
          max={RATE_STEPS[RATE_STEPS.length - 1]}
          step={0.05}
          value={values.rate}
          onChange={(e) => onChange({ rate: Number(e.target.value) })}
          className="accent-padActive"
        />
        <div className="flex justify-between text-[10px] text-white/40">
          {RATE_STEPS.map((r) => (
            <span key={r}>{r}x</span>
          ))}
        </div>
      </label>

      <label className="flex flex-col gap-1 text-xs text-white/70">
        VOLUME — {Math.round(values.volume * 100)}
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={values.volume}
          onChange={(e) => onChange({ volume: Number(e.target.value) })}
          className="accent-padActive"
        />
      </label>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            checked={values.loop}
            onChange={(e) => onChange({ loop: e.target.checked })}
          />
          LOOP
        </label>

        <div className="flex items-center gap-1 text-xs text-white/70">
          MODE
          <button
            onClick={() => onChange({ mode: "oneshot" })}
            className={`rounded px-2 py-0.5 ${values.mode === "oneshot" ? "bg-padActive text-white" : "bg-white/10"}`}
          >
            ONE SHOT
          </button>
          <button
            onClick={() => onChange({ mode: "hold" })}
            className={`rounded px-2 py-0.5 ${values.mode === "hold" ? "bg-padActive text-white" : "bg-white/10"}`}
          >
            HOLD
          </button>
        </div>
      </div>
    </div>
  );
}
