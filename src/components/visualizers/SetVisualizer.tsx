import { useRef } from "react";
import { flip, leave, shake } from "../../lib/motion";
import { Op, Panel, Sep, VIn, num, usePanel } from "./kit";
import { SortedTrack, useSortedRow } from "./SortedRow";

export default function SetVisualizer() {
  const p = usePanel("set");
  const row = useSortedRow(p, [2, 21, 12, 211, 213]);
  const { S } = row;
  const inX = useRef<HTMLInputElement>(null);
  const re = (mutate: () => void) =>
    flip(row.track.current, () => {
      mutate();
      p.render();
    });

  const controls = (
    <>
      <VIn label="x" inputRef={inX} defaultValue={11} />
      <Op
        p={p}
        cls="primary"
        on={() => {
          const x = num(inX);
          row.clearMarks();
          const at = S.items.findIndex((i) => i.v === x);
          if (at >= 0) {
            p.render();
            shake(p.byK(S.items[at].k));
            p.log(`st.insert(${x});`, "already in the set: ignored (returns {iterator, false})", "info");
            return;
          }
          const k = p.uid();
          re(() => {
            S.items.push({ k, v: x });
            S.items.sort((a, b) => a.v - b.v);
          });
          void p.flash(k, "good", 800);
          p.log(`st.insert(${x});`, "placed in sorted position, O(log n)", "ok");
        }}
      >
        insert(x)
      </Op>
      <Op
        p={p}
        on={async () => {
          const x = num(inX);
          row.clearMarks();
          const at = S.items.findIndex((i) => i.v === x);
          if (at < 0) {
            p.render();
            p.log(`st.erase(${x});`, "not present: returns 0, nothing happens");
            return;
          }
          await leave([p.byK(S.items[at].k)]);
          re(() => S.items.splice(at, 1));
          p.log(`st.erase(${x});`, "returns 1", "ok");
        }}
      >
        erase(x)
      </Op>
      <Op
        p={p}
        on={async () => {
          const x = num(inX);
          row.clearMarks();
          p.render();
          const [i, steps] = await row.treePath(x);
          if (i < 0) {
            row.setMarks({ [S.items.length]: "it == end()" });
            p.render();
            p.log(`st.find(${x});`, `not found after ${steps} comparisons: returns end()`, "err");
          } else {
            row.setMarks({ [i]: "it" });
            void p.flash(S.items[i].k, "good", 800);
            p.log(`st.find(${x});`, `found after ${steps} comparisons, *it = ${x}`, "ok");
          }
        }}
      >
        find(x)
      </Op>
      <Op
        p={p}
        on={() => {
          const x = num(inX);
          const c = S.items.some((i) => i.v === x) ? 1 : 0;
          p.log(`st.count(${x});`, `${c} (a set can only answer 0 or 1)`, c ? "ok" : "");
        }}
      >
        count(x)
      </Op>
      <Sep />
      <Op
        p={p}
        on={() => {
          const x = num(inX);
          const i = row.lb(x);
          row.setMarks({ [i]: "lower_bound" });
          p.render();
          if (i === S.items.length) p.log(`st.lower_bound(${x});`, `no element ≥ ${x}: returns end(). Do not dereference`, "err");
          else {
            void p.flash(S.items[i].k, "hit", 900);
            p.log(`st.lower_bound(${x});`, `first element ≥ ${x} is ${S.items[i].v}`, "ok");
          }
        }}
      >
        lower_bound(x)
      </Op>
      <Op
        p={p}
        on={() => {
          const x = num(inX);
          const i = row.ub(x);
          row.setMarks({ [i]: "upper_bound" });
          p.render();
          if (i === S.items.length) p.log(`st.upper_bound(${x});`, `no element > ${x}: returns end(). Do not dereference`, "err");
          else {
            void p.flash(S.items[i].k, "hit", 900);
            p.log(`st.upper_bound(${x});`, `first element > ${x} is ${S.items[i].v}`, "ok");
          }
        }}
      >
        upper_bound(x)
      </Op>
      <Op p={p} on={() => re(row.reset)}>
        reset
      </Op>
    </>
  );

  return (
    <Panel api={p} label="set visualizer" controls={controls} stats={[["size", S.items.length]]}>
      <SortedTrack p={p} row={row} />
    </Panel>
  );
}
