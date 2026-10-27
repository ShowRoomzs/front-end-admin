import {
  POST_QUERY_KEYS,
  POST_SUMMARY_POLL_INTERVAL,
} from "@/features/post/constants/queryKeys";
import { adminPostService } from "@/features/post/services/adminPostService";
import type {
  ActionNoteBody,
  AdminPostListParams,
  AppealReviewBody,
  PostDetailNavParams,
  SuspendPostBody,
} from "@/features/post/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useGetAdminPostList(params: AdminPostListParams) {
  return useQuery({
    queryKey: [POST_QUERY_KEYS.LIST, params],
    queryFn: () => adminPostService.getList(params),
  });
}

/** 탭 건수 · GNB 배지(`actionRequired`). 셸과 목록이 같은 키를 쓴다 */
export function useGetAdminPostSummary() {
  return useQuery({
    queryKey: [POST_QUERY_KEYS.SUMMARY],
    queryFn: adminPostService.getSummary,
    refetchInterval: POST_SUMMARY_POLL_INTERVAL,
    staleTime: 10_000,
  });
}

export function useGetAdminPostDetail(
  postId: number,
  nav: PostDetailNavParams
) {
  return useQuery({
    queryKey: [POST_QUERY_KEYS.DETAIL, postId, nav],
    queryFn: () => adminPostService.getDetail(postId, nav),
    enabled: Number.isFinite(postId) && postId > 0,
    retry: false,
  });
}

/** 노출 중지 모달 · 신고 유형 기준 안내 — 코드 목록은 거의 바뀌지 않는다 */
export function useGetSuspensionReasons(enabled = true) {
  return useQuery({
    queryKey: [POST_QUERY_KEYS.SUSPENSION_REASONS],
    queryFn: adminPostService.getSuspensionReasons,
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useGetPolicyClauses(enabled = true) {
  return useQuery({
    queryKey: [POST_QUERY_KEYS.POLICY_CLAUSES],
    queryFn: adminPostService.getPolicyClauses,
    enabled,
    staleTime: 5 * 60_000,
  });
}

/**
 * 조치 — 성공하면 상세 · 목록 · 요약(탭 건수 · GNB 배지)을 함께 무효화한다.
 * 낙관적 갱신을 쓰지 않는다: 상태 · 기한 · 이력을 서버가 다시 계산해 내려준다.
 */
function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [POST_QUERY_KEYS.DETAIL] });
    queryClient.invalidateQueries({ queryKey: [POST_QUERY_KEYS.LIST] });
    queryClient.invalidateQueries({ queryKey: [POST_QUERY_KEYS.SUMMARY] });
  };
}

export function useSuspendPost() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (variables: { postId: number; body: SuspendPostBody }) =>
      adminPostService.suspend(variables.postId, variables.body),
    onSuccess: invalidate,
  });
}

export function useCloseReports() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (variables: { postId: number; body: ActionNoteBody }) =>
      adminPostService.closeReports(variables.postId, variables.body),
    onSuccess: invalidate,
  });
}

export function useCancelSuspension() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (variables: { postId: number; body: ActionNoteBody }) =>
      adminPostService.cancelSuspension(variables.postId, variables.body),
    onSuccess: invalidate,
  });
}

/** 신고 지목은 상세만 다시 받는다 — 목록 · 배지에는 영향이 없다 */
export function useSetImageFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      postId: number;
      imageId: number;
      flagged: boolean;
    }) =>
      adminPostService.setImageFlag(
        variables.postId,
        variables.imageId,
        variables.flagged
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [POST_QUERY_KEYS.DETAIL] }),
  });
}

export function useApproveAppeal() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (variables: { appealId: number; body: AppealReviewBody }) =>
      adminPostService.approveAppeal(variables.appealId, variables.body),
    onSuccess: invalidate,
  });
}

export function useRejectAppeal() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (variables: {
      appealId: number;
      body: Required<AppealReviewBody>;
    }) => adminPostService.rejectAppeal(variables.appealId, variables.body),
    onSuccess: invalidate,
  });
}
