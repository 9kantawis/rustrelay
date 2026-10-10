import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import {
  Flame,
  Grid2X2,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  RefreshCw,
  Users,
  X,
} from "lucide-react";
import type { AppState } from "../../shared/contracts";
import {
  GRID_SIZE,
  worldPoint,
  worldPosition,
  gridLetter,
  gridExtent,
  gridLabel,
  clampView,
  zoomView,
} from "../../shared/map.cjs";
import PrettySelect from "../components/PrettySelect";
import { translate } from "../localization";
import { Action } from "./ConnectionViews";
import { Offline } from "./ServerViews";
import MapHeatmap, { HeatmapLegend } from "./MapHeatmap";

type Props = {
  state: AppState;
  runAction: (action: string, payload?: unknown) => Promise<any>;
  navigateTo: (page: string) => void;
};
type View = { scale: number; x: number; y: number };
const initialView = { scale: 1, x: 0, y: 0 };
const categories = [
  ["ores", "Руда"],
  ["trees", "Деревья"],
  ["hemp", "Ткань"],
  ["wood", "Дерево"],
  ["logs", "Брёвна"],
  ["berries", "Ягоды"],
  ["mushroom", "Грибы"],
  ["corn", "Кукуруза"],
  ["pumpkin", "Тыквы"],
  ["potato", "Картофель"],
  ["junkpiles", "Мусорные кучи"],
  ["bear", "Медведи"],
  ["wolf", "Волки"],
  ["boar", "Кабаны"],
  ["horse", "Лошади"],
  ["stag", "Олени"],
];
function MapGrid({
  map,
  worldSize,
  scale,
}: {
  map: NonNullable<AppState["map"]>;
  worldSize: number;
  scale: number;
}) {
  const count = Math.round(gridExtent(worldSize) / GRID_SIZE);
  const fontSize = 11 / scale;
  const showLabels =
    (GRID_SIZE / worldSize) * (map.width - map.oceanMargin * 2) * scale > 23;
  return (
    <svg
      className="map-grid"
      viewBox={`0 0 ${map.width} ${map.height}`}
      aria-label="Сетка карты"
    >
      {Array.from({ length: count + 1 }, (_, index) => {
        const start = worldPoint(index * GRID_SIZE, 0, map, worldSize);
        const end = worldPoint(
          gridExtent(worldSize),
          index * GRID_SIZE,
          map,
          worldSize,
        );
        const north = worldPoint(0, gridExtent(worldSize), map, worldSize);
        const south = worldPoint(0, 0, map, worldSize);
        return (
          <g key={index}>
            <line
              x1={start.x * map.width}
              x2={start.x * map.width}
              y1={north.y * map.height}
              y2={south.y * map.height}
            />
            <line
              x1={south.x * map.width}
              x2={end.x * map.width}
              y1={end.y * map.height}
              y2={end.y * map.height}
            />
          </g>
        );
      })}
      {showLabels &&
        Array.from({ length: count * count }, (_, index) => {
          const column = index % count,
            row = Math.floor(index / count);
          const point = worldPoint(
            (column + 0.5) * GRID_SIZE,
            (row + 0.5) * GRID_SIZE,
            map,
            worldSize,
          );
          return (
            <text
              key={index}
              x={point.x * map.width}
              y={point.y * map.height}
              fontSize={fontSize}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {gridLetter(column)}
              {count - row - 1}
            </text>
          );
        })}
    </svg>
  );
}
export default function ServerMap({ state, runAction, navigateTo }: Props) {
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [view, setView] = useState<View>(initialView);
  const viewRef = useRef(view);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    start: View;
    moved: boolean;
  } | null>(null);
  const [grid, setGrid] = useState(true);
  const [team, setTeam] = useState(true);
  const [heat, setHeat] = useState(false);
  const [category, setCategory] = useState("ores");
  const [opacity, setOpacity] = useState(0.75);
  const [pinMode, setPinMode] = useState(false);
  const [pinName, setPinName] = useState("");
  const [cursorGrid, setCursorGrid] = useState("");
  const map = state.map;
  const worldSize = state.info?.mapSize || 4250;
  const image = useMemo(() => {
    const ratio = map ? map.width / map.height : 1;
    const width = Math.min(size.width, size.height * ratio);
    return { width, height: width / ratio };
  }, [map?.width, map?.height, size]);
  const geometry = useRef({ size, image });
  geometry.current = { size, image };
  viewRef.current = view;
  const t = (text: string) => translate(state.settings.language, text);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [Boolean(map)]);
  useEffect(
    () => setView((previous) => clampView(previous, size, image)),
    [size, image],
  );
  useEffect(() => {
    setView(initialView);

    setPinMode(false);
  }, [state.connection.serverId]);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (
        (event.target as Element).closest(".map-heat-controls,.map-pin-editor")
      )
        return;
      event.preventDefault();
      const bounds = element.getBoundingClientRect();
      const { size, image } = geometry.current;
      const delta =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? size.height : 1);
      const previous = viewRef.current;
      setView(
        zoomView(
          previous,
          previous.scale * Math.exp(-delta * (event.ctrlKey ? 0.008 : 0.0015)),
          {
            x: event.clientX - bounds.left - size.width / 2,
            y: event.clientY - bounds.top - size.height / 2,
          },
          size,
          image,
        ),
      );
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [Boolean(map)]);
  if (!map)
    return (
      <Offline
        navigateTo={navigateTo}
        text="После подключения здесь появится настоящая карта сервера с командой и метками."
      />
    );
  function zoom(factor: number) {
    setView((previous) =>
      zoomView(previous, previous.scale * factor, { x: 0, y: 0 }, size, image),
    );
  }
  function pointAt(clientX: number, clientY: number) {
    const bounds = viewport.current!.getBoundingClientRect();
    return {
      x:
        (clientX - bounds.left - size.width / 2 - viewRef.current.x) /
          (image.width * viewRef.current.scale) +
        0.5,
      y:
        (clientY - bounds.top - size.height / 2 - viewRef.current.y) /
          (image.height * viewRef.current.scale) +
        0.5,
    };
  }
  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (
      event.button !== 0 ||
      (event.target as Element).closest(
        "button,input,.map-heat-controls,.map-pin-editor",
      )
    )
      return;
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      start: viewRef.current,
      moved: false,
    };
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (active?.id === event.pointerId) {
      const dx = event.clientX - active.x,
        dy = event.clientY - active.y;
      if (Math.hypot(dx, dy) > 4) active.moved = true;
      if (active.moved) {
        setDragging(true);
        setView(
          clampView(
            { ...active.start, x: active.start.x + dx, y: active.start.y + dy },
            size,
            image,
          ),
        );
      }
    }
    const point = pointAt(event.clientX, event.clientY);
    const x =
      ((point.x * map!.width - map!.oceanMargin) /
        (map!.width - map!.oceanMargin * 2)) *
      worldSize;
    const y =
      (((1 - point.y) * map!.height - map!.oceanMargin) /
        (map!.height - map!.oceanMargin * 2)) *
      worldSize;
    setCursorGrid(gridLabel(x, y, worldSize));
  }
  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (!active || active.moved || !pinMode || !pinName.trim()) return;
    const point = pointAt(event.clientX, event.clientY);
    if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return;
    void runAction("addPin", { name: pinName.trim(), ...point })
      .then(() => {
        setPinMode(false);
        setPinName("");
      })
      .catch(() => {});
  }
  const markerStyle = (x: number, y: number): CSSProperties => ({
    ...worldPosition(x, y, map, worldSize),
    transform: "translate(-50%, -50%)",
  });
  const margin = map.oceanMargin;
  return (
    <section className="map-workspace">
      <div className="map-actions">
        <div className="map-layer-buttons" aria-label="Слои карты">
          <button
            className={grid ? "active" : ""}
            aria-pressed={grid}
            onClick={() => setGrid(!grid)}
          >
            <Grid2X2 size={16} />
            Сетка
          </button>
          <button
            className={team ? "active" : ""}
            aria-pressed={team}
            onClick={() => setTeam(!team)}
          >
            <Users size={16} />
            Команда
          </button>
          <button
            className={heat ? "active" : ""}
            aria-pressed={heat}
            onClick={() => setHeat(!heat)}
          >
            <Flame size={16} />
            Хитмап
          </button>
        </div>
        <div className="map-utilities">
          <button
            className={`icon-button ${pinMode ? "active" : ""}`}
            title="Добавить метку"
            aria-label="Добавить метку"
            aria-pressed={pinMode}
            onClick={() => setPinMode(!pinMode)}
          >
            <MapPin size={17} />
          </button>
          <Action
            className="icon-button"
            label="Обновить данные"
            task={() => runAction("refresh")}
          >
            <RefreshCw size={16} />
          </Action>
        </div>
      </div>
      <div
        ref={viewport}
        className={`map-viewport ${dragging ? "is-dragging" : ""} ${pinMode ? "is-placing" : ""}`}
        tabIndex={0}
        role="region"
        aria-label="Интерактивная карта"
        onPointerDown={startDrag}
        onPointerMove={move}
        onPointerUp={endDrag}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
        }}
        onDoubleClick={(event) => {
          if (
            (event.target as Element).closest(
              "button,input,.map-heat-controls,.map-pin-editor",
            ) ||
            pinMode
          )
            return;
          const bounds = event.currentTarget.getBoundingClientRect();
          setView((previous) =>
            zoomView(
              previous,
              previous.scale * 1.7,
              {
                x: event.clientX - bounds.left - size.width / 2,
                y: event.clientY - bounds.top - size.height / 2,
              },
              size,
              image,
            ),
          );
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "Escape") {
            setPinMode(false);

            return;
          }
          if (["+", "="].includes(event.key)) {
            event.preventDefault();
            zoom(1.4);
          }
          if (event.key === "-") {
            event.preventDefault();
            zoom(1 / 1.4);
          }
          if (event.key === "0" || event.key === "Home") {
            event.preventDefault();
            setView(initialView);
          }
          const pan = {
            ArrowLeft: [80, 0],
            ArrowRight: [-80, 0],
            ArrowUp: [0, 80],
            ArrowDown: [0, -80],
          }[event.key];
          if (pan) {
            event.preventDefault();
            setView((previous) =>
              clampView(
                { ...previous, x: previous.x + pan[0], y: previous.y + pan[1] },
                size,
                image,
              ),
            );
          }
        }}
      >
        <div
          className="live-map"
          style={{
            width: image.width * view.scale,
            height: image.height * view.scale,
            transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px)`,
          }}
        >
          <img
            src={map.jpgImage}
            alt={`Карта ${state.info?.name || "сервера"}`}
            draggable={false}
          />
          {heat && state.heatmap && (
            <div
              className="map-density"
              style={{
                left: `${(margin / map.width) * 100}%`,
                top: `${(margin / map.height) * 100}%`,
                width: `${(1 - (margin * 2) / map.width) * 100}%`,
                height: `${(1 - (margin * 2) / map.height) * 100}%`,
              }}
            >
              <MapHeatmap
                heatmap={state.heatmap}
                category={category}
                opacity={opacity}
                language={state.settings.language}
              />
            </div>
          )}
          {grid && (
            <MapGrid
              map={map}
              worldSize={worldSize}
              scale={(image.width / map.width) * view.scale}
            />
          )}
          {team &&
            state.team.map((member) => (
              <span
                key={member.steamId}
                className={`player-marker ${member.isOnline ? "" : "offline-marker"}`}
                style={markerStyle(member.x, member.y)}
                title={member.name}
              >
                {member.name.slice(0, 2)}
              </span>
            ))}
          {state.pins
            .filter((pin) => pin.serverId === state.connection.serverId)
            .map((pin) => (
              <span
                className="personal-pin"
                key={pin.id}
                style={{
                  left: `${pin.x * 100}%`,
                  top: `${pin.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <MapPin size={20} />
                <span>{pin.name}</span>
              </span>
            ))}
        </div>
        {heat && (
          <div className="map-heat-controls">
            <div className="map-popover-heading">
              <Flame size={16} />
              <strong>Хитмап</strong>
              <button
                className="icon-button"
                aria-label="Закрыть хитмап"
                onClick={() => setHeat(false)}
              >
                <X size={15} />
              </button>
            </div>
            {state.heatmap ? (
              <>
                <PrettySelect
                  label="Ресурс"
                  value={category}
                  options={categories.map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  onChange={setCategory}
                />
                <label className="map-opacity">
                  <span>Насыщенность</span>
                  <input
                    aria-label="Насыщенность хитмапа"
                    type="range"
                    min="0.15"
                    max="1"
                    step="0.05"
                    value={opacity}
                    onChange={(event) => setOpacity(Number(event.target.value))}
                  />
                </label>
                <HeatmapLegend category={category} />
                <p>Зоны спавна, без учёта уже добытых ресурсов.</p>
              </>
            ) : state.heatmapStatus === "loading" ? (
              <p role="status">Читаем карту Rust...</p>
            ) : (
              <>
                <p>Открой этот сервер в Rust, чтобы загрузить карту.</p>
                <Action task={() => runAction("heatmap")}>
                  Проверить карту
                </Action>
              </>
            )}
          </div>
        )}
        {pinMode && (
          <div className="map-pin-editor">
            <MapPin size={17} />
            <input
              autoFocus
              aria-label="Название метки"
              placeholder="Название метки"
              maxLength={60}
              value={pinName}
              onChange={(event) => setPinName(event.target.value)}
            />
            <span>Нажми на карту</span>
            <button
              className="icon-button"
              aria-label="Отменить метку"
              onClick={() => setPinMode(false)}
            >
              <X size={15} />
            </button>
          </div>
        )}
        <div className="map-navigation">
          <button
            aria-label="Увеличить карту"
            title="Увеличить карту"
            onClick={() => zoom(1.4)}
            disabled={view.scale >= 8}
          >
            <Plus size={18} />
          </button>
          <span>{Math.round(view.scale * 100)}%</span>
          <button
            aria-label="Уменьшить карту"
            title="Уменьшить карту"
            onClick={() => zoom(1 / 1.4)}
            disabled={view.scale <= 1}
          >
            <Minus size={18} />
          </button>
          <button
            aria-label="Показать всю карту"
            title="Показать всю карту"
            onClick={() => setView(initialView)}
          >
            <LocateFixed size={18} />
          </button>
        </div>
        <div className="map-coordinate" aria-label="Квадрат карты">
          {cursorGrid || "·"}
        </div>
      </div>
      {state.pins.some((pin) => pin.serverId === state.connection.serverId) && (
        <div className="map-saved-pins">
          {state.pins
            .filter((pin) => pin.serverId === state.connection.serverId)
            .map((pin) => (
              <div key={pin.id}>
                <MapPin size={13} />
                <span>{pin.name}</span>
                <Action
                  className="icon-button"
                  label={t("Удалить метку") + " " + pin.name}
                  task={() => runAction("deletePin", pin.id)}
                >
                  <X size={13} />
                </Action>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}
