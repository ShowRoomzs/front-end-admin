import type { DropResult } from "@hello-pangea/dnd";
import { useCallback, useEffect, useState } from "react";

interface UseReorderListOptions<T, R> {
  items?: Array<T>;
  getId: (item: T) => string | number;
  getDisplayOrder: (item: T) => number;
  setDisplayOrder: (item: T, displayOrder: number) => T;
  createReorderItem: (item: T) => R;
  onReorder: (reorderList: Array<R>) => Promise<void>;
  onSuccess?: () => void;
  onError?: () => void;
}

const moveItem = <T,>(
  items: Array<T>,
  sourceIndex: number,
  destinationIndex: number
) => {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(sourceIndex, 1);
  nextItems.splice(destinationIndex, 0, movedItem);
  return nextItems;
};

export function useReorderList<T, R>(options: UseReorderListOptions<T, R>) {
  const {
    items,
    getId,
    getDisplayOrder,
    setDisplayOrder,
    createReorderItem,
    onReorder,
    onSuccess,
    onError,
  } = options;
  const [localItems, setLocalItems] = useState<Array<T>>([]);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    if (!items) {
      return;
    }

    setLocalItems(items);
  }, [items]);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination } = result;
      const currentItems = localItems;

      if (!destination || source.index === destination.index || isReordering) {
        return;
      }

      const reorderedItems = moveItem(
        currentItems,
        source.index,
        destination.index
      );
      const nextItems = reorderedItems.map((item, index) =>
        setDisplayOrder(item, getDisplayOrder(currentItems[index]))
      );

      const previousDisplayOrderMap = new Map(
        currentItems.map((item) => [getId(item), getDisplayOrder(item)])
      );

      const reorderList = nextItems
        .filter((item) => {
          const previousDisplayOrder = previousDisplayOrderMap.get(
            getId(item)
          );
          return previousDisplayOrder !== getDisplayOrder(item);
        })
        .map(createReorderItem);

      setIsReordering(true);

      try {
        setLocalItems(nextItems);
        await onReorder(reorderList);
        onSuccess?.();
      } catch {
        setLocalItems(currentItems);
        onError?.();
      } finally {
        setIsReordering(false);
      }
    },
    [
      createReorderItem,
      getDisplayOrder,
      getId,
      isReordering,
      localItems,
      onError,
      onReorder,
      onSuccess,
      setDisplayOrder,
    ]
  );

  return {
    localItems,
    isReordering,
    handleDragEnd,
  };
}
