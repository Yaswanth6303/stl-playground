import { useRef } from "react";
import { sleep } from "../../lib/motion";
import { Op, Panel, VIn, num, usePanel } from "./kit";
import { RowArrayView, useRowArray } from "./RowArray";

export default function CountFindVisualizer() {
  const p = usePanel("countfind");
  const row = useRowArray(p, [6, 2, 1, 1, 0]);
  const { A } = row;
  const inX = useRef<HTMLInputElement>(null);

  const controls = (
    <>
      <VIn label="value" inputRef={inX} defaultValue={1} />
      <Op
        p={p}
        cls="primary"
        on={async () => {
          const x = num(inX);
          let c = 0;
          const cls: Record<number, string> = {};
          for (let i = 0; i < A.items.length; i++) {
            row.set({ ...cls, [i]: "cmp" }, { [i]: "scan" });
            p.render();
            await sleep(300);
            if (A.items[i].v === x) {
              c++;
              cls[i] = "good";
            } else cls[i] = "dim";
            row.set(cls);
            p.render();
          }
          p.log(`count(nums, nums + 5, ${x});`, `${c}. Checked all 5 elements`, "ok");
          await sleep(1200);
          row.set();
          p.render();
        }}
      >
        count(nums, nums + 5, value)
      </Op>
      <Op
        p={p}
        on={async () => {
          const x = num(inX);
          const cls: Record<number, string> = {};
          for (let i = 0; i < A.items.length; i++) {
            row.set({ ...cls, [i]: "cmp" }, { [i]: "scan" });
            p.render();
            await sleep(300);
            if (A.items[i].v === x) {
              row.set({ ...cls, [i]: "good" }, { [i]: "it" });
              p.render();
              p.log(`auto it = find(nums, nums + 5, ${x});`, `stopped at index ${i} after ${i + 1} checks. it - nums = ${i}`, "ok");
              return;
            }
            cls[i] = "dim";
          }
          row.set(cls, { 5: "it == nums + 5" });
          p.render();
          p.log(`auto it = find(nums, nums + 5, ${x});`, 'no match: returns nums + 5 → prints "Not Found"', "err");
        }}
      >
        find(nums, nums + 5, value)
      </Op>
      <Op
        p={p}
        on={() => {
          row.reset();
          p.render();
        }}
      >
        reset
      </Op>
    </>
  );

  return (
    <Panel api={p} label="count and find visualizer" controls={controls}>
      <RowArrayView p={p} row={row} end="nums+5" />
    </Panel>
  );
}
