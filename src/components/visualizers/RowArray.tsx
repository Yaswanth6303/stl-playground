/** Shared model and view for an indexed row of values (the original `rowArray`). */
import { useRef } from "react";
import { Cell, type Item, type PanelApi, cx, useModel } from "./kit";

export function useRowArray(p: PanelApi, initial: number[]) {
  const fresh = () => initial.map((v) => ({ k: p.uid(), v }));
  const A = useModel(() => ({
    items: fresh() as Item[],
    cls: {} as Record<number, string>,
    tags: {} as Record<number, string>,
  }));
  const track = useRef<HTMLDivElement>(null);
  return {
    A,
    track,
    reset() {
      A.items = fresh();
      A.cls = {};
      A.tags = {};
    },
    /** Set per-index classes and tags; call p.render() afterwards. */
    set(c: Record<number, string> = {}, t: Record<number, string> = {}) {
      A.cls = c;
      A.tags = t;
    },
  };
}

interface RowArrayViewProps {
  p: PanelApi;
  row: ReturnType<typeof useRowArray>;
  /** Draw values as bars whose height follows the value. */
  bars?: boolean;
  /** Label of a trailing end() ghost cell. */
  end?: string;
}

export function RowArrayView({ p, row, bars = false, end }: RowArrayViewProps) {
  const { A, track } = row;
  return (
    <div className={bars ? "bars" : "track"} ref={track}>
      {A.items.map((it, i) => (
        <Cell
          key={it.k}
          k={it.k}
          v={it.v}
          idx={i}
          cls={cx(A.cls[i], p.fx(it.k))}
          tag={A.tags[i] || ""}
          style={bars ? { height: `${24 + it.v * 12}px` } : undefined}
        />
      ))}
      {end ? <Cell k="end" v={end} cls="ghost" idx={A.items.length} tag={A.tags[A.items.length] || ""} /> : null}
    </div>
  );
}
