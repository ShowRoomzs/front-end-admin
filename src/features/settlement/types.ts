import type { PageParams, PageResponse } from "@/common/types/page";

/*
  어드민 정산 관리 — 공구 정산(ui-admin-07a · 07b). 요구사항 §41 · §42 · §45.

  ⚠️ 백엔드에 어드민 정산 API가 없다. 아래 형태는 시안이 그린 값을 그대로 담도록 FE가 정한
  계약 초안이고, API가 생기면 서버 DTO에 맞춰 이 파일을 고친다(services/adminSettlementService.ts).
  금액은 전부 원 단위 정수, 날짜는 로컬 ISO 문자열(`2026-08-31` · `2026-08-31T09:02:00`)이다.
*/

/** §41-2 상태 5종 — 분배 실패는 어드민 전용 */
export type SettlementStatus =
  "CHECKING" | "ADJUSTING" | "SCHEDULED" | "PAID" | "FAILED";

/** 07a 탭 6 — 지급 예정 · 지급 완료는 전체에서 본다 */
export type SettlementTab =
  "ALL" | "CHECKING" | "ADJUSTING" | "FAILED" | "EVIDENCE" | "CLAWBACK";

export type SettlementSort =
  | "SCHEDULE_DESC"
  | "SALES_DESC"
  | "CHECK_DUE_ASC"
  | "AGREE_DUE_ASC"
  | "ELAPSED_DESC"
  | "DUE_ASC"
  | "TASK_TYPE"
  | "OCCURRED_DESC";

export type Tone = "INFO" | "SUCCESS" | "WARNING" | "DANGER" | "NEUTRAL";

export interface SettlementListParams extends PageParams {
  tab: SettlementTab;
  keyword: string;
  sort: SettlementSort;
  /**
   * 개발 서버 목업 시나리오(`?mock=`) — 목록 조건을 바꿔도 주소에서 떨어지지 않게 들고 다닌다.
   * 서비스는 이 값이 아니라 `mockScenario()`를 읽는다. 배포본에서는 항상 빈 문자열이다.
   */
  mock: string;
}

/** 일정 열 — 단계마다 다음 날짜가 다르다(07a 규칙 「일정 열 하나」) */
export type ScheduleKind =
  "CHECK_DUE" | "AGREE_DUE" | "PAYOUT_PLANNED" | "PAID";

export interface SettlementListItem {
  settlementId: number;
  settlementNo: string;
  groupBuyTitle: string;
  brandName: string;
  showroomName: string;
  influencerBusiness: boolean;
  periodStart: string;
  periodEnd: string;
  confirmedSales: number;
  brandPayout: number;
  influencerPayout: number;
  status: SettlementStatus;
  schedule: { kind: ScheduleKind; date: string };
}

/** 표 하단 합계 행 — 지급 예정 · 지급 완료 · 분배 실패만(전체 탭) */
export interface SettlementTotals {
  count: number;
  confirmedSales: number;
  brandPayout: number;
  influencerPayout: number;
  pgFee: number;
  withholding: number;
  businessVat: number;
  rewardVat: number;
  platformFee: number;
  platformFeeLabel: string;
}

export interface SettlementListStats {
  total: number;
  adjustingCount: number;
  failedCount: number;
  heldAmount: number;
  nearestAgreeDue: string | null;
  undeliveredAmount: number;
  /** 분배 실패 행이 모두 같은 몫이면 그 이름(「인플루언서」) */
  returnedShareLabel: string | null;
  maxElapsedDays: number | null;
}

export interface SettlementListResponse extends PageResponse<SettlementListItem> {
  stats: SettlementListStats;
  totals: SettlementTotals | null;
}

// ── 증빙 처리 탭(L5) ─────────────────────────────────

export type EvidenceTaskType =
  "INVOICE_CHECK" | "BRAND_INVOICE" | "RRN_MISSING";

export interface EvidenceTask {
  taskId: string;
  settlementId: number;
  settlementNo: string;
  groupBuyTitle: string;
  targetName: string;
  /** 인플루언서 대상이면 사업자 구분 */
  targetBusiness: boolean | null;
  type: EvidenceTaskType;
  dateKind: "INPUT" | "DUE" | null;
  date: string | null;
  statusLabel: string;
  statusTone: Tone;
  payoutHold: boolean;
  /** GNB 배지에 세는 운영자 조치인가(주민번호 미등록 · 반려 후 재입력 대기는 세지 않는다) */
  operatorAction: boolean;
}

export interface EvidenceListResponse extends PageResponse<EvidenceTask> {
  stats: {
    total: number;
    operatorActionCount: number;
    checkCount: number;
    issueCount: number;
    payoutHoldCount: number;
  };
}

// ── 차감 탭(L6) ──────────────────────────────────────

export type ClawbackStatus = "PENDING" | "APPLIED" | "UNRECOVERED";

export interface ClawbackShare {
  amount: number;
  state: ClawbackStatus;
  appliedSettlementNo: string | null;
}

export interface Clawback {
  clawbackId: number;
  clawbackNo: string;
  originSettlementNo: string;
  /** 원 정산 상세로 이동 — 목록에 없는 회차면 null(행 클릭 없음) */
  originSettlementId: number | null;
  productTitle: string;
  orderNo: string;
  brandName: string;
  showroomName: string;
  reason: string;
  occurredAt: string;
  brand: ClawbackShare;
  reward: ClawbackShare;
  status: ClawbackStatus;
  appliedSettlementNo: string | null;
  /** 미회수 사유(「인플루언서 탈퇴」) */
  unrecoveredReason: string | null;
}

export interface ClawbackListResponse extends PageResponse<Clawback> {
  stats: { total: number; unrecoveredCount: number; unrecoveredAmount: number };
}

// ── 요약(탭 건수 · GNB 배지) ─────────────────────────

export interface SettlementSummary {
  tabCounts: Record<SettlementTab, number>;
  /** GNB 배지 = 분배 실패 + 차감 미회수 + 대조 대기 + 발행 대기 */
  operatorActionCount: number;
}

// ── 상세(07b) ────────────────────────────────────────

export interface Breakdown {
  totalPayment: number;
  /** 총 결제에서 빠지는 줄 — 라벨은 서버가 정한다(시안: 반품 · 교환 · 배송비 차감) */
  deductions: Array<{ label: string; amount: number }>;
  confirmedSales: number;
  pgFee: number;
  pgRateLabel: string;
  platformFee: number;
  platformRateLabel: string;
  reward: number;
  rewardRateLabel: string;
  rewardVat: number;
  rewardVatLabel: string;
  brandPayout: number;
  influencer: {
    business: boolean;
    reward: number;
    withholding: number;
    withholdingRateLabel: string;
    vat: number;
    vatLabel: string;
    payout: number;
  };
}

export type DistributionRole = "BRAND" | "INFLUENCER" | "PLATFORM" | "PG";

export interface DistributionRow {
  role: DistributionRole;
  name: string;
  amount: number;
  account: string;
  /** 배지(지급 완료 · 분배 실패 …) 또는 회색 글(자동 차감) */
  status:
    | { kind: "BADGE"; label: string; tone: Tone }
    | { kind: "TEXT"; label: string };
}

export interface Distribution {
  rows: Array<DistributionRow>;
  total: number;
  withholding: number;
}

export interface DistributionFailure {
  shareLabel: string;
  recipientName: string;
  amount: number;
  reason: string;
  returnedAt: string;
  elapsedDays: number;
  account: string;
  /** 인플루언서가 회원 정보에서 바꾼 계좌 — 없으면 기존 계좌 재시도만 고를 수 있다 */
  updatedAccount: string | null;
  /** 재분배를 PG에 재지시한 뒤(목업) */
  redistributionRequestedAt: string | null;
}

export interface Adjustment {
  requesterName: string;
  requestedAt: string;
  originalReward: number;
  originalInfluencerPayout: number;
  originalBrandPayout: number;
  requestedReward: number;
  requestReason: string;
  counter: {
    proposerName: string;
    proposedAt: string;
    reward: number;
    reason: string;
  } | null;
  progressLabel: string;
  agreeDueAt: string;
}

export type EvidenceKind =
  "WITHHOLDING_RECEIPT" | "INFLUENCER_INVOICE" | "BRAND_INVOICE";

export type EvidenceState =
  | "ISSUED"
  | "NOT_YET"
  | "RRN_MISSING"
  | "CHECK_PENDING"
  | "CHECKED"
  | "REJECTED"
  | "ISSUE_PENDING";

export interface EvidenceItem {
  kind: EvidenceKind;
  state: EvidenceState;
  supply: number;
  vat: number;
  withholding: number;
  approvalNo: string | null;
  inputAt: string | null;
  dueAt: string | null;
  processedAt: string | null;
  processorName: string | null;
  rejectReason: string | null;
}

export interface AppliedClawback {
  clawbackNo: string;
  productTitle: string;
  orderNo: string;
  reason: string;
  originSettlementNo: string;
  brandAmount: number;
  rewardAmount: number;
}

export interface StatementRow {
  orderNo: string;
  consumerMasked: string;
  itemLabel: string;
  quantity: number;
  payment: number;
  statusLabel: string;
  statusTone: Tone;
  applied: number;
  reward: number;
}

export interface Statement {
  totalCount: number;
  rows: Array<StatementRow>;
  totalPayment: number;
  totalApplied: number;
  totalReward: number;
  returnCount: number;
  exchangeCount: number;
}

export type HistoryTone = Tone;

export interface SettlementHistoryEntry {
  label: string;
  at: string;
  actor: string;
  note: string | null;
  tone: HistoryTone;
}

/** 공급받는자(플랫폼) · 브랜드 세금계산서 수신 정보 — M4 · M5 */
export interface TaxParties {
  platformName: string;
  platformBizNo: string;
  brandBizNoMasked: string;
  brandTaxEmail: string;
}

export interface SettlementDetail extends SettlementListItem {
  /** 주문 종결 시각(정산 생성) — 정산 확인 중 개요에 쓴다 */
  ordersClosedAt: string;
  lastPurchaseConfirmedAt: string;
  checkDueAt: string;
  /** 자동 확정일 — 조정 협의 · 정산 확인 중이면 null */
  confirmedAt: string | null;
  /** 지급일(예정 포함) — 브랜드 몫 기준 */
  payoutAt: string | null;
  /** 인플루언서 몫만 다른 날 나갈 때(사업자 대조 확인일 + 3영업일) */
  influencerPayoutAt: string | null;
  /** 조정 요청이 있었던 회차(단계 줄의 「조정 협의」 취소선 여부) */
  adjusted: boolean;
  adjustment: Adjustment | null;
  breakdown: Breakdown;
  distribution: Distribution | null;
  failure: DistributionFailure | null;
  evidence: Array<EvidenceItem>;
  clawbacksApplied: Array<AppliedClawback>;
  fixedFee: {
    amount: number;
    timingLabel: string;
    /** 없으면 계약 목록을 공구명으로 검색해 연다 */
    contractId: number | null;
  } | null;
  statement: Statement | null;
  /** §41-5 계정 정지 연동 지급 정지 — 07b는 표시만 */
  payoutStop: { party: "BRAND" | "INFLUENCER" } | null;
  taxParties: TaxParties;
  history: Array<SettlementHistoryEntry>;
  navigation: { prevId: number | null; nextId: number | null };
}

export interface DetailNavParams {
  tab?: string;
  keyword?: string;
  sort?: string;
}

// ── 액션(목업) ───────────────────────────────────────

export interface RedistributePayload {
  account: "UPDATED" | "EXISTING";
}

export type InvoiceCheckResult =
  "MATCH" | "AMOUNT_MISMATCH" | "RECIPIENT_ERROR" | "NOT_FOUND";

export interface BrandInvoicePayload {
  file: File;
  approvalNo: string;
  issuedAt: string;
}
