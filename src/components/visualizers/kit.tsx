/**
 * Shared building blocks for the STL visualizers: the panel chrome (controls, stats,
 * stage, log), the element cell, and a small imperative API (log, flash, render) that
 * mirrors the original page's `Panel` class so each visualizer's step logic ports 1:1.
 */
import {
  useEffect,
  useId,
  useReducer,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";
import { rnd, sleep } from "../../lib/motion";
import { markVisited } from "../../lib/visited";

export type LogKind = "" | "ok" | "err" | "info";

interface LogLine {
  id: number;
  stmt: string;
  note: string;
  kind: LogKind;
}

export type Stats = readonly (readonly [string, string | number])[];

export interface PanelApi {
  readonly topic: string;
  /** The `.viz-stage` element; FLIP and lookups are scoped to it. */
  readonly stage: RefObject<HTMLDivElement | null>;
  readonly logs: LogLine[];
  /** True while an operation is animating; further clicks are ignored. */
  busy: boolean;
  /** Re-render synchronously so the DOM is current when this returns (needed for FLIP). */
  render(): void;
  /** Prepend a line to the operation log (keeps the newest 40). */
  log(stmt: string, note?: string, kind?: LogKind): void;
  /** Wrap a control's handler: ignore while busy, mark the topic tried, swallow errors. */
  act(fn: (btn: HTMLButtonElement) => unknown): (e: { currentTarget: HTMLButtonElement }) => void;
  /** Element with the given data-k inside the stage. */
  byK(k: string): HTMLElement | null;
  /** Add a transient class to a keyed cell for `ms`, then remove it. */
  flash(k: string | null | undefined, cls?: string, ms?: number): Promise<void>;
  /** Transient classes currently applied to key `k`. */
  fx(k: string): string;
  /** Unique key generator, deterministic per panel so SSR and hydration agree. */
  uid(): string;
}

/** Create the panel API once per visualizer instance. */
export function usePanel(topic: string): PanelApi {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const ref = useRef<PanelApi | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  if (!ref.current) {
    let n = 0;
    let logId = 0;
    const fxMap = new Map<string, string[]>();
    const api: PanelApi = {
      topic,
      stage,
      logs: [],
      busy: false,
      render: () => flushSync(() => force()),
      log(stmt, note = "", kind = "") {
        api.logs.unshift({ id: ++logId, stmt, note, kind });
        if (api.logs.length > 40) api.logs.length = 40;
        api.render();
      },
      act: (fn) => async (e) => {
        if (api.busy) return;
        const btn = e.currentTarget;
        api.busy = true;
        markVisited(topic);
        try {
          await fn(btn);
        } catch (err) {
          console.error(err);
        } finally {
          api.busy = false;
        }
      },
      byK: (k) => stage.current?.querySelector<HTMLElement>(`[data-k="${CSS.escape(k)}"]`) ?? null,
      async flash(k, cls = "hit", ms = 650) {
        if (k == null) return;
        fxMap.set(k, [...(fxMap.get(k) ?? []), cls]);
        api.render();
        await sleep(ms);
        const left = fxMap.get(k) ?? [];
        const at = left.indexOf(cls);
        if (at >= 0) left.splice(at, 1);
        if (!left.length) fxMap.delete(k);
        api.render();
      },
      fx: (k) => (fxMap.get(k) ?? []).join(" "),
      uid: () => `${topic}-${++n}`,
    };
    ref.current = api;
  }
  return ref.current;
}

/** Mutable model that lives as long as the component, like the original closure variables. */
export function useModel<T>(init: () => T): T {
  const ref = useRef<T | null>(null);
  if (ref.current === null) ref.current = init();
  return ref.current;
}

/** parseInt with a fallback, as in the original `num()`. */
export function num(inp: RefObject<HTMLInputElement | null>, d = 0): number {
  const v = parseInt(inp.current?.value ?? "", 10);
  return Number.isFinite(v) ? v : d;
}

/* ------------------------------------------------------------------ panel chrome */

interface PanelProps {
  api: PanelApi;
  /** Accessible name, e.g. "std::vector visualizer". */
  label: string;
  controls: ReactNode;
  stats?: Stats;
  children: ReactNode;
}

export function Panel({ api, label, controls, stats, children }: PanelProps) {
  return (
    <div className="viz" data-viz={api.topic} role="group" aria-label={label}>
      <div className="viz-bar">
        <div className="viz-controls">{controls}</div>
        <div className="viz-stats">
          {stats?.map(([k, v]) => (
            <span key={k}>
              {k} <b>{v}</b>
            </span>
          ))}
        </div>
      </div>
      <div className="viz-stage" ref={api.stage}>
        {children}
      </div>
      <div className="log" aria-live="polite">
        {api.logs.length ? (
          api.logs.map((l) => (
            <div key={l.id} className={"ln " + l.kind}>
              <code>{l.stmt}</code>
              {l.note ? <span>// {l.note}</span> : null}
            </div>
          ))
        ) : (
          <div className="empty">// click an operation above to run it</div>
        )}
      </div>
    </div>
  );
}

interface OpProps {
  p: PanelApi;
  on: (btn: HTMLButtonElement) => unknown;
  /** Extra classes: "primary", "warn", "on". */
  cls?: string;
  children: ReactNode;
}

/** An operation button. */
export function Op({ p, on, cls = "", children }: OpProps) {
  return (
    <button type="button" className={"op " + cls} onClick={p.act(on)}>
      {children}
    </button>
  );
}

interface VInProps {
  label?: string;
  inputRef: RefObject<HTMLInputElement | null>;
  defaultValue: string | number;
  /** Re-roll the value to a random integer in [a, b] after hydration, like the original. */
  random?: readonly [number, number];
  type?: "number" | "text";
  wide?: boolean;
}

/** A small labelled value input. */
export function VIn({ label, inputRef, defaultValue, random, type = "number", wide = false }: VInProps) {
  const id = useId();
  useEffect(() => {
    if (random && inputRef.current) inputRef.current.value = String(rnd(random[0], random[1]));
    // run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      {label ? (
        <label className="vlabel" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <input
        ref={inputRef}
        id={id}
        type={type}
        defaultValue={defaultValue}
        className={"vin" + (wide ? " wide" : "")}
        aria-label={label ? undefined : "value"}
      />
    </>
  );
}

export const Sep = () => <span className="sep" />;
export const Label = ({ children }: { children: ReactNode }) => <span className="vlabel">{children}</span>;

/* ------------------------------------------------------------------ cells */

export interface CellProps extends Omit<HTMLAttributes<HTMLDivElement>, "style"> {
  k: string;
  v?: ReactNode;
  idx?: ReactNode;
  tag?: string;
  cls?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/** One element box. `children` replaces the default `<span>{v}</span>` content. */
export function Cell({ k, v, idx, tag, cls = "", style, children, ...rest }: CellProps) {
  return (
    <div className={"cell " + cls} data-k={k} style={style} {...rest}>
      {idx != null ? <span className="idx">{idx}</span> : null}
      {children ?? <span>{v}</span>}
      {tag ? <span className="tag">{tag}</span> : null}
    </div>
  );
}

/** Join class names, skipping empty ones. */
export const cx = (...parts: (string | false | null | undefined)[]): string => parts.filter(Boolean).join(" ");

/** Merge [index, label] pairs into tags, joining collisions with " / " (original tagMap). */
export function tagMap(entries: [number | null | undefined, string][]): Record<number, string> {
  const m: Record<number, string> = {};
  entries.forEach(([i, l]) => {
    if (i == null) return;
    m[i] = m[i] ? m[i] + " / " + l : l;
  });
  return m;
}

/** Key + value item used by most visualizers. */
export interface Item<V = number> {
  k: string;
  v: V;
}
