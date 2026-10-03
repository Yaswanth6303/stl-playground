import { sleep } from "../../lib/motion";
import { Cell, Label, Op, Panel, Sep, cx, useModel, usePanel } from "./kit";

const VALS = [4, 7, 10, 3, 8];
const N = VALS.length;
const PREDS: Record<string, (x: number) => boolean> = {
  "x % 2 == 0": (x) => x % 2 === 0,
  "x > 8": (x) => x > 8,
  "x > 0": (x) => x > 0,
  "x > 20": (x) => x > 20,
};

export default function PredicateVisualizer() {
  const p = usePanel("pred");
  const m = useModel(() => ({
    pname: "x % 2 == 0",
    cls: {} as Record<number, string>,
    tags: {} as Record<number, string>,
  }));

  const draw = (cls: Record<number, string> = {}, tags: Record<number, string> = {}) => {
    m.cls = cls;
    m.tags = tags;
    p.render();
  };
  /** Walk left to right; stop early once the predicate returns `stopWhen` (null = never stop). */
  const scan = async (stopWhen: boolean | null) => {
    const f = PREDS[m.pname];
    const cls: Record<number, string> = {};
    let i = 0;
    for (; i < N; i++) {
      draw({ ...cls, [i]: "cmp" }, { [i]: "checking" });
      await sleep(300);
      const r = f(VALS[i]);
      cls[i] = r ? "good" : "bad";
      if (stopWhen != null && r === stopWhen) {
        i++;
        break;
      }
    }
    for (let j = i; j < N; j++) cls[j] = "dim";
    return { cls, checked: i };
  };

  const controls = (
    <>
      <Label>lambda:</Label>
      {Object.keys(PREDS).map((k) => (
        <Op
          key={k}
          p={p}
          cls={m.pname === k ? "on" : ""}
          on={() => {
            m.pname = k;
            draw();
          }}
        >
          {`[](int x){ return ${k}; }`}
        </Op>
      ))}
      <Sep />
      <Op
        p={p}
        cls="primary"
        on={async () => {
          const { cls } = await scan(null);
          const c = VALS.filter(PREDS[m.pname]).length;
          draw(cls);
          p.log(`count_if(v.begin(), v.end(), [](int x){ return ${m.pname}; })`, `${c}. Checked all ${N}`, "ok");
        }}
      >
        count_if
      </Op>
      <Op
        p={p}
        on={async () => {
          const { cls, checked } = await scan(true);
          const at = VALS.findIndex(PREDS[m.pname]);
          draw(cls, at < 0 ? { [N]: "it == end()" } : { [at]: "it" });
          p.log(
            "find_if(..., lambda)",
            at < 0 ? `no match after ${checked} checks: returns end()` : `*it = ${VALS[at]}, stopped after ${checked} check${checked > 1 ? "s" : ""}`,
            at < 0 ? "err" : "ok",
          );
        }}
      >
        find_if
      </Op>
      <Op
        p={p}
        on={async () => {
          const { cls, checked } = await scan(false);
          const r = VALS.every(PREDS[m.pname]);
          draw(cls);
          p.log("all_of(..., lambda)", `${r ? 1 : 0}. Checked ${checked} of ${N}${!r ? ": one false is enough to answer" : ""}`, r ? "ok" : "err");
        }}
      >
        all_of
      </Op>
      <Op
        p={p}
        on={async () => {
          const { cls, checked } = await scan(true);
          const r = VALS.some(PREDS[m.pname]);
          draw(cls);
          p.log("any_of(..., lambda)", `${r ? 1 : 0}. Checked ${checked} of ${N}${r ? ": one true is enough to answer" : ""}`, r ? "ok" : "err");
        }}
      >
        any_of
      </Op>
      <Op
        p={p}
        on={async () => {
          const { cls, checked } = await scan(true);
          const r = !VALS.some(PREDS[m.pname]);
          draw(cls);
          p.log("none_of(..., lambda)", `${r ? 1 : 0}. Checked ${checked} of ${N}`, r ? "ok" : "err");
        }}
      >
        none_of
      </Op>
    </>
  );

  return (
    <Panel api={p} label="count_if, find_if, all_of, any_of and none_of visualizer" controls={controls}>
      <div className="track">
        {VALS.map((v, i) => (
          <Cell key={i} k={"pr" + i} v={v} idx={i} cls={cx(m.cls[i], p.fx("pr" + i))} tag={m.tags[i] || ""} />
        ))}
        <Cell k="prend" v="end" cls="ghost" tag={m.tags[N] || ""} />
      </div>
    </Panel>
  );
}
