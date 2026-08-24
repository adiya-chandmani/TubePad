"use client";

import { Pad, PAD_IDS, SEQUENCER_STEPS, isPadEmpty } from "@/lib/types";

export function SequencerGrid({
  pads,
  steps,
  currentStep,
  onToggleStep,
}: {
  pads: Record<string, Pad>;
  steps: Record<string, boolean[]>;
  currentStep: number;
  onToggleStep: (padId: string, index: number) => void;
}) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto border-2 border-gold/50 bg-black/20 p-1">
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
            <div className="flex gap-[3px]">
              {row.map((on, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onToggleStep(padId, i)}
                  className={[
                    "h-4 w-4 border border-black",
                    i % 4 === 0 ? "ml-1" : "",
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
  );
}
