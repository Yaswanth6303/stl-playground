import { useRef } from "react";
import { flip, leave, rnd, sleep } from "../../lib/motion";
import { Cell, type Item, Op, Panel, Sep, VIn, cx, num, useModel, usePanel } from "./kit";

export default function ForwardListVisualizer() {
  const p = usePanel("flist");
  const fresh = () => [1, 2, 3, 4].map((v) => ({ k: p.uid(), v }));
  const m = useModel(() => ({ items: fresh() as Item[], hit: null as string | null }));
  const track = useRef<HTMLDivElement>(null);
  const inX = useRef<HTMLInputElement>(null);

  const re = (mutate: () => void) =>
    flip(track.current, () => {
      mutate();
      p.render();
    });
  const nextX = () => {
    const v = num(inX, 9);
    if (inX.current) inX.current.value = String(rnd(10, 99));
    return v;
  };

  const controls = (
    <>
      <VIn label="x" inputRef={inX} defaultValue={42} random={[10, 99]} />
      <Op
        p={p}
        cls="primary"
        on={() => {
          const v = nextX();
          re(() => m.items.unshift({ k: p.uid(), v }));
          p.log(`fl.push_front(${v});`, "O(1)", "ok");
        }}
      >
        push_front(x)
      </Op>
      <Op
        p={p}
        on={async () => {
          if (!m.items.length) {
            p.log("fl.pop_front();", "empty: undefined behavior", "err");
            return;
          }
          const f = m.items[0];
          await leave([p.byK(f.k)]);
          re(() => m.items.shift());
          p.log("fl.pop_front();", `removed ${f.v}`);
        }}
      >
        pop_front()
      </Op>
      <Op
        p={p}
        on={async () => {
          if (!m.items.length) {
            p.log("fl.insert_after(fl.begin(), x);", "empty list: begin() == end(), undefined behavior. Use before_begin()", "err");
            return;
          }
          const v = nextX();
          await p.flash(m.items[0].k, "hit", 350);
          re(() => m.items.splice(1, 0, { k: p.uid(), v }));
          p.log(`fl.insert_after(fl.begin(), ${v});`, "new node goes after the first one: 2 pointers change", "ok");
        }}
      >
        insert_after(begin(), x)
      </Op>
      <Op
        p={p}
        on={async () => {
          if (m.items.length < 2) {
            p.log("fl.erase_after(fl.begin());", "no node after the first one: undefined behavior", "err");
            return;
          }
          const t = m.items[1];
          await p.flash(m.items[0].k, "hit", 300);
          await leave([p.byK(t.k)]);
          re(() => m.items.splice(1, 1));
          p.log("fl.erase_after(fl.begin());", `removed ${t.v}, the node after begin()`);
        }}
      >
        erase_after(begin())
      </Op>
      <Sep />
      <Op
        p={p}
        cls="warn"
        on={async () => {
          p.log("fl.size();", "does not compile: forward_list has no size()", "err");
          let n = 0;
          for (const it of m.items) {
            m.hit = it.k;
            p.render();
            n++;
            await sleep(260);
            m.hit = null;
            p.render();
          }
          p.log("distance(fl.begin(), fl.end());", `${n}, found by walking every node: O(n)`, "ok");
        }}
      >
        fl.size()
      </Op>
      <Op
        p={p}
        cls="warn"
        on={() => p.log("fl.push_back(x);", "does not compile: reaching the last node would take O(n)", "err")}
      >
        push_back(x)
      </Op>
      <Op p={p} on={() => re(() => (m.items = fresh()))}>
        reset
      </Op>
    </>
  );

  return (
    <Panel api={p} label="forward_list visualizer" controls={controls}>
      <div className="track singly" ref={track}>
        {m.items.map((it, i) => (
          <Cell key={it.k} k={it.k} v={it.v} cls={cx(m.hit === it.k && "hit", p.fx(it.k))} tag={i === 0 ? "begin()" : ""} />
        ))}
        <Cell k="fnull" v="nullptr" cls="null" />
      </div>
    </Panel>
  );
}
