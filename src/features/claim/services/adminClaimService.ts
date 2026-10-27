import { apiInstance } from "@/common/lib/apiInstance";
import type { PageResponse } from "@/common/types/page";
import {
  DEV_MOCK_ENABLED,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock";
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

/*
  DEV 목업 시나리오(`?mock=<값>` · 개발 서버 전용 · 배포본은 항상 실호출):
  - `claim`          목록 · 요약 4건 + 행을 누르면 그 건의 상세(아래 넷)
  - `claim-b1`       B1 입고·검수 지연 — 최초 배송비 차감 근거 보조줄 · 자동 입고 규칙(N영업일)
  - `claim-b2`       B2 반려 보류 · 소비자 이의 — 인용 시 운임 정산(선불 운임 환급)
  - `claim-b4`       B4 운영자 개설 — 브랜드 귀책 「착불 · 차감 없음」 · 귀책 변경 시 착불 운임 청구
  - `claim-overturn` 교환 사유 번복 — 검수 판정 · 운임 정산 블록(자동 입고 포함)
  `inspection` · `reshipFeeCharged`는 main에 있고 개발 서버 미배포, `deductionReason` · `disputeFreightRefund`는
  서버에 없다(백엔드 요청). 서버가 배포되면 이 분기와 `mocks/claimMock.ts`를 지운다.
*/
function claimScenario() {
  const scenario = mockScenario();
  return DEV_MOCK_ENABLED && scenario?.startsWith("claim") ? scenario : null;
}

/** 어드민 반품·교환 API — 백엔드 `AdminClaimController`와 1:1 */
export const adminClaimService = {
  /** 탭 · 유형(`types` 반복) · 검색 · 정렬 · 페이지 */
  getList: async (query: ClaimListQuery) => {
    if (claimScenario()) {
      const { mockClaimList } = await import("../mocks/claimMock");
      return mockDelay(mockClaimList());
    }
    const { data } = await apiInstance.get<PageResponse<ClaimListItem>>(BASE, {
      params: paramsToSearchParams(query),
    });
    return data;
  },

  /** KPI · 탭 · 유형 건수 · 반려 이의 건수(사이드바 배지) */
  getSummary: async () => {
    if (claimScenario()) {
      const { mockClaimSummary } = await import("../mocks/claimMock");
      return mockDelay(mockClaimSummary());
    }
    const { data } = await apiInstance.get<ClaimSummary>(`${BASE}/summary`);
    return data;
  },

  getDetail: async (claimId: number) => {
    const scenario = claimScenario();
    if (scenario) {
      const { mockClaimByClaimId, mockClaimDetail } =
        await import("../mocks/claimMock");
      const fixed = scenario.replace(/^claim-?/, "");
      return mockDelay(
        fixed
          ? mockClaimDetail(fixed)
          : (mockClaimByClaimId(claimId) ?? mockClaimDetail("b1"))
      );
    }
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
