// MPC-style chop math for builtin/upload pads, which have a real AudioBuffer
// (unlike YouTube pads — no PCM access through the IFrame API, so those get
// manual tap-to-mark chopping instead; see ChopYoutubePanel).

export function computePeaks(buffer: AudioBuffer, buckets: number): Float32Array {
  const data = buffer.getChannelData(0);
  const peaks = new Float32Array(buckets);
  const bucketSize = Math.max(1, Math.floor(data.length / buckets));
  for (let i = 0; i < buckets; i++) {
    let max = 0;
    const start = i * bucketSize;
    const end = Math.min(data.length, start + bucketSize);
    for (let j = start; j < end; j++) {
      const v = Math.abs(data[j]);
      if (v > max) max = v;
    }
    peaks[i] = max;
  }
  return peaks;
}

/** N equal-length regions as N+1 boundary points, MPC's "Regions" chop mode. */
export function equalSlices(duration: number, count: number): number[] {
  const bounds: number[] = [];
  for (let i = 0; i <= count; i++) bounds.push((duration * i) / count);
  return bounds;
}

/** MPC's "Threshold" chop mode: an RMS envelope with rising-edge threshold
 * crossings as onsets. `sensitivity` 0..1 — higher finds more (quieter)
 * transients. Not a "real" onset-detection algorithm, just enough to feel
 * like the MPC slider: drag it and get more or fewer slices. */
export function detectTransients(buffer: AudioBuffer, sensitivity: number): number[] {
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const hop = Math.max(1, Math.floor(sampleRate * 0.02)); // 20ms windows
  const envelope: number[] = [];
  for (let i = 0; i < data.length; i += hop) {
    let sum = 0;
    const end = Math.min(data.length, i + hop);
    for (let j = i; j < end; j++) sum += data[j] * data[j];
    envelope.push(Math.sqrt(sum / (end - i)));
  }
  const peak = Math.max(...envelope, 0.0001);
  const threshold = peak * (0.5 - sensitivity * 0.45); // higher sensitivity -> lower threshold
  const minGapSteps = Math.max(1, Math.ceil((0.08 * sampleRate) / hop)); // 80ms min gap between onsets

  const onsets: number[] = [];
  let lastOnsetStep = -Infinity;
  for (let i = 1; i < envelope.length; i++) {
    const risingThroughThreshold = envelope[i] > threshold && envelope[i - 1] <= threshold;
    if (risingThroughThreshold && i - lastOnsetStep >= minGapSteps) {
      onsets.push((i * hop) / sampleRate);
      lastOnsetStep = i;
    }
  }
  return onsets;
}
