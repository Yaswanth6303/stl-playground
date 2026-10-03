import { useRef } from "react";
import { flip, sleep } from "../../lib/motion";
import { Cell, type Item, Op, Panel, VIn, cx, num, useModel, usePanel } from "./kit";

const fresh = (): Item[] => [1, 2, 3, 4, 5, 6].map((v) => ({ k: "ro" + v, v }));

export default function RotateVisualizer() {
  const p = usePanel("rotate");
  const m = useModel(() => ({
    items: fresh(),
    tags: {} as Record<number, string>,
    cls: {} as Record<number, string>,
  }));
  const track = useRef<HTMLDivElement>(null);
  const inK = useRef<HTMLInputElement>(null);

  const re = (mutate: () => void) =>
    flip(track.current, () => {
      mutate();
      m.tags = {};
      m.cls = {};
      p.render();
    });
  const go = async (right: boolean) => {
    const k = num(inK);
    const n = m.items.length;
    if (k < 0 || k > n) {
      p.log(`v.begin() + ${k}`, `past the end of a ${n}-element vector: undefined behavior. Use k % v.size() = ${((k % n) + n) % n}`, "err");
      return;
    }
    const mid = right ? n - k : k;
    const cls: Record<number, string> = {};
    for (let i = 0; i < mid; i++) cls[i] = "inrange";
    m.tags = { [mid % n]: right ? "new first" : "middle" };
    m.cls = cls;
    p.render();
    await sleep(700);
    re(() => (m.items = [...m.items.slice(mid), ...m.items.slice(0, mid)]));
    p.log(
      right ? `rotate(v.rbegin(), v.rbegin() + ${k}, v.rend());` : `rotate(v.begin(), v.begin() + ${k}, v.end());`,
      m.items.map((i) => i.v).join(" "),
      "ok",
    );
  };

  const controls = (
    <>
      <VIn label="k" inputRef={inK} defaultValue={2} />
      <Op p={p} cls="primary" on={() => go(false)}>
        rotate left by k
      </Op>
      <Op p={p} on={() => go(true)}>
        rotate right by k
      </Op>
      <Op p={p} on={() => re(() => (m.items = fresh()))}>
        reset
      </Op>
    </>
  );

  return (
    <Panel api={p} label="rotate visualizer" controls={controls}>
      <div className="track" ref={track}>
        {m.items.map((it, i) => (
          <Cell key={it.k} k={it.k} v={it.v} idx={i} tag={m.tags[i] || ""} cls={cx(m.cls[i], p.fx(it.k))} />
        ))}
      </div>
    </Panel>
  );
}
