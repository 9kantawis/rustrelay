// Pick separated zones, not individual resource positions.
function densityPeaks(values, resolution) {
  if (values.length !== resolution * resolution) return [];
  const step = Math.max(1, Math.round(resolution / 16));
  const candidates = [];
  for (let y = 0; y < resolution; y += step) {
    for (let x = 0; x < resolution; x += step) {
      let sum = 0,
        count = 0;
      for (let row = y; row < Math.min(y + step, resolution); row++) {
        for (let col = x; col < Math.min(x + step, resolution); col++) {
          sum += values[row * resolution + col];
          count++;
        }
      }
      const density = sum / count / 255;
      if (density < 0.12) continue;
      candidates.push({
        x: (x + step / 2) / resolution,
        y: (y + step / 2) / resolution,
        density,
        level: density < 0.35 ? 1 : density < 0.65 ? 2 : 3,
      });
    }
  }
  const peaks = [];
  for (const candidate of candidates.sort((a, b) => b.density - a.density)) {
    if (
      peaks.some(
        (p) =>
          Math.hypot(p.x - candidate.x, p.y - candidate.y) <
          (step * 1.8) / resolution,
      )
    )
      continue;
    peaks.push(candidate);
    if (peaks.length === 48) break;
  }
  return peaks;
}
module.exports = { densityPeaks };
