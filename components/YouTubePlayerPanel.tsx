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
    <div className="flex flex-col gap-2">
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
          className="flex-1 rounded bg-black/40 border border-white/20 px-3 py-1.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-padActive"
        />
        <button
          type="submit"
          className="rounded bg-padActive px-4 py-1.5 text-sm font-bold text-white hover:brightness-110"
        >
          LOAD
        </button>
      </form>

      <div className="relative aspect-video w-full overflow-hidden rounded bg-black">
        <div id="tubepad-yt-player" className="h-full w-full" />
      </div>

      <div className="flex items-center justify-between text-xs text-white/70">
        <span className="truncate max-w-[60%]">{title ?? "No video loaded"}</span>
        <span className="font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
