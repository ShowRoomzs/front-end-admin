import type { PageResponse } from "@/common/types/page";
import { ADMIN_THREAD_QUERY_KEYS } from "@/features/thread/constants/queryKeys";
import { adminThreadService } from "@/features/thread/services/adminThreadService";
import type { ChannelListItem } from "@/features/thread/types";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * 읽음 처리 — 스레드를 열었을 때와 새 메시지가 화면에 들어왔을 때 부른다(설계서 3-7 · Docs `POST /read`).
 *
 * `latestIncomingId`(상대 · 카드 중 가장 최근 메시지 ID)가 바뀔 때마다 한 번 부른다 — 운영팀이
 * 보낸 말풍선은 안 읽은 수에 들어가지 않으므로 기준에서 뺀다. 서버는 멱등이고 읽음 위치는
 * 운영팀 공용이라, 누가 열든 모든 운영자의 배지가 함께 줄어든다.
 *
 * 성공하면 목록 캐시의 그 행을 0으로 내리고 탭 · GNB 배지(요약)를 다시 조회한다 —
 * 폴링(30초)까지 기다리면 「읽었는데 아직 안 읽음」으로 보인다.
 * 쌍 스레드는 서버가 아무것도 기록하지 않는 204라 불러도 해가 없다.
 */
export function useMarkThreadRead(
  threadId: number | null,
  latestIncomingId: number | null
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (threadId === null || latestIncomingId === null) {
      return;
    }
    // 백그라운드 탭에서는 「화면에 보였다」가 아니다 — 돌아와서 폴링이 다시 돌 때 처리된다
    if (document.visibilityState === "hidden") {
      return;
    }

    let isCancelled = false;

    adminThreadService
      .markRead(threadId)
      .then(() => {
        if (isCancelled) {
          return;
        }
        queryClient.setQueriesData<InfiniteData<PageResponse<ChannelListItem>>>(
          { queryKey: [ADMIN_THREAD_QUERY_KEYS.LIST] },
          (current) =>
            current
              ? {
                  ...current,
                  pages: current.pages.map((page) => ({
                    ...page,
                    content: page.content.map((item) =>
                      item.threadId === threadId
                        ? { ...item, unreadCount: 0 }
                        : item
                    ),
                  })),
                }
              : current
        );
        void queryClient.invalidateQueries({
          queryKey: [ADMIN_THREAD_QUERY_KEYS.SUMMARY],
        });
      })
      .catch(() => {
        // 읽음 실패는 운영자가 할 수 있는 일이 없다 — 다음 진입 · 다음 메시지에서 다시 시도된다
      });

    return () => {
      isCancelled = true;
    };
  }, [queryClient, threadId, latestIncomingId]);
}
