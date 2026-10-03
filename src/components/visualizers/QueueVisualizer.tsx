import { useRef } from "react";
import { flip, leave, rnd, shake, sleep } from "../../lib/motion";
import { Cell, type Item, Op, Panel, VIn, num, useModel, usePanel } from "./kit";

export default function QueueVisualizer() {
  const p = usePanel("queue");
  const fresh = () => [32, 43, 45, 54, 72].map((v) => ({ k: p.uid(), v }));
  const m = useModel(() => ({ items: fresh() as Item[], printed: "—" }));
  const tube = useRef<HTMLDivElement>(null);
  const inV = useRef<HTMLInputElement>(null);

  const re = (mutate: () => void) =>
    flip(tube.current, () => {
      mutate();
      p.render();
    });
  const pop = async (): Promise<number | null> => {
    if (!m.items.length) {
      shake(tube.current);
      p.log("q.pop();", "empty queue: undefined behavior", "err");
      return null;
    }
    const f = m.items[0];
    await leave([p.byK(f.k)]);
    re(() => m.items.shift());
    return f.v;
  };

  const controls = (
    <>
      <VIn label="x" inputRef={inV} defaultValue={42} random={[10, 99]} />
      <Op
        p={p}
        cls="primary"
        on={() => {
          const v = num(inV, 10);
          if (inV.current) inV.current.value = String(rnd(10, 99));
          if (m.items.length >= 9) {
            p.log(`q.push(${v});`, "demo limit is 9 elements", "info");
            return;
          }
          re(() => m.items.push({ k: p.uid(), v }));
          p.log(`q.push(${v});`, "joins at the back", "ok");
        }}
      >
        push(x)
      </Op>
      <Op
        p={p}
        on={async () => {
          const v = await pop();
          if (v != null) p.log("q.pop();", `${v} left from the front`);
        }}
      >
        pop()
      </Op>
      <Op
        p={p}
        on={async () => {
          if (!m.items.length) {
            p.log("q.front();", "empty queue: undefined behavior", "err");
            return;
          }
          const a = m.items[0];
          const b = m.items[m.items.length - 1];
          await Promise.all([p.flash(a.k), p.flash(b.k)]);
          p.log("q.front(); q.back();", `${a.v} and ${b.v}`, "ok");
        }}
      >
        front() / back()
      </Op>
      <Op
        p={p}
        on={async () => {
          const out: number[] = [];
          m.printed = "—";
          p.render();
          while (m.items.length) {
            await p.flash(m.items[0].k, "hit", 320);
            out.push(m.items[0].v);
            m.printed = out.join(" ");
            p.log("cout << q.front(); q.pop();", "printed: " + out.join(" "));
            await pop();
            await sleep(120);
          }
          p.log("q.empty()", "true. Same order as pushed", "ok");
        }}
      >
        while (!empty) {"{"} front; pop; {"}"}
      </Op>
      <Op
        p={p}
        on={() => {
          m.printed = "—";
          re(() => (m.items = fresh()));
        }}
      >
        reset
      </Op>
    </>
  );

  const len = m.items.length;
  return (
    <Panel api={p} label="queue visualizer" controls={controls} stats={[["size", len]]}>
      <div className="qtube" ref={tube}>
        <span className="qlabel">◀ pop() leaves here</span>
        {m.items.map((it, i) => (
          <Cell
            key={it.k}
            k={it.k}
            v={it.v}
            cls={p.fx(it.k)}
            tag={len === 1 ? "front() = back()" : i === 0 ? "front()" : i === len - 1 ? "back()" : ""}
          />
        ))}
        <span className="qlabel">◀ push() joins here</span>
      </div>
      <div className="accbox">
        <span className="vlabel">
          printed: <b className="printed">{m.printed}</b>
        </span>
      </div>
    </Panel>
  );
}
