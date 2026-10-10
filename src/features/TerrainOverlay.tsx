import { memo } from "react";
import type { AppState } from "../../shared/contracts";
import { useMapRaster } from "../components/MapRaster";
export default memo(function TerrainOverlay({
  elevation,
  pixels,
  worldSize,
}: {
  elevation: NonNullable<NonNullable<AppState["heatmap"]>["elevation"]>;
  pixels: number;
  worldSize: number;
}) {
  const { canvas, loading } = useMapRaster({
    kind: "terrain",
    values: elevation.values,
    resolution: elevation.resolution,
    pixels,
    worldSize,
  });
  return (
    <canvas
      ref={canvas}
      className="map-raster terrain-raster"
      aria-label="Рельеф и высота"
      aria-busy={loading}
    />
  );
});
