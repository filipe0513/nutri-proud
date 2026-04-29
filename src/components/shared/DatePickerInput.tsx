'use client';

import { useRef } from 'react';
import { CalendarDays } from 'lucide-react';

interface DatePickerInputProps {
  value: string; // ISO String or YYYY-MM-DDTHH:mm
  onChange: (date: string) => void;
  accentColor?: string;
  borderColor?: string;
}

export function DatePickerInput({
  value,
  onChange,
  accentColor = 'text-neutral-700',
  borderColor = 'border-neutral-200',
}: DatePickerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get current local time in YYYY-MM-DDTHH:mm format for 'max' attribute
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);

  const formatLabel = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Selecione data';
      
      const isToday = date.toDateString() === new Date().toDateString();
      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      if (isToday) return `Hoje, ${timeStr}`;
      
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return 'Data inválida';
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.showPicker()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.showPicker()}
      className={`relative flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/50 border ${borderColor} w-fit cursor-pointer select-none transition-all hover:bg-white/80 active:scale-95 shadow-sm`}
    >
      <CalendarDays size={16} className={accentColor} />
      <span className={`text-caption-1 font-bold ${accentColor}`}>{formatLabel(value)}</span>

      {/* Native datetime-local input */}
      <input
        ref={inputRef}
        type="datetime-local"
        max={localISOTime}
        value={value.length > 16 ? value.slice(0, 16) : value}
        onChange={(e) => {
          if (e.target.value) {
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
