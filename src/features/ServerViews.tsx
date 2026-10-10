import { useRef, useState } from "react";
import {
  X,
  Activity,
  ArrowRight,
  Download,
  Radio,
  RefreshCw,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import type { AppState } from "../../shared/contracts";
import { Action } from "./ConnectionViews";

type Props = {
  state: AppState;
  runAction: (action: string, payload?: unknown) => Promise<any>;
  navigateTo: (page: string) => void;
};
export function Offline({
  navigateTo,
  text = "Подключи сервер, чтобы получить данные Rust+.",
}: {
  navigateTo: Props["navigateTo"];
  text?: string;
}) {
  return (
    <section className="panel">
      <div className="empty">
        <div className="empty-symbol">
          <Radio size={26} />
        </div>
        <h3>Нужно подключение</h3>
        <p>{text}</p>
        <button className="primary" onClick={() => navigateTo("servers")}>
          Выбрать сервер
          <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
}
export { default as ServerMap } from "./ServerMap";

export function Team({ state, runAction, navigateTo }: Props) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const pending = useRef(false);
  async function sendMessage() {
    if (pending.current || !message.trim()) return;
    const entered = message;
    pending.current = true;
    setSending(true);
    try {
      await runAction("chat", entered);
      setMessage((current) => (current === entered ? "" : current));
    } finally {
      pending.current = false;
      setSending(false);
    }
  }
  if (state.connection.status !== "connected")
    return <Offline navigateTo={navigateTo} />;
  return (
    <div className="two-columns">
      <section className="panel content-panel">
        <h2>
          Команда <span className="count">{state.team.length}</span>
        </h2>
        {state.team.length ? (
          state.team.map((member) => (
            <div className="list-row" key={member.steamId}>
              <span className="avatar">
                {member.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="grow">
                <button
                  className="steam-profile-link"
                  onClick={() =>
                    void runAction("openSteamProfile", member.steamId).catch(
                      () => {},
                    )
                  }
                  title="Открыть профиль Steam"
                >
                  {member.name}
                </button>
                <p>
                  {member.isOnline ? "В сети" : "Не в сети"} ·{" "}
                  {member.isAlive ? "Жив" : "Погиб"}
                </p>
              </div>
              <span className="muted small">
                {Math.round(member.x)}, {Math.round(member.y)}
              </span>
            </div>
          ))
        ) : (
          <p>Сервер не передал участников команды.</p>
        )}
        <div className="form-actions">
          <Action label="Обновить данные" task={() => runAction("refresh")}>
            <RefreshCw size={15} />
            Обновить
          </Action>
        </div>
      </section>
      <section className="panel content-panel">
        <h2>Командный чат</h2>
        <div className="chat-messages">
          {state.chat.length ? (
            state.chat.map((row, index) => (
              <div className="chat-message" key={`${row.time}-${index}`}>
                <div>
                  <button
                    className="steam-profile-link"
                    onClick={() =>
                      void runAction("openSteamProfile", row.steamId).catch(
                        () => {},
                      )
                    }
                    title="Открыть профиль Steam"
                  >
                    {row.name}
                  </button>
                  <small>
                    {new Date(row.time * 1000).toLocaleTimeString(
                      state.settings.language,
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </small>
                </div>
                <p>{row.message}</p>
              </div>
            ))
          ) : (
            <div className="empty">
              <Users size={30} />
              <p>Сообщений пока нет.</p>
            </div>
          )}
        </div>
        <label className="form-field">
          <span>Сообщение команде</span>
          <textarea
            rows={2}
            maxLength={128}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing &&
                event.keyCode !== 229
              ) {
                event.preventDefault();
                void sendMessage().catch(() => {});
              }
            }}
          />
        </label>
        <div className="form-actions">
          <Action
            className="primary"
            disabled={sending || !message.trim()}
            task={sendMessage}
          >
            <Send size={15} />
            Отправить
          </Action>
          <span className="muted small">{message.length}/128</span>
        </div>
      </section>
    </div>
  );
}

export function Events({ state, runAction }: Props) {
  const [filter, setFilter] = useState("all");
  const events = state.events.filter(
    (event) => filter === "all" || event.kind === filter,
  );
  return (
    <section className="panel content-panel">
      <div className="map-toolbar">
        <div className="segmented">
          {[
            { id: "all", name: "Все" },
            { id: "danger", name: "Тревоги" },
            { id: "team", name: "Команда" },
            { id: "timer", name: "Таймеры" },
          ].map((item) => (
            <button
              key={item.id}
              className={filter === item.id ? "active" : ""}
              onClick={() => setFilter(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="inline">
          <Action
            className="ghost"
            disabled={!state.events.length}
            task={() => runAction("clearEvents")}
          >
            <Trash2 size={15} />
            Очистить уведомления
          </Action>
          <Action task={() => runAction("export")}>
            <Download size={15} />
            Экспорт
          </Action>
        </div>
      </div>
      {events.length ? (
        events.map((event) => (
          <div className="list-row" key={event.id}>
            <span
              className={`tool-icon ${event.kind === "danger" ? "orange" : "mint"}`}
            >
              <Activity size={18} />
            </span>
            <div className="grow">
              <strong>{event.title}</strong>
              <p>{event.detail}</p>
            </div>
            <span className="muted small">
              {new Date(event.time).toLocaleString(state.settings.language)}
            </span>
            <Action
              className="icon-button"
              label="Удалить уведомление"
              task={() => runAction("deleteEvent", event.id)}
            >
              <X size={15} />
            </Action>
          </div>
        ))
      ) : (
        <div className="empty">
          <Activity size={32} strokeWidth={1} />
          <h3 className="subheading">Пока нет событий</h3>
          <p>
            Здесь сохраняются изменения команды, тревоги и сработавшие таймеры.
          </p>
        </div>
      )}
    </section>
  );
}
