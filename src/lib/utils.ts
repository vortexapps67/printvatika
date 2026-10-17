import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The named type scale from tailwind.config.js.
 *
 * tailwind-merge cannot tell a house font size from a house colour: `text-title`
 * and `text-ink-500` both look like `text-<something it has never heard of>`, so
 * it files them in the same conflict group and the later one silently deletes
 * the earlier. That is how `cn('text-white', 'text-body-s')` lost its white and
 * solid buttons ended up with dark labels on a saturated fill.
 *
 * Declaring the sizes here puts them back in the `font-size` group, so a size
 * and a colour now coexist the way they always read in the markup.
 */
const FONT_SIZES = [
  'micro',
  'label',
  'body-s',
  'body',
  'body-l',
  'lead',
  'lead-l',
  'title',
  'title-l',
  'display-s',
  'display',
  'display-l',
  'display-xl',
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: FONT_SIZES }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
