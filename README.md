# fitfind

Filter clothes by **garment measurements** (chest width, length, shoulder, etc.) instead of just S / M / L. Dark monospace UI, wishlist, shopping list.

> **This is a demo project.** All products are fictional. See [Why this is a demo](#why-this-is-a-demo).

## Motivation

I kept buying clothes in "my size" that didn't actually fit. A size label tells you very little: an M from one brand is an L from another. What I really wanted was the flat garment measurements in cm, so I could compare them against clothes that already fit me.

## The idea

fitfind would let you:

- search clothes by exact measurements (chest width, length, shoulder, ...) across many retailers,
- see sustainability information, e.g. whether an item was produced fairly,
- click through to the retailer's own page via an **affiliate link** and buy there.

That way you could buy what actually fits and matches your values, independent of any single retailer or brand.

## Why this is a demo

While building it, I found the idea doesn't work with real data:

- **Most retailers don't have garment measurements.** Many only publish S/M/L or body-size charts, not flat cm specs.
- **Those that do rarely share them.** The data isn't exposed through public feeds or APIs.
- **Scraping isn't an option.** It's generally forbidden by retailer terms, breaks often (bot blocks), and wouldn't be a legitimate basis for a real product.

So this repo is a **front-end demo** with a fictional catalogue in `src/data/products.ts` (per-size cm measurements, placeholder product art).

- **No checkout on this site.** "Buy at …" leads to `/retailer/:id`, a demo page standing in for the partner's product URL (`product.source.url`). A live product would only use affiliate outbound links.

## Roadmap (not built here)

How a real version could work:

1. **Affiliate / partner feeds** (e.g. Awin, brand APIs) for listings, prices, images, and outbound links I'm allowed to use.
2. **Enrich or filter only where garment measurements exist.** Today that's rare, so it would need retailers or brands to publish them.
3. **Sustainability data** (e.g. fair production) from reliable sources or certifications.
4. **Scraping** only as a small local experiment. The Playwright scraper in `src/measurement_scraper.py` is optional R&D, not part of the demo shop.

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
