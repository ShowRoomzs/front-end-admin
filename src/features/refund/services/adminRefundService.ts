import { ApiNotReadyError, DEV_MOCK_ENABLED } from "@/common/utils/devMock";
import {
  mockDetail,
  mockExecute,
  mockList,
  mockRetry,
  mockSummary,
} from "@/features/refund/services/refundMock";
import type {
  RefundExecuteRequest,
  RefundListParams,
} from "@/features/refund/types";

/*
  어드민 환불 API — 아직 없다. 아래 함수의 본문만 apiInstance 호출로 바꾸면 된다.
  (제안 엔드포인트)
    GET  /admin/refunds?tab&route&keyword&sort&page&size   목록 + 요약
    GET  /admin/refunds/summary                              탭 카운트 · 배지
    GET  /admin/refunds/{id}                                 다이얼로그 상세
    POST /admin/refunds/{id}/execute  { confirmedAmount }    운영자 사유 환불 집행
    POST /admin/refunds/{id}/retry                           PG 실패 건 재시도
*/
const FEATURE = "환불 관리";

export const adminRefundService = {
  getList: async (params: RefundListParams) => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError(FEATURE);
    return mockList(params);
  },

  getSummary: async () => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError(FEATURE);
    return mockSummary();
  },

  getDetail: async (refundId: number) => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError(FEATURE);
    return mockDetail(refundId);
  },

  execute: async (refundId: number, body: RefundExecuteRequest) => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError(FEATURE);
    return mockExecute(refundId, body);
  },

  retry: async (refundId: number) => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError(FEATURE);
    return mockRetry(refundId);
  },
};
