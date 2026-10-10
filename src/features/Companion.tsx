import { useState } from "react";
import { Command, Play, Send, Terminal } from "lucide-react";
import type { AppState } from "../../shared/contracts";

import { Result, ToolInput, type Reply } from "./CompanionControls";
import PrettySelect from "../components/PrettySelect";
import { Action } from "./ConnectionViews";

type Props = {
  state: AppState;
  runAction: (action: string, payload?: unknown) => Promise<any>;
};
const toolLabels: Record<string, string> = {
  alarm: "Сигнализации",
  alias: "Псевдонимы команд",
  blacklist: "Чёрный список",
  cctv: "Камеры CCTV",
  craft: "Крафт",
  decay: "Гниение",
  despawn: "Исчезновение предметов",
  item: "Предметы",
  leader: "Лидер команды",
  recycle: "Переработка",
  research: "Изучение",
  stack: "Размер стака",
  storagemonitor: "Хранилища",
  switch: "Переключатели",
  upkeep: "Содержание базы",
  uptime: "Время работы",
};
const actionLabels: Record<string, string> = {
  add: "Добавить",
  remove: "Удалить",
  show: "Показать",
  edit: "Изменить",
  search: "Найти",
  subscribe: "Подписаться",
  unsubscribe: "Отписаться",
  list: "Список",
  all: "Все",
  static: "Обычные",
  dynamic: "Динамические",
  bot: "Приложение",
  server: "Сервер",
};
const localTools = new Set(Object.keys(toolLabels));
export default function Companion({ state, runAction }: Props) {
  const [tab, setTab] = useState("commands");
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<
    Array<{ command: string; messages: string[] }>
  >([]);
  const [filter, setFilter] = useState("");
  const [toolName, setToolName] = useState("craft");
  const [subcommand, setSubcommand] = useState("");
  const [values, setValues] = useState<Record<string, any>>({});
  const [reply, setReply] = useState<Reply | null>(null);
  const companion = state.companion;
  if (!companion) return <div className="empty">Загружаем помощника...</div>;
  const tool = companion.tools.find((tool) => tool.name === toolName);
  const branches = (tool?.options || []).filter((option) => option.type === 1);
  const branch =
    branches.find((option) => option.name === subcommand) || branches[0];
  const fields = branch?.options || tool?.options || [];
  const commands = companion.commands.filter((item) =>
    item.name.toLowerCase().includes(filter.toLowerCase()),
  );
  const connected = state.connection.status === "connected";
  async function send() {
    if (!command.trim()) return;
    const entered = command;
    const messages = await runAction("command", entered);
    setHistory((previous) =>
      [...previous, { command: entered, messages }].slice(-20),
    );
    setCommand("");
  }
  return (
    <div className="companion-workspace">
      <div className="companion-tabs" role="tablist" aria-label="Помощник">
        {[
          ["commands", "Команды", Terminal],
          ["tools", "Инструменты", Command],
        ].map(([id, label, Icon]) => (
          <button
            key={String(id)}
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(String(id))}
          >
            {typeof Icon !== "string" && <Icon size={16} />}
            <span>{String(label)}</span>
          </button>
        ))}
      </div>
      {tab === "commands" && (
        <div className="companion-command-layout">
          <section className="companion-console">
            <div className="companion-console-heading">
              <h2>Команды сервера</h2>
              <span
                className={`connection-status ${connected ? "connected" : "disconnected"}`}
              >
                <span />
                {connected ? "Подключено" : "Не подключено"}
              </span>
            </div>
            <div className="companion-history" aria-live="polite">
              {history.length ? (
                history.map((entry, index) => (
                  <div key={index}>
                    <code>{entry.command}</code>
                    {entry.messages.map((message, index) => (
                      <p key={index}>{message}</p>
                    ))}
                  </div>
                ))
              ) : (
                <div className="empty">
                  <Terminal size={30} />
                  <h3>Выбери команду справа</h3>
                </div>
              )}
            </div>
            <form
              className="companion-prompt"
              onSubmit={(event) => {
                event.preventDefault();
                void send().catch(() => {});
              }}
            >
              <span>!</span>
              <input
                aria-label="Команда помощника"
                placeholder="pop, time, craft..."
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                maxLength={500}
              />
              <Action
                className="primary icon-button"
                label="Выполнить команду"
                disabled={!connected || !command.trim()}
                task={send}
              >
                <Send size={17} />
              </Action>
            </form>
          </section>
          <aside className="companion-command-list">
            <input
              aria-label="Найти команду"
              placeholder="Найти команду"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
            <div>
              {commands.map((item) => (
                <button
                  key={item.name}
                  title={item.description}
                  onClick={() => setCommand(item.example || item.name)}
                >
                  <code>!{item.name}</code>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
      {tab === "tools" && (
        <div className="companion-tools-layout">
          <section>
            <div className="form-grid">
              <label className="form-field">
                <span>Инструмент</span>
                <PrettySelect
                  label="Инструмент"
                  value={toolName}
                  options={companion.tools
                    .filter((tool) => localTools.has(tool.name))
                    .map((tool) => ({
                      value: tool.name,
                      label: toolLabels[tool.name],
                    }))}
                  onChange={(name) => {
                    setToolName(name);
                    setSubcommand("");
                    setValues({});
                    setReply(null);
                  }}
                />
              </label>
              {branches.length > 0 && (
                <label className="form-field">
                  <span>Действие</span>
                  <PrettySelect
                    label="Действие"
                    value={branch?.name || ""}
                    options={branches.map((branch) => ({
                      value: branch.name,
                      label: actionLabels[branch.name] || branch.description,
                    }))}
                    onChange={(name) => {
                      setSubcommand(name);
                      setValues({});
                      setReply(null);
                    }}
                  />
                </label>
              )}
              {fields
                .filter((option) => option.type > 2)
                .map((option) => (
                  <ToolInput
                    key={toolName + option.name}
                    option={option}
                    value={values[option.name]}
                    onChange={(value) =>
                      setValues({ ...values, [option.name]: value })
                    }
                  />
                ))}
            </div>
            <div className="form-actions">
              <Action
                className="primary"
                task={async () =>
                  setReply(
                    await runAction("companionTool", {
                      name: toolName,
                      subcommand: branch?.name,
                      values,
                    }),
                  )
                }
              >
                <Play size={15} />
                Выполнить
              </Action>
            </div>
          </section>
          <Result reply={reply} />
        </div>
      )}
    </div>
  );
}
