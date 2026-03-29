/**
 * Type-safe conversion of an entity to Record for dynamic property access.
 * Replaces unsafe `as unknown as Record<string, unknown>` casts scattered
 * across the codebase with a single, auditable cast point.
 *
 * Safer because:
 * - `object` constrains the input (no primitives allowed)
 * - Single cast location instead of N scattered `as unknown as` patterns
 * - Easy to grep and audit
 *
 * @example
 * const record = toRecord(entity);
 * if (!record['restaurantId']) { ... }
 */
export function toRecord(entity: object): Record<string, unknown> {
  return entity as Record<string, unknown>;
}
