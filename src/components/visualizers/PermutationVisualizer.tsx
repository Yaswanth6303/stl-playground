import { useRef } from "react";
import { flip, sleep } from "../../lib/motion";
import { Cell, type Item, Op, Panel, Sep, cx, useModel, usePanel } from "./kit";

/** Characters are unique, so the key can be the character itself. */
const toItems = (s: string): Item<string>[] => s.split("").map((ch) => ({ k: "ch" + ch, v: ch }));

/** In-place next/prev permutation on the first n items; false when it wrapped around. */
function nextP(a: Item<string>[], n: number, prev: boolean): boolean {
  const gt = prev ? (x: Item<string>, y: Item<string>) => x.v < y.v : (x: Item<string>, y: Item<string>) => x.v > y.v;
  let i = n - 2;
  while (i >= 0 && !gt(a[i + 1], a[i])) i--;
  if (i < 0) {
    const s = a.slice(0, n).reverse();
    a.splice(0, n, ...s);
    return false;
  }
  let j = n - 1;
  while (!gt(a[j], a[i])) j--;
  [a[i], a[j]] = [a[j], a[i]];
  const s = a.slice(i + 1, n).reverse();
  a.splice(i + 1, n - i - 1, ...s);
  return true;
}

export default function PermutationVisualizer() {
  const p = usePanel("perm");
  const m = useModel(() => ({ arr: toItems("abc"), hist: ["abc"], rangeEnd: 3 }));
  const track = useRef<HTMLDivElement>(null);

  const str = () => m.arr.map((c) => c.v).join("");
  const reset = (s: string) => {
    m.arr = toItems(s);
    m.hist = [s];
    m.rangeEnd = 3;
    p.render();
  };
  const step = (n: number, prev: boolean, stmt: string) => {
    m.rangeEnd = n;
    let ok = false;
    flip(track.current, () => {
      ok = nextP(m.arr, n, prev);
      m.hist.push(str());
      p.render();
    });
    p.log(stmt, ok ? `true → "${str()}"` : `false: no ${prev ? "smaller" : "larger"} order, range reset → "${str()}"`, ok ? "ok" : "err");
    return ok;
  };

  const controls = (
    <>
      <Op p={p} cls="primary" on={() => step(3, false, "next_permutation(str.begin(), str.end())")}>
        next_permutation(begin, end)
      </Op>
      <Op p={p} on={() => step(2, false, "next_permutation(str.begin(), str.end() - 1)")}>
        next_permutation(begin, end - 1)
      </Op>
      <Op p={p} on={() => step(3, true, "prev_permutation(str.begin(), str.end())")}>
        prev_permutation(begin, end)
      </Op>
      <Sep />
      <Op
        p={p}
        on={async () => {
          reset("abc");
          p.log('string str = "abc";');
          while (step(3, false, "next_permutation(...)")) await sleep(520);
          p.log("// loop ends", `printed ${m.hist.length - 1} permutations: ${m.hist.slice(0, -1).join(" ")}`, "ok");
        }}
      >
        do {"{"} print {"}"} while (next…)
      </Op>
      <Op p={p} on={() => reset("abc")}>
        str = "abc"
      </Op>
      <Op p={p} on={() => reset("cba")}>
        str = "cba"
      </Op>
      <Op p={p} on={() => reset("bca")}>
        str = "bca"
      </Op>
    </>
  );

  return (
    <Panel api={p} label="permutations visualizer" controls={controls}>
      <div className="track" ref={track}>
        {m.arr.map((c, i) => (
          <Cell
            key={c.k}
            k={c.k}
            v={c.v}
            idx={i}
            cls={cx(i < m.rangeEnd ? (m.rangeEnd < 3 ? "inrange" : "") : "dim", p.fx(c.k))}
          />
        ))}
      </div>
      <div className="history">
        {m.hist.map((h, i) => (
          <span key={i} className={i === m.hist.length - 1 ? "now" : ""}>
            {h}
          </span>
        ))}
      </div>
    </Panel>
  );
}
