import { useRef } from "react";
import { sleep } from "../../lib/motion";
import { Cell, Op, Panel, VIn, num, useModel, usePanel } from "./kit";

const V = [3, 1, 4, 1, 5, 9];
const empty = () => V.map((): number | null => null);

export default function PrefixSumVisualizer() {
  const p = usePanel("prefix");
  const m = useModel(() => ({
    pre: empty(),
    mode: "pre" as "pre" | "diff",
    cv: {} as Record<number, string>,
    cp: {} as Record<number, string>,
  }));
  const inL = useRef<HTMLInputElement>(null);
  const inR = useRef<HTMLInputElement>(null);

  const draw = (cv: Record<number, string> = {}, cp: Record<number, string> = {}) => {
    m.cv = cv;
    m.cp = cp;
    p.render();
  };
  const build = async (quiet: boolean) => {
    m.mode = "pre";
    m.pre = empty();
    let s = 0;
    for (let i = 0; i < V.length; i++) {
      s += V[i];
      m.pre[i] = s;
      if (!quiet) {
        draw({ [i]: "hit" }, { [i]: "good", ...(i ? { [i - 1]: "cmp" } : {}) });
        p.log(i ? `pre[${i}] = pre[${i - 1}] + v[${i}]` : "pre[0] = v[0]", `${i ? m.pre[i - 1] + " + " : ""}${V[i]} = ${s}`);
        await sleep(380);
      }
    }
    draw();
  };

  const controls = (
    <>
      <Op
        p={p}
        cls="primary"
        on={async () => {
          await build(false);
          p.log("partial_sum(v.begin(), v.end(), pre.begin());", m.pre.join(" "), "ok");
        }}
      >
        partial_sum(v → pre)
      </Op>
      <VIn label="l" inputRef={inL} defaultValue={2} />
      <VIn label="r" inputRef={inR} defaultValue={4} />
      <Op
        p={p}
        on={async () => {
          const l = num(inL);
          const r = num(inR);
          if (l < 0 || r >= V.length || l > r) {
            p.log("// bad range", `need 0 ≤ l ≤ r ≤ ${V.length - 1}`, "err");
            return;
          }
          if (m.mode !== "pre" || m.pre.includes(null)) await build(true);
          const cv: Record<number, string> = {};
          for (let i = l; i <= r; i++) cv[i] = "inrange";
          draw(cv, { [r]: "good", ...(l ? { [l - 1]: "bad" } : {}) });
          const pre = m.pre as number[];
          const ans = pre[r] - (l ? pre[l - 1] : 0);
          p.log(
            `pre[${r}] - ${l ? `pre[${l - 1}]` : "0"}`,
            `${pre[r]} - ${l ? pre[l - 1] : 0} = ${ans}. Check: ${V.slice(l, r + 1).join(" + ")} = ${ans}`,
            "ok",
          );
        }}
      >
        sum of v[l..r]
      </Op>
      <Op
        p={p}
        on={async () => {
          m.mode = "diff";
          m.pre = empty();
          for (let i = 0; i < V.length; i++) {
            m.pre[i] = i ? V[i] - V[i - 1] : V[0];
            draw({ [i]: "hit", ...(i ? { [i - 1]: "cmp" } : {}) }, { [i]: "good" });
            await sleep(320);
          }
          draw();
          p.log("adjacent_difference(v.begin(), v.end(), diff.begin());", m.pre.join(" ") + ". diff[i] = v[i] - v[i-1]", "ok");
        }}
      >
        adjacent_difference(v)
      </Op>
      <Op
        p={p}
        on={() => {
          m.mode = "pre";
          m.pre = empty();
          draw();
        }}
      >
        reset
      </Op>
    </>
  );

  return (
    <Panel api={p} label="partial_sum visualizer" controls={controls}>
      <div className="rowlab">v</div>
      <div className="track">
        {V.map((x, i) => (
          <Cell key={i} k={"pv" + i} v={x} idx={i} cls={m.cv[i] || ""} />
        ))}
      </div>
      <div className="rowlab">{m.mode}</div>
      <div className="track">
        {m.pre.map((x, i) => (
          <Cell key={i} k={"pp" + i} v={x == null ? "" : x} idx={i} cls={x == null ? "ghost" : m.cp[i] || ""} />
        ))}
      </div>
    </Panel>
  );
}
