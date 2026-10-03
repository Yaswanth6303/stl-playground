import { useRef } from "react";
import { flip, leave } from "../../lib/motion";
import { Op, Panel, VIn, num, usePanel } from "./kit";
import { BucketsView, useBuckets } from "./Buckets";

export default function UnorderedMapVisualizer() {
  const p = usePanel("umap");
  const h = useBuckets(p, {
    nb: 5,
    initial: [
      [1, "Yaswanth"],
      [2, "Kundan"],
      [3, "Varsha"],
      [4, "Raja"],
    ],
    kv: true,
  });
  const { H } = h;
  const inK = useRef<HTMLInputElement>(null);
  const inV = useRef<HTMLInputElement>(null);

  const re = (mutate: () => void) =>
    flip(h.box.current, () => {
      mutate();
      p.render();
    });

  const controls = (
    <>
      <VIn label="key" inputRef={inK} defaultValue={6} />
      <VIn label="value" inputRef={inV} defaultValue="Meera" type="text" wide />
      <Op
        p={p}
        cls="primary"
        on={async () => {
          const key = num(inK);
          const val = inV.current?.value || "x";
          const { found } = await h.scan(key);
          if (found) {
            const old = found.val;
            found.val = val;
            void p.flash(found.k, "hit", 800);
            p.log(`mpp[${key}] = "${val}";`, `overwrote "${old}"`, "info");
          } else {
            const k = p.uid();
            re(() => H.items.push({ k, key, val }));
            void p.flash(k, "good", 800);
            p.log(`mpp[${key}] = "${val}";`, `new entry in bucket ${h.hash(key)}`, "ok");
          }
        }}
      >
        mpp[key] = value
      </Op>
      <Op
        p={p}
        on={async () => {
          const key = num(inK);
          const { found, checked } = await h.scan(key);
          if (found) {
            void p.flash(found.k, "good", 900);
            p.log(`mpp.find(${key});`, `it->second = "${found.val}" (${checked} check${checked > 1 ? "s" : ""})`, "ok");
          } else p.log(`mpp.find(${key});`, "returns end()", "err");
        }}
      >
        find(key)
      </Op>
      <Op
        p={p}
        on={async () => {
          const key = num(inK);
          const { found } = await h.scan(key);
          if (!found) {
            p.log(`mpp.erase(${key});`, "returns 0");
            return;
          }
          await leave([p.byK(found.k)]);
          re(() => (H.items = H.items.filter((i) => i !== found)));
          p.log(`mpp.erase(${key});`, "returns 1", "ok");
        }}
      >
        erase(key)
      </Op>
      <Op p={p} on={() => re(h.reset)}>
        reset
      </Op>
    </>
  );

  return (
    <Panel api={p} label="unordered_map visualizer" controls={controls} stats={h.stats}>
      <BucketsView p={p} h={h} />
    </Panel>
  );
}
