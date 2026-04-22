import Link from 'next/link';
import type { Book } from '@/lib/types';

export default function HighlightCard({
  icon,
  label,
  book,
  detail,
}: {
  icon: string;
  label: string;
  book: Book | null;
  detail?: string;
}) {
  if (!book) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-sm text-[var(--text-muted)]">
        <div className="text-xs">{icon} {label}</div>
        <div className="mt-1 opacity-50">—</div>
      </div>
    );
  }
  return (
    <Link
      href={`/book/${book.bookId}`}
      className="block rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 hover:border-[var(--accent)] transition-colors"
    >
      <div className="text-xs text-[var(--text-muted)]">
        {icon} {label}
      </div>
      <div className="mt-1 text-sm font-medium line-clamp-2 leading-snug">{book.title}</div>
      {detail && <div className="text-xs text-[var(--accent)] mt-1 tabular-nums">{detail}</div>}
    </Link>
  );
}
