import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from measurement_scraper import parse_tables, parse_text_fallback, fold_site_measurements


def test_sizes_across_top():
    tables = [[["", "S", "M", "L"], ["Chest width", "52", "54", "56"], ["Length", "70", "72", "74"]]]
    rows = parse_tables(tables)
    assert len(rows) == 6
    assert rows[1][0] == "M" and rows[1][2] == "chest_width"


def test_sizes_down_side_german():
    tables = [[["Size", "Brustbreite", "Laenge"], ["S", "52", "70"], ["M", "54", "72"]]]
    rows = parse_tables(tables)
    assert any(r[0] == "M" and r[2] == "chest_width" and r[3] == 54 for r in rows)


def test_text_fallback():
    rows = parse_text_fallback("Brustbreite: 54 cm\n")
    assert rows and rows[0][2] == "chest_width"


def test_fold_prefers_flat_chest_over_circumference():
    folded = fold_site_measurements(
        [
            ("chest_circumference", 100, 100),
            ("chest_width", 52, 52),
        ]
    )
    assert folded["chest"] == 52.0