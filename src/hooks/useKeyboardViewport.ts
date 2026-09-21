import { useEffect, type RefObject } from "react";

/* The on-screen keyboard doesn't resize the page on iOS Safari (nor, by
   default, on Chrome for Android): it shrinks only the visual viewport and
   lets the page pan to bring the focused field into view — on iOS by up to
   the keyboard's height, however short the page. The App root is one
   viewport tall (h-viewport) and the attract form fits inside it, so that pan
   was the only scroll there was: dragging past the CTA carried the scene off
   the top and showed the bare dark-teal canvas under it.

   While the keyboard is up, the root is pinned to the visual viewport
   instead: fixed at its offset and exactly its height. The attract screen,
   now shorter than its panel, scrolls inside itself (its scroller contains
   the overscroll), and whenever iOS pans the page anyway the root follows,
   so there is no canvas to reach. Pinch zoom shrinks the visual viewport
   too, so only an unzoomed one counts, and it has to have lost a quarter of
   the layout viewport — more than a browser toolbar ever takes. */
const KEYBOARD_SHARE = 0.25;

export function useKeyboardViewport(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const viewport = window.visualViewport;
    const root = ref.current;
    if (!viewport || !root) return;

    let pinned = false;

    function unpin(el: HTMLElement) {
      el.style.removeProperty("position");
      el.style.removeProperty("top");
      el.style.removeProperty("left");
      el.style.removeProperty("height");
    }

    function update(event?: Event) {
      if (!viewport || !root) return;
      const keyboardUp =
        Math.abs(viewport.scale - 1) < 0.01 &&
        viewport.height <
          document.documentElement.clientHeight * (1 - KEYBOARD_SHARE);

      if (keyboardUp) {
        root.style.position = "fixed";
        root.style.top = `${viewport.offsetTop}px`;
        root.style.left = "0px";
        root.style.height = `${viewport.height}px`;
        // The root just shrank under the focused field, which can leave it
        // below its scroller's fold. Only on a size change: a pan must not
        // yank the form back while it is being scrolled.
        const field = document.activeElement;
        if (
          (!pinned || event?.type === "resize") &&
          field instanceof HTMLElement &&
          root.contains(field)
        ) {
          field.scrollIntoView({ block: "nearest" });
        }
        pinned = true;
      } else if (pinned) {
        unpin(root);
        pinned = false;
        // iOS can leave the page panned once the keyboard drops. The root is
        // back at the top of a page that never scrolls, so the page goes too.
        window.scrollTo(0, 0);
      }
    }

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      unpin(root);
    };
  }, [ref]);
}
