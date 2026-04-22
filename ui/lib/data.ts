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

/** Top N authors by reading time */
export function topAuthors(n = 3): Array<{ author: string; hours: number; bookCount: number }> {
  const authorMap = new Map<string, { hours: number; bookCount: number }>();
  allBooks().forEach((b) => {
    if (!b.author) return;
    const current = authorMap.get(b.author) ?? { hours: 0, bookCount: 0 };
    authorMap.set(b.author, {
      hours: current.hours + (b.readingTime ?? 0),
      bookCount: current.bookCount + 1,
    });
  });
  return Array.from(authorMap.entries())
    .map(([author, data]) => ({
      author,
      hours: Math.round((data.hours / 3600) * 10) / 10,
      bookCount: data.bookCount,
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, n);
}

/** Top N themes by book count */
export function topThemes(n = 3): Array<{ theme: string; bookCount: number }> {
  const themeList = themes();
  return themeList.slice(0, n).map((theme) => ({
    theme,
    bookCount: meta.stats.booksByTheme[theme] ?? 0,
  }));
}

/** Year-over-year comparison */
export function yearComparison(): Array<{
  year: string;
  bookCount: number;
  finishedCount: number;
  prevChange?: number;
}> {
  const ys = years();
  const result: Array<{
    year: string;
    bookCount: number;
    finishedCount: number;
    prevChange?: number;
  }> = [];

  ys.forEach((y, idx) => {
    const books = booksByYear(y);
    const finished = books.filter((b) => b.finishReading).length;
    const prev = result[idx - 1];
    const prevChange =
      prev && prev.bookCount > 0
        ? Math.round(((books.length - prev.bookCount) / prev.bookCount) * 100)
        : undefined;

    result.push({
      year: y,
      bookCount: books.length,
      finishedCount: finished,
      prevChange,
    });
  });

  return result;
}

/** Get reading completion rate */
export function completionRate(): { finished: number; total: number; percentage: number } {
  const finished = meta.stats.finished;
  const total = meta.stats.uniqueBooks;
  return {
    finished,
    total,
    percentage: total > 0 ? Math.round((finished / total) * 100) : 0,
  };
}

/** Recommend books based on a given book */
export function recommendBooks(
  book: Book,
  limit = 3,
): Book[] {
  if (!book) return [];

  let candidates = allBooks().filter(
    (b) => b.bookId !== book.bookId && b.finishReading,
  );

  // Strategy 1: Same theme, sorted by reading time
  const sameTheme = candidates
    .filter((b) => b.themes.some((t) => book.themes.includes(t)))
    .sort((a, b) => (b.readingTime ?? 0) - (a.readingTime ?? 0))
    .slice(0, limit);

  if (sameTheme.length >= limit) return sameTheme;

  // Strategy 2: Same author, sorted by reading time
  if (book.author) {
    const sameAuthor = candidates
      .filter((b) => b.author === book.author)
      .sort((a, b) => (b.readingTime ?? 0) - (a.readingTime ?? 0));
    return [...sameTheme, ...sameAuthor].slice(0, limit);
  }

  return sameTheme;
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
