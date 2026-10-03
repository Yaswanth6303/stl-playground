/** std::priority_queue: the binary heap drawn as a tree and as the vector it lives in. */
import { useLayoutEffect, useRef } from "react";
import { RM, flip, leave, rnd, sleep } from "../../lib/motion";
import { Cell, type Item, Op, Panel, Sep, VIn, cx, num, useModel, usePanel } from "./kit";

type Mode = "max" | "min";
const START = [5, 2, 10, 8, 6];

/** Tree position of heap index i: x as a percentage of the box width, y in px. */
function posOf(i: number): [number, number] {
  const L = Math.floor(Math.log2(i + 1));
  const q = i - (2 ** L - 1);
  return [((q + 0.5) / 2 ** L) * 100, 32 + L * 64];
}

const betterIn = (mode: Mode, a: Item, b: Item) => (mode === "max" ? a.v > b.v : a.v < b.v);

/** Push each value with sift-up, no animation (the original `build`). */
function heapify(s: { arr: Item[]; mode: Mode }, vals: number[], uid: () => string) {
  const arr: Item[] = [];
  for (const v of vals) {
    arr.push({ k: uid(), v });
    let i = arr.length - 1;
    while (i > 0) {
      const q = (i - 1) >> 1;
      if (betterIn(s.mode, arr[i], arr[q])) {
        [arr[i], arr[q]] = [arr[q], arr[i]];
        i = q;
      } else break;
    }
  }
  s.arr = arr;
}

export default function HeapVisualizer() {
  const p = usePanel("pq");
  const m = useModel(() => {
    const s = { arr: [] as Item[], mode: "max" as Mode, cmp: new Set<string>(), seen: new Set<string>() };
    heapify(s, START, p.uid);
    // the starting heap is server-rendered, so it appears without a pop-in
    s.arr.forEach((a) => s.seen.add(a.k));
    return s;
  });
  const track = useRef<HTMLDivElement>(null);
  const inV = useRef<HTMLInputElement>(null);

  const better = (a: Item, b: Item) => betterIn(m.mode, a, b);
  const build = (vals: number[]) => heapify(m, vals, p.uid);

  /** Re-render; the vector row below the tree slides with FLIP, tree nodes glide via CSS. */
  const render = () => flip(track.current, () => p.render());
  const mark = (idxs: number[], on: boolean) => {
    idxs.forEach((i) => {
      const a = m.arr[i];
      if (a) on ? m.cmp.add(a.k) : m.cmp.delete(a.k);
    });
    p.render();
  };

  // New tree nodes pop in, like the original's per-node enter animation.
  useLayoutEffect(() => {
    const keep = new Set(m.arr.map((a) => a.k));
    for (const a of m.arr) {
      if (m.seen.has(a.k)) continue;
      m.seen.add(a.k);
      const el = p.byK(a.k);
      if (el && !RM)
        el.animate([{ opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1 }], {
          duration: 380,
          easing: "cubic-bezier(.2,.9,.25,1.3)",
        });
    }
    for (const k of m.seen) if (!keep.has(k)) m.seen.delete(k);
  });

  const push = async (v: number) => {
    const { arr } = m;
    if (arr.length >= 15) {
      p.log(`pq.push(${v});`, "demo limit: 15 nodes (4 levels)", "info");
      return;
    }
    arr.push({ k: p.uid(), v });
    render();
    let i = arr.length - 1;
    p.log(`pq.push(${v});`, `placed at index ${i}, the end of the vector. Now sift up`);
    await sleep(480);
    while (i > 0) {
      const q = (i - 1) >> 1;
      mark([i, q], true);
      await sleep(420);
      if (better(arr[i], arr[q])) {
        p.log(`// compare with parent (index ${q})`, `${arr[i].v} ${m.mode === "max" ? ">" : "<"} ${arr[q].v}: swap`, "info");
        mark([i, q], false);
        [arr[i], arr[q]] = [arr[q], arr[i]];
        render();
        await sleep(480);
        i = q;
      } else {
        p.log(
          `// compare with parent (index ${q})`,
          `${arr[i].v} ${m.mode === "max" ? "<=" : ">="} ${arr[q].v}: heap order holds, stop`,
          "ok",
        );
        mark([i, q], false);
        return;
      }
    }
    p.log("// reached index 0", `${arr[0].v} is the new top`, "ok");
  };

  const pop = async (quiet: boolean): Promise<number | null> => {
    if (!m.arr.length) {
      p.log("pq.pop();", "empty priority_queue: undefined behavior", "err");
      return null;
    }
    const top = m.arr[0];
    await p.flash(top.k, "hit", 400);
    if (!quiet) p.log("pq.pop();", `removes the top (${top.v}). Move the last element to the root, then sift down`);
    await leave([p.byK(top.k), p.byK("a" + top.k)]);
    if (m.arr.length === 1) {
      m.arr = [];
      render();
      return top.v;
    }
    const arr = m.arr;
    const last = arr.pop() as Item;
    arr[0] = last;
    render();
    await sleep(500);
    let i = 0;
    for (;;) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      let b = i;
      if (l < arr.length && better(arr[l], arr[b])) b = l;
      if (r < arr.length && better(arr[r], arr[b])) b = r;
      const kids = [l, r].filter((x) => x < arr.length);
      if (!kids.length) break;
      mark([i, ...kids], true);
      await sleep(420);
      mark([i, ...kids], false);
      if (b === i) {
        if (!quiet) p.log("// compare with children", `${arr[i].v} already beats its children: stop`, "ok");
        break;
      }
      if (!quiet)
        p.log("// compare with children", `swap ${arr[i].v} with the ${m.mode === "max" ? "larger" : "smaller"} child ${arr[b].v}`, "info");
      [arr[i], arr[b]] = [arr[b], arr[i]];
      render();
      await sleep(460);
      i = b;
    }
    return top.v;
  };

  const setMode = (mode: Mode, stmt: string, note: string) => {
    m.mode = mode;
    build(m.arr.length ? m.arr.map((a) => a.v) : START);
    render();
    p.log(stmt, note);
  };

  const controls = (
    <>
      <VIn label="x" inputRef={inV} defaultValue={7} random={[1, 20]} />
      <Op
        p={p}
        cls="primary"
        on={async () => {
          const v = num(inV, 7);
          if (inV.current) inV.current.value = String(rnd(1, 20));
          await push(v);
        }}
      >
        push(x)
      </Op>
      <Op p={p} on={() => pop(false)}>
        pop()
      </Op>
      <Op
        p={p}
        on={async () => {
          if (!m.arr.length) {
            p.log("pq.top();", "empty: undefined behavior", "err");
            return;
          }
          await p.flash(m.arr[0].k);
          p.log("pq.top();", `${m.arr[0].v}, always index 0: O(1)`, "ok");
        }}
      >
        top()
      </Op>
      <Op
        p={p}
        on={async () => {
          const out: (number | null)[] = [];
          while (m.arr.length) {
            const v = await pop(true);
            out.push(v);
            p.log("cout << pq.top(); pq.pop();", "printed: " + out.join(" "));
          }
          p.log("pq.empty()", `true. Output is ${m.mode === "max" ? "descending" : "ascending"}: heapsort`, "ok");
        }}
      >
        drain: while (!empty)
      </Op>
      <Sep />
      <Op p={p} cls={m.mode === "max" ? "on" : ""} on={() => setMode("max", "priority_queue<int> pq;", "max-heap: largest on top")}>
        priority_queue&lt;int&gt;
      </Op>
      <Op
        p={p}
        cls={m.mode === "min" ? "on" : ""}
        on={() => setMode("min", "priority_queue<int, vector<int>, greater<int>> spq;", "min-heap: smallest on top")}
      >
        greater&lt;int&gt; (min-heap)
      </Op>
      <Op
        p={p}
        on={() => {
          build(START);
          render();
          p.log("// pushed 5, 2, 10, 8, 6", `vector is [${m.arr.map((a) => a.v).join(", ")}]`);
        }}
      >
        reset
      </Op>
    </>
  );

  const { arr } = m;
  const lines = [];
  for (let i = 1; i < arr.length; i++) {
    const [x1, y1] = posOf((i - 1) >> 1);
    const [x2, y2] = posOf(i);
    lines.push(<line key={i} x1={x1 + "%"} y1={y1} x2={x2 + "%"} y2={y2} />);
  }

  return (
    <Panel
      api={p}
      label="priority_queue visualizer"
      controls={controls}
      stats={[
        ["type", m.mode === "max" ? "max-heap" : "min-heap"],
        ["size", arr.length],
        ["top", arr.length ? arr[0].v : "—"],
      ]}
    >
      <div className="heapbox" style={{ height: 74 + Math.floor(Math.log2(Math.max(1, arr.length))) * 64 }}>
        <svg aria-hidden="true">{lines}</svg>
        {arr.map((a, i) => {
          const [x, y] = posOf(i);
          return (
            <Cell
              key={a.k}
              k={a.k}
              v={a.v}
              idx={i}
              cls={cx("hnode", i === 0 && "root", m.cmp.has(a.k) && "cmp", p.fx(a.k))}
              style={{ left: x + "%", top: y + "px" }}
            />
          );
        })}
      </div>
      <div className="track" style={{ paddingTop: 26 }} ref={track}>
        {arr.map((a, i) => (
          <Cell
            key={"a" + a.k}
            k={"a" + a.k}
            v={a.v}
            idx={i}
            tag={i === 0 ? "top()" : ""}
            cls={cx(m.cmp.has(a.k) && "cmp", p.fx("a" + a.k))}
          />
        ))}
      </div>
      <div className="heap-arr-label">↑ the same heap as it sits in the vector: children of index i are 2i+1 and 2i+2</div>
    </Panel>
  );
}
