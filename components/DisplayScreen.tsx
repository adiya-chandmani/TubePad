"use client";

import { useStore } from "@/lib/store";
import { formatTime } from "@/lib/format";

export function DisplayScreen() {
  const { state } = useStore();
  const pad = state.selectedPadId ? state.project.pads[state.selectedPadId] : null;

  return (
    <div className="rounded-none border-2 border-gold bg-[#0a1a0a] px-3 py-2 font-pixel text-[#7CFC7C] shadow-pixelSm min-h-[84px] shrink-0">
      {pad && pad.end > pad.start ? (
        <>
          <div className="flex justify-between text-lg leading-tight opacity-80">
            <span>PAD {pad.id}</span>
            <span>{pad.sourceType.toUpperCase()}</span>
          </div>
          <div className="text-xl leading-tight uppercase tracking-wide truncate">{pad.name || "(unnamed)"}</div>
          <div className="text-lg leading-tight">
            {formatTime(pad.start)} → {formatTime(pad.end)}
          </div>
          <div className="grid grid-cols-2 gap-x-3 text-lg leading-tight opacity-90">
            <span className="whitespace-nowrap">RATE {pad.playbackRate.toFixed(2)}x</span>
            <span className="whitespace-nowrap">MODE {pad.mode === "oneshot" ? "ONE SHOT" : "HOLD"}</span>
            <span className="whitespace-nowrap">LOOP {pad.loop ? "ON" : "OFF"}</span>
            {pad.sourceType !== "youtube" && (
              <span className="whitespace-nowrap">
                PAN {pad.pan === 0 ? "C" : pad.pan < 0 ? `L${Math.round(-pad.pan * 100)}` : `R${Math.round(pad.pan * 100)}`}
                {pad.reverse ? " REV" : ""}
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center text-center opacity-80 py-2">
          <div className="font-display text-[10px] tracking-widest">TUBEPAD</div>
          <div className="text-lg mt-1">
            {state.project.videoId ? "SELECT A PAD" : "LOAD A VIDEO"}
          </div>
        </div>
      )}
    </div>
  );
}
