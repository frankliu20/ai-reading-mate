import type { Book } from './types';
import { allBooks, meta } from './data';

// ---------- 通用 ----------

export function topByMetric<K extends keyof Book>(
  books: Book[],
  key: K,
  filter?: (b: Book) => boolean,
): Book | null {
  const pool = filter ? books.filter(filter) : books;
  if (pool.length === 0) return null;
  return [...pool].sort((a, b) => {
    const av = (a[key] as number | null | undefined) ?? -Infinity;
    const bv = (b[key] as number | null | undefined) ?? -Infinity;
    return (bv as number) - (av as number);
  })[0];
}

export function themeBreakdown(books: Book[]): Array<{ theme: string; count: number }> {
  const m = new Map<string, number>();
  for (const b of books) {
    for (const t of b.themes) m.set(t, (m.get(t) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count);
}

// ---------- 作者名清洗 ----------

const AUTHOR_PREFIX_RE = /^[\[【(（][^\]\】)）]{1,4}[\]\】)）]\s*/;

export function cleanAuthor(raw: string): string {
  if (!raw) return '佚名';
  let s = raw.trim();
  // 去多次 [美] (美) etc.
  while (AUTHOR_PREFIX_RE.test(s)) s = s.replace(AUTHOR_PREFIX_RE, '');
  // 多作者只取首位
  const seps = /[\/、，,；;]/;
  if (seps.test(s)) s = s.split(seps)[0];
  return s.trim() || '佚名';
}

// ---------- M3.B 领域档案 ----------

export interface DomainProfile {
  theme: string;
  bookCount: number;
  totalHours: number;
  finishRate: number;
  yearSpan: number;
  authorCount: number;
  avgRating: number | null;
  topBooks: Book[];
  score: number;
  level: '入门' | '进阶' | '深入' | '精通';
}

export function domainProfile(theme: string): DomainProfile {
  const books = allBooks().filter((b) => b.themes.includes(theme));
  const inShelf = books.filter((b) => b.inShelf);
  const totalSeconds = inShelf.reduce((s, b) => s + (b.readingTime ?? 0), 0);
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;
  const finished = books.filter((b) => b.finishReading).length;
  const finishRate = books.length > 0 ? finished / books.length : 0;
  // 跨年
  const ys = new Set<string>();
  books.forEach((b) => b.years.forEach((y) => ys.add(y)));
  const yearArr = [...ys].map(Number).filter((n) => !isNaN(n));
  const yearSpan = yearArr.length === 0 ? 0 : Math.max(...yearArr) - Math.min(...yearArr) + 1;
  // 作者多样性
  const authors = new Set(books.map((b) => cleanAuthor(b.author)));
  const authorCount = authors.size;
  // 品味（过滤冷门）
  const ratable = books.filter((b) => b.newRating != null && (b.newRatingCount ?? 0) >= 100);
  const avgRating =
    ratable.length === 0
      ? null
      : Math.round(ratable.reduce((s, b) => s + (b.newRating ?? 0), 0) / ratable.length);
  // top 3 by readingTime
  const topBooks = [...books]
    .sort((a, b) => (b.readingTime ?? 0) - (a.readingTime ?? 0))
    .slice(0, 3);

  const score =
    Math.min(25, books.length * 1.5) +
    Math.min(25, totalHours / 2) +
    finishRate * 20 +
    Math.min(15, yearSpan * 5) +
    Math.min(15, ((avgRating ?? 0) / 100) * 1.5);
  const level: DomainProfile['level'] =
    score < 25 ? '入门' : score < 50 ? '进阶' : score < 75 ? '深入' : '精通';

  return {
    theme,
    bookCount: books.length,
    totalHours,
    finishRate,
    yearSpan,
    authorCount,
    avgRating,
    topBooks,
    score: Math.round(score),
    level,
  };
}

export function allDomainProfiles(): DomainProfile[] {
  return Object.keys(meta.stats.booksByTheme)
    .map((t) => domainProfile(t))
    .sort((a, b) => b.score - a.score);
}

// ---------- M3.C 作者档案 ----------

export interface AuthorEntry {
  author: string;
  bookCount: number;
  totalSeconds: number;
  totalHours: number;
  primaryTheme: string;
  books: Book[];
}

const AVG_FALLBACK_SECONDS_PER_BOOK = 2 * 3600; // 没读过的书估个 2h，避免 treemap 空

export function authorProfiles(): AuthorEntry[] {
  const m = new Map<string, AuthorEntry>();
  for (const b of allBooks()) {
    const name = cleanAuthor(b.author);
    let e = m.get(name);
    if (!e) {
      e = { author: name, bookCount: 0, totalSeconds: 0, totalHours: 0, primaryTheme: '其他', books: [] };
      m.set(name, e);
    }
    e.bookCount += 1;
    e.totalSeconds += b.readingTime ?? 0;
    e.books.push(b);
  }
  // 决定 primaryTheme
  for (const e of m.values()) {
    const tc = new Map<string, number>();
    for (const b of e.books) for (const t of b.themes) tc.set(t, (tc.get(t) ?? 0) + 1);
    if (tc.size > 0) {
      e.primaryTheme = [...tc.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }
    e.totalHours = Math.round((e.totalSeconds / 3600) * 10) / 10;
  }
  return [...m.values()].sort((a, b) => b.totalSeconds - a.totalSeconds);
}

export function authorAreaValue(e: AuthorEntry, mode: 'time' | 'count'): number {
  if (mode === 'count') return e.bookCount;
  // time mode：如果该作者所有书 readingTime 都 0，回退按本数估算
  if (e.totalSeconds > 0) return e.totalSeconds;
  return e.bookCount * AVG_FALLBACK_SECONDS_PER_BOOK;
}

// ---------- 主题颜色映射 ----------

// 按主题地域/性质设计：每个主题有辨识度，但整体协调（中等饱和度，深一点保证白字可读）
export const THEME_COLORS: Record<string, string> = {
  // 中国文学：朱砂红
  中国文学: '#b8401e',
  // 拉美文学：赤陶橙（拉美热情）
  拉美文学: '#d97706',
  // 苏俄文学：深石板蓝（北方冷峻）
  苏俄文学: '#475569',
  // 日韩文学：烟粉（樱）
  日韩文学: '#be7da5',
  // 德意奥文学：赭石黄
  德意奥文学: '#a16207',
  // 法国文学：紫罗兰
  法国文学: '#7c3aed',
  // 英美加文学：深青（海洋）
  英美加文学: '#0e7490',
  // 科幻：深蓝紫
  科幻: '#1e40af',
  // 阿加莎：墨色（侦探氛围）
  阿加莎: '#44403c',
  // 社科哲学：深橄榄绿（学术）
  社科哲学: '#3f6212',
  // 理想国译丛：深酒红
  理想国译丛: '#831843',
  // 历史：古铜金
  历史: '#854d0e',
  // 其他：暖灰
  其他: '#78716c',
};

export function themeColor(theme: string): string {
  return THEME_COLORS[theme] ?? THEME_COLORS['其他'];
}
