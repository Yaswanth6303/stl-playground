import { useRef } from "react";
import { flip } from "../../lib/motion";
import { Cell, type Item, Op, Panel, VIn, cx, num, useModel, usePanel } from "./kit";

const BASE = [9, 2, 7, 4, 5, 1, 8];

export default function NthElementVisualizer() {
  const p = usePanel("nth");
  const fresh = () => BASE.map((v) => ({ k: p.uid(), v }));
  const m = useModel(() => ({
    items: fresh() as Item[],
    cls: {} as Record<number, string>,
    tags: {} as Record<number, string>,
  }));
  const track = useRef<HTMLDivElement>(null);
  const inK = useRef<HTMLInputElement>(null);

  const re = (mutate: () => void, cls: Record<number, string> = {}, tags: Record<number, string> = {}) =>
    flip(track.current, () => {
      mutate();
      m.cls = cls;
      m.tags = tags;
      p.render();
    });

  const nth = (k: number, stmt: string) => {
    const nv = m.items.map((i) => i.v).sort((a, b) => a - b)[k];
    const pivot = m.items.find((i) => i.v === nv) as Item;
    const rest = m.items.filter((i) => i !== pivot);
    const left = rest.filter((i) => i.v < nv);
    const right = rest.filter((i) => i.v > nv);
    const eq = rest.filter((i) => i.v === nv);
    while (left.length < k && eq.length) left.push(eq.shift() as Item);
    right.unshift(...eq);
    const next = [...left, pivot, ...right];
    const cls: Record<number, string> = {};
    next.forEach((_, i) => {
      cls[i] = i < k ? "inrange" : i === k ? "good" : "";
    });
    const tags: Record<number, string> = { [k]: "nth" };
    if (k > 0) tags[0] = "≤ " + nv;
    if (k < next.length - 1) tags[next.length - 1] = "≥ " + nv;
    re(() => (m.items = next), cls, tags);
    p.log(stmt, `v[${k}] = ${nv}. Left side ${left.map((i) => i.v).join(" ") || "(empty)"} is not sorted, only ≤ ${nv}`, "ok");
  };
  const kOK = () => {
    const k = num(inK);
    if (k < 0 || k >= m.items.length) {
      p.log("// k out of range", `k must be 0 to ${m.items.length - 1}`, "err");
      return null;
    }
    return k;
  };

  const controls = (
    <>
      <VIn label="k" inputRef={inK} defaultValue={2} />
      <Op
        p={p}
        cls="primary"
        on={() => {
          const k = kOK();
          if (k != null) nth(k, `nth_element(v.begin(), v.begin() + ${k}, v.end());`);
        }}
      >
        nth_element(begin, begin + k, end)
      </Op>
      <Op
        p={p}
        on={() => {
          const k = kOK();
          if (k == null) return;
          const top = m.items
            .slice()
            .sort((a, b) => a.v - b.v)
            .slice(0, k);
          const rest = m.items.filter((i) => !top.includes(i));
          const next = [...top, ...rest];
          const cls: Record<number, string> = {};
          next.forEach((_, i) => {
            cls[i] = i < k ? "good" : "dim";
          });
          re(() => (m.items = next), cls, k < next.length ? { [k]: "unspecified order →" } : {});
          p.log(`partial_sort(v.begin(), v.begin() + ${k}, v.end());`, `smallest ${k} sorted: ${top.map((i) => i.v).join(" ")}`, "ok");
        }}
      >
        partial_sort(begin, begin + k, end)
      </Op>
      <Op
        p={p}
        on={() => {
          const k = m.items.length >> 1;
          nth(k, `nth_element(v.begin(), v.begin() + ${k}, v.end());  // median`);
        }}
      >
        median
      </Op>
      <Op
        p={p}
        on={() => {
          re(() => m.items.sort((a, b) => a.v - b.v));
          p.log("sort(v.begin(), v.end());", "O(n log n): more work than nth_element needs", "info");
        }}
      >
        full sort (for comparison)
      </Op>
      <Op p={p} on={() => re(() => (m.items = fresh()))}>
        reset
      </Op>
    </>
  );

  return (
    <Panel api={p} label="nth_element and partial_sort visualizer" controls={controls}>
      <div className="track" ref={track}>
        {m.items.map((it, i) => (
          <Cell key={it.k} k={it.k} v={it.v} idx={i} cls={cx(m.cls[i], p.fx(it.k))} tag={m.tags[i] || ""} />
        ))}
      </div>
    </Panel>
  );
}
