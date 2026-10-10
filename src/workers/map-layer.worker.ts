import { densityPeaks } from "../../shared/heatmap.cjs";
type Request = {
  kind: "heat" | "terrain";
  values: string;
  resolution: number;
  pixels: number;
  worldSize?: number;
  color?: string;
};
function decode(value: string) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}
function sample(
  field: ArrayLike<number>,
  a: number,
  b: number,
  c: number,
  d: number,
  fx: number,
  fy: number,
) {
  return (
    (field[a] * (1 - fx) + field[b] * fx) * (1 - fy) +
    (field[c] * (1 - fx) + field[d] * fx) * fy
  );
}
self.onmessage = (event: MessageEvent<Request>) => {
  try {
    const { kind, values, resolution: side, color = "#ffb45d" } = event.data;
    const pixels = Math.max(
      side,
      Math.min(kind === "heat" ? 3072 : 2048, event.data.pixels),
    );
    const bytes = decode(values);
    if (bytes.length !== side * side * (kind === "terrain" ? 2 : 1))
      throw Error("Invalid map layer");
    const heights = kind === "terrain" ? new Float32Array(side * side) : null;
    if (heights) {
      const view = new DataView(bytes.buffer);
      for (let i = 0; i < heights.length; i++)
        heights[i] = view.getInt16(i * 2, true) / 10;
    }
    const data = heights || bytes;
    const canvas = new OffscreenCanvas(pixels, pixels);
    const context = canvas.getContext("2d")!;
    const image = context.createImageData(pixels, pixels);
    const rgb = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
    const slopesX = heights ? new Float32Array(data.length) : null;
    const slopesY = heights ? new Float32Array(data.length) : null;
    const spacing = (event.data.worldSize || 4250) / side;
    if (heights)
      for (let y = 0; y < side; y++)
        for (let x = 0; x < side; x++) {
          const i = y * side + x;
          slopesX![i] =
            (data[y * side + Math.min(side - 1, x + 1)] -
              data[y * side + Math.max(0, x - 1)]) /
            (2 * spacing);
          slopesY![i] =
            (data[Math.min(side - 1, y + 1) * side + x] -
              data[Math.max(0, y - 1) * side + x]) /
            (2 * spacing);
        }
    const xs = Array.from({ length: pixels }, (_, x) => {
      const value = (x * (side - 1)) / (pixels - 1);
      return { x: Math.floor(value), mix: value % 1 };
    });
    for (let y = 0; y < pixels; y++) {
      const sy = (y * (side - 1)) / (pixels - 1),
        iy = Math.floor(sy),
        fy = sy % 1;
      for (let x = 0; x < pixels; x++) {
        const { x: ix, mix: fx } = xs[x];
        const a = iy * side + ix,
          b = iy * side + Math.min(side - 1, ix + 1);
        const c = Math.min(side - 1, iy + 1) * side + ix,
          d = Math.min(side - 1, iy + 1) * side + Math.min(side - 1, ix + 1);
        const value = sample(data, a, b, c, d, fx, fy),
          i = (y * pixels + x) * 4;
        if (kind === "heat") {
          image.data[i] = rgb[0];
          image.data[i + 1] = rgb[1];
          image.data[i + 2] = rgb[2];
          const density = Math.max(0, (value - 24) / 231);
          const edge =
            Math.abs(value - 40) < 2 ||
            Math.abs(value - 110) < 2 ||
            Math.abs(value - 195) < 2;
          image.data[i + 3] = Math.round(
            Math.min(210, density * 135 + (edge ? 55 : 0)),
          );
        } else if (value > 0) {
          const dx = sample(slopesX!, a, b, c, d, fx, fy),
            dy = sample(slopesY!, a, b, c, d, fx, fy);
          const shade =
            (-dx * 0.58 - dy * 0.58 + 0.57) / Math.sqrt(dx * dx + dy * dy + 1);
          const contrast = Math.max(-1, Math.min(1, (shade - 0.57) * 3.8));
          const contourDistance = Math.abs(value - Math.round(value / 10) * 10);
          const lineWidth = Math.max(
            0.15,
            ((Math.hypot(dx, dy) * spacing * side) / pixels) * 0.85,
          );
          const contour = contourDistance < lineWidth;
          const major =
            Math.abs(value - Math.round(value / 50) * 50) < lineWidth * 1.3;
          const ink = contour || major || contrast < 0 ? 18 : 255;
          image.data[i] = ink;
          image.data[i + 1] = ink;
          image.data[i + 2] = ink;
          image.data[i + 3] = major
            ? 175
            : contour
              ? 105
              : Math.round(Math.abs(contrast) * (contrast < 0 ? 115 : 100));
        }
      }
    }
    context.putImageData(image, 0, 0);
    const bitmap = canvas.transferToImageBitmap();
    (self as unknown as Worker).postMessage(
      { bitmap, zones: kind === "heat" ? densityPeaks(bytes, side) : [] },
      [bitmap],
    );
  } catch (error) {
    (self as unknown as Worker).postMessage({ error: String(error) });
  }
};
