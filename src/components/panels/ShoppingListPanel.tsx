import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { NumberInput } from '../NumberInput';
import { CATEGORIES, CATEGORY_ORDER } from '../../data/categories';
import { cls, formatPrice } from '../../lib/format';
import { matchNeed, NEED_STATUS_LABEL } from '../../lib/needs';
import { useProducts } from '../../store/products';
import { useStore } from '../../store/store';
import type { Category } from '../../types';

export function ShoppingListPanel() {
  const { state, dispatch } = useStore();
  const { byId } = useProducts();
  const [category, setCategory] = useState<Category>('tshirt');
  const [note, setNote] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>();

  const add = (e: FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'needs/add', need: { category, note: note.trim(), maxPrice } });
    setNote('');
    setMaxPrice(undefined);
  };

  const sorted = [...state.needs].sort((a, b) => Number(a.done) - Number(b.done));

  return (
    <div className="panel-scroll">
      <form className="need-form need-form-compact" onSubmit={add}>
        <select value={category} onChange={(e) => setCategory(e.target.value as Category)} aria-label="category">
          {CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {CATEGORIES[c].label}
            </option>
          ))}
        </select>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="note" aria-label="note" />
        <NumberInput value={maxPrice} onChange={setMaxPrice} placeholder="max €" min={0} aria-label="budget" />
        <button type="submit" className="btn btn-sm btn-primary">
          add
        </button>
      </form>

      {sorted.length === 0 && <p className="muted small">Your list is empty.</p>}
      <ul className="plain needs-list needs-list-compact">
        {sorted.map((need) => {
          const match = matchNeed(need, state.wishlist, byId);
          return (
            <li key={need.id} className={cls('need', need.done && 'need-done')}>
              <input
                type="checkbox"
                checked={need.done}
                onChange={() => dispatch({ type: 'needs/toggleDone', id: need.id })}
                aria-label="done"
              />
              <div className="grow">
                <div>{need.note || CATEGORIES[need.category].label}</div>
                <div className="muted small">
                  {CATEGORIES[need.category].label}
                  {need.maxPrice != null && ` · up to ${formatPrice(need.maxPrice)}`}
                </div>
              </div>
              <span className={cls('status', `status-${match.status}`)}>
                {NEED_STATUS_LABEL[match.status]}
                {match.product && (
                  <>
                    : <Link to={`/product/${match.product.id}`}>{match.product.name}</Link>
                  </>
                )}
              </span>
              {match.status === 'open' && (
                <Link to={`/?cat=${need.category}`} className="btn btn-sm">
                  search
                </Link>
              )}
              <button className="link-btn" onClick={() => dispatch({ type: 'needs/remove', id: need.id })} aria-label="delete">
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}