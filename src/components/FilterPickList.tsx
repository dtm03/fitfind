import { cls } from '../lib/format';

export type PickOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label: string;
  options: PickOption<T>[];
  selected: T[];
  onChange: (next: T[]) => void;
  placeholder?: string;
};

export function FilterPickList<T extends string>({
  label,
  options,
  selected,
  onChange,
  placeholder = 'add…',
}: Props<T>) {
  const available = options.filter((o) => !selected.includes(o.value));

  return (
    <div className={cls('filter-group', !label && 'filter-group-inset')}>
      {label && <div className="label">{label}</div>}
      <select
        className="filter-pick"
        value=""
        disabled={!available.length}
        onChange={(e) => {
          const v = e.target.value as T;
          if (v) onChange([...selected, v]);
        }}
        aria-label={`add ${label}`}
      >
        <option value="">{available.length ? placeholder : 'all selected'}</option>
        {available.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {selected.length > 0 && (
        <div className="picked-tags">
          {selected.map((v) => {
            const opt = options.find((o) => o.value === v);
            return (
              <button
                key={v}
                type="button"
                className={cls('picked-tag')}
                onClick={() => onChange(selected.filter((x) => x !== v))}
                aria-label={`remove ${opt?.label ?? v}`}
              >
                {opt?.label ?? v}
                <span aria-hidden>×</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}