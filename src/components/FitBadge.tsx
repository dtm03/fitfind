import { fitLevel, FIT_LABEL, type FitResult } from '../lib/fit';

export function FitBadge({ fit, showLabel = false }: { fit: FitResult | null; showLabel?: boolean }) {
  if (!fit) return null;
  const level = fitLevel(fit.score);
  return (
    <span className={`fit fit-${level}`} title={`${FIT_LABEL[level]} in size ${fit.size}`}>
      fit {fit.score} · {fit.size}
      {showLabel && <> · {FIT_LABEL[level]}</>}
    </span>
  );
}
