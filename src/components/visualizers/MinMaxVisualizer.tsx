import { flip, sleep } from "../../lib/motion";
import { Op, Panel, usePanel } from "./kit";
import { RowArrayView, useRowArray } from "./RowArray";

export default function MinMaxVisualizer() {
  const p = usePanel("minmax");
  const row = useRowArray(p, [7, 6, 4, 10, 9]);
  const { A } = row;

  const scan = async (isMax: boolean) => {
    let best = 0;
    for (let i = 0; i < A.items.length; i++) {
      row.set({ [best]: "hit", [i]: "cmp" }, { [best]: "best so far" });
      p.render();
      await sleep(340);
      if (isMax ? A.items[i].v > A.items[best].v : A.items[i].v < A.items[best].v) best = i;
    }
    row.set({ [best]: "good" }, { [best]: "it" });
    p.render();
    p.log(`auto it = ${isMax ? "max" : "min"}_element(nums, nums + 5);`, `*it = ${A.items[best].v}, it - nums = ${best}`, "ok");
  };
  const rev = async (lo: number, hi: number, stmt: string) => {
    let i = lo;
    let j = hi - 1;
    while (i < j) {
      row.set({ [i]: "cmp", [j]: "cmp" });
      p.render();
      await sleep(300);
      const a = i;
      const b = j;
      flip(row.track.current, () => {
        [A.items[a], A.items[b]] = [A.items[b], A.items[a]];
        row.set({ [a]: "hit", [b]: "hit" });
        p.render();
      });
      await sleep(420);
      i++;
      j--;
    }
    row.set();
    p.render();
    p.log(stmt, A.items.map((x) => x.v).join(" "), "ok");
  };

  const controls = (
    <>
      <Op p={p} cls="primary" on={() => scan(true)}>
        max_element
      </Op>
      <Op p={p} on={() => scan(false)}>
        min_element
      </Op>
      <Op p={p} on={() => rev(0, 5, "reverse(nums, nums + 5);")}>
        reverse(nums, nums + 5)
      </Op>
      <Op p={p} on={() => rev(1, 4, "reverse(nums + 1, nums + 4);")}>
        reverse(nums + 1, nums + 4)
      </Op>
      <Op
        p={p}
        on={() =>
          flip(row.track.current, () => {
            row.reset();
            p.render();
          })
        }
      >
        reset
      </Op>
    </>
  );

  return (
    <Panel api={p} label="min, max and reverse visualizer" controls={controls}>
      <RowArrayView p={p} row={row} />
    </Panel>
  );
}
