import { flip, rnd, sleep } from "../../lib/motion";
import { Op, Panel, Sep, useModel, usePanel } from "./kit";
import { RowArrayView, useRowArray } from "./RowArray";

const NOTE = "bar height = value. Indices on top.";

export default function SortVisualizer() {
  const p = usePanel("sort");
  const row = useRowArray(p, [9, 4, 1, 3, 0]);
  const { A } = row;
  const m = useModel(() => ({ note: NOTE }));
  const re = (mutate: () => void) =>
    flip(row.track.current, () => {
      mutate();
      p.render();
    });

  const sortRange = async (lo: number, hi: number, desc: boolean, stmt: string) => {
    const c: Record<number, string> = {};
    for (let i = lo; i < hi; i++) c[i] = "inrange";
    row.set(c);
    m.note = `range [${lo}, ${hi}) → indices ${Array.from({ length: hi - lo }, (_, i) => lo + i).join(", ")}. Index ${hi} is the end pointer and is excluded.`;
    p.render();
    await sleep(650);
    re(() => {
      const part = A.items.slice(lo, hi).sort((a, b) => (desc ? b.v - a.v : a.v - b.v));
      A.items.splice(lo, hi - lo, ...part);
    });
    p.log(stmt, "result: " + A.items.map((i) => i.v).join(" "), "ok");
    await sleep(900);
    row.set();
    p.render();
  };

  const controls = (
    <>
      <Op p={p} cls="primary" on={() => sortRange(1, 4, false, "sort(nums + 1, nums + 4);")}>
        sort(nums + 1, nums + 4)
      </Op>
      <Op p={p} on={() => sortRange(0, 5, false, "sort(nums, nums + 5);")}>
        sort(nums, nums + 5)
      </Op>
      <Op p={p} on={() => sortRange(0, 5, true, "sort(nums, nums + 5, greater<int>());")}>
        sort(..., greater&lt;int&gt;())
      </Op>
      <Op
        p={p}
        on={async () => {
          p.log("// insertion sort on the whole array", "std::sort uses this for small pieces (≤ 16 elements in GCC)", "info");
          for (let i = 1; i < A.items.length; i++) {
            let j = i;
            while (j > 0) {
              row.set({ [j]: "cmp", [j - 1]: "cmp" });
              p.render();
              await sleep(330);
              if (A.items[j - 1].v > A.items[j].v) {
                const jj = j;
                re(() => {
                  [A.items[jj - 1], A.items[jj]] = [A.items[jj], A.items[jj - 1]];
                  row.set({ [jj - 1]: "hit" });
                });
                await sleep(420);
                j--;
              } else break;
            }
          }
          row.set();
          p.render();
          p.log("// done", A.items.map((i) => i.v).join(" "), "ok");
        }}
      >
        step by step (insertion sort)
      </Op>
      <Sep />
      <Op
        p={p}
        on={() =>
          re(() => {
            for (let i = A.items.length - 1; i > 0; i--) {
              const j = rnd(0, i);
              [A.items[i], A.items[j]] = [A.items[j], A.items[i]];
            }
          })
        }
      >
        shuffle
      </Op>
      <Op
        p={p}
        on={() => {
          m.note = NOTE;
          re(row.reset);
        }}
      >
        reset {"{"}9,4,1,3,0{"}"}
      </Op>
    </>
  );

  return (
    <Panel api={p} label="sort visualizer" controls={controls}>
      <RowArrayView p={p} row={row} bars />
      <div className="range-note">{m.note}</div>
    </Panel>
  );
}
