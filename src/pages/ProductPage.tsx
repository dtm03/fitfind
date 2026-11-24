import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FitBadge } from '../components/FitBadge';
import { ProductImage } from '../components/ProductImage';
import { CATEGORIES, MEASUREMENTS } from '../data/categories';
import { bestFit, fitLevel, scoreVariant, targetFor } from '../lib/fit';
import { cls, formatCm, formatDiff, formatPrice } from '../lib/format';
import { RetailerBuyLink } from '../lib/productLink';
import { useProducts } from '../store/products';
import { useStore } from '../store/store';
import type { MeasurementKey } from '../types';

export function ProductPage() {
  const { id } = useParams();
  const { byId, loading } = useProducts();
  const { state, dispatch } = useStore();
  const product = id ? byId.get(id) : undefined;
  const [picked, setPicked] = useState<string>();

  if (loading) return <div className="page muted">loading…</div>;
  if (!product) {
    return (
      <div className="page empty">
        <p>product not found.</p>
        <Link to="/" className="btn">
          back to shop
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

  return (
    <div className="page">
      <Link to="/" className="back">
        ← back to shop
      </Link>
      <div className="pdp">
        <ProductImage product={product} large />

        <div className="pdp-info">
          <div className="muted">{product.brand.toLowerCase()}</div>
          <h1>{product.name}</h1>
          <div className="pdp-price">{formatPrice(product.price)}</div>
          <p>{product.description}</p>
          <dl className="specs">
            <dt>category</dt>
            <dd>{CATEGORIES[product.category].label}</dd>
            <dt>fit</dt>
            <dd>{product.fit}</dd>
            <dt>color</dt>
            <dd>{product.color}</dd>
            <dt>material</dt>
            <dd>{product.material}</dd>
            <dt>made in</dt>
            <dd>{product.originCountry}</dd>
            <dt>ethics</dt>
            <dd>
              {product.ethics.fairTrade || product.ethics.organic || product.ethics.recycled
                ? [
                    product.ethics.fairTrade && 'fair trade',
                    product.ethics.organic && 'organic',
                    product.ethics.recycled && 'recycled',
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : '—'}
            </dd>
            <dt>source</dt>
            <dd>{product.source.shop}</dd>
          </dl>

          <div className="label">size</div>
          <div className="size-picker">
            {product.variants.map((v) => {
              const s = target ? scoreVariant(v, target, state.profile.tolerance) : null;
              return (
                <button
                  key={v.size}
                  disabled={!v.inStock}
                  className={cls('size-btn', v.size === size && 'on', best?.size === v.size && 'best')}
                  onClick={() => setPicked(v.size)}
                  title={v.inStock ? undefined : 'out of stock'}
                >
                  <span>{v.size}</span>
                  {s && <span className={`size-score fit-text-${fitLevel(s.score)}`}>{s.score}</span>}
                </button>
              );
            })}
          </div>
          {best && (
            <p className="small muted">
              recommended: <FitBadge fit={best} showLabel />
            </p>
          )}
          {!target && (
            <p className="small muted">
              Open measurements in the header to save targets for {CATEGORIES[product.category].label}.
            </p>
          )}

          <div className="pdp-actions">
            <RetailerBuyLink
              product={product}
              size={variant?.inStock ? size : undefined}
              disabled={!variant?.inStock}
            />
            <button className="btn" onClick={() => dispatch({ type: 'wishlist/toggle', productId: product.id })}>
              {wished ? '♥ saved' : '♡ save'}
            </button>
          </div>

          <section className="pdp-chart" aria-labelledby="pdp-size-chart">
            <h2 id="pdp-size-chart" className="pdp-chart-title">
              size chart
            </h2>
            <p className="muted small pdp-chart-hint">cm, flat. click a column to pick a size.</p>
            <div className="table-wrap pdp-chart-table">
              <table className="mtable compact">
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
                    {target && <th className="target">your target</th>}
                    {selectedFit && <th>delta</th>}
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
      </div>
    </div>
  );
}
