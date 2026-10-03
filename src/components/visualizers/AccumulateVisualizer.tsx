import { useRef } from "react";
import { pulse, sleep } from "../../lib/motion";
import { Op, Panel, Sep, useModel, usePanel } from "./kit";
import { RowArrayView, useRowArray } from "./RowArray";

export default function AccumulateVisualizer() {
  const p = usePanel("accumulate");
  const row = useRowArray(p, [6, 2, 1, 7, 0]);
  const { A } = row;
  const m = useModel(() => ({ init: 0, total: 0, steps: "" }));
  const tot = useRef<HTMLElement>(null);

  const controls = (
    <>
      {[0, 1, 5].map((v) => (
        <Op
          key={v}
          p={p}
          cls={m.init === v ? "on" : ""}
          on={() => {
            m.init = v;
            m.total = v;
            m.steps = "";
            p.render();
          }}
        >
          init = {v}
        </Op>
      ))}
      <Sep />
      <Op
        p={p}
        cls="primary"
        on={async () => {
          let t = m.init;
          m.total = t;
          row.set();
          p.render();
          const parts = [String(m.init)];
          for (let i = 0; i < A.items.length; i++) {
            row.set({ [i]: "hit" }, { [i]: "it" });
            p.render();
            await sleep(300);
            const prev = t;
            t += A.items[i].v;
            parts.push(String(A.items[i].v));
            m.total = t;
            m.steps = parts.join(" + ");
            p.render();
            pulse(tot.current, 1.3, 260);
            p.log(`total = ${prev} + ${A.items[i].v}`, `= ${t}`);
            await sleep(200);
          }
          row.set();
          p.render();
          p.log(`accumulate(nums, nums + 5, ${m.init});`, `returns ${t}`, "ok");
        }}
      >
        accumulate(nums, nums + 5, init)
      </Op>
      <Op
        p={p}
        cls="warn"
        on={() => {
          p.log("vector<long long> v = {3000000000, 3000000000};");
          p.log("accumulate(v.begin(), v.end(), 0);", "init 0 is an int, so each sum is converted to int: overflow, garbage result", "err");
          p.log("accumulate(v.begin(), v.end(), 0LL);", "6000000000", "ok");
        }}
      >
        0 vs 0LL overflow
      </Op>
    </>
  );

  return (
    <Panel api={p} label="accumulate visualizer" controls={controls}>
      <RowArrayView p={p} row={row} />
      <div className="accbox">
        <span className="total">
          total = <b className="tot" ref={tot}>{m.total}</b>
        </span>
        <span className="vlabel steps">{m.steps}</span>
      </div>
    </Panel>
  );
}
