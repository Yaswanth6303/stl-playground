/**
 * Live C++ editor: CodeMirror 5 + Compiler Explorer (godbolt.org) execution API.
 * Ported from the original page. CodeMirror touches `navigator` when imported, so it is
 * loaded dynamically after hydration; until then (or if it fails) a plain textarea is used.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Editor, EditorConfiguration, EditorFromTextArea } from "codemirror";
import programs from "../../data/full-programs.json";
import { TOPICS } from "../../lib/topics";
import { TRY_EVENT, markVisited } from "../../lib/visited";
import { esc } from "../../lib/highlight";

const API = "https://godbolt.org/api/compiler/g133/compile";
const OPTS = "-std=c++17 -O2";
const STARTER = `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Read n numbers, then print them sorted with duplicates removed
    int n;
    cin >> n;
    vector<int> v(n);
    for (int &x : v) cin >> x;

    sort(v.begin(), v.end());
    v.erase(unique(v.begin(), v.end()), v.end());

    for (int x : v) cout << x << " ";
    cout << "\\n" << v.size() << " unique values\\n";
    return 0;
}
`;
const STARTER_IN = "8\n5 3 9 3 1 5 9 7";

interface Example {
  label: string;
  code: string;
  stdin: string;
}
const FULL = programs as Record<string, string>;
const EX: Record<string, Example> = {
  starter: { label: "Starter: sort + unique with input", code: STARTER, stdin: STARTER_IN },
};
for (const t of TOPICS) if (FULL[t.id]) EX[t.id] = { label: `${t.group}: ${t.name}`, code: FULL[t.id], stdin: "" };

/** Shape of the parts of a Compiler Explorer compile+execute response we read. */
interface CELine {
  text: string;
}
interface CEResult {
  didExecute?: boolean;
  code?: number;
  timedOut?: boolean;
  execTime?: number | string;
  truncated?: boolean;
  stdout?: CELine[];
  stderr?: CELine[];
  buildResult?: { code?: number; stdout?: CELine[]; stderr?: CELine[] };
}

type StatusCls = "" | "ok" | "bad" | "busy" | "info";
interface Draft {
  key: string;
  code: string;
  stdin: string;
}

const strip = (s: string) => s.replace(/\x1b\[[0-9;]*[mK]/g, "");
/** Compiler colour codes → spans (escaped). */
function ansi(s: string): string {
  let html = "";
  let open = false;
  s.split(/(\x1b\[[0-9;]*m(?:\x1b\[K)?|\x1b\[K)/).forEach((part) => {
    const m = /^\x1b\[([0-9;]*)m/.exec(part);
    if (!m) {
      if (!part.startsWith("\x1b")) html += esc(part);
      return;
    }
    if (open) {
      html += "</span>";
      open = false;
    }
    const c = m[1];
    const cls = /31/.test(c) ? "e" : /35/.test(c) ? "w" : /36/.test(c) ? "nt" : /32/.test(c) ? "g" : c === "01" ? "b" : "";
    if (cls) {
      html += `<span class="${cls}">`;
      open = true;
    }
  });
  return html + (open ? "</span>" : "");
}
const joinText = (arr?: CELine[]) => (arr || []).map((x) => x.text).join("\n");

async function b64state(obj: unknown): Promise<string> {
  const json = JSON.stringify(obj);
  const toB64 = (buf: Uint8Array) => {
    let bin = "";
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return btoa(bin);
  };
  try {
    if (!("CompressionStream" in window)) throw new Error("no CompressionStream");
    const cs = new Blob([new TextEncoder().encode(json)]).stream().pipeThrough(new CompressionStream("deflate"));
    return toB64(new Uint8Array(await new Response(cs).arrayBuffer()));
  } catch {
    return toB64(new TextEncoder().encode(json));
  }
}

const fallbackLink = (href: string, text: string) =>
  `<a class="ed-fallback" href="${esc(href)}" target="_blank" rel="noopener">${text}</a>`;

export default function CodeEditor() {
  const [pick, setPick] = useState("starter");
  const [status, setStatusState] = useState<{ text: string; cls: StatusCls }>({ text: "Press ▶ Run to compile.", cls: "" });
  const [outHtml, setOutHtml] = useState("");
  const [running, setRunning] = useState(false);
  const [ceHref, setCeHref] = useState("https://godbolt.org/");
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [flash, setFlash] = useState(0);

  const boxRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const stdinRef = useRef<HTMLTextAreaElement>(null);
  const cmRef = useRef<EditorFromTextArea | null>(null);
  const marks = useRef<[number, string][]>([]);
  const runningRef = useRef(false);
  const pickRef = useRef("starter");
  const ceHrefRef = useRef("https://godbolt.org/");
  /** Stable handles to the latest closures, for CodeMirror key bindings and window events. */
  const api = useRef({ run: () => {}, load: (_k: string, _flash: boolean) => {} });

  const getCode = () => (cmRef.current ? cmRef.current.getValue() : (taRef.current?.value ?? ""));
  const getStdin = () => stdinRef.current?.value ?? "";
  const setStatus = (text: string, cls: StatusCls = "") => setStatusState({ text, cls });

  const clearMarks = () => {
    const cm = cmRef.current;
    if (cm) marks.current.forEach(([l, c]) => cm.removeLineClass(l, "background", c));
    marks.current = [];
  };
  const markLines = (text: string) => {
    const cm = cmRef.current;
    if (!cm) return;
    const re = /<source>:(\d+):\d+:\s*(error|warning)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(strip(text)))) {
      const l = +m[1] - 1;
      const c = m[2] === "error" ? "line-err" : "line-warn";
      if (l >= 0 && l < cm.lineCount()) {
        cm.addLineClass(l, "background", c);
        marks.current.push([l, c]);
      }
    }
  };

  const updateLink = async () => {
    const state = {
      sessions: [
        {
          id: 1,
          language: "c++",
          source: getCode(),
          compilers: [],
          executors: [
            {
              arguments: "",
              compiler: { id: "g133", libs: [], options: OPTS },
              stdin: getStdin(),
              stdinVisible: true,
              compilerVisible: true,
              compilerOutputVisible: true,
            },
          ],
        },
      ],
    };
    const href = "https://godbolt.org/clientstate/" + encodeURIComponent(await b64state(state));
    ceHrefRef.current = href;
    setCeHref(href);
    return href;
  };

  /** Keep a per-browser draft and the Compiler Explorer link current (debounced). */
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const changed = () => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem("stl-editor", JSON.stringify({ key: pickRef.current, code: getCode(), stdin: getStdin() }));
      } catch {
        /* storage blocked */
      }
      void updateLink();
    }, 400);
  };

  const showResult = (d: CEResult) => {
    const b = d.buildResult || {};
    const compileMsg = [joinText(b.stdout), joinText(b.stderr)].filter(Boolean).join("\n");
    markLines(compileMsg);
    let html = "";
    if (!d.didExecute) {
      const errs = (strip(compileMsg).match(/error:/g) || []).length;
      setStatus(b.code && b.code !== 0 ? `✕ Compile error${errs > 1 ? "s: " + errs : ""}` : "✕ Did not run", "bad");
      html = `<span class="h">compiler</span>${ansi(compileMsg || joinText(d.stderr) || "No output from the compiler.")}`;
    } else {
      if (d.timedOut) setStatus("⏱ Timed out: the program ran too long and was stopped", "bad");
      else
        setStatus(
          `${d.code === 0 ? "✓" : "!"} Exit code ${d.code} · ${d.execTime != null ? d.execTime + " ms" : ""}`,
          d.code === 0 ? "ok" : "info",
        );
      if (compileMsg.trim()) html += `<span class="h">compiler warnings</span>${ansi(compileMsg)}\n`;
      const so = joinText(d.stdout);
      const se = joinText(d.stderr);
      html += `<span class="h">stdout</span>${so ? esc(so) : '<span class="nt">(nothing printed)</span>'}`;
      if (se) html += `\n<span class="h">stderr</span><span class="err-block">${esc(se)}</span>`;
      if (d.truncated) html += `\n<span class="w">Output was cut off because it was too long.</span>`;
    }
    setOutHtml(html);
  };

  const run = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    markVisited("editor");
    clearMarks();
    setOutHtml("");
    setStatus("Compiling with GCC 13.3 on Compiler Explorer…", "busy");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    try {
      const res = await fetch(API, {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          source: getCode(),
          options: {
            userArguments: OPTS,
            executeParameters: { args: [], stdin: getStdin() },
            compilerOptions: { executorRequest: true },
            filters: { execute: true },
            tools: [],
            libraries: [],
          },
          lang: "c++",
          allowStoreCodeDebug: false,
        }),
      });
      if (!res.ok) throw Object.assign(new Error("HTTP " + res.status), { http: res.status });
      showResult((await res.json()) as CEResult);
    } catch (err) {
      const e = err as Error & { http?: number };
      const href = await updateLink();
      if (e.name === "AbortError") {
        setStatus("⏱ No answer from Compiler Explorer after 45 seconds", "bad");
        setOutHtml(`The service may be busy. Try again, or run it on the site:\n${fallbackLink(href, "Open this code in Compiler Explorer ↗")}`);
      } else if (e.http) {
        setStatus(`✕ Compiler Explorer answered with ${e.message}`, "bad");
        setOutHtml(
          `${e.http === 429 ? "Too many runs in a short time. Wait a minute and try again." : "The service had a problem with this request."}\n${fallbackLink(href, "Open this code in Compiler Explorer ↗")}`,
        );
      } else {
        setStatus("This page can't reach the compiler from here", "info");
        setOutHtml(
          `Your browser couldn't connect to Compiler Explorer from this page.\n\nYour code and stdin are packed into this link. It opens Compiler Explorer in a new tab with everything filled in, and runs it there:\n${fallbackLink(href, "▶ Run in Compiler Explorer ↗")}`,
        );
      }
    } finally {
      clearTimeout(timer);
      runningRef.current = false;
      setRunning(false);
    }
  };

  const setCode = (s: string) => {
    if (cmRef.current) {
      cmRef.current.setValue(s);
      cmRef.current.clearHistory();
    } else if (taRef.current) taRef.current.value = s;
    clearMarks();
  };
  const load = (k: string, withFlash: boolean) => {
    const e = EX[k];
    if (!e) return;
    pickRef.current = k;
    setPick(k);
    setCode(e.code);
    if (stdinRef.current) stdinRef.current.value = e.stdin;
    changed();
    setOutHtml("");
    setStatus("Loaded. Press ▶ Run to compile.");
    if (withFlash) setFlash((n) => n + 1);
  };
  api.current = { run: () => void run(), load };

  // Restore the draft, mount CodeMirror, and listen for "Try it" clicks.
  useEffect(() => {
    let draft: Draft | null = null;
    try {
      draft = JSON.parse(localStorage.getItem("stl-editor") || "null") as Draft | null;
    } catch {
      draft = null;
    }
    const initial: Draft = draft && typeof draft.code === "string" ? draft : { key: "starter", code: STARTER, stdin: STARTER_IN };
    const key = EX[initial.key] ? initial.key : "starter";
    pickRef.current = key;
    setPick(key);
    if (stdinRef.current) stdinRef.current.value = initial.stdin || "";
    if (taRef.current) taRef.current.value = initial.code;
    void updateLink();

    let cancelled = false;
    let io: IntersectionObserver | undefined;
    (async () => {
      try {
        const { default: CodeMirror } = await import("codemirror");
        await Promise.all([
          import("codemirror/mode/clike/clike"),
          import("codemirror/addon/edit/matchbrackets"),
          import("codemirror/addon/edit/closebrackets"),
          import("codemirror/addon/selection/active-line"),
        ]);
        const ta = taRef.current;
        if (cancelled || !ta) return;
        const cm = CodeMirror.fromTextArea(ta, {
          mode: "text/x-c++src",
          lineNumbers: true,
          matchBrackets: true,
          autoCloseBrackets: true,
          styleActiveLine: true,
          indentUnit: 4,
          tabSize: 4,
          indentWithTabs: false,
          lineWrapping: false,
          extraKeys: {
            "Ctrl-Enter": () => api.current.run(),
            "Cmd-Enter": () => api.current.run(),
            Tab: (c: Editor) => (c.somethingSelected() ? c.indentSelection("add") : c.replaceSelection("    ")),
          },
        } as EditorConfiguration);
        cmRef.current = cm;
        cm.on("change", changed);
        document.fonts?.ready.then(() => cm.refresh());
        io = new IntersectionObserver((es) => {
          if (es[0].isIntersecting) cm.refresh();
        });
        io.observe(cm.getWrapperElement());
      } catch (err) {
        console.error("CodeMirror failed to load; using the plain editor.", err);
      }
      // A "Try it" click may have happened before this island hydrated.
      const pending = window.__stlPendingTry;
      if (pending && !cancelled) {
        window.__stlPendingTry = undefined;
        api.current.load(pending, true);
      }
    })();

    const onTry = (e: CustomEvent<string>) => {
      window.__stlPendingTry = undefined;
      api.current.load(e.detail, true);
    };
    document.addEventListener(TRY_EVENT, onTry);
    return () => {
      cancelled = true;
      io?.disconnect();
      clearTimeout(saveTimer.current);
      document.removeEventListener(TRY_EVENT, onTry);
      cmRef.current?.toTextArea();
      cmRef.current = null;
    };
    // mount once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restart the highlight ring when an example is loaded from a "Try it" button.
  useEffect(() => {
    const box = boxRef.current;
    if (!flash || !box) return;
    box.classList.remove("ed-flash");
    void box.offsetWidth;
    box.classList.add("ed-flash");
  }, [flash]);

  const onTaKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void run();
    }
    if (e.key === "Tab") {
      e.preventDefault();
      ta.setRangeText("    ", ta.selectionStart, ta.selectionEnd, "end");
    }
  };

  const copy = () => {
    const done = () => {
      setCopyLabel("Copied");
      setTimeout(() => setCopyLabel("Copy"), 1400);
    };
    const fallback = () => {
      const cm = cmRef.current;
      if (cm) {
        cm.focus();
        cm.execCommand("selectAll");
      } else {
        taRef.current?.focus();
        taRef.current?.select();
      }
      setCopyLabel("Selected, press Ctrl+C");
      setTimeout(() => setCopyLabel("Copy"), 2200);
    };
    try {
      navigator.clipboard.writeText(getCode()).then(done, fallback);
    } catch {
      fallback();
    }
  };

  return (
    <div className="ed" id="ed" ref={boxRef}>
      <div className="ed-bar">
        <label className="vlabel" htmlFor="edPick">
          example
        </label>
        <select id="edPick" className="ed-select" value={pick} onChange={(e) => load(e.target.value, false)}>
          {Object.entries(EX).map(([k, e]) => (
            <option key={k} value={k}>
              {e.label}
            </option>
          ))}
        </select>
        <span className="grow" />
        <button type="button" className="op" onClick={copy}>
          {copyLabel}
        </button>
        <button type="button" className="op" onClick={() => load(pickRef.current, false)}>
          Reset
        </button>
        <a className="op" href={ceHref} target="_blank" rel="noopener">
          Open in Compiler Explorer ↗
        </a>
        <button type="button" className="op primary" onClick={() => void run()} disabled={running}>
          {running ? "… Running" : "▶ Run"}
        </button>
      </div>
      <div className="ed-grid">
        <div className="ed-code">
          <div>
            <textarea
              ref={taRef}
              className="ed-ta"
              spellCheck={false}
              aria-label="C++ code"
              defaultValue={STARTER}
              onKeyDown={onTaKey}
              onInput={changed}
            />
          </div>
        </div>
        <div className="ed-side">
          <label className="ed-lab" htmlFor="edStdin">
            stdin
          </label>
          <textarea
            id="edStdin"
            ref={stdinRef}
            className="ed-stdin"
            spellCheck={false}
            rows={4}
            defaultValue={STARTER_IN}
            onInput={changed}
          />
          <div className="ed-lab">output</div>
          <div className={"ed-status " + status.cls} role="status">
            {status.text}
          </div>
          <pre className="ed-out" aria-live="polite" dangerouslySetInnerHTML={{ __html: outHtml }} />
        </div>
      </div>
    </div>
  );
}
