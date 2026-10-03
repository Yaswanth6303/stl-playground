/**
 * Animation helpers ported from the original page. They use the Web Animations API with
 * the original durations and easings, so the motion is unchanged.
 * Everything here runs only in the browser (inside event handlers or effects).
 */

/** prefers-reduced-motion, read once like the original. False during SSR. */
export const RM: boolean =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, RM ? Math.min(ms, 40) : ms));

export const rnd = (a: number, b: number): number => a + Math.floor(Math.random() * (b - a + 1));

const keyed = (root: ParentNode): HTMLElement[] => [...root.querySelectorAll<HTMLElement>('[data-k]')];

/**
 * FLIP: record where every [data-k] element is, run `mutate` (which must update the DOM
 * synchronously, i.e. call a flushSync render), then slide each element from its old spot.
 * Elements that did not exist before pop in.
 */
export function flip(root: ParentNode | null | undefined, mutate: () => void): void {
  if (!root) return mutate();
  const before = new Map<string, DOMRect>();
  keyed(root).forEach((e) => before.set(e.dataset.k as string, e.getBoundingClientRect()));
  mutate();
  if (RM) return;
  keyed(root).forEach((e) => {
    const b = before.get(e.dataset.k as string);
    const a = e.getBoundingClientRect();
    if (b) {
      const dx = b.left - a.left;
      const dy = b.top - a.top;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5)
        e.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], {
          duration: 480,
          easing: 'cubic-bezier(.2,.9,.25,1.12)',
        });
    } else if (!e.classList.contains('ghost') && !e.classList.contains('past') && !e.classList.contains('null')) {
      e.animate([{ transform: 'translateY(-18px) scale(.35)', opacity: 0 }, { transform: 'none', opacity: 1 }], {
        duration: 440,
        easing: 'cubic-bezier(.2,.9,.25,1.25)',
      });
    }
  });
}

/** Shrink-and-fade elements out before they are removed from the model. */
export async function leave(els: (Element | null | undefined)[]): Promise<void> {
  const list = els.filter((e): e is Element => Boolean(e));
  if (RM || !list.length) return;
  await Promise.all(
    list.map(
      (e) =>
        e.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(16px) scale(.4)' }], {
          duration: 280,
          easing: 'ease-in',
          fill: 'forwards',
        }).finished,
    ),
  );
}

/** Restart the CSS `shake` keyframe on an element. */
export function shake(el: Element | null | undefined): void {
  if (!el) return;
  el.classList.remove('shake');
  void (el as HTMLElement).offsetWidth;
  el.classList.add('shake');
}

/** The little "pop" used on running totals. */
export function pulse(el: Element | null | undefined, scale: number, duration: number): void {
  if (RM || !el) return;
  el.animate([{ transform: `scale(${scale})` }, { transform: 'none' }], { duration });
}
