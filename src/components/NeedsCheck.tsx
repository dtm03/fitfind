import { Link } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';
import { matchNeed, NEED_STATUS_LABEL } from '../lib/needs';
import { useProducts } from '../store/products';
import { useStore } from '../store/store';

/** Shows which open items of the shopping list are already covered by the cart. */
export function NeedsCheck() {
  const { state } = useStore();
  const { byId } = useProducts();
  const open = state.needs.filter((n) => !n.done);
  const matches = open.map((need) => ({ need, match: matchNeed(need, state.cart, state.wishlist, byId) }));
  const covered = matches.filter((m) => m.match.status === 'in-cart').length;

  return (
    <aside className="panel">
      <div className="row-between">
        <h3>einkaufsliste</h3>
        <span className="muted small">
          {covered}/{open.length} im warenkorb
        </span>
      </div>
      {open.length > 0 && (
        <div className="progress" aria-hidden="true">
          <div style={{ width: `${(covered / open.length) * 100}%` }} />
        </div>
      )}
      {open.length === 0 && <p className="muted small">keine offenen punkte.</p>}
      <ul className="plain needs-check">
        {matches.map(({ need, match }) => (
          <li key={need.id}>
            <span className={`dot dot-${match.status}`} />
            <div className="grow">
              <div>{need.note || CATEGORIES[need.category].label}</div>
              <div className="muted small">
                {CATEGORIES[need.category].label}
                {need.maxPrice != null && ` · bis ${need.maxPrice} €`}
                {' · '}
                {match.product ? (
                  <>
                    {NEED_STATUS_LABEL[match.status]}: <Link to={`/product/${match.product.id}`}>{match.product.name}</Link>
                  </>
                ) : (
                  <Link to={`/?cat=${need.category}`}>im shop suchen →</Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Link to="/profile?tab=liste" className="small">
        liste bearbeiten →
      </Link>
    </aside>
  );
}
