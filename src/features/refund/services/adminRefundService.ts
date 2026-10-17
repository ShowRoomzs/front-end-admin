import { apiInstance } from "@/common/lib/apiInstance";
import type { PageResponse } from "@/common/types/page";
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams";
import type {
  RefundDetail,
  RefundExecuteResponse,
  RefundItem,
  RefundListParams,
  RefundManualCompleteRequest,
  RefundSummary,
  RefundVoidRequest,
} from "@/features/refund/types";

const BASE = "/admin/refunds";

/**
 * 어드민 환불 API — 백엔드 `AdminRefundController`와 1:1.
 * 완료 탭 기간(`days`)은 보내지 않는다 — 목록 · 요약 모두 서버 기본(30일)을 써야 탭 숫자 = 목록 건수다.
 */
export const adminRefundService = {
  getList: async (params: RefundListParams) => {
    const { data } = await apiInstance.get<PageResponse<RefundItem>>(BASE, {
      params: paramsToSearchParams(params),
    });
    return data;
  },

  getSummary: async () => {
    const { data } = await apiInstance.get<RefundSummary>(`${BASE}/summary`);
    return data;
  },

  /** 다이얼로그가 실패를 본문에 직접 그리므로 공용 에러 토스트는 끈다 */
  getDetail: async (refundTaskId: number) => {
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
