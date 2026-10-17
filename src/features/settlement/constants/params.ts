import type {
  EvidenceTaskType,
  InvoiceCheckResult,
  SettlementListParams,
  SettlementSort,
  SettlementStatus,
  SettlementTab,
  Tone,
} from "@/features/settlement/types";

/** 정산 관리는 하위 메뉴 없이 공구 정산 하나다(07a GNB · 「고정 지급비 정산」 메뉴 삭제) */
export const SETTLEMENT_LIST_PATH = "/settlement/group-buy";

export const SETTLEMENT_QUERY_KEYS = {
  SUMMARY: "adminSettlementSummary",
  LIST: "adminSettlementList",
  EVIDENCE: "adminSettlementEvidence",
  CLAWBACK: "adminSettlementClawback",
  DETAIL: "adminSettlementDetail",
} as const;

export const SETTLEMENT_TABS: Array<{ value: SettlementTab; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "CHECKING", label: "정산 확인 중" },
  { value: "ADJUSTING", label: "조정 협의" },
  { value: "FAILED", label: "분배 실패" },
  { value: "EVIDENCE", label: "증빙 처리" },
  { value: "CLAWBACK", label: "차감" },
];

/** 탭별 정렬 — 기본은 첫 항목(§45-1) */
export const SORT_OPTIONS: Record<
  SettlementTab,
  Array<{ value: SettlementSort; label: string }>
> = {
  ALL: [
    { value: "SCHEDULE_DESC", label: "일정 최신순" },
    { value: "SALES_DESC", label: "확정 거래액 높은순" },
  ],
  CHECKING: [{ value: "CHECK_DUE_ASC", label: "확인 마감 이른순" }],
  ADJUSTING: [{ value: "AGREE_DUE_ASC", label: "합의 기한 이른순" }],
  FAILED: [{ value: "ELAPSED_DESC", label: "경과 오래된순" }],
  EVIDENCE: [
    { value: "DUE_ASC", label: "기한 이른순" },
    { value: "TASK_TYPE", label: "항목별" },
  ],
  CLAWBACK: [{ value: "OCCURRED_DESC", label: "발생일 최신순" }],
};

export const PAGE_SIZES = [20, 50];

export const SETTLEMENT_INITIAL_PARAMS: SettlementListParams = {
  tab: "ALL",
  keyword: "",
  sort: "SCHEDULE_DESC",
  page: 1,
  size: 20,
  mock: "",
};

/** 정산번호로 검색하는지 — 입력값으로 축을 판별한다(07a 「검색은 한 칸」) */
export const SETTLEMENT_NO_PREFIX = "STL-";

/** §41-2 상태 색 — 정보 · 경고 · 중립 · 성공 · 위험(분배 실패 하나뿐) */
export const STATUS_LABEL: Record<SettlementStatus, string> = {
  CHECKING: "정산 확인 중",
  ADJUSTING: "조정 협의",
  SCHEDULED: "지급 예정",
  PAID: "지급 완료",
  FAILED: "분배 실패",
};

export const STATUS_TONE: Record<SettlementStatus, Tone> = {
  CHECKING: "INFO",
  ADJUSTING: "WARNING",
  SCHEDULED: "NEUTRAL",
  PAID: "SUCCESS",
  FAILED: "DANGER",
};

export const TASK_TYPE_LABEL: Record<
  EvidenceTaskType,
  { label: string; sub: string }
> = {
  INVOICE_CHECK: { label: "세금계산서 대조", sub: "인플루언서 → 플랫폼" },
  BRAND_INVOICE: { label: "브랜드 세금계산서 발행", sub: "플랫폼 → 브랜드" },
  RRN_MISSING: { label: "주민번호 미등록", sub: "인플루언서 입력 · 자동 알림" },
};

/** M4 대조 결과 — 일치 / 반려 사유 3종(반려 사유가 쇼룸 스튜디오에 그대로 뜬다) */
export const INVOICE_CHECK_OPTIONS: Array<{
  value: InvoiceCheckResult;
  label: string;
}> = [
  { value: "MATCH", label: "일치 — 확인" },
  { value: "AMOUNT_MISMATCH", label: "금액 불일치 — 반려" },
  { value: "RECIPIENT_ERROR", label: "공급받는자 오기 — 반려" },
  { value: "NOT_FOUND", label: "승인번호 조회 불가 — 반려" },
];

/** M5 발행본 PDF 상한 */
export const BRAND_INVOICE_MAX_BYTES = 10 * 1024 * 1024;
