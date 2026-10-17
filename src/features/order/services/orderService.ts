import { apiInstance } from "@/common/lib/apiInstance";
import type { PageResponse } from "@/common/types/page";
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams";
import type {
  AdminOrderDetail,
  AdminOrderListItem,
  AdminOrderListQuery,
  AdminOrderSummary,
  AdminOrderSummaryQuery,
  CancelCommand,
  CorrectDeliveredAtRequest,
  DefectClaimRequest,
  DefectClaimResponse,
  MarkDeliveredRequest,
  MarkLostRequest,
  OperatorRefundRequest,
  ShipmentRequest,
} from "@/features/order/types";

const BASE = "/admin/orders";
const groupPath = (deliveryGroupId: number, action: string) =>
  `${BASE}/groups/${deliveryGroupId}/${action}`;

/**
 * 어드민 주문 API — 백엔드 `AdminOrderController`와 1:1.
 * 조치는 전부 하위주문(`deliveryGroupId`) 단위이고, 성공하면 갱신된 주문 상세를 돌려준다(B6만 생성 id).
 */
export const orderService = {
  getList: async (query: AdminOrderListQuery) => {
    const { data } = await apiInstance.get<PageResponse<AdminOrderListItem>>(
      BASE,
      { params: paramsToSearchParams(query) }
    );
    return data;
  },

  /** 탭 건수 — 목록과 같은 조건(탭 · 상태 · 이상 유형 · 정렬 제외) */
  getSummary: async (query: AdminOrderSummaryQuery) => {
    const { data } = await apiInstance.get<AdminOrderSummary>(
      `${BASE}/summary`,
      { params: paramsToSearchParams(query) }
    );
    return data;
  },

  getDetail: async (orderId: number) => {
    const { data } = await apiInstance.get<AdminOrderDetail>(
      `${BASE}/${orderId}`
    );
    return data;
  },

  /**
   * 툴바 「처리 지연 N건」 — 06d가 소유하는 숫자라 예외 관리 요약의 `tabCounts.DELAY`만 읽는다.
   * 필터와 무관한 전체 건수다.
   */
  getDelayCount: async () => {
    const { data } = await apiInstance.get<{
      tabCounts: Record<string, number>;
    }>("/admin/order-exceptions/summary");
    return data.tabCounts.DELAY ?? 0;
  },

  /** 추적 정지 종결 — 분실 처리(화면 진입점은 아직 없다) */
  markLost: async (deliveryGroupId: number, body: MarkLostRequest) => {
    const { data } = await apiInstance.post<AdminOrderDetail>(
      groupPath(deliveryGroupId, "lost"),
      body
    );
    return data;
  },

  /** 추적 정지 종결 — 배송완료 처리(화면 진입점은 아직 없다) */
  markDelivered: async (
    deliveryGroupId: number,
    body: MarkDeliveredRequest
  ) => {
    const { data } = await apiInstance.post<AdminOrderDetail>(
      groupPath(deliveryGroupId, "delivered"),
      body
    );
    return data;
  },

  /** B3 배송완료일 정정 */
  correctDeliveredAt: async (
    deliveryGroupId: number,
    body: CorrectDeliveredAtRequest
  ) => {
    const { data } = await apiInstance.patch<AdminOrderDetail>(
      groupPath(deliveryGroupId, "delivered-at"),
      body
    );
    return data;
  },

  /** B4 운영자 대행 송장 등록 — 송장 형식 · 중복은 폼이 직접 그려서 토스트를 끈다 */
  registerShipment: async (deliveryGroupId: number, body: ShipmentRequest) => {
    const { data } = await apiInstance.post<AdminOrderDetail>(
      groupPath(deliveryGroupId, "shipment"),
      body,
      { suppressErrorToast: true }
    );
    return data;
  },

  /** B4 · B5 운영자 대행 직권 취소(미발송분) */
  cancel: async (deliveryGroupId: number, body: CancelCommand) => {
    const { data } = await apiInstance.post<AdminOrderDetail>(
      groupPath(deliveryGroupId, "cancel"),
      body
    );
    return data;
  },

  /** B5 운영자 사유 환불 편입 — 집행은 환불 관리 */
  enqueueRefund: async (
    deliveryGroupId: number,
    body: OperatorRefundRequest
  ) => {
    const { data } = await apiInstance.post<AdminOrderDetail>(
      groupPath(deliveryGroupId, "refund-tasks"),
      body
    );
    return data;
  },

  /** B6 구매확정 후 하자 · 반품 대신 열기 */
  openDefectClaim: async (
    deliveryGroupId: number,
    body: DefectClaimRequest
  ) => {
    const { data } = await apiInstance.post<DefectClaimResponse>(
      groupPath(deliveryGroupId, "defect-claims"),
      body
    );
    return data;
  },
};
