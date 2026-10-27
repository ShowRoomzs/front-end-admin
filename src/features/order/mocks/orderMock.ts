/*
  DEV 전용 목업 — 배포 번들에 들어가지 않게 서비스가 `DEV_MOCK_ENABLED` 가드 뒤에서 동적 import 한다.
  값은 시안 ui-admin-06a-orders rev.5 A3(배송 이상 탭) · 백엔드 `AdminOrderDto`(origin/main) 모양 그대로다.
  - 목록 `stallChoice`는 서버에 아직 없다(백엔드 요청) — 시안 보조줄 「소비자 선택 개방까지 N일」을 보기 위한 값.
  - 상세 `stallChoice`는 main에 있지만 개발 서버에 미배포 — 백엔드 배포 후 삭제.
  시각은 서버처럼 UTC 벽시계(이벤트) · KST 벽시계(영업일 기한 23:59:59)를 섞어 둔다.
*/
import type { PageResponse } from "@/common/types/page";
import type {
  AdminOrderDetail,
  AdminOrderGroupSummary,
  AdminOrderListItem,
  AdminOrderStallChoice,
  AdminOrderSummary,
} from "@/features/order/types";

const WAITING_UNSET: AdminOrderStallChoice = {
  state: "WAITING",
  opensAt: null,
  // 시안은 「N일 [정책값 미정]」 — 값이 없을 때의 표기를 보인다
  daysUntilOpen: null,
  daysStalled: 8,
  choice: null,
  choiceLabel: null,
  chosenAt: null,
};

function stallChoiceOf(scenario: string): AdminOrderStallChoice {
  if (scenario === "stall-open") {
    return {
      ...WAITING_UNSET,
      state: "OPEN",
      opensAt: "2026-09-17T01:00:00",
      daysUntilOpen: 0,
    };
  }
  if (scenario === "stall-chosen") {
    return {
      ...WAITING_UNSET,
      state: "CHOSEN",
      opensAt: "2026-09-17T01:00:00",
      daysUntilOpen: 0,
      choice: "RESHIP",
      choiceLabel: "재발송",
      chosenAt: "2026-09-18T02:10:00",
    };
  }
  return {
    ...WAITING_UNSET,
    opensAt: "2026-09-20T01:00:00",
    daysUntilOpen: 3,
  };
}

function group(
  overrides: Partial<AdminOrderGroupSummary>
): AdminOrderGroupSummary {
  return {
    deliveryGroupId: 1,
    subOrderNumber: "20260909-000151-01",
    brandName: "퓨어네이처",
    status: "SHIPPING",
    statusLabel: "배송중",
    statusTone: "INFO",
    trackingAlert: null,
    trackingAlertLabel: null,
    shipDueAt: "2026-09-12T23:59:59",
    shipOverdue: false,
    cancelRequested: false,
    itemSummary: "하이드라 앰플 30ml",
    itemQuantity: 1,
    amount: 36000,
    carrier: "CJ",
    carrierLabel: "CJ대한통운",
    trackingNumber: "651200000151",
    groupBuyTitle: "하이드라 앰플 공구",
    issueSince: null,
    issueElapsedLabel: null,
    claim: null,
    stallChoice: null,
    ...overrides,
  };
}

function row(
  orderId: number,
  orderNumber: string,
  paidAt: string,
  recipientName: string,
  g: AdminOrderGroupSummary
): AdminOrderListItem {
  return {
    orderId,
    orderNumber,
    paidAt,
    recipientName,
    totalAmount: g.amount,
    groups: [g],
    attentionCount: 1,
  };
}

/** 06a A3 — 배송 이상 탭 4건(추적 정지 2 · 반송 중 1 · 집화 확인 필요 1) */
export function mockOrderList(): PageResponse<AdminOrderListItem> {
  const content = [
    row(
      24151,
      "20260909-000151",
      "2026-09-09T01:20:00",
      "조**",
      group({
        deliveryGroupId: 2415101,
        trackingAlert: "STALLED",
        trackingAlertLabel: "추적 정지",
        issueSince: "2026-09-10T03:00:00",
        issueElapsedLabel: "8일 무갱신",
        stallChoice: WAITING_UNSET,
      })
    ),
    row(
      24166,
      "20260911-000166",
      "2026-09-11T07:40:00",
      "서**",
      group({
        deliveryGroupId: 2416601,
        subOrderNumber: "20260911-000166-01",
        brandName: "글로우코스",
        itemSummary: "클렌징 밤 100ml",
        amount: 28000,
        groupBuyTitle: "클렌징 밤 공구",
        trackingAlert: "STALLED",
        trackingAlertLabel: "추적 정지",
        issueSince: "2026-09-11T03:00:00",
        issueElapsedLabel: "7일 무갱신",
        stallChoice: WAITING_UNSET,
      })
    ),
    row(
      24198,
      "20260916-000198",
      "2026-09-16T02:05:00",
      "이**",
      group({
        deliveryGroupId: 2419801,
        subOrderNumber: "20260916-000198-01",
        brandName: "데일리랩",
        status: "RETURNING",
        statusLabel: "배송중",
        itemSummary: "데일리 선크림 50ml",
        amount: 32000,
        groupBuyTitle: "데일리 선크림 공구",
        issueSince: "2026-09-12T05:00:00",
        issueElapsedLabel: "감지 09.12",
      })
    ),
    row(
      24195,
      "20260915-000195",
      "2026-09-15T11:31:00",
      "박**",
      group({
        deliveryGroupId: 2419501,
        subOrderNumber: "20260915-000195-01",
        brandName: "데일리랩",
        itemSummary: "데일리 선크림 50ml",
        amount: 32000,
        groupBuyTitle: "데일리 선크림 공구",
        trackingAlert: "PICKUP_UNCONFIRMED",
        trackingAlertLabel: "집화 확인 필요",
        issueSince: "2026-09-17T23:00:00",
        issueElapsedLabel: "등록 후 26시간",
      })
    ),
  ];
  return {
    content,
    pageInfo: {
      currentPage: 1,
      totalPages: 1,
      totalResults: content.length,
      limit: 20,
      hasNext: false,
    },
  };
}

export function mockOrderSummary(): AdminOrderSummary {
  return {
    tabCounts: { ALL: 142, DELIVERY_ISSUE: 4, CANCEL: 7 },
    statusCounts: {
      NEW: 18,
      PREPARING: 31,
      SHIPPING: 44,
      RETURNING: 1,
      DELIVERED: 27,
      CONFIRMED: 15,
      CANCELLED: 7,
    },
    deliveryIssueCounts: { PICKUP_UNCONFIRMED: 1, STALLED: 2, RETURNING: 1 },
  };
}

/** 추적 정지 하위주문 1건 — 배송 블록 「소비자 선택」 줄(WAITING · OPEN · CHOSEN) */
export function mockOrderDetail(
  orderId: number,
  scenario: string
): AdminOrderDetail {
  return {
    orderId,
    orderNumber: "20260909-000151",
    orderStatus: "PAID",
    paidAt: "2026-09-09T01:20:00",
    consumer: { userId: 501, name: "조하늘", email: "sky@example.com" },
    recipient: {
      name: "조하늘",
      phone: "010-****-1234",
      zipCode: "04524",
      address: "서울특별시 중구 세종대로 110",
      detailAddress: "3층",
      memo: null,
    },
    payment: {
      paymentId: "pay_mock_24151",
      status: "PAID",
      methodLabel: "신한카드",
      amount: 36000,
      cancelledAmount: 0,
      paidAt: "2026-09-09T01:20:00",
      operatorRefundableAmount: 36000,
    },
    inquiryCount: 0,
    inquiries: [],
    additionalPayments: [],
    groups: [
      {
        deliveryGroupId: 2415101,
        subOrderNumber: "20260909-000151-01",
        marketId: 11,
        brandName: "퓨어네이처",
        groupBuyNumber: "GB-20260901-003",
        groupBuyId: 3,
        groupBuyTitle: "하이드라 앰플 공구",
        creatorId: 7,
        creatorName: "하린_뷰티랩",
        status: "SHIPPING",
        statusLabel: "배송중",
        statusTone: "INFO",
        shipping: {
          shipDueAt: "2026-09-12T23:59:59",
          shipDueBusinessDays: 3,
          shipOverdue: false,
          overdueNoticeCount: 0,
          lastOverdueNoticeAt: null,
          prepareStartedAt: "2026-09-09T05:00:00",
          shippedAt: "2026-09-10T02:00:00",
          carrier: "CJ",
          carrierLabel: "CJ대한통운",
          trackingNumber: "651200000151",
          invoiceSource: "SELLER",
          invoiceSourceLabel: "브랜드 등록",
          trackingAlert: "STALLED",
          trackingAlertLabel: "추적 정지",
          lastTrackingAt: "2026-09-10T03:00:00",
          lastTrackingLabel: "간선 상차",
          returnDetectedAt: null,
          returnCompletedAt: null,
          deliveredAt: null,
          deliveredSourceLabel: null,
        },
        purchaseConfirm: null,
        cancel: null,
        cancelRequest: null,
        items: [
          {
            orderProductId: 9001,
            productName: "하이드라 앰플 30ml",
            optionName: null,
            quantity: 1,
            returnedQuantity: 0,
            price: 36000,
            status: "PAID",
            cancelTypeLabel: null,
          },
        ],
        refunds: [],
        activeClaims: [],
        history: [
          {
            eventType: "INVOICE_REGISTERED",
            label: "송장 등록",
            actorType: "SELLER",
            detail: "CJ대한통운 651200000151",
            occurredAt: "2026-09-10T02:00:00",
          },
          {
            eventType: "TRACKING_STALLED",
            label: "추적 정지 판정",
            actorType: "SYSTEM",
            detail: null,
            occurredAt: "2026-09-17T03:00:00",
          },
        ],
        settlement: null,
        actions: {
          canCorrectDeliveredAt: false,
          canRegisterShipment: false,
          canCancel: false,
          canEnqueueRefund: true,
          canOpenDefectClaim: false,
          canMarkLost: false,
          canMarkDelivered: false,
        },
        stallChoice: stallChoiceOf(scenario),
      },
    ],
  };
}
