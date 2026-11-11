import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FitBadge } from '../components/FitBadge';
import { ProductImage } from '../components/ProductImage';
import { CATEGORIES, MEASUREMENTS } from '../data/categories';
import { bestFit, fitLevel, scoreVariant, targetFor } from '../lib/fit';
import { cls, formatCm, formatDiff, formatPrice } from '../lib/format';
import { useProducts } from '../store/products';
import { useStore } from '../store/store';
import type { MeasurementKey } from '../types';

export function ProductPage() {
  const { id } = useParams();
  const { byId, loading } = useProducts();
  const { state, dispatch } = useStore();
  const product = id ? byId.get(id) : undefined;
  const [picked, setPicked] = useState<string>();
  const [added, setAdded] = useState(false);

  if (loading) return <div className="page muted">lade…</div>;
  if (!product) {
    return (
      <div className="page empty">
        <p>produkt nicht gefunden.</p>
        <Link to="/" className="btn">
          zum shop
        </Link>
      </div>
    );
  }

  const target = targetFor(state.profile, product);
  const best = bestFit(product, state.profile);
  const group = CATEGORIES[product.category].group;
  const fallback =
    product.variants.find((v) => v.inStock && v.size === state.profile.preferredSizes[group]) ??
    product.variants.find((v) => v.inStock);
  const size = picked ?? best?.size ?? fallback?.size;
  const variant = product.variants.find((v) => v.size === size);
  const selectedFit = variant && target ? scoreVariant(variant, target, state.profile.tolerance) : null;
  const keys = CATEGORIES[product.category].keys.filter((k) => product.variants[0]?.measurements[k] != null);
  const wished = state.wishlist.includes(product.id);

  const addToCart = () => {
    if (!variant?.inStock) return;
    dispatch({ type: 'cart/add', productId: product.id, size: variant.size });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="page">
      <Link to="/" className="back">
        ← zurück zum shop
      </Link>
      <div className="pdp">
        <ProductImage product={product} large />

        <div className="pdp-info">
          <div className="muted">{product.brand.toLowerCase()}</div>
          <h1>{product.name}</h1>
          <div className="pdp-price">{formatPrice(product.price)}</div>
          <p>{product.description}</p>
          <dl className="specs">
            <dt>kategorie</dt>
            <dd>{CATEGORIES[product.category].label}</dd>
            <dt>schnitt</dt>
            <dd>{product.fit}</dd>
            <dt>farbe</dt>
            <dd>{product.color}</dd>
            <dt>material</dt>
            <dd>{product.material}</dd>
            <dt>quelle</dt>
            <dd>{product.source.shop}</dd>
          </dl>

          <div className="label">größe</div>
          <div className="size-picker">
            {product.variants.map((v) => {
              const s = target ? scoreVariant(v, target, state.profile.tolerance) : null;
              return (
                <button
                  key={v.size}
                  disabled={!v.inStock}
                  className={cls('size-btn', v.size === size && 'on', best?.size === v.size && 'best')}
                  onClick={() => setPicked(v.size)}
                  title={v.inStock ? undefined : 'ausverkauft'}
                >
                  <span>{v.size}</span>
                  {s && <span className={`size-score fit-text-${fitLevel(s.score)}`}>{s.score}</span>}
                </button>
              );
            })}
          </div>
          {best && (
            <p className="small muted">
              empfehlung: <FitBadge fit={best} showLabel />
            </p>
          )}
          {!target && (
            <p className="small muted">
              <Link to="/profile?tab=masse">maße für {CATEGORIES[product.category].label} hinterlegen</Link>, um eine
              größenempfehlung zu bekommen.
            </p>
          )}

          <div className="pdp-actions">
            <button className="btn btn-primary" disabled={!variant?.inStock} onClick={addToCart}>
              {added ? '✓ im warenkorb' : `in den warenkorb${size ? ` · ${size}` : ''}`}
            </button>
            <button className="btn" onClick={() => dispatch({ type: 'wishlist/toggle', productId: product.id })}>
              {wished ? '♥ gemerkt' : '♡ merken'}
            </button>
          </div>
        </div>
      </div>

      <section className="section">
        <h2>maßtabelle</h2>
        <p className="muted small">alle angaben in cm, flach gemessen. spalte anklicken, um die größe zu wählen.</p>
        <div className="table-wrap">
          <table className="mtable">
            <thead>
              <tr>
                <th />
                {product.variants.map((v) => (
                  <th
                    key={v.size}
                    className={cls(v.size === size && 'sel', !v.inStock && 'oos')}
                    onClick={() => v.inStock && setPicked(v.size)}
                  >
                    {v.size}
                  </th>
                ))}
                {target && <th className="target">dein ziel</th>}
                {selectedFit && <th>abweichung</th>}
              </tr>
            </thead>
            <tbody>
              {keys.map((key: MeasurementKey) => {
                const diff = selectedFit?.diffs[key];
                return (
                  <tr key={key}>
                    <td title={MEASUREMENTS[key].hint}>{MEASUREMENTS[key].label}</td>
                    {product.variants.map((v) => (
                      <td key={v.size} className={cls(v.size === size && 'sel', !v.inStock && 'oos')}>
                        {formatCm(v.measurements[key])}
                      </td>
                    ))}
                    {target && <td className="target">{formatCm(target[key])}</td>}
                    {selectedFit && (
                      <td className={cls(diff != null && Math.abs(diff) > state.profile.tolerance && 'warn')}>
                        {diff != null ? formatDiff(diff) : '—'}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
