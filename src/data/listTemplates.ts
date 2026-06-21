// Public-list layout templates. Each fills a box with the same footprint as a
// feed video (aspect-[4/5]). The grid className is applied to a `grid` + the
// container is forced to aspect-[4/5] so every template occupies equal space.

export type TemplateId = 1 | 2 | 3 | 4 | 6 | 8;

export const TEMPLATE_IDS: TemplateId[] = [1, 2, 3, 4, 6, 8];

export const TEMPLATE_LAYOUT: Record<
  TemplateId,
  { tiles: number; grid: string; label: string }
> = {
  1: { tiles: 1, grid: "grid-cols-1 grid-rows-1", label: "1 tile" },
  2: { tiles: 2, grid: "grid-cols-1 grid-rows-2", label: "2 stacked" },
  3: { tiles: 3, grid: "grid-cols-1 grid-rows-3", label: "3 rows" },
  4: { tiles: 4, grid: "grid-cols-2 grid-rows-2", label: "2 × 2" },
  6: { tiles: 6, grid: "grid-cols-2 grid-rows-3", label: "2 × 3" },
  8: { tiles: 8, grid: "grid-cols-2 grid-rows-4", label: "2 × 4" },
};

export const DEFAULT_TEMPLATE: TemplateId = 4;

export function tileCount(template: TemplateId): number {
  return TEMPLATE_LAYOUT[template].tiles;
}
