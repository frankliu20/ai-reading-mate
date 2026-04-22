import type { Book, Metadata } from './types';
import raw from './_data/booklists.json';

export const meta = raw as unknown as Metadata;

export function allBooks(): Book[] {
  return Object.values(meta.books);
}

export function getBook(bookId: string): Book | undefined {
  return meta.books[bookId];
}

export function years(): string[] {
  return Object.keys(meta.stats.booksByYear).sort().reverse();
}

export function themes(): string[] {
  return Object.entries(meta.stats.booksByTheme)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
}

export function booksByYear(year: string): Book[] {
  return allBooks().filter((b) => b.years.includes(year));
}

export function booksByTheme(theme: string): Book[] {
  return allBooks().filter((b) => b.themes.includes(theme));
}

export function search(q: string): Book[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return allBooks().filter(
    (b) =>
      b.title.toLowerCase().includes(s) ||
      b.author.toLowerCase().includes(s) ||
      b.translator.toLowerCase().includes(s),
  );
}

/** Slim payload for sending to LLM — drop covers, urls, etc. */
export function toLLMSummary(b: Book) {
  return {
    title: b.title,
    author: b.author,
    years: b.years,
    themes: b.themes,
    categories: b.categories,
    rating: b.newRating,
    finished: b.finishReading,
    notes: b.noteCount ?? 0,
    readingHours: Math.round((b.readingTime ?? 0) / 360) / 10,
  };
}
