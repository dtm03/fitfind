#!/usr/bin/env python3
"""
Garment-measurement scraper (MVP) -- built for Zalando product pages.

Setup:
    pip install playwright
    playwright install chromium

Usage:
    # 1) Check what a single product page exposes (saves HTML + screenshot + parsed result)
    python measurement_scraper.py inspect "https://www.zalando.de/<some-tshirt>.html"

    # 2) Scrape a category listing (e.g. men's t-shirts), a few pages, limited number of products
    python measurement_scraper.py scrape "https://www.zalando.de/herren-t-shirts/" --pages 2 --limit 30

    # 3) Query the local database by measurements (cm)
    python measurement_scraper.py query --chest-width-min 52 --chest-width-max 56 --length-min 68

Notes:
- I could not run this against the live site, so selectors/heuristics may need tuning.
  Start with `inspect` and look at the output before scraping in bulk.
- Keep volume low and the delay generous. Check the site's terms before using this beyond a prototype.
"""

import argparse
import hashlib
import json
import random
import re
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse, urlunparse
from urllib.robotparser import RobotFileParser

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "measurements.db"
OUT_DIR = ROOT / "inspect_output"
CATALOG_PATH = ROOT / "public" / "catalog.json"

BLOCKED_MARKERS = (
    "die website ist derzeit nicht erreichbar",
    "website is currently unavailable",
    "access denied",
    "captcha",
    "bot detection",
)

# Zalando product URLs end like ...-ni122o0a6-a11.html (9 chars - 3 chars)
PRODUCT_URL_RE = re.compile(r"-[a-z0-9]{9}-[a-z0-9]{3}\.html$", re.I)

SIZE_RE = re.compile(r"^(XXS|XS|S|M|L|XL|XXL|XXXL|3XL|4XL|\d{2,3}(/\d{2,3})?)$", re.I)

# Order matters: more specific patterns first.
FIELD_PATTERNS = [
    ("sleeve_length", ["sleeve", "ärmel", "aermel"]),
    ("shoulder_width", ["shoulder", "schulter"]),
    ("chest_circumference", ["chest circ", "bust circ", "brustumfang", "chest girth"]),
    ("chest_width", ["chest width", "bust width", "brustbreite", "pit to pit", "width"]),
    ("chest", ["chest", "bust", "brust"]),
    ("waist", ["waist", "taille", "bund"]),
    ("hip", ["hip", "hüfte", "huefte"]),
    ("length", ["back length", "rückenlänge", "length", "länge", "laenge"]),
]

DEFAULT_CATEGORY = "https://www.zalando.at/herrenbekleidung-shirts/"

COOKIE_BUTTONS = [
    r"accept all",
    r"alle akzeptieren",
    r"alle cookies akzeptieren",
    r"akzeptieren",
    r"zustimmen",
    r"agree",
    r"einverstanden",
]
REVEAL_BUTTONS = [
    r"size guide",
    r"größentabelle",
    r"size & fit",
    r"größe & passform",
    r"measurements",
    r"maße",
    r"artikelmaße",
    r"produktmaße",
    r"passform",
    r"größenberatung",
    r"measured",
]

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)


# --------------------------------------------------------------------------- parsing

def normalize_field(label: str):
    l = label.lower().strip()
    for field, pats in FIELD_PATTERNS:
        if any(p in l for p in pats):
            return field
    return None


def parse_num_range(text: str):
    """'54', '54,5', '96-101' -> (min, max) or None"""
    m = re.search(r"(\d{2,3}(?:[.,]\d)?)(?:\s*[-–]\s*(\d{2,3}(?:[.,]\d)?))?", text)
    if not m:
        return None
    a = float(m.group(1).replace(",", "."))
    b = float(m.group(2).replace(",", ".")) if m.group(2) else a
    return (min(a, b), max(a, b))


def parse_tables(tables):
    """tables: list of rows (list of cell strings). Handles size-header tables in two orientations."""
    results = []  # (size, raw_label, field, min, max)
    for rows in tables:
        rows = [[c.strip() for c in r] for r in rows if any(c.strip() for c in r)]
        if len(rows) < 2:
            continue
        header = rows[0][1:]
        if header and sum(bool(SIZE_RE.match(h)) for h in header) >= max(2, len(header) // 2):
            # sizes across the top, measurements down the side
            for r in rows[1:]:
                label = r[0]
                field = normalize_field(label)
                for size, cell in zip(header, r[1:]):
                    rng = parse_num_range(cell)
                    if rng and size:
                        results.append((size.upper(), label, field, rng[0], rng[1]))
            continue
        first_col = [r[0] for r in rows[1:]]
        if first_col and sum(bool(SIZE_RE.match(c)) for c in first_col) >= max(2, len(first_col) // 2):
            # sizes down the side, measurements across the top
            labels = rows[0][1:]
            for r in rows[1:]:
                size = r[0].upper()
                for label, cell in zip(labels, r[1:]):
                    rng = parse_num_range(cell)
                    if rng:
                        results.append((size, label, normalize_field(label), rng[0], rng[1]))
    return results


TEXT_LINE_RE = re.compile(
    r"^(?P<label>[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß .\-/()]{2,40}?)\s*[:\-]?\s*"
    r"(?P<n1>\d{2,3}(?:[.,]\d)?)(?:\s*[-–]\s*(?P<n2>\d{2,3}(?:[.,]\d)?))?\s*cm\b",
    re.I,
)


def parse_text_fallback(text: str):
    """Lines like 'Chest width: 54 cm' (no size attached -> size='unspecified')."""
    results = []
    for line in text.splitlines():
        m = TEXT_LINE_RE.match(line.strip())
        if not m:
            continue
        label = m.group("label").strip()
        a = float(m.group("n1").replace(",", "."))
        b = float(m.group("n2").replace(",", ".")) if m.group("n2") else a
        results.append(("unspecified", label, normalize_field(label), min(a, b), max(a, b)))
    return results


def parse_jsonld(blobs):
    info = {}
    for blob in blobs:
        try:
            data = json.loads(blob)
        except Exception:
            continue
        items = data if isinstance(data, list) else data.get("@graph", [data]) if isinstance(data, dict) else []
        for it in items:
            if not isinstance(it, dict) or it.get("@type") not in ("Product", ["Product"]):
                continue
            info["name"] = it.get("name")
            brand = it.get("brand")
            info["brand"] = brand.get("name") if isinstance(brand, dict) else brand
            img = it.get("image")
            info["image"] = img[0] if isinstance(img, list) and img else img
            offers = it.get("offers")
            if isinstance(offers, list) and offers:
                offers = offers[0]
            if isinstance(offers, dict):
                info["price"] = offers.get("price") or offers.get("lowPrice")
                info["currency"] = offers.get("priceCurrency")
            if it.get("color"):
                info["color"] = it.get("color")
            return info
    return info


def is_product_url(url: str) -> bool:
    host = urlparse(url).netloc.lower()
    if "zalando." not in host:
        return False
    path = urlparse(url).path
    return bool(PRODUCT_URL_RE.search(path))


def category_page_url(base: str, page_num: int) -> str:
    if page_num <= 1:
        return base
    sep = "&" if "?" in base else "?"
    return f"{base}{sep}p={page_num}"


def sized_measurements(rows):
    return [r for r in rows if r[0] != "unspecified" and r[3] is not None]


# --------------------------------------------------------------------------- browser helpers

def click_if_present(page, patterns, timeout=1500):
    for pat in patterns:
        try:
            page.get_by_role("button", name=re.compile(pat, re.I)).first.click(timeout=timeout)
            page.wait_for_timeout(500)
        except Exception:
            pass
        try:
            page.get_by_role("link", name=re.compile(pat, re.I)).first.click(timeout=800)
            page.wait_for_timeout(500)
        except Exception:
            pass


def new_context(pw, headed: bool):
    browser = pw.chromium.launch(
        headless=not headed,
        args=["--disable-blink-features=AutomationControlled"],
    )
    ctx = browser.new_context(
        locale="de-AT",
        timezone_id="Europe/Vienna",
        user_agent=USER_AGENT,
        viewport={"width": 1440, "height": 1000},
    )
    page = ctx.new_page()
    return browser, ctx, page


def lazy_scroll(page, rounds=10):
    for _ in range(rounds):
        page.mouse.wheel(0, 2200)
        page.wait_for_timeout(350)


def reveal_measurements(page):
    click_if_present(page, COOKIE_BUTTONS, timeout=2500)
    click_if_present(page, REVEAL_BUTTONS, timeout=2000)
    try:
        page.locator('[data-testid*="size"], [data-testid*="Size"], [id*="size-guide"]').first.click(timeout=1200)
        page.wait_for_timeout(600)
    except Exception:
        pass
    try:
        page.get_by_text(re.compile(r"maße|measurement|größentabelle", re.I)).first.click(timeout=1200)
        page.wait_for_timeout(600)
    except Exception:
        pass


def enrich_from_dom(page, info: dict):
    if not info.get("image"):
        try:
            info["image"] = page.eval_on_selector(
                'meta[property="og:image"]', "e => e.content", strict=False
            )
        except Exception:
            pass
    if not info.get("color"):
        try:
            color = page.eval_on_selector(
                '[data-testid="product_color"], [class*="ColorName"], p:has(+ *)',
                "(e) => e.textContent",
                strict=False,
            )
            if color and len(color) < 40:
                info["color"] = color.strip()
        except Exception:
            pass
    if not info.get("color") and info.get("name"):
        m = re.search(r"\s[-–]\s+([^-–|]+)\s*$", info["name"])
        if m:
            info["color"] = m.group(1).strip()
    if not info.get("price"):
        try:
            txt = page.eval_on_selector(
                '[data-testid="pdp-price"], [class*="Price"]',
                "e => e.textContent",
                strict=False,
            )
            if txt:
                pm = re.search(r"(\d+[.,]\d{2})", txt.replace("\u00a0", " "))
                if pm:
                    info["price"] = pm.group(1).replace(",", ".")
                    info["currency"] = info.get("currency") or "EUR"
        except Exception:
            pass
    return info


def polite_sleep(lo=3.0, hi=6.0):
    time.sleep(random.uniform(lo, hi))


def make_robots_checker(url, ignore: bool = False):
    if ignore:
        return lambda u: True
    p = urlparse(url)
    rp = RobotFileParser()
    rp.set_url(f"{p.scheme}://{p.netloc}/robots.txt")
    try:
        rp.read()
    except Exception:
        return lambda u: True
    return lambda u: rp.can_fetch("*", u)


def ensure_reachable(body_text: str, url: str):
    low = body_text.lower()
    if any(m in low for m in BLOCKED_MARKERS):
        raise RuntimeError(
            f"blocked or error page for {url} (cookie wall, bot check, or outage). "
            "Try --headed, a slower connection, or run inspect locally."
        )


def scrape_product(page, url):
    page.goto(url, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(1800)
    reveal_measurements(page)
    page.wait_for_timeout(800)
    lazy_scroll(page, rounds=3)

    body_text = page.inner_text("body")
    ensure_reachable(body_text, url)

    blobs = page.eval_on_selector_all('script[type="application/ld+json"]', "els => els.map(e => e.textContent)")
    info = parse_jsonld(blobs)
    if not info.get("name"):
        try:
            og = page.query_selector('meta[property="og:title"]')
            info["name"] = page.eval_on_selector('meta[property="og:title"]', "e => e.content") if og else page.title()
        except Exception:
            info["name"] = page.title()
    info = enrich_from_dom(page, info)

    tables = page.evaluate(
        "() => [...document.querySelectorAll('table')].map(t => [...t.rows].map(r => [...r.cells].map(c => c.innerText)))"
    )
    measurements = parse_tables(tables)
    if not measurements:
        measurements = parse_text_fallback(body_text)
    measurements = sized_measurements(measurements)
    return info, measurements, body_text


def collect_category_links(page, category_url, allowed, max_pages: int, cap: int):
    """Walk category pagination until empty or limits hit."""
    links: list[str] = []
    seen_pages_without_growth = 0
    page_num = 1
    while True:
        if max_pages and page_num > max_pages:
            break
        url = category_page_url(category_url, page_num)
        if not allowed(url):
            print(f"robots.txt disallows {url}, stopping")
            break
        page.goto(url, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(2000)
        reveal_measurements(page)
        lazy_scroll(page, rounds=12)
        ensure_reachable(page.inner_text("body"), url)
        hrefs = page.eval_on_selector_all("a[href]", "els => els.map(e => e.href)")
        before = len(links)
        for h in hrefs:
            u = urlparse(h)
            clean = urlunparse((u.scheme, u.netloc, u.path, "", "", ""))
            if is_product_url(clean) and clean not in links:
                links.append(clean)
                if cap and len(links) >= cap:
                    return links
        print(f"listing page {page_num}: {len(links)} product links")
        if len(links) == before:
            seen_pages_without_growth += 1
            if seen_pages_without_growth >= 2:
                break
        else:
            seen_pages_without_growth = 0
        page_num += 1
        polite_sleep(2.0, 4.0)
    return links


# --------------------------------------------------------------------------- storage

PRODUCT_COLUMNS = (
    "url",
    "retailer",
    "brand",
    "name",
    "price",
    "currency",
    "image",
    "color",
    "scraped_at",
)


def db_connect():
    con = sqlite3.connect(DB_PATH)
    cols = [r[1] for r in con.execute("PRAGMA table_info(product)")]
    if cols and cols != list(PRODUCT_COLUMNS):
        con.executescript(
            """
            DROP TABLE IF EXISTS product;
            DROP TABLE IF EXISTS measurement;
            """
        )
        cols = []
    con.executescript(
        """
        CREATE TABLE IF NOT EXISTS product (
            url TEXT PRIMARY KEY, retailer TEXT, brand TEXT, name TEXT,
            price REAL, currency TEXT, image TEXT, color TEXT, scraped_at TEXT
        );
        CREATE TABLE IF NOT EXISTS measurement (
            product_url TEXT, size TEXT, raw_label TEXT, field TEXT,
            value_min REAL, value_max REAL
        );
        CREATE INDEX IF NOT EXISTS idx_m_field ON measurement(field, value_min, value_max);
        """
    )
    return con


def save_product(con, url, info, measurements):
    price = None
    try:
        price = float(info.get("price")) if info.get("price") else None
    except ValueError:
        pass
    con.execute(
        "INSERT OR REPLACE INTO product VALUES (?,?,?,?,?,?,?,?,?)",
        (
            url,
            urlparse(url).netloc,
            info.get("brand"),
            info.get("name"),
            price,
            info.get("currency"),
            info.get("image"),
            info.get("color"),
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    con.execute("DELETE FROM measurement WHERE product_url = ?", (url,))
    con.executemany(
        "INSERT INTO measurement VALUES (?,?,?,?,?,?)",
        [(url, s, label, field, lo, hi) for s, label, field, lo, hi in measurements],
    )
    con.commit()


# --------------------------------------------------------------------------- commands

def cmd_inspect(args):
    OUT_DIR.mkdir(exist_ok=True)
    with sync_playwright() as pw:
        browser, ctx, page = new_context(pw, args.headed)
        info, measurements, body = scrape_product(page, args.url)
        (OUT_DIR / "page.html").write_text(page.content(), encoding="utf-8")
        (OUT_DIR / "body.txt").write_text(body, encoding="utf-8")
        page.screenshot(path=str(OUT_DIR / "page.png"), full_page=True)
        ctx.close()
        browser.close()
    print("Product info:", json.dumps(info, indent=2, ensure_ascii=False))
    print(f"\nParsed {len(measurements)} measurement values:")
    for size, label, field, lo, hi in measurements:
        print(f"  size={size:<12} label={label!r:<30} field={field}  {lo}-{hi} cm")
    if not measurements:
        print("\nNo measurements found. Open inspect_output/page.png and body.txt to see where the "
              "measurements live, then adjust REVEAL_BUTTONS / FIELD_PATTERNS / the parsers.")


def cmd_scrape(args):
    allowed = make_robots_checker(args.category_url, args.ignore_robots)
    con = db_connect()
    saved = skipped = failed = 0
    max_pages = 0 if args.all_pages else args.pages
    with sync_playwright() as pw:
        browser, ctx, page = new_context(pw, args.headed)
        links = collect_category_links(page, args.category_url, allowed, max_pages, args.limit)
        print(f"visiting {len(links)} product pages…")

        for url in links:
            if not allowed(url):
                continue
            try:
                info, measurements, _ = scrape_product(page, url)
                if args.require_measurements and not measurements:
                    skipped += 1
                    print(f"skip (no measurements): {info.get('brand')} · {info.get('name')}")
                    continue
                save_product(con, url, info, measurements)
                saved += 1
                print(f"[{saved}] {info.get('brand')} · {info.get('name')} · {len(measurements)} values")
            except Exception as e:
                failed += 1
                print(f"failed {url}: {e}")
            polite_sleep(args.delay_min, args.delay_max)
        ctx.close()
        browser.close()
    print(f"Done. saved={saved} skipped_no_measurements={skipped} failed={failed} -> {DB_PATH}")
    if args.export and saved:
        cmd_export(argparse.Namespace(out=str(CATALOG_PATH)))


# --------------------------------------------------------------------------- export / demo seed (website catalog.json)

SCRAPER_TO_SITE = {
    "chest_width": "chest",
    "chest": "chest",
    "shoulder_width": "shoulder",
    "sleeve_length": "sleeve",
    "length": "length",
    "waist": "waist",
    "hip": "hip",
}

# Lower = applied first when folding ranges into single cm values for the UI.
FIELD_PRIORITY = {
    "chest_width": 0,
    "chest": 1,
    "chest_circumference": 2,
    "shoulder_width": 0,
    "sleeve_length": 0,
    "length": 0,
    "waist": 0,
    "hip": 0,
}


def product_id(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:14]


def fold_site_measurements(rows):
    """rows: list of (field, value_min, value_max) for one size."""
    by_key = {}
    for field, lo, hi in rows:
        if not field:
            continue
        mid = round((lo + hi) / 2, 2)
        site = SCRAPER_TO_SITE.get(field)
        if field == "chest_circumference":
            # Flat width ≈ circumference / π (garment laid flat).
            site = "chest"
            mid = round(mid / 3.14159, 2)
        elif not site:
            continue
        prev = by_key.get(site)
        pri = FIELD_PRIORITY.get(field, 9)
        if prev is None or pri < prev[0]:
            by_key[site] = (pri, mid)
    return {k: v[1] for k, v in by_key.items()}


def rows_for_product(con, url):
    return con.execute(
        "SELECT size, field, raw_label, value_min, value_max FROM measurement "
        "WHERE product_url = ? AND field IS NOT NULL AND size != 'unspecified'",
        (url,),
    ).fetchall()


def build_catalog(con):
    products = []
    for url, retailer, brand, name, price, currency, image, color, scraped_at in con.execute(
        "SELECT url, retailer, brand, name, price, currency, image, color, scraped_at FROM product ORDER BY brand, name"
    ):
        grouped = {}
        for size, field, _label, lo, hi in rows_for_product(con, url):
            grouped.setdefault(size.upper(), []).append((field, lo, hi))
        variants = []
        for size in sorted(grouped.keys(), key=lambda s: (not s.isdigit(), s)):
            measurements = fold_site_measurements(grouped[size])
            if not measurements:
                continue
            variants.append({"size": size, "measurements": measurements, "inStock": True})
        if not variants:
            continue
        products.append(
            {
                "id": product_id(url),
                "url": url,
                "retailer": retailer or urlparse(url).netloc,
                "brand": brand or "unbekannt",
                "name": name or "produkt",
                "price": price,
                "currency": currency or "EUR",
                "image": image,
                "color": color,
                "category": "shirt",
                "scrapedAt": scraped_at,
                "variants": variants,
            }
        )
    return products


def cmd_export(args):
    con = db_connect()
    catalog = {
        "version": 1,
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "source": "zalando",
        "productCount": 0,
        "products": build_catalog(con),
    }
    catalog["productCount"] = len(catalog["products"])
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {catalog['productCount']} products to {out}")


def _m(size, label, field, value):
    return (size, label, field, value, value)


def demo_catalog_rows():
    """Structured like parser output after a successful Zalando scrape (for local dev without live access)."""
    items = []
    templates = [
        (
            "https://www.zalando.at/only-sons-basic-tee-schwarz-onl21d0a1-a11.html",
            {
                "brand": "ONLY & SONS",
                "name": "Basic T-shirt",
                "color": "schwarz",
                "price": 19.99,
                "currency": "EUR",
                "image": "https://picsum.photos/seed/onlysons/480/600",
            },
            [
                _m("S", "Brustbreite", "chest_width", 50),
                _m("S", "Rückenlänge", "length", 69),
                _m("S", "Schulter", "shoulder_width", 44),
                _m("M", "Brustbreite", "chest_width", 52),
                _m("M", "Rückenlänge", "length", 71),
                _m("M", "Schulter", "shoulder_width", 45.5),
                _m("L", "Brustbreite", "chest_width", 54),
                _m("L", "Rückenlänge", "length", 73),
                _m("L", "Schulter", "shoulder_width", 47),
            ],
        ),
        (
            "https://www.zalando.de/jack-jones-premium-linen-tee-weiss-jjm21d02n-a11.html",
            {"brand": "Jack & Jones Premium", "name": "Linen blend tee - white", "price": 29.95, "currency": "EUR"},
            [
                _m("S", "Chest width", "chest_width", 51),
                _m("S", "Length", "length", 70),
                _m("M", "Chest width", "chest_width", 53),
                _m("M", "Length", "length", 72),
                _m("L", "Chest width", "chest_width", 55),
                _m("L", "Length", "length", 74),
            ],
        ),
        (
            "https://www.zalando.de/pier-one-oversized-boxy-tee-grau-pig21d08g-a11.html",
            {"brand": "Pier One", "name": "Oversized boxy tee - grey", "price": 15.99, "currency": "EUR"},
            [
                _m("S", "Brustbreite", "chest_width", 56),
                _m("S", "Länge", "length", 67),
                _m("M", "Brustbreite", "chest_width", 58),
                _m("M", "Länge", "length", 68),
                _m("L", "Brustbreite", "chest_width", 60),
                _m("L", "Länge", "length", 69),
            ],
        ),
        (
            "https://www.zalando.de/tom-tailor-relaxed-tee-marine-tto21d04m-a11.html",
            {"brand": "Tom Tailor", "name": "Relaxed fit tee - navy", "price": 24.99, "currency": "EUR"},
            [
                _m("M", "Brustbreite", "chest_width", 54),
                _m("M", "Ärmellänge", "sleeve_length", 21),
                _m("M", "Länge", "length", 72),
                _m("L", "Brustbreite", "chest_width", 56),
                _m("L", "Ärmellänge", "sleeve_length", 22),
                _m("L", "Länge", "length", 73),
            ],
        ),
        (
            "https://www.zalando.de/esprit-regular-crew-tee-ecru-esp21d01e-a11.html",
            {"brand": "Esprit", "name": "Regular crew neck - ecru", "price": 22.95, "currency": "EUR"},
            [
                _m("XS", "Chest width", "chest_width", 48),
                _m("S", "Chest width", "chest_width", 50),
                _m("M", "Chest width", "chest_width", 52),
                _m("L", "Chest width", "chest_width", 54),
                _m("XL", "Chest width", "chest_width", 56),
                _m("M", "Back length", "length", 71),
                _m("L", "Back length", "length", 72),
            ],
        ),
        (
            "https://www.zalando.de/selected-homme-slim-tee-schwarz-slm21d0bs-a11.html",
            {"brand": "Selected Homme", "name": "Slim fit tee - black", "price": 34.95, "currency": "EUR"},
            [
                _m("S", "Brustbreite", "chest_width", 48),
                _m("S", "Länge", "length", 73),
                _m("M", "Brustbreite", "chest_width", 50),
                _m("M", "Länge", "length", 74),
                _m("L", "Brustbreite", "chest_width", 52),
                _m("L", "Länge", "length", 75),
            ],
        ),
        (
            "https://www.zalando.de/celio-linen-mix-tee-beige-cel21d03b-a11.html",
            {"brand": "Celio", "name": "Linen mix tee - beige", "price": 27.99, "currency": "EUR"},
            [
                _m("M", "Brustbreite", "chest_width", 53),
                _m("M", "Länge", "length", 72),
                _m("L", "Brustbreite", "chest_width", 55),
                _m("L", "Länge", "length", 73),
            ],
        ),
        (
            "https://www.zalando.de/urban-classics-heavy-oversized-tee-wei-urc21d0hw-a11.html",
            {"brand": "Urban Classics", "name": "Heavy oversized tee - white", "price": 18.99, "currency": "EUR"},
            [
                _m("S", "Brustbreite", "chest_width", 58),
                _m("S", "Länge", "length", 70),
                _m("M", "Brustbreite", "chest_width", 60),
                _m("M", "Länge", "length", 71),
                _m("L", "Brustbreite", "chest_width", 62),
                _m("L", "Länge", "length", 72),
            ],
        ),
    ]
    for url, info, measurements in templates:
        items.append((url, info, measurements))
    return items


def cmd_seed_demo(args):
    con = db_connect()
    for url, info, measurements in demo_catalog_rows():
        save_product(con, url, info, measurements)
    print(f"Seeded {len(demo_catalog_rows())} demo products into {DB_PATH}")
    if args.export:
        cmd_export(argparse.Namespace(out=str(CATALOG_PATH)))


def cmd_query(args):
    con = db_connect()
    conds, params = [], []
    for field in ("chest_width", "chest", "chest_circumference", "length", "shoulder_width", "sleeve_length", "waist"):
        lo = getattr(args, f"{field}_min")
        hi = getattr(args, f"{field}_max")
        if lo is None and hi is None:
            continue
        # range overlap with [lo, hi]; open ends allowed
        clause = "(field = ?"
        params.append(field)
        if lo is not None:
            clause += " AND value_max >= ?"
            params.append(lo)
        if hi is not None:
            clause += " AND value_min <= ?"
            params.append(hi)
        conds.append(clause + ")")
    if not conds:
        print("Give at least one --<field>-min/--<field>-max filter.")
        return
    sql = f"""
        SELECT p.brand, p.name, p.price, p.currency, m.size, p.url
        FROM measurement m JOIN product p ON p.url = m.product_url
        WHERE {' OR '.join(conds)}
        GROUP BY m.product_url, m.size
        HAVING COUNT(DISTINCT m.field) = {len(conds)}
        ORDER BY p.price
        LIMIT ?
    """
    rows = con.execute(sql, params + [args.limit]).fetchall()
    for brand, name, price, cur, size, url in rows:
        print(f"{brand} | {name} | size {size} | {price} {cur}\n   {url}")
    print(f"\n{len(rows)} matches")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    a = sub.add_parser("inspect", help="parse one product page and dump debug files")
    a.add_argument("url")
    a.add_argument("--headed", action="store_true", help="show the browser window")
    a.set_defaults(fn=cmd_inspect)

    b = sub.add_parser("scrape", help="scrape a category listing into SQLite")
    b.add_argument("category_url", nargs="?", default=DEFAULT_CATEGORY)
    b.add_argument("--pages", type=int, default=1, help="listing pages to crawl (ignored with --all-pages)")
    b.add_argument("--all-pages", action="store_true", help="paginate until no new products")
    b.add_argument("--limit", type=int, default=0, help="max product URLs (0 = no cap)")
    b.add_argument("--delay-min", type=float, default=3.0)
    b.add_argument("--delay-max", type=float, default=6.0)
    b.add_argument("--require-measurements", action=argparse.BooleanOptionalAction, default=True)
    b.add_argument("--export", action="store_true", help="write public/catalog.json after scrape")
    b.add_argument("--headed", action="store_true", help="visible browser (recommended on Zalando)")
    b.add_argument(
        "--ignore-robots",
        action="store_true",
        help="do not check robots.txt (only for personal prototypes you run yourself)",
    )
    b.set_defaults(fn=cmd_scrape)

    c = sub.add_parser("query", help="filter stored products by measurements in cm")
    for f in ("chest_width", "chest", "chest_circumference", "length", "shoulder_width", "sleeve_length", "waist"):
        c.add_argument(f"--{f.replace('_', '-')}-min", type=float, dest=f"{f}_min")
        c.add_argument(f"--{f.replace('_', '-')}-max", type=float, dest=f"{f}_max")
    c.add_argument("--limit", type=int, default=50)
    c.set_defaults(fn=cmd_query)

    d = sub.add_parser("export", help="write public/catalog.json for the React app")
    d.add_argument("--out", default=str(CATALOG_PATH))
    d.set_defaults(fn=cmd_export)

    e = sub.add_parser(
        "seed-demo",
        help="fill SQLite with parser-shaped demo rows (when live Zalando is blocked)",
    )
    e.add_argument("--export", action="store_true", help="also write public/catalog.json")
    e.set_defaults(fn=cmd_seed_demo)

    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
