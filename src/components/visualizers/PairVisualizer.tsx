import { Cell, Op, Panel, type PanelApi, usePanel } from "./kit";

function Slot({ p, k, v, name }: { p: PanelApi; k: string; v: string | number; name: string }) {
  return (
    <div className="pslot">
      <Cell k={k} v={v} cls={p.fx(k)} />
      <small>{name}</small>
    </div>
  );
}

export default function PairVisualizer() {
  const p = usePanel("pair");
  const hit = async (keys: string[], stmt: string, val: string | number) => {
    p.log(stmt, "value: " + val, "ok");
    await Promise.all(keys.map((k) => p.flash(k, "hit", 900)));
  };

  const controls = (
    <>
      <Op p={p} on={() => hit(["p1f"], "pr1.first", 2)}>pr1.first</Op>
      <Op p={p} on={() => hit(["p3s"], "pr3.second", 7)}>pr3.second</Op>
      <Op p={p} on={() => hit(["p4ff", "p4fs"], "pr4.first", "{3, 'a'} (the whole inner pair)")}>pr4.first</Op>
      <Op p={p} on={() => hit(["p4ff"], "pr4.first.first", 3)}>pr4.first.first</Op>
      <Op p={p} on={() => hit(["p4fs"], "pr4.first.second", "'a'")}>pr4.first.second</Op>
      <Op p={p} on={() => hit(["p4s"], "pr4.second", 9)}>pr4.second</Op>
      <Op p={p} on={() => hit(["p1f", "p1s"], "auto [a, b] = pr1;", "a = 2, b = 8")}>auto [a, b] = pr1</Op>
      <Op
        p={p}
        on={async () => {
          await Promise.all(["p1f", "p2f"].map((k) => p.flash(k, "hit", 900)));
          p.log("pr1 < pr2", "2 < 4 on .first, so true. .second only matters on a tie", "ok");
        }}
      >
        pr1 &lt; pr2 ?
      </Op>
    </>
  );

  return (
    <Panel api={p} label="pair visualizer" controls={controls}>
      <div className="pairs">
        <div className="pbox" data-box="pr1">
          <span className="lbl">pr1 : pair&lt;int,int&gt;</span>
          <div className="prow">
            <Slot p={p} k="p1f" v={2} name=".first" />
            <Slot p={p} k="p1s" v={8} name=".second" />
          </div>
        </div>
        <div className="pbox" data-box="pr2">
          <span className="lbl">pr2 = make_pair(4, 2)</span>
          <div className="prow">
            <Slot p={p} k="p2f" v={4} name=".first" />
            <Slot p={p} k="p2s" v={2} name=".second" />
          </div>
        </div>
        <div className="pbox" data-box="pr3">
          <span className="lbl">pr3 : pair&lt;char,int&gt;</span>
          <div className="prow">
            <Slot p={p} k="p3f" v="'y'" name=".first" />
            <Slot p={p} k="p3s" v={7} name=".second" />
          </div>
        </div>
        <div className="pbox" data-box="pr4">
          <span className="lbl">pr4 : pair&lt;pair&lt;int,char&gt;,int&gt;</span>
          <div className="prow">
            <div className="pslot">
              <div className="pbox inner" data-box="pr4f">
                <span className="lbl">.first (a pair)</span>
                <div className="prow">
                  <Slot p={p} k="p4ff" v={3} name=".first" />
                  <Slot p={p} k="p4fs" v="'a'" name=".second" />
                </div>
              </div>
            </div>
            <Slot p={p} k="p4s" v={9} name=".second" />
          </div>
        </div>
      </div>
    </Panel>
  );
}
