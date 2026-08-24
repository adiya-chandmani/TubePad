"use client";

import { Pad, PAD_IDS, SEQUENCER_STEPS, isPadEmpty } from "@/lib/types";

export function SequencerGrid({
  pads,
  steps,
  currentStep,
  onToggleStep,
  onClearAll,
}: {
  pads: Record<string, Pad>;
  steps: Record<string, boolean[]>;
  currentStep: number;
  onToggleStep: (padId: string, index: number) => void;
  onClearAll: () => void;
}) {
  return (
    <div className="flex-1 min-h-0 flex flex-col border-2 border-gold/50 bg-black/20 p-1 gap-1">
      <div className="flex justify-end shrink-0">
        <button
          type="button"
          onClick={onClearAll}
          className="border-2 border-black bg-red px-2 py-0.5 font-display text-[9px] text-cream hover:brightness-110"
          title="Clear every step for every pad"
        >
          CLEAR ALL
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {PAD_IDS.map((padId) => {
          const pad = pads[padId];
          const row = steps[padId] ?? Array(SEQUENCER_STEPS).fill(false);
          const empty = isPadEmpty(pad);
          return (
            <div key={padId} className="flex items-center gap-1 py-[1px]">
              <span
                className={`w-14 shrink-0 truncate font-pixel text-sm ${empty ? "text-cream/30" : "text-cream/80"}`}
                title={pad.name || padId}
              >
                {padId} {pad.name || (empty ? "" : padId)}
              </span>
              <div className="flex-1 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-[3px]">
                {row.map((on, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onToggleStep(padId, i)}
                    className={[
                      "h-5 border border-black",
                      i % 4 === 0 && i !== 0 ? "ml-1" : "",
                      currentStep === i ? "outline outline-1 outline-cream" : "",
                      on ? "bg-red" : empty ? "bg-navy/40" : "bg-cream/30",
                    ].join(" ")}
                    title={`step ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
