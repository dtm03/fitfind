import type { Category, CategoryGroup, MeasurementKey } from '../types';

const TOP_KEYS: MeasurementKey[] = ['chest', 'shoulder', 'length', 'sleeve'];
const BOTTOM_KEYS: MeasurementKey[] = ['waist', 'hip', 'inseam', 'rise', 'thigh', 'legOpening'];

export const CATEGORIES: Record<Category, { label: string; group: CategoryGroup; keys: MeasurementKey[] }> = {
  tshirt: { label: 't-shirts', group: 'top', keys: TOP_KEYS },
  shirt: { label: 'hemden', group: 'top', keys: TOP_KEYS },
  hoodie: { label: 'hoodies', group: 'top', keys: TOP_KEYS },
  jacket: { label: 'jacken', group: 'top', keys: TOP_KEYS },
  jeans: { label: 'jeans', group: 'bottom', keys: BOTTOM_KEYS },
  pants: { label: 'hosen', group: 'bottom', keys: BOTTOM_KEYS },
  shorts: { label: 'shorts', group: 'bottom', keys: ['waist', 'inseam', 'thigh', 'legOpening'] },
};

export const CATEGORY_ORDER = Object.keys(CATEGORIES) as Category[];

export function isCategory(value: string | null): value is Category {
  return value != null && value in CATEGORIES;
}

export const MEASUREMENTS: Record<MeasurementKey, { label: string; short: string; hint: string }> = {
  chest: { label: 'brustbreite', short: 'brust', hint: 'achsel zu achsel, flach gemessen' },
  shoulder: { label: 'schulterbreite', short: 'schulter', hint: 'schulternaht zu schulternaht' },
  length: { label: 'länge', short: 'länge', hint: 'höchster schulterpunkt bis saum' },
  sleeve: { label: 'ärmellänge', short: 'ärmel', hint: 'schulternaht bis ärmelende' },
  waist: { label: 'bundweite', short: 'bund', hint: 'bund flach, kante zu kante' },
  hip: { label: 'hüftbreite', short: 'hüfte', hint: 'flach, breiteste stelle am gesäß' },
  inseam: { label: 'innenbeinlänge', short: 'innenbein', hint: 'schritt bis saum' },
  rise: { label: 'leibhöhe', short: 'leibhöhe', hint: 'schritt bis oberkante bund, vorne' },
  thigh: { label: 'oberschenkelbreite', short: 'oberschenkel', hint: 'flach, 2,5 cm unter dem schritt' },
  legOpening: { label: 'saumweite', short: 'saum', hint: 'beinöffnung flach' },
};

export const SIZES: Record<CategoryGroup, string[]> = {
  top: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  bottom: ['28', '30', '32', '34', '36'],
};
