/**
 * "Topics tried" tracking. Islands and page scripts are bundled separately, so they talk
 * through a DOM event; the sidebar script (Sidebar.astro) owns the visited set.
 */
export const VISIT_EVENT = "stl:visit";

export function markVisited(topicId: string): void {
  document.dispatchEvent(
    new CustomEvent<string>(VISIT_EVENT, { detail: topicId }),
  );
}

/** Fired by a "Try it" button; the code editor island loads that example. */
export const TRY_EVENT = "stl:try";

declare global {
  interface Window {
    /** Set by a "Try it" click that happens before the editor island has hydrated. */
    __stlPendingTry?: string;
  }
  interface DocumentEventMap {
    [VISIT_EVENT]: CustomEvent<string>;
    [TRY_EVENT]: CustomEvent<string>;
  }
}
