/**
 * Count occurrences of each tag across multiple activity_tags arrays.
 * Handles null/undefined arrays from DB rows gracefully.
 */
export function countTags(
  tagArrays: (string[] | null | undefined)[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const tags of tagArrays) {
    for (const tag of tags ?? []) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return counts;
}

/**
 * Return the top N tags as "タグ名(N回)" joined by "、".
 */
export function topTagsText(
  counts: Record<string, number>,
  limit: number,
): string {
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([tag, n]) => `${tag}(${n}回)`)
    .join("、");
}
