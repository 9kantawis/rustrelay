import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import {
  Apple,
  Gem,
  Leaf,
  PawPrint,
  Pickaxe,
  Trees,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import type { AppState, Language } from "../../shared/contracts";
import { densityPeaks } from "../../shared/heatmap.cjs";
import { translate } from "../localization";

type Props = {
  heatmap: NonNullable<AppState["heatmap"]>;
  category: string;
  opacity: number;
  language: Language;
};
function resourceStyle(category: string): { color: string; Icon: LucideIcon } {
  if (category === "ores") return { color: "#ffb45d", Icon: Gem };
  if (["trees", "wood", "logs"].includes(category))
    return { color: "#78c6f0", Icon: Trees };
  if (category === "hemp") return { color: "#9ce578", Icon: Leaf };
  if (["bear", "wolf", "boar", "horse", "stag"].includes(category))
    return { color: "#ee9fd0", Icon: PawPrint };
  if (category === "junkpiles") return { color: "#d5b3ff", Icon: Pickaxe };
  if (["corn", "potato"].includes(category))
    return { color: "#f4d978", Icon: Wheat };
  return { color: "#ff9e7b", Icon: Apple };
}
const levels = ["Редко", "Обычно", "Часто"];
export function HeatmapLegend({ category }: { category: string }) {
  const { color, Icon } = resourceStyle(category);
  return (
    <div
      className="map-heat-legend"
      style={{ "--resource-color": color } as CSSProperties}
    >
      {levels.map((label, index) => (
        <span key={label}>
          <i className={"density-symbol level-" + (index + 1)}>
            <Icon size={13} />
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
  const canvas = useRef<HTMLCanvasElement>(null);
  const values = useMemo(
    () =>
      Uint8Array.from(atob(heatmap.categories[category] || ""), (char) =>
        char.charCodeAt(0),
      ),
    [heatmap, category],
  );
  const zones = useMemo(
    () => densityPeaks(values, heatmap.resolution),
    [values, heatmap.resolution],
  );
  const { color, Icon } = resourceStyle(category);
  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    const image = context.createImageData(
      heatmap.resolution,
      heatmap.resolution,
    );
    const rgb = color.match(/[a-f0-9]{2}/gi)!.map((part) => parseInt(part, 16));
    for (let index = 0; index < values.length; index++) {
      const pixel = index * 4;
      image.data[pixel] = rgb[0];
      image.data[pixel + 1] = rgb[1];
      image.data[pixel + 2] = rgb[2];
      image.data[pixel + 3] = Math.round(values[index] * 0.5);
    }
    context.putImageData(image, 0, 0);
  }, [values, heatmap.resolution, color]);
  return (
    <div
      className="density-layer"
      style={{ opacity, "--resource-color": color } as CSSProperties}
    >
      <canvas
        ref={canvas}
        width={heatmap.resolution}
        height={heatmap.resolution}
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
          <Icon size={13} />
        </span>
      ))}
    </div>
  );
}
