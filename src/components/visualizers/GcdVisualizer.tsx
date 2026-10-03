import { useRef, type ReactNode } from "react";
import { flip, sleep } from "../../lib/motion";
import { Cell, Op, Panel, VIn, num, useModel, usePanel } from "./kit";

interface Step {
  k: string;
  body: ReactNode;
  cls: string;
}

const gcd = (a: number, b: number) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};

export default function GcdVisualizer() {
  const p = usePanel("gcd");
  const m = useModel(() => ({ steps: [] as Step[] }));
  const box = useRef<HTMLDivElement>(null);
  const inA = useRef<HTMLInputElement>(null);
  const inB = useRef<HTMLInputElement>(null);

  const clear = () => {
    m.steps = [];
    p.render();
  };
  const add = (body: ReactNode, cls = "") =>
    flip(box.current, () => {
      m.steps.push({ k: p.uid(), body, cls });
      p.render();
    });

  const controls = (
    <>
      <VIn label="a" inputRef={inA} defaultValue={48} />
      <VIn label="b" inputRef={inB} defaultValue={18} />
      <Op
        p={p}
        cls="primary"
        on={async () => {
          let a = Math.abs(num(inA));
          let b = Math.abs(num(inB));
          clear();
          const a0 = a;
          const b0 = b;
          let steps = 0;
          while (b) {
            add(`gcd(${a}, ${b}) → ${a} % ${b} = ${a % b}`);
            await sleep(520);
            [a, b] = [b, a % b];
            steps++;
          }
          add(
            <>
              gcd({a}, 0) = <b>{a}</b>
            </>,
            "good",
          );
          p.log(`gcd(${a0}, ${b0});`, `${a} after ${steps} step${steps === 1 ? "" : "s"}`, "ok");
        }}
      >
        gcd(a, b)
      </Op>
      <Op
        p={p}
        on={async () => {
          const a = Math.abs(num(inA));
          const b = Math.abs(num(inB));
          clear();
          if (!a || !b) {
            add("lcm with 0 is 0", "good");
            p.log(`lcm(${a}, ${b});`, "0");
            return;
          }
          const d = gcd(a, b);
          add(`gcd(${a}, ${b}) = ${d}`);
          await sleep(450);
          add(`${a} / ${d} = ${a / d}`);
          await sleep(450);
          add(
            <>
              {a / d} × {b} = <b>{(a / d) * b}</b>
            </>,
            "good",
          );
          p.log(`lcm(${a}, ${b});`, `${(a / d) * b}. Divide before multiplying to avoid overflow`, "ok");
        }}
      >
        lcm(a, b)
      </Op>
      <Op
        p={p}
        on={async () => {
          const a = num(inA);
          const b = num(inB);
          clear();
          if (!b) {
            p.log("// b is 0", "not a fraction", "err");
            return;
          }
          const d = gcd(a, b);
          add(`gcd(${a}, ${b}) = ${d}`);
          await sleep(450);
          add(
            <>
              {a}/{b} = <b>{`${a / d}/${b / d}`}</b>
            </>,
            "good",
          );
          p.log(`int g = gcd(${a}, ${b});`, `${a / d}/${b / d}`, "ok");
        }}
      >
        reduce fraction a/b
      </Op>
    </>
  );

  return (
    <Panel api={p} label="gcd and lcm visualizer" controls={controls}>
      <div className="steps-list" ref={box}>
        {m.steps.map((s) => (
          <Cell key={s.k} k={s.k} cls={s.cls}>
            <span>{s.body}</span>
          </Cell>
        ))}
      </div>
    </Panel>
  );
}
