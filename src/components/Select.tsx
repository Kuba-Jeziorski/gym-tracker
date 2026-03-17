import SelectLib from "react-select";
import { cn } from "../lib/utils";

const selectStyles = {
  control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
    ...base,
    minHeight: 40,
    cursor: "pointer",
    backgroundColor: "var(--brand-bg)",
    borderColor: state.isFocused
      ? "var(--brand-primary)"
      : "var(--brand-border)",
    borderRadius: 8,
    boxShadow: "none",
    "&:hover": { borderColor: "var(--brand-primary)" },
  }),
  singleValue: (base: Record<string, unknown>) => ({
    ...base,
    color: "var(--brand-text)",
  }),
  input: (base: Record<string, unknown>) => ({
    ...base,
    color: "var(--brand-text)",
  }),
  placeholder: (base: Record<string, unknown>) => ({
    ...base,
    color: "var(--brand-text-muted)",
  }),
  menu: (base: Record<string, unknown>) => ({
    ...base,
    backgroundColor: "var(--brand-bg-soft)",
    border: "1px solid var(--brand-border)",
    borderRadius: 8,
    overflow: "hidden",
  }),
  option: (
    base: Record<string, unknown>,
    state: { isFocused: boolean; isSelected: boolean },
  ) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "rgba(66, 184, 131, 0.15)"
      : state.isFocused
        ? "var(--brand-bg)"
        : "transparent",
    color: state.isSelected ? "var(--brand-primary)" : "var(--brand-text)",
    cursor: "pointer",
  }),
};

type Option = { value: string; label: string };

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
};

export function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
}: SelectProps) {
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <div className={cn("min-w-[14rem]", className)}>
      <SelectLib<Option>
        value={selected}
        onChange={(o) => onChange(o?.value ?? "")}
        options={options}
        placeholder={placeholder}
        isClearable
        styles={selectStyles}
        classNamePrefix="gym-select"
      />
    </div>
  );
}
