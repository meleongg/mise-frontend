"use client";

import {
  applyCheckQueueToItems,
  clearShoppingCheckQueue,
  enqueueShoppingCheck,
  loadShoppingCheckQueue,
  type ShoppingCheckQueueItem,
} from "@/lib/shoppingOfflineQueue";
import { api } from "@/lib/api";
import type { ShoppingList, ShoppingListItem } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { queryKeys } from "@/hooks/queries";

function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return true;
  }
  if (error instanceof TypeError) return true;
  if (error && typeof error === "object" && "status" in error) {
    const status = Number((error as { status?: number }).status);
    return status === 0 || status >= 500;
  }
  return false;
}

/**
 * Offline-tolerant shopping check toggles + flush on reconnect.
 */
export function useShoppingOfflineChecks(weekNumber?: number) {
  const queryClient = useQueryClient();
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const [queue, setQueue] = useState<ShoppingCheckQueueItem[]>([]);
  const [flushing, setFlushing] = useState(false);

  const refreshQueue = useCallback(() => {
    setQueue(loadShoppingCheckQueue());
  }, []);

  useEffect(() => {
    refreshQueue();
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refreshQueue]);

  const applyQueueToList = useCallback(
    (list: ShoppingList | undefined | null): ShoppingList | undefined | null => {
      if (!list) return list;
      const pending = loadShoppingCheckQueue();
      if (!pending.length) return list;
      return {
        ...list,
        items: applyCheckQueueToItems(list.items, pending),
      };
    },
    []
  );

  const flushQueue = useCallback(async () => {
    const pending = loadShoppingCheckQueue();
    if (!pending.length || flushing) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    setFlushing(true);
    try {
      const list = await api.syncShoppingChecks(pending);
      clearShoppingCheckQueue();
      setQueue([]);
      queryClient.setQueryData(queryKeys.shoppingList(weekNumber), list);
      queryClient.invalidateQueries({ queryKey: ["shoppingList"] });
    } catch {
      /* keep queue; retry on next online */
      refreshQueue();
    } finally {
      setFlushing(false);
    }
  }, [flushing, queryClient, refreshQueue, weekNumber]);

  useEffect(() => {
    if (online) {
      void flushQueue();
    }
  }, [online, flushQueue]);

  const toggleChecked = useCallback(
    async (item: ShoppingListItem, isChecked: boolean) => {
      const clientUpdatedAt = new Date().toISOString();

      // Optimistic cache + queue overlay.
      queryClient.setQueryData(
        queryKeys.shoppingList(weekNumber),
        (prev: ShoppingList | undefined) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((row) =>
              row.id === item.id ? { ...row, is_checked: isChecked } : row
            ),
          };
        }
      );

      if (!online) {
        setQueue(enqueueShoppingCheck(item.id, isChecked, clientUpdatedAt));
        return;
      }

      try {
        const list = await api.updateShoppingListItem(item.id, {
          is_checked: isChecked,
        });
        queryClient.setQueryData(queryKeys.shoppingList(weekNumber), list);
        queryClient.invalidateQueries({ queryKey: ["shoppingList"] });
      } catch (error) {
        if (isNetworkError(error)) {
          setQueue(enqueueShoppingCheck(item.id, isChecked, clientUpdatedAt));
          setOnline(false);
          return;
        }
        queryClient.invalidateQueries({ queryKey: ["shoppingList"] });
        throw error;
      }
    },
    [online, queryClient, weekNumber]
  );

  return {
    online,
    pendingCount: queue.length,
    flushing,
    toggleChecked,
    applyQueueToList,
    flushQueue,
  };
}
