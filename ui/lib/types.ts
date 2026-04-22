export interface Book {
  bookId: string;
  title: string;
  author: string;
  translator: string;
  cover: string;
  publishTime: string;
  categories: string[];
  newRating: number | null;
  newRatingCount: number | null;
  ratingTitle: string;
  years: string[];
  themes: string[];
  inShelf: boolean;
  finishReading?: boolean;
  progress?: number;
  readingTime?: number;
  readingTimeFormatted?: string;
  updateTime?: string;
  noteCount?: number;
  reviewCount?: number;
  bookmarkCount?: number;
  paid?: boolean;
}

export interface BooklistMeta {
  booklistId: string;
  name: string;
  kind: 'year' | 'theme';
  label: string;
  totalCount: number;
  bookIds: string[];
}

export interface Stats {
  totalBooklists: number;
  yearBooklists: number;
  themeBooklists: number;
  uniqueBooks: number;
  booksByYear: Record<string, number>;
  booksByTheme: Record<string, number>;
  inShelf: number;
  finished: number;
  withNotes: number;
  totalReadingHours: number;
}

export interface Metadata {
  generated_at: string;
  source: string;
  user_vid: string;
  stats: Stats;
  booklists: BooklistMeta[];
  books: Record<string, Book>;
}
