import { useRef } from "react";
import { flip, sleep } from "../../lib/motion";
import { Cell, type Item, Op, Panel, useModel, usePanel } from "./kit";

const A = [1, 3, 5, 7];
const B = [3, 4, 5, 6];

/** What each algorithm emits when a < b, a > b (emits b) or a == b; null means skip. */
interface Rule {
  lt: (x: number) => number | null;
  gt: (x: number) => number | null;
  eq: (x: number) => number | null;
}
const id = (x: number) => x;
const none = () => null;

export default function SetOpsVisualizer() {
  const p = usePanel("setops");
  const m = useModel(() => ({ i: -1, j: -1, out: [] as Item[], name: "result" }));
  const to = useRef<HTMLDivElement>(null);

  const pos = (i: number, j: number) => {
    m.i = i;
    m.j = j;
    p.render();
  };
  const emit = (v: number) =>
    flip(to.current, () => {
      m.out.push({ k: p.uid(), v });
      p.render();
    });

  const run = async (name: string, fn: Rule, rest: { a?: boolean; b?: boolean }) => {
    flip(to.current, () => {
      m.out = [];
      m.name = name;
      p.render();
    });
    let i = 0;
    let j = 0;
    while (i < A.length && j < B.length) {
      pos(i, j);
      await sleep(480);
      const a = A[i];
      const b = B[j];
      if (a < b) {
        const e = fn.lt(a);
        if (e != null) emit(e);
        p.log(`// ${a} < ${b}`, e != null ? `emit ${a}, advance i` : `skip ${a}, advance i`, "info");
        i++;
      } else if (b < a) {
        const e = fn.gt(b);
        if (e != null) emit(e);
        p.log(`// ${a} > ${b}`, e != null ? `emit ${b}, advance j` : `skip ${b}, advance j`, "info");
        j++;
      } else {
        const e = fn.eq(a);
        if (e != null) emit(e);
        p.log(`// ${a} == ${b}`, e != null ? `emit ${a} once, advance both` : "in both: skip, advance both", "info");
        i++;
        j++;
      }
      await sleep(260);
    }
    pos(i, j);
    if (rest.a && i < A.length) {
      p.log("// b is used up", `copy the rest of a: ${A.slice(i).join(" ")}`, "info");
      for (; i < A.length; i++) {
        emit(A[i]);
        await sleep(200);
      }
    }
    if (rest.b && j < B.length) {
      p.log("// a is used up", `copy the rest of b: ${B.slice(j).join(" ")}`, "info");
      for (; j < B.length; j++) {
        emit(B[j]);
        await sleep(200);
      }
    }
    pos(A.length, B.length);
    p.log(`${name}(a..., b..., back_inserter(out));`, m.out.map((o) => o.v).join(" ") || "(empty)", "ok");
  };

  const controls = (
    <>
      <Op p={p} cls="primary" on={() => run("set_union", { lt: id, gt: id, eq: id }, { a: true, b: true })}>
        set_union
      </Op>
      <Op p={p} on={() => run("set_intersection", { lt: none, gt: none, eq: id }, {})}>
        set_intersection
      </Op>
      <Op p={p} on={() => run("set_difference", { lt: id, gt: none, eq: none }, { a: true })}>
        set_difference (a − b)
      </Op>
      <Op p={p} on={() => run("set_symmetric_difference", { lt: id, gt: id, eq: none }, { a: true, b: true })}>
        set_symmetric_difference
      </Op>
    </>
  );

  const side = (vals: number[], prefix: string, at: number, tag: string) =>
    vals.map((x, k) => (
      <Cell key={k} k={prefix + k} v={x} cls={k === at ? "cmp" : k < at ? "dim" : ""} tag={k === at ? tag : ""} />
    ));

  return (
    <Panel api={p} label="set_union, set_intersection and set_difference visualizer" controls={controls}>
      <div className="rowlab">a</div>
      <div className="track">{side(A, "sa", m.i, "i")}</div>
      <div className="rowlab">b</div>
      <div className="track">{side(B, "sb", m.j, "j")}</div>
      <div className="rowlab">{m.name}</div>
      <div className="track" ref={to}>
        {m.out.length ? (
          m.out.map((o) => <Cell key={o.k} k={o.k} v={o.v} cls="good" />)
        ) : (
          <span className="vlabel">empty</span>
        )}
      </div>
    </Panel>
  );
}
