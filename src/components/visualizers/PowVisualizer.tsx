import { useRef } from "react";
import { pulse, sleep } from "../../lib/motion";
import { Cell, Op, Panel, cx, useModel, usePanel } from "./kit";

export default function PowVisualizer() {
  const p = usePanel("pow");
  const m = useModel(() => ({ cls: Array<string>(9).fill(""), res: "1", bin: "1" }));
  const resRef = useRef<HTMLElement>(null);

  const draw = () => {
    m.cls = Array<string>(9).fill("");
  };
  const set = (v: number | string) => {
    m.res = String(v);
    m.bin = Number.isInteger(+v) ? (+v).toString(2) : "—";
    p.render();
    pulse(resRef.current, 1.35, 300);
  };

  const controls = (
    <>
      <Op
        p={p}
        cls="primary"
        on={async () => {
          draw();
          let r = 1;
          set(1);
          p.log("int result = 1;");
          for (let i = 1; i <= 9; i++) {
            m.cls[i - 1] = "hit";
            p.render();
            await sleep(200);
            r *= 2;
            m.cls[i - 1] = "good";
            set(r);
            p.log("result *= 2;", `i = ${i}, result = ${r}`);
            await sleep(160);
          }
          p.log("cout << result;", "prints 512", "ok");
        }}
      >
        run the for loop
      </Op>
      <Op
        p={p}
        on={() => {
          set("512.0");
          m.bin = "double, not an int";
          p.log("cout << pow(2, 9);", "returns the double 512.0, prints 512", "ok");
        }}
      >
        pow(2, 9)
      </Op>
      <Op
        p={p}
        on={() => {
          set(512);
          p.log("cout << (1 << 9);", "shift 1 left by 9 bits: 1000000000 in binary = 512", "ok");
        }}
      >
        1 &lt;&lt; 9
      </Op>
      <Op
        p={p}
        on={() => p.log("int x = 1 << 31;", "overflows a 32-bit int (sign bit). Use 1LL << 31 = 2147483648", "err")}
      >
        1 &lt;&lt; 31
      </Op>
      <Op
        p={p}
        on={() => {
          draw();
          set(1);
        }}
      >
        reset
      </Op>
    </>
  );

  return (
    <Panel api={p} label="pow visualizer" controls={controls}>
      <div className="track">
        {m.cls.map((c, i) => (
          <Cell key={i} k={"pw" + i} v="×2" idx={"i=" + (i + 1)} cls={cx(c, p.fx("pw" + i))} />
        ))}
      </div>
      <div className="accbox">
        <span className="total">
          result = <b ref={resRef}>{m.res}</b>
        </span>
        <span className="vlabel">
          binary: <span>{m.bin}</span>
        </span>
      </div>
    </Panel>
  );
}
