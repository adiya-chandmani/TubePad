// Thin wrapper around the YouTube IFrame Player API (PRD §6, §43, §47).
// Pads never store audio — only videoId + start + end + rate. Triggering a
// pad seeks this single shared player and plays from there.

declare global {
  interface Window {
    YT: { Player: new (elementId: string, options: unknown) => unknown };
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Minimal shape of the global YT namespace we use.
namespace YT {
  export interface Player {
    playVideo(): void;
    pauseVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    setPlaybackRate(rate: number): void;
    getPlaybackRate(): number;
    getAvailablePlaybackRates(): number[];
    getCurrentTime(): number;
    getDuration(): number;
    setVolume(v: number): void;
    getVideoData(): { video_id: string; title: string };
    destroy(): void;
  }
  export interface PlayerEvent {
    target: Player;
  }
  export interface OnStateChangeEvent extends PlayerEvent {
    data: number;
  }
}

let apiReadyPromise: Promise<void> | null = null;

function loadApi(): Promise<void> {
  if (apiReadyPromise) return apiReadyPromise;
  apiReadyPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiReadyPromise;
}

export interface TubePadPlayer {
  player: YT.Player;
  destroy(): void;
}

export async function createPlayer(
  elementId: string,
  videoId: string,
  callbacks: {
    onReady?: (title: string, duration: number) => void;
    onStateChange?: (state: number) => void;
  }
): Promise<TubePadPlayer> {
  await loadApi();
  return new Promise((resolve) => {
    const YTNS = (window as unknown as { YT: any }).YT;
    const player = new YTNS.Player(elementId, {
      videoId,
      playerVars: {
        controls: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
      },
      events: {
        onReady: (e: YT.PlayerEvent) => {
          const data = e.target.getVideoData();
          callbacks.onReady?.(data.title, e.target.getDuration());
          resolve({
            player: e.target,
            destroy: () => e.target.destroy(),
          });
        },
        onStateChange: (e: YT.OnStateChangeEvent) => {
          callbacks.onStateChange?.(e.data);
        },
      },
    });
  });
}

export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.slice(1) || null;
    }
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2] ?? null;
      if (url.pathname.startsWith("/embed/")) return url.pathname.split("/")[2] ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

export const YT_STATE = {
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
};
