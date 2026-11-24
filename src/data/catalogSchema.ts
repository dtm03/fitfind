import { inferFibers } from './materials';
import type { Category, FitStyle, MeasurementKey, Measurements, Product } from '../types';

export interface CatalogVariant {
  size: string;
  measurements: Partial<Record<MeasurementKey, number>>;
  inStock?: boolean;
}

export interface CatalogProduct {
  id: string;
  url: string;
  retailer: string;
  brand: string;
  name: string;
  price: number | null;
  currency: string;
  image: string | null;
  color?: string | null;
  category: Category;
  scrapedAt?: string;
  variants: CatalogVariant[];
}

export interface CatalogFile {
  version: number;
  exportedAt: string;
  source: string;
  productCount: number;
  products: CatalogProduct[];
}

export function mapCatalogToProducts(catalog: CatalogFile): Product[] {
  return catalog.products.flatMap((row) => {
    const price = row.price ?? 0;
    const color = row.color?.trim() ? { label: row.color.trim(), hex: guessColor(row.color).hex } : guessColor(row.name);
    const variants = row.variants
      .filter((v) => Object.keys(v.measurements).length > 0)
      .map((v) => ({
        size: v.size,
        measurements: v.measurements as Measurements,
        inStock: v.inStock ?? true,
      }));
    if (!variants.length) return [];
    return [
      {
        id: row.id,
        name: row.name,
        brand: row.brand,
        category: row.category,
        price,
        color: color.label,
        colorHex: color.hex,
        material: 'see retailer listing',
        fit: guessFit(row.name) as FitStyle,
        description: `${row.brand} · demo listing with per-size garment measurements.`,
        variants,
        imageUrl: row.image ?? undefined,
        source: { shop: row.retailer.replace(/^www\./, ''), url: row.url },
        fibers: inferFibers('see retailer listing'),
        originCountry: 'unknown',
        ethics: { fairTrade: false, organic: false, recycled: false },
      },
    ];
  });
}

function guessColor(name: string): { label: string; hex: string } {
  const n = name.toLowerCase();
  const table: [RegExp, string, string][] = [
    [/schwarz|black/, 'schwarz', '#161616'],
    [/wei[ßs]|white/, 'weiß', '#f2f2f2'],
    [/grau|grey|gray|meliert/, 'grau', '#8a8a8a'],
    [/marine|navy/, 'marine', '#1d2a44'],
    [/ecru|beige|sand/, 'ecru', '#e6dece'],
    [/oliv/, 'oliv', '#4b5232'],
  ];
  for (const [re, label, hex] of table) {
    if (re.test(n)) return { label, hex };
  }
  return { label: '—', hex: '#666666' };
}

function guessFit(name: string): 'slim' | 'regular' | 'relaxed' | 'oversized' {
  const n = name.toLowerCase();
  if (/slim/.test(n)) return 'slim';
  if (/oversized|boxy|heavy/.test(n)) return 'oversized';
  if (/relaxed/.test(n)) return 'relaxed';
  return 'regular';
}