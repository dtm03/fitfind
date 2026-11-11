import { Link } from 'react-router-dom';
import { FitBadge } from '../components/FitBadge';
import { NeedsCheck } from '../components/NeedsCheck';
import { ProductImage } from '../components/ProductImage';
import { scoreVariant, targetFor } from '../lib/fit';
import { formatPrice } from '../lib/format';
import { cartLines, FREE_SHIPPING_FROM, shippingCost, subtotalOf } from '../lib/pricing';
import { useProducts } from '../store/products';
import { useStore } from '../store/store';

export function Cart() {
  const { state, dispatch } = useStore();
  const { byId } = useProducts();
  const lines = cartLines(state.cart, byId);
  const subtotal = subtotalOf(lines);
  const shipping = shippingCost(subtotal, 'standard');

  return (
    <div className="page">
      <h1>warenkorb</h1>
      <div className="split">
        <div>
          {lines.length === 0 ? (
            <div className="empty">
              <p>dein warenkorb ist leer.</p>
              <Link to="/" className="btn">
                weiter shoppen
              </Link>
            </div>
          ) : (
            <ul className="plain lines">
              {lines.map(({ product, size, qty }) => {
                const variant = product.variants.find((v) => v.size === size);
                const target = targetFor(state.profile, product);
                const fit = variant && target ? scoreVariant(variant, target, state.profile.tolerance) : null;
                return (
                  <li key={`${product.id}-${size}`} className="line">
                    <Link to={`/product/${product.id}`} className="line-img">
                      <ProductImage product={product} />
                    </Link>
                    <div className="grow">
                      <div className="muted small">{product.brand.toLowerCase()}</div>
                      <Link to={`/product/${product.id}`}>{product.name}</Link>
                      <div className="small">
                        größe {size} · {product.color} <FitBadge fit={fit} />
                      </div>
                    </div>
                    <div className="qty">
                      <button
                        onClick={() => dispatch({ type: 'cart/setQty', productId: product.id, size, qty: qty - 1 })}
                        aria-label="weniger"
                      >
                        −
                      </button>
                      <span>{qty}</span>
                      <button
                        onClick={() => dispatch({ type: 'cart/setQty', productId: product.id, size, qty: qty + 1 })}
                        aria-label="mehr"
                      >
                        +
                      </button>
                    </div>
                    <div className="line-price">{formatPrice(product.price * qty)}</div>
                    <button
                      className="link-btn"
                      onClick={() => dispatch({ type: 'cart/remove', productId: product.id, size })}
                      aria-label="entfernen"
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="stack">
          {lines.length > 0 && (
            <aside className="panel">
              <h3>zusammenfassung</h3>
              <dl className="totals">
                <dt>zwischensumme</dt>
                <dd>{formatPrice(subtotal)}</dd>
                <dt>versand</dt>
                <dd>{shipping === 0 ? 'kostenlos' : formatPrice(shipping)}</dd>
                <dt className="total">gesamt</dt>
                <dd className="total">{formatPrice(subtotal + shipping)}</dd>
              </dl>
              {subtotal < FREE_SHIPPING_FROM && (
                <p className="muted small">noch {formatPrice(FREE_SHIPPING_FROM - subtotal)} bis zum kostenlosen versand.</p>
              )}
              <Link to="/checkout" className="btn btn-primary btn-block">
                zur kasse
              </Link>
            </aside>
          )}
          <NeedsCheck />
        </div>
      </div>
    </div>
  );
}
