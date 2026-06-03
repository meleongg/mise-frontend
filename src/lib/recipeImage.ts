export function isPexelsImageUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname === "images.pexels.com";
  } catch {
    return false;
  }
}
