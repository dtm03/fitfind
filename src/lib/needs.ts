import type { Need, Product } from '../types';

export type NeedStatus = 'done' | 'wishlisted' | 'open';

export const NEED_STATUS_LABEL: Record<NeedStatus, string> = {
  done: 'done',
  wishlisted: 'on wishlist',
  open: 'open',
};

export interface NeedMatch {
  status: NeedStatus;
  product?: Product;
}

function matches(need: Need, product: Product | undefined): product is Product {
  if (!product || product.category !== need.category) return false;
  return need.maxPrice == null || product.price <= need.maxPrice;
}

export function matchNeed(need: Need, wishlist: string[], byId: Map<string, Product>): NeedMatch {
  if (need.done) return { status: 'done' };
  const wished = wishlist.map((id) => byId.get(id)).find((p) => matches(need, p));
  if (wished) return { status: 'wishlisted', product: wished };
  return { status: 'open' };
}