/**
 * Squarified treemap algorithm.
 * Bruls, Huijsen, van Wijk 2000.
 *
 * Input: items sorted by value desc, container rect.
 * Output: each item gets x/y/w/h.
 */

export interface TreemapItem {
  value: number;
}

export interface TreemapRect<T> {
  item: T;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function squarify<T extends TreemapItem>(
  items: T[],
  container: Rect,
): TreemapRect<T>[] {
  const totalValue = items.reduce((s, it) => s + Math.max(0, it.value), 0);
  if (totalValue <= 0 || items.length === 0) return [];
  const containerArea = container.w * container.h;
  // 单位 value 的面积
  const scale = containerArea / totalValue;
  const scaled = items.map((it) => ({ item: it, area: Math.max(0, it.value) * scale }));

  const out: TreemapRect<T>[] = [];
  squarifyInner(scaled, [], smallerSide(container), { ...container }, out);
  return out;
}

function smallerSide(r: Rect): number {
  return Math.min(r.w, r.h);
}

interface Scaled<T> {
  item: T;
  area: number;
}

function worstAspect(row: { area: number }[], width: number): number {
  if (row.length === 0) return Infinity;
  const total = row.reduce((s, r) => s + r.area, 0);
  if (total <= 0) return Infinity;
  let max = -Infinity;
  let min = Infinity;
  for (const r of row) {
    if (r.area > max) max = r.area;
    if (r.area < min) min = r.area;
  }
  const w2 = width * width;
  const t2 = total * total;
  return Math.max((w2 * max) / t2, t2 / (w2 * min));
}

function squarifyInner<T>(
  remaining: Scaled<T>[],
  row: Scaled<T>[],
  width: number,
  rect: Rect,
  out: TreemapRect<T>[],
): void {
  if (remaining.length === 0) {
    layoutRow(row, width, rect, out);
    return;
  }
  const head = remaining[0];
  const newRow = [...row, head];
  if (row.length === 0 || worstAspect(newRow, width) <= worstAspect(row, width)) {
    squarifyInner(remaining.slice(1), newRow, width, rect, out);
  } else {
    const newRect = layoutRow(row, width, rect, out);
    squarifyInner(remaining, [], smallerSide(newRect), newRect, out);
  }
}

function layoutRow<T>(
  row: Scaled<T>[],
  width: number,
  rect: Rect,
  out: TreemapRect<T>[],
): Rect {
  if (row.length === 0) return rect;
  const total = row.reduce((s, r) => s + r.area, 0);
  if (total <= 0) return rect;
  const thickness = total / width;
  const horizontal = rect.w >= rect.h;
  if (horizontal) {
    // 在左边占一列宽 thickness
    let y = rect.y;
    for (const r of row) {
      const h = r.area / thickness;
      out.push({ item: r.item, x: rect.x, y, w: thickness, h });
      y += h;
    }
    return { x: rect.x + thickness, y: rect.y, w: rect.w - thickness, h: rect.h };
  } else {
    // 在上边占一行高 thickness
    let x = rect.x;
    for (const r of row) {
      const w = r.area / thickness;
      out.push({ item: r.item, x, y: rect.y, w, h: thickness });
      x += w;
    }
    return { x: rect.x, y: rect.y + thickness, w: rect.w, h: rect.h - thickness };
  }
}
