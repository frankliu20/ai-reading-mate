'use client';

import { useEffect, useRef, useState } from 'react';
import { squarify } from '@/lib/squarify';
import { themeColor, type AuthorEntry } from '@/lib/analytics';

export default function AuthorTreemap({
  entries,
  mode,
}: {
  entries: Array<AuthorEntry & { value: number }>;
  mode: 'time' | 'count';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const height = Math.round(width * 0.625);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(Math.floor(e.contentRect.width));
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  // 排序 by value desc
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  const rects = squarify(sorted, { x: 0, y: 0, w: width, h: height });

  return (
    <div ref={ref} className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="block"
      >
        {rects.map(({ item, x, y, w, h }) => {
          const e = item as AuthorEntry & { value: number };
          const showText = w > 60 && h > 28;
          const showDetail = w > 100 && h > 44;
          const color = themeColor(e.primaryTheme);
          return (
            <g key={e.author}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={color}
                stroke="var(--bg)"
                strokeWidth={2}
                rx={3}
                ry={3}
              >
                <title>
                  {e.author} · {e.bookCount} 本{e.totalHours > 0 ? ` · ${e.totalHours}h` : ''} · {e.primaryTheme}
                </title>
              </rect>
              {showText && (
                <text
                  x={x + 6}
                  y={y + 16}
                  className="fill-white"
                  fontSize={11}
                  fontWeight={600}
                  pointerEvents="none"
                >
                  {clip(e.author, Math.floor(w / 8))}
                </text>
              )}
              {showDetail && (
                <text
                  x={x + 6}
                  y={y + 30}
                  className="fill-white opacity-80"
                  fontSize={10}
                  pointerEvents="none"
                >
                  {mode === 'count'
                    ? `${e.bookCount} 本`
                    : `${e.totalHours > 0 ? `${e.totalHours}h` : `${e.bookCount} 本`}`}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, Math.max(1, max - 1)) + '…';
}
