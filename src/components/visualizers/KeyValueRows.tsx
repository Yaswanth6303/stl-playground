/** Shared model and view for map / multimap: sorted key → value rows plus end(). */
import { useRef } from "react";
import { Cell, type PanelApi, cx, useModel } from "./kit";

export interface Entry {
  k: string;
  key: number;
  val: string;
}

/** Sort by key, keeping insertion order among equal keys (as std::multimap does). */
export const stableSort = (a: Entry[]): Entry[] =>
  a
    .map((x, i) => [x, i] as const)
    .sort((x, y) => x[0].key - y[0].key || x[1] - y[1])
    .map((x) => x[0]);

export function useRows(p: PanelApi, initial: [number, string][]) {
  const fresh = () => stableSort(initial.map(([key, val]) => ({ k: p.uid(), key, val })));
  const R = useModel(() => ({
    items: fresh(),
    marks: {} as Record<number, string>,
    cls: {} as Record<number, string>,
  }));
  const box = useRef<HTMLDivElement>(null);
  return {
    R,
    box,
    reset() {
      R.items = fresh();
      R.marks = {};
      R.cls = {};
    },
    setMarks(m: Record<number, string>, c: Record<number, string> = {}) {
      R.marks = m;
      R.cls = c;
    },
    clear() {
      R.marks = {};
      R.cls = {};
    },
  };
}

export function RowsView({ p, rows }: { p: PanelApi; rows: ReturnType<typeof useRows> }) {
  const { R, box } = rows;
  return (
    <div className="rows" ref={box}>
      {R.items.map((it, i) => (
        <Cell key={it.k} k={it.k} cls={cx("kv", R.cls[i], p.fx(it.k))} tag={R.marks[i] || ""}>
          <span>
            <b>{it.key}</b>
            <i>→</i>
            {it.val === "" ? <i>""</i> : it.val}
          </span>
        </Cell>
      ))}
      <Cell k="end" cls="kv ghost" tag={R.marks[R.items.length] || ""}>
        <span>end()</span>
      </Cell>
    </div>
  );
}
