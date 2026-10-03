/**
 * The original page's tiny C++ highlighter, unchanged. It runs at build time inside
 * Astro components, so code blocks ship as plain HTML with no client-side JavaScript.
 */
export const esc = (s: unknown): string =>
  String(s).replace(
    /[&<>"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );

const KW =
  "int|char|bool|void|return|for|while|do|if|else|auto|const|using|namespace|true|false|long|double";
const TY =
  "vector|list|deque|stack|queue|priority_queue|multiset|unordered_set|set|multimap|unordered_map|map|pair|string|greater|iterator|cout|endl";
const RE = new RegExp(
  `(\\/\\/[^\\n]*)|("(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')|(^\\s*#[^\\n]*)|(\\b\\d+(?:LL)?\\b)|\\b(${KW})\\b|\\b(${TY})\\b`,
  "gm",
);

export function highlight(code: string): string {
  let out = "";
  let last = 0;
  code.replace(
    RE,
    (
      m: string,
      c?: string,
      s?: string,
      pp?: string,
      n?: string,
      k?: string,
      _t?: string,
      off?: number,
    ) => {
      const at = off ?? 0;
      out += esc(code.slice(last, at));
      const cls = c ? "c" : s ? "s" : pp ? "p" : n ? "n" : k ? "k" : "t";
      out += `<span class="tk-${cls}">${esc(m)}</span>`;
      last = at + m.length;
      return m;
    },
  );
  return out + esc(code.slice(last));
}
