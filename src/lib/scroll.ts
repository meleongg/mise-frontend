/** Reset window scroll (e.g. after route changes from a long form). */
export function scrollToTop() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}
