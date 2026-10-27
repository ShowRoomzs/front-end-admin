/*
  DEV 전용 목업 — 서비스가 `DEV_MOCK_ENABLED` 가드 뒤에서 동적 import 한다(배포 번들에 들어가지 않는다).
  시안 ui-admin-06b-claims rev.7 B1 · B2 · B4 + 교환 사유 번복을 백엔드 DTO 모양 그대로 옮겼다.
  - `claim.inspection` · `reshipFeeCharged` · `actions.canOverturn`: main에 있고 개발 서버 미배포 — 백엔드 배포 후 삭제.
  - `deductionReason` · `disputeFreightRefund`: 서버에 없다(백엔드 요청) — 서버가 생기면 실데이터로 바꾸고 삭제.
  시각은 이벤트 = UTC 벽시계, 기한(23:59:59) = KST 벽시계(서버와 같다).
*/
import type { PageResponse } from "@/common/types/page";
import type {
  ClaimDetail,
  ClaimListItem,
  ClaimSummary,
  SellerClaimListItem,
} from "@/features/claim/types";

function row(overrides: Partial<SellerClaimListItem>): SellerClaimListItem {
  return {
    claimId: 3015,
    claimNumber: "CLM-3015",
    type: "RETURN",
    typeLabel: "반품",
    consumerName: "이**",
    productName: "선크림 리필",
    optionName: "50ml",
    exchangeOptionName: null,
    productLabel: "선크림 리필 50ml",
    shipLabel: null,
    quantity: 2,
    reasonCode: "CHANGE_OF_MIND",
    reasonLabel: "단순 변심",
    consumerAttachmentCount: 0,
    openedByOperator: false,
    openReason: null,
    status: "RECEIVED",
    statusLabel: "검수 지연",
    stage: "INSPECTION",
    statusTone: "WARNING",
    requestedAt: "2026-09-11T11:14:00",
    stageEnteredAt: "2026-09-14T02:20:00",
    elapsedDays: 4,
    overdue: true,
    collection: {
      collectionId: 1015,
      size: 1,
      leadClaimNumber: "CLM-3015",
      carrier: "CJ",
      carrierLabel: "CJ대한통운",
      trackingNumber: "6512****9902",
      lastTrackingLabel: "배달 완료",
      lastTrackingAt: "2026-09-12T03:00:00",
      arrivedAt: "2026-09-13T05:00:00",
    },
    receivedAt: "2026-09-14T02:20:00",
    inspectDueAt: "2026-09-16T23:59:59",
    reshipReason: null,
    reshipReasonLabel: null,
    reshipCarrier: null,
    reshipCarrierLabel: null,
    reshipTrackingNumber: null,
    reshipFee: null,
    rejectReasonLabel: null,
    sellerEvidenceCount: 0,
    rejectedAt: null,
    storage: null,
    outcome: null,
    amount: null,
    completedAt: null,
    actions: {
      canConfirmReceipt: false,
      canInspect: true,
      canRegisterReshipment: false,
    },
    orderItems: [
      {
        productName: "선크림 리필",
        optionName: "50ml",
        orderedQuantity: 2,
        claimedQuantity: 2,
        price: 8000,
        itemStatusLabel: "입고·검수",
      },
    ],
    orderSummary: "주문 수량 2 · 반품 신청 2",
    ...overrides,
  };
}

function detail(
  summary: SellerClaimListItem,
  overrides: Partial<ClaimDetail>,
  claimOverrides: Partial<ClaimDetail["claim"]> = {}
): ClaimDetail {
  return {
    claim: {
      summary,
      orderNumber: "20260911-000190",
      deliveryGroupId: 2419001,
      consumerPhone: "010-****-4412",
      reasonDetail: null,
      exchangeFeeCharged: null,
      reshipFeeCharged: null,
      refund: null,
      consumerAttachments: [],
      sellerEvidences: [],
      rejectDetail: null,
      rejection: null,
      purchaseConfirm: { paused: true, remainingDays: 3, dueAt: null },
      result: null,
      notices: [],
      history: [
        {
          eventType: "RECEIVED",
          eventLabel: "입고 확인",
          actorType: "SELLER",
          actorLabel: "브랜드 데일리랩",
          detail: null,
          occurredAt: "2026-09-14T02:20:00",
        },
      ],
      actions: {
        canConfirmReceipt: false,
        canPass: true,
        canReject: true,
        canRegisterReshipment: false,
        canUpdateReshipment: false,
        canOverturn: false,
      },
      inspection: null,
      ...claimOverrides,
    },
    orderId: 24190,
    deliveryGroupId: 2419001,
    brandName: "데일리랩",
    feeBearer: "CONSUMER",
    feeBearerLabel: "소비자 귀책",
    canAcceptDispute: false,
    disputeRefundAmount: null,
    canRefundUnanswered: false,
    unansweredRefundAmount: null,
    dispute: null,
    inspectNotice: { count: 1, lastAt: "2026-09-16T15:00:00" },
    inspectOverdueBusinessDays: 2,
    legalDeadline: null,
    settlement: null,
    deductionReason: null,
    disputeFreightRefund: null,
    ...overrides,
  };
}

/** B1 — 입고·검수 지연 · 무료배송 최초 배송비 차감 · 자동 입고 규칙 */
function b1(): ClaimDetail {
  return detail(
    row({}),
    {
      deductionReason: "전량 반품이라 남은 금액 0원(기준 미달)",
    },
    {
      refund: {
        itemAmount: 16000,
        requestDeduction: 3000,
        requestExpectedAmount: 13000,
        basisLabel: "상품 금액 − 최초 배송비",
      },
    }
  );
}

/** B2 — 반려 보류 · 소비자 이의 → 인용 시 운임 정산(선불 운임 3,000 환급) */
function b2(): ClaimDetail {
  const summary = row({
    claimId: 3008,
    claimNumber: "CLM-3008",
    consumerName: "정**",
    productName: "글로우 크림",
    optionName: "50ml",
    productLabel: "글로우 크림 50ml",
    quantity: 1,
    status: "REJECT_HOLD",
    statusLabel: "재발송비 결제 대기",
    stage: "REJECT_HOLD",
    statusTone: "INFO",
    overdue: false,
    inspectDueAt: null,
    rejectReasonLabel: "사용 흔적 · 재판매 불가",
    rejectedAt: "2026-09-15T07:40:00",
    reshipFee: {
      amount: 3000,
      status: "PENDING",
      statusLabel: "결제 대기",
      dueAt: "2026-09-29T23:59:59",
    },
    storage: {
      noticeCount: 1,
      lastNoticeAt: "2026-09-15T07:40:00",
      storageDueAt: null,
      phase: "NOTICE_PENDING",
    },
    orderItems: [
      {
        productName: "글로우 크림",
        optionName: "50ml",
        orderedQuantity: 1,
        claimedQuantity: 1,
        price: 27200,
        itemStatusLabel: "반려 보류",
      },
    ],
    orderSummary: "주문 수량 1 · 반품 신청 1",
  });
  return detail(
    summary,
    {
      orderId: 24171,
      brandName: "글로우코스",
      canAcceptDispute: true,
      disputeRefundAmount: 27200,
      inspectNotice: { count: 0, lastAt: null },
      inspectOverdueBusinessDays: null,
      dispute: {
        inquiryId: 4527,
        content:
          "펌프는 시향만 1회 했고 사용하지 않았습니다. 배송 당시부터 펌프 입구에 내용물이 묻어 있었어요.",
        imageUrls: [],
        createdAt: "2026-09-17T01:05:00",
        answered: false,
        answeredAt: null,
      },
      disputeFreightRefund: 3000,
    },
    {
      orderNumber: "20260908-000171",
      refund: {
        itemAmount: 27200,
        requestDeduction: 3000,
        requestExpectedAmount: 0,
        basisLabel: "상품 금액 − 최초 배송비",
      },
    }
  );
}

/** B4 — 운영자 개설 · 구매확정 후 하자 · 브랜드 귀책(착불 · 차감 없음) */
function b4(): ClaimDetail {
  const summary = row({
    claimId: 3018,
    claimNumber: "CLM-3018",
    consumerName: "최**",
    productName: "글로우 세럼",
    optionName: "30ml",
    productLabel: "글로우 세럼 30ml",
    quantity: 1,
    reasonCode: "DAMAGED_OR_DEFECTIVE",
    reasonLabel: "배송 상품 파손 및 불량",
    openedByOperator: true,
    openReason: "확정 후 하자",
    status: "REQUESTED",
    statusLabel: "회수 대기",
    stage: "COLLECT_WAIT",
    statusTone: "INFO",
    overdue: false,
    collection: null,
    receivedAt: null,
    inspectDueAt: null,
    orderItems: [
      {
        productName: "글로우 세럼",
        optionName: "30ml",
        orderedQuantity: 1,
        claimedQuantity: 1,
        price: 45000,
        itemStatusLabel: "회수 대기",
      },
    ],
    orderSummary: "주문 수량 1 · 반품 신청 1",
  });
  return detail(
    summary,
    {
      orderId: 24112,
      brandName: "글로우코스",
      feeBearer: "SELLER",
      feeBearerLabel: "브랜드 귀책",
      inspectNotice: { count: 0, lastAt: null },
      inspectOverdueBusinessDays: null,
      legalDeadline: {
        suppliedOn: "2026-08-27",
        supplyDeadline: "2026-11-27",
        noticedOn: "2026-09-17",
        noticeDeadline: "2026-10-17",
        appliedDeadline: "2026-10-17",
      },
      settlement: {
        settlementNumber: "STL-2609-010",
        status: "PAYOUT_SCHEDULED",
        statusLabel: "지급 예정",
        confirmedAt: "2026-09-10T01:00:00",
        deductOnPass: true,
      },
    },
    {
      orderNumber: "20260830-000112",
      refund: {
        itemAmount: 45000,
        requestDeduction: 0,
        requestExpectedAmount: 45000,
        basisLabel: "브랜드 부담 사유 — 배송비 차감 없음",
      },
      purchaseConfirm: null,
    }
  );
}

/** 교환 사유 번복(기-17 · 기-93) — 착불 신청이 소비자 귀책으로 · 재발송 배송비 + 착불 운임 결제 대기 */
function overturn(): ClaimDetail {
  const summary = row({
    claimId: 3020,
    claimNumber: "CLM-3020",
    type: "EXCHANGE",
    typeLabel: "교환",
    consumerName: "강**",
    productName: "립 틴트",
    optionName: "03",
    exchangeOptionName: "05",
    productLabel: "립 틴트 03 → 05",
    quantity: 1,
    reasonCode: "DAMAGED_OR_DEFECTIVE",
    reasonLabel: "배송 상품 파손 및 불량",
    status: "REJECT_HOLD",
    statusLabel: "재발송비 결제 대기",
    stage: "REJECT_HOLD",
    statusTone: "INFO",
    overdue: false,
    inspectDueAt: null,
    reshipFee: {
      amount: 6000,
      status: "PENDING",
      statusLabel: "결제 대기",
      dueAt: "2026-10-02T23:59:59",
    },
    orderItems: [
      {
        productName: "립 틴트",
        optionName: "03",
        orderedQuantity: 1,
        claimedQuantity: 1,
        price: 18000,
        itemStatusLabel: "교환 진행중",
      },
    ],
    orderSummary: "주문 수량 1 · 교환 신청 1",
  });
  return detail(
    summary,
    {
      orderId: 24205,
      brandName: "무드코스메틱",
      inspectNotice: { count: 0, lastAt: null },
      inspectOverdueBusinessDays: null,
    },
    {
      orderNumber: "20260917-000205",
      exchangeFeeCharged: false,
      reshipFeeCharged: false,
      inspection: {
        result: "REASON_OVERTURNED",
        resultLabel: "사유 번복",
        explanation:
          "외관 손상이 없고 정상 작동합니다. 단순 변심으로 확인됩니다.",
        autoReceived: true,
        overturnFee: 6000,
        freight: [
          {
            trigger: "REASON_OVERTURNED",
            triggerLabel: "사유 번복",
            direction: "CHARGE_CONSUMER",
            collectFreight: 3000,
            prepaidFreight: 0,
            initialFeeRestored: 0,
            signedAmount: 3000,
            settledVia: "CHARGE",
          },
        ],
      },
    }
  );
}

const DETAILS: Record<string, () => ClaimDetail> = {
  b1,
  b2,
  b4,
  overturn,
};

export const CLAIM_MOCK_SCENARIOS = Object.keys(DETAILS);

export function mockClaimDetail(scenario: string): ClaimDetail {
  return (DETAILS[scenario] ?? b1)();
}

/** 목록 — 시나리오 상세 넷을 행으로(어느 행을 눌러도 그 시나리오 상세가 열린다) */
export function mockClaimList(): PageResponse<ClaimListItem> {
  const content = CLAIM_MOCK_SCENARIOS.map((key) => {
    const item = DETAILS[key]();
    return {
      claim: item.claim.summary,
      brandName: item.brandName,
      feeBearer: item.feeBearer,
      feeBearerLabel: item.feeBearerLabel,
      faultChangedToSeller: false,
      disputeOpen: item.dispute !== null && !item.dispute.answered,
      disputedAt: item.dispute?.createdAt ?? null,
      elapsedBusinessDays: item.claim.summary.overdue ? 3 : 1,
    };
  });
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

export function mockClaimByClaimId(claimId: number): ClaimDetail | null {
  return (
    CLAIM_MOCK_SCENARIOS.map((key) => DETAILS[key]()).find(
      (item) => item.claim.summary.claimId === claimId
    ) ?? null
  );
}

export function mockClaimSummary(): ClaimSummary {
  return {
    kpi: { collectWait: 1, inspection: 1, reship: 0, overdue: 1 },
    tabCounts: {
      ALL: 4,
      COLLECT_WAIT: 1,
      COLLECTING: 0,
      INSPECTION: 1,
      RESHIP: 0,
      REJECT_HOLD: 2,
      DONE: 0,
    },
    typeCounts: { RETURN: 3, EXCHANGE: 1 },
    disputeCount: 1,
  };
}
