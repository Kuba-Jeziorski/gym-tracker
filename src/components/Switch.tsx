import { cn } from "../lib/utils";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  className,
}: SwitchProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 cursor-pointer select-none",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg",
          checked ? "bg-brand-primary" : "bg-brand-border",
          !disabled && "hover:opacity-90",
        )}
        style={{
          ["--tw-ring-color" as string]: "var(--brand-primary)",
        }}
      >
        <span
          className={cn(
            "pointer-events-none absolute top-[1px] h-[18px] w-[18px] rounded-full bg-brand-dark shadow-sm transition-transform duration-200 left-[1px]",
            checked && "translate-x-[20px]",
          )}
        />
      </button>
      {label && <span className="text-sm text-brand-text">{label}</span>}
    </label>
  );
}
