"use client";

import { useEffect, useRef, useState } from "react";

export function BpmControl({ bpm, onChange }: { bpm: number; onChange: (bpm: number) => void }) {
  const tapTimes = useRef<number[]>([]);
  const [text, setText] = useState(String(bpm));
  const focusedRef = useRef(false);

  // Only sync from the store while the input isn't focused — otherwise a
  // typed "1" briefly commits as a clamped 20 (see commit()) and stomps
  // whatever the user is still typing toward "130".
  useEffect(() => {
    if (!focusedRef.current) setText(String(bpm));
  }, [bpm]);

  function commit() {
    const n = parseInt(text, 10);
    if (Number.isNaN(n)) {
      setText(String(bpm));
      return;
    }
    onChange(n);
  }

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
      <input
        type="text"
        inputMode="numeric"
        value={text}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onChange={(e) => setText(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
        onBlur={() => {
          focusedRef.current = false;
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="w-9 border border-gold/40 bg-black/30 text-center text-gold outline-none focus:border-gold"
      />
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
