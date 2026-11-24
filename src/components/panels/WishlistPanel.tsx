import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../data/categories';
import { FitBadge } from '../FitBadge';
import { bestFit } from '../../lib/fit';
import { formatPrice } from '../../lib/format';
import { RetailerBuyLink } from '../../lib/productLink';
import { useProducts } from '../../store/products';
import { useStore } from '../../store/store';

export function WishlistPanel() {
  const { state, dispatch } = useStore();
  const { byId } = useProducts();
  const products = state.wishlist.flatMap((id) => byId.get(id) ?? []);

  if (products.length === 0) {
    return <p className="muted small panel-intro">Nothing saved yet. Tap ♡ on a product in the shop.</p>;
  }

  return (
    <ul className="plain wishlist-panel-list">
      {products.map((product) => {
        const fit = bestFit(product, state.profile);
        const preferred = state.profile.preferredSizes[CATEGORIES[product.category].group];
        const size =
          fit?.size ??
          product.variants.find((v) => v.inStock && v.size === preferred)?.size ??
          product.variants.find((v) => v.inStock)?.size;

        return (
          <li key={product.id} className="wishlist-panel-row">
            <div className="wishlist-panel-head">
              <Link to={`/product/${product.id}`} className="wishlist-panel-name">
                <span className="muted wishlist-panel-brand">
                  {product.brand.toLowerCase()} · {formatPrice(product.price)}
                </span>
                <span className="wishlist-panel-title">{product.name}</span>
              </Link>
              <div className="wishlist-panel-side">
                <FitBadge fit={fit} />
                <button
                  type="button"
                  className="link-btn wishlist-panel-remove"
                  onClick={() => dispatch({ type: 'wishlist/toggle', productId: product.id })}
                  aria-label="remove from wishlist"
                >
                  remove
                </button>
              </div>
            </div>
            <RetailerBuyLink
              product={product}
              size={size}
              disabled={!size}
              className="btn-sm btn-block wishlist-panel-buy"
            />
          </li>
        );
      })}
    </ul>
  );
}