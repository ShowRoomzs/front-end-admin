import {
  INFLUENCER_MEMBER_QUERY_KEYS,
  RECENT_SETTLEMENT_SIZE,
} from "@/features/influencerMember/constants/params";
import { adminCreatorService } from "@/features/influencerMember/services/adminCreatorService";
import type {
  AdminCreatorDetail,
  CreatorPrivacyAccessReason,
} from "@/features/influencerMember/types";
import type {
  MemberListParams,
  MemberReleasePayload,
  MemberSuspendPayload,
  MemberWithdrawalRejectPayload,
} from "@/features/memberShared/types";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const K = INFLUENCER_MEMBER_QUERY_KEYS;

function validId(creatorId: number) {
  return Number.isFinite(creatorId) && creatorId > 0;
}

export function useGetInfluencerMemberList(params: MemberListParams) {
  return useQuery({
    queryKey: [K.LIST, params],
    queryFn: () => adminCreatorService.getList(params),
    placeholderData: keepPreviousData,
  });
}

export function useGetInfluencerMemberDetail(creatorId: number) {
  return useQuery({
    queryKey: [K.DETAIL, creatorId],
    queryFn: () => adminCreatorService.getDetail(creatorId),
    enabled: validId(creatorId),
    retry: false,
  });
}

export function useGetInfluencerReasonOptions() {
  return useQuery({
    queryKey: [K.REASON_OPTIONS],
    queryFn: adminCreatorService.getReasonOptions,
    staleTime: 5 * 60 * 1000,
  });
}

/** 하단 카드는 각자 API — 상세가 뜬 뒤에 부른다 */
export function useInfluencerBottomCards(creatorId: number, enabled: boolean) {
  const on = enabled && validId(creatorId);
  const overview = useQuery({
    queryKey: [K.OVERVIEW, creatorId],
    queryFn: () => adminCreatorService.getOverview(creatorId),
    enabled: on,
  });
  const settlements = useQuery({
    queryKey: [K.SETTLEMENTS, creatorId],
    queryFn: () =>
      adminCreatorService.getSettlements(creatorId, RECENT_SETTLEMENT_SIZE),
    enabled: on,
  });
  const contracts = useQuery({
    queryKey: [K.CONTRACTS, creatorId],
    queryFn: () => adminCreatorService.getContracts(creatorId),
    enabled: on,
  });
  const connections = useQuery({
    queryKey: [K.CONNECTIONS, creatorId],
    queryFn: () => adminCreatorService.getConnections(creatorId),
    enabled: on,
  });
  const memos = useQuery({
    queryKey: [K.MEMOS, creatorId],
    queryFn: () => adminCreatorService.getMemos(creatorId),
    enabled: on,
  });
  return { overview, settlements, contracts, connections, memos };
}

export function useGetInfluencerHistories(
  creatorId: number,
  page: number,
  size: number,
  enabled: boolean
) {
  return useQuery({
    queryKey: [K.HISTORIES, creatorId, page, size],
    queryFn: () => adminCreatorService.getHistories(creatorId, page, size),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** 조치 · 메모 · 마스킹 — 끝나면 관련 조회를 다시 읽는다(응답 상세는 바로 반영) */
export function useInfluencerMemberActions(creatorId: number) {
  const queryClient = useQueryClient();
  const refresh = () =>
    Promise.all(
      Object.values(K)
        .filter((key) => key !== K.REASON_OPTIONS)
        .map((key) => queryClient.invalidateQueries({ queryKey: [key] }))
    );
  const applyDetail = (detail: AdminCreatorDetail) =>
    queryClient.setQueryData([K.DETAIL, creatorId], detail);

  const suspend = useMutation({
    mutationFn: (payload: MemberSuspendPayload) =>
      adminCreatorService.suspend(creatorId, payload),
    onSuccess: applyDetail,
    onSettled: refresh,
  });
  const release = useMutation({
    mutationFn: (payload: MemberReleasePayload) =>
      adminCreatorService.release(creatorId, payload),
    onSuccess: applyDetail,
    onSettled: refresh,
  });
  const approve = useMutation({
    mutationFn: (requestId: number) =>
      adminCreatorService.approveWithdrawal(creatorId, requestId),
    onSuccess: applyDetail,
    onSettled: refresh,
  });
  const reject = useMutation({
    mutationFn: (args: {
      requestId: number;
      payload: MemberWithdrawalRejectPayload;
    }) =>
      adminCreatorService.rejectWithdrawal(
        creatorId,
        args.requestId,
        args.payload
      ),
    onSuccess: applyDetail,
    onSettled: refresh,
  });
  const unmask = useMutation({
    mutationFn: (reason: CreatorPrivacyAccessReason) =>
      adminCreatorService.unmask(creatorId, reason),
    onSuccess: applyDetail,
    onSettled: () => queryClient.invalidateQueries({ queryKey: [K.HISTORIES] }),
  });
  const lock = useMutation({
    mutationFn: () => adminCreatorService.lock(creatorId),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: [K.DETAIL, creatorId] }),
  });
  const createMemo = useMutation({
    mutationFn: (content: string) =>
      adminCreatorService.createMemo(creatorId, content),
    onSettled: refresh,
  });
  const updateMemo = useMutation({
    mutationFn: (args: { memoId: number; content: string }) =>
      adminCreatorService.updateMemo(creatorId, args.memoId, args.content),
    onSettled: refresh,
  });
  const deleteMemo = useMutation({
    mutationFn: (memoId: number) =>
      adminCreatorService.deleteMemo(creatorId, memoId),
    onSettled: refresh,
  });

  return {
    suspend,
    release,
    approve,
    reject,
    unmask,
    lock,
    createMemo,
    updateMemo,
    deleteMemo,
  };
}
