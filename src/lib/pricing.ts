import type { CartItem, Product, ShippingMethod } from '../types';

export const FREE_SHIPPING_FROM = 100;

export const SHIPPING: Record<ShippingMethod, { label: string; eta: string }> = {
  standard: { label: 'standard', eta: '3–5 werktage' },
  express: { label: 'express', eta: '1–2 werktage' },
};

export function shippingCost(subtotal: number, method: ShippingMethod): number {
  if (subtotal === 0) return 0;
  if (method === 'express') return 12.9;
  return subtotal >= FREE_SHIPPING_FROM ? 0 : 4.9;
}

export interface CartLine extends CartItem {
  product: Product;
}

export function cartLines(cart: CartItem[], byId: Map<string, Product>): CartLine[] {
  return cart.flatMap((item) => {
    const product = byId.get(item.productId);
    return product ? [{ ...item, product }] : [];
  });
}

export function subtotalOf(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
}
