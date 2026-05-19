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
