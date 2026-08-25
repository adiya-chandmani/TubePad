// Real-time onset detection over a live MediaStream (tab-audio capture via
// getDisplayMedia). Unlike detectTransients() in lib/waveform.ts — which
// analyzes a fully-decoded AudioBuffer offline — this runs frame-by-frame as
// audio arrives, since there's no way to "seek back" and re-analyze a
// streaming source. Same not-studio-grade honesty applies: an adaptive
// running-peak threshold + minimum gap, not real onset-detection DSP.

export interface LiveOnsetDetector {
  stop: () => void;
}

export function createLiveOnsetDetector(
  stream: MediaStream,
  sensitivity: number,
  onOnset: () => void
): LiveOnsetDetector {
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);

  const data = new Float32Array(analyser.fftSize);
  let runningPeak = 0.0001;
  let lastOnsetMs = -Infinity;
  const minGapMs = 250;
  let stopped = false;
  let rafId = 0;

  function tick() {
    if (stopped) return;
    analyser.getFloatTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / data.length);

    // slow decay so the "peak" tracks the loudest recent material rather
    // than freezing on the very first transient of the whole video
    runningPeak = Math.max(runningPeak * 0.998, rms);
    const threshold = runningPeak * (0.5 - sensitivity * 0.45);

    const now = performance.now();
    if (rms > threshold && now - lastOnsetMs > minGapMs) {
      lastOnsetMs = now;
      onOnset();
    }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(rafId);
      source.disconnect();
      void ctx.close();
    },
  };
}
