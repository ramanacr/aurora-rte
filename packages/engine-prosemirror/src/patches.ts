import type { JsonPatch } from '@aurora/model';

/**
 * Computes JSON patches (RFC 6902) between two objects.
 */
export function diffJson(prev: unknown, next: unknown, path = ''): JsonPatch[] {
  const patches: JsonPatch[] = [];

  if (prev === next) {
    return patches;
  }

  if (
    prev === null ||
    next === null ||
    typeof prev !== 'object' ||
    typeof next !== 'object' ||
    Array.isArray(prev) !== Array.isArray(next)
  ) {
    patches.push({
      op: 'replace',
      path: path || '/',
      value: next
    });
    return patches;
  }

  if (Array.isArray(prev) && Array.isArray(next)) {
    const minLen = Math.min(prev.length, next.length);
    for (let i = 0; i < minLen; i++) {
      patches.push(...diffJson(prev[i], next[i], `${path}/${i}`));
    }
    if (next.length > prev.length) {
      for (let i = minLen; i < next.length; i++) {
        patches.push({
          op: 'add',
          path: `${path}/${i}`,
          value: next[i]
        });
      }
    } else if (prev.length > next.length) {
      for (let i = prev.length - 1; i >= minLen; i--) {
        patches.push({
          op: 'remove',
          path: `${path}/${i}`
        });
      }
    }
    return patches;
  }

  const prevObj = prev as Record<string, unknown>;
  const nextObj = next as Record<string, unknown>;
  const allKeys = new Set([...Object.keys(prevObj), ...Object.keys(nextObj)]);

  for (const key of allKeys) {
    const childPath = `${path}/${key}`;
    if (!(key in prevObj)) {
      patches.push({
        op: 'add',
        path: childPath,
        value: nextObj[key]
      });
    } else if (!(key in nextObj)) {
      patches.push({
        op: 'remove',
        path: childPath
      });
    } else {
      patches.push(...diffJson(prevObj[key], nextObj[key], childPath));
    }
  }

  return patches;
}
