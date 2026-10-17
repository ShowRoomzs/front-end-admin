import {
  CHANNEL_PAGE_SIZE,
  LIST_POLL_INTERVAL,
  MESSAGE_PAGE_SIZE,
  MESSAGE_POLL_INTERVAL,
} from "@/features/thread/constants/params";
import { ADMIN_THREAD_QUERY_KEYS } from "@/features/thread/constants/queryKeys";
import { adminThreadService } from "@/features/thread/services/adminThreadService";
import type {
  AdminChannelTab,
  AdminIssueState,
  ChannelListItem,
  MessageItem,
} from "@/features/thread/types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

/**
 * 좌측 목록 — 정렬(최근 메시지순 · 메시지 없는 채널은 맨 아래)은 서버가 확정한다.
 * 채널은 회원 수만큼 있어 페이지를 이어 붙인다(아래로 스크롤하면 다음 페이지).
 */
export function useGetChannelList(params: {
  tab: AdminChannelTab;
  state: AdminIssueState;
  keyword: string;
  enabled: boolean;
}) {
  const { tab, state, keyword, enabled } = params;
  const query = useInfiniteQuery({
    queryKey: [
      ADMIN_THREAD_QUERY_KEYS.LIST,
      tab,
      tab === "ISSUE" ? state : null,
      keyword,
    ],
    queryFn: ({ pageParam }) =>
      adminThreadService.getList({
        tab,
        state: tab === "ISSUE" ? state : undefined,
        keyword: keyword || undefined,
        page: pageParam,
        size: CHANNEL_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasNext ? lastPage.pageInfo.currentPage + 1 : undefined,
    enabled,
    refetchInterval: LIST_POLL_INTERVAL,
  });

  const items = useMemo<Array<ChannelListItem>>(
    () => query.data?.pages.flatMap((page) => page.content) ?? [],
    [query.data]
  );

  return { ...query, items };
}

/** 헤더 · 정보 바 · 이슈 패널 — 스레드 진입 시 1회(설계서 3-4) */
export function useGetChannelInfo(threadId: number | null) {
  return useQuery({
    queryKey: [ADMIN_THREAD_QUERY_KEYS.INFO, threadId],
    queryFn: () => adminThreadService.getInfo(threadId as number),
    enabled: threadId !== null,
    retry: false,
  });
}

/**
 * 메시지 — 최신순 커서 페이징. 화면은 오래된 것부터 아래로 쌓이므로 뒤집어 돌려준다.
 * 폴링으로 새 메시지를 받는다(실시간 푸시 없음).
 */
export function useGetThreadMessages(threadId: number | null) {
  const query = useInfiniteQuery({
    queryKey: [ADMIN_THREAD_QUERY_KEYS.MESSAGES, threadId],
    queryFn: ({ pageParam }) =>
      adminThreadService.getMessages(threadId as number, {
        cursor: pageParam,
        size: MESSAGE_PAGE_SIZE,
      }),
    enabled: threadId !== null,
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
    refetchInterval: MESSAGE_POLL_INTERVAL,
    retry: false,
  });

  const messages = useMemo<Array<MessageItem>>(() => {
    const newestFirst = query.data?.pages.flatMap((page) => page.content) ?? [];
    return [...newestFirst].reverse();
  }, [query.data]);

  return { ...query, messages };
}
