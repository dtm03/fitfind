import type { Category, CategoryGroup, MeasurementKey } from '../types';

const TOP_KEYS: MeasurementKey[] = ['chest', 'shoulder', 'length', 'sleeve'];
const BOTTOM_KEYS: MeasurementKey[] = ['waist', 'hip', 'inseam', 'rise', 'thigh', 'legOpening'];

export const CATEGORIES: Record<Category, { label: string; group: CategoryGroup; keys: MeasurementKey[] }> = {
  tshirt: { label: 't-shirts', group: 'top', keys: TOP_KEYS },
  shirt: { label: 'shirts', group: 'top', keys: TOP_KEYS },
  hoodie: { label: 'hoodies', group: 'top', keys: TOP_KEYS },
  jacket: { label: 'jackets', group: 'top', keys: TOP_KEYS },
  jeans: { label: 'jeans', group: 'bottom', keys: BOTTOM_KEYS },
  pants: { label: 'pants', group: 'bottom', keys: BOTTOM_KEYS },
  shorts: { label: 'shorts', group: 'bottom', keys: ['waist', 'inseam', 'thigh', 'legOpening'] },
};

export const CATEGORY_ORDER = Object.keys(CATEGORIES) as Category[];

export function isCategory(value: string | null): value is Category {
  return value != null && value in CATEGORIES;
}

export const MEASUREMENTS: Record<MeasurementKey, { label: string; short: string; hint: string }> = {
  chest: { label: 'chest width', short: 'chest', hint: 'pit to pit, garment laid flat' },
  shoulder: { label: 'shoulder width', short: 'shoulder', hint: 'seam to seam across back' },
  length: { label: 'length', short: 'length', hint: 'highest shoulder point to hem' },
  sleeve: { label: 'sleeve length', short: 'sleeve', hint: 'shoulder seam to cuff' },
  waist: { label: 'waist width', short: 'waist', hint: 'flat waist edge to edge' },
  hip: { label: 'hip width', short: 'hip', hint: 'flat at widest point' },
  inseam: { label: 'inseam', short: 'inseam', hint: 'crotch to hem' },
  rise: { label: 'rise', short: 'rise', hint: 'crotch to top of waistband, front' },
  thigh: { label: 'thigh width', short: 'thigh', hint: 'flat, ~2.5 cm below crotch' },
  legOpening: { label: 'leg opening', short: 'hem', hint: 'flat leg opening' },
};

export const SIZES: Record<CategoryGroup, string[]> = {
  top: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  bottom: ['28', '30', '32', '34', '36'],
};