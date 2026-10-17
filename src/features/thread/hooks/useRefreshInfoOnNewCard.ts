import { ADMIN_THREAD_QUERY_KEYS } from "@/features/thread/constants/queryKeys";
import type { MessageItem } from "@/features/thread/types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";

/**
 * 보고 있는 동안 새 시스템 카드가 들어오면 헤더 · 이슈 패널(info)과 목록 · 요약을 다시 읽는다.
 *
 * info는 진입 시 1회 부르는 값이라(설계서 3-4) 협의 중에 다른 금액 제안 · 합의 · 기한 만료가 일어나면
 * 패널의 상태 · 현재 제안 · 진행 단계가 낡는다. 그 사건들은 전부 카드로 스레드에 들어오므로
 * 카드 도착을 갱신 신호로 쓴다. 처음 불러온 카드는 신호가 아니다.
 */
export function useRefreshInfoOnNewCard(
  threadId: number,
  messages: Array<MessageItem>
) {
  const queryClient = useQueryClient();
  const seenCardId = useRef<number | null>(null);

  const latestCardId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].messageType === "SYSTEM") {
        return messages[index].messageId;
      }
    }
    return null;
  }, [messages]);

  useEffect(() => {
    if (latestCardId === null) {
      return;
    }
    const previous = seenCardId.current;
    seenCardId.current = latestCardId;
    if (previous === null || previous === latestCardId) {
      return;
    }
    void Promise.all([
      queryClient.invalidateQueries({
        queryKey: [ADMIN_THREAD_QUERY_KEYS.INFO, threadId],
      }),
      queryClient.invalidateQueries({
        queryKey: [ADMIN_THREAD_QUERY_KEYS.LIST],
      }),
      queryClient.invalidateQueries({
        queryKey: [ADMIN_THREAD_QUERY_KEYS.SUMMARY],
      }),
    ]);
  }, [latestCardId, queryClient, threadId]);
}
