import {
  ArrowRight,
  Bell,
  Box,
  Check,
  ChevronRight,
  Radio,
  Server,
  Shield,
  Sprout,
  Swords,
  Timer,
  Zap,
} from "lucide-react";
import type { AppState } from "../../shared/contracts";

const shortcuts = [
  {
    id: "raid",
    title: "Рассчитать рейд",
    detail: "Цели и боеприпасы",
    icon: Swords,
  },
  {
    id: "craft",
    title: "Крафт и переработка",
    detail: "Ингредиенты и ресурсы",
    icon: Zap,
  },
  {
    id: "genetics",
    title: "Подобрать гены",
    detail: "Клоны и скрещивание",
    icon: Sprout,
  },
  {
    id: "decay",
    title: "Таймер гниения",
    detail: "Время и напоминания",
    icon: Timer,
  },
];

export default function Overview({
  state,
  navigateTo,
}: {
  state: AppState;
  navigateTo: (page: string) => void;
}) {
  const connected = state.connection.status === "connected";
  const devices = state.devices.filter(
    (device) => device.serverId === state.connection.serverId,
  );
  const activeTimers = state.timers.filter(
    (timer) => timer.ends > Date.now(),
  ).length;
  const stats = [
    {
      label: "Игроки на сервере",
      value: connected && state.info ? state.info.players : "-",
      suffix: connected && state.info ? `из ${state.info.maxPlayers}` : "",
    },
    {
      label: "Команда в сети",
      value: connected
        ? state.team.filter((member) => member.isOnline).length
        : "-",
      suffix: connected ? `из ${state.team.length}` : "",
    },
    { label: "Устройства", value: state.devices.length, suffix: "" },
    { label: "Активные таймеры", value: activeTimers, suffix: "" },
  ];
  return (
    <>
      <section className={`server-summary ${connected ? "is-connected" : ""}`}>
        <div className="server-summary-copy">
          <span className="section-label">
            <Server size={16} />
            {connected ? "Текущий сервер" : "Начни с подключения"}
          </span>
          <h2>
            {connected
              ? state.info?.name || "Сервер подключён"
              : state.servers.length
                ? "Выбери сервер"
                : "Подключи свой Rust."}
          </h2>
          <p>
            {connected
              ? "Карта, команда и устройства доступны через Rust+."
              : "Войди через Steam и свяжи сервер с RustRelay. Карта, команда и устройства появятся здесь."}
          </p>
          <button
            className="primary"
            onClick={() => navigateTo(connected ? "map" : "servers")}
          >
            {connected ? "Открыть карту" : "Подключить сервер"}
            <ArrowRight size={17} />
          </button>
        </div>
        {connected ? (
          <div className="server-details">
            <span>Устройства на этом сервере</span>
            {[
              { type: 1, name: "Переключатели", icon: Zap },
              { type: 2, name: "Сигнализации", icon: Bell },
              { type: 3, name: "Хранилища", icon: Box },
            ].map(({ type, name, icon: Icon }) => (
              <button key={type} onClick={() => navigateTo("devices")}>
                <Icon size={17} />
                <span>{name}</span>
                <strong>
                  {devices.filter((device) => device.type === type).length}
                </strong>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        ) : (
          <ol className="connection-steps">
            {[
              "Войти через Steam",
              "Подключить Rust+ в игре",
              "Выбрать сервер в RustRelay",
            ].map((label, index) => (
              <li key={label}>
                <span>{index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        )}
      </section>
      <section className="metrics" aria-label="Сводка">
        {stats.map((stat) => (
          <div className="metric" key={stat.label}>
            <span>{stat.label}</span>
            <div>
              {stat.value}
              <small>{stat.suffix}</small>
            </div>
          </div>
        ))}
      </section>
      <div className="overview-lower">
        <section className="tool-directory">
          <div className="section-heading">
            <h2>Инструменты</h2>
            <span>Доступны офлайн</span>
          </div>
          <div className="shortcut-list">
            {shortcuts.map(({ id, title, detail, icon: Icon }) => (
              <button
                key={id}
                onClick={() => navigateTo(id)}
                className="shortcut"
              >
                <Icon size={21} strokeWidth={1.6} />
                <span>
                  <strong>{title}</strong>
                  <small>{detail}</small>
                </span>
                <ArrowRight size={17} />
              </button>
            ))}
          </div>
        </section>
        <section className="recent-activity">
          <div className="section-heading">
            <h2>События</h2>
            <button
              className="text-button"
              onClick={() => navigateTo("events")}
            >
              Все
              <ArrowRight size={14} />
            </button>
          </div>
          {state.events.length ? (
            <div className="recent-events">
              {state.events.slice(0, 3).map((event) => (
                <button key={event.id} onClick={() => navigateTo("events")}>
                  <span className="event-dot" />
                  <span>
                    <strong>{event.title}</strong>
                    <small>
                      {event.detail ||
                        new Date(event.time).toLocaleTimeString("ru-RU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="activity-empty">
              <Bell size={23} strokeWidth={1.5} />
              <h3>Новых событий нет</h3>
              <p>
                Здесь будут уведомления
                <br />
                сервера и таймеров.
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
