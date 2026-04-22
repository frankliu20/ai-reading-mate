# `data/` — the contract

The UI consumes **one single file**: `data/private/booklists.json`.

If that file is missing, it falls back to `data/sample/booklists.json`, so a fresh
clone runs out of the box with demo data.

How the `booklists.json` gets generated is your choice. This repo ships two paths:

1. **Claude Code skill** — [`.claude/skills/sync-weread-meta/`](../.claude/skills/sync-weread-meta/SKILL.md). Given a WeRead account, the skill drives the full pipeline: pulls MCP, figures out your booklist habits, uses LLM knowledge to auto-classify by theme when you don't have theme booklists, writes config, runs the build script.
2. **Plain script** — [`data/build_booklists.py`](./build_booklists.py). Stateless, zero-dep Python. Reads a folder of raw WeRead snapshots + an optional `config.json`, emits `booklists.json`. Run by the skill, or invoke directly.

Bring your own data however you want — a Goodreads CSV export and a small converter script works too. The only thing that matters is producing a valid `booklists.json`.

## Schema of `booklists.json`

```ts
{
  generated_at: string,              // ISO timestamp
  source: string,                    // free-form label, e.g. "weread MCP"
  user_vid: number | string,         // informational only; UI doesn't branch on it

  stats: {
    totalBooklists: number,
    yearBooklists:  number,
    themeBooklists: number,
    uniqueBooks:    number,
    booksByYear:    { [year: string]:  number },
    booksByTheme:   { [theme: string]: number },
    inShelf:        number,
    finished:       number,
    withNotes:      number,
    totalReadingHours: number,
  },

  booklists: Array<{
    booklistId: string,              // any unique id
    name: string,
    kind: "year" | "theme",
    label: string,                   // e.g. "2025" or "Sci-Fi"
    totalCount: number,
    bookIds: string[],               // references into `books`
  }>,

  books: {
    [bookId: string]: {
      bookId: string,
      title: string,
      author: string,
      translator?: string,
      cover: string,                 // https URL
      publishTime?: string,
      categories?: string[],
      newRating?: number,            // 0-1000
      newRatingCount?: number,
      ratingTitle?: string,
      years?: string[],              // which year-booklists contain this book
      themes?: string[],             // which theme-booklists contain this book
      inShelf: boolean,
      finishReading: boolean,
      progress: number,              // 0-100
      readingTime: number,           // seconds
      readingTimeFormatted?: string,
      updateTime?: string,           // ISO
      noteCount?: number,
      reviewCount?: number,
      bookmarkCount?: number,
      paid?: boolean,
    }
  }
}
```

See [`sample/booklists.json`](./sample/booklists.json) for a complete working example.

## Folder layout

```
data/
├── README.md              ← this file (contract + schema)
├── build_booklists.py     ← generic builder: raw/ + config.json → booklists.json
├── sample/                ← shipped demo; used automatically when data/private/ is absent
│   ├── booklists.json
│   ├── booklists.md
│   ├── config.json        ← sample Tier-C config (no booklists, just theme_overrides)
│   └── raw/_bookshelf.json
└── private/               ← gitignored; drop your own raw + config here
    ├── booklists.json
    ├── config.json
    └── raw/*.json
```

## Plugging in your own data

### Option A — run the skill (easiest, requires Claude Code + WeRead MCP)

```
/sync-weread-meta     (or just say "同步读书数据" in chat)
```

The skill negotiates with you about booklist structure, pulls everything, writes `data/private/config.json`, then runs `build_booklists.py`.

### Option B — run the script directly

1. Drop a `_bookshelf.json` (from `weread-get_bookshelf` or a Goodreads-like export converted to that shape) into `data/private/raw/`.
2. Optional: drop one `<booklistId>.json` per WeRead booklist (from `weread-get_booklist_detail`) into the same folder.
3. Optional: write `data/private/config.json` to classify those booklists. No config at all is fine — the script will auto-bucket finished books by year from their `updateTime`.
4. ```bash
   python data/build_booklists.py
   ```

### Option C — bring your own `booklists.json`

Generate it however you like; drop it into `data/private/booklists.json` and you're done.

### config.json (optional)

```json
{
  "user_vid": "9999",
  "source": "weread MCP",

  "booklists": {
    "<raw/<this-id>.json>": { "kind": "year",  "label": "2025" },
    "<another-id>":         { "kind": "theme", "label": "Sci-Fi" }
  },

  "auto_years_from_shelf": true,

  "theme_overrides": {
    "<bookId>": ["Sci-Fi", "Classics"]
  }
}
```

- `booklists` — explicit kind+label for each `raw/<booklistId>.json` you want included. Raw files not listed here are ignored.
- `auto_years_from_shelf` — if no year booklists are provided, bucket finished books by year using `updateTime`. Default: `true`.
- `theme_overrides` — map `bookId → [theme labels]`. Each unique theme becomes a synthesized booklist.

### Env override

```bash
READING_DATA_DIR=/absolute/path/to/folder  npm run dev
```

`build_booklists.py` and `ui/scripts/sync-data.mjs` both honor this (folder should contain `booklists.json`, and for the build script also a `raw/` subdir).
