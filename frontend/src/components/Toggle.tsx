interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <label
      className={`inline-flex items-center gap-2 ${disabled ? "opacity-50" : "cursor-pointer"}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-med ease-out focus:outline-none ${
          checked ? "bg-primary" : "bg-border"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-on-dark shadow transition-transform duration-med ease-out ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      {label && <span className="text-small text-foreground">{label}</span>}
    </label>
  );
}
