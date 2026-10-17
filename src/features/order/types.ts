/*
  주문 조회(거래 관리 › 주문 조회 · 06a) 타입 — 백엔드 `AdminOrderDto`(api/admin/transaction/dto)와 1:1.
  열거값은 `domain/order/type/*` · `domain/payment/type/PaymentMethod`의 상수 이름을 그대로 옮겼다.
  LocalDateTime은 시간대 표기 없는 ISO 문자열(`2026-10-03T10:12:00`)로 온다.
  화면 전용 타입(URL 조건 · 표시 배지)은 맨 아래에 따로 둔다.
*/

import type { BaseParams } from "@/common/types/page";

// ── 열거값 ──────────────────────────────────────────────

/** `AdminOrderTab` */
export type AdminOrderTab = "ALL" | "DELIVERY_ISSUE" | "CANCEL";

/** `AdminOrderSearchType` */
export type AdminOrderSearchType =
  | "ALL"
  | "ORDER_NUMBER"
  | "SUB_ORDER_NUMBER"
  | "RECIPIENT"
  | "BRAND"
  | "TRACKING_NUMBER"
  | "PG_TX_ID";

/** `AdminOrderSort` */
export type AdminOrderSort =
  "PAID_DESC" | "PAID_ASC" | "AMOUNT_DESC" | "ISSUE_OLDEST";

/** `FulfillmentStatus` — PENDING(결제 대기)은 목록에 오지 않는다 */
export type FulfillmentStatus =
  | "PENDING"
  | "NEW"
  | "PREPARING"
  | "SHIPPING"
  | "RETURNING"
  | "DELIVERED"
  | "CONFIRMED"
  | "CANCELLED";

/** `TrackingAlert` */
export type TrackingAlert = "PICKUP_UNCONFIRMED" | "STALLED";

/** `OrderBadgeTone` */
export type OrderBadgeTone =
  "NEUTRAL" | "INFO" | "WARNING" | "SUCCESS" | "DANGER";

/** `PaymentMethod` */
export type PaymentMethod = "CARD" | "EASY_PAY";

/** `DeliveryCarrier` */
export type DeliveryCarrier =
  | "CJ"
  | "EPOST"
  | "HANJIN"
  | "LOTTE"
  | "LOGEN"
  | "KYUNGDONG"
  | "DAESIN"
  | "ILYANG"
  | "CU"
  | "GS25"
  | "HAPDONG"
  | "WOORI"
  | "COUPANG";

/** `RefundTaskSource` */
export type RefundTaskSource =
  | "CANCEL_REQUEST_APPROVED"
  | "SELLER_DIRECT_CANCEL"
  | "RETURN_COMPLETED"
  | "CLAIM_RETURN_PASSED"
  | "OPERATOR_REASON"
  | "USER_CANCEL_BEFORE_PREPARE"
  | "CLAIM_PAYMENT_CANCELLED"
  | "LOST_IN_TRANSIT";

/** `RefundTaskOrigin` */
export type RefundTaskOrigin = "PG_AUTO" | "OPERATOR";

/** `RefundTaskStatus` */
export type RefundTaskStatus =
  "PENDING" | "EXECUTING" | "DONE" | "FAILED" | "VOID";

/** `OperatorRefundReason` — 06a는 RECALL · POST_CONFIRM_DEFECT만 받는다(나머지 둘은 06b 전용) */
export type OperatorRefundReason =
  | "DISPUTE_ACCEPTED"
  | "POST_CONFIRM_DEFECT"
  | "RECALL"
  | "INSPECTION_UNANSWERED";

/** `SellerCancelReason` */
export type SellerCancelReason =
  "SOLD_OUT" | "DEFECT" | "UNDELIVERABLE_AREA" | "ETC";

/** `ClaimReason` — B6은 DAMAGED_OR_DEFECTIVE · WRONG_OR_LATE_DELIVERY만 받는다 */
export type ClaimReason =
  | "CHANGE_OF_MIND"
  | "ORDER_MISTAKE"
  | "SIZE_MISMATCH"
  | "DAMAGED_OR_DEFECTIVE"
  | "WRONG_OR_LATE_DELIVERY"
  | "OTHER";

/** `ClaimType` */
export type ClaimType = "RETURN" | "EXCHANGE";

/** `ClaimStatus` */
export type ClaimStatus =
  | "PAYMENT_PENDING"
  | "REQUESTED"
  | "COLLECTING"
  | "ARRIVED"
  | "RECEIVED"
  | "REFUND_PENDING"
  | "RESHIP_READY"
  | "RESHIPPING"
  | "REJECT_HOLD"
  | "COMPLETED";

// ── 목록 ────────────────────────────────────────────────

/** `GET /v1/admin/orders` 쿼리 — 빈 값은 보내지 않는다 */
export interface AdminOrderListQuery extends BaseParams {
  tab?: AdminOrderTab;
  status?: FulfillmentStatus;
  marketId?: number;
  groupBuyId?: number;
  creatorId?: number;
  paymentMethod?: PaymentMethod;
  trackingAlert?: TrackingAlert;
  searchType?: AdminOrderSearchType;
  keyword?: string;
  sort?: AdminOrderSort;
  /** 결제일 시작(포함) — yyyy-MM-dd */
  from?: string;
  /** 결제일 끝(포함) — yyyy-MM-dd */
  to?: string;
}

/** `GET /v1/admin/orders/summary` 쿼리 — 탭 · 상태 · 이상 유형 · 정렬은 받지 않는다 */
export type AdminOrderSummaryQuery = Omit<
  AdminOrderListQuery,
  "tab" | "status" | "trackingAlert" | "sort" | "page" | "size"
>;

/** `AdminOrderGroupSummary` */
export interface AdminOrderGroupSummary {
  deliveryGroupId: number;
  subOrderNumber: string;
  brandName: string;
  status: FulfillmentStatus;
  statusLabel: string;
  statusTone: OrderBadgeTone;
  trackingAlert: TrackingAlert | null;
  trackingAlertLabel: string | null;
  /** 발송 기한 — 공구 진행 중이면 null */
  shipDueAt: string | null;
  shipOverdue: boolean;
  cancelRequested: boolean;
}

/** `AdminOrderListItem` */
export interface AdminOrderListItem {
  orderId: number;
  orderNumber: string;
  paidAt: string;
  recipientName: string;
  totalAmount: number;
  groups: Array<AdminOrderGroupSummary>;
  /** 운영자가 볼 것이 있는 하위주문 수 */
  attentionCount: number;
}

/** `AdminOrderSummaryResponse` — ALL · DELIVERY_ISSUE · CANCEL 세 키가 항상 있다 */
export interface AdminOrderSummary {
  tabCounts: Record<AdminOrderTab, number>;
}

// ── 상세 ────────────────────────────────────────────────

/** `AdminOrderConsumer` */
export interface AdminOrderConsumer {
  userId: number;
  name: string | null;
  email: string | null;
}

/** `AdminOrderRecipient` */
export interface AdminOrderRecipient {
  name: string;
  phone: string;
  zipCode: string;
  address: string;
  detailAddress: string;
  memo: string | null;
}

/** `AdminOrderPayment` */
export interface AdminOrderPayment {
  paymentId: string;
  /** `PaymentStatus` 이름 — PAID · CANCELLED … */
  status: string;
  methodLabel: string;
  amount: number;
  /** 부분 취소 누적액 */
  cancelledAmount: number;
  paidAt: string;
}

/** `AdminOrderShipping` */
export interface AdminOrderShipping {
  shipDueAt: string | null;
  shipDueBusinessDays: number;
  shipOverdue: boolean;
  overdueNoticeCount: number;
  prepareStartedAt: string | null;
  shippedAt: string | null;
  carrier: DeliveryCarrier | null;
  carrierLabel: string | null;
  trackingNumber: string | null;
  trackingAlert: TrackingAlert | null;
  trackingAlertLabel: string | null;
  lastTrackingAt: string | null;
  returnDetectedAt: string | null;
  returnCompletedAt: string | null;
  deliveredAt: string | null;
  /** 「자동 확인」 · 「운영자 정정」 · 「운영자 처리 · 추적 정지」 */
  deliveredSourceLabel: string | null;
}

/** `AdminOrderPurchaseConfirm` */
export interface AdminOrderPurchaseConfirm {
  paused: boolean;
  remainingDays: number | null;
  /** 확정 예정 — 정지 중이면 null */
  dueAt: string | null;
  confirmedAt: string | null;
}

/** `AdminOrderCancel` */
export interface AdminOrderCancel {
  cancelledAt: string;
  cancelTypeLabel: string;
  reasonLabel: string | null;
  reasonDetail: string | null;
}

/** `AdminOrderCancelRequest` */
export interface AdminOrderCancelRequest {
  cancelRequestId: number;
  reasonLabel: string;
  reasonDetail: string | null;
  requestedAt: string;
  respondDueAt: string;
  orderProductIds: Array<number>;
}

/** `AdminOrderItem` */
export interface AdminOrderItem {
  orderProductId: number;
  productName: string;
  optionName: string | null;
  quantity: number;
  returnedQuantity: number;
  /** 주문 단가 */
  price: number;
  /** `OrderProductStatus` 이름 — PENDING · PAID · PURCHASE_CONFIRMED · CANCELLED · RETURNED */
  status: string;
  cancelTypeLabel: string | null;
}

/** `AdminOrderRefund` */
export interface AdminOrderRefund {
  refundTaskId: number;
  refundNo: string;
  source: RefundTaskSource;
  origin: RefundTaskOrigin;
  originLabel: string;
  amount: number;
  status: RefundTaskStatus;
  lastError: string | null;
  executedAt: string | null;
  createdAt: string;
}

/** `AdminOrderActiveClaim` */
export interface AdminOrderActiveClaim {
  claimId: number;
  claimNumber: string;
  type: ClaimType;
  status: ClaimStatus;
  statusLabel: string;
}

/** `AdminOrderHistory` */
export interface AdminOrderHistory {
  eventType: string;
  label: string;
  /** `FulfillmentActorType` 이름 — SYSTEM · SELLER · ADMIN · CONSUMER · TRACKER */
  actorType: string;
  detail: string | null;
  occurredAt: string;
}

/** `AdminOrderSettlementClawback` */
export interface AdminOrderSettlementClawback {
  clawbackNumber: string;
  /** BRAND · CREATOR */
  side: string;
  /** PENDING · APPLIED · UNRECOVERABLE */
  status: string;
  statusLabel: string;
  amount: number;
}

/** `AdminOrderSettlement` */
export interface AdminOrderSettlement {
  settlementId: number;
  settlementNumber: string;
  status: string;
  statusLabel: string;
  confirmedAt: string | null;
  settledAmount: number;
  rewardAmount: number;
  clawbacks: Array<AdminOrderSettlementClawback>;
}

/** `AdminOrderActions` — 버튼 노출의 정본. 거짓이면 그리지 않는다 */
export interface AdminOrderActions {
  canCorrectDeliveredAt: boolean;
  canRegisterShipment: boolean;
  canCancel: boolean;
  canEnqueueRefund: boolean;
  canOpenDefectClaim: boolean;
  canMarkLost: boolean;
  canMarkDelivered: boolean;
}

/** `AdminOrderGroupDetail` */
export interface AdminOrderGroupDetail {
  deliveryGroupId: number;
  subOrderNumber: string;
  marketId: number;
  brandName: string;
  groupBuyNumber: string | null;
  status: FulfillmentStatus;
  statusLabel: string;
  statusTone: OrderBadgeTone;
  shipping: AdminOrderShipping;
  purchaseConfirm: AdminOrderPurchaseConfirm | null;
  cancel: AdminOrderCancel | null;
  cancelRequest: AdminOrderCancelRequest | null;
  items: Array<AdminOrderItem>;
  refunds: Array<AdminOrderRefund>;
  activeClaims: Array<AdminOrderActiveClaim>;
  /** 오래된순 */
  history: Array<AdminOrderHistory>;
  settlement: AdminOrderSettlement | null;
  actions: AdminOrderActions;
}

/** `AdminOrderDetailResponse` */
export interface AdminOrderDetail {
  orderId: number;
  orderNumber: string;
  orderStatus: string;
  paidAt: string;
  consumer: AdminOrderConsumer;
  recipient: AdminOrderRecipient;
  payment: AdminOrderPayment | null;
  inquiryCount: number;
  groups: Array<AdminOrderGroupDetail>;
}

// ── 조치 요청 ───────────────────────────────────────────

/** `AdminMarkLostRequest` */
export interface MarkLostRequest {
  reason: string;
}

/** `AdminMarkDeliveredRequest` */
export interface MarkDeliveredRequest {
  /** yyyy-MM-ddTHH:mm:ss */
  deliveredAt: string;
  reason: string;
}

/** `AdminCorrectDeliveredAtRequest` */
export interface CorrectDeliveredAtRequest {
  /** yyyy-MM-ddTHH:mm:ss */
  deliveredAt: string;
  reason: string;
}

/** `AdminShipmentRequest` */
export interface ShipmentRequest {
  carrier: DeliveryCarrier;
  trackingNumber: string;
  note: string;
}

/** `AdminCancelRequest` */
export interface CancelCommand {
  reasonCode: SellerCancelReason;
  consumerMessage: string;
}

/** `AdminOperatorRefundRequest` */
export interface OperatorRefundRequest {
  reason: OperatorRefundReason;
  amount: number;
  detail: string;
}

/** `AdminDefectClaimItem` */
export interface DefectItem {
  orderProductId: number;
  quantity: number;
}

/** `AdminDefectClaimRequest` */
export interface DefectClaimRequest {
  items: Array<DefectItem>;
  reasonCode: ClaimReason;
  detail: string;
  evidenceImageUrls: Array<string>;
}

/** `AdminDefectClaimResponse` */
export interface DefectClaimResponse {
  requestId: number;
  claimIds: Array<number>;
}

// ── 화면 전용 ───────────────────────────────────────────

export type OrderPeriod =
  "TODAY" | "WEEK" | "MONTH" | "QUARTER" | "CUSTOM" | "ALL";

/**
 * 주소창 조건 — 전부 문자열로 읽힌다(`normalizeOrderParams`가 바로잡는다).
 * `status`는 탭마다 다른 축이다: 전체 탭은 `FulfillmentStatus`, 배송 이상 탭은 이상 유형
 * (`TrackingAlert` 둘 + 반송 중 = `RETURNING` 상태). 취소 탭은 셀렉트가 없다.
 */
export interface OrderListParams extends BaseParams {
  tab: AdminOrderTab;
  status: string;
  searchType: AdminOrderSearchType;
  keyword: string;
  period: OrderPeriod;
  /** period=CUSTOM일 때만 쓴다 — yyyy-MM-dd */
  from: string;
  to: string;
  marketId: string;
  groupBuyId: string;
  /** 고르는 셀렉트가 없다 — 다른 화면에서 넘어온 값만 칩으로 보인다 */
  creatorId: string;
  paymentMethod: string;
  sort: AdminOrderSort;
  /** 상세 모달로 바로 연다(예외 관리 「열기」 · `?orderId=`) */
  orderId: string;
}

export interface OrderBadgeData {
  label: string;
  tone: OrderBadgeTone;
}
