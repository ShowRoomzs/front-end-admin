import type {
  Payload,
  QueueItem,
} from "@/common/hooks/usePromiseQueue/usePromiseQueue";

export function getExistQueueItem<T>(
  queue: Array<QueueItem<T>>,
  payLoad: Payload<T>,
  keyString: keyof T
) {
  if (!queue?.length) {
    return null;
  }
  return queue.find((item) => item.payload[keyString] === payLoad[keyString]);
}

export function getOriginItem<T>(
  originData: Array<T>,
  payload: Payload<T>,
  keyString: keyof T
) {
  if (!originData?.length) {
    return null;
  }
  return originData.find((item) => item[keyString] === payload[keyString]);
}

// isNewItem 인 아이템 id값 제거
export function stripNewItemId<T>(
  queue: Array<QueueItem<T>>,
  keyString: keyof T
): Array<QueueItem<T>> {
  return queue.map((item) => ({
    ...item,
    payload: item.isNewItem
      ? { ...item.payload, [keyString]: undefined }
      : item.payload,
  }));
}
