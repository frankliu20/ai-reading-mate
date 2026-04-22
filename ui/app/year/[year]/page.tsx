import { notFound } from 'next/navigation';
import Link from 'next/link';
import { booksByYear, years } from '@/lib/data';
import { topByMetric, themeBreakdown } from '@/lib/analytics';
import CompactCoverGrid from '@/components/CompactCoverGrid';
import HighlightCard from '@/components/HighlightCard';
import ThemeBar from '@/components/ThemeBar';

interface Props {
  params: Promise<{ year: string }>;
}

export function generateStaticParams() {
  return years().map((year) => ({ year }));
}

export default async function YearPage({ params }: Props) {
  const { year } = await params;
  if (!years().includes(year)) notFound();

  const books = booksByYear(year);
  const finished = books.filter((b) => b.finishReading);
  const totalSeconds = books.reduce((s, b) => s + (b.readingTime ?? 0), 0);
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;
  const themes = themeBreakdown(books);

  const longest = topByMetric(books, 'readingTime');
  const topRated = topByMetric(books, 'newRating', (b) => (b.newRatingCount ?? 0) >= 100);
  const mostNotes = topByMetric(books, 'noteCount', (b) => (b.noteCount ?? 0) > 0);
  const recentBook =
    [...books]
      .filter((b) => b.updateTime)
      .sort((a, b) => (b.updateTime ?? '').localeCompare(a.updateTime ?? ''))[0] ?? null;

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-[var(--text-muted)]">
        ← 返回
      </Link>

      <header className="text-center py-4">
        <div className="text-5xl md:text-6xl font-bold tabular-nums text-[var(--accent)]">
          {year}
        </div>
        <div className="text-sm text-[var(--text-muted)] mt-2">
          书目 {books.length} · 读完 {finished.length} · {totalHours} 小时 · {themes.length} 个主题
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <HighlightCard
          icon="⏱️"
          label="读得最久"
          book={longest}
          detail={longest?.readingTimeFormatted}
        />
        <HighlightCard
          icon="⭐"
          label="评分最高"
          book={topRated}
          detail={topRated?.newRating ? `${(topRated.newRating / 100).toFixed(1)} 分` : undefined}
        />
        <HighlightCard
          icon="📝"
          label="标注最多"
          book={mostNotes}
          detail={mostNotes?.noteCount ? `${mostNotes.noteCount} 条` : undefined}
        />
        <HighlightCard
          icon="🔥"
          label="最近翻过"
          book={recentBook}
          detail={
            recentBook?.updateTime
              ? new Date(recentBook.updateTime).toLocaleDateString('zh-CN')
              : undefined
          }
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">
          这一年的书
        </h2>
        <CompactCoverGrid books={books} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">
          主题分布
        </h2>
        <ThemeBar data={themes} total={books.length} />
      </section>
    </div>
  );
}
