import type { MeasurementKey, Measurements, Product, Profile, SizeVariant } from '../types';

export interface FitResult {
  size: string;
  score: number;
  /** Garment minus target, in cm. Positive = garment is bigger. */
  diffs: Measurements;
}

export type FitLevel = 'great' | 'good' | 'meh' | 'bad';

const LENGTH_KEYS: MeasurementKey[] = ['length', 'sleeve', 'inseam'];

export function targetFor(profile: Profile, product: Product): Measurements | undefined {
  const target = profile.fit[product.category];
  return target && Object.keys(target).length > 0 ? target : undefined;
}

export function scoreVariant(variant: SizeVariant, target: Measurements, tolerance: number): FitResult | null {
  const diffs: Measurements = {};
  let penalty = 0;
  let compared = 0;

  for (const key of Object.keys(target) as MeasurementKey[]) {
    const want = target[key];
    const have = variant.measurements[key];
    if (want == null || have == null) continue;
    const diff = have - want;
    diffs[key] = Math.round(diff * 10) / 10;
    // Length deviations are less noticeable than width deviations.
    const tol = LENGTH_KEYS.includes(key) ? tolerance * 1.5 : tolerance;
    penalty += Math.min(Math.abs(diff) / tol, 4);
    compared++;
  }

  if (compared === 0) return null;
  const score = Math.round(Math.max(0, 100 - (penalty / compared) * 25));
  return { size: variant.size, score, diffs };
}

export function bestFit(
  product: Product,
  profile: Profile,
  variants: SizeVariant[] = product.variants.filter((v) => v.inStock),
): FitResult | null {
  const target = targetFor(profile, product);
  if (!target) return null;
  let best: FitResult | null = null;
  for (const variant of variants) {
    const result = scoreVariant(variant, target, profile.tolerance);
    if (result && (!best || result.score > best.score)) best = result;
  }
  return best;
}

export function fitLevel(score: number): FitLevel {
  if (score >= 85) return 'great';
  if (score >= 70) return 'good';
  if (score >= 50) return 'meh';
  return 'bad';
}

export const FIT_LABEL: Record<FitLevel, string> = {
  great: 'spot on',
  good: 'good',
  meh: 'okay',
  bad: 'poor fit',
};
