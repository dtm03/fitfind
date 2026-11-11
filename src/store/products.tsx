import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadProducts } from '../data/source';
import type { Product } from '../types';

interface ProductsState {
  products: Product[];
  byId: Map<string, Product>;
  brands: string[];
  loading: boolean;
  error?: string;
}

const ProductsContext = createContext<ProductsState | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    loadProducts()
      .then((data) => !cancelled && setProducts(data))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<ProductsState>(
    () => ({
      products,
      byId: new Map(products.map((p) => [p.id, p])),
      brands: [...new Set(products.map((p) => p.brand))].sort((a, b) => a.localeCompare(b)),
      loading,
      error,
    }),
    [products, loading, error],
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used inside <ProductsProvider>');
  return ctx;
}
