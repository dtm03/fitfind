const priceFormat = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' });

export function formatPrice(value: number): string {
  return priceFormat.format(value);
}

export function formatCm(value: number | undefined): string {
  if (value == null) return '—';
  return value.toLocaleString('en-GB', { maximumFractionDigits: 1 });
}

export function formatDiff(value: number): string {
  if (value === 0) return '±0';
  const abs = Math.abs(value).toLocaleString('en-GB', { maximumFractionDigits: 1 });
  return value > 0 ? `+${abs}` : `−${abs}`;
}

export function cls(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
