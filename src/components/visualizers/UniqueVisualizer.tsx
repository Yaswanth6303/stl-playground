import { useRef } from "react";
import { flip, leave, sleep } from "../../lib/motion";
import { Cell, type Item, Op, Panel, Sep, cx, tagMap, useModel, usePanel } from "./kit";

export default function UniqueVisualizer() {
  const p = usePanel("unique");
  const make = (a: number[]) => a.map((v) => ({ k: p.uid(), v }));
  const m = useModel(() => ({
    items: make([3, 1, 3, 2, 1, 3]) as Item[],
    newEnd: null as number | null,
    cls: {} as Record<number, string>,
    tags: {} as Record<number, string>,
  }));
  const track = useRef<HTMLDivElement>(null);

  const draw = (cls: Record<number, string> = {}, tags: Record<number, string> = {}) => {
    m.cls = cls;
    m.tags = tags;
    p.render();
  };
  const setV = (a: number[]) => {
    m.items = make(a);
    m.newEnd = null;
    draw();
  };

  const controls = (
    <>
      <Op
        p={p}
        cls="primary"
        on={() => {
          m.newEnd = null;
          flip(track.current, () => {
            m.items.sort((a, b) => a.v - b.v);
            draw();
          });
          p.log("sort(v.begin(), v.end());", m.items.map((i) => i.v).join(" "), "ok");
        }}
      >
        sort(v)
      </Op>
      <Op
        p={p}
        on={async () => {
          if (m.newEnd != null) {
            p.log("// already ran unique", "erase the tail or reset first", "info");
            return;
          }
          const { items } = m;
          let w = 0;
          for (let r = 1; r < items.length; r++) {
            draw(
              { [w]: "hit", [r]: "cmp" },
              tagMap([
                [w, "write"],
                [r, "read"],
              ]),
            );
            await sleep(460);
            if (items[r].v !== items[w].v) {
              w++;
              items[w].v = items[r].v;
              draw(
                { [w]: "good" },
                tagMap([
                  [w, "write"],
                  [r, "read"],
                ]),
              );
              p.log(`// v[${r}] = ${items[r].v} differs from the last kept value`, `copy it to index ${w}`, "info");
              await sleep(420);
            } else p.log(`// v[${r}] = ${items[r].v} repeats v[${w}]`, "skip");
          }
          m.newEnd = w + 1;
          draw({}, { [m.newEnd]: "newEnd" });
          p.log(
            "auto newEnd = unique(v.begin(), v.end());",
            `${m.newEnd} unique values. size() is still ${items.length}: the dim tail is leftover`,
            "ok",
          );
        }}
      >
        unique(begin, end)
      </Op>
      <Op
        p={p}
        on={async () => {
          const ne = m.newEnd;
          if (ne == null) {
            p.log("v.erase(newEnd, v.end());", "run unique first", "info");
            return;
          }
          await leave(m.items.slice(ne).map((i) => p.byK(i.k)));
          flip(track.current, () => {
            m.items = m.items.slice(0, ne);
            m.newEnd = null;
            draw();
          });
          p.log("v.erase(newEnd, v.end());", `${m.items.map((i) => i.v).join(" ")}, size ${m.items.length}`, "ok");
        }}
      >
        erase(newEnd, end)
      </Op>
      <Sep />
      <Op p={p} on={() => setV([3, 1, 3, 2, 1, 3])}>
        v = {"{"}3,1,3,2,1,3{"}"}
      </Op>
      <Op
        p={p}
        on={() => {
          setV([1, 2, 1, 1]);
          p.log("vector<int> w = {1, 2, 1, 1};", "run unique without sorting: the two 1s at the front are not neighbours", "info");
        }}
      >
        v = {"{"}1,2,1,1{"}"} (unsorted)
      </Op>
    </>
  );

  const { items, newEnd } = m;
  return (
    <Panel api={p} label="unique visualizer" controls={controls} stats={[["size", items.length]]}>
      <div className="track" ref={track}>
        {items.map((it, i) => (
          <Cell
            key={it.k}
            k={it.k}
            v={it.v}
            idx={i}
            cls={cx(newEnd != null && i >= newEnd && "dim", m.cls[i], p.fx(it.k))}
            tag={m.tags[i] || ""}
          />
        ))}
        <Cell k="unend" v="end" cls="ghost" tag={m.tags[items.length] || ""} />
      </div>
    </Panel>
  );
}
