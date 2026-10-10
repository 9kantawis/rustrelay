import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import ItemIcon from "./ItemIcon";

export type SelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
  icon?: string;
};

type Props = {
  label: string;
  value: string | number;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function PrettySelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === String(value)),
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options[selectedIndex] || options[0];

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  useEffect(() => setActiveIndex(selectedIndex), [selectedIndex]);

  const enabledIndexes = useMemo(
    () =>
      options
        .map((option, index) => (option.disabled ? -1 : index))
        .filter((index) => index >= 0),
    [options],
  );

  function move(step: number) {
    if (!enabledIndexes.length) return;
    const position = enabledIndexes.indexOf(activeIndex);
    const next =
      position < 0
        ? enabledIndexes[0]
        : enabledIndexes[
            (position + step + enabledIndexes.length) % enabledIndexes.length
          ];
    setActiveIndex(next);
  }

  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange(option.value);
    setOpen(false);
  }

  return (
    <div className={"pretty-select" + (open ? " open" : "")} ref={root}>
      <button
        type="button"
        className="pretty-select-trigger"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            return;
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) setOpen(true);
            move(event.key === "ArrowDown" ? 1 : -1);
            return;
          }
          if ((event.key === "Enter" || event.key === " ") && open) {
            event.preventDefault();
            choose(activeIndex);
          }
        }}
      >
        <span className="select-item-label">
          {selected?.icon && <ItemIcon item={selected.icon} size={24} />}
          {selected?.label}
        </span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div className="pretty-select-menu" role="listbox" id={listId}>
          {options.map((option, index) => (
            <button
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              className={index === activeIndex ? "active" : ""}
              disabled={option.disabled}
              key={option.value}
              onPointerEnter={() => setActiveIndex(index)}
              onClick={() => choose(index)}
            >
              <span className="select-item-label">
                {option.icon && <ItemIcon item={option.icon} size={24} />}
                {option.label}
              </span>
              {index === selectedIndex && (
                <Check size={14} aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
