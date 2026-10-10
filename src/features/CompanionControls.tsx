import type { CompanionOption } from "../../shared/contracts";
import PrettySelect from "../components/PrettySelect";
export type Reply = {
  text: string;
  embeds: Array<{
    title: string;
    description: string;
    fields: Array<{ name: string; value: string; inline?: boolean }>;
  }>;
};
const fieldLabels: Record<string, string> = {
  name: "Название",
  id: "ID",
  quantity: "Количество",
  item_name: "Название предмета",
  item_id: "ID предмета",
  alias: "Псевдоним",
  value: "Значение",
  index: "Номер",
  image: "Иконка",
  time: "Время",
  steam_id: "Steam ID",
  hp: "Прочность",
  grade: "Материал",
};

function clean(text: string) {
  return text
    .replace(/```(?:diff|[a-z]*)\n?/g, "")
    .replace(/```/g, "")
    .replace(/\*\*|__/g, "")
    .replace(/<@!?([0-9]+)>/g, "$1")
    .replace(/[\u2013\u2014]/g, ", ");
}
export function Result({ reply }: { reply: Reply | null }) {
  if (!reply) return null;
  return (
    <div className="companion-result" aria-live="polite">
      {reply.text && <p>{clean(reply.text)}</p>}
      {reply.embeds.map((embed, index) => (
        <section key={index}>
          {embed.title && <h3>{clean(embed.title)}</h3>}
          {embed.description && <p>{clean(embed.description)}</p>}
          <div className="companion-result-fields">
            {embed.fields.map((field, index) => (
              <div key={index} className={field.inline ? "inline-field" : ""}>
                <span>{clean(field.name)}</span>
                <p>{clean(field.value)}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
export function ToolInput({
  option,
  value,
  onChange,
}: {
  option: CompanionOption;
  value: any;
  onChange: (value: any) => void;
}) {
  const label = fieldLabels[option.name] || option.name.replaceAll("_", " ");
  return (
    <label className="form-field">
      <span>
        {label}
        {option.required ? " *" : ""}
      </span>
      {option.choices ? (
        <PrettySelect
          label={label}
          value={String(value ?? "")}
          options={[
            { value: "", label: "Выбери значение" },
            ...option.choices.map((choice) => ({
              value: String(choice.value),
              label: choice.name,
            })),
          ]}
          onChange={(value) =>
            onChange(
              option.type === 4 || option.type === 10 ? Number(value) : value,
            )
          }
        />
      ) : option.type === 5 ? (
        <PrettySelect
          label={label}
          value={String(value ?? "")}
          options={[
            { value: "", label: "По умолчанию" },
            { value: "true", label: "Да" },
            { value: "false", label: "Нет" },
          ]}
          onChange={(value) =>
            onChange(value === "" ? undefined : value === "true")
          }
        />
      ) : (
        <input
          title={option.description}
          value={value ?? ""}
          type={option.type === 4 || option.type === 10 ? "number" : "text"}
          maxLength={300}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}
