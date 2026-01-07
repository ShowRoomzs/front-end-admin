import {
  getExistQueueItem,
  getOriginItem,
} from "@/common/hooks/usePromiseQueue/config";
import { useCallback, useState } from "react";
import { produce } from "immer";
import isEqual from "fast-deep-equal";
import { apiInstance } from "@/common/lib/apiInstance";
import type { AxiosResponse } from "axios";

export type Method = "POST" | "PUT" | "DELETE";
export type MethodUrlMap = Record<Method, string>;

export interface QueueItem<T> {
  method: Method;
  payload: T;
  isNewItem?: boolean;
}
export type ResolvePayload<T> = (
  payload: T,
  idMapping: Map<string | number, string | number>
) => T;
interface UsePromiseQueueProps<T> {
  originData: Array<T> | undefined;
  endpoint: string;
  onPrevExecute?: (queue: Array<QueueItem<T>>) => Array<QueueItem<T>>;
  keyString: keyof T; // id 대신 사용할 문자열 키 예시: "categoryId"
  resolvePayload?: ResolvePayload<T>;
}

interface UsePromiseQueueReturn<T> {
  queue: Array<QueueItem<T>>;
  create: (data: T) => void; // temp id 훅 외부에서 생성
  update: (data: T) => void;
  remove: (data: T) => void;
  execute: () => Promise<{
    response: AxiosResponse | undefined;
    idMapping: Map<string | number, string | number>;
  } | void>;
  isLoading: boolean;
}

/**
 * @description usePromiseQueue 훅 인자 타입
 * @param originData 원본 데이터
 * @param onPrevExecute execute 실행 전 외부에서 정렬 관련 로직 수행 시 사용
 * @param endpoint api endpoint
 */

export function usePromiseQueue<T>(
  props: UsePromiseQueueProps<T>
): UsePromiseQueueReturn<T> {
  const {
    originData,
    endpoint,
    onPrevExecute = (queue) => queue,
    keyString,
    resolvePayload,
  } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [queue, setQueue] = useState<Array<QueueItem<T>>>([]);

  const create = useCallback((data: T) => {
    /**
     * case 1: api queue에 존재하지 않는 경우
     * api queue에 추가
     */
    const newQueueItem: QueueItem<T> = {
      method: "POST",
      payload: data,
      isNewItem: true,
    };
    setQueue((prevQueue) => [...prevQueue, newQueueItem]);
  }, []);

  const update = useCallback(
    (data: T) => {
      const originItem = getOriginItem<T>(originData || [], data, keyString);
      const isSameOriginItem = originItem ? isEqual(originItem, data) : false;

      setQueue((prevQueue) =>
        produce(prevQueue, (draft: Array<QueueItem<T>>) => {
          const existQueueItem = getExistQueueItem<T>(draft, data, keyString);
          /**
           * case 1 : update 호출 시 기존 데이터와 동일하면서 api queue에 존재하는 경우
           * api queue에서 제거
           */
          if (isSameOriginItem && existQueueItem) {
            const index = draft.findIndex(
              (item) => item.payload[keyString] === data[keyString]
            );
            if (index !== -1) draft.splice(index, 1);
            return;
          }
          /**
           * case 2 : update 호출 시 api queue에 존재하는 경우
           * payload 업데이트
           * */
          if (existQueueItem) {
            existQueueItem.payload = data;
            return;
          }
          /**
           * case 3 : update 호출 시 api queue에 존재하지 않는 경우
           * api queue에 추가
           * */
          draft.push({
            method: "PUT",
            payload: data,
          });
        })
      );
    },
    [keyString, originData]
  );

  const remove = useCallback(
    (data: T) => {
      setQueue((prevQueue) =>
        produce(prevQueue, (draft: Array<QueueItem<T>>) => {
          const existQueueItem = getExistQueueItem<T>(draft, data, keyString);
          /**
           * case 1 : remove 호출 시 api queue에 존재하면서 create 메소드로 추가된 경우
           * api queue에서 제거
           */
          if (existQueueItem?.method === "POST") {
            const index = draft.findIndex(
              (item) => item.payload[keyString] === data[keyString]
            );
            if (index !== -1) draft.splice(index, 1);
            return;
          }
          /**
           * case 2 : remove 호출 시 api queue에 존재하면서 update 메소드로 추가된 경우
           * api queue에서 제거 후 delete 메소드로 추가
           */
          if (existQueueItem?.method === "PUT") {
            const index = draft.findIndex(
              (item) => item.payload[keyString] === data[keyString]
            );
            if (index !== -1) draft.splice(index, 1);
            draft.push({
              method: "DELETE",
              payload: data,
            });
            return;
          }
          /**
           * case 3 : remove 호출 시 api queue에 존재하지 않는 경우
           * api queue에 delete 메소드로 추가
           */
          draft.push({
            method: "DELETE",
            payload: data,
          });
        })
      );
    },
    [keyString]
  );

  // queue 실행 메소드
  const execute = useCallback(async () => {
    if (!queue?.length) {
      return;
    }
    setIsLoading(true);
    const processedQueue = onPrevExecute(queue);
    const idMapping = new Map<string | number, string | number>();
    try {
      let result: AxiosResponse | undefined;

      for (const item of processedQueue) {
        const { method, payload } = item;

        const resolvedPayload = resolvePayload
          ? resolvePayload(payload, idMapping)
          : payload;

        switch (method) {
          case "POST":
            {
              result = await apiInstance.post(endpoint, resolvedPayload);
              const createdId = result?.data[keyString];

              // tempId 는 nanoid() 로 생성된 문자열
              const tempId = payload[keyString] as string;
              if (tempId && createdId) {
                idMapping.set(tempId, createdId);
              }
            }

            break;
          case "PUT":
            result = await apiInstance.patch(
              `${endpoint}/${payload[keyString]}`,
              payload
            );
            break;
          case "DELETE":
            result = await apiInstance.delete(
              `${endpoint}/${payload[keyString]}`
            );
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      }

      setQueue([]);
      return { response: result, idMapping };
    } catch (error) {
      console.error("Queue execution failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [queue, onPrevExecute, keyString, resolvePayload, endpoint]);

  return {
    queue,
    create,
    update,
    remove,
    execute,
    isLoading,
  };
}
