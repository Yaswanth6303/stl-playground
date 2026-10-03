import { useRef } from "react";
import { flip } from "../../lib/motion";
import { Cell, Op, Panel, cx, useModel, usePanel } from "./kit";

interface Rec {
  k: string;
  /** marks */
  m: number;
  /** name */
  n: string;
  /** input position */
  o: number;
}

const BASE: [number, string][] = [
  [90, "Asha"],
  [75, "Bala"],
  [90, "Chetan"],
  [75, "Divya"],
];
const fresh = (): Rec[] => BASE.map(([m, n], i) => ({ k: "st" + i, m, n, o: i }));

export default function StableSortVisualizer() {
  const p = usePanel("stable");
  const s = useModel(() => ({ items: fresh(), ties: false }));
  const track = useRef<HTMLDivElement>(null);

  const re = (mutate: () => void, ties: boolean) =>
    flip(track.current, () => {
      mutate();
      s.ties = ties;
      p.render();
    });

  const controls = (
    <>
      <Op
        p={p}
        cls="primary"
        on={() => {
          re(() => {
            s.items = s.items
              .map((x, i) => [x, i] as const)
              .sort((a, b) => b[0].m - a[0].m || a[1] - b[1])
              .map((x) => x[0]);
          }, true);
          p.log("stable_sort(..., a.first > b.first)", s.items.map((i) => i.n).join(", ") + ". Ties kept their input order", "ok");
        }}
      >
        stable_sort by marks (desc)
      </Op>
      <Op
        p={p}
        on={() => {
          re(() => {
            s.items = s.items
              .map((x, i) => [x, i] as const)
              .sort((a, b) => b[0].m - a[0].m || b[1] - a[1])
              .map((x) => x[0]);
          }, true);
          p.log(
            "sort(..., a.first > b.first)",
            s.items.map((i) => i.n).join(", ") + ". Allowed: std::sort gives no promise about tie order",
            "err",
          );
        }}
      >
        sort by marks (may swap ties)
      </Op>
      <Op p={p} on={() => re(() => (s.items = fresh()), false)}>
        reset (alphabetical)
      </Op>
    </>
  );

  return (
    <Panel api={p} label="stable_sort visualizer" controls={controls}>
      <div className="track" ref={track}>
        {s.items.map((it) => (
          <Cell
            key={it.k}
            k={it.k}
            idx={`input #${it.o}`}
            cls={cx("rec", s.ties && it.m === 90 && "inrange", p.fx(it.k))}
          >
            <span>
              <b>{it.m}</b>
              {it.n}
            </span>
          </Cell>
        ))}
      </div>
    </Panel>
  );
}
