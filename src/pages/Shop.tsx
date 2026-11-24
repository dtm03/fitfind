import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FilterBar } from "../components/FilterBar";
import { ProductCard } from "../components/ProductCard";
import { isCategory } from "../data/categories";
import { applyFilters, DEFAULT_FILTERS, type Filters } from "../lib/filter";
import { useProducts } from "../store/products";
import { useStore } from "../store/store";

export function Shop() {
  const { products, brands, origins, loading, error } = useProducts();
  const { state } = useStore();
  const [params] = useSearchParams();
  const cat = params.get("cat");

  const [filters, setFilters] = useState<Filters>(() => ({
    ...DEFAULT_FILTERS,
    categories: isCategory(cat) ? [cat] : [],
  }));

  useEffect(() => {
    if (isCategory(cat))
      setFilters((f) => ({ ...f, categories: [cat], ranges: {} }));
  }, [cat]);

  const results = useMemo(
    () => applyFilters(products, filters, state.profile),
    [products, filters, state.profile],
  );
  const hasAnyMeasurements = Object.values(state.profile.fit).some(
    (m) => m && Object.keys(m).length > 0,
  );

  return (
    <div className="page">
      <section className="hero">
        <h1>
          find clothes by <em>measurement</em>.
        </h1>
      </section>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        brands={brands}
        origins={origins}
        profile={state.profile}
      />

      {!hasAnyMeasurements && (
        <p className="notice">No target measurements saved yet. Use measurements in the header.</p>
      )}

      <div className="results-head">
        <span>
          <span className="prompt">&gt;</span>{" "}
          {loading ? "loading catalogue…" : `${results.length} results`}
          <span className="cursor">_</span>
        </span>
      </div>

      {error && <p className="notice">load error: {error}</p>}

      {!loading && results.length === 0 && (
        <div className="empty">
          <p>No matches for these filters.</p>
          <button
            className="btn"
            onClick={() =>
              setFilters({ ...DEFAULT_FILTERS, sort: filters.sort })
            }
          >
            reset filters
          </button>
        </div>
      )}

      <div className="grid">
        {results.map((r) => (
          <ProductCard
            key={r.product.id}
            product={r.product}
            fit={r.fit}
            matchedSizes={r.matchedSizes}
          />
        ))}
      </div>
    </div>
  );
}
