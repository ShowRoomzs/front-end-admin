import type { BaseParams, PageResponse } from "@/common/types";

/*
  어드민 반품·교환(06b) — 백엔드 `AdminTransactionDto`(06b 부분)와 그 안에 감싼
  `SellerClaimListItem` · `SellerClaimDetailResponse` · `SellerClaimSummaryResponse`,
  `domain/order/type/Claim*`를 그대로 옮겼다.
  LocalDateTime은 시간대 없는 ISO 문자열이고 표시할 때 `utils/format`이 읽는다.
*/

// ── enum ──────────────────────────────────────────────

/** `ClaimTab` — 파트너 11과 같은 7종 */
export type ClaimTab =
  | "ALL"
  | "COLLECT_WAIT"
  | "COLLECTING"
  | "INSPECTION"
  | "RESHIP"
  | "REJECT_HOLD"
  | "DONE";

/** `ClaimSort` — 없으면 탭 기본 정렬(작업 탭은 단계 진입 오래된순 · 전체·완료는 최신순) */
export type ClaimSort = "REQUESTED_DESC" | "ELAPSED_ASC";

export type ClaimType = "RETURN" | "EXCHANGE";

export type ClaimReason =
  | "CHANGE_OF_MIND"
  | "ORDER_MISTAKE"
  | "SIZE_MISMATCH"
  | "DAMAGED_OR_DEFECTIVE"
  | "WRONG_OR_LATE_DELIVERY"
  | "OTHER";

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

/** `ClaimFeeBearer` — 귀책 */
export type ClaimFeeBearer = "CONSUMER" | "SELLER";

export type ClaimChargeStatus =
  "PENDING" | "PAID" | "DEDUCTED" | "COVERED" | "VOID" | "REFUNDED" | "WAIVED";

export type StoragePhase = "NOTICE_PENDING" | "STORING" | "EXPIRED";

/** `OrderBadgeTone` — 클레임 행은 서버가 전부 NEUTRAL로 내린다(색은 FE가 단계로 고른다) */
export type ClaimTone = "NEUTRAL" | "INFO" | "WARNING" | "SUCCESS" | "DANGER";

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

export type ClaimRejectLegalBasis =
  "ART17_2_1" | "ART17_2_2" | "ART17_2_3" | "ART17_2_5";

/** 재발송 사유 — 서버 타입은 String */
export type ClaimReshipReason = "EXCHANGE" | "REJECT_RETURN";

/** 완료 탭 결과 — 서버 타입은 String */
export type ClaimOutcomeCode =
  | "REFUND_PENDING"
  | "RESHIPPING"
  | "REFUNDED"
  | "EXCHANGED"
  | "REJECTED"
  | "CANCELLED";

// ── 목록 행(SellerClaimListItem) ──────────────────────

export interface ClaimCollection {
  collectionId: number;
  /** 2 이상이면 같은 박스의 클레임이 여럿 */
  size: number;
  leadClaimNumber: string;
  carrier: DeliveryCarrier | null;
  carrierLabel: string | null;
  trackingNumber: string | null;
  lastTrackingLabel: string | null;
  lastTrackingAt: string | null;
  arrivedAt: string | null;
}

export interface ClaimReshipFee {
  amount: number;
  status: ClaimChargeStatus;
  statusLabel: string;
  /** 반려 재발송비 결제 기한(「D-N」 기준일) — 결제가 필요 없거나 판정 중이면 null */
  dueAt: string | null;
}

export interface ClaimStorage {
  noticeCount: number;
  lastNoticeAt: string | null;
  /** 고지 2회 미만이면 null(기한 미정) */
  storageDueAt: string | null;
  phase: StoragePhase;
}

export interface ClaimOutcome {
  code: ClaimOutcomeCode;
  label: string;
  /** 환불 대기 · 재발송 중은 false */
  finalized: boolean;
}

/** 파트너 버튼 — 어드민은 쓰지 않는다 */
export interface ClaimListActions {
  canConfirmReceipt: boolean;
  canInspect: boolean;
  canRegisterReshipment: boolean;
}

export interface ClaimOrderItem {
  productName: string;
  optionName: string | null;
  orderedQuantity: number;
  /** 이 요청에서 신청한 수량 — 신청하지 않은 항목은 0 */
  claimedQuantity: number;
  /** 단가 */
  price: number;
  itemStatusLabel: string;
}

export interface SellerClaimListItem {
  claimId: number;
  claimNumber: string;
  type: ClaimType;
  typeLabel: string;
  consumerName: string;
  productName: string;
  optionName: string | null;
  exchangeOptionName: string | null;
  /** 「상품 옵션 → 교환 옵션」 */
  productLabel: string;
  /** 재발송·반려 보류 탭의 「보낼 상품·옵션」/「보관 중인 상품」 */
  shipLabel: string | null;
  quantity: number;
  reasonCode: ClaimReason;
  reasonLabel: string;
  consumerAttachmentCount: number;
  openedByOperator: boolean;
  openReason: string | null;
  status: ClaimStatus;
  statusLabel: string;
  stage: ClaimTab;
  statusTone: ClaimTone;
  requestedAt: string;
  stageEnteredAt: string;
  /** 현재 단계 진입부터의 달력일(파트너 기준) — 어드민 「경과」 영업일은 `ClaimListItem.elapsedBusinessDays` */
  elapsedDays: number;
  /** 회수 대기 방치 또는 검수 기한 경과 */
  overdue: boolean;
  collection: ClaimCollection | null;
  receivedAt: string | null;
  inspectDueAt: string | null;
  reshipReason: ClaimReshipReason | null;
  reshipReasonLabel: string | null;
  reshipCarrier: DeliveryCarrier | null;
  reshipCarrierLabel: string | null;
  reshipTrackingNumber: string | null;
  reshipFee: ClaimReshipFee | null;
  rejectReasonLabel: string | null;
  sellerEvidenceCount: number;
  rejectedAt: string | null;
  storage: ClaimStorage | null;
  outcome: ClaimOutcome | null;
  /** 완료 탭 「금액」 — 교환·반려는 null */
  amount: number | null;
  completedAt: string | null;
  actions: ClaimListActions;
  orderItems: Array<ClaimOrderItem>;
  /** 「3개 항목 중 1개 신청」 */
  orderSummary: string;
}

/** `AdminTransactionDto.ClaimListItem` — 파트너 행 + 어드민 전용 열 */
export interface ClaimListItem {
  claim: SellerClaimListItem;
  brandName: string | null;
  feeBearer: ClaimFeeBearer | null;
  feeBearerLabel: string | null;
  faultChangedToSeller: boolean;
  /** 「소비자 이의 접수」 — 반려 보류 중이고 이의 문의가 답변 전 */
  disputeOpen: boolean;
  disputedAt: string | null;
  /** 「경과」 — 현재 단계 진입부터의 영업일(기산일 불산입 · 주말·공휴일 제외) */
  elapsedBusinessDays: number;
}

// ── 요약 ──────────────────────────────────────────────

export interface ClaimKpi {
  collectWait: number;
  inspection: number;
  reship: number;
  /** 회수 대기 방치 + 검수 기한 경과 */
  overdue: number;
}

/** `AdminTransactionDto.ClaimSummary` — 검색 조건·기간과 무관한 전체 기준 */
export interface ClaimSummary {
  kpi: ClaimKpi;
  tabCounts: Record<ClaimTab, number>;
  typeCounts: Record<ClaimType, number>;
  /** 반려 이의 미처리 — 사이드바 「반품·교환」 배지 */
  disputeCount: number;
}

// ── 상세(SellerClaimDetailResponse + 어드민 열) ───────

export interface ClaimRejection {
  legalBasis: ClaimRejectLegalBasis | null;
  legalBasisLabel: string | null;
  consumerMessage: string | null;
  /** 브랜드 귀책으로 인정했다 */
  faultChangedToSeller: boolean;
  /** 일부 반려로 갈라져 나온 행이면 원래 접수번호 */
  splitFromClaimNumber: string | null;
}

export interface ClaimPurchaseConfirm {
  paused: boolean;
  remainingDays: number | null;
  dueAt: string | null;
}

/** 요청(박스) 단위 환불 예정액 */
export interface ClaimRefund {
  /** 이 항목의 상품 금액(단가 × 신청 수량) */
  itemAmount: number;
  /** 요청의 최초 배송비 차감액(기-18 — 무료배송 주문 · 소비자 귀책만 · 요청당 한 번) */
  requestDeduction: number;
  /** 요청의 환불 예정액 — 판정이 끝났으면 확정액 */
  requestExpectedAmount: number;
  /** 서버 산정 근거 — 「상품 금액 − 최초 배송비」 · 「상품 금액(배송비 차감 없음)」 · 「브랜드 부담 사유 — 배송비 차감 없음」 */
  basisLabel: string;
}

export interface ClaimResult {
  reshipDeliveredAt: string | null;
  confirmDueAt: string | null;
  /** RETURNED 반송 완료 · DISPOSED 폐기 */
  rejectionEnd: string | null;
  disposedAt: string | null;
}

export interface ClaimNotice {
  seq: number;
  notifiedAt: string;
  channel: string | null;
}

export interface ClaimHistoryItem {
  eventType: string;
  eventLabel: string;
  actorType: string;
  actorLabel: string;
  detail: string | null;
  occurredAt: string;
}

/** 파트너 버튼 — 어드민은 쓰지 않는다 */
export interface ClaimDetailActions {
  canConfirmReceipt: boolean;
  canPass: boolean;
  canReject: boolean;
  canRegisterReshipment: boolean;
  canUpdateReshipment: boolean;
  /** [사유 번복] 가능(main · 1021 기-17) — 배포된 서버는 내리지 않는다 */
  canOverturn?: boolean;
}

/** `ClaimInspectionResult` — 검수 판정(1021 기-17 · main) */
export type ClaimInspectionResult = "PASSED" | "REASON_OVERTURNED" | "REJECTED";

/** `FreightAdjustmentTrigger` — 귀책 변경 운임 정산의 발생 지점(1021 기-93 · main) */
export type FreightAdjustmentTrigger =
  | "REASON_OVERTURNED"
  | "FAULT_TO_SELLER_ON_PASS"
  | "REJECT_WITH_COLLECT"
  | "DISPUTE_ACCEPTED";

/** `FreightAdjustmentDirection` — CHARGE_CONSUMER(소비자 부담 · 정산 +) · REFUND_CONSUMER(소비자 환급 · 정산 −) */
export type FreightAdjustmentDirection = "CHARGE_CONSUMER" | "REFUND_CONSUMER";

/** `FreightSettledVia` — 운임이 소비자와 오간 길 */
export type FreightSettledVia =
  "REFUND_DEDUCTION" | "CHARGE" | "REFUND_ADDITION" | "BANK_TRANSFER";

/** `SellerClaimFreightRow` — 운임 정산 한 행(브랜드 정산 「± 운임 정산」과 같은 행) */
export interface ClaimFreightRow {
  trigger: FreightAdjustmentTrigger;
  /** 「사유 번복」 · 「귀책 변경 · 통과」 · 「반려 · 착불 운임」 · 「이의 인용 · 귀책 변경」 */
  triggerLabel: string;
  direction: FreightAdjustmentDirection;
  /** 착불 운임(정액) — 소비자 청구 */
  collectFreight: number;
  /** 선불 운임 환급(정액 = 기본 배송비 편도) */
  prepaidFreight: number;
  /** 차감했던 최초 배송비 환원 — 표시용(정산 금액에는 들어가지 않는다) */
  initialFeeRestored: number;
  /** 정산 반영 금액(부호 있음) */
  signedAmount: number;
  settledVia: FreightSettledVia;
}

/** `SellerClaimInspection` — 검수 판정 · 운임 정산(main · 판정 · 운임 행 · 자동 입고가 있을 때만) */
export interface ClaimInspection {
  result: ClaimInspectionResult | null;
  /** 「검수 통과」 · 「사유 번복」 · 「검수 반려」 */
  resultLabel: string | null;
  /** 사유 번복 설명 — 소비자에게 그대로 보인다 */
  explanation: string | null;
  /** 택배 도착 후 N영업일 입고 확인이 없어 시스템이 입고 처리했다 */
  autoReceived: boolean;
  /** 교환 사유 번복 결제 금액(재발송 배송비 + 착불 운임) */
  overturnFee: number | null;
  freight: Array<ClaimFreightRow>;
}

export interface SellerClaimDetail {
  summary: SellerClaimListItem;
  orderNumber: string;
  /** 하위주문 id */
  deliveryGroupId: number;
  /** 마스킹된 값 */
  consumerPhone: string | null;
  reasonDetail: string | null;
  /** 교환만 — [호환] main은 `reshipFeeCharged`와 같은 값으로 1릴리스 더 내린다 */
  exchangeFeeCharged: boolean | null;
  /** 교환 재발송 배송비 청구 여부(main · 기-18 개명) — 배포된 서버에는 없다 */
  reshipFeeCharged?: boolean | null;
  /** 검수 판정 · 운임 정산(main · 기-17 · 기-93) — 배포된 서버에는 없다 */
  inspection?: ClaimInspection | null;
  /** 반품만 */
  refund: ClaimRefund | null;
  consumerAttachments: Array<string>;
  sellerEvidences: Array<string>;
  rejectDetail: string | null;
  rejection: ClaimRejection | null;
  purchaseConfirm: ClaimPurchaseConfirm | null;
  result: ClaimResult | null;
  notices: Array<ClaimNotice>;
  /** 최신순 */
  history: Array<ClaimHistoryItem>;
  actions: ClaimDetailActions;
}

export interface ClaimInspectNotice {
  count: number;
  lastAt: string | null;
}

export interface ClaimDispute {
  inquiryId: number;
  content: string;
  imageUrls: Array<string>;
  createdAt: string;
  answered: boolean;
  answeredAt: string | null;
}

/**
 * `AdminTransactionDto.LegalDeadline` — 전자상거래법 제17조③ 법정 청약철회 기한.
 * 날짜는 LocalDate(「2026-08-27」)다.
 */
export interface ClaimLegalDeadline {
  /** 공급일 — 하위주문 배송완료일 */
  suppliedOn: string;
  /** 공급일 + 3개월 */
  supplyDeadline: string;
  /** 하자 인지일 — B6 개설 때 운영자 입력(선택) */
  noticedOn: string | null;
  /** 인지일 + 30일 — 인지일이 없으면 null */
  noticeDeadline: string | null;
  /** 적용 기한 — 둘 중 이른 날(인지일이 없으면 공급 기준) */
  appliedDeadline: string;
}

/** `AdminTransactionDto.ClaimSettlement` — 그 하위주문이 들어간 정산 */
export interface ClaimSettlement {
  settlementNumber: string;
  /** REVIEWING · ADJUSTING · PAYOUT_SCHEDULED · PAID · PAYOUT_FAILED */
  status: string;
  statusLabel: string;
  /** 정산 확정 시각 — 확정 전 null */
  confirmedAt: string | null;
  /** 검수 통과 시 다음 정산에서 차감 — 반품이고 검수 판정 전일 때만 참 */
  deductOnPass: boolean;
}

/** `AdminTransactionDto.ClaimDetail` */
export interface ClaimDetail {
  claim: SellerClaimDetail;
  /** 「주문 상세 열기」 — 주문 조회 `?orderId=` */
  orderId: number;
  /** 하위주문 */
  deliveryGroupId: number;
  brandName: string;
  feeBearer: ClaimFeeBearer;
  feeBearerLabel: string;
  /** B2 반려 이의 인용 가능 */
  canAcceptDispute: boolean;
  /** 인용 환불액 — 서버 계산 · 수정 불가 */
  disputeRefundAmount: number | null;
  /** 검수 무응답 운영자 환불 가능 */
  canRefundUnanswered: boolean;
  unansweredRefundAmount: number | null;
  dispute: ClaimDispute | null;
  inspectNotice: ClaimInspectNotice;
  /** 검수 기한 N영업일 초과 — 검수 대기이고 기한이 지났을 때만 */
  inspectOverdueBusinessDays: number | null;
  /** B4 법정 청약철회 기한 — 운영자가 대신 연 클레임만 */
  legalDeadline: ClaimLegalDeadline | null;
  /** B4 정산 반영 — 정산 생성 전이면 null */
  settlement: ClaimSettlement | null;
  /**
   * 【서버 없음】 최초 배송비 차감 근거 — 무료배송 기준 판정(「전량 반품이라 남은 금액 0원(기준 미달)」 ·
   * 「남은 금액 32,000원 · 기준 30,000원 이상」). 1021 설계서 4-3의 `deductionReason`은 아직 구현되지
   * 않았다(백엔드 요청). DEV 목업만 채운다 — 배포본은 근거 줄을 그리지 않는다.
   */
  deductionReason?: string | null;
  /**
   * 【서버 없음】 B2 「운임 정산 · 인용 시 + N 소비자 환급」 — 인용 전 선불 운임 환급 예정액(기본 배송비
   * 편도 정액). 인용 뒤에는 `claim.inspection.freight`에 실제 행이 생긴다. 백엔드 요청 · DEV 목업만.
   */
  disputeFreightRefund?: number | null;
}

// ── 운영자 조치 ───────────────────────────────────────

/** `DisputeAcceptRequest` · `ClaimRefundRequest` — 금액은 받지 않는다(서버 계산) */
export interface ClaimActionRequest {
  /** 근거 — 필수 · 500자 */
  detail: string;
}

/** `DisputeAcceptResponse` — 두 조치가 같은 응답을 쓴다 */
export interface ClaimActionResponse {
  refundTaskId: number;
  /** 환불 관리 검색어 「RFD-918」 */
  refundNo: string;
  amount: number;
}

// ── 화면 조건 ─────────────────────────────────────────

/** 검색어를 어느 서버 파라미터로 보낼지 — 서버는 셋을 AND로 거른다 */
export type ClaimSearchField = "keyword" | "marketName" | "consumerName";

/** 주소창에 남는 목록 조건 */
export interface ClaimListParams extends BaseParams {
  tab: ClaimTab;
  /** 빈 문자열이면 유형 전체 */
  type: "" | ClaimType;
  searchField: ClaimSearchField;
  keyword: string;
  /** 빈 문자열이면 탭 기본 정렬 */
  sort: "" | ClaimSort;
  /** 소비자 상세(13)의 칩에서 넘어온 진입 — 그 소비자의 신청만. 화면 필터에는 없다 */
  userId: string;
  /** 진행 중(종결 전) 신청만 — 소비자 상세 칩 진입 전용("true" | "") */
  openOnly: string;
}

/** 서버로 보내는 목록 조건(`GET /admin/claims`) */
export interface ClaimListQuery {
  tab: ClaimTab;
  /** main · 56 C1 — 소비자 상세 진입 */
  userId?: number;
  openOnly?: boolean;
  types?: Array<ClaimType>;
  from?: string;
  keyword?: string;
  marketName?: string;
  consumerName?: string;
  sort?: ClaimSort;
  page: number;
  size: number;
}

/**
 * 화면이 쓰는 목록 — 응답에 「이 결과를 어느 탭으로 불러왔는지」를 붙인다(FE 전용, 서버 필드 아님).
 * 탭을 옮기는 동안 keepPreviousData가 직전 탭의 행을 붙잡고 있으므로,
 * 열 구성·상단 줄은 주소의 탭이 아니라 이 값을 따라야 행과 어긋나지 않는다.
 */
export interface ClaimListView extends PageResponse<ClaimListItem> {
  tab: ClaimTab;
}
