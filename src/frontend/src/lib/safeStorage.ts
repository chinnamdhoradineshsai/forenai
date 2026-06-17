/**
 * safeStorage.ts
 *
 * A safe localStorage wrapper that handles QuotaExceededError gracefully.
 *
 * Strategy:
 * 1. Try to write data as-is.
 * 2. On quota error, evict old forenai evidence cache keys (LRU-style) and retry.
 * 3. If still failing, trim large arrays in the value and retry.
 * 4. As a last resort, skip the write silently and warn in the console.
 *
 * This prevents the app from crashing when real device extractions produce
 * large datasets (e.g. hundreds of apps) that exceed the ~5 MB browser limit.
 */

/** Keys that represent large evidence cache entries (can be evicted). */
const EVICTABLE_KEY_PREFIXES = [
  "forenai_dynamic_evidence_",
  "forenai_whatsapp_chats_",
];

/** Keys that are small and should never be evicted. */
const NEVER_EVICT_PREFIXES = [
  "forenai_evidence_extracted_",
  "forenai_device_details_",
  "forenai_devices_",
  "forenai_logs_",
  "forenai_cases",
  "forenai_reports",
];

function isEvictable(key: string): boolean {
  return EVICTABLE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function isProtected(key: string): boolean {
  return NEVER_EVICT_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/**
 * Collect all evictable localStorage keys (excluding the one we're trying to write).
 */
function getEvictableKeys(skipKey: string): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k !== skipKey && isEvictable(k)) {
      keys.push(k);
    }
  }
  return keys;
}

/**
 * Trim large arrays inside an object so the JSON fits within a target byte budget.
 * Arrays are halved until the serialized size is small enough.
 */
function trimPayload(value: string, targetBytes = 2 * 1024 * 1024): string {
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null) return value;

    // Identify top-level array properties and sort by length (largest first)
    const arrayKeys = Object.keys(parsed).filter(
      (k) => Array.isArray(parsed[k]),
    );

    if (arrayKeys.length === 0) return value;

    let result = value;
    let iterations = 0;

    while (
      new Blob([result]).size > targetBytes &&
      iterations < arrayKeys.length * 4
    ) {
      // Trim the largest array by half each pass
      const largest = arrayKeys.reduce((a, b) =>
        (parsed[a] as any[]).length >= (parsed[b] as any[]).length ? a : b,
      );
      const arr = parsed[largest] as any[];
      if (arr.length <= 1) break;
      parsed[largest] = arr.slice(0, Math.ceil(arr.length / 2));
      result = JSON.stringify(parsed, (_, v) =>
        typeof v === "bigint" ? v.toString() : v,
      );
      iterations++;
    }

    return result;
  } catch {
    return value;
  }
}

/**
 * Safely set a localStorage item. Falls back gracefully when quota is exceeded.
 *
 * @param key - The localStorage key.
 * @param value - The stringified value to store.
 * @param allowTrim - If true, large arrays in the value will be trimmed to fit. Default: true.
 */
export function safeSetItem(
  key: string,
  value: string,
  allowTrim = true,
): void {
  // Attempt 1: direct write
  try {
    localStorage.setItem(key, value);
    return;
  } catch (e: any) {
    if (e?.name !== "QuotaExceededError" && e?.code !== 22) {
      // Non-quota error, rethrow
      throw e;
    }
  }

  // Attempt 2: evict other cache entries and retry
  const evictable = getEvictableKeys(key);
  for (const evictKey of evictable) {
    localStorage.removeItem(evictKey);
    try {
      localStorage.setItem(key, value);
      console.warn(
        `[safeStorage] Evicted "${evictKey}" to make room for "${key}".`,
      );
      return;
    } catch {
      // keep evicting
    }
  }

  // Attempt 3: trim large arrays in the value and retry
  if (allowTrim) {
    const trimmed = trimPayload(value);
    if (trimmed !== value) {
      try {
        localStorage.setItem(key, trimmed);
        console.warn(
          `[safeStorage] Trimmed payload for "${key}" to fit storage quota.`,
        );
        return;
      } catch {
        // continue to final fallback
      }
    }
  }

  // Attempt 4: last resort — store just the metadata (no arrays)
  if (!isProtected(key)) {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null) {
        const stripped = Object.fromEntries(
          Object.entries(parsed).filter(([, v]) => !Array.isArray(v)),
        );
        localStorage.setItem(
          key,
          JSON.stringify(stripped, (_, v) =>
            typeof v === "bigint" ? v.toString() : v,
          ),
        );
        console.warn(
          `[safeStorage] Stripped arrays from "${key}" as final quota fallback.`,
        );
        return;
      }
    } catch {
      // ignore
    }
  }

  console.warn(
    `[safeStorage] Could not store "${key}" — localStorage quota exceeded. Data will be fetched from Supabase on next load.`,
  );
}

/**
 * Safely get an item from localStorage.
 */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Remove an item from localStorage safely.
 */
export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Get an estimate of how much localStorage space is currently used (in bytes).
 */
export function getStorageUsageBytes(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) || "";
    const value = localStorage.getItem(key) || "";
    total += key.length + value.length;
  }
  return total * 2; // UTF-16 encoding = 2 bytes per char
}
