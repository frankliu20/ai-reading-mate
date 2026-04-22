interface Axis {
  label: string;
  value: number; // 0-100
}

// 小清新风：低饱和、细线条、留白多。
// 配色用淡薄荷绿，和米色背景搭起来温柔。
const SOFT = '#7ba89a';        // 主色 (薄荷灰绿)
const SOFT_FILL = '#7ba89a22'; // 极淡填充
const GRID = '#d8d2c4';        // 暖灰色网格

export default function RadarChart({
  axes,
  size = 380,
}: {
  axes: Axis[];
  size?: number;
}) {
  const n = axes.length;
  if (n < 3) {
    return (
      <div className="text-center text-sm text-[var(--text-muted)] py-8">
        领域数量不足 3 个，无法生成雷达图
      </div>
    );
  }
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 60;

  const angleFor = (i: number) => -Math.PI / 2 + (i / n) * Math.PI * 2;
  const point = (i: number, ratio: number) => {
    const a = angleFor(i);
    return [cx + Math.cos(a) * r * ratio, cy + Math.sin(a) * r * ratio] as const;
  };

  const ringRatios = [0.25, 0.5, 0.75, 1];
  const rings = ringRatios.map((ratio) => ({
    ratio,
    pts: Array.from({ length: n }, (_, i) => point(i, ratio).join(',')).join(' '),
  }));

  const dataPoints = axes.map((a, i) => point(i, Math.min(1, a.value / 100)));
  const dataPath = dataPoints.map((p) => p.join(',')).join(' ');

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-md mx-auto block"
      role="img"
      aria-label="阅读领域雷达图"
    >
      {/* 同心圆环：极细极淡 */}
      {rings.map(({ ratio, pts }) => (
        <polygon
          key={ratio}
          points={pts}
          fill="none"
          stroke={GRID}
          strokeWidth={0.8}
          opacity={0.6}
        />
      ))}

      {/* 轴线：极淡 */}
      {axes.map((_, i) => {
        const [x, y] = point(i, 1);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke={GRID}
            strokeWidth={0.6}
            opacity={0.5}
          />
        );
      })}

      {/* 数据多边形：淡填充 + 细描边，没有任何 glow/gradient */}
      <polygon
        points={dataPath}
        fill={SOFT_FILL}
        stroke={SOFT}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* 数据点：小巧实心，无外圈 */}
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill={SOFT} />
      ))}

      {/* 标签：温柔的灰，分两行 */}
      {axes.map((a, i) => {
        const [x, y] = point(i, 1.16);
        const angle = angleFor(i);
        const cosA = Math.cos(angle);
        const anchor = cosA > 0.3 ? 'start' : cosA < -0.3 ? 'end' : 'middle';
        return (
          <g key={i}>
            <text
              x={x}
              y={y - 5}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-[var(--text)]"
              fontSize={11}
              fontWeight={500}
              opacity={0.85}
            >
              {a.label}
            </text>
            <text
              x={x}
              y={y + 9}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={10}
              fontWeight={400}
              fill={SOFT}
              style={{ fontVariantNumeric: 'tabular-nums' }}
              opacity={0.8}
            >
              {Math.round(a.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
