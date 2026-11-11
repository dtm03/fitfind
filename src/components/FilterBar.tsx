import { useState, type ReactNode } from 'react';
import { CATEGORIES, CATEGORY_ORDER, MEASUREMENTS, SIZES } from '../data/categories';
import { countActive, DEFAULT_FILTERS, type Filters, type Range, type SortKey } from '../lib/filter';
import { cls } from '../lib/format';
import type { CategoryGroup, MeasurementKey, Profile } from '../types';
import { NumberInput } from './NumberInput';

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  brands: string[];
  profile: Profile;
}

const SORTS: Record<SortKey, string> = {
  fit: 'beste passform',
  'price-asc': 'preis ↑',
  'price-desc': 'preis ↓',
  name: 'name a–z',
};

const LENGTH_KEYS: MeasurementKey[] = ['length', 'sleeve', 'inseam'];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function FilterBar({ filters, onChange, brands, profile }: Props) {
  const [showMeasurements, setShowMeasurements] = useState(false);
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  const groups: CategoryGroup[] = filters.categories.length
    ? [...new Set(filters.categories.map((c) => CATEGORIES[c].group))]
    : ['top', 'bottom'];

  const keyGroups = groups.map((group) => {
    const cats = filters.categories.length
      ? filters.categories.filter((c) => CATEGORIES[c].group === group)
      : CATEGORY_ORDER.filter((c) => CATEGORIES[c].group === group);
    return { group, keys: [...new Set(cats.flatMap((c) => CATEGORIES[c].keys))] };
  });

  const single = filters.categories.length === 1 ? filters.categories[0] : undefined;
  const target = single ? profile.fit[single] : undefined;
  const canUseProfile = !!target && Object.keys(target).length > 0;

  const setRange = (key: MeasurementKey, patch: Range) => {
    const next = { ...filters.ranges[key], ...patch };
    set({ ranges: { ...filters.ranges, [key]: next } });
  };

  const applyProfileRanges = () => {
    if (!target) return;
    const ranges: Filters['ranges'] = {};
    for (const [key, value] of Object.entries(target) as [MeasurementKey, number][]) {
      const tol = LENGTH_KEYS.includes(key) ? profile.tolerance * 1.5 : profile.tolerance;
      ranges[key] = { min: value - tol, max: value + tol };
    }
    set({ ranges });
  };

  const activeRangeCount = Object.values(filters.ranges).filter((r) => r && (r.min != null || r.max != null)).length;
  const active = countActive(filters);

  return (
    <section className="filters" aria-label="filter">
      <div className="filters-row">
        <label className="search">
          <span className="prompt">&gt;</span>
          <input
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="suche nach name, marke, material…"
            aria-label="suche"
          />
        </label>
        <select value={filters.sort} onChange={(e) => set({ sort: e.target.value as SortKey })} aria-label="sortierung">
          {(Object.keys(SORTS) as SortKey[]).map((key) => (
            <option key={key} value={key}>
              {SORTS[key]}
            </option>
          ))}
        </select>
        <button className={cls('chip', filters.fitOnly && 'on')} onClick={() => set({ fitOnly: !filters.fitOnly })}>
          passt mir
        </button>
        <button
          className={cls('chip', filters.inStockOnly && 'on')}
          onClick={() => set({ inStockOnly: !filters.inStockOnly })}
        >
          nur verfügbar
        </button>
        {active > 0 && (
          <button className="link-btn" onClick={() => onChange({ ...DEFAULT_FILTERS, sort: filters.sort })}>
            alle filter löschen ({active})
          </button>
        )}
      </div>

      <div className="filters-grid">
        <FilterGroup label="kategorie">
          {CATEGORY_ORDER.map((c) => (
            <button
              key={c}
              className={cls('chip', filters.categories.includes(c) && 'on')}
              onClick={() => set({ categories: toggle(filters.categories, c) })}
            >
              {CATEGORIES[c].label}
            </button>
          ))}
        </FilterGroup>

        <FilterGroup label="größe">
          {groups.flatMap((g) =>
            SIZES[g].map((s) => (
              <button
                key={s}
                className={cls('chip', 'chip-sq', filters.sizes.includes(s) && 'on')}
                onClick={() => set({ sizes: toggle(filters.sizes, s) })}
              >
                {s}
              </button>
            )),
          )}
        </FilterGroup>

        <FilterGroup label="marke">
          {brands.map((b) => (
            <button
              key={b}
              className={cls('chip', filters.brands.includes(b) && 'on')}
              onClick={() => set({ brands: toggle(filters.brands, b) })}
            >
              {b.toLowerCase()}
            </button>
          ))}
        </FilterGroup>

        <FilterGroup label="preis €">
          <div className="range">
            <NumberInput value={filters.priceMin} onChange={(v) => set({ priceMin: v })} placeholder="min" min={0} aria-label="preis min" />
            <span className="muted">–</span>
            <NumberInput value={filters.priceMax} onChange={(v) => set({ priceMax: v })} placeholder="max" min={0} aria-label="preis max" />
          </div>
        </FilterGroup>
      </div>

      <button className="measure-toggle" onClick={() => setShowMeasurements((s) => !s)} aria-expanded={showMeasurements}>
        {showMeasurements ? '▾' : '▸'} maße in cm{activeRangeCount > 0 && ` (${activeRangeCount} aktiv)`}
        <span className="muted"> — filtere nach den echten maßen des kleidungsstücks</span>
      </button>

      {showMeasurements && (
        <div className="measure-panel">
          <div className="measure-actions">
            <button className="btn btn-sm" disabled={!canUseProfile} onClick={applyProfileRanges}>
              aus profil übernehmen (± toleranz)
            </button>
            {!single && <span className="muted small">wähle genau eine kategorie, um deine maße zu übernehmen.</span>}
            {single && !canUseProfile && <span className="muted small">für {CATEGORIES[single].label} sind noch keine maße hinterlegt.</span>}
            {activeRangeCount > 0 && (
              <button className="link-btn" onClick={() => set({ ranges: {} })}>
                maße zurücksetzen
              </button>
            )}
          </div>
          {keyGroups.map(({ group, keys }) => (
            <div key={group} className="measure-group">
              <div className="label">{group === 'top' ? 'oberteile' : 'unterteile'}</div>
              <div className="measure-grid">
                {keys.map((key) => (
                  <div key={key} className="measure-field" title={MEASUREMENTS[key].hint}>
                    <span>{MEASUREMENTS[key].label}</span>
                    <div className="range">
                      <NumberInput
                        value={filters.ranges[key]?.min}
                        onChange={(v) => setRange(key, { min: v })}
                        placeholder="min"
                        step={0.5}
                        aria-label={`${MEASUREMENTS[key].label} min`}
                      />
                      <span className="muted">–</span>
                      <NumberInput
                        value={filters.ranges[key]?.max}
                        onChange={(v) => setRange(key, { max: v })}
                        placeholder="max"
                        step={0.5}
                        aria-label={`${MEASUREMENTS[key].label} max`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="filter-group">
      <div className="label">{label}</div>
      <div className="chips">{children}</div>
    </div>
  );
}
