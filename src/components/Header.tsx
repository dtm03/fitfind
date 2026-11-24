import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';
import { matchNeed, NEED_STATUS_LABEL } from '../lib/needs';
import { useProducts } from '../store/products';
import { useStore } from '../store/store';
import type { Category } from '../types';

export function Header() {
  const { state } = useStore();
  const cartCount = state.cart.reduce((n, i) => n + i.qty, 0);

  return (
    <header className="header">
      <Link to="/" className="logo" aria-label="fitfind home">
        <span className="logo-mark">[ff]</span> fitfind<span className="cursor">_</span>
      </Link>
      <nav className="nav">
        <NavLink to="/" end>
          shop
        </NavLink>
        <NavLink to="/wishlist">wishlist{state.wishlist.length > 0 && <sup>{state.wishlist.length}</sup>}</NavLink>
        <NavLink to="/cart">cart{cartCount > 0 && <sup>{cartCount}</sup>}</NavLink>
        <ProfileMenu />
      </nav>
    </header>
  );
}

function ProfileMenu() {
  const { state } = useStore();
  const { byId } = useProducts();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openNeeds = state.needs.filter((n) => !n.done);
  const measured = (Object.keys(state.profile.fit) as Category[]).filter(
    (c) => Object.keys(state.profile.fit[c] ?? {}).length > 0,
  );

  return (
    <div className="profile-menu" ref={ref}>
      <button className="profile-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="avatar">{state.profile.name.charAt(0) || '?'}</span>
        profile{openNeeds.length > 0 && <sup>{openNeeds.length}</sup>}
      </button>
      {open && (
        <div className="popover">
          <div className="popover-head">
            <strong>{state.profile.name}</strong>
            <Link to="/profile">edit →</Link>
          </div>

          <div className="popover-section">
            <div className="label">shopping list</div>
            {openNeeds.length === 0 && <p className="muted small">nothing open.</p>}
            <ul className="plain">
              {openNeeds.slice(0, 5).map((need) => {
                const match = matchNeed(need, state.cart, state.wishlist, byId);
                return (
                  <li key={need.id} className="need-mini">
                    <span className={`dot dot-${match.status}`} />
                    <span className="grow">{need.note || CATEGORIES[need.category].label}</span>
                    <span className="muted small">{NEED_STATUS_LABEL[match.status]}</span>
                  </li>
                );
              })}
            </ul>
            <Link to="/profile?tab=list" className="small">
              open list →
            </Link>
          </div>

          <div className="popover-section">
            <div className="label">saved measurements</div>
            <p className="small">
              {measured.length ? measured.map((c) => CATEGORIES[c].label).join(', ') : <span className="muted">none yet</span>}
            </p>
            <Link to="/profile?tab=measurements" className="small">
              edit measurements →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
