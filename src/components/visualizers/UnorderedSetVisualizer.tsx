import { useRef } from "react";
import { flip, leave, rnd, shake } from "../../lib/motion";
import { Op, Panel, Sep, VIn, num, usePanel } from "./kit";
import { BucketsView, useBuckets } from "./Buckets";

export default function UnorderedSetVisualizer() {
  const p = usePanel("uset");
  const h = useBuckets(p, { nb: 7, initial: [1, 4, 2, 8, 7], kv: false });
  const { H } = h;
  const inX = useRef<HTMLInputElement>(null);

  const re = (mutate: () => void) =>
    flip(h.box.current, () => {
      mutate();
      p.render();
    });
  const insert = async (x: number) => {
    const { found } = await h.scan(x);
    if (found) {
      shake(p.byK(found.k));
      p.log(`st.insert(${x});`, "already present: ignored", "info");
      return;
    }
    const k = p.uid();
    re(() => H.items.push({ k, key: x }));
    void p.flash(k, "good", 700);
    p.log(`st.insert(${x});`, `added to bucket ${h.hash(x)}`, "ok");
  };

  const controls = (
    <>
      <VIn label="x" inputRef={inX} defaultValue={15} />
      <Op
        p={p}
        cls="primary"
        on={async () => {
          const x = num(inX);
          if (inX.current) inX.current.value = String(rnd(1, 60));
          await insert(x);
        }}
      >
        insert(x)
      </Op>
      <Op
        p={p}
        on={async () => {
          const x = num(inX);
          const { b, found, checked } = await h.scan(x);
          if (found) {
            void p.flash(found.k, "good", 900);
            p.log(`st.find(${x});`, `found after checking ${checked} element(s) in bucket ${b}`, "ok");
          } else p.log(`st.find(${x});`, `not in bucket ${b}: returns end(). The other ${6} buckets were never touched`, "err");
        }}
      >
        find(x)
      </Op>
      <Op
        p={p}
        on={async () => {
          const x = num(inX);
          const { found } = await h.scan(x);
          if (!found) {
            p.log(`st.erase(${x});`, "not present, returns 0");
            return;
          }
          await leave([p.byK(found.k)]);
          re(() => (H.items = H.items.filter((i) => i !== found)));
          p.log(`st.erase(${x});`, "returns 1", "ok");
        }}
      >
        erase(x)
      </Op>
      <Op
        p={p}
        on={async () => {
          const order = [];
          for (let b = 0; b < 7; b++) for (const i of H.items.filter((i) => h.hash(i.key) === b)) order.push(i);
          const out: number[] = [];
          for (const i of order) {
            await p.flash(i.k, "hit", 260);
            out.push(i.key);
          }
          p.log(
            "for (auto x : st) cout << x;",
            `this model prints ${out.join(" ")}. Real order depends on the library (g++ printed 7 8 2 4 1)`,
            "info",
          );
        }}
      >
        for (auto x : st)
      </Op>
      <Sep />
      <Op
        p={p}
        cls="warn"
        on={async () => {
          for (const x of [7, 14, 21, 28]) await insert(x);
          p.log("// collisions", "all of these hash to bucket 0: lookups there scan a longer chain", "err");
        }}
      >
        insert 7, 14, 21, 28
      </Op>
      <Op p={p} on={() => re(h.reset)}>
        reset
      </Op>
    </>
  );

  return (
    <Panel api={p} label="unordered_set visualizer" controls={controls} stats={h.stats}>
      <BucketsView p={p} h={h} />
    </Panel>
  );
}
