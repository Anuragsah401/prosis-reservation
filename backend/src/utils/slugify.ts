/**
 * Converts a string into a URL-safe slug, e.g. "Lumen Bistro!" -> "lumen-bistro".
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}
