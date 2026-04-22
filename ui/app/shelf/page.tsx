'use client';

import { useMemo, useState } from 'react';
import { allBooks, booksByTheme, booksByYear, years, themes, meta } from '@/lib/data';
import BookGrid from '@/components/BookGrid';
import { Search } from 'lucide-react';

interface Props {
  searchParams?: Promise<{ year?: string; theme?: string; finished?: string }>;
}

export default function ShelfPage({ searchParams }: Props) {
  // Parse searchParams synchronously on client side
  const [query, setQuery] = useState('');
  const [activeYear, setActiveYear] = useState<string>('');
  const [activeTheme, setActiveTheme] = useState<string>('');
  const [onlyFinished, setOnlyFinished] = useState(false);

  const books = useMemo(() => {
    let result = allBooks();
    let title = '全部书架';

    if (activeYear) {
      result = booksByYear(activeYear);
      title = `${activeYear} 年打卡`;
    } else if (activeTheme) {
      result = booksByTheme(activeTheme);
      title = activeTheme;
    }

    if (onlyFinished) {
      result = result.filter((b) => b.finishReading);
    }

    // Client-side search by query
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)
      );
    }

    // Sort: finished first, then by readingTime desc
    result = [...result].sort((a, b) => {
      if (!!b.finishReading !== !!a.finishReading)
        return b.finishReading ? 1 : -1;
      return (b.readingTime ?? 0) - (a.readingTime ?? 0);
    });

    return { books: result, title };
  }, [activeYear, activeTheme, onlyFinished, query]);

  const finished = books.books.filter((b) => b.finishReading).length;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{books.title}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {books.books.length} 本 · 已读完 {finished} 本
        </p>
      </header>

      <div className="space-y-3">
        <SearchInput query={query} onChange={setQuery} />
        <FilterBar
          activeYear={activeYear}
          activeTheme={activeTheme}
          onlyFinished={onlyFinished}
          onYearChange={setActiveYear}
          onThemeChange={setActiveTheme}
          onFinishedChange={setOnlyFinished}
        />
      </div>

      <BookGrid books={books.books} />
    </div>
  );
}

function SearchInput({
  query,
  onChange,
}: {
  query: string;
  onChange: (q: string) => void;
}) {
  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]"
      />
      <input
        type="text"
        placeholder="搜索书名或作者..."
        value={query}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
      />
    </div>
  );
}

interface FilterBarProps {
  activeYear?: string;
  activeTheme?: string;
  onlyFinished: boolean;
  onYearChange: (year: string) => void;
  onThemeChange: (theme: string) => void;
  onFinishedChange: (finished: boolean) => void;
}

function FilterBar({
  activeYear,
  activeTheme,
  onlyFinished,
  onYearChange,
  onThemeChange,
  onFinishedChange,
}: FilterBarProps) {
  const ys = years();
  const ts = themes();
  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        <Chip
          active={!activeYear && !activeTheme}
          onClick={() => {
            onYearChange('');
            onThemeChange('');
          }}
        >
          全部
        </Chip>
        {ys.map((y) => (
          <Chip
            key={y}
            active={activeYear === y}
            onClick={() => {
              onYearChange(activeYear === y ? '' : y);
              onThemeChange('');
            }}
          >
            {y}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {ts.map((t) => (
          <Chip
            key={t}
            active={activeTheme === t}
            onClick={() => {
              onYearChange('');
              onThemeChange(activeTheme === t ? '' : t);
            }}
          >
            {t} <span className="opacity-60 text-xs">{meta.stats.booksByTheme[t]}</span>
          </Chip>
        ))}
      </div>
      <div>
        <Chip
          active={onlyFinished}
          onClick={() => onFinishedChange(!onlyFinished)}
        >
          {onlyFinished ? '✓ 仅显示读完' : '仅显示读完'}
        </Chip>
      </div>
    </div>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm border transition-colors ${
        active
          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
          : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
      }`}
    >
      {children}
    </button>
  );
}

