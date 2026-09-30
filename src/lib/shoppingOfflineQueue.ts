/** Offline queue for shopping list check toggles (last write per item wins). */

export type ShoppingCheckQueueItem = {
  item_id: string;
  is_checked: boolean;
  client_updated_at: string; // ISO
};

const STORAGE_KEY = "mise:shopping-check-queue";

function readAll(): ShoppingCheckQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ShoppingCheckQueueItem[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: ShoppingCheckQueueItem[]): void {
  if (typeof window === "undefined") return;
  try {
    if (items.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota / private mode */
  }
}

/** Collapse to latest client_updated_at per item_id. */
export function collapseCheckQueue(
  items: ShoppingCheckQueueItem[]
): ShoppingCheckQueueItem[] {
  const latest = new Map<string, ShoppingCheckQueueItem>();
  for (const item of items) {
    if (!item?.item_id) continue;
    const prev = latest.get(item.item_id);
    if (!prev || item.client_updated_at >= prev.client_updated_at) {
      latest.set(item.item_id, item);
    }
  }
  return Array.from(latest.values());
}

export function loadShoppingCheckQueue(): ShoppingCheckQueueItem[] {
  return collapseCheckQueue(readAll());
}

export function enqueueShoppingCheck(
  itemId: string,
  isChecked: boolean,
  clientUpdatedAt: string = new Date().toISOString()
): ShoppingCheckQueueItem[] {
  const next = collapseCheckQueue([
    ...readAll(),
    {
      item_id: itemId,
      is_checked: isChecked,
      client_updated_at: clientUpdatedAt,
    },
  ]);
  writeAll(next);
  return next;
}

export function clearShoppingCheckQueue(): void {
  writeAll([]);
}

export function applyCheckQueueToItems<
  T extends { id: string; is_checked: boolean },
>(items: T[], queue: ShoppingCheckQueueItem[]): T[] {
  if (!queue.length) return items;
  const byId = new Map(queue.map((q) => [q.item_id, q.is_checked]));
  return items.map((item) => {
    if (!byId.has(item.id)) return item;
    return { ...item, is_checked: Boolean(byId.get(item.id)) };
  });
}
