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
    <div className="flex flex-col gap-2 rounded border border-white/10 bg-white/5 p-3">
      <button
        className="flex items-center justify-between text-xs font-bold uppercase text-white/60"
        onClick={() => setOpen((o) => !o)}
      >
        <span>Sound Library</span>
        <span>{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <>
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {CATEGORIES.map((cat) => (
              <div key={cat}>
                <div className="text-[10px] font-bold text-white/40 mb-1">{cat}</div>
                <div className="flex flex-wrap gap-1">
                  {BUILTIN_SOUNDS.filter((s) => s.category === cat).map((s) => (
                    <div
                      key={s.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData(BUILTIN_DRAG_TYPE, s.id)}
                      className="cursor-grab rounded bg-black/40 border border-white/20 px-2 py-1 text-[11px] text-white/80 active:cursor-grabbing"
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
            className="rounded border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
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
          <p className="text-[10px] text-white/40">
            Drag a sound onto a pad, or drop your own audio file onto a pad directly.
          </p>
        </>
      )}
    </div>
  );
}
