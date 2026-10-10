import { memo, type CSSProperties } from "react";
import { Apple, Leaf, PawPrint, Trees, type LucideIcon } from "lucide-react";
import type { AppState, Language } from "../../shared/contracts";
import { useMapRaster } from "../components/MapRaster";
import { translate } from "../localization";
import ItemIcon from "../components/ItemIcon";

type Props = {
  heatmap: NonNullable<AppState["heatmap"]>;
  category: string;
  opacity: number;
  language: Language;
  pixels: number;
};
function resourceStyle(category: string): {
  color: string;
  item?: string;
  Icon?: LucideIcon;
} {
  if (category === "ores") return { color: "#ffb45d", item: "stones" };
  if (["trees", "wood", "logs"].includes(category))
    return { color: "#78c6f0", item: "wood" };
  if (category === "hemp") return { color: "#9ce578", item: "cloth" };
  if (["bear", "wolf", "boar", "horse", "stag"].includes(category))
    return { color: "#ee9fd0", Icon: PawPrint };
  if (category === "junkpiles") return { color: "#d5b3ff", item: "scrap" };
  const items: Record<string, string> = {
    corn: "corn",
    pumpkin: "pumpkin",
    potato: "potato",
    mushroom: "mushroom",
    berries: "blue.berry",
  };
  return { color: "#f4d978", item: items[category], Icon: Apple };
}
function Symbol({ category }: { category: string }) {
  const { item, Icon } = resourceStyle(category);
  return item ? (
    <ItemIcon item={item} size={18} />
  ) : Icon ? (
    <Icon size={14} />
  ) : null;
}
const levels = ["Редко", "Обычно", "Часто"];
export function HeatmapLegend({ category }: { category: string }) {
  return (
    <div
      className="map-heat-legend"
      style={
        { "--resource-color": resourceStyle(category).color } as CSSProperties
      }
    >
      {levels.map((label, index) => (
        <span key={label}>
          <i className={"density-symbol level-" + (index + 1)}>
            <Symbol category={category} />
          </i>
          {label}
        </span>
      ))}
    </div>
  );
}
export default memo(function MapHeatmap({
  heatmap,
  category,
  opacity,
  language,
  pixels,
}: Props) {
  const { color } = resourceStyle(category);
  const { canvas, zones, loading } = useMapRaster({
    kind: "heat",
    values: heatmap.categories[category] || "",
    resolution: heatmap.resolution,
    pixels,
    color,
  });
  return (
    <div
      className="density-layer"
      style={{ opacity, "--resource-color": color } as CSSProperties}
      aria-busy={loading}
    >
      <canvas
        ref={canvas}
        className="map-raster heatmap-raster"
        aria-hidden="true"
      />
      {zones.map((zone, index) => (
        <span
          key={index}
          className={"density-symbol density-zone level-" + zone.level}
          style={{ left: zone.x * 100 + "%", top: zone.y * 100 + "%" }}
          title={translate(language, levels[zone.level - 1])}
          aria-label={translate(language, levels[zone.level - 1])}
        >
          <Symbol category={category} />
        </span>
      ))}
    </div>
  );
});
