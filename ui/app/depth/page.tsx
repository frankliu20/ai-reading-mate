import Link from 'next/link';
import { allDomainProfiles } from '@/lib/analytics';
import RadarChart from '@/components/RadarChart';
import DomainCard from '@/components/DomainCard';

const MIN_BOOKS_FOR_LEVEL = 3;

export default function DepthPage() {
  const all = allDomainProfiles();
  const ranked = all.filter((d) => d.bookCount >= MIN_BOOKS_FOR_LEVEL);
  const lite = all.filter((d) => d.bookCount < MIN_BOOKS_FOR_LEVEL);

  // 雷达图取 top 6
  const radarAxes = ranked.slice(0, 6).map((d) => ({ label: d.theme, value: d.score }));

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-[var(--text-muted)]">
        ← 返回
      </Link>

      <header>
        <h1 className="text-2xl font-semibold">📊 我的阅读地图</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {ranked.length} 个主要领域 · 段位由广度+投入度+完成率+持续性+品味综合算出
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <RadarChart axes={radarAxes} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">
          领域档案
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {ranked.map((d) => (
            <DomainCard key={d.theme} p={d} />
          ))}
        </div>
      </section>

      {lite.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">
            轻量涉猎（&lt; {MIN_BOOKS_FOR_LEVEL} 本）
          </h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {lite.map((d) => (
              <span
                key={d.theme}
                className="px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]"
              >
                {d.theme}{' '}
                <span className="opacity-60 text-xs tabular-nums">{d.bookCount}</span>
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
