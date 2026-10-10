import { useMemo, type CSSProperties } from "react";
import { Apple, Leaf, PawPrint, Trees, type LucideIcon } from "lucide-react";
import type { AppState, Language } from "../../shared/contracts";
import { densityPeaks } from "../../shared/heatmap.cjs";
import { contourPath } from "../../shared/map-overlays.cjs";
import { translate } from "../localization";
import ItemIcon from "../components/ItemIcon";

type Props = {
  heatmap: NonNullable<AppState["heatmap"]>;
  category: string;
  opacity: number;
  language: Language;
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
export default function MapHeatmap({
  heatmap,
  category,
  opacity,
  language,
}: Props) {
  const values = useMemo(
    () =>
      Uint8Array.from(atob(heatmap.categories[category] || ""), (c) =>
        c.charCodeAt(0),
      ),
    [heatmap.categories[category]],
  );
  const contours = useMemo(
    () =>
      [40, 110, 195].map((threshold) =>
        contourPath(values, heatmap.resolution, threshold),
      ),
    [values, heatmap.resolution],
  );
  const zones = useMemo(
    () => densityPeaks(values, heatmap.resolution),
    [values, heatmap.resolution],
  );
  const { color } = resourceStyle(category);
  return (
    <div
      className="density-layer"
      style={{ opacity, "--resource-color": color } as CSSProperties}
    >
      <svg
        className="heatmap-contours"
        viewBox={`0 0 ${heatmap.resolution} ${heatmap.resolution}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {contours.map((d, index) => (
          <path
            key={index}
            d={d}
            fill={color}
            fillOpacity={[0.1, 0.18, 0.28][index]}
            stroke={color}
            strokeOpacity={[0.2, 0.45, 0.8][index]}
            strokeWidth={0.8}
            vectorEffect="non-scaling-stroke"
            fillRule="evenodd"
          />
        ))}
      </svg>
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
}
