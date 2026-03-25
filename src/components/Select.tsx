import SelectLib from "react-select";
import { cn } from "../lib/utils";

export const selectStyles = {
  control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
    ...base,
    height: 42,
    minHeight: 42,
    padding: "0 10px",
    cursor: "pointer",
    backgroundColor: "var(--brand-bg)",
    borderColor: state.isFocused
      ? "var(--brand-primary)"
      : "var(--brand-border)",
    borderRadius: 8,
    boxShadow: "none",
    "&:hover": { borderColor: "var(--brand-primary)" },
  }),
  valueContainer: (base: Record<string, unknown>) => ({
    ...base,
    padding: 0,
    maxHeight: 42,
    overflowY: "auto" as const,
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
    overflow: "hidden" as const,
    padding: 0,
  }),
  menuList: (base: Record<string, unknown>) => ({
    ...base,
    padding: 0,
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

export const selectStylesMulti = {
  ...selectStyles,
  control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
    ...selectStyles.control(base, state),
    minHeight: 42,
    height: "auto",
  }),
  valueContainer: (base: Record<string, unknown>) => ({
    ...base,
    padding: "4px 8px",
    flexWrap: "wrap" as const,
    maxHeight: "none",
    gap: 4,
  }),
  multiValue: (base: Record<string, unknown>) => ({
    ...base,
    backgroundColor: "var(--brand-code-bg)",
  }),
  multiValueLabel: (base: Record<string, unknown>) => ({
    ...base,
    color: "var(--brand-text)",
  }),
  multiValueRemove: (base: Record<string, unknown>) => ({
    ...base,
    color: "var(--brand-text-muted)",
    ":hover": {
      backgroundColor: "var(--brand-border)",
      color: "var(--brand-text)",
    },
  }),
  menuPortal: (base: Record<string, unknown>) => ({
    ...base,
    zIndex: 9999,
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
    <div className={cn("min-w-[18rem]", className)}>
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
