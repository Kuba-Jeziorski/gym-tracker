let previousViewportContent: string | null = null;
let focusCount = 0;

function getViewportMeta(): HTMLMetaElement | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector('meta[name="viewport"]');
  return el instanceof HTMLMetaElement ? el : null;
}

const clampContent =
  "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no";

export function preventViewportZoomOnInputFocus(): void {
  const el = getViewportMeta();
  if (!el) return;

  focusCount += 1;
  if (previousViewportContent === null) {
    previousViewportContent = el.getAttribute("content");
  }

  el.setAttribute("content", clampContent);
}

export function restoreViewportAfterInputBlur(): void {
  const el = getViewportMeta();
  if (!el) return;
  if (focusCount > 0) focusCount -= 1;

  if (focusCount === 0 && previousViewportContent !== null) {
    el.setAttribute("content", previousViewportContent);
    previousViewportContent = null;
  }
}
