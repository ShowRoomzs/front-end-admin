import { ApiNotReadyError, DEV_MOCK_ENABLED } from "@/common/utils/devMock";
import {
  mockCorrectDeliveredAt,
  mockForceCancel,
  mockGetDetail,
  mockGetFilterOptions,
  mockGetList,
  mockGetSummary,
  mockOpenReturn,
  mockProxyInvoice,
  mockRefund,
  mockToday,
} from "@/features/order/services/orderMock";
import type {
  OrderCorrectDeliveredAtRequest,
  OrderDetail,
  OrderFilterOptions,
  OrderForceCancelRequest,
  OrderListQuery,
  OrderListResponse,
  OrderOpenReturnRequest,
  OrderProxyInvoiceRequest,
  OrderRefundRequest,
  OrderTabSummary,
} from "@/features/order/types";

const FEATURE = "주문 조회";

/**
 * 어드민 주문 API — **백엔드에 아직 없다.** 개발 서버에서만 목업이 채우고 배포본은 「준비 중」이다.
 * API가 생기면 각 함수의 본문만 `apiInstance` 호출로 바꾼다(엔드포인트 후보는 각 함수 주석).
 */
export const orderService = {
  /** 결제일 프리셋의 기준일 — 목업은 시안 기준일(2026.09.16)로 고정한다 */
  getToday: (): Date => (DEV_MOCK_ENABLED ? mockToday() : new Date()),

  /** GET /admin/orders — 탭·상태·검색·기간·상세 조건·정렬·페이지 */
  getList: async (query: OrderListQuery): Promise<OrderListResponse> => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError(FEATURE);
    return mockGetList(query);
  },

  /** GET /admin/orders/summary — 탭 · 상태 셀렉트 건수(필터와 무관한 전체 기준) */
  getSummary: async (): Promise<OrderTabSummary> => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError(FEATURE);
    return mockGetSummary();
  },

  /** GET /admin/orders/filter-options — 브랜드 · 공구(브랜드 종속) · 인플루언서 · 결제수단 */
  getFilterOptions: async (): Promise<OrderFilterOptions> => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError(FEATURE);
    return mockGetFilterOptions();
  },

  /** GET /admin/orders/{orderNo} */
  getDetail: async (orderNo: string): Promise<OrderDetail> => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError(FEATURE);
    return mockGetDetail(orderNo);
  },

  /** POST /admin/orders/{orderNo}/proxy-invoice — 송장 대행 등록 */
  proxyInvoice: async (orderNo: string, body: OrderProxyInvoiceRequest) => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError(FEATURE);
    return mockProxyInvoice(orderNo, body);
  },

  /** POST /admin/orders/{orderNo}/delivered-at — 배송완료일 정정 */
  correctDeliveredAt: async (
    orderNo: string,
    body: OrderCorrectDeliveredAtRequest
  ) => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError(FEATURE);
    return mockCorrectDeliveredAt(orderNo, body);
  },

  /** POST /admin/orders/{orderNo}/refund-requests — 운영자 사유 환불(환불 대기 편입) */
  refund: async (orderNo: string, body: OrderRefundRequest) => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError(FEATURE);
    return mockRefund(orderNo, body);
  },

  /** POST /admin/orders/{orderNo}/open-return — 구매확정 후 하자 · 반품 대신 열기 */
  openReturn: async (orderNo: string, body: OrderOpenReturnRequest) => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError(FEATURE);
    return mockOpenReturn(orderNo, body);
  },

  /** POST /admin/orders/{orderNo}/force-cancel — 직권 취소(배송 전 하위주문) */
  forceCancel: async (orderNo: string, body: OrderForceCancelRequest) => {
    if (!DEV_MOCK_ENABLED) throw new ApiNotReadyError(FEATURE);
    return mockForceCancel(orderNo, body);
  },
};
