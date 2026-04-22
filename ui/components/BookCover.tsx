import Image from 'next/image';
import Link from 'next/link';
import type { Book } from '@/lib/types';

export default function BookCover({ book, size = 'md' }: { book: Book; size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: { w: 80, h: 112 }, md: { w: 120, h: 168 }, lg: { w: 180, h: 252 } }[size];
  return (
    <Link
      href={`/book/${book.bookId}`}
      className="group flex flex-col gap-1.5 w-fit"
      aria-label={book.title}
    >
      <div
        className="relative overflow-hidden rounded-md bg-[var(--bg-card)] border border-[var(--border)] shadow-sm transition-transform group-hover:-translate-y-0.5 group-hover:shadow-md"
        style={{ width: dims.w, height: dims.h }}
      >
        {book.cover ? (
          <Image
            src={book.cover}
            alt={book.title}
            fill
            sizes={`${dims.w}px`}
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-muted)] p-2 text-center">
            {book.title}
          </div>
        )}
        {book.finishReading && (
          <span className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)] text-white">
            读完
          </span>
        )}
      </div>
      <div className="text-xs leading-tight" style={{ width: dims.w }}>
        <div className="line-clamp-2 font-medium">{book.title}</div>
        <div className="text-[var(--text-muted)] line-clamp-1 mt-0.5">{book.author}</div>
      </div>
    </Link>
  );
}
