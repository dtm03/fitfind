import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FilterBar } from '../components/FilterBar';
import { ProductCard } from '../components/ProductCard';
import { isCategory } from '../data/categories';
import { applyFilters, DEFAULT_FILTERS, type Filters } from '../lib/filter';
import { useProducts } from '../store/products';
import { useStore } from '../store/store';

export function Shop() {
  const { products, brands, loading, error } = useProducts();
  const { state } = useStore();
  const [params] = useSearchParams();
  const cat = params.get('cat');

  const [filters, setFilters] = useState<Filters>(() => ({
    ...DEFAULT_FILTERS,
    categories: isCategory(cat) ? [cat] : [],
  }));

  useEffect(() => {
    if (isCategory(cat)) setFilters((f) => ({ ...f, categories: [cat], ranges: {} }));
  }, [cat]);

  const results = useMemo(() => applyFilters(products, filters, state.profile), [products, filters, state.profile]);
  const hasAnyMeasurements = Object.values(state.profile.fit).some((m) => m && Object.keys(m).length > 0);

  return (
    <div className="page">
      <section className="hero">
        <h1>
          kleidung nach <em>maß</em> finden.
        </h1>
        <p className="muted">
          filtere nach schulterbreite, länge, bundweite – nicht nur nach S, M, L. hinterlege deine maße und jedes teil
          bekommt einen fit-score.
        </p>
      </section>

      <FilterBar filters={filters} onChange={setFilters} brands={brands} profile={state.profile} />

      {!hasAnyMeasurements && (
        <p className="notice">
          noch keine maße hinterlegt. <Link to="/profile?tab=masse">maße eintragen →</Link>
        </p>
      )}

      <div className="results-head">
        <span>
          <span className="prompt">&gt;</span> {loading ? 'lade katalog…' : `${results.length} ergebnisse`}
          <span className="cursor">_</span>
        </span>
      </div>

      {error && <p className="notice">fehler beim laden: {error}</p>}

      {!loading && results.length === 0 && (
        <div className="empty">
          <p>keine treffer mit diesen filtern.</p>
          <button className="btn" onClick={() => setFilters({ ...DEFAULT_FILTERS, sort: filters.sort })}>
            filter zurücksetzen
          </button>
        </div>
      )}

      <div className="grid">
        {results.map((r) => (
          <ProductCard key={r.product.id} product={r.product} fit={r.fit} matchedSizes={r.matchedSizes} />
        ))}
      </div>
    </div>
  );
}
