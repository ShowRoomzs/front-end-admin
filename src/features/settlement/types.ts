import type { PageInfo, PageParams } from "@/common/types/page";

/*
  어드민 정산 관리 — 공구 정산(ui-admin-07a · 07b). 서버 `/v1/admin/settlements`.

  이름 · enum · nullable은 백엔드 `AdminSettlementDto`(api/admin/settlement/dto)와 도메인 enum
  (domain/settlement/type)을 그대로 따른다. 금액은 원 단위 정수, 날짜는 로컬 ISO 문자열
  (LocalDate `2026-08-31` · LocalDateTime `2026-08-31T09:02:00`), 요율(BigDecimal)은 숫자다
  (0.03 = 3% · 명세 항목의 `rewardRate`만 퍼센트 값 10.0).
*/

// ── 도메인 enum ──────────────────────────────────────

/** SettlementStatus — 분배 실패는 어드민만 본다(수취자 화면은 지급 완료로 접는다) */
export type SettlementStatus =
  "REVIEWING" | "ADJUSTING" | "PAYOUT_SCHEDULED" | "PAID" | "PAYOUT_FAILED";

/** SettlementTone — 배지 색은 서버 enum 한 곳이 정한다 */
export type SettlementTone =
  "NEUTRAL" | "INFO" | "WARNING" | "SUCCESS" | "DANGER";

/** 화면 조각(StlBadge · 이력 점)이 쓰는 색 — 서버 톤과 같은 집합 */
export type Tone = SettlementTone;

export type CreatorBusinessType = "INDIVIDUAL" | "BUSINESS";

/** PayoutStatus */
export type PayoutStatus =
  | "WAITING"
  | "HELD"
  | "BLOCKED"
  | "SCHEDULED"
  | "REQUESTED"
  | "PAID"
  | "FAILED"
  | "NOT_APPLICABLE";

/** SettlementPayee — PG 수수료는 행이 아니라 금액 칸이다 */
export type SettlementPayee = "BRAND" | "CREATOR" | "PLATFORM";

export type SettlementItemStatus =
  | "CONFIRMED"
  | "PARTIAL_RETURNED"
  | "RETURNED"
  | "CANCELLED"
  | "DELIVERY_EXCEPTION";

export type SettlementEventType =
  | "CREATED"
  | "ADJUSTMENT_REQUESTED"
  | "ADJUSTMENT_COUNTERED"
  | "ADJUSTMENT_REJECTED"
  | "ADJUSTMENT_ACCEPTED"
  | "ADJUSTMENT_DEADLINE_NOTICED"
  | "ADJUSTMENT_EXPIRED"
  | "ADJUSTMENT_WITHDRAWN"
  | "AUTO_CONFIRMED"
  | "CONFIRMED_BY_AGREEMENT"
  | "CONFIRMED_BY_EXPIRY"
  | "CONFIRMED_BY_WITHDRAWAL"
  | "TAX_INVOICE_REQUESTED"
  | "TAX_INVOICE_SUBMITTED"
  | "TAX_INVOICE_VERIFIED"
  | "TAX_INVOICE_REJECTED"
  | "BRAND_INVOICE_ISSUED"
  | "PAYOUT_REQUESTED"
  | "PAYOUT_PAID"
  | "PAYOUT_FAILED"
  | "PAYOUT_RETRIED"
  | "PAYOUT_DEFERRED"
  | "PAYOUT_BLOCKED"
  | "PAYOUT_HOLD_RELEASED"
  | "PAYOUT_CHECK_REQUIRED"
  | "WITHHOLDING_RECEIPT_GENERATED"
  | "WITHHOLDING_RECEIPT_SKIPPED"
  | "CLAWBACK_REGISTERED"
  | "CLAWBACK_APPLIED"
  | "CLAWBACK_UNRECOVERABLE"
  | "RECALCULATED";

export type SettlementActorType =
  "SYSTEM" | "PG" | "ADMIN" | "SELLER" | "CREATOR";

/** WITHDRAWN = 조정 요청 철회 → 원래 금액(1021 기-14) */
export type SettlementConfirmReason =
  "AUTO" | "AGREED" | "EXPIRED" | "WITHDRAWN";

/** TaxDocumentType */
export type TaxDocumentType =
  | "WITHHOLDING_RECEIPT"
  | "CREATOR_TAX_INVOICE"
  | "BRAND_TAX_INVOICE"
  | "BRAND_TAX_INVOICE_CREDIT";

/** TaxDocumentStatus — 유형마다 쓰는 부분집합이 다르다 */
export type TaxDocumentStatus =
  | "PENDING_INPUT"
  | "SUBMITTED"
  | "VERIFIED"
  | "REJECTED"
  | "PENDING_ISSUE"
  | "ISSUED"
  | "GENERATED";

/** ClawbackStatus — 이월 중이면 PENDING */
export type ClawbackStatus = "PENDING" | "APPLIED" | "UNRECOVERABLE";

/**
 * 차감 탭 행의 측별 상태 — 저장된 차감 3종 + 재계산 가상 행(1021 기-13 · 서버 `AdminClawbackRows`).
 * 확인 기간 중 환불은 차감이 아니라 「재계산 → 확인 기간 재시작」이지만 같은 탭에 보인다.
 */
export type ClawbackRowStatus = ClawbackStatus | "RECALCULATED";

// ── 목록 · 요약(7-1 ~ 7-3) ───────────────────────────

/** AdminSettlementTab — 정산 탭 4개는 정산 1건이 행, 증빙 · 차감은 문서 · 차감 1건이 행 */
export type SettlementTab =
  "ALL" | "REVIEWING" | "ADJUSTING" | "PAYOUT_FAILED" | "EVIDENCE" | "CLAWBACK";

/** AdminSettlementSort — 전체 탭만 고른다(상태 · 증빙 · 차감 탭은 서버 고정 정렬) */
export type SettlementSort = "SCHEDULE_DESC" | "SALES_DESC";

export interface SettlementListParams extends PageParams {
  tab: SettlementTab;
  keyword: string;
  /** 고정 정렬 탭이면 빈 문자열(보내지 않는다) */
  sort: SettlementSort | "";
}

export type ScheduleKind =
  "REVIEW_DUE" | "AGREEMENT_DUE" | "PAYOUT_DUE" | "PAID_AT" | "FAILED_AT";

/** AdminSettlementListItem */
export interface SettlementListItem {
  settlementId: number;
  settlementNumber: string;
  groupBuyId: number;
  groupBuyTitle: string;
  marketId: number;
  brandName: string;
  creatorId: number;
  showroomName: string;
  creatorBusinessType: CreatorBusinessType;
  periodStartAt: string;
  periodEndAt: string;
  confirmedSalesAmount: number;
  brandPayoutAmount: number;
  creatorPayoutAmount: number;
  status: SettlementStatus;
  statusLabel: string;
  statusTone: SettlementTone;
  /** 「일정」 열 — 상태별 다음 날짜 */
  scheduleAt: string | null;
  scheduleKind: ScheduleKind;
}

/** AdminSettlementFooter — 전체 탭만 · 지급 예정 · 지급 완료 · 분배 실패만 합산 */
export interface SettlementFooter {
  count: number;
  confirmedSalesAmount: number;
  brandPayoutAmount: number;
  pgFeeAmount: number;
  creatorPayoutAmount: number;
  withholdingAmount: number;
  creatorVatAmount: number;
  rewardVatAmount: number;
  platformFeeAmount: number;
}

/** AdminSettlementToolbar — 값이 있는 칸만 내려온다(NON_NULL) */
export interface SettlementToolbar {
  /** [조정 협의] 보류 합계 = 확정 거래액 합 */
  heldAmount?: number;
  /** [조정 협의] 가장 이른 합의 기한 */
  earliestDeadlineAt?: string;
  /** [분배 실패] 미지급 합계 */
  undeliveredAmount?: number;
  /** [분배 실패] 「인플루언서 2 · 브랜드 1」 */
  failedPayeeLabel?: string;
  /** [분배 실패] 최장 경과일 */
  elapsedDays?: number;
  /** [증빙 · 차감] 건수 */
  count?: number;
  /** [증빙] 운영자 조치 필요(확인 대기 + 발행 대기) */
  operatorActionCount?: number;
  /** [증빙] 지급을 막는 문서 수 */
  payoutBlockedCount?: number;
  /** [차감] 미회수 건수 */
  unrecoverableCount?: number;
  /** [차감] 미회수 금액 */
  unrecoverableAmount?: number;
}

/** AdminSettlementListResponse<T> */
export interface SettlementListResponse<T> {
  content: Array<T>;
  pageInfo: PageInfo;
  footer: SettlementFooter | null;
  toolbar: SettlementToolbar | null;
}

/**
 * AdminSettlementEvidenceItem — 행 = 문서 1건 · 처리 끝(확인 · 발행 · 생성 완료)은 빠진다.
 * 주민번호 미등록 가상 행(`RESIDENT_NUMBER_MISSING` · documentId null)은 기-12로 없어졌다 —
 * 아직 배포된 옛 서버가 내려 주면 서비스가 걸러 낸다(화면에는 오지 않는다).
 */
export interface EvidenceListItem {
  documentId: number;
  settlementId: number;
  settlementNumber: string;
  groupBuyTitle: string;
  /** 인플루언서 건은 쇼룸명 · 브랜드 건은 브랜드명 */
  counterpartyName: string;
  creatorBusinessType: CreatorBusinessType;
  type: TaxDocumentType;
  typeLabel: string;
  direction: string;
  inputAt: string | null;
  dueAt: string | null;
  status: TaxDocumentStatus;
  statusLabel: string;
  payoutImpact: "BLOCKING" | "NONE";
}

/**
 * AdminSettlementClawbackItem — 행 = 차감 번호 1건(측별 행을 한 줄로).
 * 재계산 가상 행은 차감번호 「—」 · 측별 상태 RECALCULATED · 금액 0 · reasonLabel = 이력 문장이다.
 */
export interface ClawbackListItem {
  clawbackNumber: string;
  originSettlementId: number;
  originSettlementNumber: string | null;
  orderNumber: string | null;
  productName: string | null;
  brandName: string | null;
  showroomName: string | null;
  reasonLabel: string;
  refundAmount: number;
  brandAmount: number;
  creatorAmount: number;
  brandStatus: ClawbackRowStatus | null;
  brandStatusLabel: string | null;
  creatorStatus: ClawbackRowStatus | null;
  creatorStatusLabel: string | null;
  appliedSettlementNumber: string | null;
  unrecoverableReasonLabel: string | null;
  createdAt: string;
}

/** AdminSettlementSummary */
export interface SettlementSummary {
  /** ALL · REVIEWING · ADJUSTING · PAYOUT_FAILED · EVIDENCE · CLAWBACK */
  tabCounts: Record<string, number>;
  /** GNB 배지 = 분배 실패 + 차감 미회수 + 증빙 확인 대기 · 발행 대기 */
  gnbBadge: number;
}

// ── 상세(7-4) ────────────────────────────────────────

export interface AmountCount {
  amount: number;
  count: number;
}

export interface RateAmount {
  rate: number;
  amount: number;
}

export interface SettlementOverview {
  groupBuyId: number;
  groupBuyNumber: string;
  groupBuyTitle: string;
  contractId: number;
  marketId: number;
  brandName: string;
  creatorId: number;
  showroomName: string;
  creatorBusinessType: CreatorBusinessType;
  periodStartAt: string;
  periodEndAt: string;
  ordersClosedAt: string;
  createdAt: string;
  orderCount: number;
  closedCount: number;
}

export interface SettlementStage {
  current: "REVIEW" | "ADJUSTMENT" | "CONFIRMED" | "PAID";
  /** 조정 없이 확정 — 「조정」 칸을 건너뜀으로 */
  adjustmentSkipped: boolean;
}

export interface BrandAxis {
  grossOrderAmount: number;
  cancel: AmountCount;
  /** 서버 JSON 키가 `return`이다(@JsonProperty) */
  return: AmountCount;
  deliveryException: AmountCount;
  confirmedSalesAmount: number;
  pgFee: RateAmount;
  platformFee: RateAmount;
  /** 원래 리워드 — rewardAmount와 다르면 합의로 바뀐 것 */
  originalRewardAmount: number;
  rewardAmount: number;
  rewardVat: RateAmount;
  /** 재발송비(소비자 결제분) — 교환 · 반려 · 번복 재발송 합산(기-18 「+ 재발송비」 한 줄) */
  reshipFee: AmountCount;
  /** 배송비(소비자 결제분) — 확정 거래액에서 뺀 배송비를 되돌린다(기-19) */
  consumerDeliveryFee: number;
  /**
   * + 반품 시 차감한 최초 배송비(1021 기-18 · origin/main V211).
   * 백엔드 배포 전 서버는 내리지 않는다(undefined) — 화면은 0으로 읽는다.
   */
  returnDeductionFee?: AmountCount;
  /** ± 운임 정산(1021 기-93) — 부호 있는 금액(− 소비자→브랜드 귀책 환급 · + 브랜드→소비자 귀책 회수). 배포 전 undefined */
  freightAdjustment?: AmountCount;
  payoutBeforeClawback: number;
  clawbackAmount: number;
  payoutAmount: number;
}

export interface CreatorAxis {
  businessType: CreatorBusinessType;
  rewardAmount: number;
  clawbackAmount: number;
  /** 비사업자만 — 사업자는 null */
  withholding: { amount: number; incomeRate: number; localRate: number } | null;
  vatAmount: number;
  payoutAmount: number;
}

export interface Breakdown {
  brand: BrandAxis;
  creator: CreatorAxis;
  platformShareAmount: number;
}

export interface AppliedClawback {
  clawbackNumber: string;
  originSettlementNumber: string | null;
  orderNumber: string | null;
  productName: string | null;
  reasonLabel: string;
  brandAmount: number;
  creatorAmount: number;
}

export interface AdjustmentProposal {
  proposalId: number;
  seq: number;
  proposerType: "SELLER" | "CREATOR";
  proposerName: string;
  proposedAt: string;
  rewardAmount: number;
  reason: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTERED" | "CLOSED";
  statusLabel: string;
  respondedAt: string | null;
  /** 이 금액으로 확정했다면 */
  preview: { creatorNetAmount: number; brandPayoutAmount: number };
}

export type AdjustmentStatus = "OPEN" | "AGREED" | "EXPIRED" | "WITHDRAWN";

export interface Adjustment {
  adjustmentId: number;
  /** 20b 이슈 스레드 — `/monitoring/threads?threadId=`로 연다(없으면 링크를 그리지 않는다) */
  threadId: number | null;
  /** WITHDRAWN = 요청자 철회 · 원래 금액으로 확정(1021 기-14) */
  status: AdjustmentStatus;
  statusLabel: string;
  requesterType: "SELLER" | "CREATOR";
  openedAt: string;
  deadlineAt: string;
  remainingBusinessDays: number | null;
  originalRewardAmount: number;
  maxRewardAmount: number;
  agreedRewardAmount: number | null;
  finalRewardAmount: number | null;
  closedAt: string | null;
  proposals: Array<AdjustmentProposal>;
}

export interface Payout {
  payoutId: number;
  payee: SettlementPayee;
  payeeLabel: string;
  payeeName: string;
  amount: number;
  bankName: string | null;
  /** 계좌 전체(어드민 기본정보 정책) */
  accountNumber: string | null;
  accountHolder: string | null;
  accountSource: "SNAPSHOT" | "CURRENT_PROFILE" | "NONE";
  status: PayoutStatus;
  statusLabel: string;
  statusTone: SettlementTone;
  dueDate: string | null;
  requestedAt: string | null;
  paidAt: string | null;
  failedAt: string | null;
  failCode: string | null;
  failReason: string | null;
  pgReference: string | null;
  /** 재분배 횟수 */
  attempt: number;
}

export interface Payouts {
  rows: Array<Payout>;
  pgFeeAmount: number;
  /** 수취자 합 + PG 수수료 + 원천징수 = 확정 거래액 + 재발송비 + 소비자 배송비 + 반품 시 차감한 최초 배송비 ± 운임 정산 */
  check: {
    total: number;
    inflowAmount: number;
    confirmedSalesAmount: number;
    withholdingAmount: number;
    balanced: boolean;
  };
}

export interface TaxDocument {
  documentId: number;
  type: TaxDocumentType;
  typeLabel: string;
  direction: string;
  counterpartyName: string;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  status: TaxDocumentStatus;
  statusLabel: string;
  /** 앞 8 · 뒤 4 마스킹 */
  approvalNumber: string | null;
  issuedDate: string | null;
  dueDate: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  rejectReason: string | null;
  rejectReasonLabel: string | null;
  fileName: string | null;
  actions: { canVerify: boolean; canRegister: boolean };
}

export interface FixedFee {
  contractId: number;
  amount: number | null;
  trigger: string | null;
  triggerLabel: string | null;
}

export interface SettlementItem {
  itemId: number;
  orderId: number;
  deliveryGroupId: number;
  orderNumber: string;
  subOrderNumber: string | null;
  consumerNameMasked: string;
  productName: string;
  optionName: string | null;
  quantity: number;
  returnedQuantity: number;
  settledQuantity: number;
  unitPrice: number;
  paidAmount: number;
  status: SettlementItemStatus;
  statusLabel: string;
  settledAmount: number;
  /** 퍼센트 값(10.0 = 10%) */
  rewardRate: number;
  rewardAmount: number;
}

export interface SettlementItems {
  total: number;
  returnCount: number;
  /** 교환 재발송 건수 */
  exchangeCount: number;
  /** 최근 5건 — 주문번호 내림차순 */
  rows: Array<SettlementItem>;
  footer: {
    paidAmount: number;
    settledAmount: number;
    itemRewardTotal: number;
    /** 정산 리워드 — 합의로 바뀌었으면 항목 합과 다르다 */
    rewardAmount: number;
  };
}

export interface BlockReason {
  code: string;
  label: string;
}

export interface FailedPayout {
  payoutId: number;
  payee: SettlementPayee;
  payeeLabel: string;
  amount: number;
  failedAt: string;
  failCode: string | null;
  failReason: string | null;
  attempt: number;
  /** 재분배 상한 */
  retryLimit: number;
}

export interface SettlementRail {
  status: SettlementStatus;
  statusLabel: string;
  statusTone: SettlementTone;
  confirmedSalesAmount: number;
  brandPayoutAmount: number;
  creatorPayoutAmount: number;
  reviewDueAt: string;
  deadlineAt: string | null;
  confirmedAt: string | null;
  confirmReason: SettlementConfirmReason | null;
  confirmReasonLabel: string | null;
  payoutDueDate: string | null;
  /** 지급 예정일 근거 — 「자동 확정 10.06 + 3영업일 · 10.09 한글날 제외」 */
  payoutBasis: string | null;
  paidAt: string | null;
  /** 지급 보류 사유 — 확정 전 · 보류 없음이면 [] */
  blockReasons: Array<BlockReason>;
  /** PAYOUT_FAILED일 때 첫 실패 행 */
  failedPayout: FailedPayout | null;
}

export interface SettlementActions {
  canRedistribute: boolean;
  canVerifyInvoice: boolean;
  canRegisterBrandInvoice: boolean;
  canDownloadStatement: boolean;
}

export interface SettlementHistory {
  eventType: SettlementEventType;
  label: string;
  actorType: SettlementActorType;
  actorLabel: string;
  detail: string | null;
  occurredAt: string;
}

/** AdminSettlementDetail */
export interface SettlementDetail {
  settlementId: number;
  settlementNumber: string;
  status: SettlementStatus;
  statusLabel: string;
  statusTone: SettlementTone;
  overview: SettlementOverview;
  stage: SettlementStage;
  breakdown: Breakdown;
  clawbacksApplied: Array<AppliedClawback>;
  adjustment: Adjustment | null;
  /** 확정 전(REVIEWING · ADJUSTING) null */
  payouts: Payouts | null;
  taxDocuments: Array<TaxDocument>;
  fixedFee: FixedFee | null;
  items: SettlementItems;
  rail: SettlementRail;
  actions: SettlementActions;
  /** 최신순 */
  history: Array<SettlementHistory>;
}

// ── 액션(7-5 ~ 7-7) ──────────────────────────────────

/** AdminPayoutAccountSource — 운영자는 계좌를 입력하지 않고 출처만 고른다 */
export type PayoutAccountSource = "CURRENT_PROFILE" | "PREVIOUS";

export interface RedistributePayload {
  payoutId: number;
  accountSource: PayoutAccountSource;
}

/** AdminTaxInvoiceVerifyResult */
export type InvoiceVerifyResult =
  "MATCH" | "AMOUNT_MISMATCH" | "RECIPIENT_MISMATCH" | "NOT_FOUND";

export interface VerifyPayload {
  documentId: number;
  result: InvoiceVerifyResult;
}

export interface BrandInvoicePayload {
  documentId: number;
  file: File;
  /** 서버 형식 `00000000-00000000-00000000` */
  approvalNumber: string;
  /** YYYY-MM-DD */
  issuedDate: string;
}

// ── 운영자 사업자 정보(기-35) ────────────────────────

/**
 * `GET /v1/common/company-info`(CompanyInfoResponse · 1021 설계서 10-1) — M4 「공급받는자」가 읽는다.
 * 빈 값은 서버가 null로 내린다. 정산 화면은 상호 · 대표자 · 사업자등록번호만 쓴다.
 */
export interface CompanyInfo {
  name: string | null;
  representative: string | null;
  registrationNumber: string | null;
  address: string | null;
  mailOrderReportNumber: string | null;
  privacyOfficer: { name: string | null; phone: string | null };
  customerService: {
    phone: string | null;
    email: string | null;
    hours: string | null;
  };
  copyright: string | null;
}
