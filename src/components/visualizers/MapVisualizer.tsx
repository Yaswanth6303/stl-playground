import { useRef } from "react";
import { flip, leave, shake } from "../../lib/motion";
import { Op, Panel, VIn, num, usePanel } from "./kit";
import { RowsView, stableSort, useRows } from "./KeyValueRows";

export default function MapVisualizer() {
  const p = usePanel("map");
  const rows = useRows(p, [
    [1, "Yaswanth"],
    [2, "Kundan"],
    [3, "Varsha"],
    [4, "Raja"],
  ]);
  const { R } = rows;
  const inK = useRef<HTMLInputElement>(null);
  const inV = useRef<HTMLInputElement>(null);

  const re = (mutate: () => void) =>
    flip(rows.box.current, () => {
      mutate();
      p.render();
    });
  const find = (key: number) => R.items.find((i) => i.key === key);
  const add = (key: number, val: string) => {
    const k = p.uid();
    re(() => {
      R.items.push({ k, key, val });
      R.items = stableSort(R.items);
    });
    return k;
  };
  const val = () => inV.current?.value ?? "";

  const controls = (
    <>
      <VIn label="key" inputRef={inK} defaultValue={3} />
      <VIn label="value" inputRef={inV} defaultValue="Vandana" type="text" wide />
      <Op
        p={p}
        cls="primary"
        on={() => {
          const key = num(inK);
          const v = val();
          rows.clear();
          const f = find(key);
          if (f) {
            const old = f.val;
            f.val = v;
            void p.flash(f.k, "hit", 900);
            p.log(`mpp[${key}] = "${v}";`, `key exists: "${old}" overwritten`, "info");
          } else {
            const k = add(key, v);
            void p.flash(k, "good", 900);
            p.log(`mpp[${key}] = "${v}";`, "new key, placed in sorted order", "ok");
          }
        }}
      >
        mpp[key] = value
      </Op>
      <Op
        p={p}
        on={() => {
          const key = num(inK);
          const v = val();
          rows.clear();
          p.render();
          const f = find(key);
          if (f) {
            shake(p.byK(f.k));
            p.log(`mpp.insert({${key}, "${v}"});`, `key ${key} exists: insert does nothing and returns {it, false}. Value stays "${f.val}"`, "err");
          } else {
            const k = add(key, v);
            void p.flash(k, "good", 900);
            p.log(`mpp.insert({${key}, "${v}"});`, "inserted, returns {it, true}", "ok");
          }
        }}
      >
        insert({"{"}key, value{"}"})
      </Op>
      <Op
        p={p}
        cls="warn"
        on={() => {
          const key = num(inK);
          rows.clear();
          p.render();
          const f = find(key);
          if (f) {
            void p.flash(f.k, "hit", 900);
            p.log(`cout << mpp[${key}];`, `"${f.val}"`, "ok");
          } else {
            const k = add(key, "");
            void p.flash(k, "bad", 1200);
            p.log(`cout << mpp[${key}];`, `key ${key} was missing, so [] CREATED ${key} → "" and size grew to ${R.items.length}`, "err");
          }
        }}
      >
        cout &lt;&lt; mpp[key]
      </Op>
      <Op
        p={p}
        on={() => {
          const key = num(inK);
          const i = R.items.findIndex((x) => x.key === key);
          if (i < 0) {
            rows.setMarks({ [R.items.length]: "it == end()" });
            p.render();
            p.log(`mpp.find(${key});`, "not found: returns end(), map unchanged", "err");
          } else {
            rows.setMarks({ [i]: "it" });
            void p.flash(R.items[i].k, "good", 800);
            p.log(`mpp.find(${key});`, `it->first = ${key}, it->second = "${R.items[i].val}"`, "ok");
          }
        }}
      >
        find(key)
      </Op>
      <Op
        p={p}
        on={() => {
          const key = num(inK);
          const c = find(key) ? 1 : 0;
          p.log(`mpp.count(${key});`, `${c}. Safe check: never inserts`, c ? "ok" : "");
        }}
      >
        count(key)
      </Op>
      <Op
        p={p}
        on={async () => {
          const key = num(inK);
          rows.clear();
          const f = find(key);
          if (!f) {
            p.render();
            p.log(`mpp.erase(${key});`, "returns 0");
            return;
          }
          await leave([p.byK(f.k)]);
          re(() => (R.items = R.items.filter((x) => x !== f)));
          p.log(`mpp.erase(${key});`, "returns 1", "ok");
        }}
      >
        erase(key)
      </Op>
      <Op p={p} on={() => re(rows.reset)}>
        reset
      </Op>
    </>
  );

  return (
    <Panel api={p} label="map visualizer" controls={controls} stats={[["size", R.items.length]]}>
      <RowsView p={p} rows={rows} />
    </Panel>
  );
}
