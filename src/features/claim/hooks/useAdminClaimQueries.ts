import { DEV_MOCK_ENABLED } from "@/common/utils/devMock";
import { ADMIN_CLAIM_QUERY_KEYS } from "@/features/claim/constants/queryKeys";
import { adminClaimService } from "@/features/claim/services/adminClaimService";
import type { ClaimListParams } from "@/features/claim/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

/**
 * 백엔드 API가 없다 — 배포본에서는 요청 자체를 보내지 않는다(화면이 「준비 중」을 띄운다).
 * 화면은 devMock을 모르므로 이 값으로 준비 여부를 묻는다.
 */
export const CLAIM_API_AVAILABLE = DEV_MOCK_ENABLED;

export function useGetClaimList(params: ClaimListParams) {
  return useQuery({
    queryKey: [ADMIN_CLAIM_QUERY_KEYS.LIST, params],
    queryFn: () => adminClaimService.getList(params),
    enabled: CLAIM_API_AVAILABLE,
    // 탭을 옮길 때 표가 깜빡이며 접히지 않게 직전 결과를 붙잡는다
    placeholderData: keepPreviousData,
  });
}

/** 탭 건수 · 사이드바 배지 */
export function useGetClaimSummary() {
  return useQuery({
    queryKey: [ADMIN_CLAIM_QUERY_KEYS.SUMMARY],
    queryFn: adminClaimService.getSummary,
    enabled: CLAIM_API_AVAILABLE,
    staleTime: 10_000,
  });
}

export function useGetClaimDetail(claimNo: string | null) {
  return useQuery({
    queryKey: [ADMIN_CLAIM_QUERY_KEYS.DETAIL, claimNo],
    queryFn: () => adminClaimService.getDetail(claimNo as string),
    enabled: CLAIM_API_AVAILABLE && claimNo !== null,
  });
}
