import { useRef, type KeyboardEvent } from "react";
import { flip, rnd } from "../../lib/motion";
import { markVisited } from "../../lib/visited";
import { Cell, Op, Panel, cx, useModel, usePanel } from "./kit";

interface P {
  k: string;
  f: number;
  s: number;
}

const INIT: [number, number][] = [
  [1, 6],
  [1, 5],
  [2, 6],
  [2, 9],
  [3, 9],
];

/** complexComparator: .second descending, ties by .first ascending. Returns [result, why]. */
function comp(a: P, b: P): [boolean, string] {
  if (a.s > b.s) return [true, `${a.s} > ${b.s}: bigger .second goes first`];
  if (a.s < b.s) return [false, `${a.s} < ${b.s}: a has the smaller .second, so b goes first`];
  if (a.f < b.f) return [true, `tie on .second (${a.s}); ${a.f} < ${b.f}, smaller .first goes first`];
  return [false, a.f === b.f ? "equal pairs: must return false" : `tie on .second (${a.s}); ${a.f} > ${b.f}, so b goes first`];
}

export default function ComparatorVisualizer() {
  const p = usePanel("comparator");
  const fresh = () => INIT.map(([f, s]) => ({ k: p.uid(), f, s }));
  const m = useModel(() => ({ items: fresh() as P[], sel: [] as string[] }));
  const track = useRef<HTMLDivElement>(null);

  const re = (mutate: () => void) =>
    flip(track.current, () => {
      m.sel = [];
      mutate();
      p.render();
    });
  const pick = (k: string) => {
    if (p.busy) return;
    markVisited("comparator");
    if (m.sel.length === 2) m.sel = [];
    m.sel.push(k);
    p.render();
    if (m.sel.length === 2) {
      const a = m.items.find((i) => i.k === m.sel[0]) as P;
      const b = m.items.find((i) => i.k === m.sel[1]) as P;
      if (a === b) {
        p.log("complexComparator(a, a)", "false. Any valid comparator returns false for an element compared with itself", "info");
        return;
      }
      const [r, why] = comp(a, b);
      p.log(`complexComparator({${a.f},${a.s}}, {${b.f},${b.s}})`, `${r}: ${why}`, r ? "ok" : "err");
    }
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>, k: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(k);
    }
  };
  const fmt = () => m.items.map((i) => `{${i.f},${i.s}}`).join(" ");

  const controls = (
    <>
      <Op
        p={p}
        cls="primary"
        on={() => {
          re(() => m.items.sort((a, b) => (comp(a, b)[0] ? -1 : comp(b, a)[0] ? 1 : 0)));
          p.log("sort(ps, ps + 5, complexComparator);", fmt(), "ok");
        }}
      >
        sort(ps, ps + 5, complexComparator)
      </Op>
      <Op
        p={p}
        on={() => {
          re(() => m.items.sort((a, b) => a.f - b.f || a.s - b.s));
          p.log("sort(ps, ps + 5);", "default pair order: by .first, then .second → " + fmt(), "ok");
        }}
      >
        {"sort(ps, ps + 5)  [default]"}
      </Op>
      <Op
        p={p}
        on={() =>
          re(() => {
            const { items } = m;
            for (let i = items.length - 1; i > 0; i--) {
              const j = rnd(0, i);
              [items[i], items[j]] = [items[j], items[i]];
            }
          })
        }
      >
        shuffle
      </Op>
      <Op
        p={p}
        cls="warn"
        on={() => {
          p.log(
            "internalComparator(5, 5)  // if (a < b) return false; else return true;",
            'returns true: "5 goes before 5". Violates strict ordering; sort may crash with duplicates',
            "err",
          );
          p.log("return ele1 > ele2;", "internalComparator(5, 5) → false. Correct", "ok");
        }}
      >
        broken: comp(5, 5)
      </Op>
      <Op p={p} on={() => re(() => (m.items = fresh()))}>
        reset
      </Op>
    </>
  );

  return (
    <Panel api={p} label="comparator visualizer" controls={controls}>
      <div className="track" style={{ cursor: "pointer" }} ref={track}>
        {m.items.map((it, i) => {
          const a = m.sel[0] === it.k;
          const b = m.sel[1] === it.k;
          return (
            <Cell
              key={it.k}
              k={it.k}
              idx={i}
              cls={cx(a ? "hit" : b ? "inrange" : "", p.fx(it.k))}
              tag={a ? "a" : b ? "b" : ""}
              tabIndex={0}
              role="button"
              aria-label={`pair {${it.f}, ${it.s}}${a ? ", selected as a" : b ? ", selected as b" : ""}`}
              onClick={() => pick(it.k)}
              onKeyDown={(e) => onKey(e, it.k)}
            >
              <span>{`{${it.f}, ${it.s}}`}</span>
            </Cell>
          );
        })}
      </div>
      <div className="range-note">Click two pairs to ask the comparator which goes first.</div>
    </Panel>
  );
}
