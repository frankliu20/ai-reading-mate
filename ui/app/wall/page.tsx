'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Filter } from 'lucide-react';
import { booksByYear, years, meta } from '@/lib/data';
import type { Book } from '@/lib/types';

export default function WallPage() {
  const allYears = years();
  const [year, setYear] = useState<string>(allYears[0] ?? '');
  const [onlyFinished, setOnlyFinished] = useState(false);

  const books = useMemo<Book[]>(() => {
    let list = booksByYear(year);
    if (onlyFinished) list = list.filter((b) => b.finishReading);
    return list.sort((a, b) => {
      const fa = a.finishReading ? 1 : 0;
      const fb = b.finishReading ? 1 : 0;
      if (fa !== fb) return fb - fa;
      return (b.newRating ?? 0) - (a.newRating ?? 0);
    });
  }, [year, onlyFinished]);

  const totalSeconds = books.reduce((s, b) => s + (b.readingTime ?? 0), 0);
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;
  const finishedCount = books.filter((b) => b.finishReading).length;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">📷 年度照片墙</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          一目了然看完一年的书
        </p>
      </header>

      <section className="-mx-4 px-4 overflow-x-auto md:mx-0 md:px-0 md:overflow-visible">
        <div className="flex gap-2 md:flex-wrap whitespace-nowrap pb-1">
          {allYears.map((y) => {
            const active = y === year;
            const cnt = meta.stats.booksByYear[y];
            return (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
                  active
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
                }`}
              >
                {y}
                <span className={`ml-1.5 text-xs ${active ? 'opacity-80' : ''}`}>
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex items-center justify-between text-sm text-[var(--text-muted)]">
        <div>
          {books.length} 本 · 读完 {finishedCount} 本
          {totalHours > 0 && ` · ${totalHours} 小时`}
        </div>
        <button
          onClick={() => setOnlyFinished((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors ${
            onlyFinished
              ? 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30'
              : 'bg-[var(--bg-card)] border-[var(--border)] hover:text-[var(--text)]'
          }`}
        >
          <Filter size={11} />
          {onlyFinished ? '仅读完' : '全部'}
        </button>
      </section>

      {books.length === 0 ? (
        <div className="text-center text-sm text-[var(--text-muted)] py-12">
          这一年还没有书
        </div>
      ) : (
        <section className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2 sm:gap-3">
          {books.map((b) => (
            <WallCover key={b.bookId} book={b} />
          ))}
        </section>
      )}
    </div>
  );
}

function WallCover({ book }: { book: Book }) {
  return (
    <Link
      href={`/book/${book.bookId}`}
      className="group relative block aspect-[2/3] rounded-md overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
      aria-label={book.title}
    >
      {book.cover ? (
        <Image
          src={book.cover}
          alt={book.title}
          fill
          sizes="(min-width:1024px) 14vw, (min-width:768px) 17vw, (min-width:640px) 25vw, 33vw"
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--text-muted)] p-2 text-center leading-tight">
          {book.title}
        </div>
      )}

      {!book.finishReading && (
        <div className="absolute inset-0 bg-black/15 group-hover:bg-transparent transition-colors" />
      )}

      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-[10px] leading-tight text-white line-clamp-2 font-medium">
          {book.title}
        </div>
        <div className="text-[9px] leading-tight text-white/70 mt-0.5 line-clamp-1">
          {book.author}
        </div>
      </div>

      {book.finishReading && (
        <span className="absolute top-1 right-1 text-[8px] px-1 py-0.5 rounded bg-[var(--accent)]/90 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          读完
        </span>
      )}
    </Link>
  );
}
