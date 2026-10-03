/** Shared model and view for unordered_set / unordered_map: a chained hash table with a modulo hash. */
import { useRef } from "react";
import { sleep } from "../../lib/motion";
import { Cell, type PanelApi, type Stats, cx, useModel } from "./kit";

export interface Entry {
  k: string;
  key: number;
  val?: string;
}

interface Options {
  nb: number;
  initial: (number | [number, string])[];
  kv: boolean;
}

export function useBuckets(p: PanelApi, { nb, initial, kv }: Options) {
  const fresh = (): Entry[] =>
    initial.map((x) => (Array.isArray(x) ? { k: p.uid(), key: x[0], val: x[1] } : { k: p.uid(), key: x }));
  const H = useModel(() => ({ items: fresh(), scanB: null as number | null, cmpK: null as string | null }));
  const box = useRef<HTMLDivElement>(null);
  const hash = (key: number) => ((key % nb) + nb) % nb;

  /** Hash the key, then walk only that bucket's chain. */
  const scan = async (key: number) => {
    const b = hash(key);
    H.scanB = b;
    p.render();
    p.log(`// hash(${key})`, `${key} % ${nb} = ${b}: look in bucket ${b} only`, "info");
    await sleep(380);
    const chain = H.items.filter((i) => hash(i.key) === b);
    let found: Entry | null = null;
    let checked = 0;
    for (const i of chain) {
      checked++;
      H.cmpK = i.k;
      p.render();
      await sleep(260);
      H.cmpK = null;
      p.render();
      if (i.key === key) {
        found = i;
        break;
      }
    }
    H.scanB = null;
    p.render();
    return { b, found, checked };
  };

  const stats: Stats = [
    ["size", H.items.length],
    ["buckets", nb],
    ["load factor", (H.items.length / nb).toFixed(2)],
  ];
  return { H, box, nb, kv, hash, scan, stats, reset: () => (H.items = fresh()) };
}

export function BucketsView({ p, h }: { p: PanelApi; h: ReturnType<typeof useBuckets> }) {
  const { H, nb, kv, hash, box } = h;
  return (
    <div className="buckets" ref={box}>
      {Array.from({ length: nb }, (_, b) => {
        const chain = H.items.filter((i) => hash(i.key) === b);
        return (
          <div key={b} className={cx("bucket", H.scanB === b && "scan")} data-b={b}>
            <span className="bid">bucket {b}</span>
            <div className="chain">
              {chain.length ? (
                chain.map((i) =>
                  kv ? (
                    <Cell key={i.k} k={i.k} cls={cx("kv", H.cmpK === i.k && "cmp", p.fx(i.k))}>
                      <span>
                        <b>{i.key}</b>
                        <i>→</i>
                        {i.val}
                      </span>
                    </Cell>
                  ) : (
                    <Cell key={i.k} k={i.k} v={i.key} cls={cx(H.cmpK === i.k && "cmp", p.fx(i.k))} />
                  ),
                )
              ) : (
                <span className="empty">empty</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
