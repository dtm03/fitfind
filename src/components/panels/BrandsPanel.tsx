import { useMemo } from "react";
import { CATEGORIES } from "../../data/categories";
import { bestFit, fitLevel, type FitResult } from "../../lib/fit";
import { useProducts } from "../../store/products";
import { useStore } from "../../store/store";
import type { Category, Product } from "../../types";

interface Scored {
  product: Product;
  fit: FitResult;
}

function bar(score: number): string {
  const filled = Math.round(score / 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

export function BrandsPanel() {
  const { products } = useProducts();
  const { state } = useStore();

  const scored = useMemo(
    () =>
      products.flatMap((product) => {
        const fit = bestFit(product, state.profile);
        return fit ? [{ product, fit }] : [];
      }),
    [products, state.profile],
  );

  const brands = useMemo(() => {
    const map = new Map<string, Scored[]>();
    for (const s of scored)
      map.set(s.product.brand, [...(map.get(s.product.brand) ?? []), s]);
    return [...map.entries()]
      .map(([brand, items]) => {
        const avg = Math.round(
          items.reduce((sum, i) => sum + i.fit.score, 0) / items.length,
        );
        const sizesByCategory = new Map<Category, string[]>();
        for (const i of items) {
          sizesByCategory.set(i.product.category, [
            ...(sizesByCategory.get(i.product.category) ?? []),
            i.fit.size,
          ]);
        }
        const sizes = [...sizesByCategory.entries()].map(([category, list]) => {
          const counts = new Map<string, number>();
          for (const s of list) counts.set(s, (counts.get(s) ?? 0) + 1);
          const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
          return `${CATEGORIES[category].label}: ${top}`;
        });
        return { brand, avg, count: items.length, sizes };
      })
      .sort((a, b) => b.avg - a.avg);
  }, [scored]);

  if (brands.length === 0) {
    return (
      <p className="muted small panel-intro">
        Add measurements first to see which brands fit you best.
      </p>
    );
  }

  return (
    <ul className="plain brand-list brand-list-compact">
      {brands.map((b) => (
        <li key={b.brand}>
          <span className="brand-name">{b.brand.toLowerCase()}</span>
          <span className={`bar fit-text-${fitLevel(b.avg)}`}>
            {bar(b.avg)}
          </span>
          <span className="brand-score">{b.avg}</span>
          <span className="muted small">{b.count} items</span>
        </li>
      ))}
    </ul>
  );
}
