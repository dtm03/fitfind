import { useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { NumberInput } from '../components/NumberInput';
import { ProductCard } from '../components/ProductCard';
import { CATEGORIES, CATEGORY_ORDER, MEASUREMENTS, SIZES } from '../data/categories';
import { bestFit, fitLevel, type FitResult } from '../lib/fit';
import { cls, formatPrice } from '../lib/format';
import { matchNeed, NEED_STATUS_LABEL } from '../lib/needs';
import { useProducts } from '../store/products';
import { useStore } from '../store/store';
import type { Category, CategoryGroup, Product } from '../types';

const TABS = {
  masse: 'maße',
  liste: 'einkaufsliste',
  marken: 'marken',
  vorschlaege: 'vorschläge',
  konto: 'konto',
} as const;
type Tab = keyof typeof TABS;

export function Profile() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const tab: Tab = raw && raw in TABS ? (raw as Tab) : 'masse';
  const { state } = useStore();

  return (
    <div className="page">
      <div className="profile-head">
        <span className="avatar avatar-lg">{state.profile.name.charAt(0) || '?'}</span>
        <div>
          <h1>{state.profile.name}</h1>
          <p className="muted small">deine daten bleiben lokal in diesem browser gespeichert.</p>
        </div>
      </div>
      <nav className="tabs">
        {(Object.keys(TABS) as Tab[]).map((t) => (
          <button key={t} className={cls(t === tab && 'on')} onClick={() => setParams({ tab: t })}>
            {TABS[t]}
          </button>
        ))}
      </nav>
      {tab === 'masse' && <MeasurementsTab />}
      {tab === 'liste' && <NeedsTab />}
      {tab === 'marken' && <BrandsTab />}
      {tab === 'vorschlaege' && <SuggestionsTab />}
      {tab === 'konto' && <AccountTab />}
    </div>
  );
}

function MeasurementsTab() {
  const { state, dispatch } = useStore();
  const { profile } = state;

  return (
    <section className="stack">
      <p className="muted">
        tipp: leg ein kleidungsstück, das dir richtig gut passt, flach hin und miss es aus. das sind deine zielmaße –
        jedes produkt wird dagegen verglichen.
      </p>

      <div className="panel tolerance">
        <label className="field">
          <span>
            toleranz: ±{profile.tolerance.toLocaleString('de-DE')} cm{' '}
            <span className="muted">(längen ±{(profile.tolerance * 1.5).toLocaleString('de-DE')} cm)</span>
          </span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={profile.tolerance}
            onChange={(e) => dispatch({ type: 'profile/tolerance', value: Number(e.target.value) })}
          />
        </label>
        {(['top', 'bottom'] as CategoryGroup[]).map((group) => (
          <label key={group} className="field field-inline">
            <span>übliche größe {group === 'top' ? 'oberteile' : 'unterteile'}</span>
            <select
              value={profile.preferredSizes[group]}
              onChange={(e) => dispatch({ type: 'profile/preferredSize', group, size: e.target.value })}
            >
              {SIZES[group].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="measure-cards">
        {CATEGORY_ORDER.map((category) => {
          const target = profile.fit[category] ?? {};
          const filled = Object.keys(target).length;
          return (
            <div key={category} className={cls('panel', filled > 0 && 'panel-active')}>
              <div className="row-between">
                <h3>{CATEGORIES[category].label}</h3>
                {filled > 0 && (
                  <button className="link-btn" onClick={() => dispatch({ type: 'profile/clearCategory', category })}>
                    leeren
                  </button>
                )}
              </div>
              {CATEGORIES[category].keys.map((key) => (
                <label key={key} className="field field-inline" title={MEASUREMENTS[key].hint}>
                  <span>
                    {MEASUREMENTS[key].label}
                    <span className="hint">{MEASUREMENTS[key].hint}</span>
                  </span>
                  <span className="unit-input">
                    <NumberInput
                      value={target[key]}
                      step={0.5}
                      min={0}
                      placeholder="—"
                      onChange={(value) => dispatch({ type: 'profile/measurement', category, key, value })}
                    />
                    cm
                  </span>
                </label>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function NeedsTab() {
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
    <section className="stack">
      <p className="muted">
        was brauchst du? fitfind zeigt dir, welche punkte schon im warenkorb oder auf der merkliste sind.
      </p>
      <form className="need-form" onSubmit={add}>
        <select value={category} onChange={(e) => setCategory(e.target.value as Category)} aria-label="kategorie">
          {CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {CATEGORIES[c].label}
            </option>
          ))}
        </select>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="z. b. schwarzer hoodie, schwer" aria-label="notiz" />
        <NumberInput value={maxPrice} onChange={setMaxPrice} placeholder="max €" min={0} aria-label="budget" />
        <button className="btn btn-primary">hinzufügen</button>
      </form>

      {sorted.length === 0 && <p className="muted">deine liste ist leer.</p>}
      <ul className="plain needs-list">
        {sorted.map((need) => {
          const match = matchNeed(need, state.cart, state.wishlist, byId);
          return (
            <li key={need.id} className={cls('need', need.done && 'need-done')}>
              <input
                type="checkbox"
                checked={need.done}
                onChange={() => dispatch({ type: 'needs/toggleDone', id: need.id })}
                aria-label="erledigt"
              />
              <div className="grow">
                <div>{need.note || CATEGORIES[need.category].label}</div>
                <div className="muted small">
                  {CATEGORIES[need.category].label}
                  {need.maxPrice != null && ` · bis ${formatPrice(need.maxPrice)}`}
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
                  suchen
                </Link>
              )}
              <button className="link-btn" onClick={() => dispatch({ type: 'needs/remove', id: need.id })} aria-label="löschen">
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

interface Scored {
  product: Product;
  fit: FitResult;
}

function useScoredProducts(): Scored[] {
  const { products } = useProducts();
  const { state } = useStore();
  return useMemo(
    () =>
      products.flatMap((product) => {
        const fit = bestFit(product, state.profile);
        return fit ? [{ product, fit }] : [];
      }),
    [products, state.profile],
  );
}

function bar(score: number): string {
  const filled = Math.round(score / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

function BrandsTab() {
  const scored = useScoredProducts();

  const brands = useMemo(() => {
    const map = new Map<string, Scored[]>();
    for (const s of scored) map.set(s.product.brand, [...(map.get(s.product.brand) ?? []), s]);
    return [...map.entries()]
      .map(([brand, items]) => {
        const avg = Math.round(items.reduce((sum, i) => sum + i.fit.score, 0) / items.length);
        const sizesByCategory = new Map<Category, string[]>();
        for (const i of items) {
          sizesByCategory.set(i.product.category, [...(sizesByCategory.get(i.product.category) ?? []), i.fit.size]);
        }
        const sizes = [...sizesByCategory.entries()].map(([category, list]) => {
          const counts = new Map<string, number>();
          for (const s of list) counts.set(s, (counts.get(s) ?? 0) + 1);
          const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
          return `${CATEGORIES[category].label}: ${top}`;
        });
        return { brand, avg, count: items.length, sizes };
      })
      .sort((a, b) => b.avg - a.avg);
  }, [scored]);

  if (brands.length === 0) {
    return (
      <p className="muted">
        hinterlege zuerst <Link to="/profile?tab=masse">deine maße</Link>, dann zeigen wir dir, welche marken dir liegen.
      </p>
    );
  }

  return (
    <section className="stack">
      <p className="muted">durchschnittlicher fit-score pro marke, basierend auf deinen hinterlegten kategorien.</p>
      <ul className="plain brand-list">
        {brands.map((b) => (
          <li key={b.brand}>
            <span className="brand-name">{b.brand.toLowerCase()}</span>
            <span className={`bar fit-text-${fitLevel(b.avg)}`}>{bar(b.avg)}</span>
            <span className="brand-score">{b.avg}</span>
            <span className="muted small">
              {b.count} teile · deine größe: {b.sizes.join(' · ')}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SuggestionsTab() {
  const scored = useScoredProducts();
  const top = [...scored].sort((a, b) => b.fit.score - a.fit.score).slice(0, 8);

  if (top.length === 0) {
    return (
      <p className="muted">
        hinterlege zuerst <Link to="/profile?tab=masse">deine maße</Link>, um vorschläge zu bekommen.
      </p>
    );
  }

  return (
    <section className="stack">
      <p className="muted">die teile, die deinen zielmaßen am nächsten kommen.</p>
      <div className="grid">
        {top.map(({ product, fit }) => (
          <ProductCard key={product.id} product={product} fit={fit} />
        ))}
      </div>
    </section>
  );
}

function AccountTab() {
  const { state, dispatch } = useStore();

  return (
    <section className="stack narrow-left">
      <label className="field">
        <span>anzeigename</span>
        <input value={state.profile.name} onChange={(e) => dispatch({ type: 'profile/name', name: e.target.value })} />
      </label>

      <div>
        <h3>bestellungen</h3>
        {state.orders.length === 0 && <p className="muted small">noch keine bestellungen.</p>}
        <ul className="plain orders">
          {state.orders.map((o) => (
            <li key={o.id} className="row-between">
              <span>
                {o.id} <span className="muted">· {new Date(o.createdAt).toLocaleDateString('de-DE')}</span>
              </span>
              <span className="muted small">{o.lines.reduce((n, l) => n + l.qty, 0)} artikel</span>
              <span>{formatPrice(o.total)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <button
          className="btn btn-danger"
          onClick={() => confirm('alle lokalen daten (maße, liste, warenkorb, merkliste) zurücksetzen?') && dispatch({ type: 'reset' })}
        >
          daten zurücksetzen
        </button>
      </div>
    </section>
  );
}
