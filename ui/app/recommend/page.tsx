'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, AlertCircle } from 'lucide-react';
import OpenAI from 'openai';
import { meta } from '@/lib/data';
import { getStoredApiKey, getStoredModel } from '@/lib/apiKey';
import BookCover from '@/components/BookCover';

interface Recommendation {
  bookId?: string;
  title: string;
  author: string;
  reason: string;
  inMyShelf: boolean;
}

export default function RecommendPage() {
  const [mood, setMood] = useState('');
  const [scope, setScope] = useState<'inShelf' | 'discovery'>('discovery');
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);

  const allThemes = Object.keys(meta.stats.booksByTheme);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const togglePick = (t: string) => {
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });
  };

  const run = async () => {
    setError(null);
    setRecs([]);
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setError('请先去「设置」填入豆包 / 火山方舟 API key');
      return;
    }
    setLoading(true);
    try {
      const result = await fetchRecommendations({
        apiKey,
        model: getStoredModel(),
        mood,
        picked: [...picked],
        scope,
        count,
      });
      setRecs(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm text-[var(--text-muted)]">
        ← 返回
      </Link>

      <header>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Sparkles size={20} className="text-[var(--accent)]" /> AI 推荐
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          基于你的 {meta.stats.uniqueBooks} 本打卡数据
        </p>
      </header>

      <section className="space-y-2">
        <label className="text-sm font-medium">想读什么感觉的？</label>
        <input
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          placeholder="比如：能下饭的小说 / 让我清醒一下的哲学书 / ..."
          className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-card)] focus:outline-none focus:border-[var(--accent)]"
        />
      </section>

      <section className="space-y-2">
        <label className="text-sm font-medium">主题偏好（可多选，可不选）</label>
        <div className="flex flex-wrap gap-2">
          {allThemes.map((t) => (
            <button
              key={t}
              onClick={() => togglePick(t)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                picked.has(t)
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <label className="text-sm font-medium">从哪里推荐</label>
        <div className="grid grid-cols-2 gap-2">
          <ScopeOption
            active={scope === 'discovery'}
            onClick={() => setScope('discovery')}
            title="发现新书"
            desc="基于你的口味推荐没读过的"
          />
          <ScopeOption
            active={scope === 'inShelf'}
            onClick={() => setScope('inShelf')}
            title="重读已有"
            desc="从你已经读过的里再选"
          />
        </div>
      </section>

      <section className="space-y-2">
        <label className="text-sm font-medium">推荐数量</label>
        <div className="flex gap-2">
          {[1, 3, 5, 10].map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                count === n
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
              }`}
            >
              {n} 本
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={run}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--accent)] text-white font-medium disabled:opacity-50"
      >
        <Sparkles size={16} /> {loading ? '思考中…' : `推荐 ${count} 本`}
      </button>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 text-sm text-red-700 dark:text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div className="space-y-1">
            <div>{error}</div>
            {error.includes('设置') && (
              <Link href="/settings" className="underline">
                去设置 →
              </Link>
            )}
          </div>
        </div>
      )}

      {recs.length > 0 && (
        <section className="space-y-3 pt-2">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">
            为你挑了
          </h2>
          {recs.map((r, i) => (
            <RecCard key={i} rec={r} />
          ))}
        </section>
      )}
    </div>
  );
}

function ScopeOption({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-3 rounded-lg border transition-colors ${
        active
          ? 'border-[var(--accent)] bg-[var(--accent)]/5'
          : 'border-[var(--border)] bg-[var(--bg-card)]'
      }`}
    >
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</div>
    </button>
  );
}

function RecCard({ rec }: { rec: Recommendation }) {
  const book = rec.bookId ? meta.books[rec.bookId] : undefined;
  return (
    <div className="flex gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
      {book ? (
        <BookCover book={book} size="sm" />
      ) : (
        <div className="w-20 h-28 shrink-0 rounded-md bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--text-muted)] text-center p-2">
          {rec.title}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium leading-tight">{rec.title}</div>
        <div className="text-sm text-[var(--text-muted)] mt-0.5">{rec.author}</div>
        {!rec.inMyShelf && (
          <div className="inline-block text-[10px] mt-1 px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)]">
            书架外推荐
          </div>
        )}
        <p className="text-sm mt-2 leading-relaxed">{rec.reason}</p>
      </div>
    </div>
  );
}

// ----- LLM call -----

async function fetchRecommendations(opts: {
  apiKey: string;
  model: string;
  mood: string;
  picked: string[];
  scope: 'inShelf' | 'discovery';
  count: number;
}): Promise<Recommendation[]> {
  const client = new OpenAI({
    apiKey: opts.apiKey,
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    dangerouslyAllowBrowser: true,
  });

  const myBooks = Object.values(meta.books).map((b) => {
    const read = !!b.finishReading || b.years.length > 0;
    return {
      id: b.bookId,
      title: b.title,
      author: b.author,
      themes: b.themes,
      years: b.years,
      rating: b.newRating,
      // status:
      //   read   = 有读过的痕迹（年份书单 / finishReading）
      //   shelf  = 在某个 booklist 里出现过（用户加过书架，可能漏标年份）
      status: read ? 'read' : 'shelf',
    };
  });

  const sys = `你是一个懂用户的私人阅读顾问。用户给你一份他自己的"打卡书单"——他在微信读书里加进过任何书单的所有书。请基于这份书单的口味，给出 ${opts.count} 本推荐。

## 输入
- mood: 用户对"想读什么感觉"的描述
- picked_themes: 用户偏好的主题（可能为空）
- scope:
    "discovery" = 推荐 my_books **完全不存在**的新书（不论 status，凡是出现在 my_books 里都不算 discovery）
    "inShelf" = 从 my_books 里 status=read 的书里挑 ${opts.count} 本值得重读的
- my_books: 用户的全部书目，每条带 status 字段
    - status=read: 已读完或有年份记录
    - status=shelf: 在书架里但没明确读过记录（可能是漏标 / 想读 / 在读）

## 重要规则
- discovery 模式下，**绝对不要推荐 my_books 数组里任何书**（无论 status 是 read 还是 shelf）。这些书用户都已经"认识"了。
- inShelf 模式只能从 status=read 的书里选。
- **必须返回正好 ${opts.count} 本**，不能多也不能少。
- 每条 reason 1-2 句话，要具体，引用用户的实际阅读痕迹（"你 2024 年读了 X，所以..."），不要泛泛而谈。
- 中文输出。

## 输出（严格 JSON，不要 markdown 代码块包裹）
{
  "recommendations": [
    {
      "title": "书名",
      "author": "作者",
      "bookId": "如果是 my_books 里的（仅 inShelf 模式），必须填 id；discovery 模式下省略",
      "inMyShelf": true | false,
      "reason": "..."
    },
    ...共 ${opts.count} 本
  ]
}`;

  const usr = `请基于下面的信息返回**正好 ${opts.count} 本**推荐（不能多也不能少，少 1 本都不行）。

mood: ${opts.mood || '(未指定)'}
picked_themes: ${JSON.stringify(opts.picked)}
scope: ${opts.scope}
expected_count: ${opts.count}
my_books: ${JSON.stringify(myBooks)}

⚠️ 再次强调：recommendations 数组的长度必须等于 ${opts.count}。`;

  // ---------- log: request ----------
  const endpoint = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
  console.groupCollapsed(
    `%c[AI 推荐] → POST ${endpoint}`,
    'color:#7ba89a;font-weight:600',
  );
  console.log('model:', opts.model);
  console.log('scope:', opts.scope, '| mood:', opts.mood || '(未指定)', '| picked:', opts.picked);
  console.log(
    'my_books:',
    myBooks.length,
    '本（read:',
    myBooks.filter((b) => b.status === 'read').length,
    ', shelf:',
    myBooks.filter((b) => b.status === 'shelf').length,
    '）',
  );
  console.log('user prompt size:', usr.length, 'chars');
  console.groupEnd();

  const t0 = performance.now();
  const resp = await client.chat.completions.create({
    model: opts.model,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: usr },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.6,
    max_tokens: Math.max(2048, opts.count * 400),
  });
  const dt = Math.round(performance.now() - t0);

  const text = resp.choices[0]?.message?.content ?? '';

  // ---------- log: response ----------
  console.groupCollapsed(
    `%c[AI 推荐] ← 响应 (${dt}ms)`,
    'color:#7ba89a;font-weight:600',
  );
  console.log('finish_reason:', resp.choices[0]?.finish_reason);
  console.log('usage:', resp.usage);
  console.log('content:', text);
  console.groupEnd();

  // tolerate ```json fences just in case
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');

  let parsed: { recommendations: Recommendation[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('AI 返回的不是合法 JSON：\n' + cleaned.slice(0, 200));
  }
  const recs = parsed.recommendations || [];
  if (recs.length !== opts.count) {
    console.warn(
      `%c[AI 推荐] 数量不符：期望 ${opts.count}，实际 ${recs.length}`,
      'color:#d97706;font-weight:600',
    );
  }
  return recs;
}
