import { useState, type ReactNode } from "react";
import {
  CATEGORIES,
  CATEGORY_ORDER,
  MEASUREMENTS,
  SIZES,
} from "../data/categories";
import { ETHICS_LABELS, FIBERS } from "../data/materials";
import {
  countActive,
  DEFAULT_FILTERS,
  type Filters,
  type Range,
  type SortKey,
} from "../lib/filter";
import { cls } from "../lib/format";
import type {
  Category,
  CategoryGroup,
  Fiber,
  MeasurementKey,
  Profile,
} from "../types";
import { FilterPickList } from "./FilterPickList";
import { NumberInput } from "./NumberInput";

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  brands: string[];
  origins: string[];
  profile: Profile;
}

const SORTS: Record<SortKey, string> = {
  fit: "best fit",
  "price-asc": "price ↑",
  "price-desc": "price ↓",
  name: "name a–z",
};

const LENGTH_KEYS: MeasurementKey[] = ["length", "sleeve", "inseam"];

const FIBER_ORDER: Fiber[] = [
  "cotton",
  "wool",
  "linen",
  "polyester",
  "elastane",
  "viscose",
  "nylon",
];

type EthicsFilterKey =
  | "sustainableOnly"
  | "fairTradeOnly"
  | "organicOnly"
  | "recycledOnly";

const ETHICS_PICKS: { key: EthicsFilterKey; label: string }[] = [
  { key: "sustainableOnly", label: "sustainable picks" },
  { key: "fairTradeOnly", label: ETHICS_LABELS.fairTrade },
  { key: "organicOnly", label: ETHICS_LABELS.organic },
  { key: "recycledOnly", label: ETHICS_LABELS.recycled },
];

export function FilterBar({
  filters,
  onChange,
  brands,
  origins,
  profile,
}: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  const groups: CategoryGroup[] = filters.categories.length
    ? [...new Set(filters.categories.map((c) => CATEGORIES[c].group))]
    : ["top", "bottom"];

  const keyGroups = groups.map((group) => {
    const cats = filters.categories.length
      ? filters.categories.filter((c) => CATEGORIES[c].group === group)
      : CATEGORY_ORDER.filter((c) => CATEGORIES[c].group === group);
    return {
      group,
      keys: [...new Set(cats.flatMap((c) => CATEGORIES[c].keys))],
    };
  });

  const single =
    filters.categories.length === 1 ? filters.categories[0] : undefined;
  const target = single ? profile.fit[single] : undefined;
  const canUseProfile = !!target && Object.keys(target).length > 0;

  const setRange = (key: MeasurementKey, patch: Range) => {
    const next = { ...filters.ranges[key], ...patch };
    set({ ranges: { ...filters.ranges, [key]: next } });
  };

  const applyProfileRanges = () => {
    if (!target) return;
    const ranges: Filters["ranges"] = {};
    for (const [key, value] of Object.entries(target) as [
      MeasurementKey,
      number,
    ][]) {
      const tol = LENGTH_KEYS.includes(key)
        ? profile.tolerance * 1.5
        : profile.tolerance;
      ranges[key] = { min: value - tol, max: value + tol };
    }
    set({ ranges });
  };

  const activeRangeCount = Object.values(filters.ranges).filter(
    (r) => r && (r.min != null || r.max != null),
  ).length;
  const active = countActive(filters);

  const [measOpen, setMeasOpen] = useState(activeRangeCount > 0);

  const sizeOptions = [...new Set(groups.flatMap((g) => SIZES[g]))];
  const activeEthicsKeys = ETHICS_PICKS.filter((o) => filters[o.key]).map(
    (o) => o.key,
  );

  const addEthics = (key: EthicsFilterKey) => set({ [key]: true });
  const removeEthics = (key: EthicsFilterKey) => set({ [key]: false });

  return (
    <section className="filters" aria-label="filter">
      <div className="filters-row">
        <label className="search">
          <span className="prompt">&gt;</span>
          <input
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="search name, brand, material…"
            aria-label="search"
          />
        </label>
        <select
          value={filters.sort}
          onChange={(e) => set({ sort: e.target.value as SortKey })}
          aria-label="sort"
        >
          {(Object.keys(SORTS) as SortKey[]).map((key) => (
            <option key={key} value={key}>
              {SORTS[key]}
            </option>
          ))}
        </select>
        <label className="filter-check">
          <input
            type="checkbox"
            checked={filters.fitOnly}
            onChange={(e) => set({ fitOnly: e.target.checked })}
          />
          fits me
        </label>
        <label className="filter-check">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => set({ inStockOnly: e.target.checked })}
          />
          in stock only
        </label>
        {active > 0 && (
          <button
            className="link-btn"
            onClick={() => onChange({ ...DEFAULT_FILTERS, sort: filters.sort })}
          >
            clear filters ({active})
          </button>
        )}
      </div>

      <div
        className={cls(
          "measure-panel",
          "measure-panel-primary",
          !measOpen && "is-collapsed",
        )}
      >
        <div className="measure-panel-head">
          <button
            type="button"
            className="measure-panel-trigger"
            onClick={() => setMeasOpen((o) => !o)}
            aria-expanded={measOpen}
            aria-controls="measure-panel-body"
          >
            <span className="prompt">&gt;</span>
            <span className="measure-panel-title">
              measurements (cm)
              {activeRangeCount > 0 && (
                <span className="muted"> · {activeRangeCount} active</span>
              )}
            </span>
          </button>
          <span className="muted small measure-panel-hint">
            flat garment width / length
          </span>
        </div>
        {measOpen && (
          <div id="measure-panel-body" className="measure-panel-body">
            <div className="measure-actions">
              <button
                className="btn btn-sm"
                disabled={!canUseProfile}
                onClick={applyProfileRanges}
              >
                use profile (± tolerance)
              </button>
              {!single && (
                <span className="muted small">
                  pick exactly one category to apply your saved measurements.
                </span>
              )}
              {single && !canUseProfile && (
                <span className="muted small">
                  no saved measurements for {CATEGORIES[single].label} yet.
                </span>
              )}
              {activeRangeCount > 0 && (
                <button
                  className="link-btn"
                  onClick={() => set({ ranges: {} })}
                >
                  reset measurements
                </button>
              )}
            </div>
            {keyGroups.map(({ group, keys }) => (
              <div key={group} className="measure-group">
                <div className="label">
                  {group === "top" ? "tops" : "bottoms"}
                </div>
                <div className="measure-grid">
                  {keys.map((key) => (
                    <div
                      key={key}
                      className="measure-field"
                      title={MEASUREMENTS[key].hint}
                    >
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
      </div>

      <div className="filters-grid filters-grid-secondary filters-strip">
        <FilterPickList<Category>
          label="category"
          placeholder="add category…"
          options={CATEGORY_ORDER.map((c) => ({
            value: c,
            label: CATEGORIES[c].label,
          }))}
          selected={filters.categories}
          onChange={(categories) => set({ categories })}
        />

        <FilterPickList
          label="size"
          placeholder="add size…"
          options={sizeOptions.map((s) => ({ value: s, label: s }))}
          selected={filters.sizes}
          onChange={(sizes) => set({ sizes })}
        />

        <FilterPickList
          label="brand"
          placeholder="add brand…"
          options={brands.map((b) => ({ value: b, label: b.toLowerCase() }))}
          selected={filters.brands}
          onChange={(brandsSel) => set({ brands: brandsSel })}
        />

        <FilterGroup label="price €" className="filter-group-price">
          <div className="range">
            <NumberInput
              value={filters.priceMin}
              onChange={(v) => set({ priceMin: v })}
              placeholder="min"
              min={0}
              aria-label="price min"
            />
            <span className="muted">–</span>
            <NumberInput
              value={filters.priceMax}
              onChange={(v) => set({ priceMax: v })}
              placeholder="max"
              min={0}
              aria-label="price max"
            />
          </div>
        </FilterGroup>

        <div className="filter-group filter-group-material">
          <div className="label">material</div>
          <FilterPickList
            label=""
            placeholder="add fibre…"
            options={FIBER_ORDER.map((f) => ({ value: f, label: FIBERS[f] }))}
            selected={filters.fibers}
            onChange={(fibers) => set({ fibers })}
          />
        </div>

        <FilterPickList
          label="made in"
          placeholder="add country…"
          options={origins.map((o) => ({ value: o, label: o }))}
          selected={filters.origins}
          onChange={(originsSel) => set({ origins: originsSel })}
        />

        <div className="filter-group">
          <div className="label">sustainable</div>
          <select
            className="filter-pick"
            value=""
            disabled={activeEthicsKeys.length >= ETHICS_PICKS.length}
            onChange={(e) => {
              const key = e.target.value as EthicsFilterKey;
              if (key) addEthics(key);
            }}
            aria-label="add sustainability filter"
          >
            <option value="">add criterion…</option>
            {ETHICS_PICKS.filter((o) => !filters[o.key]).map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
          {activeEthicsKeys.length > 0 && (
            <div className="picked-tags">
              {activeEthicsKeys.map((key) => {
                const opt = ETHICS_PICKS.find((o) => o.key === key);
                return (
                  <button
                    key={key}
                    type="button"
                    className="picked-tag"
                    onClick={() => removeEthics(key)}
                    aria-label={`remove ${opt?.label ?? key}`}
                  >
                    {opt?.label ?? key}
                    <span aria-hidden>×</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FilterGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cls('filter-group', className)}>
      {label && <div className="label">{label}</div>}
      {children}
    </div>
  );
}
