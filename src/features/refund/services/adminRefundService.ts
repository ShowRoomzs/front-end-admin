import { apiInstance } from "@/common/lib/apiInstance";
import type { PageResponse } from "@/common/types/page";
import {
  DEV_MOCK_ENABLED,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock";
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams";
import type {
  RefundDetail,
  RefundExecuteResponse,
  RefundItem,
  RefundListParams,
  RefundManualCompleteRequest,
  RefundSummary,
  RefundTransferCompleteRequest,
  RefundVoidRequest,
} from "@/features/refund/types";

const BASE = "/admin/refunds";

/*
  DEV 목업 시나리오(`?mock=refund` · 개발 서버 전용 · 배포본은 항상 실호출):
  - 집행 대기 탭 = A1 RFD-918(반려 이의 인용) + RFD-919(운임 환급 · 계좌 송금 · [송금 처리])
    · M1 운임 정산 줄 · M3 계좌 송금 처리(소비자 계좌 기본값 · 1:1 문의 #4527)
  - 완료 탭 = A3 RFD-914(재발송 배송비 · 교환 철회)
  계좌 송금(`method` · `transfer` · `transfer-complete`)은 main에 있고 개발 서버 미배포,
  M1 `freightAdjustment`는 서버에 없다(백엔드 요청). 백엔드 배포 후 이 분기와 `mocks/refundMock.ts`를 지운다.
*/
function refundScenario() {
  return DEV_MOCK_ENABLED && mockScenario() === "refund";
}

/**
 * 어드민 환불 API — 백엔드 `AdminRefundController`와 1:1.
 * 완료 탭 기간(`days`)은 보내지 않는다 — 목록 · 요약 모두 서버 기본(30일)을 써야 탭 숫자 = 목록 건수다.
 */
export const adminRefundService = {
  getList: async (params: RefundListParams) => {
    if (refundScenario()) {
      const { mockRefundList } = await import("../mocks/refundMock");
      return mockDelay(mockRefundList(params));
    }
    const { data } = await apiInstance.get<PageResponse<RefundItem>>(BASE, {
      params: paramsToSearchParams(params),
    });
    return data;
  },

  getSummary: async () => {
    if (refundScenario()) {
      const { mockRefundSummary } = await import("../mocks/refundMock");
      return mockDelay(mockRefundSummary());
    }
    const { data } = await apiInstance.get<RefundSummary>(`${BASE}/summary`);
    return data;
  },

  /** 다이얼로그가 실패를 본문에 직접 그리므로 공용 에러 토스트는 끈다 */
  getDetail: async (refundTaskId: number) => {
    if (refundScenario()) {
      const { mockRefundDetail } = await import("../mocks/refundMock");
      return mockDelay(mockRefundDetail(refundTaskId));
    }
    const { data } = await apiInstance.get<RefundDetail>(
      `${BASE}/${refundTaskId}`,
      { suppressErrorToast: true }
    );
    return data;
  },

  /** 집행 · 재시도 공용 — 본문 없음(금액 · 경로는 서버 값) */
  execute: async (refundTaskId: number) => {
    const { data } = await apiInstance.post<RefundExecuteResponse>(
      `${BASE}/${refundTaskId}/execute`
    );
    return data;
  },

  /**
   * M3 송금 완료 기록 — 운영자가 은행에서 직접 송금한 뒤 계좌 · 완료만 남긴다(시스템은 송금하지 않는다).
   * `POST /v1/admin/refunds/{refundTaskId}/transfer-complete`(main · 개발 서버 미배포 — 송금 행 자체가 배포 뒤에만 생긴다).
   */
  completeTransfer: async (
    refundTaskId: number,
    body: RefundTransferCompleteRequest
  ) => {
    if (refundScenario()) {
      // DEV 목업 — 기록만 흉내 낸다(백엔드 배포 후 삭제)
      const { mockRefundList } = await import("../mocks/refundMock");
      const row = mockRefundList({
        tab: "PENDING",
        route: "",
        keyword: "",
        sort: "LATEST",
        userId: "",
        page: 1,
        size: 20,
      }).content.find((item) => item.refundTaskId === refundTaskId);
      return mockDelay({
        ...(row as RefundItem),
        status: "DONE" as const,
        statusLabel: "송금 완료",
        transferable: false,
      });
    }
    const { data } = await apiInstance.post<RefundItem>(
      `${BASE}/${refundTaskId}/transfer-complete`,
      body
    );
    return data;
  },

  /** 편입 철회 — 시안에 자리가 없어 화면에서는 아직 부르지 않는다 */
  voidRefund: async (refundTaskId: number, body: RefundVoidRequest) => {
    const { data } = await apiInstance.post<RefundItem>(
      `${BASE}/${refundTaskId}/void`,
      body
    );
    return data;
  },

  /** 수동 완료 기록 — 시안에 자리가 없어 화면에서는 아직 부르지 않는다 */
  manualComplete: async (
    refundTaskId: number,
    body: RefundManualCompleteRequest
  ) => {
    const { data } = await apiInstance.post<RefundItem>(
      `${BASE}/${refundTaskId}/manual-complete`,
      body
    );
    return data;
  },
};
