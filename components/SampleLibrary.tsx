"use client";

import { useRef, useState } from "react";
import { BUILTIN_SOUNDS, BuiltinCategory } from "@/lib/builtinSounds";
import { decodeBlob } from "@/lib/audio";
import { saveAsset } from "@/lib/db";

const CATEGORIES: BuiltinCategory[] = ["DRUMS", "FX", "BASS", "VOCAL"];
export const BUILTIN_DRAG_TYPE = "application/x-tubepad-builtin";

export function SampleLibrary({
  onImportStaged,
}: {
  onImportStaged: (assetId: string, name: string, duration: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const assetId = crypto.randomUUID();
    await saveAsset(assetId, file);
    const buffer = await decodeBlob(assetId, file);
    onImportStaged(assetId, file.name.replace(/\.[^.]+$/, ""), buffer.duration);
  }

  return (
    <div className="flex flex-col gap-2 rounded-none border-2 border-gold/50 bg-black/20 p-2 flex-1 min-h-0">
      <button
        className="flex items-center justify-between font-pixel text-lg text-cream/70 shrink-0"
        onClick={() => setOpen((o) => !o)}
      >
        <span>SOUND LIBRARY</span>
        <span>{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <>
          <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
            {CATEGORIES.map((cat) => (
              <div key={cat}>
                <div className="font-pixel text-sm text-gold/70 mb-1">{cat}</div>
                <div className="flex flex-wrap gap-1">
                  {BUILTIN_SOUNDS.filter((s) => s.category === cat).map((s) => (
                    <div
                      key={s.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData(BUILTIN_DRAG_TYPE, s.id)}
                      className="cursor-grab rounded-none bg-cream border-2 border-black px-2 py-0.5 font-pixel text-base text-navyDeep active:cursor-grabbing"
                      title="Drag onto a pad"
                    >
                      {s.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => fileInput.current?.click()}
            className="shrink-0 rounded-none border-2 border-black bg-cream shadow-pixelSm px-3 py-1 font-pixel text-base text-navyDeep hover:brightness-95 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            IMPORT SAMPLE
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".mp3,.wav,.m4a,.ogg,audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <p className="shrink-0 font-pixel text-sm text-cream/40">
            Drag a sound onto a pad, or drop your own audio file onto a pad directly.
          </p>
        </>
      )}
    </div>
  );
}
