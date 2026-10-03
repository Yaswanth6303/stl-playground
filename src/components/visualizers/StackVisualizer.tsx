import { useRef } from "react";
import { flip, leave, rnd, shake, sleep } from "../../lib/motion";
import { Cell, type Item, Op, Panel, VIn, num, useModel, usePanel } from "./kit";

export default function StackVisualizer() {
  const p = usePanel("stack");
  const fresh = () => [5, 8, 6, 3].map((v) => ({ k: p.uid(), v }));
  const m = useModel(() => ({ items: fresh() as Item[], printed: "—" }));
  const cup = useRef<HTMLDivElement>(null);
  const inV = useRef<HTMLInputElement>(null);

  const re = (mutate: () => void) =>
    flip(cup.current, () => {
      mutate();
      p.render();
    });
  const pop = async (): Promise<number | null> => {
    if (!m.items.length) {
      shake(cup.current);
      p.log("st.pop();", "empty stack: undefined behavior", "err");
      return null;
    }
    const t = m.items[m.items.length - 1];
    await leave([p.byK(t.k)]);
    re(() => m.items.pop());
    return t.v;
  };

  const controls = (
    <>
      <VIn label="x" inputRef={inV} defaultValue={5} random={[1, 9]} />
      <Op
        p={p}
        cls="primary"
        on={() => {
          const v = num(inV, 1);
          if (inV.current) inV.current.value = String(rnd(1, 9));
          if (m.items.length >= 8) {
            p.log(`st.push(${v});`, "demo limit is 8 elements (a real stack keeps growing)", "info");
            return;
          }
          re(() => m.items.push({ k: p.uid(), v }));
          p.log(`st.push(${v});`, "now on top", "ok");
        }}
      >
        push(x)
      </Op>
      <Op
        p={p}
        on={async () => {
          const v = await pop();
          if (v != null) p.log("st.pop();", `removed ${v}. pop() returns void, read top() first if you need the value`);
        }}
      >
        pop()
      </Op>
      <Op
        p={p}
        on={async () => {
          if (!m.items.length) {
            shake(cup.current);
            p.log("st.top();", "empty stack: undefined behavior. No exception is thrown", "err");
            return;
          }
          const t = m.items[m.items.length - 1];
          await p.flash(t.k);
          p.log("st.top();", `${t.v}`, "ok");
        }}
      >
        top()
      </Op>
      <Op
        p={p}
        on={async () => {
          const out: number[] = [];
          m.printed = "—";
          p.render();
          while (m.items.length) {
            const t = m.items[m.items.length - 1];
            await p.flash(t.k, "hit", 350);
            out.push(t.v);
            m.printed = out.join(" ");
            p.log("cout << st.top(); st.pop();", "printed: " + out.join(" "));
            await pop();
            await sleep(150);
          }
          p.log("st.empty()", "true, loop ends. Order came out reversed", "ok");
        }}
      >
        while (!empty) {"{"} top; pop; {"}"}
      </Op>
      <Op
        p={p}
        cls="warn"
        on={() => {
          if (m.items.length) {
            p.log("st.top();", `safe here: size is ${m.items.length}. Pop everything first to see the problem`, "info");
            return;
          }
          shake(cup.current);
          p.log("st.top();", "empty stack: undefined behavior. It might crash, print garbage, or seem fine", "err");
        }}
      >
        top() on empty?
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
    <Panel
      api={p}
      label="stack visualizer"
      controls={controls}
      stats={[
        ["size", len],
        ["empty", len ? "false" : "true"],
      ]}
    >
      <div className="stackwrap">
        <div className="stack-cup" ref={cup}>
          {m.items.map((it, i) => (
            <Cell key={it.k} k={it.k} v={it.v} cls={p.fx(it.k)} tag={i === len - 1 ? "top()" : ""} />
          ))}
        </div>
        <div className="side-note">
          push and pop happen at the top only.
          <br />
          <br />
          printed: <b className="printed">{m.printed}</b>
        </div>
      </div>
    </Panel>
  );
}
