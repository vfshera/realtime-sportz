import type { Commentary } from "~/.server/db/schema";

/**
 * Merges commentaries by removing duplicates and sorting by minute in descending order.
 * @param commentaries Array of commentaries to merge.
 * @returns Array of unique commentaries sorted by minute in descending order.
 */
export function mergeCommentaries(commentaries: Commentary[]): Commentary[] {
  const unique = new Map(commentaries.map((c) => [c.id, c]));

  return Array.from(unique.values()).sort((a, b) => b.minute - a.minute);
}
