"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { computePeaks, detectTransients, equalSlices } from "@/lib/waveform";

export function ChopWaveformPanel({
  buffer,
  name,
  onApply,
  onClose,
}: {
  buffer: AudioBuffer;
  name: string;
  onApply: (slices: { start: number; end: number }[]) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"regions" | "threshold">("regions");
  const [count, setCount] = useState(4);
  const [sensitivity, setSensitivity] = useState(0.5);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const peaks = useMemo(() => computePeaks(buffer, 400), [buffer]);

  const boundaries = useMemo(() => {
    if (mode === "regions") return equalSlices(buffer.duration, count);
    // cap at 16 slices total (one per pad) — 15 interior onsets + the two ends
    const onsets = detectTransients(buffer, sensitivity).slice(0, 15);
    return [0, ...onsets, buffer.duration];
  }, [mode, count, sensitivity, buffer]);

  const sliceCount = Math.max(0, boundaries.length - 1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a1a0a";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#D8A94A";
    const barW = w / peaks.length;
    for (let i = 0; i < peaks.length; i++) {
      const amp = peaks[i] * (h / 2);
      ctx.fillRect(i * barW, h / 2 - amp, Math.max(1, barW), Math.max(1, amp * 2));
    }
    ctx.strokeStyle = "#D8402E";
    ctx.lineWidth = 2;
    for (const b of boundaries) {
      const x = (b / buffer.duration) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }, [peaks, boundaries, buffer.duration]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
      <div className="w-[620px] max-w-[92vw] border-4 border-gold bg-navyDeep p-4 shadow-pixel">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-red text-xs">CHOP — {name.toUpperCase()}</h2>
          <button onClick={onClose} className="border-2 border-black bg-cream px-2 py-0.5 font-pixel text-navyDeep">
            ✕
          </button>
        </div>

        <canvas ref={canvasRef} width={580} height={100} className="w-full border-2 border-gold/50 mb-3" />

        <div className="flex gap-2 mb-3 font-pixel text-base">
          <button
            onClick={() => setMode("regions")}
            className={`flex-1 border-2 border-black px-2 py-1 ${mode === "regions" ? "bg-gold text-navyDeep" : "bg-black/30 text-cream/70"}`}
          >
            REGIONS (EQUAL)
          </button>
          <button
            onClick={() => setMode("threshold")}
            className={`flex-1 border-2 border-black px-2 py-1 ${mode === "threshold" ? "bg-gold text-navyDeep" : "bg-black/30 text-cream/70"}`}
          >
            THRESHOLD (TRANSIENT)
          </button>
        </div>

        {mode === "regions" ? (
          <label className="flex flex-col gap-1 font-pixel text-base text-cream/70 mb-3">
            SLICES — {count}
            <input
              type="range"
              min={2}
              max={16}
              step={1}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="accent-gold"
            />
          </label>
        ) : (
          <label className="flex flex-col gap-1 font-pixel text-base text-cream/70 mb-3">
            SENSITIVITY — {Math.round(sensitivity * 100)}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="accent-gold"
            />
          </label>
        )}

        <p className="font-pixel text-sm text-cream/50 mb-3">
          {sliceCount} slice{sliceCount === 1 ? "" : "s"} (max 16 — one per pad).
        </p>

        <button
          onClick={() => {
            const slices = [];
            for (let i = 0; i < boundaries.length - 1; i++) slices.push({ start: boundaries[i], end: boundaries[i + 1] });
            onApply(slices);
          }}
          disabled={sliceCount < 1}
          className="w-full border-2 border-black bg-gold shadow-pixelSm px-3 py-2 font-display text-xs text-navyDeep disabled:opacity-40"
        >
          ASSIGN {sliceCount} SLICE{sliceCount === 1 ? "" : "S"} TO NEXT EMPTY PADS
        </button>
      </div>
    </div>
  );
}
