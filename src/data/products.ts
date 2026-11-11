import type { MeasurementKey, Measurements, Product, SizeVariant } from '../types';
import { CATEGORIES, SIZES } from './categories';

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

type Seed = Omit<Product, 'variants' | 'source'> & { base: Measurements };

/** Builds all size variants from the measurements of the middle size (M / 32). */
function product({ base, ...p }: Seed): Product {
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
  return { ...p, variants, source: { shop: `${shop}.example`, url: `https://${shop}.example/p/${p.id}` } };
}

export const PRODUCTS: Product[] = [
  product({
    id: 'p01', name: 'heavyweight tee', brand: 'Grauwerk', category: 'tshirt', price: 39,
    color: 'weiß', colorHex: '#f2f2f2', material: '100% baumwolle, 240 g/m²', fit: 'relaxed',
    description: 'dicker jersey, gerade geschnitten, leicht überschnittene schulter.',
    base: { chest: 56, shoulder: 50, length: 72, sleeve: 22 },
  }),
  product({
    id: 'p02', name: 'essential crew', brand: 'Basis Co.', category: 'tshirt', price: 19,
    color: 'schwarz', colorHex: '#161616', material: '100% bio-baumwolle, 160 g/m²', fit: 'regular',
    description: 'leichtes basic für jeden tag.',
    base: { chest: 53, shoulder: 46, length: 71, sleeve: 20 },
  }),
  product({
    id: 'p03', name: 'boxy tee', brand: 'Kōsen', category: 'tshirt', price: 45,
    color: 'ecru', colorHex: '#e6dece', material: '100% baumwolle, 220 g/m²', fit: 'oversized',
    description: 'kurz und weit, der klassische boxy-schnitt.',
    base: { chest: 60, shoulder: 54, length: 68, sleeve: 23 },
  }),
  product({
    id: 'p04', name: 'pima slim tee', brand: 'Lumen Atelier', category: 'tshirt', price: 55,
    color: 'marine', colorHex: '#1d2a44', material: '100% pima-baumwolle', fit: 'slim',
    description: 'glatter griff, schmale silhouette.',
    base: { chest: 51, shoulder: 45, length: 73, sleeve: 19.5 },
  }),
  product({
    id: 'p05', name: 'standard tee', brand: 'Oslo Standard', category: 'tshirt', price: 29,
    color: 'grau meliert', colorHex: '#8c8c8c', material: '90% baumwolle, 10% viskose', fit: 'regular',
    description: 'regular fit mit etwas mehr länge.',
    base: { chest: 54, shoulder: 47, length: 74, sleeve: 21 },
  }),
  product({
    id: 'p06', name: 'pocket tee', brand: 'Northvale', category: 'tshirt', price: 35,
    color: 'oliv', colorHex: '#4b5232', material: '100% baumwolle, 200 g/m²', fit: 'regular',
    description: 'brusttasche, garment dyed.',
    base: { chest: 55, shoulder: 48, length: 72, sleeve: 21.5 },
  }),
  product({
    id: 'p07', name: 'oxford shirt', brand: 'Northvale', category: 'shirt', price: 79,
    color: 'hellblau', colorHex: '#a9bcd6', material: '100% baumwolle, oxford', fit: 'regular',
    description: 'button-down-kragen, leicht gewaschen.',
    base: { chest: 56, shoulder: 47, length: 76, sleeve: 64 },
  }),
  product({
    id: 'p08', name: 'poplin shirt', brand: 'Lumen Atelier', category: 'shirt', price: 95,
    color: 'weiß', colorHex: '#f5f5f5', material: '100% baumwolle, popeline', fit: 'slim',
    description: 'klarer kentkragen, schmal geschnitten.',
    base: { chest: 52, shoulder: 45.5, length: 75, sleeve: 65 },
  }),
  product({
    id: 'p09', name: 'twill overshirt', brand: 'Grauwerk', category: 'shirt', price: 89,
    color: 'anthrazit', colorHex: '#333333', material: 'baumwoll-twill, 280 g/m²', fit: 'relaxed',
    description: 'zwischen hemd und jacke, zwei pattentaschen.',
    base: { chest: 59, shoulder: 50, length: 74, sleeve: 63 },
  }),
  product({
    id: 'p10', name: 'loopback hoodie', brand: 'Basis Co.', category: 'hoodie', price: 59,
    color: 'schwarz', colorHex: '#121212', material: '100% baumwolle, 380 g/m²', fit: 'regular',
    description: 'klassischer hoodie mit kängurutasche.',
    base: { chest: 57, shoulder: 48, length: 70, sleeve: 62 },
  }),
  product({
    id: 'p11', name: 'heavy hoodie', brand: 'Kōsen', category: 'hoodie', price: 110,
    color: 'grau', colorHex: '#6b6b6b', material: '100% baumwolle, 480 g/m²', fit: 'oversized',
    description: 'schwer, weit, tief angesetzte schulter.',
    base: { chest: 63, shoulder: 56, length: 69, sleeve: 58 },
  }),
  product({
    id: 'p12', name: 'zip hoodie', brand: 'Oslo Standard', category: 'hoodie', price: 69,
    color: 'marine', colorHex: '#1b2436', material: '80% baumwolle, 20% polyester', fit: 'regular',
    description: 'durchgehender zwei-wege-reißverschluss.',
    base: { chest: 56, shoulder: 47, length: 70, sleeve: 63 },
  }),
  product({
    id: 'p13', name: 'chore jacket', brand: 'Northvale', category: 'jacket', price: 149,
    color: 'ocker', colorHex: '#a07a3a', material: 'baumwoll-canvas, 12 oz', fit: 'relaxed',
    description: 'arbeitsjacke mit drei aufgesetzten taschen.',
    base: { chest: 60, shoulder: 49, length: 73, sleeve: 63 },
  }),
  product({
    id: 'p14', name: 'coach jacket', brand: 'Grauwerk', category: 'jacket', price: 129,
    color: 'schwarz', colorHex: '#101010', material: 'nylon, wasserabweisend', fit: 'regular',
    description: 'leicht, druckknopfleiste, tunnelzug am saum.',
    base: { chest: 59, shoulder: 48, length: 71, sleeve: 64 },
  }),
  product({
    id: 'p15', name: 'field jacket', brand: 'Lumen Atelier', category: 'jacket', price: 219,
    color: 'oliv', colorHex: '#3f4630', material: 'gewachste baumwolle', fit: 'regular',
    description: 'vier taschen, verdeckter reißverschluss.',
    base: { chest: 57, shoulder: 46.5, length: 75, sleeve: 65 },
  }),
  product({
    id: 'p16', name: 'straight jeans', brand: 'Northvale', category: 'jeans', price: 99,
    color: 'indigo', colorHex: '#22304d', material: '100% baumwolle, 13,5 oz selvedge', fit: 'regular',
    description: 'gerades bein, mittlere leibhöhe.',
    base: { waist: 41.5, hip: 54, inseam: 81, rise: 28, thigh: 31.5, legOpening: 20 },
  }),
  product({
    id: 'p17', name: 'slim jeans', brand: 'Lumen Atelier', category: 'jeans', price: 129,
    color: 'schwarz', colorHex: '#151515', material: '98% baumwolle, 2% elasthan', fit: 'slim',
    description: 'schmal ab der hüfte, leichter stretch.',
    base: { waist: 41, hip: 52, inseam: 82, rise: 26.5, thigh: 29, legOpening: 17 },
  }),
  product({
    id: 'p18', name: 'wide jeans', brand: 'Kōsen', category: 'jeans', price: 139,
    color: 'hellblau', colorHex: '#7d93b2', material: '100% baumwolle, 14 oz', fit: 'relaxed',
    description: 'hohe leibhöhe, weites bein.',
    base: { waist: 42.5, hip: 57, inseam: 80, rise: 31, thigh: 35.5, legOpening: 24 },
  }),
  product({
    id: 'p19', name: 'tapered jeans', brand: 'Oslo Standard', category: 'jeans', price: 79,
    color: 'indigo', colorHex: '#2a3a5c', material: '99% baumwolle, 1% elasthan', fit: 'regular',
    description: 'oben bequem, zum saum hin schmaler.',
    base: { waist: 41.5, hip: 53.5, inseam: 79, rise: 27.5, thigh: 31, legOpening: 17.5 },
  }),
  product({
    id: 'p20', name: 'pleated trousers', brand: 'Lumen Atelier', category: 'pants', price: 149,
    color: 'grau', colorHex: '#5a5a5a', material: '100% schurwolle', fit: 'relaxed',
    description: 'bundfalten, weites bein, hoher bund.',
    base: { waist: 42, hip: 56, inseam: 80, rise: 30, thigh: 34, legOpening: 20 },
  }),
  product({
    id: 'p21', name: 'chino', brand: 'Basis Co.', category: 'pants', price: 59,
    color: 'sand', colorHex: '#c8b48f', material: '98% baumwolle, 2% elasthan', fit: 'regular',
    description: 'der klassiker, leicht verjüngt.',
    base: { waist: 41.5, hip: 53, inseam: 81, rise: 27, thigh: 30.5, legOpening: 18 },
  }),
  product({
    id: 'p22', name: 'cargo pants', brand: 'Grauwerk', category: 'pants', price: 89,
    color: 'oliv', colorHex: '#3d4430', material: 'baumwoll-ripstop', fit: 'relaxed',
    description: 'seitliche pattentaschen, tunnelzug am saum.',
    base: { waist: 42, hip: 56, inseam: 80, rise: 29.5, thigh: 34.5, legOpening: 21 },
  }),
  product({
    id: 'p23', name: 'sweat shorts', brand: 'Basis Co.', category: 'shorts', price: 35,
    color: 'grau meliert', colorHex: '#8a8a8a', material: '100% baumwolle, 320 g/m²', fit: 'regular',
    description: 'elastischer bund, knielang.',
    base: { waist: 40, inseam: 18, thigh: 33, legOpening: 31 },
  }),
  product({
    id: 'p24', name: 'chino shorts', brand: 'Northvale', category: 'shorts', price: 49,
    color: 'navy', colorHex: '#1d2840', material: '100% baumwolle', fit: 'regular',
    description: 'cleane shorts mit 20 cm innenbein.',
    base: { waist: 41.5, inseam: 20, thigh: 32, legOpening: 29 },
  }),
];
