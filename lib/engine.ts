import { Pad } from "./types";
import { TubePadPlayer } from "./youtube";
import { PlayHandle, playBuffer, getCachedBuffer, cacheBuffer } from "./audio";
import { loadAsset } from "./db";
import { BUILTIN_SOUNDS, renderBuiltinSound } from "./builtinSounds";

// ponytail: oneshot+loop has no natural "reached the end" stop condition,
// so a second (non-repeat) press of the same pad toggles it off. hold+loop
// just means "don't stop early at End while the key is still down"; keyup
// always stops. This is a judgment call the PRD leaves implicit.

interface YoutubePollState {
  padId: string;
  end: number;
  loop: boolean;
}

async function getPadBuffer(pad: Pad): Promise<AudioBuffer | null> {
  if (!pad.audioAssetId) return null;
  const cached = getCachedBuffer(pad.audioAssetId);
  if (cached) return cached;
  if (pad.sourceType === "builtin") {
    const sound = BUILTIN_SOUNDS.find((s) => s.id === pad.audioAssetId);
    if (!sound) return null;
    return renderBuiltinSound(sound);
  }
  if (pad.sourceType === "upload") {
    const blob = await loadAsset(pad.audioAssetId);
    if (!blob) return null;
    const { decodeBlob } = await import("./audio");
    return decodeBlob(pad.audioAssetId, blob);
  }
  return null;
}

export class PlaybackEngine {
  private ytPlayer: TubePadPlayer | null = null;
  private ytPoll: YoutubePollState | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private audioHandles = new Map<string, PlayHandle>();
  private oneshotLoopActive = new Set<string>();

  setYoutubePlayer(p: TubePadPlayer | null) {
    this.ytPlayer = p;
  }

  private ensurePoll() {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => {
      if (!this.ytPoll || !this.ytPlayer) return;
      const t = this.ytPlayer.player.getCurrentTime();
      if (t >= this.ytPoll.end) {
        if (this.ytPoll.loop) {
          this.ytPlayer.player.seekTo(this.ytPollStart ?? 0, true);
        } else {
          this.ytPlayer.player.pauseVideo();
          this.ytPoll = null;
        }
      }
    }, 50);
  }

  private ytPollStart: number | null = null;

  private triggerYoutube(pad: Pad) {
    if (!this.ytPlayer) return;
    const { player } = this.ytPlayer;
    player.setPlaybackRate(pad.playbackRate);
    player.seekTo(pad.start, true);
    player.playVideo();
    this.ytPoll = { padId: pad.id, end: pad.end, loop: pad.loop };
    this.ytPollStart = pad.start;
    this.ensurePoll();
  }

  private stopYoutube(padId: string) {
    if (this.ytPoll?.padId === padId) {
      this.ytPlayer?.player.pauseVideo();
      this.ytPoll = null;
    }
  }

  async triggerDown(pad: Pad, opts: { repeat: boolean }) {
    if (pad.end <= pad.start && pad.sourceType === "youtube") return;
    if (pad.sourceType === "youtube") {
      if (pad.mode === "oneshot") {
        if (opts.repeat) return; // §49 ignore OS key-repeat
        if (pad.loop) {
          if (this.oneshotLoopActive.has(pad.id)) {
            this.oneshotLoopActive.delete(pad.id);
            this.stopYoutube(pad.id);
            return;
          }
          this.oneshotLoopActive.add(pad.id);
        }
      }
      this.triggerYoutube(pad);
      return;
    }

    // builtin / upload via Web Audio
    if (opts.repeat) return;
    if (pad.mode === "oneshot" && pad.loop) {
      const active = this.audioHandles.get(pad.id);
      if (active) {
        active.stop();
        this.audioHandles.delete(pad.id);
        return;
      }
    }
    const buffer = await getPadBuffer(pad);
    if (!buffer) return;
    cacheBuffer(pad.audioAssetId!, buffer);
    const handle = playBuffer(buffer, {
      start: pad.start,
      end: pad.end,
      rate: pad.playbackRate,
      volume: pad.volume,
      loop: pad.loop,
    });
    this.audioHandles.set(pad.id, handle);
  }

  triggerUp(pad: Pad) {
    if (pad.mode !== "hold") return;
    if (pad.sourceType === "youtube") {
      this.stopYoutube(pad.id);
    } else {
      this.audioHandles.get(pad.id)?.stop();
      this.audioHandles.delete(pad.id);
    }
  }

  async preview(source: { sourceType: Pad["sourceType"]; start: number; end: number; rate: number; audioAssetId?: string }) {
    if (source.sourceType === "youtube" && this.ytPlayer) {
      const { player } = this.ytPlayer;
      player.setPlaybackRate(source.rate);
      player.seekTo(source.start, true);
      player.playVideo();
      this.ytPoll = { padId: "__preview__", end: source.end, loop: false };
      this.ytPollStart = source.start;
      this.ensurePoll();
      return;
    }
    if (source.audioAssetId) {
      const sound = BUILTIN_SOUNDS.find((s) => s.id === source.audioAssetId);
      const buffer = sound ? await renderBuiltinSound(sound) : getCachedBuffer(source.audioAssetId);
      if (buffer) {
        playBuffer(buffer, { start: source.start, end: source.end, rate: source.rate, volume: 1, loop: false });
      }
    }
  }

  stopAll() {
    this.ytPoll = null;
    this.ytPlayer?.player.pauseVideo();
    this.audioHandles.forEach((h) => h.stop());
    this.audioHandles.clear();
    this.oneshotLoopActive.clear();
  }
}
