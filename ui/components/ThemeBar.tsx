export default function ThemeBar({
  data,
  total,
}: {
  data: Array<{ theme: string; count: number }>;
  total: number;
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div className="space-y-1.5">
      {data.map((d) => {
        const pct = (d.count / max) * 100;
        const share = Math.round((d.count / total) * 100);
        return (
          <div key={d.theme} className="flex items-center gap-3 text-sm">
            <div className="w-20 shrink-0 truncate text-[var(--text-muted)]">{d.theme}</div>
            <div className="flex-1 h-3 rounded-full bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="w-16 text-right tabular-nums text-xs text-[var(--text-muted)]">
              {d.count} · {share}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
