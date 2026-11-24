import { MEASUREMENTS } from '../data/categories';
import type { FitResult } from '../lib/fit';
import { formatCm } from '../lib/format';
import type { MeasurementKey, Product } from '../types';

const CARD_KEYS: MeasurementKey[] = ['chest', 'shoulder', 'length', 'sleeve'];

export function CardMeasurements({ product, fit }: { product: Product; fit: FitResult | null }) {
  const show = product.variants.find((v) => v.size === fit?.size) ?? product.variants[0];
  if (!show) return null;

  return (
    <div className="card-measures">
      <MeasureMiniTable product={product} highlight={show.size} />
      <div className="card-measures-hint muted small">
        size {show.size}
        {fit && fit.size !== show.size ? ` · fit ${fit.score} at ${fit.size}` : fit ? ` · fit ${fit.score}` : ''}
      </div>
    </div>
  );
}

function MeasureMiniTable({ product, highlight }: { product: Product; highlight: string }) {
  const keys = CARD_KEYS.filter((k) => product.variants.some((v) => v.measurements[k] != null));
  if (!keys.length) return null;

  return (
    <div className="table-wrap card-table">
      <table className="mtable compact">
        <thead>
          <tr>
            <th />
            {product.variants.map((v) => (
              <th key={v.size} className={v.size === highlight ? 'sel' : undefined}>
                {v.size}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => (
            <tr key={key}>
              <td>{MEASUREMENTS[key].short}</td>
              {product.variants.map((v) => (
                <td key={v.size} className={v.size === highlight ? 'sel' : undefined}>
                  {formatCm(v.measurements[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}