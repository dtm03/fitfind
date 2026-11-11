import type { Product } from '../types';
import { PRODUCTS } from './products';

/**
 * Single entry point for catalog data. Replace with a call to a real API or
 * scraping backend later; it only has to return normalized `Product`s.
 */
export async function loadProducts(): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return PRODUCTS;
}
