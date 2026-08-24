"use client";

import { useRef } from "react";

export function BpmControl({ bpm, onChange }: { bpm: number; onChange: (bpm: number) => void }) {
  const tapTimes = useRef<number[]>([]);

  function handleTap() {
    const now = performance.now();
    const times = tapTimes.current;
    // reset the tap sequence if the gap is too long to be the same tempo
    if (times.length > 0 && now - times[times.length - 1] > 2000) times.length = 0;
    times.push(now);
    if (times.length > 6) times.shift();
    if (times.length < 2) return;
    const intervals = times.slice(1).map((t, i) => t - times[i]);
    const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    onChange(Math.round(60000 / avgMs));
  }

  return (
    <div className="flex items-center gap-1 font-pixel text-lg text-cream/80">
      BPM
      <button
        type="button"
        onClick={() => onChange(bpm - 1)}
        className="border-2 border-black bg-cream px-1.5 text-navyDeep"
      >
        −
      </button>
      <span className="w-8 text-center text-gold">{bpm}</span>
      <button
        type="button"
        onClick={() => onChange(bpm + 1)}
        className="border-2 border-black bg-cream px-1.5 text-navyDeep"
      >
        +
      </button>
      <button
        type="button"
        onClick={handleTap}
        className="border-2 border-black bg-cream px-2 text-navyDeep whitespace-nowrap"
      >
        TAP
      </button>
    </div>
  );
}
