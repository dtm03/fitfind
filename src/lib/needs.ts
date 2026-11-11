import type { CartItem, Need, Product } from '../types';

export type NeedStatus = 'done' | 'in-cart' | 'wishlisted' | 'open';

export const NEED_STATUS_LABEL: Record<NeedStatus, string> = {
  done: 'erledigt',
  'in-cart': 'im warenkorb',
  wishlisted: 'auf merkliste',
  open: 'offen',
};

export interface NeedMatch {
  status: NeedStatus;
  product?: Product;
}

function matches(need: Need, product: Product | undefined): product is Product {
  if (!product || product.category !== need.category) return false;
  return need.maxPrice == null || product.price <= need.maxPrice;
}

export function matchNeed(
  need: Need,
  cart: CartItem[],
  wishlist: string[],
  byId: Map<string, Product>,
): NeedMatch {
  if (need.done) return { status: 'done' };
  const inCart = cart.map((item) => byId.get(item.productId)).find((p) => matches(need, p));
  if (inCart) return { status: 'in-cart', product: inCart };
  const wished = wishlist.map((id) => byId.get(id)).find((p) => matches(need, p));
  if (wished) return { status: 'wishlisted', product: wished };
  return { status: 'open' };
}
