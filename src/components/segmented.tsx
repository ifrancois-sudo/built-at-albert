"use client";

/**
 * Two or three mutually exclusive choices, shown side by side.
 *
 * A native select for two options hides one of them behind a click and hands
 * the styling to the operating system, which is why the language switcher used
 * to look like a stray macOS control on a page made of printed rules.
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = "md",
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "min-h-[38px] px-3 text-[0.8125rem]" : "min-h-[44px] px-4 text-sm";

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex overflow-hidden rounded-[5px] border-2 border-ink"
    >
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`font-mono font-semibold tracking-[0.08em] uppercase transition-colors ${pad} ${
              index > 0 ? "border-l-2 border-ink" : ""
            } ${active ? "bg-ink text-paper" : "bg-transparent text-ink-soft hover:bg-paper-sunk"}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
