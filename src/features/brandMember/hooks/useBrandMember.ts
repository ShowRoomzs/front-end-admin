import { BRAND_MEMBER_QUERY_KEYS } from "@/features/brandMember/constants/params";
import { adminBrandService } from "@/features/brandMember/services/adminBrandService";
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

export function useGetBrandMemberList(params: MemberListParams) {
  return useQuery({
    queryKey: [BRAND_MEMBER_QUERY_KEYS.LIST, params],
    queryFn: () => adminBrandService.getList(params),
    placeholderData: keepPreviousData,
  });
}

export function useGetBrandMemberDetail(marketId: number) {
  return useQuery({
    queryKey: [BRAND_MEMBER_QUERY_KEYS.DETAIL, marketId],
    queryFn: () => adminBrandService.getDetail(marketId),
    enabled: Number.isFinite(marketId) && marketId > 0,
    retry: false,
  });
}

/** 사유 목록은 거의 바뀌지 않지만 정지 모달의 이의 신청 기한 미리보기가 날짜를 따라가 오래 두지 않는다 */
export function useGetBrandReasonOptions() {
  return useQuery({
    queryKey: [BRAND_MEMBER_QUERY_KEYS.REASON_OPTIONS],
    queryFn: adminBrandService.getReasonOptions,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetBrandHistories(
  marketId: number,
  page: number,
  size: number,
  enabled: boolean
) {
  return useQuery({
    queryKey: [BRAND_MEMBER_QUERY_KEYS.HISTORIES, marketId, page, size],
    queryFn: () => adminBrandService.getHistories(marketId, page, size),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useGetBrandMemos(marketId: number, enabled: boolean) {
  return useQuery({
    queryKey: [BRAND_MEMBER_QUERY_KEYS.MEMOS, marketId],
    queryFn: () => adminBrandService.getMemos(marketId),
    enabled,
  });
}

export function useGetBrandConnectedCreators(
  marketId: number,
  enabled: boolean
) {
  return useQuery({
    queryKey: [BRAND_MEMBER_QUERY_KEYS.CONNECTED_CREATORS, marketId],
    queryFn: () => adminBrandService.getConnectedCreators(marketId),
    enabled,
  });
}

/** 최근 문의 — 서버 없음. 배포본은 실패(ApiNotReadyError)로 끝나 「준비 중」을 그린다 */
export function useGetBrandRecentInquiries(marketId: number) {
  return useQuery({
    queryKey: [BRAND_MEMBER_QUERY_KEYS.RECENT_INQUIRIES, marketId],
    queryFn: () => adminBrandService.getRecentInquiries(marketId),
    enabled: Number.isFinite(marketId) && marketId > 0,
    retry: false,
  });
}

/**
 * 조치 · 메모 — 응답(레일)을 덮어쓰지 않고 상세 · 목록 · 이력 · 메모를 다시 읽는다.
 * 정지 · 승인은 좌측 카드(파기 · 지급 정지 중 · 미정산액)까지 바뀌어 레일만 갈아 끼우면 화면이 어긋난다.
 */
export function useBrandMemberActions(marketId: number) {
  const queryClient = useQueryClient();
  const refresh = () =>
    Promise.all(
      [
        BRAND_MEMBER_QUERY_KEYS.DETAIL,
        BRAND_MEMBER_QUERY_KEYS.LIST,
        BRAND_MEMBER_QUERY_KEYS.HISTORIES,
        BRAND_MEMBER_QUERY_KEYS.MEMOS,
        BRAND_MEMBER_QUERY_KEYS.CONNECTED_CREATORS,
      ].map((key) => queryClient.invalidateQueries({ queryKey: [key] }))
    );

  const suspend = useMutation({
    mutationFn: (payload: MemberSuspendPayload) =>
      adminBrandService.suspend(marketId, payload),
    onSettled: refresh,
  });
  const release = useMutation({
    mutationFn: (payload: MemberReleasePayload) =>
      adminBrandService.release(marketId, payload),
    onSettled: refresh,
  });
  const approve = useMutation({
    mutationFn: (requestId: number) =>
      adminBrandService.approveWithdrawal(marketId, requestId),
    onSettled: refresh,
  });
  const reject = useMutation({
    mutationFn: (args: {
      requestId: number;
      payload: MemberWithdrawalRejectPayload;
    }) =>
      adminBrandService.rejectWithdrawal(
        marketId,
        args.requestId,
        args.payload
      ),
    onSettled: refresh,
  });
  const createMemo = useMutation({
    mutationFn: (content: string) =>
      adminBrandService.createMemo(marketId, content),
    onSettled: refresh,
  });
  const updateMemo = useMutation({
    mutationFn: (args: { memoId: number; content: string }) =>
      adminBrandService.updateMemo(marketId, args.memoId, args.content),
    onSettled: refresh,
  });
  const deleteMemo = useMutation({
    mutationFn: (memoId: number) =>
      adminBrandService.deleteMemo(marketId, memoId),
    onSettled: refresh,
  });

  return {
    suspend,
    release,
    approve,
    reject,
    createMemo,
    updateMemo,
    deleteMemo,
    refresh,
  };
}
