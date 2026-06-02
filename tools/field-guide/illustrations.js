// AlterU Press · Field Guide · Demo specimen-card illustrations
//
// These 3 PNGs were produced by the wdabuliu gen-image API
// (aiservice.wdabuliu.com:8019/genl_image, img2img) — the same API that
// runs at runtime for real user uploads. The refs were intermediate
// SVG-rendered placeholders + a Field-Guide-specimen-card prompt.
//
// At runtime in production:
//   ref = user photo
//   prompt = Claude-authored illustration_prompt
// And the API returns the same kind of artifact.

const BASE = new URL("img/", import.meta.url).href;

export const DEMO_ILLUSTRATIONS = {
  hat:     BASE + "hat.png",
  teapot:  BASE + "teapot.png",
  satchel: BASE + "satchel.png",
};

// Kept for API compatibility with earlier code paths
export function svgToDataUrl(maybeUrl) {
  return maybeUrl; // illustrations are now PNGs, just pass through
}
