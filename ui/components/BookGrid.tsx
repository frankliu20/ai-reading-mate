import type { Book } from '@/lib/types';
import BookCover from './BookCover';

export default function BookGrid({ books, size = 'md' }: { books: Book[]; size?: 'sm' | 'md' | 'lg' }) {
  if (books.length === 0) {
    return (
      <div className="py-16 text-center text-[var(--text-muted)] text-sm">这里还没有书</div>
    );
  }
  return (
    <div className="grid gap-x-4 gap-y-6 justify-items-center" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
      {books.map((b) => (
        <BookCover key={b.bookId} book={b} size={size} />
      ))}
    </div>
  );
}
