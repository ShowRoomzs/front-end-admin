import {
  GROUP_BUY_QUERY_KEYS,
  GROUP_BUY_SUMMARY_POLL_INTERVAL,
} from "@/features/groupBuy/constants/params";
import { adminGroupBuyService } from "@/features/groupBuy/services/adminGroupBuyService";
import type {
  AdminGroupBuyListParams,
  DetailNavParams,
  EmergencySuspensionBody,
  IssueOpenBody,
  OpenRejectBody,
  PostHideBody,
  SuspensionNoticeBody,
  SuspensionWithdrawBody,
} from "@/features/groupBuy/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useGetAdminGroupBuyList(params: AdminGroupBuyListParams) {
  return useQuery({
    queryKey: [GROUP_BUY_QUERY_KEYS.LIST, params],
    queryFn: () => adminGroupBuyService.getList(params),
  });
}

/** 조치 큐 · 탭 카운트 · GNB 배지. 셸과 목록이 같은 키를 쓴다 */
export function useGetAdminGroupBuySummary() {
  return useQuery({
    queryKey: [GROUP_BUY_QUERY_KEYS.SUMMARY],
    queryFn: adminGroupBuyService.getSummary,
    refetchInterval: GROUP_BUY_SUMMARY_POLL_INTERVAL,
    staleTime: 10_000,
  });
}

export function useGetAdminGroupBuyDetail(
  groupBuyId: number,
  params: DetailNavParams
) {
  return useQuery({
    queryKey: [GROUP_BUY_QUERY_KEYS.DETAIL, groupBuyId, params],
    queryFn: () => adminGroupBuyService.getDetail(groupBuyId, params),
    enabled: Number.isFinite(groupBuyId) && groupBuyId > 0,
    retry: false,
  });
}

/** 사전 통지 모달(M6)을 열 때만 — 오늘 기준 3영업일 잠금은 서버가 계산한다 */
export function useGetNoticeOptions(groupBuyId: number, enabled: boolean) {
  return useQuery({
    queryKey: [GROUP_BUY_QUERY_KEYS.NOTICE_OPTIONS, groupBuyId],
    queryFn: () => adminGroupBuyService.getNoticeOptions(groupBuyId),
    enabled,
    staleTime: 0,
  });
}

/** 본문 대조 모달을 열 때만 — 그사이 인플루언서가 고쳤을 수 있어 열 때마다 새로 받는다 */
export function useGetPostRevisions(groupBuyId: number, enabled: boolean) {
  return useQuery({
    queryKey: [GROUP_BUY_QUERY_KEYS.POST_REVISIONS, groupBuyId],
    queryFn: () => adminGroupBuyService.getPostRevisions(groupBuyId),
    enabled,
    staleTime: 0,
  });
}

/**
 * 공구 판정 — 성공하면 상세·목록·요약(조치 큐·GNB 배지)을 함께 무효화한다.
 * 낙관적 갱신을 쓰지 않는다: 상태·권한·이력을 서버가 다시 계산해 내려준다.
 */
function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [GROUP_BUY_QUERY_KEYS.DETAIL] });
    queryClient.invalidateQueries({ queryKey: [GROUP_BUY_QUERY_KEYS.LIST] });
    queryClient.invalidateQueries({ queryKey: [GROUP_BUY_QUERY_KEYS.SUMMARY] });
  };
}

export function useApproveOpen() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (groupBuyId: number) =>
      adminGroupBuyService.approveOpen(groupBuyId),
    onSuccess: invalidate,
  });
}

export function useRejectOpen() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { groupBuyId: number; body: OpenRejectBody }) =>
      adminGroupBuyService.rejectOpen(v.groupBuyId, v.body),
    onSuccess: invalidate,
  });
}

export function useHidePost() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { groupBuyId: number; body: PostHideBody }) =>
      adminGroupBuyService.hidePost(v.groupBuyId, v.body),
    onSuccess: invalidate,
  });
}

export function useUnhidePost() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { groupBuyId: number; expectedRevisionNo: number }) =>
      adminGroupBuyService.unhidePost(v.groupBuyId, v.expectedRevisionNo),
    onSuccess: invalidate,
  });
}

export function useNoticeSuspension() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { groupBuyId: number; body: SuspensionNoticeBody }) =>
      adminGroupBuyService.noticeSuspension(v.groupBuyId, v.body),
    onSuccess: invalidate,
  });
}

export function useExecuteSuspension() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { groupBuyId: number; executionNote: string }) =>
      adminGroupBuyService.executeSuspension(v.groupBuyId, v.executionNote),
    onSuccess: invalidate,
  });
}

export function useWithdrawSuspension() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { groupBuyId: number; body: SuspensionWithdrawBody }) =>
      adminGroupBuyService.withdrawSuspension(v.groupBuyId, v.body),
    onSuccess: invalidate,
  });
}

export function useEmergencySuspend() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { groupBuyId: number; body: EmergencySuspensionBody }) =>
      adminGroupBuyService.emergencySuspend(v.groupBuyId, v.body),
    onSuccess: invalidate,
  });
}

export function useDecideRequest() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: {
      groupBuyId: number;
      requestId: number;
      decision: "approve" | "reject";
      decisionReason: string;
    }) =>
      v.decision === "approve"
        ? adminGroupBuyService.approveRequest(
            v.groupBuyId,
            v.requestId,
            v.decisionReason
          )
        : adminGroupBuyService.rejectRequest(
            v.groupBuyId,
            v.requestId,
            v.decisionReason
          ),
    onSuccess: invalidate,
  });
}

export function useOpenIssue() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { groupBuyId: number; body: IssueOpenBody }) =>
      adminGroupBuyService.openIssue(v.groupBuyId, v.body),
    onSuccess: invalidate,
  });
}

export function useConfirmSettlement() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (groupBuyId: number) =>
      adminGroupBuyService.confirmSettlement(groupBuyId),
    onSuccess: invalidate,
  });
}
