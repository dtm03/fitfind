import type { Category, Product } from '../types';

const SHAPES: Record<Category, string> = {
  tshirt: 'M30 12 L44 7 Q50 14 56 7 L70 12 L86 30 L75 39 L68 32 L68 92 L32 92 L32 32 L25 39 L14 30 Z',
  shirt: 'M30 12 L44 7 L50 16 L56 7 L70 12 L80 42 L85 90 L76 91 L68 52 L68 94 L32 94 L32 52 L24 91 L15 90 L20 42 Z',
  hoodie: 'M30 14 Q38 2 50 4 Q62 2 70 14 L80 42 L85 90 L76 91 L68 52 L68 92 L32 92 L32 52 L24 91 L15 90 L20 42 Z',
  jacket: 'M30 12 L44 7 L50 20 L56 7 L70 12 L80 42 L85 90 L76 91 L68 52 L68 94 L32 94 L32 52 L24 91 L15 90 L20 42 Z',
  jeans: 'M30 8 L70 8 L74 94 L56 94 L50 34 L44 94 L26 94 Z',
  pants: 'M30 8 L70 8 L75 94 L55 94 L50 34 L45 94 L25 94 Z',
  shorts: 'M28 22 L72 22 L77 70 L55 72 L50 42 L45 72 L23 70 Z',
};

export function ProductImage({ product, large = false }: { product: Product; large?: boolean }) {
  const shell = large ? 'product-img large' : 'product-img';
  if (product.imageUrl) {
    return (
      <div className={shell}>
        <img src={product.imageUrl} alt="" loading="lazy" className="product-photo" />
        <span className="product-img-tag">{product.color}</span>
      </div>
    );
  }
  return (
    <div className={shell}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path d={SHAPES[product.category]} fill={product.colorHex} stroke="currentColor" strokeWidth="0.8" />
      </svg>
      <span className="product-img-tag">{product.color}</span>
    </div>
  );
}
