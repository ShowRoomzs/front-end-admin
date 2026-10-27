import { apiInstance } from "@/common/lib/apiInstance";
import type { PageResponse } from "@/common/types/page";
import {
  DEV_MOCK_ENABLED,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock";
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams";
import type { AdminGroupBuyListItem } from "@/features/groupBuy/types";
import type {
  AdminOrderCreatorOption,
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

/*
  DEV 목업 시나리오(`?mock=<값>` · 개발 서버 전용 · 배포본은 항상 실호출):
  - `stall`        목록 = 06a A3 배송 이상 4건(추적 정지 보조줄 「소비자 선택 개방까지 N일 [정책값 미정]」)
                   · 상세 = 추적 정지 · 소비자 선택 개방 전(3일)
  - `stall-open`   상세 = 추적 정지 · 소비자 선택 가능
  - `stall-chosen` 상세 = 추적 정지 · 소비자가 재발송을 고름
  목록 `stallChoice`는 서버에 없다(백엔드 요청) · 상세 `stallChoice`는 main에 있고 개발 서버에 미배포다.
*/
const STALL_SCENARIOS = ["stall", "stall-open", "stall-chosen"];
function stallScenario() {
  const scenario = mockScenario();
  return DEV_MOCK_ENABLED && scenario && STALL_SCENARIOS.includes(scenario)
    ? scenario
    : null;
}

/**
 * 어드민 주문 API — 백엔드 `AdminOrderController`와 1:1.
 * 조치는 전부 하위주문(`deliveryGroupId`) 단위이고, 성공하면 갱신된 주문 상세를 돌려준다(B6만 생성 id).
 */
export const orderService = {
  getList: async (query: AdminOrderListQuery) => {
    if (stallScenario()) {
      // DEV 목업 — 목록 `stallChoice`가 서버에 생기고 배포되면 삭제
      const { mockOrderList } = await import("../mocks/orderMock");
      return mockDelay(mockOrderList());
    }
    const { data } = await apiInstance.get<PageResponse<AdminOrderListItem>>(
      BASE,
      { params: paramsToSearchParams(query) }
    );
    return data;
  },

  /** 탭 · 상태 · 이상 유형 건수 — 목록과 같은 조건(탭 · 상태 · 이상 유형 · 정렬 제외) */
  getSummary: async (query: AdminOrderSummaryQuery) => {
    if (stallScenario()) {
      // DEV 목업 — 위 목록 목업과 짝(백엔드 배포 후 삭제)
      const { mockOrderSummary } = await import("../mocks/orderMock");
      return mockDelay(mockOrderSummary());
    }
    const { data } = await apiInstance.get<AdminOrderSummary>(
      `${BASE}/summary`,
      { params: paramsToSearchParams(query) }
    );
    return data;
  },

  getDetail: async (orderId: number) => {
    const scenario = stallScenario();
    if (scenario) {
      // DEV 목업 — 상세 `stallChoice`(main)가 개발 서버에 배포되면 삭제
      const { mockOrderDetail } = await import("../mocks/orderMock");
      return mockDelay(mockOrderDetail(orderId, scenario));
    }
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

  /**
   * 상세 조건 「공구」 — 그 브랜드의 공구 전체(탭 없이 = 전 상태). 셀렉트는 한 번에 받는
   * 목록이다. 서버(`AdminGroupBuyController` · `PagingRequest`)에는 페이지 크기 상한이 없어
   * 100건으로 끊는다 — 한 브랜드 공구가 100건을 넘으면 뒤쪽은 셀렉트에 없다.
   */
  getGroupBuyOptions: async (marketId: number) => {
    const { data } = await apiInstance.get<PageResponse<AdminGroupBuyListItem>>(
      "/admin/group-buys",
      {
        params: paramsToSearchParams({
          marketId,
          sort: "CREATED_DESC",
          page: 1,
          size: 100,
        }),
      }
    );
    return data.content;
  },

  /** 상세 조건 「인플루언서」 — 공구를 1건 이상 연 인플루언서만(쇼룸명순 · 페이지 없음) */
  getCreatorOptions: async () => {
    const { data } = await apiInstance.get<Array<AdminOrderCreatorOption>>(
      "/admin/group-buys/creators"
    );
    return data;
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
