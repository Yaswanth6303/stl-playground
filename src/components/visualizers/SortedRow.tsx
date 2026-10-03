/** Shared model and view for set / multiset: a sorted row of values plus end(). */
import { useRef } from "react";
import { sleep } from "../../lib/motion";
import { Cell, type Item, type PanelApi, cx, useModel } from "./kit";

export interface SortedRow {
  items: Item[];
  marks: Record<number, string>;
  cmpK: string | null;
}

export function useSortedRow(p: PanelApi, initial: number[]) {
  const fresh = () =>
    initial
      .slice()
      .sort((a, b) => a - b)
      .map((v) => ({ k: p.uid(), v }));
  const S = useModel<SortedRow>(() => ({ items: fresh(), marks: {}, cmpK: null }));
  const track = useRef<HTMLDivElement>(null);

  const api = {
    S,
    track,
    reset() {
      S.items = fresh();
      S.marks = {};
    },
    /** First index with value >= x. */
    lb: (x: number) => {
      let i = 0;
      while (i < S.items.length && S.items[i].v < x) i++;
      return i;
    },
    /** First index with value > x. */
    ub: (x: number) => {
      let i = 0;
      while (i < S.items.length && S.items[i].v <= x) i++;
      return i;
    },
    /** Binary search that mimics the root-to-leaf walk of a balanced tree. */
    async treePath(x: number): Promise<[number, number]> {
      let lo = 0;
      let hi = S.items.length - 1;
      let steps = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        steps++;
        S.cmpK = S.items[mid].k;
        p.render();
        await sleep(260);
        S.cmpK = null;
        p.render();
        if (S.items[mid].v === x) return [mid, steps];
        if (S.items[mid].v < x) lo = mid + 1;
        else hi = mid - 1;
      }
      return [-1, steps];
    },
    setMarks(m: Record<number, string>) {
      S.marks = m;
    },
    clearMarks() {
      S.marks = {};
    },
  };
  return api;
}

export function SortedTrack({ p, row }: { p: PanelApi; row: ReturnType<typeof useSortedRow> }) {
  const { S, track } = row;
  return (
    <div className="track" ref={track}>
      {S.items.map((it, i) => (
        <Cell key={it.k} k={it.k} v={it.v} tag={S.marks[i] || ""} cls={cx(S.cmpK === it.k && "cmp", p.fx(it.k))} />
      ))}
      <Cell k="end" v="end" cls="ghost" tag={S.marks[S.items.length] || ""} />
    </div>
  );
}
