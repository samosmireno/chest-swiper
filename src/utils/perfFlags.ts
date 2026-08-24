// On-device perf triage, activated only via URL query params. The desktop
// harness can't measure phone GPU cost, so these let a phone A/B the
// compositor-side suspects directly:
//   ?novideo=1  static poster instead of the looping background video
//   ?noblur=1   disable all backdrop-filter blurs
//   ?nofx=1     disable SVG filters and metallic glow shadows
//   ?fps=1      tiny live frame meter (fps + long-frame count)
// No params → zero effect in normal use.

const params = new URLSearchParams(window.location.search);

export const perfFlags = {
  novideo: params.has("novideo"),
  noblur: params.has("noblur"),
  nofx: params.has("nofx"),
  fps: params.has("fps"),
};

const css: string[] = [];
if (perfFlags.noblur)
  css.push(
    "*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}",
  );
if (perfFlags.nofx)
  css.push(
    "svg{filter:none!important}",
    ".bg-metallic-border{box-shadow:none!important}",
  );
if (css.length > 0) {
  const style = document.createElement("style");
  style.textContent = css.join("\n");
  document.head.appendChild(style);
}
