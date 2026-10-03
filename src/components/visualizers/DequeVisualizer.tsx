import { useRef, type ReactNode } from "react";
import { flip, leave, rnd } from "../../lib/motion";
import { Cell, type Item, Op, Panel, Sep, VIn, num, useModel, usePanel } from "./kit";

/** Block size of this model (real GCC blocks are 512 bytes). */
const B = 4;

export default function DequeVisualizer() {
  const p = usePanel("deque");
  const fresh = () => [1, 2, 3, 4, 5].map((v) => ({ k: p.uid(), v }));
  /** pad: free slots in front of the first element inside block 0. */
  const m = useModel(() => ({ items: fresh() as Item[], pad: 2 }));
  const box = useRef<HTMLDivElement>(null);
  const inV = useRef<HTMLInputElement>(null);
  const inI = useRef<HTMLInputElement>(null);

  const re = (mutate: () => void) =>
    flip(box.current, () => {
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
          if (m.pad === 0) p.log("// block 0 has no free slot in front", "allocate a new block at the front; existing elements do not move", "info");
          re(() => {
            if (m.pad === 0) m.pad = B - 1;
            else m.pad--;
            m.items.unshift({ k: p.uid(), v });
          });
          p.log(`dq.push_front(${v});`, "O(1)", "ok");
        }}
      >
        push_front(x)
      </Op>
      <Op
        p={p}
        on={() => {
          const v = nextX();
          if ((m.pad + m.items.length) % B === 0) p.log("// last block is full", "allocate one more block at the back", "info");
          re(() => m.items.push({ k: p.uid(), v }));
          p.log(`dq.push_back(${v});`, "O(1)", "ok");
        }}
      >
        push_back(x)
      </Op>
      <Op
        p={p}
        on={async () => {
          if (!m.items.length) {
            p.log("dq.pop_front();", "empty deque: undefined behavior", "err");
            return;
          }
          const f = m.items[0];
          await leave([p.byK(f.k)]);
          let freed = false;
          re(() => {
            m.items.shift();
            m.pad++;
            if (m.pad >= B) {
              m.pad -= B;
              freed = true;
            }
            if (!m.items.length) m.pad = 2;
          });
          if (freed) p.log("// block 0 is now empty", "freed", "info");
          p.log("dq.pop_front();", `removed ${f.v}`);
        }}
      >
        pop_front()
      </Op>
      <Op
        p={p}
        on={async () => {
          if (!m.items.length) {
            p.log("dq.pop_back();", "empty deque: undefined behavior", "err");
            return;
          }
          const f = m.items[m.items.length - 1];
          await leave([p.byK(f.k)]);
          re(() => {
            m.items.pop();
            if (!m.items.length) m.pad = 2;
          });
          p.log("dq.pop_back();", `removed ${f.v}`);
        }}
      >
        pop_back()
      </Op>
      <Sep />
      <VIn label="i" inputRef={inI} defaultValue={2} />
      <Op
        p={p}
        on={async () => {
          const i = num(inI);
          if (i < 0 || i >= m.items.length) {
            p.log(`dq[${i}]`, "out of range: undefined behavior (dq.at() would throw)", "err");
            return;
          }
          const g = m.pad + i;
          await p.flash(m.items[i].k, "hit", 900);
          p.log(`dq[${i}]`, `(${m.pad} + ${i}) / ${B} = block ${Math.floor(g / B)}, slot ${g % B} → ${m.items[i].v}. Two steps, O(1)`, "ok");
        }}
      >
        dq[i]
      </Op>
      <Op
        p={p}
        on={() =>
          re(() => {
            m.items = fresh();
            m.pad = 2;
          })
        }
      >
        reset
      </Op>
    </>
  );

  const { items, pad } = m;
  const nb = Math.max(1, Math.ceil((pad + items.length) / B));
  const blocks: ReactNode[] = [];
  for (let b = 0; b < nb; b++) {
    const row: ReactNode[] = [];
    for (let j = 0; j < B; j++) {
      const g = b * B + j - pad;
      if (g >= 0 && g < items.length) {
        const it = items[g];
        row.push(
          <Cell
            key={it.k}
            k={it.k}
            v={it.v}
            idx={`[${g}]`}
            cls={p.fx(it.k)}
            tag={items.length === 1 ? "front = back" : g === 0 ? "front()" : g === items.length - 1 ? "back()" : ""}
          />,
        );
      } else {
        const gk = `dg${b}_${j}_${pad}_${items.length}`;
        row.push(<Cell key={gk} k={gk} v="" cls="ghost" />);
      }
    }
    blocks.push(
      <div className="dq-chunk" key={b}>
        <span className="lbl">block {b}</span>
        <div className="dq-row">{row}</div>
      </div>,
    );
  }

  return (
    <Panel
      api={p}
      label="deque visualizer"
      controls={controls}
      stats={[
        ["size", items.length],
        ["blocks", nb],
      ]}
    >
      <div className="dq" ref={box}>
        {blocks}
      </div>
      <div className="dq-map">
        {`block table: [ ${Array.from({ length: nb }, (_, b) => "block " + b).join(", ")} ]   first element sits at offset ${pad} of block 0`}
      </div>
    </Panel>
  );
}
