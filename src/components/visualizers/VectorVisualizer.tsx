import { useRef, type ReactNode } from "react";
import { RM, flip, leave, rnd, shake } from "../../lib/motion";
import { Cell, type Item, Op, Panel, Sep, VIn, cx, num, useModel, usePanel } from "./kit";

export default function VectorVisualizer() {
  const p = usePanel("vector");
  const fresh = () => [1, 2, 3, 4].map((v) => ({ k: p.uid(), v }));
  const m = useModel(() => ({ items: fresh() as Item[], cap: 4, growing: false }));
  const track = useRef<HTMLDivElement>(null);
  const inV = useRef<HTMLInputElement>(null);
  const inI = useRef<HTMLInputElement>(null);

  const reset = () => {
    m.items = fresh();
    m.cap = 4;
  };
  const re = (mutate: () => void) =>
    flip(track.current, () => {
      mutate();
      m.growing = false;
      p.render();
    });
  const grow = async () => {
    const nc = m.cap ? m.cap * 2 : 1;
    p.log("// size == capacity (" + m.cap + ")", `allocate ${nc} slots, copy ${m.items.length} elements over, free the old block`, "info");
    m.growing = true;
    p.render();
    if (!RM && track.current)
      await track.current.animate([{ opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }], { duration: 520 }).finished;
    m.cap = nc;
  };
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
        on={async () => {
          const v = nextX();
          if (m.items.length === m.cap) await grow();
          re(() => m.items.push({ k: p.uid(), v }));
          p.log(`vec.push_back(${v});`, `size ${m.items.length}, capacity ${m.cap}`, "ok");
        }}
      >
        push_back(x)
      </Op>
      <Op
        p={p}
        on={async () => {
          if (!m.items.length) {
            p.log("vec.pop_back();", "vector is empty: undefined behavior", "err");
            shake(track.current);
            return;
          }
          const last = m.items[m.items.length - 1];
          await leave([p.byK(last.k)]);
          re(() => m.items.pop());
          p.log("vec.pop_back();", `removed ${last.v}, capacity stays ${m.cap}`);
        }}
      >
        pop_back()
      </Op>
      <Op
        p={p}
        on={async () => {
          const v = nextX();
          if (m.items.length === m.cap) await grow();
          re(() => m.items.unshift({ k: p.uid(), v }));
          p.log(`vec.insert(vec.begin(), ${v});`, `every element shifted right by one: ${m.items.length - 1} moves`, "info");
        }}
      >
        insert(begin(), x)
      </Op>
      <Op
        p={p}
        on={async () => {
          if (!m.items.length) {
            p.log("vec.erase(vec.begin());", "empty vector: begin() == end(), undefined behavior", "err");
            return;
          }
          const f = m.items[0];
          await leave([p.byK(f.k)]);
          re(() => m.items.shift());
          p.log("vec.erase(vec.begin());", `removed ${f.v}, the other ${m.items.length} shifted left`, "info");
        }}
      >
        erase(begin())
      </Op>
      <Op
        p={p}
        on={async () => {
          if (m.items.length < 3) {
            p.log("vec.erase(vec.begin() + 1, vec.end() - 1);", "needs at least 3 elements to remove anything", "info");
            return;
          }
          const mid = m.items.slice(1, -1);
          await leave(mid.map((x) => p.byK(x.k)));
          re(() => {
            m.items = [m.items[0], m.items[m.items.length - 1]];
          });
          p.log(
            "vec.erase(vec.begin() + 1, vec.end() - 1);",
            `removed ${mid.map((x) => x.v).join(" ")}; last element kept because the range end is excluded`,
          );
        }}
      >
        erase(begin()+1, end()-1)
      </Op>
      <Sep />
      <Op
        p={p}
        on={async () => {
          if (!m.items.length) {
            p.log("vec.front();", "empty vector: undefined behavior", "err");
            return;
          }
          const a = m.items[0];
          const b = m.items[m.items.length - 1];
          await Promise.all([p.flash(a.k), p.flash(b.k)]);
          p.log("vec.front(); vec.back();", `${a.v} and ${b.v}`, "ok");
        }}
      >
        front() / back()
      </Op>
      <VIn label="i" inputRef={inI} defaultValue={2} />
      <Op
        p={p}
        on={async () => {
          const i = num(inI);
          if (i < 0 || i >= m.items.length) {
            p.log(`vec.at(${i});`, `throws std::out_of_range (size is ${m.items.length})`, "err");
            shake(track.current);
            return;
          }
          await p.flash(m.items[i].k);
          p.log(`vec.at(${i});`, `${m.items[i].v} (bounds checked)`, "ok");
        }}
      >
        at(i)
      </Op>
      <Op
        p={p}
        on={async () => {
          const i = num(inI);
          if (i < 0 || i >= m.items.length) {
            p.log(`vec[${i}];`, "no bounds check: reads memory outside the vector. Undefined behavior, no exception", "err");
            return;
          }
          await p.flash(m.items[i].k);
          p.log(`vec[${i}];`, `${m.items[i].v} (O(1): address = start + ${i} × sizeof(int))`, "ok");
        }}
      >
        vec[i]
      </Op>
      <Sep />
      <Op
        p={p}
        on={() => {
          if (m.cap < 16) re(() => (m.cap = 16));
          p.log("vec.reserve(16);", "capacity is now 16: the next pushes need no reallocation", "ok");
        }}
      >
        reserve(16)
      </Op>
      <Op
        p={p}
        on={async () => {
          await leave(m.items.map((x) => p.byK(x.k)));
          re(() => (m.items = []));
          p.log("vec.clear();", `size 0, capacity still ${m.cap}`);
        }}
      >
        clear()
      </Op>
      <Op
        p={p}
        on={() => {
          re(() => (m.cap = m.items.length));
          p.log("vec.shrink_to_fit();", `capacity trimmed to ${m.cap} (a request; GCC honours it)`);
        }}
      >
        shrink_to_fit()
      </Op>
      <Op p={p} on={() => re(reset)}>
        reset
      </Op>
    </>
  );

  const n = m.items.length;
  const cells: ReactNode[] = m.items.map((it, i) => (
    <Cell
      key={it.k}
      k={it.k}
      v={it.v}
      idx={i}
      tag={i === 0 ? (n ? "begin()" : "") : ""}
      cls={cx(m.growing && "hit", p.fx(it.k))}
    />
  ));
  for (let i = n; i < m.cap; i++)
    cells.push(
      <Cell key={"vg" + i} k={"vg" + i} v="" cls="ghost" idx={i} tag={i === n ? (n ? "end()" : "begin() = end()") : ""} />,
    );
  if (n === m.cap) cells.push(<Cell key="vgend" k="vgend" v="" cls="past" tag={n ? "end()" : "begin() = end()"} />);

  return (
    <Panel
      api={p}
      label="vector visualizer"
      controls={controls}
      stats={[
        ["size", n],
        ["capacity", m.cap],
      ]}
    >
      <div className="track" ref={track}>
        {cells}
      </div>
    </Panel>
  );
}
