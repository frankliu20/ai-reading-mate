import Link from 'next/link';
import { allBooks, booksByTheme, booksByYear, years, themes, meta } from '@/lib/data';
import BookGrid from '@/components/BookGrid';

interface Props {
  searchParams: Promise<{ year?: string; theme?: string; finished?: string }>;
}

export default async function ShelfPage({ searchParams }: Props) {
  const sp = await searchParams;
  const activeYear = sp.year;
  const activeTheme = sp.theme;
  const onlyFinished = sp.finished === '1';

  let books = allBooks();
  let title = '全部书架';
  if (activeYear) {
    books = booksByYear(activeYear);
    title = `${activeYear} 年打卡`;
  } else if (activeTheme) {
    books = booksByTheme(activeTheme);
    title = activeTheme;
  }
  if (onlyFinished) {
    books = books.filter((b) => b.finishReading);
  }
  // sort: finished first, then by readingTime desc
  books = [...books].sort((a, b) => {
    if (!!b.finishReading !== !!a.finishReading) return b.finishReading ? 1 : -1;
    return (b.readingTime ?? 0) - (a.readingTime ?? 0);
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {books.length} 本 · 已读完 {books.filter((b) => b.finishReading).length} 本
        </p>
      </header>

      <FilterBar activeYear={activeYear} activeTheme={activeTheme} onlyFinished={onlyFinished} />

      <BookGrid books={books} />
    </div>
  );
}

function FilterBar({
  activeYear,
  activeTheme,
  onlyFinished,
}: {
  activeYear?: string;
  activeTheme?: string;
  onlyFinished: boolean;
}) {
  const ys = years();
  const ts = themes();
  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        <Chip href={{ pathname: '/shelf' }} active={!activeYear && !activeTheme}>
          全部
        </Chip>
        {ys.map((y) => (
          <Chip key={y} href={{ pathname: '/shelf', query: { year: y } }} active={activeYear === y}>
            {y}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {ts.map((t) => (
          <Chip
            key={t}
            href={{ pathname: '/shelf', query: { theme: t } }}
            active={activeTheme === t}
          >
            {t} <span className="opacity-60 text-xs">{meta.stats.booksByTheme[t]}</span>
          </Chip>
        ))}
      </div>
      <div>
        <Chip
          href={{
            pathname: '/shelf',
            query: {
              ...(activeYear ? { year: activeYear } : {}),
              ...(activeTheme ? { theme: activeTheme } : {}),
              ...(onlyFinished ? {} : { finished: '1' }),
            },
          }}
          active={onlyFinished}
        >
          {onlyFinished ? '✓ 仅显示读完' : '仅显示读完'}
        </Chip>
      </div>
    </div>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: React.ComponentProps<typeof Link>['href'];
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm border transition-colors ${
        active
          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
          : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
      }`}
    >
      {children}
    </Link>
  );
}
