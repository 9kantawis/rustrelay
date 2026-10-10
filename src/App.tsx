import { mergeState } from "../shared/state-updates.cjs";
import Monuments from "./features/Monuments";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  Command,
  Bell,
  ChevronDown,
  CircleHelp,
  Crosshair,
  LayoutDashboard,
  Maximize2,
  Minus,
  Plus,
  Radio,
  Search,
  Server,
  Settings,
  Shield,
  Sprout,
  Swords,
  Timer,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { emptyState, type AppState } from "../shared/contracts";
import Companion from "./features/Companion";
import GameTools from "./features/GameTools";
import SteamSignIn from "./features/SteamSignIn";
import {
  Servers,
  Settings as SettingsPage,
  Devices,
} from "./features/ConnectionViews";
import { ServerMap, Team, Events } from "./features/ServerViews";
import Overview from "./features/Overview";
import { installInterfaceTranslator, translate } from "./localization";

type Destination = {
  id: string;
  label: string;
  icon: LucideIcon;
  section?: string;
  description: string;
};
const navigation: Destination[] = [
  {
    id: "overview",
    label: "Обзор",
    icon: LayoutDashboard,
    description: "Сервер, база и инструменты.",
  },
  {
    id: "map",
    label: "Карта сервера",
    icon: Crosshair,
    section: "Сервер",
    description: "Команда и твои метки на карте.",
  },
  {
    id: "team",
    label: "Команда и чат",
    icon: Users,
    description: "Кто в игре и что происходит у команды.",
  },
  {
    id: "devices",
    label: "Моя база",
    icon: Shield,
    description: "Переключатели, сигнализации и запасы.",
  },
  {
    id: "events",
    label: "События",
    icon: Activity,
    description: "История уведомлений и событий сервера.",
  },
  {
    id: "companion",
    label: "Помощник",
    icon: Command,
    description: "Команды и автоматизация.",
  },
  {
    id: "raid",
    label: "Рейд-калькулятор",
    icon: Swords,
    section: "Инструменты",
    description: "Рассчитай боеприпасы и ресурсы для рейда.",
  },
  {
    id: "craft",
    label: "Крафт и переработка",
    icon: Zap,
    description: "Ингредиенты, затраты и выход ресурсов.",
  },
  {
    id: "genetics",
    label: "Генетика",
    icon: Sprout,
    description: "Подбери скрещивание из своих клонов.",
  },
  {
    id: "decay",
    label: "Таймер гниения",
    icon: Timer,
    description: "Рассчитай время гниения и сохрани напоминание.",
  },
  {
    id: "monuments",
    label: "Монументы",
    icon: Radio,
    description: "Справочная информация по локациям Rust.",
  },
];
const destinations = [
  ...navigation,
  {
    id: "servers",
    label: "Серверы",
    icon: Server,
    description: "Подключение Rust+ и сохранённые серверы.",
  },
  {
    id: "settings",
    label: "Настройки",
    icon: Settings,
    description: "Интерфейс, уведомления и данные приложения.",
  },
];

function ConnectionStatus({ state }: { state: AppState }) {
  const labels = {
    disconnected: "Не подключено",
    connecting: "Подключение…",
    connected: "Подключено",
    error: "Ошибка подключения",
  };
  return (
    <span className={`connection-status ${state.connection.status}`}>
      <span />
      {labels[state.connection.status]}
    </span>
  );
}

export default function App() {
  const [page, setPage] = useState("overview");
  const [state, setState] = useState<AppState>(emptyState);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [launching, setLaunching] = useState(true);
  const searchInput = useRef<HTMLInputElement>(null);
  const content = useRef<HTMLElement>(null);

  useEffect(() => {
    window.relay
      ?.invoke("state")
      .then((value) => value && setState(value))
      .catch((error) => setError(error.message));
    return window.relay?.subscribe((update) =>
      setState((current) => mergeState(current, update)),
    );
  }, []);
  useEffect(
    () => installInterfaceTranslator(state.settings.language),
    [state.settings.language, page],
  );
  useEffect(() => {
    const timer = window.setTimeout(() => setLaunching(false), 1250);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInput.current?.focus();
      }
      if (event.key === "Escape") {
        if (state.signIn)
          void window.relay?.invoke("cancelPair").catch(() => {});
        setSearch("");
        searchInput.current?.blur();
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [state.signIn]);

  async function runAction(action: string, payload?: unknown) {
    try {
      if (!window.relay)
        throw new Error("Открой RustRelay как Windows-приложение");
      return await window.relay.invoke(action, payload);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message.replace(
              /^Error invoking remote method '[^']+': Error: /,
              "",
            )
          : "Не удалось выполнить действие",
      );
      throw error;
    }
  }
  function navigateTo(destination: string) {
    setPage(destination);
    setSearch("");
    content.current?.scrollTo(0, 0);
  }
  const current = destinations.find((item) => item.id === page)!;
  const matches = destinations.filter((item) =>
    translate(state.settings.language, item.label)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  let screen: ReactNode;
  if (page === "overview")
    screen = <Overview state={state} navigateTo={navigateTo} />;
  else if (["raid", "craft", "genetics", "decay"].includes(page))
    screen = <GameTools page={page} state={state} runAction={runAction} />;
  else if (page === "servers")
    screen = <Servers state={state} runAction={runAction} />;
  else if (page === "settings")
    screen = <SettingsPage state={state} runAction={runAction} />;
  else if (page === "companion")
    screen = <Companion state={state} runAction={runAction} />;
  else if (page === "devices")
    screen = <Devices state={state} runAction={runAction} />;
  else if (page === "map")
    screen = (
      <ServerMap state={state} runAction={runAction} navigateTo={navigateTo} />
    );
  else if (page === "team")
    screen = (
      <Team state={state} runAction={runAction} navigateTo={navigateTo} />
    );
  else if (page === "events")
    screen = (
      <Events state={state} runAction={runAction} navigateTo={navigateTo} />
    );
  else screen = <Monuments state={state} runAction={runAction} />;

  return (
    <div
      className={`app-shell ${state.settings.motion ? "" : "no-motion"} ${state.settings.glass ? "" : "no-glass"}`}
    >
      <aside className="sidebar" inert={Boolean(state.signIn)}>
        <div className="brand">
          <Radio size={23} strokeWidth={2} />
          <span>RustRelay</span>
        </div>
        <button
          className={`workspace-switch ${page === "servers" ? "selected" : ""}`}
          onClick={() => navigateTo("servers")}
          title={state.info?.name || "Выбрать сервер"}
        >
          <Server size={17} />
          <span>{state.info?.name || "Выбрать сервер"}</span>
          <ChevronDown size={14} />
        </button>
        <div
          className="search-box"
          onBlur={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget as Node | null)
            )
              setSearch("");
          }}
        >
          <Search size={15} />
          <input
            ref={searchInput}
            aria-label="Найти раздел"
            aria-expanded={Boolean(search)}
            aria-controls={search ? "section-search-results" : undefined}
            placeholder="Поиск"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && matches[0])
                navigateTo(matches[0].id);
            }}
          />
          <kbd>Ctrl K</kbd>
          {search && (
            <div
              id="section-search-results"
              className="search-results"
              aria-label="Результаты поиска"
            >
              {matches.length ? (
                matches.map((item) => (
                  <button key={item.id} onClick={() => navigateTo(item.id)}>
                    <item.icon size={16} />
                    {translate(state.settings.language, item.label)}
                  </button>
                ))
              ) : (
                <p>Ничего не найдено</p>
              )}
            </div>
          )}
        </div>
        <nav aria-label="Основная навигация">
          {navigation.map(({ id, label, icon: Icon, section }) => (
            <div key={id}>
              {section && <div className="nav-section">{section}</div>}
              <button
                className={`nav-item ${page === id ? "active" : ""}`}
                onClick={() => navigateTo(id)}
                aria-current={page === id ? "page" : undefined}
                title={translate(state.settings.language, label)}
                aria-label={translate(state.settings.language, label)}
              >
                <Icon size={17} aria-hidden="true" />
                <span>{translate(state.settings.language, label)}</span>
                {id === "events" && state.events.length > 0 && (
                  <small>{state.events.length}</small>
                )}
              </button>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className={`nav-item ${page === "settings" ? "active" : ""}`}
            onClick={() => navigateTo("settings")}
            aria-current={page === "settings" ? "page" : undefined}
          >
            <Settings size={17} />
            <span>Настройки</span>
          </button>
          <span className="app-version">
            RustRelay <span>0.1.8</span>
          </span>
        </div>
      </aside>
      <div className="main-shell" inert={Boolean(state.signIn)}>
        <header className="topbar">
          <span className="current-section">
            {translate(state.settings.language, current.label)}
          </span>
          <div className="topbar-actions">
            <ConnectionStatus state={state} />
            <div className="window-controls">
              <button
                aria-label="Свернуть"
                onClick={() =>
                  void runAction("window", "minimize").catch(() => {})
                }
              >
                <Minus size={15} />
              </button>
              <button
                aria-label="Развернуть"
                onClick={() =>
                  void runAction("window", "maximize").catch(() => {})
                }
              >
                <Maximize2 size={13} />
              </button>
              <button
                aria-label="Закрыть приложение"
                onClick={() =>
                  void runAction("window", "close").catch(() => {})
                }
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </header>
        <main ref={content} className={`page-${page}`}>
          <div className="page-container">
            <div className="page-heading">
              <div>
                <h1>{translate(state.settings.language, current.label)}</h1>
                <p>{translate(state.settings.language, current.description)}</p>
              </div>
              {page === "overview" && state.servers.length > 0 && (
                <button
                  className="secondary"
                  onClick={() => navigateTo("servers")}
                >
                  <Plus size={16} />
                  Подключить сервер
                </button>
              )}
            </div>
            <div className="page-content" key={page}>
              {screen}
            </div>
          </div>
        </main>
      </div>
      {state.signIn && (
        <SteamSignIn state={state.signIn} runAction={runAction} />
      )}
      {launching && (
        <div className="launch-screen" aria-hidden="true">
          <div className="launch-mark">
            <Radio size={30} strokeWidth={1.8} />
            <span>RustRelay</span>
          </div>
        </div>
      )}{" "}
      {error && (
        <div role="alert" className="toast">
          <CircleHelp size={19} />
          <span>{error}</span>
          <button
            className="icon-button"
            aria-label="Закрыть сообщение"
            onClick={() => setError("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
