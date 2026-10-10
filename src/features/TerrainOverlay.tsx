import { useMemo } from "react";
import type { AppState } from "../../shared/contracts";
import { contourPath } from "../../shared/map-overlays.cjs";
export default function TerrainOverlay({
  elevation,
}: {
  elevation: NonNullable<NonNullable<AppState["heatmap"]>["elevation"]>;
}) {
  const contours = useMemo(() => {
    const bytes = Uint8Array.from(atob(elevation.values), (c) =>
      c.charCodeAt(0),
    );
    const view = new DataView(bytes.buffer);
    const values = Array.from(
      { length: elevation.resolution ** 2 },
      (_, i) => view.getInt16(i * 2, true) / 10,
    );
    const step = Math.max(
      20,
      Math.ceil((elevation.max - Math.max(0, elevation.min)) / 20 / 20) * 20,
    );
    const result = [];
    for (
      let height = Math.max(0, Math.ceil(elevation.min / step) * step);
      height <= elevation.max;
      height += step
    )
      result.push({
        height,
        path: contourPath(values, elevation.resolution, height),
      });
    return result;
  }, [elevation.values, elevation.resolution, elevation.min, elevation.max]);
  return (
    <svg
      className="terrain-contours"
      viewBox={`0 0 ${elevation.resolution} ${elevation.resolution}`}
      preserveAspectRatio="none"
      aria-label="Рельеф и высота"
    >
      {contours.map(({ height, path }) => (
        <path
          key={height}
          d={path}
          fill="none"
          stroke={height % 100 === 0 ? "#101b19" : "#263b2b"}
          strokeOpacity={height % 100 === 0 ? 0.72 : 0.4}
          strokeWidth={height % 100 === 0 ? 1.3 : 0.65}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
