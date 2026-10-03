import { useRef } from "react";
import { flip, leave } from "../../lib/motion";
import { Op, Panel, VIn, num, usePanel } from "./kit";
import { RowsView, stableSort, useRows } from "./KeyValueRows";

export default function MultimapVisualizer() {
  const p = usePanel("multimap");
  const rows = useRows(p, [
    [3, "b"],
    [1, "a"],
    [1, "b"],
    [1, "a"],
    [2, "a"],
    [2, "a"],
    [2, "b"],
  ]);
  const { R } = rows;
  const inK = useRef<HTMLInputElement>(null);
  const inV = useRef<HTMLInputElement>(null);

  const re = (mutate: () => void) =>
    flip(rows.box.current, () => {
      mutate();
      p.render();
    });

  const controls = (
    <>
      <VIn label="key" inputRef={inK} defaultValue={2} />
      <VIn label="char" inputRef={inV} defaultValue="c" type="text" />
      <Op
        p={p}
        cls="primary"
        on={() => {
          const key = num(inK);
          const val = (inV.current?.value || "z").slice(0, 1);
          rows.clear();
          const k = p.uid();
          re(() => {
            R.items.push({ k, key, val });
            R.items = stableSort(R.items);
          });
          void p.flash(k, "good", 900);
          p.log(`mpp.insert({${key}, '${val}'});`, "goes after existing entries with the same key", "ok");
        }}
      >
        insert({"{"}key, c{"}"})
      </Op>
      <Op
        p={p}
        on={() => {
          const key = num(inK);
          let lo = 0;
          while (lo < R.items.length && R.items[lo].key < key) lo++;
          let hi = lo;
          while (hi < R.items.length && R.items[hi].key === key) hi++;
          const c: Record<number, string> = {};
          for (let i = lo; i < hi; i++) c[i] = "inrange";
          if (lo === hi) {
            rows.setMarks({ [lo]: "first = second" });
            p.render();
            p.log(`mpp.equal_range(${key});`, "no entries: first == second, the loop runs 0 times", "info");
            return;
          }
          rows.setMarks({ [lo]: "range.first", [hi]: "range.second" }, c);
          p.render();
          const vals = R.items.slice(lo, hi).map((i) => `${i.key} -> ${i.val}`);
          p.log("for (i = range.first; i != range.second; i++)", `visits ${hi - lo}: ${vals.join(", ")}`, "ok");
        }}
      >
        equal_range(key)
      </Op>
      <Op
        p={p}
        on={() => {
          const key = num(inK);
          const n = R.items.filter((i) => i.key === key).length;
          p.log(`mpp.count(${key});`, String(n), "ok");
        }}
      >
        count(key)
      </Op>
      <Op
        p={p}
        on={async () => {
          const key = num(inK);
          rows.clear();
          p.render();
          const hits = R.items.filter((i) => i.key === key);
          await leave(hits.map((h) => p.byK(h.k)));
          re(() => (R.items = R.items.filter((i) => i.key !== key)));
          p.log(`mpp.erase(${key});`, `removed all ${hits.length} entries with key ${key}`, hits.length ? "info" : "");
        }}
      >
        erase(key)
      </Op>
      <Op p={p} on={() => re(rows.reset)}>
        reset
      </Op>
    </>
  );

  return (
    <Panel api={p} label="multimap visualizer" controls={controls} stats={[["size", R.items.length]]}>
      <RowsView p={p} rows={rows} />
    </Panel>
  );
}
