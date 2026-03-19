/**
 * iOS Safari zooms focused inputs when effective font size is below ~16px; blur often
 * leaves the page scaled. There is no dedicated “reset zoom” API — briefly normalizing
 * the viewport meta tag is a common workaround, then restoring the original value.
 */
export function restoreViewportAfterInputBlur(): void {
  if (typeof document === "undefined") return;
  const el = document.querySelector('meta[name="viewport"]');
  if (!(el instanceof HTMLMetaElement)) return;
  const previous =
    el.getAttribute("content") ?? "width=device-width, initial-scale=1.0";
  el.setAttribute(
    "content",
    "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1",
  );
  window.setTimeout(() => {
    el.setAttribute("content", previous);
  }, 120);
}
