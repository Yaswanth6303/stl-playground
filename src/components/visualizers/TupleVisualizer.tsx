import { useRef } from "react";
import { shake } from "../../lib/motion";
import { Cell, Op, Panel, type LogKind, useModel, usePanel } from "./kit";

export default function TupleVisualizer() {
  const p = usePanel("tuple");
  const m = useModel(() => ({ roll: 7 }));
  const box = useRef<HTMLDivElement>(null);

  const slot = (k: string, v: string | number, name: string) => (
    <div className="pslot">
      <Cell k={k} v={v} cls={p.fx(k)} />
      <small>{name}</small>
    </div>
  );
  const hit = async (keys: string[], stmt: string, note: string, kind: LogKind = "ok") => {
    p.log(stmt, note, kind);
    await Promise.all(keys.map((k) => p.flash(k, "hit", 900)));
  };

  const controls = (
    <>
      <Op p={p} cls="primary" on={() => hit(["t0"], "get<0>(t)", String(m.roll))}>
        get&lt;0&gt;(t)
      </Op>
      <Op p={p} on={() => hit(["t1"], "get<1>(t)", '"Kundan"')}>get&lt;1&gt;(t)</Op>
      <Op p={p} on={() => hit(["t2"], "get<2>(t)", "'A'")}>get&lt;2&gt;(t)</Op>
      <Op
        p={p}
        on={async () => {
          m.roll = 9;
          await p.flash("t0", "good", 900);
          p.log("get<0>(t) = 9;", "get returns a reference, so this writes into the tuple", "ok");
        }}
      >
        get&lt;0&gt;(t) = 9
      </Op>
      <Op
        p={p}
        on={() => hit(["t0", "t1", "t2"], "auto [roll, name, grade] = t;", `roll = ${m.roll}, name = "Kundan", grade = 'A'`)}
      >
        auto [roll, name, grade] = t
      </Op>
      <Op p={p} on={() => p.log("tuple_size<decltype(t)>::value", "3", "ok")}>tuple_size</Op>
      <Op
        p={p}
        cls="warn"
        on={() => {
          shake(box.current);
          p.log("get<3>(t)", "compile error: index 3 is out of range for a 3-element tuple. Caught before the program runs", "err");
        }}
      >
        get&lt;3&gt;(t)
      </Op>
      <Op
        p={p}
        on={() => {
          m.roll = 7;
          p.render();
        }}
      >
        reset
      </Op>
    </>
  );

  return (
    <Panel api={p} label="tuple visualizer" controls={controls}>
      <div className="pairs">
        <div className="pbox" ref={box}>
          <span className="lbl">t : tuple&lt;int, string, char&gt;</span>
          <div className="prow">
            {slot("t0", m.roll, "get<0>")}
            {slot("t1", '"Kundan"', "get<1>")}
            {slot("t2", "'A'", "get<2>")}
          </div>
        </div>
      </div>
    </Panel>
  );
}
