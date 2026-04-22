"""Build data/private/booklists.json from WeRead MCP raw snapshots.

Zero third-party dependencies. Invoke from repo root:

    python data/build_booklists.py

What it reads (all under data/private/ unless READING_DATA_DIR is set):
  raw/_bookshelf.json              required. Full WeRead bookshelf (get_bookshelf).
  raw/<booklistId>.json            optional. One per WeRead booklist you care about
                                   (each is the raw payload from get_booklist_detail).
  config.json                      optional. See below.

Falls back to data/sample/ (shipped demo data) if data/private/ is absent.

What it writes:
  booklists.json                   the one file the UI consumes.
  booklists.md                     human-readable summary.

--------------------------------------------------------------------
config.json schema (all fields optional)

    {
      "user_vid": "9999",                   // informational
      "source": "weread MCP",               // informational

      // A) Explicit booklist classification.
      //    Any raw/<booklistId>.json not listed here is ignored.
      //    kind ∈ {"year", "theme"}; label is whatever you want shown in the UI.
      "booklists": {
        "7F31o7PYI": { "kind": "year",  "label": "2023" },
        "7Q2fEbPWW": { "kind": "theme", "label": "Sci-Fi" }
      },

      // B) If true, and no year booklists were supplied above, auto-generate
      //    one year booklist per year by bucketing every finished book in the
      //    bookshelf by the year of its updateTime. Defaults to true.
      "auto_years_from_shelf": true,

      // C) Optional theme overrides keyed by bookId. One book can be in
      //    multiple themes. Synthesized booklists "theme::<label>" will be
      //    added for each unique label, alongside any explicit theme
      //    booklists from (A).
      "theme_overrides": {
        "123456": ["Sci-Fi", "Classics"],
        "789012": ["History"]
      }
    }

If config.json is absent, the script behaves as:
    auto_years_from_shelf = true, no explicit booklists, no theme overrides.
That path works for anyone who just dropped a bookshelf snapshot into raw/.
--------------------------------------------------------------------
"""
from __future__ import annotations
import json
import os
import re
from collections import OrderedDict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_ROOT = ROOT / "data"


def resolve_data_dir() -> Path:
    env = os.environ.get("READING_DATA_DIR")
    if env:
        return Path(env)
    private = DATA_ROOT / "private"
    if (private / "raw").is_dir() or (private / "booklists.json").exists():
        return private
    return DATA_ROOT / "sample"


DATA_DIR = resolve_data_dir()
RAW_DIR = DATA_DIR / "raw"
CONFIG_PATH = DATA_DIR / "config.json"
OUT_JSON = DATA_DIR / "booklists.json"
OUT_MD = DATA_DIR / "booklists.md"


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        return {"booklists": {}, "auto_years_from_shelf": True, "theme_overrides": {}}
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        cfg = json.load(f)
    cfg.setdefault("booklists", {})
    cfg.setdefault("auto_years_from_shelf", True)
    cfg.setdefault("theme_overrides", {})
    return cfg


def load_bookshelf(books: dict) -> dict[str, dict]:
    """Return bookId -> reader interaction fields; populate `books` with metadata."""
    p = RAW_DIR / "_bookshelf.json"
    if not p.exists():
        print(f"[warn] no {p} — output will lack shelf data")
        return {}
    with open(p, "r", encoding="utf-8") as f:
        shelf = json.load(f)
    idx = {}
    for b in shelf.get("books", []):
        bid = str(b.get("bookId") or "")
        if not bid:
            continue
        idx[bid] = {
            "inShelf": True,
            "finishReading": bool(b.get("finishReading", False)),
            "progress": b.get("progress", 0),
            "readingTime": b.get("readingTime", 0),
            "readingTimeFormatted": b.get("readingTimeFormatted", ""),
            "updateTime": b.get("updateTime", ""),
            "noteCount": b.get("noteCount", 0),
            "reviewCount": b.get("reviewCount", 0),
            "bookmarkCount": b.get("bookmarkCount", 0),
            "paid": bool(b.get("paid", False)),
        }
        books.setdefault(bid, {
            "bookId": bid,
            "title": b.get("title", ""),
            "author": b.get("author", ""),
            "translator": b.get("translator", ""),
            "cover": b.get("cover", ""),
            "publishTime": b.get("publishTime", "") or "",
            "categories": [c.get("title", "") for c in b.get("categories", []) if isinstance(c, dict) and c.get("title")],
            "newRating": b.get("newRating"),
            "newRatingCount": b.get("newRatingCount"),
            "ratingTitle": (b.get("newRatingDetail") or {}).get("title", ""),
        })
    return idx


def load_booklist_file(path: Path) -> tuple[str, list[dict], dict]:
    """Return (rawName, books, metadata) for one get_booklist_detail snapshot."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    bl = data.get("booklist", {}).get("booklist") or data.get("booklist") or {}
    books = []
    for entry in bl.get("books", []):
        bi = entry.get("bookInfo") if isinstance(entry, dict) else None
        if not bi:
            continue
        bid = str(bi.get("bookId") or "")
        if not bid:
            continue
        cats = [c.get("title", "") for c in bi.get("categories", []) if isinstance(c, dict) and c.get("title")]
        books.append({
            "bookId": bid,
            "title": bi.get("title", ""),
            "author": bi.get("author", ""),
            "translator": bi.get("translator", ""),
            "cover": bi.get("cover", ""),
            "publishTime": bi.get("publishTime", "") or "",
            "categories": cats,
            "newRating": bi.get("newRating"),
            "newRatingCount": bi.get("newRatingCount"),
            "ratingTitle": (bi.get("newRatingDetail") or {}).get("title", ""),
        })
    return bl.get("name", ""), books, {"totalCount": bl.get("totalCount", 0)}


def derive_booklists(cfg: dict, books: dict, shelf_idx: dict) -> list[dict]:
    booklists: list[dict] = []

    # (A) explicit booklists from raw/*.json that appear in config.booklists
    explicit = cfg.get("booklists", {})
    for path in sorted(RAW_DIR.glob("*.json")):
        stem = path.stem
        if stem.startswith("_"):
            continue
        # config keys can be full id ("<userVid>_<slug>") or bare slug only
        key = None
        if stem in explicit:
            key = stem
        else:
            bare = stem.split("_", 1)[-1]
            if bare in explicit:
                key = bare
        if key is None:
            print(f"[skip] raw/{path.name} not in config.booklists")
            continue
        spec = explicit[key]
        kind = spec.get("kind")
        label = str(spec.get("label", ""))
        if kind not in ("year", "theme") or not label:
            print(f"[skip] invalid spec for {key}: {spec!r}")
            continue
        name, bl_books, meta = load_booklist_file(path)
        # merge book metadata into the global pool (booklist detail has richer fields than shelf)
        for b in bl_books:
            books.setdefault(b["bookId"], b)
            # backfill any missing fields on a shelf-sourced entry
            existing = books[b["bookId"]]
            for k, v in b.items():
                if not existing.get(k) and v:
                    existing[k] = v
        booklists.append({
            "booklistId": stem,
            "name": name,
            "kind": kind,
            "label": label,
            "totalCount": meta.get("totalCount") or len(bl_books),
            "bookIds": [b["bookId"] for b in bl_books],
        })

    have_year = any(b["kind"] == "year" for b in booklists)

    # (B) auto-year from shelf updateTime on finished books
    if cfg.get("auto_years_from_shelf", True) and not have_year:
        by_year: dict[str, list[str]] = {}
        for bid, meta in shelf_idx.items():
            if not meta.get("finishReading"):
                continue
            ts = meta.get("updateTime") or ""
            m = re.match(r"(\d{4})", ts)
            if not m:
                continue
            y = m.group(1)
            by_year.setdefault(y, []).append(bid)
        for y in sorted(by_year.keys()):
            booklists.append({
                "booklistId": f"auto-year-{y}",
                "name": y,
                "kind": "year",
                "label": y,
                "totalCount": len(by_year[y]),
                "bookIds": by_year[y],
            })

    # (C) theme overrides
    overrides = cfg.get("theme_overrides", {})
    if overrides:
        by_theme: dict[str, list[str]] = {}
        for bid, themes in overrides.items():
            bid = str(bid)
            if not isinstance(themes, list):
                continue
            for t in themes:
                t = str(t).strip()
                if not t:
                    continue
                by_theme.setdefault(t, []).append(bid)
        existing_theme_labels = {b["label"] for b in booklists if b["kind"] == "theme"}
        for t in sorted(by_theme.keys()):
            if t in existing_theme_labels:
                # already provided explicitly; skip
                continue
            booklists.append({
                "booklistId": f"auto-theme-{t}",
                "name": t,
                "kind": "theme",
                "label": t,
                "totalCount": len(by_theme[t]),
                "bookIds": by_theme[t],
            })

    return booklists


def main():
    cfg = load_config()
    books: dict[str, dict] = {}
    shelf_idx = load_bookshelf(books)
    booklists = derive_booklists(cfg, books, shelf_idx)

    # per-book year/theme backrefs
    for b in books.values():
        b["years"] = []
        b["themes"] = []
    for bl in booklists:
        for bid in bl["bookIds"]:
            b = books.get(bid)
            if not b:
                # referenced but not in bookshelf/booklist pool (rare)
                books[bid] = {"bookId": bid, "title": "", "author": "", "translator": "", "cover": "",
                              "publishTime": "", "categories": [], "newRating": None, "newRatingCount": None,
                              "ratingTitle": "", "years": [], "themes": [], "inShelf": False,
                              "finishReading": False, "progress": 0, "readingTime": 0}
                b = books[bid]
            target = b["years"] if bl["kind"] == "year" else b["themes"]
            if bl["label"] not in target:
                target.append(bl["label"])

    # merge shelf interaction data
    for bid, b in books.items():
        extra = shelf_idx.get(bid)
        if extra:
            b.update(extra)
        else:
            b.setdefault("inShelf", False)
            b.setdefault("finishReading", False)
            b.setdefault("progress", 0)
            b.setdefault("readingTime", 0)

    out = OrderedDict()
    out["generated_at"] = datetime.now().isoformat(timespec="seconds")
    out["source"] = cfg.get("source") or "weread MCP (get_bookshelf + optional get_booklist_detail)"
    out["user_vid"] = cfg.get("user_vid", "")
    out["stats"] = {
        "totalBooklists": len(booklists),
        "yearBooklists": sum(1 for b in booklists if b["kind"] == "year"),
        "themeBooklists": sum(1 for b in booklists if b["kind"] == "theme"),
        "uniqueBooks": len(books),
        "booksByYear": {bl["label"]: len(bl["bookIds"]) for bl in booklists if bl["kind"] == "year"},
        "booksByTheme": {bl["label"]: len(bl["bookIds"]) for bl in booklists if bl["kind"] == "theme"},
        "inShelf": sum(1 for b in books.values() if b.get("inShelf")),
        "finished": sum(1 for b in books.values() if b.get("finishReading")),
        "withNotes": sum(1 for b in books.values() if (b.get("noteCount") or 0) > 0),
        "totalReadingHours": round(sum(b.get("readingTime", 0) for b in books.values()) / 3600, 1),
    }
    out["booklists"] = booklists
    out["books"] = books

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"[ok] wrote {OUT_JSON} ({OUT_JSON.stat().st_size // 1024} KB)")

    # Markdown summary
    stats = out["stats"]
    lines = [
        "# booklists.json summary",
        "",
        f"_generated {out['generated_at']}_",
        "",
        "## stats",
        f"- booklists: **{stats['totalBooklists']}** ({stats['yearBooklists']} year + {stats['themeBooklists']} theme)",
        f"- unique books: **{stats['uniqueBooks']}**",
        f"- in shelf: {stats['inShelf']} · finished: {stats['finished']} · with notes: {stats['withNotes']}",
        f"- total reading time: **{stats['totalReadingHours']}h**",
        "",
    ]
    if stats["booksByYear"]:
        lines += ["## by year", ""]
        for y, n in sorted(stats["booksByYear"].items()):
            lines.append(f"- {y}: {n}")
        lines.append("")
    if stats["booksByTheme"]:
        lines += ["## by theme", ""]
        for t, n in sorted(stats["booksByTheme"].items(), key=lambda x: -x[1]):
            lines.append(f"- {t}: {n}")
        lines.append("")
    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"[ok] wrote {OUT_MD}")


if __name__ == "__main__":
    main()
