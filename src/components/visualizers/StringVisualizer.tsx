import { useRef } from "react";
import { flip, leave, sleep } from "../../lib/motion";
import { Cell, type Item, Op, Panel, VIn, cx, num, useModel, usePanel } from "./kit";

export default function StringVisualizer() {
  const p = usePanel("string");
  const chars = (s: string): Item<string>[] => s.split("").map((ch) => ({ k: p.uid(), v: ch }));
  const m = useModel(() => ({ chars: chars("hello"), cls: {} as Record<number, string> }));
  const track = useRef<HTMLDivElement>(null);
  const inP = useRef<HTMLInputElement>(null);
  const inL = useRef<HTMLInputElement>(null);
  const inT = useRef<HTMLInputElement>(null);

  const S = () => m.chars.map((c) => c.v).join("");
  const draw = (cls: Record<number, string> = {}) => {
    m.cls = cls;
    p.render();
  };
  const re = (mutate: () => void) =>
    flip(track.current, () => {
      mutate();
      draw();
    });
  const room = (n: number) => {
    if (m.chars.length + n > 24) {
      p.log("// demo limit", "keeping the string under 24 characters. Press reset", "info");
      return false;
    }
    return true;
  };

  const controls = (
    <>
      <VIn label="pos" inputRef={inP} defaultValue={0} />
      <VIn label="len" inputRef={inL} defaultValue={5} />
      <VIn label="text" inputRef={inT} defaultValue="lo" type="text" />
      <Op
        p={p}
        cls="primary"
        on={() => {
          if (!room(1)) return;
          re(() => m.chars.push({ k: p.uid(), v: "!" }));
          p.log("s.push_back('!');", `"${S()}"`, "ok");
        }}
      >
        push_back('!')
      </Op>
      <Op
        p={p}
        on={() => {
          if (!room(6)) return;
          re(() => m.chars.push(...chars(" world")));
          p.log('s += " world";', `"${S()}"`, "ok");
        }}
      >
        s += " world"
      </Op>
      <Op
        p={p}
        on={() => {
          const pos = num(inP);
          const len = num(inL);
          const n = m.chars.length;
          if (pos < 0 || pos > n) {
            p.log(`s.substr(${pos}, ${len});`, `throws std::out_of_range (size is ${n})`, "err");
            return;
          }
          const end = Math.min(n, pos + Math.max(0, len));
          const cls: Record<number, string> = {};
          for (let i = pos; i < end; i++) cls[i] = "inrange";
          draw(cls);
          p.log(`s.substr(${pos}, ${len});`, `"${S().slice(pos, end)}"${pos + len > n ? " (length clipped at the end)" : ""}`, "ok");
        }}
      >
        substr(pos, len)
      </Op>
      <Op
        p={p}
        on={async () => {
          const t = inT.current?.value ?? "";
          const at = S().indexOf(t);
          for (let i = 0; i <= m.chars.length - Math.max(1, t.length); i++) {
            const cls: Record<number, string> = {};
            for (let j = 0; j < t.length; j++) cls[i + j] = "cmp";
            draw(cls);
            await sleep(120);
            if (i === at) break;
          }
          if (at < 0 || !t) {
            draw();
            p.log(`s.find("${t}");`, "string::npos (18446744073709551615): not found", "err");
            return;
          }
          const cls: Record<number, string> = {};
          for (let j = 0; j < t.length; j++) cls[at + j] = "good";
          draw(cls);
          p.log(`s.find("${t}");`, `${at}, index of the first match`, "ok");
        }}
      >
        find(text)
      </Op>
      <Op
        p={p}
        on={async () => {
          const pos = num(inP);
          const len = num(inL);
          if (pos < 0 || pos > m.chars.length) {
            p.log(`s.erase(${pos}, ${len});`, "throws std::out_of_range", "err");
            return;
          }
          const gone = m.chars.slice(pos, pos + Math.max(0, len));
          await leave(gone.map((g) => p.byK(g.k)));
          re(() => m.chars.splice(pos, gone.length));
          p.log(`s.erase(${pos}, ${len});`, `"${S()}"`, "ok");
        }}
      >
        erase(pos, len)
      </Op>
      <Op
        p={p}
        on={() => {
          const pos = num(inP);
          const t = inT.current?.value ?? "";
          if (pos < 0 || pos > m.chars.length) {
            p.log(`s.insert(${pos}, "${t}");`, "throws std::out_of_range", "err");
            return;
          }
          if (!room(t.length)) return;
          re(() => m.chars.splice(pos, 0, ...chars(t)));
          p.log(`s.insert(${pos}, "${t}");`, `"${S()}"`, "ok");
        }}
      >
        insert(pos, text)
      </Op>
      <Op
        p={p}
        on={() => {
          re(() => m.chars.reverse());
          p.log("reverse(s.begin(), s.end());", `"${S()}"`, "ok");
        }}
      >
        reverse
      </Op>
      <Op
        p={p}
        on={() => {
          re(() => m.chars.sort((a, b) => (a.v < b.v ? -1 : a.v > b.v ? 1 : 0)));
          p.log("sort(s.begin(), s.end());", `"${S()}" (by character code: space < ! < letters)`, "ok");
        }}
      >
        sort
      </Op>
      <Op p={p} on={() => re(() => (m.chars = chars("hello")))}>
        reset "hello"
      </Op>
    </>
  );

  return (
    <Panel
      api={p}
      label="string visualizer"
      controls={controls}
      stats={[
        ["s", `"${S()}"`],
        ["size", m.chars.length],
      ]}
    >
      <div className="track" style={{ gap: "40px 6px" }} ref={track}>
        {m.chars.map((c, i) => (
          <Cell key={c.k} k={c.k} v={c.v === " " ? "␣" : c.v} idx={i} cls={cx("str", m.cls[i], p.fx(c.k))} />
        ))}
      </div>
    </Panel>
  );
}
