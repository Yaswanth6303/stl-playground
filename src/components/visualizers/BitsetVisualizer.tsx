import { useRef, type KeyboardEvent } from "react";
import { markVisited } from "../../lib/visited";
import { Cell, Op, Panel, Sep, VIn, cx, num, useModel, usePanel } from "./kit";

const bin = (x: number) => x.toString(2).padStart(8, "0");
const BITS = [7, 6, 5, 4, 3, 2, 1, 0];

export default function BitsetVisualizer() {
  const p = usePanel("bitset");
  const m = useModel(() => ({ v: 13, changed: [] as number[] }));
  const inI = useRef<HTMLInputElement>(null);

  const setV = (nv: number, stmt: string, note?: string) => {
    const diff: number[] = [];
    for (let i = 0; i < 8; i++) if (((m.v ^ nv) >> i) & 1) diff.push(i);
    m.v = nv & 255;
    m.changed = diff;
    p.render();
    p.log(stmt, note || bin(m.v), "ok");
  };
  const toggle = (i: number) => {
    markVisited("bitset");
    const nv = m.v ^ (1 << i);
    setV(nv, `b.flip(${i});`, `${bin(nv)} = ${nv}`);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>, i: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(i);
    }
  };
  const idx = () => {
    const i = num(inI);
    if (i < 0 || i > 7) {
      p.log(`b.set(${i});`, "throws std::out_of_range: valid bits are 0 to 7", "err");
      return null;
    }
    return i;
  };

  const controls = (
    <>
      <VIn label="i" inputRef={inI} defaultValue={7} />
      <Op
        p={p}
        cls="primary"
        on={() => {
          const i = idx();
          if (i != null) setV(m.v | (1 << i), `b.set(${i});`);
        }}
      >
        set(i)
      </Op>
      <Op
        p={p}
        on={() => {
          const i = idx();
          if (i != null) setV(m.v & ~(1 << i), `b.reset(${i});`);
        }}
      >
        reset(i)
      </Op>
      <Op
        p={p}
        on={() => {
          const i = idx();
          if (i != null) setV(m.v ^ (1 << i), `b.flip(${i});`);
        }}
      >
        flip(i)
      </Op>
      <Op
        p={p}
        on={async () => {
          const i = idx();
          if (i == null) return;
          await p.flash("b" + i, "hit", 800);
          p.log(`b.test(${i});`, `${(m.v >> i) & 1}`, "ok");
        }}
      >
        test(i)
      </Op>
      <Sep />
      <Op p={p} on={() => setV(~m.v & 255, "b.flip();", "every bit toggled")}>
        flip()
      </Op>
      <Op
        p={p}
        on={() => {
          const top = (m.v >> 7) & 1;
          const nv = (m.v << 1) & 255;
          setV(nv, "b <<= 1;", `${bin(nv)}${top ? " (bit 7 fell off)" : ""}`);
        }}
      >
        b &lt;&lt; 1
      </Op>
      <Op
        p={p}
        on={() => {
          const low = m.v & 1;
          const nv = m.v >> 1;
          setV(nv, "b >>= 1;", `${bin(nv)}${low ? " (bit 0 fell off)" : ""}`);
        }}
      >
        b &gt;&gt; 1
      </Op>
      <Op p={p} on={() => setV(m.v & 0xf0, 'b &= bitset<8>("11110000");', "keeps only the upper 4 bits")}>
        b &amp; 11110000
      </Op>
      <Op p={p} on={() => setV(13, "bitset<8> b(13);", "00001101")}>
        b = 13
      </Op>
    </>
  );

  return (
    <Panel api={p} label="bitset visualizer" controls={controls}>
      <div className="bits">
        {BITS.map((i) => {
          const on = (m.v >> i) & 1;
          return (
            <Cell
              key={i}
              k={"b" + i}
              v={on}
              idx={"bit " + i}
              cls={cx(on ? "on" : "",m.changed.includes(i) && "hit", p.fx("b" + i))}
              tabIndex={0}
              role="button"
              aria-label={`flip bit ${i}`}
              onClick={() => toggle(i)}
              onKeyDown={(e) => onKey(e, i)}
            />
          );
        })}
      </div>
      <div className="bitval">
        <span>
          b = <b>{bin(m.v)}</b>
        </span>
        <span>
          to_ulong() = <b>{m.v}</b>
        </span>
        <span>
          count() = <b>{bin(m.v).split("1").length - 1}</b>
        </span>
      </div>
    </Panel>
  );
}
