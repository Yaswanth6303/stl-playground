import { useRef } from "react";
import { flip, leave, sleep } from "../../lib/motion";
import { Op, Panel, VIn, num, usePanel } from "./kit";
import { SortedTrack, useSortedRow } from "./SortedRow";

export default function MultisetVisualizer() {
  const p = usePanel("multiset");
  const row = useSortedRow(p, [1, 1, 1, 2, 2, 3, 3, 3, 3]);
  const { S } = row;
  const inX = useRef<HTMLInputElement>(null);
  const re = (mutate: () => void) =>
    flip(row.track.current, () => {
      mutate();
      p.render();
    });

  const controls = (
    <>
      <VIn label="x" inputRef={inX} defaultValue={2} />
      <Op
        p={p}
        cls="primary"
        on={() => {
          const x = num(inX);
          row.clearMarks();
          const k = p.uid();
          re(() => S.items.splice(row.ub(x), 0, { k, v: x }));
          void p.flash(k, "good", 800);
          p.log(`ms.insert(${x});`, "duplicates allowed, goes after equal values", "ok");
        }}
      >
        insert(x)
      </Op>
      <Op
        p={p}
        cls="warn"
        on={async () => {
          const x = num(inX);
          row.clearMarks();
          p.render();
          const hits = S.items.filter((i) => i.v === x);
          if (!hits.length) {
            p.log(`ms.erase(${x});`, "returns 0");
            return;
          }
          hits.forEach((h) => void p.flash(h.k, "bad", 450 + 280));
          await sleep(450);
          await leave(hits.map((h) => p.byK(h.k)));
          re(() => (S.items = S.items.filter((i) => i.v !== x)));
          p.log(`ms.erase(${x});`, `removed ALL ${hits.length} copies, returns ${hits.length}`, "err");
        }}
      >
        {"erase(x)  [value]"}
      </Op>
      <Op
        p={p}
        on={async () => {
          const x = num(inX);
          row.clearMarks();
          const i = row.lb(x);
          if (i >= S.items.length || S.items[i].v !== x) {
            p.render();
            p.log(`ms.erase(ms.find(${x}));`, "find returned end(): erasing end() is undefined behavior. Check first", "err");
            return;
          }
          row.setMarks({ [i]: "find(x)" });
          await p.flash(S.items[i].k, "hit", 500);
          await leave([p.byK(S.items[i].k)]);
          row.clearMarks();
          re(() => S.items.splice(i, 1));
          p.log(`ms.erase(ms.find(${x}));`, "removed exactly one copy", "ok");
        }}
      >
        {"erase(find(x))  [one]"}
      </Op>
      <Op
        p={p}
        on={async () => {
          const x = num(inX);
          row.clearMarks();
          p.render();
          const hits = S.items.filter((i) => i.v === x);
          await Promise.all(hits.map((h) => p.flash(h.k, "hit", 900)));
          p.log(`ms.count(${x});`, String(hits.length), "ok");
        }}
      >
        count(x)
      </Op>
      <Op
        p={p}
        on={() => {
          const x = num(inX);
          const i = row.lb(x);
          if (i >= S.items.length || S.items[i].v !== x) {
            row.setMarks({ [S.items.length]: "end()" });
            p.render();
            p.log(`ms.find(${x});`, "returns end()", "err");
            return;
          }
          row.setMarks({ [i]: "find(x)" });
          p.render();
          p.log(`ms.find(${x});`, "iterator to the FIRST copy", "ok");
        }}
      >
        find(x)
      </Op>
      <Op p={p} on={() => re(row.reset)}>
        reset
      </Op>
    </>
  );

  return (
    <Panel api={p} label="multiset visualizer" controls={controls} stats={[["size", S.items.length]]}>
      <SortedTrack p={p} row={row} />
    </Panel>
  );
}
