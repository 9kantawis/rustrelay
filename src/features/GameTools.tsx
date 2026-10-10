import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Swords,
  Trash2,
  Timer,
  Sprout,
  ArrowRight,
  Copy,
  Zap,
} from "lucide-react";
import engine from "../../shared/rust-calculations.cjs";
import type { AppState } from "../../shared/contracts";
import PrettySelect from "../components/PrettySelect";
import ItemIcon from "../components/ItemIcon";

type Props = {
  page: string;
  state: AppState;
  runAction: (action: string, payload?: unknown) => Promise<any>;
};
const formatNumber = (value: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value);
const names = engine.names as Record<string, string>;

function ResourceList({ resources }: { resources: Record<string, number> }) {
  return (
    <div>
      {Object.entries(resources).map(([name, value]) => (
        <div className="list-row" key={name}>
          <span className="inline">
            <ItemIcon item={name} />
            {names[name] || name}
          </span>
          <strong>{formatNumber(value)}</strong>
        </div>
      ))}
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Raid() {
  const [targets, setTargets] = useState([{ id: "metal-door", quantity: 1 }]);
  const [allowed, setAllowed] = useState(["rocket", "c4", "satchel", "ammo"]);
  const [mode, setMode] = useState("sulfur");
  const calculation = useMemo(() => {
    try {
      const plans = targets.map((target) =>
        engine.raid(target.id, target.quantity, allowed, mode),
      );
      const resources: Record<string, number> = {};
      let sulfur = 0;
      let fuel = 0;
      for (const plan of plans) {
        if (!plan) return null;
        sulfur += plan.sulfur;
        fuel += plan.lgf;
        for (const [id, amount] of Object.entries(plan.tools))
          resources[id] = (resources[id] || 0) + Number(amount);
      }
      return { sulfur, fuel, resources };
    } catch {
      return null;
    }
  }, [targets, allowed, mode]);
  return (
    <div className="two-columns">
      <section className="panel content-panel">
        <h2>Через что идём?</h2>
        <p className="small muted">Добавь каждую дверь или стену на пути.</p>
        {targets.map((target, index) => (
          <div className="target-row" key={index}>
            <Field label={`Цель ${index + 1}`}>
              <PrettySelect
                label={"Цель " + (index + 1)}
                value={target.id}
                options={engine.targets.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
                onChange={(value) =>
                  setTargets(
                    targets.map((row, position) =>
                      position === index ? { ...row, id: value } : row,
                    ),
                  )
                }
              />
            </Field>
            <Field label="Количество">
              <input
                type="number"
                min="0"
                max="100"
                value={target.quantity}
                onChange={(event) =>
                  setTargets(
                    targets.map((row, position) =>
                      position === index
                        ? { ...row, quantity: Number(event.target.value) }
                        : row,
                    ),
                  )
                }
              />
            </Field>
            <button
              className="icon-button"
              aria-label={`Убрать цель ${index + 1}`}
              onClick={() =>
                setTargets(targets.filter((_, position) => position !== index))
              }
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          className="secondary"
          onClick={() =>
            setTargets([...targets, { id: "stone-wall", quantity: 1 }])
          }
        >
          <Plus size={15} />
          Добавить цель
        </button>
        <h2 className="subheading">Чем рейдим сегодня?</h2>
        <div className="choices">
          {engine.explosives.map((item) => (
            <label
              key={item.id}
              className={allowed.includes(item.id) ? "selected" : ""}
            >
              <input
                type="checkbox"
                checked={allowed.includes(item.id)}
                onChange={(event) =>
                  setAllowed(
                    event.target.checked
                      ? [...allowed, item.id]
                      : allowed.filter((id) => id !== item.id),
                  )
                }
              />
              <span>
                <span className="inline">
                  <ItemIcon item={item.id} />
                  {item.name}
                </span>
                <small className="inline">
                  <ItemIcon item="sulfur" size={16} />
                  {formatNumber(item.sulfur)} серы
                </small>
              </span>
            </label>
          ))}
        </div>
      </section>
      <section className="panel content-panel">
        <div className="eyebrow">ПЛАН РЕЙДА</div>
        <div className="segmented">
          <button
            className={mode === "sulfur" ? "active" : ""}
            onClick={() => setMode("sulfur")}
          >
            Меньше серы
          </button>
          <button
            className={mode === "count" ? "active" : ""}
            onClick={() => setMode("count")}
          >
            Меньше зарядов
          </button>
        </div>
        {calculation ? (
          <>
            <div className="result-number">
              {formatNumber(calculation.sulfur)}
              <small className="inline">
                <ItemIcon item="sulfur" size={24} />
                серы
              </small>
            </div>
            <p className="small inline">
              <ItemIcon item="lowgradefuel" size={22} />
              Топливо: {formatNumber(calculation.fuel)}
            </p>
            <div className="result-tools">
              {Object.entries(calculation.resources).map(([id, count]) => (
                <div className="list-row" key={id}>
                  <span className="inline">
                    <ItemIcon item={id} />
                    {engine.explosives.find((item) => item.id === id)?.name}
                  </span>
                  <strong>× {count}</strong>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p>Выбери доступные боеприпасы и проверь количество целей.</p>
        )}
      </section>
    </div>
  );
}

function Craft() {
  const [tab, setTab] = useState("craft");
  const [item, setItem] = useState("rifle.ak");
  const [quantity, setQuantity] = useState(1);
  const [raw, setRaw] = useState(false);
  const [efficiency, setEfficiency] = useState(0.5);
  const [cart, setCart] = useState<Record<string, number>>({ gears: 1 });
  const [chain, setChain] = useState(false);
  const [component, setComponent] = useState("gears");
  let resources: Record<string, number> = {};
  let error = "";
  let seconds = 0;
  try {
    if (tab === "craft") {
      const result = engine.craft(item, quantity, raw);
      resources = result.resources;
      seconds = result.time;
    } else resources = engine.recycle(cart, efficiency, chain);
  } catch (problem) {
    error = problem instanceof Error ? problem.message : "Проверь ввод";
  }
  return (
    <>
      <div className="segmented">
        <button
          className={tab === "craft" ? "active" : ""}
          onClick={() => setTab("craft")}
        >
          Крафт
        </button>
        <button
          className={tab === "recycle" ? "active" : ""}
          onClick={() => setTab("recycle")}
        >
          Переработка
        </button>
      </div>
      <div className="two-columns">
        <section className="panel content-panel">
          <h2>{tab === "craft" ? "Что изготовить?" : "Что переработать?"}</h2>
          {tab === "craft" ? (
            <>
              <div className="form-grid">
                <Field label="Предмет">
                  <PrettySelect
                    label="Предмет"
                    value={item}
                    options={engine.recipes.map((recipe) => ({
                      value: recipe.id,
                      label: recipe.name,
                      icon: recipe.id,
                    }))}
                    onChange={setItem}
                  />
                </Field>
                <Field label="Нужное количество">
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(Number(event.target.value))
                    }
                  />
                </Field>
              </div>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={raw}
                  onChange={(event) => setRaw(event.target.checked)}
                />
                Разложить доступные рецепты до сырья
              </label>
            </>
          ) : (
            <>
              <Field label="Тип переработчика">
                <PrettySelect
                  label="Тип переработчика"
                  value={efficiency}
                  options={[
                    { value: "0.5", label: "50% · стандартный профиль" },
                    { value: "0.6", label: "60% · повышенный выход" },
                    { value: "0.4", label: "40% · безопасная зона" },
                    { value: "0.75", label: "75% · электростанция" },
                  ]}
                  onChange={(value) => setEfficiency(Number(value))}
                />
              </Field>
              <div className="form-actions">
                <PrettySelect
                  label="Компонент"
                  value={component}
                  options={engine.recyclables.map((row) => ({
                    value: row.id,
                    label: row.name,
                    icon: row.id,
                  }))}
                  onChange={setComponent}
                />
                <button
                  className="secondary"
                  onClick={() =>
                    setCart({
                      ...cart,
                      [component]: (cart[component] || 0) + 1,
                    })
                  }
                >
                  <Plus size={15} />
                  Добавить
                </button>
              </div>
              {Object.entries(cart).map(([id, count]) => (
                <div className="list-row" key={id}>
                  <span className="inline">
                    <ItemIcon item={id} />
                    {engine.recyclables.find((row) => row.id === id)?.name}
                  </span>
                  <input
                    className="quantity-input"
                    aria-label={`Количество ${id}`}
                    type="number"
                    min="0"
                    max="10000"
                    value={count}
                    onChange={(event) =>
                      setCart({ ...cart, [id]: Number(event.target.value) })
                    }
                  />
                  <button
                    aria-label={`Убрать ${id}`}
                    className="icon-button"
                    onClick={() =>
                      setCart(
                        Object.fromEntries(
                          Object.entries(cart).filter(([key]) => key !== id),
                        ),
                      )
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={chain}
                  onChange={(event) => setChain(event.target.checked)}
                />
                Переработать промежуточные компоненты
              </label>
            </>
          )}
        </section>
        <section className="panel content-panel">
          <div className="eyebrow">
            {tab === "craft" ? "ПОТРЕБУЕТСЯ" : "ПОЛУЧИШЬ В СРЕДНЕМ"}
          </div>
          <h2>
            {tab === "craft" ? "Ресурсы на крафт" : "Результат переработки"}
          </h2>
          {error ? (
            <p role="alert">{error}</p>
          ) : (
            <ResourceList resources={resources} />
          )}
          {tab === "craft" && (
            <p className="small muted subheading">
              Время очереди: {formatNumber(seconds)} сек.
            </p>
          )}
        </section>
      </div>
    </>
  );
}

function Genetics() {
  const [pool, setPool] = useState("");
  const [target, setTarget] = useState("GGGYYY");
  const [center, setCenter] = useState("XXXXXX");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  function calculate() {
    try {
      const clones = pool
        .toUpperCase()
        .split(/[\s,;]+/)
        .filter(Boolean);
      if (clones.length < 2 || clones.length > 16)
        throw Error("Добавь от 2 до 16 клонов");
      setResult(
        engine.findBreed(clones, target.toUpperCase(), center.toUpperCase()),
      );
      setError("");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Проверь гены");
      setResult(null);
    }
  }
  const genes = (text: string) => (
    <span className="genes">
      {text.split("").map((gene, index) => (
        <b key={index} className={"WX".includes(gene) ? "bad-gene" : ""}>
          {gene}
        </b>
      ))}
    </span>
  );
  return (
    <div className="two-columns">
      <section className="panel content-panel">
        <h2>Коллекция клонов</h2>
        <Field label="Гены, по одному клону на строку">
          <textarea
            rows={8}
            value={pool}
            placeholder={"GGGYYH\nGHGHYY\nHGGYYY"}
            onChange={(event) => setPool(event.target.value.toUpperCase())}
          />
        </Field>
        <div className="form-grid subheading">
          <Field label="Целевые гены">
            <input
              maxLength={6}
              value={target}
              onChange={(event) => setTarget(event.target.value.toUpperCase())}
            />
          </Field>
          <Field label="Растение, которое скрещиваем">
            <input
              maxLength={6}
              value={center}
              onChange={(event) => setCenter(event.target.value.toUpperCase())}
            />
          </Field>
        </div>
        <p className="gene-help">
          Введи шесть букв у растения в центре грядки. Оно получит гены соседних
          клонов.
        </p>
        <div className="gene-key">
          <span>
            <b>G</b> Рост
          </span>
          <span>
            <b>Y</b> Урожай
          </span>
          <span>
            <b>H</b> Выносливость
          </span>
          <span>
            <b>W</b> Больше воды
          </span>
          <span>
            <b>X</b> Пустой ген
          </span>
        </div>
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button className="primary" onClick={calculate}>
            <Sprout size={16} />
            Подобрать соседей
          </button>
        </div>
      </section>
      <section className="panel content-panel">
        <div className="eyebrow">СХЕМА ПОСАДКИ</div>
        <h2>От клонов к цели</h2>
        {result ? (
          <>
            <div className="planter">
              {Array.from({ length: 9 }, (_, index) => (
                <div key={index} className={index === 4 ? "center-plant" : ""}>
                  {index === 4 ? (
                    <>
                      <small>Центр</small>
                      {genes(center)}
                    </>
                  ) : result.donors[index < 4 ? index : index - 1] ? (
                    genes(result.donors[index < 4 ? index : index - 1])
                  ) : (
                    <span className="muted">Пусто</span>
                  )}
                </div>
              ))}
            </div>
            <h3>Результат</h3>
            <div className="gene-result">
              {result.result.map((gene: string, index: number) => (
                <span
                  key={index}
                  className={gene === target[index] ? "match" : ""}
                >
                  {gene}
                </span>
              ))}
            </div>
            <p className="small">Совпало {result.exact} из 6 позиций.</p>
          </>
        ) : (
          <div className="empty">
            <Sprout size={42} strokeWidth={1} />
            <p>Добавь гены клонов, чтобы получить схему посадки.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function Decay({ state, runAction }: Omit<Props, "page">) {
  const [grade, setGrade] = useState("stone");
  const [hp, setHp] = useState(250);
  const [name, setName] = useState("Каменная база");
  const [grid, setGrid] = useState("");
  const [rate, setRate] = useState(1);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const materials = engine.materials as Record<
    string,
    { name: string; hp: number; hours: number }
  >;
  let seconds = 0;
  try {
    seconds = engine.decay(grade, hp, rate);
  } catch {
    /* The form explains invalid values before a timer is saved. */
  }
  function duration(value: number) {
    const total = Math.max(0, Math.floor(value));
    return `${Math.floor(total / 3600)} ч ${Math.floor((total % 3600) / 60)} мин ${total % 60} с`;
  }
  return (
    <div className="two-columns">
      <section className="panel content-panel">
        <h2>Когда разрушится?</h2>
        <div className="form-grid">
          <Field label="Материал">
            <PrettySelect
              label="Материал"
              value={grade}
              options={Object.entries(materials).map(([id, item]) => ({
                value: id,
                label: item.name,
                icon: id,
              }))}
              onChange={(value) => {
                setGrade(value);
                setHp(materials[value].hp);
              }}
            />
          </Field>
          <Field label={`Осталось HP (до ${materials[grade].hp})`}>
            <input
              type="number"
              min="0"
              max={materials[grade].hp}
              value={hp}
              onChange={(event) => setHp(Number(event.target.value))}
            />
          </Field>
          <Field label="Название">
            <input
              value={name}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field label="Квадрат карты">
            <input
              value={grid}
              maxLength={8}
              placeholder="Например, D5"
              onChange={(event) => setGrid(event.target.value)}
            />
          </Field>
          <Field label="Множитель скорости распада">
            <input
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              value={rate}
              onChange={(event) => setRate(Number(event.target.value))}
            />
          </Field>
        </div>
        <div className="decay-result">
          <Timer size={23} />
          <strong>{duration(seconds)}</strong>
        </div>
        <button
          className="primary"
          disabled={!seconds}
          onClick={() =>
            void runAction("addTimer", { grade, hp, name, grid, rate }).catch(
              () => {},
            )
          }
        >
          <Plus size={16} />
          Сохранить таймер
        </button>
      </section>
      <section className="panel content-panel">
        <h2>Под наблюдением</h2>
        {state.timers.length ? (
          state.timers.map((timer) => (
            <div className="list-row" key={timer.id}>
              <div>
                <strong>
                  {timer.name}
                  {timer.grid ? ` · ${timer.grid}` : ""}
                </strong>
                <p>
                  {timer.ends <= now
                    ? "Расчётное время истекло"
                    : duration((timer.ends - now) / 1000)}
                </p>
              </div>
              <button
                aria-label={`Удалить ${timer.name}`}
                className="icon-button"
                onClick={() =>
                  void runAction("deleteTimer", timer.id).catch(() => {})
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="empty">
            <Timer size={34} strokeWidth={1} />
            <p>Сохранённые таймеры появятся здесь.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default function GameTools({ page, state, runAction }: Props) {
  if (page === "raid") return <Raid />;
  if (page === "craft") return <Craft />;
  if (page === "genetics") return <Genetics />;
  return <Decay state={state} runAction={runAction} />;
}
