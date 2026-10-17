import { ADMIN_CLAIM_QUERY_KEYS } from "@/features/claim/constants/queryKeys";
import { adminClaimService } from "@/features/claim/services/adminClaimService";
import type { ClaimListQuery, ClaimListView } from "@/features/claim/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export function useGetClaimList(query: ClaimListQuery) {
  return useQuery({
    queryKey: [ADMIN_CLAIM_QUERY_KEYS.LIST, query],
    queryFn: async (): Promise<ClaimListView> => ({
      ...(await adminClaimService.getList(query)),
      tab: query.tab,
    }),
    // 탭을 옮길 때 표가 깜빡이며 접히지 않게 직전 결과를 붙잡는다 —
    // 붙잡은 동안엔 행이 직전 탭 것이라, 결과에 실은 tab으로 열 구성을 맞춘다(ClaimTable)
    placeholderData: keepPreviousData,
  });
}

/** 탭 건수 · 상단 줄 · 사이드바 배지(`disputeCount`) */
export function useGetClaimSummary() {
  return useQuery({
    queryKey: [ADMIN_CLAIM_QUERY_KEYS.SUMMARY],
    queryFn: adminClaimService.getSummary,
    staleTime: 10_000,
  });
}

export function useGetClaimDetail(claimId: number | null) {
  return useQuery({
    queryKey: [ADMIN_CLAIM_QUERY_KEYS.DETAIL, claimId],
    queryFn: () => adminClaimService.getDetail(claimId as number),
    enabled: claimId !== null,
  });
}
