import {
  ApiNotReadyError,
  DEV_MOCK_ENABLED,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock";
import { claimMock } from "@/features/claim/services/claimMock";
import type {
  ClaimDetail,
  ClaimListParams,
  ClaimListResponse,
  ClaimSummary,
  OperatorRefundRequest,
  OperatorRefundResponse,
} from "@/features/claim/types";

/*
  어드민 반품·교환 API — **백엔드에 아직 없다.**
  DEV에서는 `claimMock`(메모리 저장소)을 돌려주고, 배포본에서는 `ApiNotReadyError`로 화면이 「준비 중」을 띄운다.
  API가 생기면 각 함수 본문만 `apiInstance` 호출로 바꾼다 — 필요한 엔드포인트는 아래에 적었다.

  시나리오(`?mock=`)는 첫 호출 때 한 번만 잡는다 — 목록 조건이 주소를 다시 쓰면 `mock` 값이 사라지기 때문이다.
*/
const FEATURE = "반품·교환";
let cachedScenario: string | null | undefined;
function scenario(): string | null {
  if (cachedScenario === undefined) cachedScenario = mockScenario();
  return cachedScenario;
}

export const adminClaimService = {
  /** GET /admin/claims — 탭 · 유형 · 검색어 · 정렬 · 페이지 */
  getList: async (params: ClaimListParams): Promise<ClaimListResponse> => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError(FEATURE);
    if (scenario() === "error") {
      await mockDelay(null);
      throw new Error("목록을 불러오지 못했습니다.");
    }
    return mockDelay(claimMock.list(params, scenario()));
  },

  /** GET /admin/claims/summary — 탭 건수 · 지연 · 이의(사이드바 배지) */
  getSummary: async (): Promise<ClaimSummary> => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError(FEATURE);
    return mockDelay(claimMock.summary(scenario()), 120);
  },

  /** GET /admin/claims/{claimNo} */
  getDetail: async (claimNo: string): Promise<ClaimDetail> => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError(FEATURE);
    return mockDelay(claimMock.detail(claimNo), 180);
  },

  /** POST /admin/claims/{claimNo}/operator-refund — 반려 이의 인용(운영자 사유 환불) */
  refundByOperator: async (
    claimNo: string,
    body: OperatorRefundRequest
  ): Promise<OperatorRefundResponse> => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError(FEATURE);
    return mockDelay(claimMock.refundByOperator(claimNo, body), 400);
  },
};
