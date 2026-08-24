"use client";

import { useStore } from "@/lib/store";
import { formatTime } from "@/lib/format";

export function DisplayScreen() {
  const { state } = useStore();
  const pad = state.selectedPadId ? state.project.pads[state.selectedPadId] : null;

  return (
    <div className="rounded bg-[#0a1a0a] border border-black/60 px-4 py-3 font-mono text-[#7CFC7C] shadow-inner min-h-[92px]">
      {pad && pad.end > pad.start ? (
        <>
          <div className="flex justify-between text-xs opacity-80">
            <span>PAD {pad.id}</span>
            <span>{pad.sourceType.toUpperCase()}</span>
          </div>
          <div className="text-sm font-bold uppercase tracking-wide">{pad.name || "(unnamed)"}</div>
          <div className="text-xs mt-1">
            {formatTime(pad.start)} → {formatTime(pad.end)}
          </div>
          <div className="flex gap-4 text-xs mt-1 opacity-90">
            <span>RATE {pad.playbackRate.toFixed(2)}x</span>
            <span>MODE {pad.mode === "oneshot" ? "ONE SHOT" : "HOLD"}</span>
            <span>LOOP {pad.loop ? "ON" : "OFF"}</span>
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center text-center opacity-80">
          <div className="text-sm font-bold tracking-widest">TUBEPAD</div>
          <div className="text-xs mt-1">
            {state.project.videoId ? "SELECT A PAD" : "LOAD A VIDEO"}
          </div>
        </div>
      )}
    </div>
  );
}
