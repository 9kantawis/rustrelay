import { Box } from "lucide-react";
import items from "../../shared/item-names.json";
const images = import.meta.glob<string>("../assets/items/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});
const aliases: Record<string, string> = {
  rocket: "ammo.rocket.basic",
  c4: "explosive.timed",
  satchel: "explosive.satchel",
  ammo: "ammo.rifle.explosive",
  metal: "metal.fragments",
  stone: "stones",
  armored: "metal.refined",
  twig: "wood",
  lgf: "lowgradefuel",
  fuel: "lowgradefuel",
  cloth: "cloth",
  scrap: "scrap",
  hemp: "cloth",
  trees: "wood",
  logs: "wood",
  berries: "blue.berry",
  mushroom: "mushroom",
  junkpiles: "scrap",
  ores: "stones",
  researchpaper: "scrap",
};
export function itemShortname(item: string | number) {
  const key = String(item);
  return (
    aliases[key] ||
    (items as Record<string, { shortname: string }>)[key]?.shortname ||
    key
  );
}
export default function ItemIcon({
  item,
  size = 28,
}: {
  item: string | number;
  size?: number;
}) {
  const name = itemShortname(item);
  const source = images["../assets/items/" + name + ".webp"];
  return source ? (
    <img
      className="item-icon"
      src={source}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      draggable={false}
    />
  ) : (
    <Box
      className="item-icon item-icon-fallback"
      size={size}
      aria-hidden="true"
    />
  );
}
