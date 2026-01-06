import {
  getExistQueueItem,
  getOriginItem,
  stripNewItemId,
} from "@/common/hooks/usePromiseQueue/config";
import { useCallback, useState } from "react";
import { produce } from "immer";
import isEqual from "fast-deep-equal";
import { apiInstance } from "@/common/lib/apiInstance";
import type { AxiosResponse } from "axios";

export type Method = "POST" | "PUT" | "DELETE";
export type Payload<T> = T;
export type MethodUrlMap = Record<Method, string>;

export interface QueueItem<T> {
  method: Method;
  payload: Payload<T>;
  isNewItem?: boolean;
}

interface UsePromiseQueueProps<T> {
  originData: Array<T> | undefined;
  methodUrlMap: MethodUrlMap;
  onPrevExecute?: (queue: Array<QueueItem<T>>) => Array<QueueItem<T>>;
  keyString: keyof T; // id 대신 사용할 문자열 키 예시: "categoryId"
}

interface UsePromiseQueueReturn<T> {
  queue: Array<QueueItem<T>>;
  create: (data: T) => void; // temp id 훅 외부에서 생성
  update: (data: T) => void;
  remove: (data: T) => void;
  execute: () => Promise<AxiosResponse | void>;
}

/**
 * @description usePromiseQueue 훅 인자 타입
 * @param originData 원본 데이터
 * @param onPrevExecute execute 실행 전 외부에서 정렬 관련 로직 수행 시 사용
 * @param methodUrlMap 메소드별 url 매핑
 */

export function usePromiseQueue<T>(
  props: UsePromiseQueueProps<T>
): UsePromiseQueueReturn<T> {
  const {
    originData,
    methodUrlMap,
    onPrevExecute = (queue) => queue,
    keyString,
  } = props;

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
  const execute = useCallback(async (): Promise<AxiosResponse | undefined> => {
    if (!queue?.length) {
      return;
    }

    const processedQueue = onPrevExecute(stripNewItemId(queue, keyString));

    try {
      let result: AxiosResponse | undefined;

      for (const item of processedQueue) {
        const { method, payload } = item;
        const url = methodUrlMap[method];

        switch (method) {
          case "POST":
            // TODO : 1, 2 뎁스 동시 생성인 경우 parentId 전달 필요
            result = await apiInstance.post(url, payload);
            break;
          case "PUT":
            result = await apiInstance.patch(
              `${url}/${payload[keyString]}`,
              payload
            );
            break;
          case "DELETE":
            result = await apiInstance.delete(`${url}/${payload[keyString]}`);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      }

      setQueue([]);
      return result;
    } catch (error) {
      console.error("Queue execution failed", error);
      throw error;
    }
  }, [queue, onPrevExecute, methodUrlMap, keyString]);

  return {
    queue,
    create,
    update,
    remove,
    execute,
  };
}
