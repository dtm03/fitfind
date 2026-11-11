import { CATEGORIES } from '../data/categories';
import type { Category, MeasurementKey, Product, Profile, SizeVariant } from '../types';
import { bestFit, type FitResult } from './fit';

export type SortKey = 'fit' | 'price-asc' | 'price-desc' | 'name';

export interface Range {
  min?: number;
  max?: number;
}

export interface Filters {
  q: string;
  categories: Category[];
  sizes: string[];
  brands: string[];
  priceMin?: number;
  priceMax?: number;
  inStockOnly: boolean;
  fitOnly: boolean;
  ranges: Partial<Record<MeasurementKey, Range>>;
  sort: SortKey;
}

export const DEFAULT_FILTERS: Filters = {
  q: '',
  categories: [],
  sizes: [],
  brands: [],
  inStockOnly: true,
  fitOnly: false,
  ranges: {},
  sort: 'fit',
};

export const FIT_ONLY_MIN_SCORE = 70;

export interface Result {
  product: Product;
  fit: FitResult | null;
  matchedSizes: string[];
}

function activeRanges(filters: Filters): [MeasurementKey, Range][] {
  return (Object.entries(filters.ranges) as [MeasurementKey, Range][]).filter(
    ([, r]) => r.min != null || r.max != null,
  );
}

function variantMatches(variant: SizeVariant, ranges: [MeasurementKey, Range][]): boolean {
  return ranges.every(([key, { min, max }]) => {
    const value = variant.measurements[key];
    if (value == null) return false;
    return (min == null || value >= min) && (max == null || value <= max);
  });
}

export function applyFilters(products: Product[], filters: Filters, profile: Profile): Result[] {
  const q = filters.q.trim().toLowerCase();
  const ranges = activeRanges(filters);
  const results: Result[] = [];

  for (const product of products) {
    if (filters.categories.length && !filters.categories.includes(product.category)) continue;
    if (filters.brands.length && !filters.brands.includes(product.brand)) continue;
    if (filters.priceMin != null && product.price < filters.priceMin) continue;
    if (filters.priceMax != null && product.price > filters.priceMax) continue;
    if (q) {
      const haystack = `${product.name} ${product.brand} ${product.color} ${product.material} ${CATEGORIES[product.category].label}`.toLowerCase();
      if (!haystack.includes(q)) continue;
    }

    // A measurement filter on a key the category doesn't have excludes the product.
    const keys = CATEGORIES[product.category].keys;
    if (ranges.some(([key]) => !keys.includes(key))) continue;

    const variants = product.variants.filter(
      (v) =>
        (!filters.inStockOnly || v.inStock) &&
        (!filters.sizes.length || filters.sizes.includes(v.size)) &&
        variantMatches(v, ranges),
    );
    if (!variants.length) continue;

    const fit = bestFit(product, profile, variants);
    if (filters.fitOnly && (!fit || fit.score < FIT_ONLY_MIN_SCORE)) continue;

    results.push({ product, fit, matchedSizes: variants.map((v) => v.size) });
  }

  return sortResults(results, filters.sort);
}

function sortResults(results: Result[], sort: SortKey): Result[] {
  const byName = (a: Result, b: Result) => a.product.name.localeCompare(b.product.name);
  const sorted = [...results];
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.product.price - b.product.price || byName(a, b));
    case 'price-desc':
      return sorted.sort((a, b) => b.product.price - a.product.price || byName(a, b));
    case 'name':
      return sorted.sort(byName);
    case 'fit':
      return sorted.sort((a, b) => (b.fit?.score ?? -1) - (a.fit?.score ?? -1) || byName(a, b));
  }
}

export function countActive(filters: Filters): number {
  return (
    filters.categories.length +
    filters.sizes.length +
    filters.brands.length +
    (filters.priceMin != null ? 1 : 0) +
    (filters.priceMax != null ? 1 : 0) +
    (filters.fitOnly ? 1 : 0) +
    (filters.q.trim() ? 1 : 0) +
    activeRanges(filters).length
  );
}
