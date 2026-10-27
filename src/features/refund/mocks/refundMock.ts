/*
  DEV 전용 목업 — 서비스가 `DEV_MOCK_ENABLED` 가드 뒤에서 동적 import 한다(배포 번들에 들어가지 않는다).
  시안 ui-admin-06c-refunds rev.8 A1(RFD-0918 · RFD-0918-T) · A3(RFD-0914 재발송 배송비) · M1 · M3를
  백엔드 `AdminTransactionDto`(origin/main) 모양 그대로 옮겼다.
  - `method` · `transferable` · `transferPending` · `transfer` · 경로 FREIGHT: main에 있고 개발 서버 미배포 — 백엔드 배포 후 삭제.
  - `freightAdjustment`(M1 운임 정산 줄): 서버에 없다(백엔드 요청).
  시각은 이벤트 = UTC 벽시계.
*/
import type { PageResponse } from "@/common/types/page";
import type {
  RefundDetail,
  RefundItem,
  RefundListParams,
  RefundSummary,
} from "@/features/refund/types";

const BASE_ITEM: RefundItem = {
  refundTaskId: 918,
  refundNo: "RFD-918",
  orderId: 24171,
  orderNumber: "20260908-000171",
  deliveryGroupId: 2417101,
  subOrderNumber: "20260908-000171-01",
  brandName: "글로우코스",
  source: "OPERATOR_REASON",
  route: "OPERATOR",
  sourceLabel: "반려 이의 인용",
  sourceRef: "CLM-3008",
  origin: "OPERATOR",
  originLabel: "운영자 사유",
  reasonLabel: "반려 이의 인용",
  reasonDetail: "사진상 배송 시점 오염으로 판단",
  paymentKind: "ORIGINAL",
  partial: false,
  paymentMethodLabel: "카드",
  paymentLabel: "카드 · 원래",
  amount: 27200,
  status: "PENDING",
  statusLabel: "집행 대기",
  statusNote: "편입 09.18 14:20 · 김운영",
  attempt: 0,
  lastError: null,
  displayAt: "2026-09-18T05:20:00",
  createdAt: "2026-09-18T05:20:00",
  executedAt: null,
  executable: true,
  voidable: false,
  manuallyCompletable: true,
  method: "PG_CANCEL",
  transferable: false,
};

/** A1 RFD-0918-T — 원래 결제액 초과분 · 운영자 계좌 송금(송금 대기) */
const TRANSFER_ITEM: RefundItem = {
  ...BASE_ITEM,
  refundTaskId: 919,
  refundNo: "RFD-919",
  source: "FREIGHT_REFUND",
  route: "FREIGHT",
  sourceLabel: "운임 환급 · 계좌 송금",
  reasonLabel: null,
  reasonDetail: null,
  paymentMethodLabel: null,
  paymentLabel: "계좌 송금",
  amount: 3000,
  statusLabel: "송금 대기",
  statusNote: "원래 결제액 초과분 · 운영자 송금",
  executable: false,
  manuallyCompletable: false,
  method: "BANK_TRANSFER",
  transferable: true,
};

/** A3 RFD-0914 — 교환 철회로 취소된 재발송 배송비(추가 결제) */
const RESHIP_DONE_ITEM: RefundItem = {
  ...BASE_ITEM,
  refundTaskId: 914,
  refundNo: "RFD-914",
  orderId: 24158,
  orderNumber: "20260913-000158",
  source: "CLAIM_PAYMENT_CANCELLED",
  route: "EXCHANGE",
  sourceLabel: "교환 재발송비 환불 · 교환 철회",
  sourceRef: null,
  origin: "PG_AUTO",
  originLabel: "PG 자동",
  reasonLabel: null,
  reasonDetail: null,
  paymentKind: "ADDITIONAL",
  paymentMethodLabel: "카카오페이",
  paymentLabel: "카카오페이 · 추가",
  amount: 3000,
  status: "DONE",
  statusLabel: "환불 완료",
  statusNote: null,
  displayAt: "2026-09-15T01:12:00",
  executedAt: "2026-09-15T01:12:00",
  executable: false,
  manuallyCompletable: false,
};

function page(content: Array<RefundItem>): PageResponse<RefundItem> {
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

export function mockRefundList(
  params: RefundListParams
): PageResponse<RefundItem> {
  if (params.tab === "PENDING") return page([BASE_ITEM, TRANSFER_ITEM]);
  if (params.tab === "DONE") return page([RESHIP_DONE_ITEM]);
  return page([]);
}

export function mockRefundSummary(): RefundSummary {
  return {
    tabs: {
      PENDING: {
        count: 2,
        amount: 30200,
        oldestWaitingDays: null,
        days: null,
        byOrigin: null,
      },
      FAILED: {
        count: 0,
        amount: 0,
        oldestWaitingDays: null,
        days: null,
        byOrigin: null,
      },
      DONE: {
        count: 1,
        amount: 3000,
        oldestWaitingDays: null,
        days: 30,
        byOrigin: { PG_AUTO: 1, OPERATOR: 0 },
      },
    },
    badge: 2,
    transferPending: 1,
  };
}

const BASE_DETAIL: RefundDetail = {
  refundTaskId: 918,
  refundNo: "RFD-918",
  order: {
    orderId: 24171,
    orderNumber: "20260908-000171",
    deliveryGroupId: 2417101,
    subOrderNumber: "20260908-000171-01",
    brandName: "글로우코스",
  },
  source: {
    code: "OPERATOR_REASON",
    route: "OPERATOR",
    label: "반려 이의 인용",
    ref: "CLM-3008",
    claimId: 3008,
    cancelRequestId: null,
    collectionId: 1008,
  },
  origin: "OPERATOR",
  originLabel: "운영자 사유",
  reason: {
    code: "DISPUTE_ACCEPTED",
    label: "반려 이의 인용",
    detail: "1:1 문의 #4527 사진상 배송 시점 오염으로 판단",
    requestedBy: 1,
    requestedByName: "김운영",
    requestedAt: "2026-09-18T05:20:00",
  },
  target: {
    paymentId: "pay_mock_24171",
    pgTxId: "tosspay_9c41e0b2",
    paymentKind: "ORIGINAL",
    methodLabel: "카드",
    paymentAmount: 27200,
    cancelledAmount: 0,
    cancellableAmount: 27200,
    amount: 27200,
    partial: false,
    paymentStatus: "PAID",
  },
  additionalPayments: [
    {
      chargeId: 31,
      type: "REJECT_RESHIP",
      typeLabel: "반려 재발송비",
      amount: 3000,
      status: "VOID",
      statusLabel: "소멸",
      note: "재발송비 결제 요청은 인용 시 취소됨",
      claimPaymentId: null,
      claimPaymentStatus: null,
    },
  ],
  settlement: {
    state: "BEFORE_SETTLEMENT",
    stateLabel: "정산 전 · 브랜드 정산에 「− 운임 정산 3,000」 반영 예정",
    settlementNumber: null,
    clawback: null,
    expectedClawback: null,
  },
  status: "PENDING",
  statusLabel: "집행 대기",
  attempt: 0,
  autoMaxAttempts: 2,
  autoRetry: null,
  failure: null,
  execution: null,
  executable: true,
  voidable: false,
  manuallyCompletable: true,
  history: [],
  method: "PG_CANCEL",
  transfer: null,
  freightAdjustment: {
    direction: "REFUND_CONSUMER",
    amount: 3000,
    transferRefundNo: "RFD-919",
  },
};

const TRANSFER_DETAIL: RefundDetail = {
  ...BASE_DETAIL,
  refundTaskId: 919,
  refundNo: "RFD-919",
  source: {
    ...BASE_DETAIL.source,
    code: "FREIGHT_REFUND",
    route: "FREIGHT",
    label: "운임 환급 · 계좌 송금",
  },
  reason: null,
  target: null,
  additionalPayments: [],
  statusLabel: "송금 대기",
  executable: false,
  manuallyCompletable: false,
  method: "BANK_TRANSFER",
  freightAdjustment: null,
  transfer: {
    transferable: true,
    suggestedAccount: {
      bankCode: "004",
      bankName: "국민은행",
      accountNumber: "604201-04-551203",
      holderName: "정○○",
    },
    linkedInquiryId: 4527,
    transferred: null,
  },
};

export function mockRefundDetail(refundTaskId: number): RefundDetail {
  return refundTaskId === TRANSFER_DETAIL.refundTaskId
    ? TRANSFER_DETAIL
    : { ...BASE_DETAIL, refundTaskId };
}
