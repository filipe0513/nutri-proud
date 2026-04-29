'use client';

import { useRef } from 'react';
import { CalendarDays } from 'lucide-react';

interface DatePickerInputProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  accentColor?: string; // Tailwind text color class, e.g. 'text-blue-700'
  borderColor?: string; // Tailwind border color class, e.g. 'border-blue-200'
}

/**
 * A discrete date picker displayed at the top of Bottom Sheets.
 * Clicking the chip opens the native date picker.
 * Defaults to today and blocks future dates.
 */
export function DatePickerInput({
  value,
  onChange,
  accentColor = 'text-neutral-700',
  borderColor = 'border-neutral-200',
}: DatePickerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().split('T')[0];

  const formatLabel = (dateStr: string): string => {
    if (dateStr === today) return 'Hoje';
    const date = new Date(`${dateStr}T12:00:00`);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.showPicker()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.showPicker()}
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/50 border ${borderColor} w-fit cursor-pointer select-none transition-colors hover:bg-white/80 active:scale-95`}
      aria-label={`Data do registro: ${formatLabel(value)}. Clique para alterar.`}
    >
      <CalendarDays size={14} className={accentColor} />
      <span className={`text-caption-1 font-semibold ${accentColor}`}>{formatLabel(value)}</span>

      {/* Hidden native date input */}
      <input
        ref={inputRef}
        type="date"
        max={today}
        value={value}
        onChange={(e) => {
          // Guard: reject future dates
          if (e.target.value && e.target.value <= today) {
            onChange(e.target.value);
          }
        }}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
