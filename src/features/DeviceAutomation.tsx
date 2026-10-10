import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { AppState } from "../../shared/contracts";
import PrettySelect from "../components/PrettySelect";
import { Action } from "./ConnectionViews";

type Props = {
  state: AppState;
  runAction: (action: string, payload?: unknown) => Promise<any>;
};
export function DeviceAutomation({
  state,
  runAction,
  entityId,
}: Props & { entityId: number }) {
  const settings = state.companion?.server?.switches[String(entityId)];
  const [command, setCommand] = useState("");
  if (!settings) return null;
  return (
    <details className="device-automation">
      <summary>Команда и автоматизация</summary>
      <div className="form-grid">
        <label className="form-field">
          <span>Команда чата</span>
          <input
            aria-label={`Команда ${entityId}`}
            placeholder={settings.command}
            value={command}
            maxLength={32}
            onChange={(event) => setCommand(event.target.value)}
          />
        </label>
        <label className="form-field">
          <span>Режим</span>
          <PrettySelect
            label={`Режим ${entityId}`}
            value={String(settings.autoDayNightOnOff || 0)}
            options={[
              { value: "0", label: "Вручную" },
              { value: "1", label: "Включать днём" },
              { value: "2", label: "Включать ночью" },
              { value: "3", label: "Всегда включён" },
              { value: "4", label: "Всегда выключен" },
              { value: "7", label: "Включать, когда команда в сети" },
              { value: "8", label: "Включать, когда никого нет" },
            ]}
            onChange={(mode) =>
              void runAction("deviceAutomation", { entityId, mode }).catch(
                () => {},
              )
            }
          />
        </label>
      </div>
      <Action
        disabled={!command.trim()}
        task={async () => {
          await runAction("deviceAutomation", { entityId, command });
          setCommand("");
        }}
      >
        Сохранить команду
      </Action>
      <code>!{settings.command} on / off / status</code>
    </details>
  );
}
export function SwitchGroups({ state, runAction }: Props) {
  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const switches = state.companion?.server?.switches;
  const groups = state.companion?.server?.switchGroups;
  if (!switches || !groups || !Object.keys(switches).length) return null;
  return (
    <section className="switch-groups">
      <h2>Группы переключателей</h2>
      {Object.entries(groups).map(([id, group]) => (
        <div className="list-row" key={id}>
          <div className="grow">
            <strong>{group.name}</strong>
            <p>
              !{group.command} · {group.switches.length}
            </p>
          </div>
          <Action
            task={() => runAction("toggleSwitchGroup", { id, value: true })}
          >
            Включить
          </Action>
          <Action
            task={() => runAction("toggleSwitchGroup", { id, value: false })}
          >
            Выключить
          </Action>
          <Action
            className="icon-button"
            label="Удалить группу"
            task={() => runAction("deleteSwitchGroup", id)}
          >
            <Trash2 size={15} />
          </Action>
        </div>
      ))}
      <details>
        <summary>Создать группу</summary>
        <div className="form-grid">
          <label className="form-field">
            <span>Название группы</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
            />
          </label>
          <label className="form-field">
            <span>Команда группы</span>
            <input
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              maxLength={32}
              placeholder="lights"
            />
          </label>
        </div>
        <div className="switch-group-members">
          {Object.entries(switches).map(([id, device]) => (
            <label key={id}>
              <input
                type="checkbox"
                checked={selected.includes(id)}
                onChange={(event) =>
                  setSelected(
                    event.target.checked
                      ? [...selected, id]
                      : selected.filter((value) => value !== id),
                  )
                }
              />
              <span>{device.name}</span>
            </label>
          ))}
        </div>
        <Action
          className="primary"
          disabled={!name.trim() || !command.trim() || !selected.length}
          task={async () => {
            await runAction("saveSwitchGroup", {
              name,
              command,
              switches: selected,
            });
            setName("");
            setCommand("");
            setSelected([]);
          }}
        >
          <Plus size={15} />
          Создать группу
        </Action>
      </details>
    </section>
  );
}
