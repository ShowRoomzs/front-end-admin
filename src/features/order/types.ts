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
  | "LOST_IN_TRANSIT"
  /** 귀책 변경 운임 환급(1021 기-93) — main에만 있다(개발 서버 미배포) */
  | "FREIGHT_REFUND"
  /** 추적 정지 뒤 소비자가 환불을 고름(1021 기-15) — main에만 있다 */
  | "STALL_REFUND_CHOSEN";

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

/**
 * `ClaimChargeType` — 교환 선결제 · 반려 재발송비(둘 다 편도 재발송 배송비) · 교환 사유 번복
 * (재발송 배송비 + 착불 운임 · 1021 기-17 — main에만 있다)
 */
export type ClaimChargeType =
  "EXCHANGE_RESHIP" | "REJECT_RESHIP" | "OVERTURN_RESHIP";

/** `ClaimChargeStatus` */
export type ClaimChargeStatus =
  "PENDING" | "PAID" | "DEDUCTED" | "COVERED" | "VOID" | "REFUNDED" | "WAIVED";

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

/** `ClaimResult` — 종결 결과 */
export type ClaimResult = "REFUNDED" | "EXCHANGED" | "REJECTED" | "CANCELLED";

/** `StallChoice` — 추적 정지 소비자 선택(1021 기-15) */
export type StallChoiceValue = "RESHIP" | "REFUND";

// ── 목록 ────────────────────────────────────────────────

/** `GET /v1/admin/orders` 쿼리 — 빈 값은 보내지 않는다 */
export interface AdminOrderListQuery extends BaseParams {
  tab?: AdminOrderTab;
  status?: FulfillmentStatus;
  marketId?: number;
  groupBuyId?: number;
  creatorId?: number;
  /** 소비자 상세에서 넘어온 진입(main · 56 C1) — 그 소비자의 주문만 */
  userId?: number;
  paymentMethod?: PaymentMethod;
  trackingAlert?: TrackingAlert;
  searchType?: AdminOrderSearchType;
  keyword?: string;
  sort?: AdminOrderSort;
  /** 결제일 시작(포함) — yyyy-MM-dd */
  from?: string;
  /** 결제일 끝(포함) — yyyy-MM-dd */
  to?: string;
  /** 검토 중 취소 요청이 있는 하위주문만(main · 56 C1) — 요약은 무시한다 */
  cancelRequested?: boolean;
}

/** `GET /v1/admin/orders/summary` 쿼리 — 탭 · 상태 · 이상 유형 · 정렬은 받지 않는다 */
export type AdminOrderSummaryQuery = Omit<
  AdminOrderListQuery,
  | "tab"
  | "status"
  | "trackingAlert"
  | "sort"
  | "page"
  | "size"
  | "cancelRequested"
>;

/** `AdminOrderClaimSummary` — 하위주문의 반품 · 교환 요약(가장 최근 신청 1건 + 건수 · main) */
export interface AdminOrderClaimSummary {
  claimId: number;
  claimNumber: string;
  type: ClaimType;
  status: ClaimStatus;
  /** 종결 전이면 null */
  result: ClaimResult | null;
  /** 「반품완료」 · 「교환완료」 · 「환불완료」 · 「반품 반려」 · 「반품 진행중」 … */
  label: string;
  /** 신청 시각(이벤트) */
  requestedAt: string;
  /** 접수된 반품 · 교환 건수 — 2 이상이면 「외 N건」 */
  count: number;
}

/** `AdminOrderStallChoice` — 추적 정지 · 소비자 선택(1021 기-15 · main) */
export interface AdminOrderStallChoice {
  /** WAITING · OPEN · CHOSEN */
  state: "WAITING" | "OPEN" | "CHOSEN";
  /** 선택 개방 시각 = 추적 정지 판정 + N일(이벤트 시각 · UTC) */
  opensAt: string | null;
  /** 선택 개방까지 N일 */
  daysUntilOpen: number | null;
  daysStalled: number | null;
  choice: StallChoiceValue | null;
  /** 「재발송」 · 「환불」 */
  choiceLabel: string | null;
  /** 이벤트 시각 · UTC */
  chosenAt: string | null;
}

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
  /** 행 확장 항목 요약 — 「데일리 선크림 외 1종」(1종이면 옵션까지) */
  itemSummary: string;
  /** 항목 수량 합 */
  itemQuantity: number;
  /** 상품 합계 + 배송비 — 한 주문의 합이 `totalAmount` */
  amount: number;
  carrier: DeliveryCarrier | null;
  carrierLabel: string | null;
  trackingNumber: string | null;
  /** 공구명(계약 제목) — 공구 밖 하위주문이면 null */
  groupBuyTitle: string | null;
  /** 배송 이상 기준 시각 — 송장 등록 · 마지막 추적 · 반송 감지. 이상이 없으면 null */
  issueSince: string | null;
  /** 배송 이상 경과 문구 — 「등록 후 26시간」 · 「8일 무갱신」 · 「감지 09.12」 */
  issueElapsedLabel: string | null;
  /**
   * 반품 · 교환 요약(main · 개발 서버 미배포) — 없으면 null. 배포된 서버는 이 필드를 내리지 않아
   * `undefined`일 수 있다.
   */
  claim?: AdminOrderClaimSummary | null;
  /**
   * 【서버 없음】 추적 정지 소비자 선택 — main 목록 응답에도 아직 없다(상세 `stallChoice`만 있다).
   * 백엔드 요청: `AdminOrderGroupSummary.stallChoice`. 지금은 DEV 목업(`?mock=stall`)만 채운다.
   */
  stallChoice?: AdminOrderStallChoice | null;
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

/** `AdminOrderSummaryResponse` */
export interface AdminOrderSummary {
  /** ALL · DELIVERY_ISSUE · CANCEL 세 키가 항상 있다 */
  tabCounts: Record<AdminOrderTab, number>;
  /**
   * 상태 셀렉트 건수(전체 탭 기준) — PENDING을 뺀 키가 항상 있다. 상태가 갈린 주문은 상태마다
   * 세므로 합이 전체보다 클 수 있다
   */
  statusCounts: Record<Exclude<FulfillmentStatus, "PENDING">, number>;
  /** 이상 유형 셀렉트 건수(배송 이상 탭 기준) — 반송 중은 `status=RETURNING`과 같은 수 */
  deliveryIssueCounts: Record<TrackingAlert | "RETURNING", number>;
}

/** `AdminGroupBuyCreatorOption` — 인플루언서 셀렉트 한 줄 */
export interface AdminOrderCreatorOption {
  creatorId: number;
  /** 쇼룸명 — 공구 목록 `creatorName`과 같은 값 */
  showroomName: string | null;
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
  /**
   * 운영자 사유 환불 상한 = 취소 가능 잔액 − 아직 나가지 않은 환불(대기 · 집행 중 · 실패).
   * 넘기면 409 `REFUND_AMOUNT_EXCEEDED`
   */
  operatorRefundableAmount: number;
}

/** `AdminOrderInquiry` — 이 주문을 가리키는 1:1 문의 */
export interface AdminOrderInquiry {
  inquiryId: number;
  typeLabel: string;
  createdAt: string;
  answered: boolean;
}

/** `AdminOrderAdditionalPayment` — 클레임 재발송비 결제(성립한 것만) */
export interface AdminOrderAdditionalPayment {
  deliveryGroupId: number;
  collectionId: number;
  /** 그 요청의 첫 클레임 — 06b 상세 링크 */
  claimId: number;
  claimNumber: string;
  chargeId: number;
  chargeType: ClaimChargeType;
  /** 「교환 재발송비」 · 「반려 재발송비」 */
  typeLabel: string;
  amount: number;
  status: ClaimChargeStatus;
  statusLabel: string;
  paymentId: string;
  /** PG 거래번호 */
  pgTxId: string | null;
  methodLabel: string;
  paidAt: string | null;
  /** 결제됐고 취소 전이면 결제액, 아니면 0(전액 취소만 한다) */
  cancellableAmount: number;
}

/** `AdminOrderShipping` */
export interface AdminOrderShipping {
  shipDueAt: string | null;
  shipDueBusinessDays: number;
  shipOverdue: boolean;
  overdueNoticeCount: number;
  /** 마지막 자동 알림 시각 — 알림 전이면 null */
  lastOverdueNoticeAt: string | null;
  prepareStartedAt: string | null;
  shippedAt: string | null;
  carrier: DeliveryCarrier | null;
  carrierLabel: string | null;
  trackingNumber: string | null;
  /** 송장 출처 — SELLER(브랜드 등록) · ADMIN(운영자 대행). 송장이 없으면 null */
  invoiceSource: "SELLER" | "ADMIN" | null;
  invoiceSourceLabel: string | null;
  trackingAlert: TrackingAlert | null;
  trackingAlertLabel: string | null;
  lastTrackingAt: string | null;
  /** 마지막 스캔 문구(「간선 상차」) — 연동 업체 원문 · 스캔 전이면 null */
  lastTrackingLabel: string | null;
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
  /** 공구 · 인플루언서 — 공구 밖 하위주문이면 넷 다 null */
  groupBuyId: number | null;
  groupBuyTitle: string | null;
  creatorId: number | null;
  /** 인플루언서 쇼룸명 */
  creatorName: string | null;
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
  /**
   * 추적 정지 · 소비자 선택(main · 개발 서버 미배포) — 없으면 null. 배포된 서버는 내리지 않아
   * `undefined`일 수 있다.
   */
  stallChoice?: AdminOrderStallChoice | null;
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
  /** 이 주문을 가리키는 1:1 문의 — 최신순 · `inquiryCount`와 같은 집합 */
  inquiries: Array<AdminOrderInquiry>;
  /** ① 추가 결제 — 클레임 재발송비 중 PG 결제가 붙은 것(원래 결제와 거래가 따로) */
  additionalPayments: Array<AdminOrderAdditionalPayment>;
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
  /**
   * 하자 인지일(yyyy-MM-dd) — 배송완료일 이후 · 오늘 이전. 「인지 + 30일」 기산점.
   * 서버는 선택(nullable)이지만 시안 B6이 필수라 폼이 필수로 막는다(사용자 결정 · 백엔드 요청: 필수화).
   */
  defectNoticedOn?: string;
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
  creatorId: string;
  paymentMethod: string;
  sort: AdminOrderSort;
  /** 상세 모달로 바로 연다(예외 관리 「열기」 · `?orderId=`) */
  orderId: string;
  /** 소비자 상세(13)의 칩에서 넘어온 진입 — 그 소비자의 주문만. 화면 필터에는 없다 */
  userId: string;
  /** 취소 탭의 「검토 중 취소 요청」만 — 소비자 상세 칩 진입 전용("true" | "") */
  cancelRequested: string;
}

export interface OrderBadgeData {
  label: string;
  tone: OrderBadgeTone;
}
