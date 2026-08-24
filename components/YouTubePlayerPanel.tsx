"use client";

import { useState } from "react";
import { formatTime } from "@/lib/format";

export function YouTubePlayerPanel({
  title,
  currentTime,
  duration,
  onLoad,
}: {
  title: string | null;
  currentTime: number;
  duration: number;
  onLoad: (url: string) => void;
}) {
  const [url, setUrl] = useState("");

  return (
    <div className="flex flex-col gap-1.5 shrink-0">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim()) onLoad(url.trim());
        }}
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube URL"
          className="flex-1 rounded-none bg-black/40 border-2 border-gold/50 px-3 py-1 font-pixel text-lg text-cream placeholder:text-cream/30 outline-none focus:border-gold"
        />
        <button
          type="submit"
          className="rounded-none bg-red border-2 border-black shadow-pixelSm px-4 py-1 font-display text-[10px] text-cream hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          LOAD
        </button>
      </form>

      <div className="relative w-full h-[170px] overflow-hidden bg-black border-2 border-gold/50">
        <div id="tubepad-yt-player" className="h-full w-full" />
      </div>

      <div className="flex items-center justify-between font-pixel text-lg text-cream/70">
        <span className="truncate max-w-[60%]">{title ?? "No video loaded"}</span>
        <span>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
