// Pointer offsets arrive in real screen pixels, but the layout grows with the
// root font-size on large screens (html font-size in index.css). Dividing
// drag deltas by this keeps thresholds and fly-off distances proportional to
// the rendered card, so a swipe feels the same at every screen size.
export function uiScale(): number {
  const px = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(px) && px > 0 ? px / 16 : 1;
}
