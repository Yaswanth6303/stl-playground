import { useRef } from "react";
import { sleep } from "../../lib/motion";
import { Cell, Op, Panel, VIn, cx, num, tagMap, useModel, usePanel } from "./kit";

const VALS = [1, 3, 3, 3, 7, 9, 12];
const N = VALS.length;

export default function BinarySearchVisualizer() {
  const p = usePanel("bsearch");
  const m = useModel(() => ({ cls: {} as Record<number, string>, tags: {} as Record<number, string> }));
  const inX = useRef<HTMLInputElement>(null);

  const draw = (cls: Record<number, string> = {}, tags: Record<number, string> = {}) => {
    m.cls = cls;
    m.tags = tags;
    p.render();
  };
  /** lower_bound (upper = false) or upper_bound (upper = true) on [0, N), animated. */
  const run = async (x: number, upper: boolean, quiet = false): Promise<[number, number]> => {
    let lo = 0;
    let hi = N;
    let step = 0;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      step++;
      const cls: Record<number, string> = {};
      for (let i = lo; i < hi; i++) cls[i] = "inrange";
      cls[mid] = "cmp";
      draw(
        cls,
        tagMap([
          [lo, "lo"],
          [mid, "mid"],
          [hi, "hi"],
        ]),
      );
      await sleep(quiet ? 200 : 520);
      const goRight = upper ? VALS[mid] <= x : VALS[mid] < x;
      if (!quiet)
        p.log(
          `// step ${step}: mid = ${mid}, v[mid] = ${VALS[mid]}`,
          goRight
            ? `${VALS[mid]} ${upper ? "<=" : "<"} ${x}: answer is right of mid, lo = ${mid + 1}`
            : `${VALS[mid]} ${upper ? ">" : ">="} ${x}: answer is mid or left, hi = ${mid}`,
          "info",
        );
      if (goRight) lo = mid + 1;
      else hi = mid;
    }
    return [lo, step];
  };

  const controls = (
    <>
      <VIn label="x" inputRef={inX} defaultValue={7} />
      <Op
        p={p}
        cls="primary"
        on={async () => {
          const x = num(inX);
          const [i, steps] = await run(x, false);
          const found = i < N && VALS[i] === x;
          draw(found ? { [i]: "good" } : {}, { [i]: found ? "found" : "stopped here" });
          p.log(`binary_search(v.begin(), v.end(), ${x});`, `${found ? 1 : 0} after ${steps} steps (a linear scan could need ${N})`, found ? "ok" : "err");
        }}
      >
        binary_search(x)
      </Op>
      <Op
        p={p}
        on={async () => {
          const x = num(inX);
          const [i] = await run(x, false);
          draw(i < N ? { [i]: "good" } : {}, { [i]: "lower_bound" });
          p.log(
            `lower_bound(v.begin(), v.end(), ${x}) - v.begin();`,
            i < N ? `${i}: first value ≥ ${x} is ${VALS[i]}` : `${N} = end(): nothing ≥ ${x}`,
            i < N ? "ok" : "err",
          );
        }}
      >
        lower_bound(x)
      </Op>
      <Op
        p={p}
        on={async () => {
          const x = num(inX);
          const [i] = await run(x, true);
          draw(i < N ? { [i]: "good" } : {}, { [i]: "upper_bound" });
          p.log(
            `upper_bound(v.begin(), v.end(), ${x}) - v.begin();`,
            i < N ? `${i}: first value > ${x} is ${VALS[i]}` : `${N} = end(): nothing > ${x}`,
            i < N ? "ok" : "err",
          );
        }}
      >
        upper_bound(x)
      </Op>
      <Op
        p={p}
        on={async () => {
          const x = num(inX);
          const [lb] = await run(x, false, true);
          const [ub] = await run(x, true, true);
          const cls: Record<number, string> = {};
          for (let i = lb; i < ub; i++) cls[i] = "good";
          draw(
            cls,
            tagMap([
              [lb, "lb"],
              [ub, "ub"],
            ]),
          );
          p.log(`upper_bound(..., ${x}) - lower_bound(..., ${x})`, `${ub} - ${lb} = ${ub - lb} copies of ${x}, in O(log n)`, "ok");
        }}
      >
        count = ub - lb
      </Op>
    </>
  );

  return (
    <Panel api={p} label="binary_search visualizer" controls={controls}>
      <div className="track">
        {VALS.map((v, i) => (
          <Cell key={i} k={"bs" + i} v={v} idx={i} cls={cx(m.cls[i], p.fx("bs" + i))} tag={m.tags[i] || ""} />
        ))}
        <Cell k="bsend" v="end" cls="ghost" idx={N} tag={m.tags[N] || ""} />
      </div>
    </Panel>
  );
}
