import Image from 'next/image';
import Link from 'next/link';
import type { Book } from '@/lib/types';

export default function CompactCoverGrid({ books }: { books: Book[] }) {
  if (books.length === 0) {
    return <div className="py-12 text-center text-sm text-[var(--text-muted)]">这一年还没有书</div>;
  }
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}
    >
      {books.map((b) => (
        <Link
          key={b.bookId}
          href={`/book/${b.bookId}`}
          title={`${b.title} — ${b.author}`}
          className="group relative aspect-[3/4] overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--bg-card)]"
        >
          {b.cover ? (
            <Image
              src={b.cover}
              alt={b.title}
              fill
              sizes="72px"
              unoptimized
              className={`object-cover transition-transform group-hover:scale-105 ${
                b.finishReading ? '' : 'opacity-50 grayscale'
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] p-1 text-center text-[var(--text-muted)]">
              {b.title}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
