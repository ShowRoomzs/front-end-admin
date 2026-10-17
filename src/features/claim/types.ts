import type { BaseParams, PageResponse } from "@/common/types";

/*
  어드민 반품·교환(06b) 타입 — 시안 `ui-admin-06b-claims` rev.1에서 파생한 **임시 모양**이다.
  백엔드에 어드민 클레임 API가 아직 없다(`/admin/claims` 미존재). 서버 DTO가 생기면 이 파일을
  `*Dto.java`와 맞춰 다시 쓴다. 화면이 쓰는 값만 담았고, 이름은 계약 관리(`AdminContract*`)의
  관례(상태 코드 + 라벨 + 톤을 서버가 내린다)를 따랐다.
*/

export type ClaimKind = "RETURN" | "EXCHANGE";

/** 귀책 — 클레임 단위 값. 일부 반려는 항목 단위로 갈린다(`ClaimRejection.fault`) */
export type ClaimParty = "CONSUMER" | "BRAND";

/** 배지 색 — 서버가 단계별로 하나만 내린다(상태색 4원칙: 지연만 경고 · 완료 성공 · 반려 종결 중립) */
export type ClaimTone = "INFO" | "SUCCESS" | "WARNING" | "DANGER" | "NEUTRAL";

/** 목록 탭 7종 — 파트너 11-claims와 같은 탭·같은 건수(브랜드 큐와 운영자 큐가 어긋나면 안 된다) */
export type ClaimTab =
  | "ALL"
  | "PICKUP_WAIT"
  | "IN_TRANSIT"
  | "INSPECTION"
  | "RESHIP"
  | "REJECT_HOLD"
  | "DONE";

/**
 * 단계 — 탭과 1:N이다(입고·검수 탭 = 검수 대기 + 검수 지연).
 * `REFUND_PENDING`은 운영자 사유 환불로 환불 관리에 편입된 상태(집행은 환불 관리) — 시안에 칸이 없어 전체 탭에만 보인다.
 */
export type ClaimStage =
  | "PICKUP_WAIT"
  | "IN_TRANSIT"
  | "INSPECT_WAIT"
  | "INSPECT_OVERDUE"
  | "RESHIP_WAIT"
  | "REJECT_HOLD"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "REFUNDED_PARTIAL"
  | "EXCHANGED"
  | "REJECT_CLOSED";

export type ClaimSort = "CREATED_DESC" | "ELAPSED_DESC";

export interface ClaimListParams extends BaseParams {
  tab: ClaimTab;
  /** 빈 문자열이면 유형 전체 */
  kind: "" | ClaimKind;
  /** 접수번호 · 주문번호 · 브랜드명 · 소비자 */
  keyword: string;
  sort: ClaimSort;
}

/** 반려 보류 탭 전용 열(보관 중인 상품 · 반려 사유 · 반려일시 · 재발송비 결제 · 고지 · 보관 기한) */
export interface ClaimHoldSummary {
  rejectReason: string;
  /** ISO 8601 */
  rejectedAt: string;
  /** 재발송비 결제 대기 — 3,000원 · D-12 */
  reshipFee: number;
  payDueDays: number;
  noticeCount: number;
  /** 보관 기한 — `YYYY-MM-DD`. 폐기 표기·폐기 액션은 두지 않는다(약관 반영 전, 결정 12) */
  retainUntil: string;
}

export interface ClaimListItem {
  claimNo: string;
  kind: ClaimKind;
  /** 마스킹된 이름 — 「최**」 */
  consumerName: string;
  brandName: string;
  productName: string;
  /** 옵션 표기 — 「50ml」 · 교환은 「03 → 05」 */
  optionText: string;
  quantity: number;
  reason: string;
  fault: ClaimParty;
  stage: ClaimStage;
  stageLabel: string;
  stageTone: ClaimTone;
  /** 운영자가 06a에서 대신 연 클레임 */
  operatorOpened: boolean;
  /** 구매확정 후 하자 */
  afterPurchaseConfirm: boolean;
  /** 소비자 이의 — 운영자 조치 대상은 이것 하나뿐이다. 접수일 `YYYY-MM-DD` */
  objectionAt: string | null;
  /** 경과 표기 — 「신청 1일」 · 「입고 3영업일」 · 「09.12」(완료는 종결일). 영업일 계산은 서버 */
  elapsedLabel: string;
  /** 검수 지연(2영업일 초과)이면 경고색 */
  elapsedOverdue: boolean;
  hold: ClaimHoldSummary | null;
}

/** 탭 건수 · 상단 줄 — 사이드바 「반품·교환」 배지(=소비자 이의 건수)도 이 값을 쓴다 */
export interface ClaimSummary {
  tabCounts: Record<ClaimTab, number>;
  delayCount: number;
  objectionCount: number;
}

/** 목록 응답 — 현재 탭·필터 결과 안의 지연·이의 건수를 같이 내린다(상단 줄) */
export interface ClaimListResponse extends PageResponse<ClaimListItem> {
  delayCount: number;
  objectionCount: number;
}

// ── 상세 ──────────────────────────────────────────────

export interface ClaimItem {
  name: string;
  option: string;
  quantity: number;
  /** 줄 합계(수량 반영) */
  price: number;
  /** 항목 단위 상태 — 검수 결과(통과 · 반려) · 입고·검수 등 */
  status: { label: string; tone: ClaimTone } | null;
  /** 반려분 금액은 흐리게 */
  dimmed: boolean;
}

export interface ClaimBasis {
  inquiryNo: string;
  summary: string;
  photoCount: number;
}

export interface ClaimOpened {
  operatorName: string;
  openedAt: string;
  basis: ClaimBasis;
}

export interface ClaimHistoryEntry {
  tone: ClaimTone;
  label: string;
  /** 행위자 — 「시스템 · 브랜드 데일리랩」 · 「소비자 이**」 · 「브랜드 글로우코스」 */
  actor: string | null;
  /** 보조 — 「단순 변심」 · 「6항목 제출」 · 「1:1 문의 #4527」 */
  extra: string | null;
  at: string;
}

export interface ClaimStatusRow {
  label: string;
  value: string;
  emphasis: boolean;
}

export interface ClaimPickup {
  carrier: string | null;
  /** 마스킹된 송장번호 — 「6512****9902」. 소비자가 입력하기 전에는 null */
  trackingNo: string | null;
  pickedUpAt: string | null;
  receivedAt: string | null;
  receivedBy: string | null;
  /** 검수 기한 = 입고 확인 + 2영업일 */
  inspectionDueDate: string | null;
  /** 2영업일을 넘긴 경우에만 */
  overdue: boolean;
}

export interface ClaimAmount {
  productAmount: number;
  /** 최초 배송비 차감 — 무료배송 + 소비자 귀책일 때 3,000원, 아니면 0 */
  firstShippingDeduction: number;
  refundOnPass: number;
  /** 소비자 귀책 여부와 무료배송은 차감 근거 문구에 쓴다 */
  freeShipping: boolean;
}

export interface ClaimPurchaseConfirm {
  /** STOPPED=신청 시 정지 · RESTARTED=교환 완료 시 7일 새로 시작 */
  timer: "STOPPED" | "RESTARTED";
  remainingDays: number | null;
}

export interface ClaimRejection {
  reason: string;
  legalBasis: string;
  scope: "ALL" | "PARTIAL";
  rejectedQty: number;
  claimedQty: number;
  /** 귀책 — 일부 반려는 반려분·통과분이 갈린다(항목 단위) */
  rejectedFault: ClaimParty;
  passedFault: ClaimParty | null;
  /** 반려로 귀책이 바뀌었는지(「변경 없음」) */
  faultChanged: boolean;
  evidence: string;
  /** 소비자에게 보낸 메시지 — 반려 보류 상세에서만 보인다 */
  consumerMessage: string | null;
}

export interface ClaimHold {
  reshipFee: number;
  payDueDays: number;
  noticeCount: number;
  lastNoticeAt: string;
  /** 검수 반려 일시 — 목록 「반려일시」 */
  rejectedAt: string;
  retainUntil: string;
}

export interface ClaimObjection {
  text: string;
  inquiryNo: string;
  photoCount: number;
  receivedAt: string;
}

export interface ClaimLegalDeadline {
  suppliedAt: string;
  /** 공급일 + 3개월 */
  suppliedLimit: string;
  defectKnownAt: string;
  /** 하자 인지 + 30일 */
  defectLimit: string;
  /** 두 기한 중 이른 날 */
  appliedDeadline: string;
  /** 소비자 회수 송장 입력 여부 — 7일 미입력 시 자동 취소 */
  trackingEntered: boolean;
}

export interface ClaimSettlementEffect {
  /** 이미 확정된 정산 회차 */
  confirmedRound: string;
  /** 통과 시 차감 대상 — 「브랜드 수취액」 · 「리워드」 */
  deductTargets: Array<string>;
}

export interface ClaimRefundLine {
  label: string;
  amount: number;
  kind: "PLUS" | "MINUS" | "TOTAL";
  note: string;
}

export interface ClaimRefundCalc {
  /** 「PG 자동 · 완료」 */
  title: string;
  lines: Array<ClaimRefundLine>;
}

export interface ClaimDetail {
  claimNo: string;
  kind: ClaimKind;
  stage: ClaimStage;
  stageLabel: string;
  stageTone: ClaimTone;
  /** 모달 제목 줄의 배지 — 운영자 개설은 출처를, 그 밖에는 단계(일부 반려를 뺀)를 보인다 */
  headerBadge: { label: string; tone: ClaimTone };
  fault: ClaimParty;
  reason: string;
  orderNo: string;
  brandName: string;
  consumerName: string;
  appliedAt: string;
  /** 소비자 상세 내용 — 선택 입력이라 null이면 「선택 입력 없음」 */
  detailText: string | null;
  /** 구매확정일 — 확정 후 하자에서 주문 줄에 붙는다 */
  confirmedAt: string | null;
  opened: ClaimOpened | null;
  /** 반려 이의가 접수돼 운영자 사유 환불을 입력할 수 있다(이 화면에서 운영자가 실행하는 유일한 지점) */
  refundableByOperator: boolean;
  /** 사유 환불 시 환불 금액 — 반려 상품 금액 */
  refundAmountIfAccepted: number | null;
  statusRows: Array<ClaimStatusRow>;
  items: Array<ClaimItem>;
  orderedQty: number | null;
  pickup: ClaimPickup | null;
  amount: ClaimAmount | null;
  purchaseConfirm: ClaimPurchaseConfirm | null;
  rejection: ClaimRejection | null;
  hold: ClaimHold | null;
  objection: ClaimObjection | null;
  legalDeadline: ClaimLegalDeadline | null;
  settlement: ClaimSettlementEffect | null;
  refundCalc: ClaimRefundCalc | null;
  /** 최신순 */
  history: Array<ClaimHistoryEntry>;
}

// ── 운영자 사유 환불 ──────────────────────────────────

export type OperatorRefundReason = "ACCEPT_OBJECTION" | "RECALL" | "OTHER";

export interface OperatorRefundRequest {
  reason: OperatorRefundReason;
  /** 근거 — 필수. 이력과 브랜드·소비자 통지에 남는다 */
  basis: string;
}

export interface OperatorRefundResponse {
  claimNo: string;
}
