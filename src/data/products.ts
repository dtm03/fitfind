import type { Fiber, MeasurementKey, Measurements, Product, ProductEthics, SizeVariant } from '../types';
import { CATEGORIES, SIZES } from './categories';
import { inferFibers } from './materials';

const ORIGINS = ['Portugal', 'Turkey', 'Germany', 'Italy', 'India', 'Bangladesh', 'Spain', 'Netherlands'] as const;

type Meta = Partial<ProductEthics> & { origin?: string };

/** Demo ethics & origin — stand-in for partner-feed attributes. */
const DEMO_META: Record<string, Meta> = {
  p01: { origin: 'Portugal', fairTrade: true },
  p02: { origin: 'India', organic: true, fairTrade: true },
  p03: { origin: 'Portugal' },
  p04: { origin: 'Peru', organic: true },
  p05: { origin: 'Bangladesh' },
  p06: { origin: 'Turkey', fairTrade: true },
  p07: { origin: 'Portugal', fairTrade: true },
  p08: { origin: 'Italy' },
  p09: { origin: 'Turkey' },
  p10: { origin: 'Bangladesh', fairTrade: true, organic: true },
  p11: { origin: 'Portugal', fairTrade: true },
  p12: { origin: 'Turkey' },
  p13: { origin: 'Spain', fairTrade: true, recycled: true },
  p14: { origin: 'China' },
  p15: { origin: 'Italy', fairTrade: true, organic: true },
  p16: { origin: 'Japan', fairTrade: true },
  p17: { origin: 'Turkey', recycled: true },
  p18: { origin: 'Portugal', organic: true },
  p19: { origin: 'Bangladesh' },
  p20: { origin: 'Italy', fairTrade: true, organic: true },
  p21: { origin: 'India', fairTrade: true },
  p22: { origin: 'Turkey', recycled: true },
  p23: { origin: 'Bangladesh', organic: true },
  p24: { origin: 'Portugal', fairTrade: true },
};

/** Change per size step, in cm. */
const GRADING: Record<'top' | 'bottom', Measurements> = {
  top: { chest: 2.5, shoulder: 1.5, length: 2, sleeve: 1 },
  bottom: { waist: 2.5, hip: 2.5, rise: 0.6, thigh: 1.2, legOpening: 0.6, inseam: 0 },
};

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type Seed = Omit<Product, 'variants' | 'source' | 'fibers' | 'originCountry' | 'ethics'> & {
  base: Measurements;
  fibers?: Fiber[];
  originCountry?: string;
  ethics?: Partial<ProductEthics>;
};

/** Builds all size variants from the measurements of the middle size (M / 32). */
function product({ base, fibers, originCountry, ethics, ...p }: Seed): Product {
  const meta = DEMO_META[p.id] ?? {};
  const group = CATEGORIES[p.category].group;
  const sizes = SIZES[group];
  const baseIndex = 2;
  const step = GRADING[group];

  const variants: SizeVariant[] = sizes.map((size, i) => {
    const measurements: Measurements = {};
    for (const key of Object.keys(base) as MeasurementKey[]) {
      const value = (base[key] ?? 0) + (i - baseIndex) * (step[key] ?? 0);
      measurements[key] = Math.round(value * 2) / 2;
    }
    return { size, measurements, inStock: hash(p.id + size) % 5 !== 0 };
  });

  const shop = p.brand.toLowerCase().replace(/[^a-z]/g, '');
  const ethicsFull: ProductEthics = {
    fairTrade: ethics?.fairTrade ?? meta.fairTrade ?? false,
    organic: ethics?.organic ?? meta.organic ?? false,
    recycled: ethics?.recycled ?? meta.recycled ?? false,
  };
  return {
    ...p,
    fibers: fibers ?? inferFibers(p.material),
    originCountry: originCountry ?? meta.origin ?? ORIGINS[hash(p.id) % ORIGINS.length],
    ethics: ethicsFull,
    variants,
    source: { shop: `${shop}.example`, url: `https://${shop}.example/p/${p.id}` },
  };
}

export const PRODUCTS: Product[] = [
  product({
    id: 'p01', name: 'heavyweight tee', brand: 'Grauwerk', category: 'tshirt', price: 39,
    color: 'white', colorHex: '#f2f2f2', material: '100% cotton, 240 g/m²', fit: 'relaxed',
    description: 'heavy jersey, straight cut, slightly dropped shoulder.',
    base: { chest: 56, shoulder: 50, length: 72, sleeve: 22 },
  }),
  product({
    id: 'p02', name: 'essential crew', brand: 'Basis Co.', category: 'tshirt', price: 19,
    color: 'black', colorHex: '#161616', material: '100% organic cotton, 160 g/m²', fit: 'regular',
    description: 'light everyday basic.',
    base: { chest: 53, shoulder: 46, length: 71, sleeve: 20 },
  }),
  product({
    id: 'p03', name: 'boxy tee', brand: 'Kōsen', category: 'tshirt', price: 45,
    color: 'ecru', colorHex: '#e6dece', material: '100% cotton, 220 g/m²', fit: 'oversized',
    description: 'short and wide, classic boxy cut.',
    base: { chest: 60, shoulder: 54, length: 68, sleeve: 23 },
  }),
  product({
    id: 'p04', name: 'pima slim tee', brand: 'Lumen Atelier', category: 'tshirt', price: 55,
    color: 'navy', colorHex: '#1d2a44', material: '100% pima cotton', fit: 'slim',
    description: 'smooth hand, narrow silhouette.',
    base: { chest: 51, shoulder: 45, length: 73, sleeve: 19.5 },
  }),
  product({
    id: 'p05', name: 'standard tee', brand: 'Oslo Standard', category: 'tshirt', price: 29,
    color: 'heather grey', colorHex: '#8c8c8c', material: '90% cotton, 10% viscose', fit: 'regular',
    description: 'regular fit with a bit more length.',
    base: { chest: 54, shoulder: 47, length: 74, sleeve: 21 },
  }),
  product({
    id: 'p06', name: 'pocket tee', brand: 'Northvale', category: 'tshirt', price: 35,
    color: 'olive', colorHex: '#4b5232', material: '100% cotton, 200 g/m²', fit: 'regular',
    description: 'chest pocket, garment dyed.',
    base: { chest: 55, shoulder: 48, length: 72, sleeve: 21.5 },
  }),
  product({
    id: 'p07', name: 'oxford shirt', brand: 'Northvale', category: 'shirt', price: 79,
    color: 'light blue', colorHex: '#a9bcd6', material: '100% cotton oxford', fit: 'regular',
    description: 'button-down collar, lightly washed.',
    base: { chest: 56, shoulder: 47, length: 76, sleeve: 64 },
  }),
  product({
    id: 'p08', name: 'poplin shirt', brand: 'Lumen Atelier', category: 'shirt', price: 95,
    color: 'white', colorHex: '#f5f5f5', material: '100% cotton poplin', fit: 'slim',
    description: 'sharp spread collar, slim cut.',
    base: { chest: 52, shoulder: 45.5, length: 75, sleeve: 65 },
  }),
  product({
    id: 'p09', name: 'twill overshirt', brand: 'Grauwerk', category: 'shirt', price: 89,
    color: 'charcoal', colorHex: '#333333', material: 'cotton twill, 280 g/m²', fit: 'relaxed',
    description: 'between shirt and jacket, two flap pockets.',
    base: { chest: 59, shoulder: 50, length: 74, sleeve: 63 },
  }),
  product({
    id: 'p10', name: 'loopback hoodie', brand: 'Basis Co.', category: 'hoodie', price: 59,
    color: 'black', colorHex: '#121212', material: '100% cotton, 380 g/m²', fit: 'regular',
    description: 'classic hoodie with kangaroo pocket.',
    base: { chest: 57, shoulder: 48, length: 70, sleeve: 62 },
  }),
  product({
    id: 'p11', name: 'heavy hoodie', brand: 'Kōsen', category: 'hoodie', price: 110,
    color: 'grey', colorHex: '#6b6b6b', material: '100% cotton, 480 g/m²', fit: 'oversized',
    description: 'heavy, wide, low shoulder line.',
    base: { chest: 63, shoulder: 56, length: 69, sleeve: 58 },
  }),
  product({
    id: 'p12', name: 'zip hoodie', brand: 'Oslo Standard', category: 'hoodie', price: 69,
    color: 'navy', colorHex: '#1b2436', material: '80% cotton, 20% polyester', fit: 'regular',
    description: 'full-length two-way zip.',
    base: { chest: 56, shoulder: 47, length: 70, sleeve: 63 },
  }),
  product({
    id: 'p13', name: 'chore jacket', brand: 'Northvale', category: 'jacket', price: 149,
    color: 'ochre', colorHex: '#a07a3a', material: 'cotton canvas, 12 oz', fit: 'relaxed',
    description: 'work jacket with three patch pockets.',
    base: { chest: 60, shoulder: 49, length: 73, sleeve: 63 },
  }),
  product({
    id: 'p14', name: 'coach jacket', brand: 'Grauwerk', category: 'jacket', price: 129,
    color: 'black', colorHex: '#101010', material: 'nylon, water repellent', fit: 'regular',
    description: 'lightweight, snap placket, drawcord hem.',
    base: { chest: 59, shoulder: 48, length: 71, sleeve: 64 },
  }),
  product({
    id: 'p15', name: 'field jacket', brand: 'Lumen Atelier', category: 'jacket', price: 219,
    color: 'olive', colorHex: '#3f4630', material: 'waxed cotton', fit: 'regular',
    description: 'four pockets, hidden zip front.',
    base: { chest: 57, shoulder: 46.5, length: 75, sleeve: 65 },
  }),
  product({
    id: 'p16', name: 'straight jeans', brand: 'Northvale', category: 'jeans', price: 99,
    color: 'indigo', colorHex: '#22304d', material: '100% cotton, 13.5 oz selvedge', fit: 'regular',
    description: 'straight leg, mid rise.',
    base: { waist: 41.5, hip: 54, inseam: 81, rise: 28, thigh: 31.5, legOpening: 20 },
  }),
  product({
    id: 'p17', name: 'slim jeans', brand: 'Lumen Atelier', category: 'jeans', price: 129,
    color: 'black', colorHex: '#151515', material: '98% cotton, 2% elastane', fit: 'slim',
    description: 'tapers from the hip, light stretch.',
    base: { waist: 41, hip: 52, inseam: 82, rise: 26.5, thigh: 29, legOpening: 17 },
  }),
  product({
    id: 'p18', name: 'wide jeans', brand: 'Kōsen', category: 'jeans', price: 139,
    color: 'light blue', colorHex: '#7d93b2', material: '100% cotton, 14 oz', fit: 'relaxed',
    description: 'high rise, wide leg.',
    base: { waist: 42.5, hip: 57, inseam: 80, rise: 31, thigh: 35.5, legOpening: 24 },
  }),
  product({
    id: 'p19', name: 'tapered jeans', brand: 'Oslo Standard', category: 'jeans', price: 79,
    color: 'indigo', colorHex: '#2a3a5c', material: '99% cotton, 1% elastane', fit: 'regular',
    description: 'roomy on top, narrower toward the hem.',
    base: { waist: 41.5, hip: 53.5, inseam: 79, rise: 27.5, thigh: 31, legOpening: 17.5 },
  }),
  product({
    id: 'p20', name: 'pleated trousers', brand: 'Lumen Atelier', category: 'pants', price: 149,
    color: 'grey', colorHex: '#5a5a5a', material: '100% wool', fit: 'relaxed',
    description: 'double pleats, wide leg, high waist.',
    base: { waist: 42, hip: 56, inseam: 80, rise: 30, thigh: 34, legOpening: 20 },
  }),
  product({
    id: 'p21', name: 'chino', brand: 'Basis Co.', category: 'pants', price: 59,
    color: 'sand', colorHex: '#c8b48f', material: '98% cotton, 2% elastane', fit: 'regular',
    description: 'the classic, lightly tapered.',
    base: { waist: 41.5, hip: 53, inseam: 81, rise: 27, thigh: 30.5, legOpening: 18 },
  }),
  product({
    id: 'p22', name: 'cargo pants', brand: 'Grauwerk', category: 'pants', price: 89,
    color: 'olive', colorHex: '#3d4430', material: 'cotton ripstop', fit: 'relaxed',
    description: 'side cargo pockets, drawcord hem.',
    base: { waist: 42, hip: 56, inseam: 80, rise: 29.5, thigh: 34.5, legOpening: 21 },
  }),
  product({
    id: 'p23', name: 'sweat shorts', brand: 'Basis Co.', category: 'shorts', price: 35,
    color: 'heather grey', colorHex: '#8a8a8a', material: '100% cotton, 320 g/m²', fit: 'regular',
    description: 'elastic waist, knee length.',
    base: { waist: 40, inseam: 18, thigh: 33, legOpening: 31 },
  }),
  product({
    id: 'p24', name: 'chino shorts', brand: 'Northvale', category: 'shorts', price: 49,
    color: 'navy', colorHex: '#1d2840', material: '100% cotton', fit: 'regular',
    description: 'clean shorts with 20 cm inseam.',
    base: { waist: 41.5, inseam: 20, thigh: 32, legOpening: 29 },
  }),
];