import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "title-1",
            "title-2",
            "title-3",
            "body-1",
            "body-2",
            "caption-1",
            "caption-2",
            "button-1",
            "input-1",
          ],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs))
}

export function toLocalISOString(date: Date): string {
  const tzOffset = -date.getTimezoneOffset();
  const diff = tzOffset >= 0 ? '+' : '-';
  const pad = (num: number) => String(num).padStart(2, '0');
  
  return date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes()) +
    ':' + pad(date.getSeconds()) +
    '.' + String((date.getMilliseconds() / 1000).toFixed(3).slice(2, 5)) +
    diff + pad(Math.floor(Math.abs(tzOffset) / 60)) +
    ':' + pad(Math.abs(tzOffset) % 60);
}

