/*
  환불 관리(06c) — 백엔드 `AdminTransactionDto` 06c 절과 1:1.
  enum은 `domain/order/type/*`의 실제 상수다. LocalDateTime은 시간대 없는 ISO 문자열로 온다.
*/
import type { PageParams } from "@/common/types/page";

// ------------------------------------------------------------------ enum

/** 탭 — 집행 대기(처리 중 포함) · 실패 · 완료 */
export type RefundTab = "PENDING" | "FAILED" | "DONE";

/** 경로 셀렉트 — 서버가 발생 경로(`RefundTaskSource`) 집합으로 바꾼다 */
export type RefundRoute =
  "CANCEL" | "RETURN" | "RETURN_SHIPMENT" | "EXCHANGE" | "OPERATOR";
/** 빈 문자열 = 경로 전체(쿼리에서 빠진다) */
export type RefundRouteFilter = "" | RefundRoute;

export type RefundSort = "LATEST" | "AMOUNT_DESC";

/** 발생 경로 — `RefundTaskSource` */
export type RefundTaskSource =
  | "CANCEL_REQUEST_APPROVED"
  | "SELLER_DIRECT_CANCEL"
  | "RETURN_COMPLETED"
  | "CLAIM_RETURN_PASSED"
  | "OPERATOR_REASON"
  | "USER_CANCEL_BEFORE_PREPARE"
  | "CLAIM_PAYMENT_CANCELLED"
  | "LOST_IN_TRANSIT";

/** 출처 — `RefundTaskOrigin` (PG 자동 · 운영자 사유) */
export type RefundTaskOrigin = "PG_AUTO" | "OPERATOR";

/** 큐 상태 — `RefundTaskStatus`. EXECUTING은 집행 대기 탭의 「처리 중」, VOID는 어느 탭에도 없다 */
export type RefundTaskStatus =
  "PENDING" | "EXECUTING" | "DONE" | "FAILED" | "VOID";

/** 운영자 사유 — `OperatorRefundReason` */
export type OperatorRefundReason =
  | "DISPUTE_ACCEPTED"
  | "POST_CONFIRM_DEFECT"
  | "RECALL"
  | "INSPECTION_UNANSWERED";

export type ClaimChargeType = "EXCHANGE_RESHIP" | "REJECT_RESHIP";

export type ClaimChargeStatus =
  "PENDING" | "PAID" | "DEDUCTED" | "COVERED" | "VOID" | "REFUNDED" | "WAIVED";

/** 서버는 String으로 내린다 — ORIGINAL 원래 결제 · ADDITIONAL 추가 결제(교환 · 반려 재발송비) */
export type RefundPaymentKind = "ORIGINAL" | "ADDITIONAL";

/** 집행 결과 — 서버는 String으로 내린다 */
export type RefundExecuteOutcome = "DONE" | "FAILED" | "UNKNOWN" | "SKIPPED";

// ------------------------------------------------------------------ 목록

export interface RefundListParams extends PageParams {
  tab: RefundTab;
  route: RefundRouteFilter;
  /** 환불번호 · 주문번호 · PG 거래번호 — 서버가 셋 다 본다 */
  keyword: string;
  sort: RefundSort;
}

/** `AdminRefundListItem` — 목록 한 행 + 액션 가능 여부 */
export interface RefundItem {
  refundTaskId: number;
  /** RFD-918 */
  refundNo: string;
  orderId: number;
  orderNumber: string;
  deliveryGroupId: number;
  subOrderNumber: string | null;
  brandName: string;
  source: RefundTaskSource;
  route: RefundRoute;
  /** 경로 열 — 서버 문장 */
  sourceLabel: string;
  /** 경로 보조(회색) — CLM-3008 · CRQ-… */
  sourceRef: string | null;
  origin: RefundTaskOrigin;
  /** 출처 열 — PG 자동(중립) · 운영자 사유(경고) */
  originLabel: string;
  reasonLabel: string | null;
  reasonDetail: string | null;
  paymentKind: RefundPaymentKind;
  partial: boolean;
  paymentMethodLabel: string | null;
  /** 결제 열 — 「카드 · 원래 부분」 */
  paymentLabel: string | null;
  amount: number;
  status: RefundTaskStatus;
  statusLabel: string;
  /** 상태 보조 — 「편입 09.18 14:20 · 김운영」 · 실패 사유 · 「집행 김운영 · 재확인」 */
  statusNote: string | null;
  attempt: number;
  lastError: string | null;
  /** 「일시」 열 — 집행 대기 = 편입 · 실패 = 마지막 실패 · 완료 = 집행 */
  displayAt: string | null;
  createdAt: string;
  executedAt: string | null;
  /** [집행] · [재시도] 가능 — 대기 · 실패이고 결제가 있다 */
  executable: boolean;
  /** [철회] 가능 — 집행 전 운영자 사유 환불(반려 이의 인용 제외) */
  voidable: boolean;
  /** [수동 완료 기록] 가능 — 대기 · 실패 */
  manuallyCompletable: boolean;
}

// ------------------------------------------------------------------ 요약

/** `AdminRefundTabStat` */
export interface RefundTabStat {
  count: number;
  /** 합계 금액 */
  amount: number;
  /** 실패 탭 — 가장 오래 기다린 소비자의 대기 일수 */
  oldestWaitingDays: number | null;
  /** 완료 탭 — 집계 기간(일) */
  days: number | null;
  /** 완료 탭 — 출처별 건수 { PG_AUTO, OPERATOR } */
  byOrigin: Partial<Record<RefundTaskOrigin, number>> | null;
}

/** `AdminRefundSummaryResponse` */
export interface RefundSummary {
  /** 탭별 건수 · 합계 — PENDING · FAILED · DONE (서버 Map) */
  tabs: Partial<Record<RefundTab, RefundTabStat>>;
  /** 사이드바 배지 = 집행 대기 + 실패 */
  badge: number;
}

// ------------------------------------------------------------------ 상세

export interface RefundOrderRef {
  orderId: number;
  orderNumber: string;
  deliveryGroupId: number;
  subOrderNumber: string | null;
  brandName: string;
}

export interface RefundSourceRef {
  code: RefundTaskSource;
  route: RefundRoute;
  label: string;
  ref: string | null;
  claimId: number | null;
  cancelRequestId: number | null;
  collectionId: number | null;
}

export interface RefundReason {
  code: OperatorRefundReason | null;
  label: string;
  /** 근거 */
  detail: string | null;
  requestedBy: number | null;
  requestedByName: string | null;
  requestedAt: string;
}

/** M1 「취소 대상」 — 원래 결제 · 수단 · PG 거래번호 · 잔액 */
export interface RefundTarget {
  paymentId: string;
  pgTxId: string | null;
  paymentKind: RefundPaymentKind;
  methodLabel: string;
  paymentAmount: number;
  cancelledAmount: number;
  /** 지금 취소 가능 잔액 */
  cancellableAmount: number;
  /** 이번 환불액 */
  amount: number;
  partial: boolean;
  paymentStatus: string;
}

/** M1 「추가 결제」 — 클레임 박스의 재발송비 청구 */
export interface RefundAdditionalPayment {
  chargeId: number;
  type: ClaimChargeType;
  typeLabel: string;
  amount: number;
  status: ClaimChargeStatus;
  statusLabel: string;
  note: string | null;
  claimPaymentId: string | null;
  claimPaymentStatus: string | null;
}

export interface RefundClawback {
  clawbackNumber: string;
  /** PENDING · APPLIED · UNRECOVERABLE */
  status: string;
  statusLabel: string;
}

export interface RefundSettlement {
  /** BEFORE_SETTLEMENT · SETTLED */
  state: string;
  stateLabel: string;
  settlementNumber: string | null;
  clawback: RefundClawback | null;
}

export interface RefundFailureAttempt {
  at: string;
  actorType: string;
  message: string | null;
}

export interface RefundFailure {
  /** 운영자 문장 */
  message: string;
  /** PG 응답 코드 — 상세에만 */
  code: string | null;
  at: string | null;
  /** 시도별 실패 기록 — 오래된순 */
  attempts: Array<RefundFailureAttempt>;
}

export interface RefundExecution {
  executedAt: string;
  executedBy: number | null;
  executedByName: string | null;
  paymentCancelId: number | null;
  pgCancellationId: string | null;
}

export interface RefundHistory {
  at: string;
  type: string;
  label: string;
  actor: string;
  actorName: string | null;
  detail: string | null;
}

/** `AdminRefundDetail` — M1 집행 재확인 · M2 재시도 다이얼로그가 보는 값 전부 */
export interface RefundDetail {
  refundTaskId: number;
  refundNo: string;
  order: RefundOrderRef;
  source: RefundSourceRef;
  origin: RefundTaskOrigin;
  originLabel: string;
  reason: RefundReason | null;
  /** 결제가 없는 주문은 null */
  target: RefundTarget | null;
  additionalPayments: Array<RefundAdditionalPayment>;
  settlement: RefundSettlement;
  status: RefundTaskStatus;
  statusLabel: string;
  attempt: number;
  /** 자동 시도 상한(최초 포함) */
  autoMaxAttempts: number;
  failure: RefundFailure | null;
  execution: RefundExecution | null;
  executable: boolean;
  voidable: boolean;
  manuallyCompletable: boolean;
  history: Array<RefundHistory>;
}

// ------------------------------------------------------------------ 쓰기

/** `AdminRefundExecuteResponse` — 집행 · 재시도 공용 */
export interface RefundExecuteResponse {
  outcome: RefundExecuteOutcome;
  refund: RefundItem;
}

/** `AdminRefundVoidRequest` — 편입 철회 */
export interface RefundVoidRequest {
  /** 1~300자 */
  reason: string;
}

/** `AdminRefundManualCompleteRequest` — PG 밖에서 이미 돌려준 환불의 기록 */
export interface RefundManualCompleteRequest {
  /** 최대 100자 */
  pgCancellationId?: string | null;
  /** 1~500자 */
  note: string;
}
