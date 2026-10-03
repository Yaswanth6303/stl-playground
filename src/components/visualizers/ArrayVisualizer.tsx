import { useRef } from "react";
import { flip, shake, sleep } from "../../lib/motion";
import { Cell, type Item, Op, Panel, VIn, cx, num, useModel, usePanel } from "./kit";

const BASE = [4, 8, 15, 16, 23];
const fresh = (): Item[] => BASE.map((v, i) => ({ k: "ar" + i, v }));

export default function ArrayVisualizer() {
  const p = usePanel("array");
  const m = useModel(() => ({ items: fresh(), cls: {} as Record<number, string> }));
  const track = useRef<HTMLDivElement>(null);
  const inI = useRef<HTMLInputElement>(null);
  const inX = useRef<HTMLInputElement>(null);

  const draw = (cls: Record<number, string> = {}) => {
    m.cls = cls;
    p.render();
  };

  const controls = (
    <>
      <VIn label="i" inputRef={inI} defaultValue={2} />
      <VIn label="x" inputRef={inX} defaultValue={42} />
      <Op
        p={p}
        cls="primary"
        on={() => {
          const i = num(inI);
          const x = num(inX);
          if (i < 0 || i > 4) {
            p.log(`arr[${i}] = ${x};`, "out of range: no check, writes over other memory. Undefined behavior", "err");
            return;
          }
          m.items[i] = { k: m.items[i].k, v: x };
          draw({ [i]: "good" });
          p.log(`arr[${i}] = ${x};`, "O(1)", "ok");
        }}
      >
        arr[i] = x
      </Op>
      <Op
        p={p}
        on={async () => {
          const i = num(inI);
          if (i < 0 || i > 4) {
            shake(track.current);
            p.log(`arr.at(${i});`, "throws std::out_of_range", "err");
            return;
          }
          await p.flash(m.items[i].k);
          p.log(`arr.at(${i});`, String(m.items[i].v), "ok");
        }}
      >
        at(i)
      </Op>
      <Op
        p={p}
        on={async () => {
          const x = num(inX);
          for (let i = 0; i < 5; i++) {
            m.items[i] = { k: m.items[i].k, v: x };
            draw({ [i]: "good" });
            await sleep(150);
          }
          draw();
          p.log(`arr.fill(${x});`, "every slot set", "ok");
        }}
      >
        fill(x)
      </Op>
      <Op
        p={p}
        on={() => {
          flip(track.current, () => {
            m.items.sort((a, b) => a.v - b.v);
            draw();
          });
          p.log("sort(arr.begin(), arr.end());", m.items.map((x) => x.v).join(" "), "ok");
        }}
      >
        sort
      </Op>
      <Op
        p={p}
        cls="warn"
        on={() => {
          shake(track.current);
          p.log("arr.push_back(x);", "does not compile: std::array has no push_back. Use vector if the size changes", "err");
        }}
      >
        push_back(x)
      </Op>
      <Op
        p={p}
        on={() =>
          flip(track.current, () => {
            m.items = fresh();
            draw();
          })
        }
      >
        reset
      </Op>
    </>
  );

  return (
    <Panel
      api={p}
      label="array visualizer"
      controls={controls}
      stats={[
        ["size", "5 (fixed)"],
        ["sizeof", "20 bytes"],
      ]}
    >
      <div className="track" ref={track}>
        {m.items.map((it, i) => (
          <Cell key={it.k} k={it.k} v={it.v} idx={i} cls={cx(m.cls[i], p.fx(it.k))} tag={i === 0 ? "begin()" : ""} />
        ))}
        <Cell k="arend" v="" cls="past" tag="end()" />
      </div>
    </Panel>
  );
}
