import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { useKeyboardViewport } from "./useKeyboardViewport";

class FakeViewport extends EventTarget {
  height = 800;
  offsetTop = 0;
  scale = 1;

  set(next: Partial<Pick<FakeViewport, "height" | "offsetTop" | "scale">>, type = "resize") {
    Object.assign(this, next);
    act(() => {
      this.dispatchEvent(new Event(type));
    });
  }
}

function Root() {
  const ref = useRef<HTMLDivElement>(null);
  useKeyboardViewport(ref);
  return (
    <div ref={ref} data-testid="root">
      <input aria-label="field" />
    </div>
  );
}

describe("useKeyboardViewport", () => {
  let viewport: FakeViewport;
  let scrollTo: Mock<typeof window.scrollTo>;
  let scrollIntoView: Mock<Element["scrollIntoView"]>;

  beforeEach(() => {
    viewport = new FakeViewport();
    vi.stubGlobal("visualViewport", viewport);
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(800);
    scrollTo = vi.fn<typeof window.scrollTo>();
    vi.stubGlobal("scrollTo", scrollTo);
    scrollIntoView = vi.fn<Element["scrollIntoView"]>();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("leaves the root alone for a toolbar-sized change", () => {
    const { getByTestId } = render(<Root />);
    viewport.set({ height: 700 });
    expect(getByTestId("root").style.position).toBe("");
  });

  it("pins the root to the visible area while the keyboard is up", () => {
    const { getByTestId, getByLabelText } = render(<Root />);
    const root = getByTestId("root");
    getByLabelText("field").focus();

    viewport.set({ height: 450, offsetTop: 120 });
    expect(root.style).toMatchObject({ position: "fixed", top: "120px", height: "450px" });
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    // A pan follows without pulling the form back to the field.
    viewport.set({ offsetTop: 300 }, "scroll");
    expect(root.style.top).toBe("300px");
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("releases the root and the page when the keyboard drops", () => {
    const { getByTestId } = render(<Root />);
    viewport.set({ height: 450, offsetTop: 120 });
    viewport.set({ height: 800, offsetTop: 0 });
    expect(getByTestId("root").getAttribute("style")).toBe("");
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("ignores pinch zoom", () => {
    const { getByTestId } = render(<Root />);
    viewport.set({ height: 400, scale: 2 });
    expect(getByTestId("root").style.position).toBe("");
  });
});
