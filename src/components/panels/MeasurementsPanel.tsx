import { NumberInput } from '../NumberInput';
import { CATEGORIES, CATEGORY_ORDER, MEASUREMENTS, SIZES } from '../../data/categories';
import { cls } from '../../lib/format';
import { useStore } from '../../store/store';
import type { CategoryGroup } from '../../types';

export function MeasurementsPanel() {
  const { state, dispatch } = useStore();
  const { profile } = state;

  return (
    <div className="measurements-popover-content">
      <div className="panel tolerance-compact tolerance-popover-row">
        <div className="tolerance-slider-col">
          <label className="field tolerance-field">
            <span>
              tolerance: ±{profile.tolerance.toLocaleString('en-GB')} cm{' '}
              <span className="muted">(lengths ±{(profile.tolerance * 1.5).toLocaleString('en-GB')} cm)</span>
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
        </div>
        <div className="tolerance-sizes-col">
          {(['top', 'bottom'] as CategoryGroup[]).map((group) => (
            <label key={group} className="field field-inline field-size-pref">
              <span>usual size ({group === 'top' ? 'tops' : 'bottoms'})</span>
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
      </div>

      <div className="measure-cards measure-cards-compact">
        {CATEGORY_ORDER.map((category) => {
          const target = profile.fit[category] ?? {};
          const filled = Object.keys(target).length;
          return (
            <div key={category} className={cls('panel', filled > 0 && 'panel-active')}>
              <div className="row-between">
                <h3>{CATEGORIES[category].label}</h3>
                {filled > 0 && (
                  <button className="link-btn" onClick={() => dispatch({ type: 'profile/clearCategory', category })}>
                    clear
                  </button>
                )}
              </div>
              {CATEGORIES[category].keys.map((key) => (
                <label key={key} className="field field-inline" title={MEASUREMENTS[key].hint}>
                  <span>{MEASUREMENTS[key].label}</span>
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

      <button
        type="button"
        className="link-btn panel-reset"
        onClick={() =>
          confirm('Reset all local data (measurements, list, wishlist)?') && dispatch({ type: 'reset' })
        }
      >
        reset all local data
      </button>
    </div>
  );
}