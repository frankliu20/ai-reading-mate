import Link from 'next/link';
import Image from 'next/image';
import type { DomainProfile } from '@/lib/analytics';

const LEVEL_STYLES: Record<DomainProfile['level'], { bg: string; ring?: string; emoji: string }> = {
  入门: { bg: '#b8b0a3', emoji: '🌱' },
  进阶: { bg: '#d99a3f', emoji: '🌿' },
  深入: { bg: '#6b3410', emoji: '🌳' },
  精通: { bg: 'linear-gradient(135deg, #ff7e3d 0%, #d4470c 100%)', ring: '#ffd9b8', emoji: '✨' },
};

export default function DomainCard({ p }: { p: DomainProfile }) {
  const style = LEVEL_STYLES[p.level];
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold truncate">{p.theme}</h3>
        <span
          className="shrink-0 text-xs px-2.5 py-1 rounded-full text-white font-medium"
          style={{
            background: style.bg,
            boxShadow: style.ring ? `0 0 0 2px ${style.ring}` : undefined,
          }}
        >
          {style.emoji} {p.level} · {p.score}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs text-[var(--text-muted)]">
        <Stat label="书目" value={`${p.bookCount}`} />
        <Stat label="时长" value={`${p.totalHours}h`} />
        <Stat label="跨度" value={`${p.yearSpan} 年`} />
        <Stat label="作者" value={`${p.authorCount}`} />
        <Stat label="完读" value={`${Math.round(p.finishRate * 100)}%`} />
        <Stat label="评分" value={p.avgRating ? (p.avgRating / 100).toFixed(1) : '—'} />
      </div>

      {p.topBooks.length > 0 && (
        <div>
          <div className="text-xs text-[var(--text-muted)] mb-1.5">代表作</div>
          <div className="flex gap-2">
            {p.topBooks.map((b) => (
              <Link
                key={b.bookId}
                href={`/book/${b.bookId}`}
                title={b.title}
                className="relative shrink-0 overflow-hidden rounded-sm border border-[var(--border)]"
                style={{ width: 48, height: 64 }}
              >
                {b.cover && (
                  <Image src={b.cover} alt={b.title} fill sizes="48px" className="object-cover" />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="opacity-70">{label}</div>
      <div className="text-sm font-medium text-[var(--text)] tabular-nums">{value}</div>
    </div>
  );
}
