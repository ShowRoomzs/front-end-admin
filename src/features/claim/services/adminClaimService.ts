import { apiInstance } from "@/common/lib/apiInstance";
import type { PageResponse } from "@/common/types/page";
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams";
import type {
  ClaimActionRequest,
  ClaimActionResponse,
  ClaimDetail,
  ClaimListItem,
  ClaimListQuery,
  ClaimSummary,
} from "@/features/claim/types";

const BASE = "/admin/claims";

/** 어드민 반품·교환 API — 백엔드 `AdminClaimController`와 1:1 */
export const adminClaimService = {
  /** 탭 · 유형(`types` 반복) · 검색 · 정렬 · 페이지 */
  getList: async (query: ClaimListQuery) => {
    const { data } = await apiInstance.get<PageResponse<ClaimListItem>>(BASE, {
      params: paramsToSearchParams(query),
    });
    return data;
  },

  /** KPI · 탭 · 유형 건수 · 반려 이의 건수(사이드바 배지) */
  getSummary: async () => {
    const { data } = await apiInstance.get<ClaimSummary>(`${BASE}/summary`);
    return data;
  },

  getDetail: async (claimId: number) => {
    const { data } = await apiInstance.get<ClaimDetail>(`${BASE}/${claimId}`);
    return data;
  },

  /** B2 반려 이의 인용 → 운영자 사유 환불 편입. 금액은 서버 계산 */
  acceptDispute: async (claimId: number, body: ClaimActionRequest) => {
    const { data } = await apiInstance.post<ClaimActionResponse>(
      `${BASE}/${claimId}/dispute-acceptance`,
      body
    );
    return data;
  },

  /** 검수 무응답 → 운영자 사유 환불 편입. 금액은 서버 계산 */
  refundUnanswered: async (claimId: number, body: ClaimActionRequest) => {
    const { data } = await apiInstance.post<ClaimActionResponse>(
      `${BASE}/${claimId}/refund-tasks`,
      body
    );
    return data;
  },
};
