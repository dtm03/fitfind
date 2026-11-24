import { Link } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';
import type { FitResult } from '../lib/fit';
import { cls, formatPrice } from '../lib/format';
import { useStore } from '../store/store';
import type { Product } from '../types';
import { FitBadge } from './FitBadge';
import { ProductImage } from './ProductImage';

interface Props {
  product: Product;
  fit: FitResult | null;
  matchedSizes?: string[];
}

export function ProductCard({ product, fit, matchedSizes }: Props) {
  const { state, dispatch } = useStore();
  const wished = state.wishlist.includes(product.id);

  return (
    <article className="card">
      <Link to={`/product/${product.id}`} className="card-link">
        <ProductImage product={product} />
        <div className="card-body">
          <div className="row-between">
            <span className="muted">{product.brand.toLowerCase()}</span>
            <FitBadge fit={fit} />
          </div>
          <h3 className="card-title">{product.name}</h3>
          <div className="row-between">
            <span>{formatPrice(product.price)}</span>
            <span className="muted small">
              {CATEGORIES[product.category].label} · {product.fit}
            </span>
          </div>
          <div className="card-meta-line muted small">
            {product.material} · {product.originCountry}
          </div>
          {(product.ethics.fairTrade || product.ethics.organic || product.ethics.recycled) && (
            <div className="ethics-tags">
              {product.ethics.fairTrade && <span className="ethics-tag">fair trade</span>}
              {product.ethics.organic && <span className="ethics-tag">organic</span>}
              {product.ethics.recycled && <span className="ethics-tag">recycled</span>}
            </div>
          )}
          <div className="sizes">
            {product.variants.map((v) => (
              <span
                key={v.size}
                className={cls(
                  'size',
                  !v.inStock && 'oos',
                  matchedSizes?.includes(v.size) && 'match',
                  fit?.size === v.size && 'best',
                )}
              >
                {v.size}
              </span>
            ))}
          </div>
        </div>
      </Link>
      <button
        className={cls('wish', wished && 'on')}
        onClick={() => dispatch({ type: 'wishlist/toggle', productId: product.id })}
        aria-label={wished ? 'remove from wishlist' : 'add to wishlist'}
        title={wished ? 'remove from wishlist' : 'add to wishlist'}
      >
        {wished ? '♥' : '♡'}
      </button>
    </article>
  );
}