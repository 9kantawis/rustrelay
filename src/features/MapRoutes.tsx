import { simplifyLine } from "../../shared/map-overlays.cjs";
import { memo, useMemo } from "react";
import { Check, Route, Trash2 } from "lucide-react";
import type { AppState, MapRoute } from "../../shared/contracts";
import { worldPoint } from "../../shared/map.cjs";
import Dialog from "../components/Dialog";
import { translate } from "../localization";
import { Action } from "./ConnectionViews";
export function currentMapKey(state: AppState) {
  const info = state.info;
  return info
    ? [info.mapSize, info.seed || 0, info.map || "", info.wipeTime || 0].join(
        ":",
      )
    : "";
}
const RouteLine = memo(function RouteLine({
  route,
  map,
  worldSize,
  pixelScale,
}: {
  route: MapRoute;
  map: NonNullable<AppState["map"]>;
  worldSize: number;
  pixelScale: number;
}) {
  const points = useMemo<number[][]>(
    () =>
      simplifyLine(
        route.points.map((point) => {
          const p = worldPoint(point.x, point.y, map, worldSize);
          return [p.x * map.width, p.y * map.height];
        }),
        1,
      ),
    [route, map, worldSize],
  );
  const d = useMemo(
    () =>
      points
        .map((point, index) => (index ? "L" : "M") + point[0] + " " + point[1])
        .join(""),
    [points],
  );
  if (points.length < 2) return null;
  const color = route.ended ? "#8dd3ff" : "#f9a566";
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="#101b23"
        strokeWidth={5}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[points[0], points.at(-1)!].map((p, index) => (
        <circle
          key={index}
          cx={p[0]}
          cy={p[1]}
          r={4 / pixelScale}
          fill={index ? color : "#fff"}
          stroke="#101b23"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  );
});
export const RouteLayer = memo(function RouteLayer({
  routes,
  map,
  worldSize,
  pixelScale,
}: {
  routes: MapRoute[];
  map: NonNullable<AppState["map"]>;
  worldSize: number;
  pixelScale: number;
}) {
  return (
    <svg
      className="route-layer"
      viewBox={`0 0 ${map.width} ${map.height}`}
      aria-label="Маршруты на карте"
    >
      {routes.map((route) => (
        <RouteLine
          key={route.id}
          route={route}
          map={map}
          worldSize={worldSize}
          pixelScale={pixelScale}
        />
      ))}
    </svg>
  );
});
export default function MapRoutes({
  state,
  selected,
  onSelect,
  onClose,
  runAction,
}: {
  state: AppState;
  selected: Set<string> | null;
  onSelect: (value: Set<string> | null) => void;
  onClose: () => void;
  runAction: (action: string, payload?: unknown) => Promise<any>;
}) {
  const mapKey = currentMapKey(state);
  const current = state.routes.filter(
    (route) =>
      route.serverId === state.connection.serverId && route.mapKey === mapKey,
  );
  const isCurrent = (route: MapRoute) =>
    current.some((item) => item.id === route.id);
  const format = (time: number) =>
    new Date(time).toLocaleString(state.settings.language, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  return (
    <Dialog title="Все маршруты" onClose={onClose} className="routes-dialog">
      <div className="route-dialog-toolbar">
        <button
          className="secondary"
          disabled={!current.length}
          onClick={() => onSelect(null)}
        >
          <Check size={15} />
          Показать все на этой карте
        </button>
        <button className="ghost" onClick={() => onSelect(new Set())}>
          Скрыть маршруты
        </button>
      </div>
      <div className="route-archive">
        {[...state.routes].reverse().map((route) => (
          <div className="route-archive-row" key={route.id}>
            <label>
              <input
                type="checkbox"
                aria-label={"Показать маршрут " + format(route.started)}
                checked={
                  isCurrent(route) &&
                  (selected === null || selected.has(route.id))
                }
                disabled={!isCurrent(route)}
                onChange={(event) => {
                  const next = new Set(
                    selected || current.map((route) => route.id),
                  );
                  if (event.target.checked) next.add(route.id);
                  else next.delete(route.id);
                  onSelect(next);
                }}
              />
              <Route size={18} />
              <span>
                <strong>{format(route.started)}</strong>
                <small>
                  {route.serverName}
                  {route.ended
                    ? ""
                    : " · " +
                      translate(state.settings.language, "Записывается")}
                </small>
              </span>
            </label>
            <span>
              {(route.distance / 1000).toLocaleString(state.settings.language, {
                maximumFractionDigits: 2,
              })}{" "}
              {translate(state.settings.language, "км")}
            </span>
            <Action
              className="icon-button"
              label="Удалить маршрут"
              task={() => runAction("deleteRoute", route.id)}
            >
              <Trash2 size={15} />
            </Action>
          </div>
        ))}
      </div>
      {!state.routes.length && (
        <div className="empty">
          <Route size={32} />
          <p>Начни запись на карте, и пройденный путь появится здесь.</p>
        </div>
      )}
      {state.routes.some((route) => !isCurrent(route)) && (
        <p className="guide-note">
          Маршруты других серверов и прошлых вайпов сохранены в архиве.
        </p>
      )}
    </Dialog>
  );
}
