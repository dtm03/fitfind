# fitfind

Filter clothes by **garment measurements** (chest width, length, shoulder, etc.) — not just S / M / L. Dark monospace UI, fit profile, wishlist, shopping list.

**No checkout on this site.** “Buy at …” sends you to `/retailer/:id` — a demo page that stands in for the partner’s product URL (`product.source.url`). A live product would use affiliate outbound links only.

This repo is a **front-end demo** with a fictional catalogue in `src/data/products.ts` (per-size cm measurements, placeholder product art).

## Roadmap (not built here)

The idea for a real product:

1. **Affiliate / partner feeds** (e.g. Awin, brand APIs) for listings, prices, images, and **outbound links** you are allowed to use.
2. Enrich or filter only where **garment measurements** exist — many affiliates only expose S/M/L or body size charts, not flat cm specs.
3. **Web scraping** is generally **not allowed** under retailer terms, breaks often (bot blocks), and is only useful as a **small local experiment** on your own machine. The Playwright scraper in `src/measurement_scraper.py` is optional R&D, not part of the demo shop.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
```

Stack: React 19, TypeScript, Vite, React Router. Font: JetBrains Mono.

## Layout

- `src/data/products.ts` — demo catalogue
- `src/lib/fit.ts` — fit score vs your target measurements
- `src/lib/filter.ts` — brand, size, price, cm ranges
- `src/measurement_scraper.py` — optional local scraper prototype (not used by the UI by default)

Optional scraper setup: `pip install -r requirements-scraper.txt` and `playwright install chromium`. Parser tests: `python -m pytest tests/test_parser.py`.
