import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBook } from '@/lib/data';

interface Props {
  params: Promise<{ bookId: string }>;
}

export default async function BookPage({ params }: Props) {
  const { bookId } = await params;
  const book = getBook(bookId);
  if (!book) notFound();

  return (
    <div className="space-y-6">
      <Link href="/shelf" className="text-sm text-[var(--text-muted)]">
        ← 返回书架
      </Link>

      <div className="flex gap-4">
        <div
          className="relative shrink-0 overflow-hidden rounded-md border border-[var(--border)] shadow-md"
          style={{ width: 140, height: 196 }}
        >
          {book.cover && (
            <Image src={book.cover} alt={book.title} fill sizes="140px" className="object-cover" unoptimized />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold leading-tight">{book.title}</h1>
          <div className="text-sm text-[var(--text-muted)] mt-1">
            {book.author}
            {book.translator && ` / ${book.translator} 译`}
          </div>
          {book.publishTime && (
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              {book.publishTime.slice(0, 10)} 出版
            </div>
          )}
          {book.newRating != null && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-2xl font-semibold tabular-nums text-[var(--accent)]">
                {(book.newRating / 100).toFixed(1)}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {book.ratingTitle} · {book.newRatingCount} 人评分
              </span>
            </div>
          )}
        </div>
      </div>

      <Section title="我的打卡">
        <div className="flex flex-wrap gap-2">
          {book.years.map((y) => (
            <Pill key={y}>{y} 年</Pill>
          ))}
          {book.themes.map((t) => (
            <Pill key={t} accent>
              {t}
            </Pill>
          ))}
          {book.years.length + book.themes.length === 0 && (
            <span className="text-sm text-[var(--text-muted)]">未在任何打卡书单中</span>
          )}
        </div>
      </Section>

      {book.inShelf && (
        <Section title="我的阅读">
          <dl className="grid grid-cols-2 gap-3">
            <Stat label="状态" value={book.finishReading ? '已读完' : `${book.progress ?? 0}%`} />
            <Stat label="阅读时长" value={book.readingTimeFormatted || '—'} />
            <Stat label="标注" value={`${book.noteCount ?? 0} 条`} />
            <Stat label="书签" value={`${book.bookmarkCount ?? 0} 个`} />
            {book.updateTime && (
              <Stat
                label="最近阅读"
                value={new Date(book.updateTime).toLocaleDateString('zh-CN')}
                full
              />
            )}
          </dl>
        </Section>
      )}

      {book.categories.length > 0 && (
        <Section title="分类">
          <div className="flex flex-wrap gap-2">
            {book.categories.map((c) => (
              <Pill key={c}>{c}</Pill>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Pill({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full border ${
        accent
          ? 'border-[var(--accent)] text-[var(--accent)]'
          : 'border-[var(--border)] text-[var(--text-muted)]'
      }`}
    >
      {children}
    </span>
  );
}

function Stat({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div
      className={`rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 ${
        full ? 'col-span-2' : ''
      }`}
    >
      <dt className="text-xs text-[var(--text-muted)]">{label}</dt>
      <dd className="text-base font-medium mt-0.5">{value}</dd>
    </div>
  );
}
