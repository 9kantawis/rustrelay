import { DeviceAutomation, SwitchGroups } from "./DeviceAutomation";
import itemNames from "../../shared/item-names.json";
import ItemIcon from "../components/ItemIcon";
import { useState } from "react";
import {
  Bell,
  Box,
  Cable,
  Check,
  Download,
  LoaderCircle,
  Plus,
  Radio,
  RefreshCw,
  Server,
  Shield,
  Trash2,
  Zap,
} from "lucide-react";
import type { AppState } from "../../shared/contracts";
import PrettySelect from "../components/PrettySelect";

type Props = {
  state: AppState;
  runAction: (action: string, payload?: unknown) => Promise<any>;
};
export function Action({
  children,
  task,
  className = "secondary",
  disabled = false,
  label,
}: {
  children: React.ReactNode;
  task: () => Promise<any>;
  className?: string;
  disabled?: boolean;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className={className}
      aria-label={label}
      aria-busy={busy}
      disabled={busy || disabled}
      onClick={async () => {
        setBusy(true);
        try {
          await task();
        } catch {
          /* App shows the error. */
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy && <LoaderCircle size={15} className="spin" />}
      {children}
    </button>
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
export function Servers({ state, runAction }: Props) {
  const [form, setForm] = useState({
    name: "",
    ip: "",
    port: "28082",
    playerId: "",
    playerToken: "",
    proxy: true,
  });
  const [manual, setManual] = useState(false);
  const [saved, setSaved] = useState(false);
  const pairLabels: Record<string, string> = {
    idle: "Вход ещё не выполнен",
    "signed-in": "Вход выполнен",
    steam: "Заверши вход через Steam",
    registering: "Регистрируем уведомления",
    listening: "Теперь нажми «Подключить Rust+» в игре",
    paired: "Сервер добавлен",
    error: "Сопряжение не завершилось",
  };
  return (
    <>
      <div className="two-columns">
        <section className="panel content-panel">
          <span className="eyebrow">ПОДКЛЮЧЕНИЕ RUST+</span>
          <h2>Подключение сервера</h2>
          <p>
            Войди через Steam, зайди на сервер в Rust и выбери «Подключить
            Rust+». Сервер появится в списке справа.
          </p>
          <ol className="steps">
            <li>
              <span>01</span>
              <div>
                <strong>Войди в Steam</strong>
                <p>Вход откроется здесь, на официальной странице Rust+.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Открой меню Rust+ в игре</strong>
                <p>Нажми кнопку подключения к текущему серверу.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Выбери сервер здесь</strong>
                <p>После подключения станут доступны карта и команда.</p>
              </div>
            </li>
          </ol>
          <div className="form-actions">
            <button
              className="primary"
              disabled={
                Boolean(state.account) ||
                ["steam", "registering"].includes(state.pairStatus)
              }
              onClick={() => void runAction("pair").catch(() => {})}
            >
              <Cable size={16} />
              {state.account
                ? "Вход выполнен"
                : state.pairStatus === "steam"
                  ? "Выполняется вход"
                  : state.pairStatus === "registering"
                    ? "Подключаем Rust+"
                    : "Войти через Steam"}
            </button>
            {state.pairStatus === "steam" && (
              <Action className="ghost" task={() => runAction("cancelPair")}>
                Отменить вход
              </Action>
            )}
            {state.account && (
              <Action className="ghost" task={() => runAction("logout")}>
                Выйти из аккаунта
              </Action>
            )}
            {state.hasPairing && (
              <Action task={() => runAction("listen")}>
                <Radio size={15} />
                Ждать сопряжение
              </Action>
            )}
          </div>
          {state.pairError && (
            <div className="notice" role="alert">
              {state.pairError}
            </div>
          )}
          <div className="notice" role="status">
            {pairLabels[state.pairStatus] || state.pairStatus}
          </div>
          <div className="form-actions">
            <button className="secondary" onClick={() => setManual(!manual)}>
              {manual ? "Скрыть ручной ввод" : "Ввести данные вручную"}
            </button>
          </div>
        </section>
        <section className="panel content-panel">
          <h2>
            Мои серверы <span className="count">{state.servers.length}</span>
          </h2>
          {state.servers.length ? (
            state.servers.map((server) => (
              <div className="server-item" key={server.id}>
                <span className="tool-icon orange">
                  <Server size={21} />
                </span>
                <div>
                  <strong>{server.name}</strong>
                  <p>
                    {server.ip}:{server.port}
                  </p>
                  <div className="form-actions">
                    {state.connection.serverId === server.id &&
                    ["connected", "connecting"].includes(
                      state.connection.status,
                    ) ? (
                      <Action task={() => runAction("disconnect")}>
                        Отключить
                      </Action>
                    ) : (
                      <Action
                        className="primary"
                        disabled={state.requiresSignIn}
                        task={() => runAction("connect", server.id)}
                      >
                        <Radio size={14} />
                        Подключить
                      </Action>
                    )}
                    <Action
                      className="icon-button destructive"
                      task={() => runAction("deleteServer", server.id)}
                    >
                      <Trash2 size={15} />
                      <span className="sr-only">
                        Удалить сервер {server.name}
                      </span>
                    </Action>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty">
              <Server size={35} strokeWidth={1} />
              <h3 className="subheading">Здесь будет твой сервер</h3>
              <p>Войди через Steam и подключи Rust+ в игре.</p>
            </div>
          )}
          {state.connection.error && (
            <div className="notice" role="alert">
              {state.connection.error}
            </div>
          )}
        </section>
      </div>
      {manual && (
        <section className="panel content-panel subheading">
          <h2>Данные сопряжения</h2>
          <p className="small">
            Нужен app.port сервера и токен именно твоего сопряжения Rust+. Это
            не пароль Steam.
          </p>
          <div className="form-grid subheading">
            {[
              { key: "name", label: "Название" },
              { key: "ip", label: "Адрес сервера" },
              { key: "port", label: "Порт Rust+" },
              { key: "playerId", label: "Steam ID (17 цифр)" },
              { key: "playerToken", label: "Токен сопряжения" },
            ].map(({ key, label }) => (
              <Field key={key} label={label}>
                <input
                  type={key === "playerToken" ? "password" : "text"}
                  autoComplete="off"
                  value={String(form[key as keyof typeof form])}
                  onChange={(event) => {
                    setForm({ ...form, [key]: event.target.value });
                    setSaved(false);
                  }}
                />
              </Field>
            ))}
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.proxy}
              onChange={(event) =>
                setForm({ ...form, proxy: event.target.checked })
              }
            />
            Сначала пробовать прокси Facepunch
          </label>
          <Action
            className="primary"
            task={async () => {
              await runAction("saveServer", form);
              setForm({ ...form, playerToken: "" });
              setSaved(true);
            }}
          >
            <Plus size={15} />
            Сохранить сервер
          </Action>
          {saved && (
            <p className="notice">Сервер сохранён. Можно подключиться.</p>
          )}
        </section>
      )}
    </>
  );
}

export function Settings({ state, runAction }: Props) {
  const [webhook, setWebhook] = useState("");
  const [saved, setSaved] = useState(false);
  const interfaceSettings = [
    {
      key: "motion",
      title: "Анимации",
      text: "Плавные переходы и появление элементов.",
    },
    {
      key: "glass",
      title: "Прозрачные поверхности",
      text: "Размытие фона у панелей, меню и верхней строки.",
    },
    {
      key: "autoStart",
      title: "Автозапуск",
      text: "Запускать RustRelay после входа в Windows.",
    },
    {
      key: "closeToTray",
      title: "Работа в трее",
      text: "Кнопка закрытия сворачивает приложение в системный трей.",
    },
    {
      key: "bot",
      title: "Команды в чате",
      text: "Отвечать на команды прямо в игровом чате.",
    },
  ] as const;
  const notificationSettings = [
    {
      key: "notifications",
      title: "Уведомления Windows",
      text: "Показывать системные уведомления.",
    },
    {
      key: "overlayNotifications",
      title: "Поверх всех окон",
      text: "Показывать компактное уведомление, когда тебя нет на сервере.",
    },
    {
      key: "discord",
      title: "Уведомления Discord",
      text: "Отправлять выбранные события в настроенный канал.",
    },
  ] as const;
  const notificationKinds = [
    { key: "danger", label: "Тревоги и гибель" },
    { key: "team", label: "Статус команды" },
    { key: "timer", label: "Таймер гниения" },
    { key: "system", label: "Системные события" },
  ] as const;

  function SettingSwitch({
    setting,
  }: {
    setting: {
      key:
        | "motion"
        | "glass"
        | "autoStart"
        | "closeToTray"
        | "bot"
        | "notifications"
        | "overlayNotifications"
        | "discord";
      title: string;
      text: string;
    };
  }) {
    return (
      <div className="list-row">
        <div>
          <strong>{setting.title}</strong>
          <p>{setting.text}</p>
        </div>
        <button
          role="switch"
          aria-label={setting.title}
          aria-checked={state.settings[setting.key]}
          className="switch"
          onClick={() =>
            void runAction("settings", {
              [setting.key]: !state.settings[setting.key],
            }).catch(() => {})
          }
        />
      </div>
    );
  }

  return (
    <div className="two-columns settings-layout">
      <section className="panel content-panel">
        <div className="account-settings">
          <div>
            <h2>Аккаунт Steam</h2>
            <p>
              {state.account ? state.account.steamId : "Вход ещё не выполнен"}
            </p>
          </div>
          {state.account ? (
            <Action className="secondary" task={() => runAction("logout")}>
              Выйти из аккаунта
            </Action>
          ) : (
            <Action
              className="secondary"
              disabled={["steam", "registering"].includes(state.pairStatus)}
              task={() => runAction("pair")}
            >
              Войти через Steam
            </Action>
          )}
        </div>
        <h2>Интерфейс и запуск</h2>
        <Field label="Язык интерфейса">
          <PrettySelect
            label="Язык интерфейса"
            value={state.settings.language}
            options={[
              { value: "ru", label: "Русский" },
              { value: "en", label: "English" },
              { value: "zh", label: "简体中文" },
            ]}
            onChange={(language) =>
              void runAction("settings", { language }).catch(() => {})
            }
          />
        </Field>
        <div className="settings-group">
          {interfaceSettings.map((setting) => (
            <SettingSwitch key={setting.key} setting={setting} />
          ))}
        </div>
        <div className="command-guide">
          <span className="eyebrow">КОМАНДЫ ЧАТА</span>
          {[
            ["!pop", "Игроки и очередь сервера"],
            ["!wipe", "Дата последнего вайпа"],
            ["!craft <item> <qty>", "Ресурсы для крафта"],
            ["!recycle <item> <qty>", "Результат переработки"],
            ["!decay <grade> <hp>", "Оставшееся время гниения"],
            ["!upkeep", "Запас ресурсов в шкафах"],
          ].map(([command, description]) => (
            <div className="command-row" key={command}>
              <code>{command}</code>
              <span>{description}</span>
            </div>
          ))}
        </div>

        <Action task={() => runAction("export")}>
          <Download size={15} />
          Экспортировать данные без токенов
        </Action>
      </section>

      <section className="panel content-panel">
        <h2>Уведомления</h2>
        {notificationSettings.map((setting) => (
          <SettingSwitch key={setting.key} setting={setting} />
        ))}
        <div className="notification-kinds">
          <span className="eyebrow">ЧТО ПОКАЗЫВАТЬ</span>
          {notificationKinds.map((kind) => (
            <label key={kind.key}>
              <span>{kind.label}</span>
              <input
                type="checkbox"
                checked={state.settings.notificationKinds[kind.key]}
                onChange={(event) =>
                  void runAction("settings", {
                    notificationKinds: {
                      [kind.key]: event.target.checked,
                    },
                  }).catch(() => {})
                }
              />
            </label>
          ))}
        </div>

        <h2 className="subheading">Канал Discord</h2>
        <p className="small">
          Вставь webhook своего канала. Он хранится с шифрованием Windows.
        </p>
        <div className="subheading">
          <Field
            label={
              state.settings.hasWebhook
                ? "Новый webhook (текущий сохранён)"
                : "Webhook канала"
            }
          >
            <input
              type="password"
              autoComplete="off"
              value={webhook}
              placeholder="https://discord.com/api/webhooks/..."
              onChange={(event) => {
                setWebhook(event.target.value);
                setSaved(false);
              }}
            />
          </Field>
        </div>
        <div className="form-actions">
          <Action
            className="primary"
            disabled={!webhook}
            task={async () => {
              await runAction("settings", { webhook });
              setWebhook("");
              setSaved(true);
            }}
          >
            Сохранить
          </Action>
          <Action
            disabled={!state.settings.hasWebhook}
            task={async () => {
              await runAction("webhookTest");
              setSaved(true);
            }}
          >
            Отправить проверку
          </Action>
        </div>
        {saved && <p className="notice">Готово.</p>}

        <h2 className="subheading">О приложении</h2>
        <p className="about-copy">Мрачный парень.Любит паркур</p>
      </section>
    </div>
  );
}
export function Devices({ state, runAction }: Props) {
  const [name, setName] = useState("");
  const [entityId, setEntityId] = useState("");
  const [serverId, setServerId] = useState(
    state.connection.serverId || state.servers[0]?.id || "",
  );
  const [type, setType] = useState("1");
  const icons = { 1: Zap, 2: Bell, 3: Box };
  return (
    <div className="two-columns">
      <section className="panel content-panel">
        <h2>Устройства базы</h2>
        {state.devices.length ? (
          state.devices.map((device) => {
            const Icon = icons[device.type as keyof typeof icons] || Shield;
            const connected =
              state.connection.status === "connected" &&
              device.serverId === state.connection.serverId;
            return (
              <div className="device-item" key={device.id}>
                <div className="list-row">
                  <span className="tool-icon mint">
                    <Icon size={20} />
                  </span>
                  <div className="grow">
                    <strong>{device.name}</strong>
                    <p>
                      ID {device.entityId} ·{" "}
                      {connected
                        ? device.error ||
                          (device.payload
                            ? "Данные получены"
                            : "Ожидаем данные")
                        : "Сервер не подключён"}
                    </p>
                  </div>
                  {device.type === 1 && (
                    <Action
                      disabled={!connected}
                      task={() =>
                        runAction("toggleDevice", {
                          id: device.id,
                          value: !device.payload?.value,
                        })
                      }
                    >
                      {device.payload?.value ? "Выключить" : "Включить"}
                    </Action>
                  )}
                  <Action
                    className="icon-button"
                    task={() => runAction("removeDevice", device.id)}
                  >
                    <Trash2 size={14} />
                    <span className="sr-only">Удалить {device.name}</span>
                  </Action>
                </div>
                {device.type === 1 && connected && (
                  <DeviceAutomation
                    state={state}
                    runAction={runAction}
                    entityId={device.entityId}
                  />
                )}
                {device.type === 2 && (
                  <div className="notice">
                    {!connected
                      ? "Статус неизвестен"
                      : device.payload?.value
                        ? "Сигнализация сработала"
                        : device.payload
                          ? "Нет тревоги"
                          : "Ожидаем ответ"}
                  </div>
                )}
                {device.type === 3 && device.payload && (
                  <div className="storage-details">
                    <p>
                      Ячеек: {device.payload.items?.length || 0} /{" "}
                      {device.payload.capacity || "-"}
                    </p>
                    {device.payload.protectionExpiry && (
                      <p>
                        Содержание до{" "}
                        {new Date(
                          device.payload.protectionExpiry * 1000,
                        ).toLocaleString("ru-RU")}
                      </p>
                    )}
                    {device.payload.items?.map((item, index) => (
                      <div className="list-row" key={index}>
                        <span className="inline">
                          <ItemIcon item={item.itemId} />
                          {(itemNames as Record<string, { name: string }>)[
                            item.itemId
                          ]?.name || `#${item.itemId}`}
                        </span>
                        <strong>{item.quantity}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="empty">
            <Shield size={40} strokeWidth={1} />
            <p>Подключи переключатель, сигнализацию или монитор хранилища.</p>
          </div>
        )}
        <Action
          disabled={state.connection.status !== "connected"}
          task={() => runAction("refresh")}
        >
          <RefreshCw size={15} />
          Обновить
        </Action>
        <SwitchGroups state={state} runAction={runAction} />
      </section>
      <section className="panel content-panel">
        <h2>Добавить устройство</h2>
        <div className="form-grid">
          <Field label="Сервер">
            <PrettySelect
              label="Сервер"
              value={serverId}
              options={[
                { value: "", label: "Выбери сервер" },
                ...state.servers.map((server) => ({
                  value: server.id,
                  label: server.name,
                })),
              ]}
              onChange={setServerId}
            />
          </Field>
          <Field label="Тип">
            <PrettySelect
              label="Тип"
              value={type}
              options={[
                { value: "1", label: "Переключатель" },
                { value: "2", label: "Сигнализация" },
                { value: "3", label: "Хранилище" },
              ]}
              onChange={setType}
            />
          </Field>
          <Field label="Название">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label="ID устройства Rust+">
            <input
              value={entityId}
              onChange={(event) => setEntityId(event.target.value)}
              inputMode="numeric"
            />
          </Field>
        </div>
        <div className="form-actions">
          <Action
            className="primary"
            disabled={!serverId || !entityId}
            task={async () => {
              await runAction("addDevice", { name, entityId, type, serverId });
              setEntityId("");
              setName("");
            }}
          >
            <Plus size={15} />
            Добавить
          </Action>
        </div>
      </section>
    </div>
  );
}
