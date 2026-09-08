"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * A listbox that looks like the rest of the page.
 *
 * The native control cannot be styled below the button on any desktop browser,
 * so a filter row made of printed rules ended up with an operating-system menu
 * dropped into the middle of it. This keeps the keyboard behaviour a native
 * select gives you: arrows move, Enter picks, Escape closes, Tab leaves.
 */
export function Select({
  value,
  options,
  onChange,
  label,
  placeholder,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();

  const all: SelectOption[] = [{ value: "", label: placeholder }, ...options];
  const selected = all.find((option) => option.value === value) ?? all[0];

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function commit(index: number) {
    const option = all[index];
    if (option) onChange(option.value);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (!open && (event.key === "Enter" || event.key === " " || event.key === "ArrowDown")) {
      event.preventDefault();
      setActive(Math.max(0, all.findIndex((option) => option.value === value)));
      setOpen(true);
      return;
    }

    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(all.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commit(active);
    }
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onKeyDown}
        className="inline-flex min-h-[44px] items-center gap-2.5 rounded-[5px] border-2 border-ink bg-transparent px-3.5 font-mono text-[0.8125rem] tracking-[0.06em] text-ink transition-colors hover:bg-paper-sunk"
      >
        <span className="max-w-[16ch] truncate">{selected.label}</span>
        <span aria-hidden className={`text-accent transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="surface absolute left-0 top-[calc(100%+6px)] z-50 max-h-72 min-w-full overflow-auto py-1 shadow-[4px_4px_0_var(--color-ink)]"
        >
          {all.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value || "__all"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => commit(index)}
                  className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left font-mono text-[0.8125rem] tracking-[0.04em] whitespace-nowrap ${
                    index === active ? "bg-ink text-paper" : "text-ink-soft"
                  }`}
                >
                  <span aria-hidden className={isSelected ? "" : "opacity-0"}>
                    ✓
                  </span>
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
