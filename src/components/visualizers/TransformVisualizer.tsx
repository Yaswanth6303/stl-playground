import { sleep } from "../../lib/motion";
import { Cell, Op, Panel, useModel, usePanel } from "./kit";

const BASE = [1, 2, 3, 4];

export default function TransformVisualizer() {
  const p = usePanel("transform");
  const m = useModel(() => ({
    v: BASE.slice(),
    out: [null, null, null, null] as (number | null)[],
    cv: {} as Record<number, string>,
    co: {} as Record<number, string>,
  }));

  const draw = (cv: Record<number, string> = {}, co: Record<number, string> = {}) => {
    m.cv = cv;
    m.co = co;
    p.render();
  };
  const tr = async (f: (x: number) => number, label: string) => {
    for (let i = 0; i < m.v.length; i++) {
      draw({ [i]: "hit" });
      await sleep(250);
      m.out[i] = f(m.v[i]);
      draw({ [i]: "hit" }, { [i]: "good" });
      await sleep(200);
    }
    draw();
    p.log(`transform(v.begin(), v.end(), out.begin(), [](int x){ return ${label}; });`, m.out.join(" "), "ok");
  };

  const controls = (
    <>
      <Op p={p} cls="primary" on={() => tr((x) => x * x, "x * x")}>
        transform: x * x
      </Op>
      <Op p={p} on={() => tr((x) => x + 1, "x + 1")}>
        transform: x + 1
      </Op>
      <Op
        p={p}
        on={async () => {
          for (let i = 0; i < m.v.length; i++) {
            m.v[i] *= 10;
            draw({ [i]: "good" });
            await sleep(250);
          }
          draw();
          p.log("for_each(v.begin(), v.end(), [](int &x){ x *= 10; });", `v is now ${m.v.join(" ")}`, "ok");
        }}
      >
        for_each: [](int &amp;x){"{"} x *= 10; {"}"}
      </Op>
      <Op
        p={p}
        cls="warn"
        on={async () => {
          for (let i = 0; i < m.v.length; i++) {
            draw({ [i]: "hit" });
            await sleep(250);
          }
          draw();
          p.log("for_each(v.begin(), v.end(), [](int x){ x *= 10; });", `each call changed a copy. v is still ${m.v.join(" ")}`, "err");
        }}
      >
        for_each without &amp;
      </Op>
      <Op
        p={p}
        on={() => {
          m.v = BASE.slice();
          m.out = [null, null, null, null];
          draw();
        }}
      >
        reset
      </Op>
    </>
  );

  return (
    <Panel api={p} label="transform and for_each visualizer" controls={controls}>
      <div className="rowlab">v</div>
      <div className="track">
        {m.v.map((x, i) => (
          <Cell key={i} k={"tv" + i} v={x} idx={i} cls={m.cv[i] || ""} />
        ))}
      </div>
      <div className="rowlab">out</div>
      <div className="track">
        {m.out.map((x, i) => (
          <Cell key={i} k={"to" + i} v={x == null ? "" : x} idx={i} cls={x == null ? "ghost" : m.co[i] || ""} />
        ))}
      </div>
    </Panel>
  );
}
