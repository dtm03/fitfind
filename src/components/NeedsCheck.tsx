import { Link } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';
import { matchNeed, NEED_STATUS_LABEL } from '../lib/needs';
import { useProducts } from '../store/products';
import { useStore } from '../store/store';

/** Shows which open shopping-list items already have a wishlist match. */
export function NeedsCheck() {
  const { state } = useStore();
  const { byId } = useProducts();
  const open = state.needs.filter((n) => !n.done);
  const matches = open.map((need) => ({ need, match: matchNeed(need, state.wishlist, byId) }));
  const covered = matches.filter((m) => m.match.status === 'wishlisted').length;

  return (
    <aside className="panel">
      <div className="row-between">
        <h3>shopping list</h3>
        <span className="muted small">
          {covered}/{open.length} on wishlist
        </span>
      </div>
      {open.length > 0 && (
        <div className="progress" aria-hidden="true">
          <div style={{ width: `${(covered / open.length) * 100}%` }} />
        </div>
      )}
      {open.length === 0 && <p className="muted small">no open items.</p>}
      <ul className="plain needs-check">
        {matches.map(({ need, match }) => (
          <li key={need.id}>
            <span className={`dot dot-${match.status}`} />
            <div className="grow">
              <div>{need.note || CATEGORIES[need.category].label}</div>
              <div className="muted small">
                {CATEGORIES[need.category].label}
                {need.maxPrice != null && ` · up to ${need.maxPrice} €`}
                {' · '}
                {match.product ? (
                  <>
                    {NEED_STATUS_LABEL[match.status]}: <Link to={`/product/${match.product.id}`}>{match.product.name}</Link>
                  </>
                ) : (
                  <Link to={`/?cat=${need.category}`}>search shop →</Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <span className="muted small">edit via list in the header</span>
    </aside>
  );
}