import { shake, sleep } from "../../lib/motion";
import { Cell, Op, Panel, Sep, cx, useModel, usePanel } from "./kit";

const VALS = [1, 2, 3, 4];

export default function IteratorsVisualizer() {
  const p = usePanel("iterators");
  /** pos: -1 = rend(), 0..3 = elements, 4 = end(). dir: 1 forward, -1 reverse. */
  const m = useModel(() => ({ pos: 0, dir: 1 as 1 | -1, hit: null as number | null }));

  const tagFor = (i: number) => {
    if (m.dir === 1) return i === 0 ? "begin()" : i === 4 ? "end()" : "it";
    return i === 3 ? "rbegin()" : i === -1 ? "rend()" : "rit";
  };
  const setPos = (np: number, stmt: string, note?: string) => {
    m.pos = np;
    p.render();
    p.log(stmt, note);
  };
  const deref = async () => {
    const { pos } = m;
    if (pos < 0 || pos > 3) {
      const gk = pos < 0 ? "rend" : "end";
      const done = p.flash(gk, "bad", 700);
      shake(p.byK(gk));
      p.log("*it", `dereferencing ${pos < 0 ? "rend()" : "end()"}: there is no element here. Undefined behavior`, "err");
      await done;
      return;
    }
    await p.flash("it" + pos);
    p.log(m.dir === 1 ? "*it" : "*rit", `value ${VALS[pos]} (position is index ${pos})`, "ok");
  };
  const walk = async (d: 1 | -1) => {
    m.dir = d;
    const out: number[] = [];
    m.pos = d === 1 ? 0 : 3;
    p.render();
    p.log(d === 1 ? "for (auto i = vec.begin(); i != vec.end(); i++)" : "for (auto i = vec.rbegin(); i != vec.rend(); i++)");
    while (m.pos >= 0 && m.pos <= 3) {
      await sleep(300);
      m.hit = m.pos;
      out.push(VALS[m.pos]);
      p.log("cout << *i", "printed: " + out.join(" "));
      await sleep(300);
      m.pos += d;
      m.hit = null;
      p.render();
    }
    p.log(d === 1 ? "i == vec.end()" : "i == vec.rend()", "condition false, loop stops", "ok");
  };

  const controls = (
    <>
      <Op
        p={p}
        cls="primary"
        on={() => {
          m.dir = 1;
          setPos(0, "auto it = vec.begin();", "points at index 0");
        }}
      >
        it = begin()
      </Op>
      <Op
        p={p}
        on={() => {
          m.dir = 1;
          setPos(4, "auto it = vec.end();", "one past the last element");
        }}
      >
        it = end()
      </Op>
      <Op
        p={p}
        on={() => {
          const np = m.pos + m.dir;
          if ((m.dir === 1 && m.pos >= 4) || (m.dir === -1 && m.pos <= -1)) {
            p.log("it++", "already at the end: moving further is undefined behavior", "err");
            return;
          }
          setPos(np, m.dir === 1 ? "it++" : "rit++", m.dir === -1 ? "a reverse iterator moves LEFT on ++" : "");
        }}
      >
        it++
      </Op>
      <Op p={p} on={deref}>
        *it
      </Op>
      <Sep />
      <Op
        p={p}
        on={() => {
          m.dir = -1;
          setPos(3, "auto rit = vec.rbegin();", "points at the last element");
        }}
      >
        rit = rbegin()
      </Op>
      <Op
        p={p}
        on={() => {
          m.dir = -1;
          setPos(-1, "auto rit = vec.rend();", "before the first element");
        }}
      >
        rit = rend()
      </Op>
      <Sep />
      <Op p={p} on={() => walk(1)}>
        forward loop
      </Op>
      <Op p={p} on={() => walk(-1)}>
        reverse loop
      </Op>
    </>
  );

  return (
    <Panel api={p} label="iterators visualizer" controls={controls}>
      <div className="track">
        <Cell k="rend" v="rend" cls={cx("ghost", p.fx("rend"))} tag={m.pos === -1 ? tagFor(-1) : ""} />
        {VALS.map((v, i) => (
          <Cell
            key={i}
            k={"it" + i}
            v={v}
            idx={i}
            tag={m.pos === i ? tagFor(i) : ""}
            cls={cx(m.hit === i && "hit", p.fx("it" + i))}
          />
        ))}
        <Cell k="end" v="end" cls={cx("ghost", p.fx("end"))} tag={m.pos === 4 ? tagFor(4) : ""} />
      </div>
    </Panel>
  );
}
