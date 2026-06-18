import { useEffect, useRef, useState } from "react";
import { inputClass } from "./styles";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disablePast?: boolean;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(value: string): string {
  const date = parseDate(value);
  if (!date) return "";
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isPastDate(date: Date): boolean {
  return startOfDay(date) < startOfDay(new Date());
}

function buildCalendarDays(year: number, month: number): { date: Date; inMonth: boolean }[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const start = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return { date, inMonth: date.getMonth() === month };
  });
}

function NavButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
    >
      {children}
    </button>
  );
}

export function DatePicker({ value, onChange, placeholder = "Select date", disablePast }: DatePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => parseDate(value)?.getFullYear() ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parseDate(value)?.getMonth() ?? new Date().getMonth());

  const selected = parseDate(value);
  const today = new Date();
  const days = buildCalendarDays(viewYear, viewMonth);

  useEffect(() => {
    if (value) {
      const d = parseDate(value);
      if (d) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (open && containerRef.current) {
      containerRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [open]);

  const goMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const goYear = (delta: number) => {
    setViewYear((y) => y + delta);
  };

  const selectDate = (date: Date) => {
    if (disablePast && isPastDate(date)) return;
    onChange(toIso(date));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${inputClass} w-full text-left flex items-center justify-between gap-2`}
      >
        <span className={value ? "text-white" : "text-gray-500"}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <svg className="h-4 w-4 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {open && (
        <div className="mt-2 w-full rounded-xl border border-gray-700 bg-[#222226] shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-700/80 px-4 py-3">
            <span className="text-sm font-semibold text-white">Dates</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-3 py-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                <NavButton onClick={() => goYear(-1)}>&laquo;</NavButton>
                <NavButton onClick={() => goMonth(-1)}>&lsaquo;</NavButton>
              </div>
              <span className="text-sm font-semibold text-white capitalize">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <div className="flex items-center gap-0.5">
                <NavButton onClick={() => goMonth(1)}>&rsaquo;</NavButton>
                <NavButton onClick={() => goYear(1)}>&raquo;</NavButton>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-1 text-center text-xs font-semibold text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {days.map(({ date, inMonth }) => {
                const isSelected = selected ? isSameDay(date, selected) : false;
                const isToday = isSameDay(date, today);
                const isDisabled = disablePast && isPastDate(date);

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => selectDate(date)}
                    disabled={isDisabled}
                    className={[
                      "h-9 w-full rounded-md text-sm transition-colors",
                      isDisabled
                        ? "cursor-not-allowed text-gray-700"
                        : isSelected
                          ? "bg-[#1e3a5f] font-semibold text-white"
                          : inMonth
                            ? "text-white hover:bg-gray-800"
                            : "text-gray-600 hover:bg-gray-800/50",
                      !isSelected && isToday && !isDisabled ? "ring-1 ring-gray-600" : "",
                    ].join(" ")}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="mt-3 w-full rounded-lg py-1.5 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Clear date
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
