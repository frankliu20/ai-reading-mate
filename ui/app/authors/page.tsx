'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { authorProfiles, authorAreaValue, themeColor, THEME_COLORS, booksByAuthor } from '@/lib/analytics';
import AuthorTreemap from '@/components/AuthorTreemap';
import BookCover from '@/components/BookCover';

export default function AuthorsPage() {
  const [mode, setMode] = useState<'time' | 'count'>('time');
  const [expandedAuthor, setExpandedAuthor] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const all = useMemo(() => authorProfiles(), []);
  const entries = useMemo(
    () =>
      all
        .map((e) => ({ ...e, value: authorAreaValue(e, mode) }))
        .filter((e) => e.value > 0)
        .slice(0, 80), // 防止 treemap 过碎
    [all, mode],
  );

  const top10 = useMemo(() => {
    return [...all]
      .sort((a, b) => authorAreaValue(b, mode) - authorAreaValue(a, mode))
      .slice(0, 10);
  }, [all, mode]);

  const usedThemes = useMemo(() => {
    const s = new Set<string>();
    entries.forEach((e) => s.add(e.primaryTheme));
    return [...s];
  }, [entries]);

  if (!mounted) return null;

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm text-[var(--text-muted)]">
        ← 返回
      </Link>

      <header>
        <h1 className="text-2xl font-semibold">✍️ 我读过的作者</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {all.length} 位作者 · 矩形面积 = {mode === 'time' ? '阅读时长' : '本数'}，颜色 = 主要主题
        </p>
      </header>

      <div className="flex gap-2">
        <ToggleBtn active={mode === 'time'} onClick={() => setMode('time')}>
          按时长
        </ToggleBtn>
        <ToggleBtn active={mode === 'count'} onClick={() => setMode('count')}>
          按本数
        </ToggleBtn>
      </div>

      <section className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-card)]">
        <AuthorTreemap entries={entries} mode={mode} />
      </section>

      <section className="space-y-2">
        <div className="text-xs text-[var(--text-muted)]">主题图例</div>
        <div className="flex flex-wrap gap-2 text-xs">
          {usedThemes.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border)]"
            >
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ backgroundColor: themeColor(t) }}
              />
              {t}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">
          TOP 10 作者
        </h2>
        <ol className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          {top10.map((e, i) => (
            <li key={e.author}>
              <button
                onClick={() => setExpandedAuthor(expandedAuthor === e.author ? null : e.author)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors text-left"
              >
                <span className="w-6 text-sm text-[var(--text-muted)] tabular-nums">
                  {i + 1}
                </span>
                <span
                  className="w-2 h-8 rounded shrink-0"
                  style={{ backgroundColor: themeColor(e.primaryTheme) }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{e.author}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {e.bookCount} 本{e.totalHours > 0 && ` · ${e.totalHours}h`} · {e.primaryTheme}
                  </div>
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  {expandedAuthor === e.author ? '▼' : '▶'}
                </span>
              </button>
              {expandedAuthor === e.author && (
                <div className="border-t border-[var(--border)] p-4 bg-[var(--bg-secondary)]">
                  <AuthorBooks author={e.author} />
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      <p className="text-xs text-[var(--text-muted)] pt-2">
        颜色覆盖范围：{Object.keys(THEME_COLORS).length} 个主题。未匹配的主题统一显示为灰色。
      </p>
    </div>
  );
}

function AuthorBooks({ author }: { author: string }) {
  const books = useMemo(() => booksByAuthor(author), [author]);

  return (
    <div className="space-y-3">
      <div className="text-xs text-[var(--text-muted)]">{books.length} 本书</div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {books.map((book) => (
          <BookCover key={book.bookId} book={book} size="sm" />
        ))}
      </div>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-sm px-4 py-2.5 rounded-full border transition-colors ${
        active
          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
          : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
      }`}
    >
      {children}
    </button>
  );
}
