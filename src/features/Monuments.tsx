import PuzzleWalkthrough from "./PuzzleWalkthrough";
import { useMemo, useState } from "react";
import { ArrowUpRight, BookOpen, ChevronRight, Search } from "lucide-react";
import type { AppState, Language } from "../../shared/contracts";
import { gridLabel } from "../../shared/map.cjs";
import {
  guideForMonument,
  localText,
  monumentAreas,
  monumentGuides,
  monumentName,
  monumentTips,
  type MonumentGuide,
} from "../monuments";
import Dialog from "../components/Dialog";
import ItemIcon from "../components/ItemIcon";
const pictures = import.meta.glob<string>("../assets/monuments/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});
const lootPictures = import.meta.glob<string>("../assets/loot/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});
const terms: Record<string, [string, string]> = {
  "Military Crate": ["Военный ящик", "军用箱"],
  "Elite Crate": ["Элитный ящик", "精英箱"],
  "Normal Crate": ["Обычный ящик", "普通箱"],
  "Medical Crate": ["Медицинский ящик", "医疗箱"],
  "Food Crate": ["Продуктовый ящик", "食品箱"],
  "Food Box": ["Продукты", "食物盒"],
  "Tool Box": ["Ящик инструментов", "工具箱"],
  "Blue Barrel": ["Синяя бочка", "蓝色桶"],
  "Yellow Barrel": ["Жёлтая бочка", "黄色桶"],
  "Oil Barrel": ["Нефтяная бочка", "油桶"],
  "Hackable Locked Crate": ["Взламываемый ящик", "可破解箱"],
  "Locked Crate": ["Закрытый ящик", "上锁箱"],
  "Electric Fuse": ["Предохранитель", "电保险丝"],
  "Heavy Fuse": ["Усиленный предохранитель", "重型保险丝"],
  "Green Keycard": ["Зелёная карта", "绿卡"],
  "Blue Keycard": ["Синяя карта", "蓝卡"],
  "Red Keycard": ["Красная карта", "红卡"],
  "Basic Blueprint Fragment": ["Базовый фрагмент чертежа", "基础蓝图碎片"],
  "Advanced Blueprint Fragment": [
    "Продвинутый фрагмент чертежа",
    "高级蓝图碎片",
  ],
  "On puzzle reset": ["После сброса пазла", "谜题重置后"],
  puzzle: ["пазл", "谜题"],
  or: ["или", "或"],
};
function lootText(text: string, language: Language) {
  if (language === "en") return text;
  let value = text.replace(/[\u2013\u2014]/g, "-");
  for (const [term, names] of Object.entries(terms))
    value = value.replaceAll(term, names[language === "ru" ? 0 : 1]);
  return value.replaceAll("min", language === "ru" ? "мин" : "分钟");
}
function LootIcon({ icon }: { icon: string | null }) {
  if (!icon) return null;
  const name = icon
    .split("/")
    .at(-1)!
    .replace(/\.png$/i, ".webp");
  if (icon.includes("/Items/"))
    return <ItemIcon item={name.replace(/\.webp$/i, "")} size={32} />;
  const source = lootPictures["../assets/loot/" + name];
  return source ? (
    <img
      className="item-icon"
      src={source}
      alt=""
      width={32}
      height={32}
      loading="lazy"
    />
  ) : null;
}
export function MonumentDetails({
  guide,
  language,
  onClose,
  runAction,
}: {
  guide: MonumentGuide;
  language: Language;
  onClose: () => void;
  runAction: (action: string, payload?: unknown) => Promise<any>;
}) {
  const say = (ru: string, en: string, zh: string) =>
    localText(language, ru, en, zh);
  const image = pictures["../assets/monuments/" + guide.image];
  const tips = monumentTips(guide, language);
  return (
    <Dialog
      title={monumentName(guide.id, language)}
      onClose={onClose}
      className="monument-dialog"
    >
      <div className="monument-hero">
        {image && (
          <img
            src={image}
            alt={monumentName(guide.id, language)}
            width={1024}
            height={1024}
          />
        )}
        <div className="monument-summary">
          <span className="eyebrow">
            {guide.safeZone
              ? say("БЕЗОПАСНАЯ ЗОНА", "SAFE ZONE", "安全区")
              : say("ЛУТ И МАРШРУТ", "LOOT AND ROUTE", "战利品与路线")}
          </span>
          <h3>{say("Что здесь есть", "What is here", "这里有什么")}</h3>
          <dl>
            {guide.crates !== null && (
              <>
                <dt>
                  {say("Точки ящиков", "Crate spawn points", "箱子刷新点")}
                </dt>
                <dd>{guide.crates}</dd>
              </>
            )}
            {guide.barrels !== null && (
              <>
                <dt>{say("Точки бочек", "Barrel spawn points", "桶刷新点")}</dt>
                <dd>{guide.barrels}</dd>
              </>
            )}
            <dt>{say("Пазлы", "Puzzles", "谜题")}</dt>
            <dd>{guide.puzzles.length}</dd>
          </dl>
          <p>
            {say("Осмотри по пути:", "Check along the way:", "沿途检查：")}{" "}
            {monumentAreas(guide, language)}.
          </p>
        </div>
      </div>
      <PuzzleWalkthrough
        key={guide.id}
        id={guide.id}
        language={language}
        runAction={runAction}
      />
      {guide.puzzles.map((puzzle, index) => (
        <section className="monument-puzzle" key={index}>
          <div className="guide-section-heading">
            <h3>{lootText(puzzle.title, language)}</h3>
            {puzzle.reset && (
              <span>
                {say("Сброс:", "Reset:", "重置：")}{" "}
                {lootText(puzzle.reset, language)}
              </span>
            )}
          </div>
          <div className="puzzle-supplies">
            {puzzle.supplies.map((alternatives, index) => (
              <div key={index}>
                {alternatives.map((item, itemIndex) => (
                  <span key={item.id}>
                    {itemIndex > 0 && <small>{say("или", "or", "或")}</small>}
                    <ItemIcon item={item.id} size={36} />
                    <span>{lootText(item.name, language)}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>
      ))}
      {guide.loot.length > 0 && (
        <section>
          <div className="guide-section-heading">
            <h3>{say("Лут", "Loot", "战利品")}</h3>
            <span>{say("Точки спавна", "Spawn points", "刷新点")}</span>
          </div>
          <div className="guide-loot-table">
            <div className="guide-loot-head">
              <span>
                {say(
                  "Контейнер или награда",
                  "Container or reward",
                  "容器或奖励",
                )}
              </span>
              <span>{say("Количество", "Count", "数量")}</span>
              <span>{say("Обновление", "Respawn", "刷新")}</span>
            </div>
            {guide.loot.map((row, index) => (
              <div className="guide-loot-row" key={index}>
                <span>
                  <LootIcon icon={row.icon} />
                  {lootText(row.items, language)}
                </span>
                <strong>{row.quantity}</strong>
                <span>{lootText(row.respawn, language)}</span>
              </div>
            ))}
          </div>
          <p className="guide-note">
            {say(
              "Количество точек спавна. Содержимое и наличие лута зависят от сервера и предыдущего посещения.",
              "Spawn-point counts. Contents and available loot depend on the server and previous visits.",
              "此处为刷新点数量。具体内容与现存战利品取决于服务器设置和之前的搜刮。",
            )}
          </p>
        </section>
      )}
      <section className="guide-tips">
        <h3>{say("Что учесть", "Before you go", "出发前注意")}</h3>
        {tips.map((tip) => (
          <p key={tip}>{tip}</p>
        ))}
      </section>
      <footer className="guide-source">
        <span>RustData · {guide.checked}</span>
        <button
          className="ghost"
          onClick={() => void runAction("open", guide.source).catch(() => {})}
        >
          {say("Источник и подробности", "Source and details", "来源与详情")}
          <ArrowUpRight size={14} />
        </button>
      </footer>
    </Dialog>
  );
}
export default function Monuments({
  state,
  runAction,
}: {
  state: AppState;
  runAction: (action: string, payload?: unknown) => Promise<any>;
}) {
  const [selected, setSelected] = useState<MonumentGuide | null>(null),
    [query, setQuery] = useState(""),
    [all, setAll] = useState(!state.map);
  const language = state.settings.language;
  const entries = useMemo(
    () =>
      all
        ? monumentGuides.map((guide) => ({
            guide,
            name: monumentName(guide.id, language),
            grid: "",
            token: guide.key,
          }))
        : (state.map?.monuments || []).map((monument) => ({
            guide: guideForMonument(monument.token),
            name: monumentName(monument.token, language),
            grid: gridLabel(
              monument.x,
              monument.y,
              state.info?.mapSize || 4250,
            ),
            token: monument.token,
          })),
    [all, state.map, language, state.info?.mapSize],
  );
  const filtered = entries.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="monument-library">
      <div className="monument-toolbar">
        <div className="segmented">
          <button
            className={!all ? "active" : ""}
            onClick={() => setAll(false)}
            disabled={!state.map}
          >
            На сервере
          </button>
          <button className={all ? "active" : ""} onClick={() => setAll(true)}>
            Все монументы
          </button>
        </div>
        <label className="monument-search">
          <Search size={15} />
          <input
            value={query}
            aria-label="Найти монумент"
            placeholder="Найти монумент"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <div className="monument-list">
        {filtered.map((entry, index) => (
          <button
            className="monument-list-row"
            key={entry.token + "-" + index}
            disabled={!entry.guide}
            onClick={() => setSelected(entry.guide || null)}
          >
            {entry.guide?.image ? (
              <img
                src={pictures["../assets/monuments/" + entry.guide.image]}
                alt=""
                width={64}
                height={64}
                loading="lazy"
              />
            ) : (
              <BookOpen size={24} />
            )}
            <span>
              <strong>{entry.name}</strong>
              {entry.guide?.crates !== null &&
                entry.guide?.crates !== undefined && (
                  <small>
                    {localText(
                      language,
                      "Точек лута:",
                      "Loot points:",
                      "战利品点：",
                    )}{" "}
                    {entry.guide.crates}
                  </small>
                )}
            </span>
            <span className="monument-grid-label">{entry.grid}</span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty">
          <Search size={28} />
          <p>Ничего не найдено</p>
        </div>
      )}
      {selected && (
        <MonumentDetails
          guide={selected}
          language={language}
          runAction={runAction}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
