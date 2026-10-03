import { useRef } from "react";
import { flip, leave, rnd, sleep } from "../../lib/motion";
import { Cell, type Item, Op, Panel, Sep, VIn, cx, num, useModel, usePanel } from "./kit";

export default function ListVisualizer() {
  const p = usePanel("list");
  const fresh = () => [8, 7, 1, 2, 3].map((v) => ({ k: p.uid(), v }));
  const m = useModel(() => ({ items: fresh() as Item[], hit: null as string | null }));
  const track = useRef<HTMLDivElement>(null);
  const inV = useRef<HTMLInputElement>(null);
  const inI = useRef<HTMLInputElement>(null);

  const re = (mutate: () => void) =>
    flip(track.current, () => {
      mutate();
      p.render();
    });
  const nextX = () => {
    const v = num(inV, 7);
    if (inV.current) inV.current.value = String(rnd(10, 99));
    return v;
  };

  const controls = (
    <>
      <VIn label="x" inputRef={inV} defaultValue={42} random={[10, 99]} />
      <Op
        p={p}
        cls="primary"
        on={() => {
          const v = nextX();
          re(() => m.items.unshift({ k: p.uid(), v }));
          p.log(`ls.push_front(${v});`, "new node, 2 pointers rewired, nothing else moves", "ok");
        }}
      >
        push_front(x)
      </Op>
      <Op
        p={p}
        on={() => {
          const v = nextX();
          re(() => m.items.push({ k: p.uid(), v }));
          p.log(`ls.push_back(${v});`, "O(1)", "ok");
        }}
      >
        push_back(x)
      </Op>
      <Op
        p={p}
        on={async () => {
          if (!m.items.length) {
            p.log("ls.pop_front();", "empty list: undefined behavior", "err");
            return;
          }
          const f = m.items[0];
          await leave([p.byK(f.k)]);
          re(() => m.items.shift());
          p.log("ls.pop_front();", `removed ${f.v}`);
        }}
      >
        pop_front()
      </Op>
      <Op
        p={p}
        on={async () => {
          if (!m.items.length) {
            p.log("ls.pop_back();", "empty list: undefined behavior", "err");
            return;
          }
          const f = m.items[m.items.length - 1];
          await leave([p.byK(f.k)]);
          re(() => m.items.pop());
          p.log("ls.pop_back();", `removed ${f.v}`);
        }}
      >
        pop_back()
      </Op>
      <Sep />
      <VIn label="n" inputRef={inI} defaultValue={3} />
      <Op
        p={p}
        on={async () => {
          const n = num(inI);
          p.log(`ls[${n}]`, "does not compile: list has no operator[]", "err");
          if (n < 0 || n >= m.items.length) {
            p.log(`next(ls.begin(), ${n})`, `list has ${m.items.length} nodes: walking past the end is undefined behavior`, "err");
            return;
          }
          for (let i = 0; i <= n; i++) {
            m.hit = m.items[i].k;
            p.render();
            await sleep(320);
            if (i < n) m.hit = null;
          }
          p.log(`*next(ls.begin(), ${n})`, `${m.items[n].v}, reached after ${n} hops: O(n)`, "ok");
          await sleep(600);
          m.hit = null;
          p.render();
        }}
      >
        advance to n-th
      </Op>
      <Op p={p} on={() => re(() => (m.items = fresh()))}>
        reset
      </Op>
    </>
  );

  const len = m.items.length;
  return (
    <Panel api={p} label="list visualizer" controls={controls} stats={[["size", len]]}>
      <div className="track linked" ref={track}>
        <Cell k="nl" v="nullptr" cls="null" />
        {m.items.map((it, i) => (
          <Cell
            key={it.k}
            k={it.k}
            v={it.v}
            cls={cx(m.hit === it.k && "hit", p.fx(it.k))}
            tag={len === 1 ? "front() = back()" : i === 0 ? "front()" : i === len - 1 ? "back()" : ""}
          />
        ))}
        <Cell k="nr" v="nullptr" cls="null" />
      </div>
    </Panel>
  );
}
