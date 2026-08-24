"use client";

import { RATE_STEPS, PadSource, SynthWaveform, noteName } from "@/lib/types";

export interface EditorValues {
  name: string;
  rate: number;
  volume: number;
  pan: number;
  reverse: boolean;
  loop: boolean;
  mode: "oneshot" | "hold";
  synthWaveform: SynthWaveform;
  synthNote: number;
  synthAttack: number;
  synthDecay: number;
  synthSustain: number;
  synthRelease: number;
  synthFilterCutoff: number;
  synthFilterQ: number;
}

const WAVEFORMS: SynthWaveform[] = ["sine", "square", "sawtooth", "triangle"];
const WAVE_LABEL: Record<SynthWaveform, string> = { sine: "SIN", square: "SQR", sawtooth: "SAW", triangle: "TRI" };

export function SampleEditor({
  values,
  sourceType,
  onChange,
  onDelete,
  onChop,
  editingPadLabel,
}: {
  values: EditorValues;
  sourceType: PadSource;
  onChange: (patch: Partial<EditorValues>) => void;
  onDelete?: () => void;
  onChop?: () => void;
  editingPadLabel: string | null;
}) {
  const isSynth = sourceType === "synth";
  // YouTube pads are driven by the IFrame API, which has no pan control.
  // Reverse needs an actual audio buffer, so neither YouTube nor a live
  // synth oscillator supports it.
  const supportsPan = sourceType !== "youtube";
  const supportsReverse = sourceType === "builtin" || sourceType === "upload";
  const supportsChop = editingPadLabel && (sourceType === "builtin" || sourceType === "upload");

  return (
    <div className="flex flex-col gap-2 rounded-none border-2 border-gold/50 bg-black/20 p-2 shrink-0">
      <div className="flex items-center justify-between">
        <span className="font-pixel text-lg text-cream/70">
          {editingPadLabel ? `EDITING PAD ${editingPadLabel}` : "NEW SAMPLE"}
        </span>
        <div className="flex gap-1">
          {supportsChop && (
            <button
              onClick={onChop}
              className="rounded-none border-2 border-black bg-gold px-2 py-0.5 font-display text-[9px] text-navyDeep hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px]"
              title="Chop this sample into multiple pads"
            >
              ✂ CHOP
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="rounded-none border-2 border-black bg-red px-2 py-0.5 font-display text-[9px] text-cream hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px]"
            >
              ERASE
            </button>
          )}
        </div>
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

      {isSynth ? (
        <>
          <div className="flex flex-col gap-0.5 font-pixel text-base text-cream/70">
            WAVEFORM
            <div className="flex gap-1">
              {WAVEFORMS.map((w) => (
                <button
                  key={w}
                  onClick={() => onChange({ synthWaveform: w })}
                  className={`flex-1 whitespace-nowrap rounded-none border-2 border-black px-1 py-0.5 ${values.synthWaveform === w ? "bg-gold text-navyDeep" : "bg-black/30"}`}
                >
                  {WAVE_LABEL[w]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 font-pixel text-base text-cream/70">
            NOTE
            <button
              onClick={() => onChange({ synthNote: Math.max(24, values.synthNote - 1) })}
              className="border-2 border-black bg-cream px-2 text-navyDeep"
            >
              −
            </button>
            <span className="w-10 text-center text-gold">{noteName(values.synthNote)}</span>
            <button
              onClick={() => onChange({ synthNote: Math.min(96, values.synthNote + 1) })}
              className="border-2 border-black bg-cream px-2 text-navyDeep"
            >
              +
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1 font-pixel text-xs text-cream/70">
            <MiniSlider label="ATK" value={values.synthAttack} max={2} onChange={(v) => onChange({ synthAttack: v })} />
            <MiniSlider label="DEC" value={values.synthDecay} max={2} onChange={(v) => onChange({ synthDecay: v })} />
            <MiniSlider label="SUS" value={values.synthSustain} max={1} onChange={(v) => onChange({ synthSustain: v })} />
            <MiniSlider label="REL" value={values.synthRelease} max={3} onChange={(v) => onChange({ synthRelease: v })} />
          </div>

          <div className="grid grid-cols-2 gap-2 font-pixel text-xs text-cream/70">
            <label className="flex flex-col gap-0.5">
              FILTER {Math.round(values.synthFilterCutoff)}Hz
              <input
                type="range"
                min={200}
                max={12000}
                step={50}
                value={values.synthFilterCutoff}
                onChange={(e) => onChange({ synthFilterCutoff: Number(e.target.value) })}
                className="accent-gold"
              />
            </label>
            <label className="flex flex-col gap-0.5">
              RESO {values.synthFilterQ.toFixed(1)}
              <input
                type="range"
                min={0.1}
                max={20}
                step={0.1}
                value={values.synthFilterQ}
                onChange={(e) => onChange({ synthFilterQ: Number(e.target.value) })}
                className="accent-gold"
              />
            </label>
          </div>
        </>
      ) : (
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
      )}

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

      <label className={`flex flex-col gap-0.5 font-pixel text-base ${supportsPan ? "text-cream/70" : "text-cream/30"}`}>
        PAN — {values.pan === 0 ? "C" : values.pan < 0 ? `L${Math.round(-values.pan * 100)}` : `R${Math.round(values.pan * 100)}`}
        {!supportsPan && <span className="text-[10px] normal-case"> (YouTube pads can't pan)</span>}
        <input
          type="range"
          min={-1}
          max={1}
          step={0.01}
          value={values.pan}
          disabled={!supportsPan}
          onChange={(e) => onChange({ pan: Number(e.target.value) })}
          className="accent-gold disabled:opacity-40"
        />
      </label>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 font-pixel text-base text-cream/70 whitespace-nowrap">
          <input
            type="checkbox"
            checked={values.loop}
            onChange={(e) => onChange({ loop: e.target.checked })}
          />
          LOOP
        </label>

        <label className={`flex items-center gap-2 font-pixel text-base whitespace-nowrap ${supportsReverse ? "text-cream/70" : "text-cream/30"}`}>
          <input
            type="checkbox"
            checked={values.reverse}
            disabled={!supportsReverse}
            onChange={(e) => onChange({ reverse: e.target.checked })}
          />
          REVERSE
        </label>
      </div>

      <div className="flex items-center gap-1 font-pixel text-base text-cream/70">
        MODE
        <button
          onClick={() => onChange({ mode: "oneshot" })}
          className={`whitespace-nowrap rounded-none border-2 border-black px-2 py-0.5 ${values.mode === "oneshot" ? "bg-gold text-navyDeep" : "bg-black/30"}`}
        >
          ONE SHOT
        </button>
        <button
          onClick={() => onChange({ mode: "hold" })}
          className={`whitespace-nowrap rounded-none border-2 border-black px-2 py-0.5 ${values.mode === "hold" ? "bg-gold text-navyDeep" : "bg-black/30"}`}
        >
          HOLD
        </button>
      </div>
    </div>
  );
}

function MiniSlider({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col items-center gap-0.5">
      {label}
      <input
        type="range"
        min={0}
        max={max}
        step={max / 100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-gold w-full"
      />
    </label>
  );
}
