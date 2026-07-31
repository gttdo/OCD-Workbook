/**
 * The local model is camelCase; Postgres is snake_case. Rather than maintain a
 * hand-written mapping per table, convert keys mechanically at the sync
 * boundary — the two shapes are otherwise identical by design.
 */

export function toSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

export function toCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}

export function keysToSnake<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) out[toSnake(k)] = v
  return out
}

export function keysToCamel<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) out[toCamel(k)] = v
  return out
}
