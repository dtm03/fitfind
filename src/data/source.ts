import type { Product } from '../types';
import { PRODUCTS } from './products';

/** Demo catalogue baked into the repo (`src/data/products.ts`). */
export async function loadProducts(): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 80));
  return PRODUCTS;
}