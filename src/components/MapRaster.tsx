import { useEffect, useRef, useState } from "react";
export type DensityZone = {
  x: number;
  y: number;
  density: number;
  level: number;
};
export function useMapRaster({
  kind,
  values,
  resolution,
  pixels,
  color,
  worldSize,
}: {
  kind: "heat" | "terrain";
  values: string;
  resolution: number;
  pixels: number;
  color?: string;
  worldSize?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [zones, setZones] = useState<DensityZone[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    setLoading(true);
    setZones([]);
    const worker = new Worker(
      new URL("../workers/map-layer.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.onmessage = ({
      data,
    }: MessageEvent<{
      bitmap?: ImageBitmap;
      zones?: DensityZone[];
      error?: string;
    }>) => {
      if (data.bitmap) {
        element.width = data.bitmap.width;
        element.height = data.bitmap.height;
        element.getContext("2d")?.drawImage(data.bitmap, 0, 0);
        data.bitmap.close();
        setZones(data.zones || []);
      }
      setLoading(false);
      worker.terminate();
    };
    worker.onerror = () => {
      setLoading(false);
      worker.terminate();
    };
    worker.postMessage({ kind, values, resolution, pixels, color, worldSize });
    return () => {
      worker.terminate();
      element.width = 0;
      element.height = 0;
    };
  }, [kind, values, resolution, pixels, color, worldSize]);
  return { canvas, zones, loading };
}
