import Link from 'next/link';
import { meta, allBooks, themes, years } from '@/lib/data';
import BookCover from '@/components/BookCover';

export default function HomePage() {
  const s = meta.stats;
  // pick a deterministic "today's book": rotate through finished books by date
  const finished = allBooks().filter((b) => b.finishReading);
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % finished.length;
  const todayBook = finished[dayIndex];

  return (
    <div className="space-y-8">
      <header className="pt-2">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">我的阅读</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          数据更新于 {new Date(meta.generated_at).toLocaleDateString('zh-CN')}
        </p>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <StatCard label="累计书目" value={s.uniqueBooks} unit="本" />
        <StatCard label="已读完" value={s.finished} unit="本" />
        <StatCard label="阅读时长" value={s.totalReadingHours} unit="小时" />
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">今日推荐回顾</h2>
          <Link href="/recommend" className="text-xs text-[var(--accent)]">
            AI 推荐 →
          </Link>
        </div>
        {todayBook && (
          <div className="flex gap-4 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            <BookCover book={todayBook} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[var(--text-muted)]">今天回顾这本</div>
              <div className="font-medium mt-1 line-clamp-2">{todayBook.title}</div>
              <div className="text-sm text-[var(--text-muted)] mt-0.5">{todayBook.author}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {todayBook.years.map((y) => (
                  <Tag key={y}>{y}</Tag>
                ))}
                {todayBook.themes.map((t) => (
                  <Tag key={t} variant="theme">
                    {t}
                  </Tag>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">深度回顾</h2>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/depth"
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 hover:border-[var(--accent)] transition-colors"
          >
            <div className="text-base font-semibold">📊 阅读地图</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              领域段位 · 雷达图
            </div>
          </Link>
          <Link
            href="/authors"
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 hover:border-[var(--accent)] transition-colors"
          >
            <div className="text-base font-semibold">✍️ 作者地图</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              Treemap · 谁占了我多少时间
            </div>
          </Link>
          <Link
            href="/wall"
            className="col-span-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 hover:border-[var(--accent)] transition-colors"
          >
            <div className="text-base font-semibold">📷 年度照片墙</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              一年的封面平铺，一目了然
            </div>
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">按年份</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {years().map((y) => (
            <Link
              key={y}
              href={`/year/${y}`}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 text-center hover:border-[var(--accent)] transition-colors"
            >
              <div className="text-xl font-semibold">{y}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                {s.booksByYear[y]} 本
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">按主题</h2>
        <div className="flex flex-wrap gap-2">
          {themes().map((t) => (
            <Link
              key={t}
              href={{ pathname: '/shelf', query: { theme: t } }}
              className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-sm hover:border-[var(--accent)] transition-colors"
            >
              {t}{' '}
              <span className="text-[var(--text-muted)] text-xs">
                {s.booksByTheme[t]}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-center">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-[var(--text-muted)] mt-0.5">
        {unit} · {label}
      </div>
    </div>
  );
}

function Tag({ children, variant }: { children: React.ReactNode; variant?: 'theme' }) {
  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded ${
        variant === 'theme'
          ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
          : 'bg-[var(--border)]/60 text-[var(--text-muted)]'
      }`}
    >
      {children}
    </span>
  );
}
