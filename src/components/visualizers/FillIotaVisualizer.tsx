import { useRef } from "react";
import { sleep } from "../../lib/motion";
import { Cell, Op, Panel, VIn, cx, num, useModel, usePanel } from "./kit";

const zeros = () => Array<number>(6).fill(0);

export default function FillIotaVisualizer() {
  const p = usePanel("filliota");
  const m = useModel(() => ({ vals: zeros(), cls: {} as Record<number, string> }));
  const inX = useRef<HTMLInputElement>(null);

  const draw = (cls: Record<number, string> = {}) => {
    m.cls = cls;
    p.render();
  };
  const write = async (lo: number, hi: number, f: (i: number) => number, stmt: string) => {
    const cls: Record<number, string> = {};
    for (let i = lo; i < hi; i++) cls[i] = "inrange";
    draw({ ...cls });
    await sleep(350);
    for (let i = lo; i < hi; i++) {
      m.vals[i] = f(i - lo);
      cls[i] = "good";
      draw({ ...cls });
      await sleep(170);
    }
    p.log(stmt, m.vals.join(" "), "ok");
    await sleep(500);
    draw();
  };

  const controls = (
    <>
      <VIn label="value" inputRef={inX} defaultValue={7} />
      <Op
        p={p}
        cls="primary"
        on={async () => {
          const x = num(inX);
          await write(0, 6, () => x, `fill(v.begin(), v.end(), ${x});`);
        }}
      >
        fill(begin, end, value)
      </Op>
      <Op
        p={p}
        on={async () => {
          const x = num(inX);
          await write(0, 6, (i) => x + i, `iota(v.begin(), v.end(), ${x});`);
        }}
      >
        iota(begin, end, value)
      </Op>
      <Op p={p} on={() => write(2, 4, () => 0, "fill(v.begin() + 2, v.begin() + 4, 0);")}>
        fill(begin + 2, begin + 4, 0)
      </Op>
      <Op
        p={p}
        on={() => {
          m.vals = zeros();
          draw();
          p.log("vector<int> v(6);", "6 zeros");
        }}
      >
        reset: vector&lt;int&gt; v(6)
      </Op>
    </>
  );

  return (
    <Panel api={p} label="fill and iota visualizer" controls={controls}>
      <div className="track">
        {m.vals.map((v, i) => (
          <Cell key={i} k={"fi" + i} v={v} idx={i} cls={cx(m.cls[i], p.fx("fi" + i))} />
        ))}
      </div>
    </Panel>
  );
}
