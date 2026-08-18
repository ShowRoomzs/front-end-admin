import { queryClient } from "@/common/lib/queryClient";
import {
  NOTICES_QUERY_KEY,
  NOTICE_DETAIL_QUERY_KEY,
} from "@/features/notice/constants/queryKey";
import { noticeService } from "@/features/notice/services/noticeService";
import type {
  NoticeFormRequest,
  NoticeListParams,
} from "@/features/notice/types/notice";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useGetNoticeList(params: NoticeListParams) {
  return useQuery({
    queryKey: [NOTICES_QUERY_KEY, params],
    queryFn: () => noticeService.getNoticeList(params),
  });
}

export function useGetNoticeDetail(noticeId: number) {
  return useQuery({
    queryKey: [NOTICE_DETAIL_QUERY_KEY, noticeId],
    queryFn: () => noticeService.getNoticeDetail(noticeId),
    enabled: Number.isFinite(noticeId),
  });
}

function invalidateList() {
  queryClient.invalidateQueries({ queryKey: [NOTICES_QUERY_KEY] });
}

export function useCreateNotice() {
  return useMutation({
    mutationFn: (data: NoticeFormRequest) => noticeService.createNotice(data),
    onSuccess: invalidateList,
  });
}

export function useUpdateNotice() {
  return useMutation({
    mutationFn: ({
      noticeId,
      data,
    }: {
      noticeId: number;
      data: NoticeFormRequest;
    }) => noticeService.updateNotice(noticeId, data),
    onSuccess: (_response, { noticeId }) => {
      queryClient.invalidateQueries({
        queryKey: [NOTICE_DETAIL_QUERY_KEY, noticeId],
      });
      invalidateList();
    },
  });
}

/**
 * 게시 종료 / 재게시 — 상태 전이는 **이 두 훅에서만** 일어난다.
 *
 * 폼 저장(useUpdateNotice)은 상태를 건드리지 않는다(§20-2). 두 경로를 섞으면
 * 게시 종료 상태에서 문구만 고쳐 두려던 저장이 곧바로 노출로 이어진다.
 */
export function useEndNotice() {
  return useMutation({
    mutationFn: (noticeId: number) => noticeService.endNotice(noticeId),
    onSuccess: (_response, noticeId) => {
      queryClient.invalidateQueries({
        queryKey: [NOTICE_DETAIL_QUERY_KEY, noticeId],
      });
      invalidateList();
    },
  });
}

export function usePublishNotice() {
  return useMutation({
    mutationFn: (noticeId: number) => noticeService.publishNotice(noticeId),
    onSuccess: (_response, noticeId) => {
      queryClient.invalidateQueries({
        queryKey: [NOTICE_DETAIL_QUERY_KEY, noticeId],
      });
      invalidateList();
    },
  });
}
