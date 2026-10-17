import type {
  ClawbackStatus,
  CreatorBusinessType,
  InvoiceVerifyResult,
  SettlementEventType,
  SettlementItemStatus,
  SettlementListParams,
  SettlementSort,
  SettlementTab,
  TaxDocumentStatus,
  Tone,
} from "@/features/settlement/types";

/** 정산 관리는 하위 메뉴 없이 공구 정산 하나다(07a GNB · 「고정 지급비 정산」 메뉴 삭제) */
export const SETTLEMENT_LIST_PATH = "/settlement/group-buy";

export const SETTLEMENT_QUERY_KEYS = {
  SUMMARY: "adminSettlementSummary",
  LIST: "adminSettlementList",
  DETAIL: "adminSettlementDetail",
} as const;

export const SETTLEMENT_TABS: Array<{ value: SettlementTab; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "REVIEWING", label: "정산 확인 중" },
  { value: "ADJUSTING", label: "조정 협의" },
  { value: "PAYOUT_FAILED", label: "분배 실패" },
  { value: "EVIDENCE", label: "증빙 처리" },
  { value: "CLAWBACK", label: "차감" },
];

/** 정산 1건이 행인 탭 — 증빙 · 차감 탭은 행 단위가 다르다 */
export const SETTLEMENT_ROW_TABS: Array<SettlementTab> = [
  "ALL",
  "REVIEWING",
  "ADJUSTING",
  "PAYOUT_FAILED",
];

export function isSettlementTab(value: unknown): value is SettlementTab {
  return SETTLEMENT_TABS.some((tab) => tab.value === value);
}

/** 전체 탭만 정렬을 고른다(서버 AdminSettlementSort) */
export const ALL_SORT_OPTIONS: Array<{ value: SettlementSort; label: string }> =
  [
    { value: "SCHEDULE_DESC", label: "일정 최신순" },
    { value: "SALES_DESC", label: "확정 거래액 높은순" },
  ];

export function isSettlementSort(value: unknown): value is SettlementSort {
  return ALL_SORT_OPTIONS.some((option) => option.value === value);
}

/** 상태 · 증빙 · 차감 탭은 서버가 고정 정렬한다 — 선택지는 안내 한 줄뿐 */
export const FIXED_SORT_LABEL: Record<Exclude<SettlementTab, "ALL">, string> = {
  REVIEWING: "확인 마감 이른순",
  ADJUSTING: "합의 기한 이른순",
  PAYOUT_FAILED: "경과 오래된순",
  EVIDENCE: "기한 이른순",
  CLAWBACK: "발생일 최신순",
};

/** 서버 상한 100 */
export const PAGE_SIZES = [20, 50];

export const SETTLEMENT_INITIAL_PARAMS: SettlementListParams = {
  tab: "ALL",
  keyword: "",
  sort: "SCHEDULE_DESC",
  page: 1,
  size: 20,
};

/** 정산번호로 검색하는지 — 서버도 이 접두어로 축을 판별한다(정산번호 전방 일치) */
export const SETTLEMENT_NO_PREFIX = "STL-";

export const BUSINESS_TYPE_LABEL: Record<CreatorBusinessType, string> = {
  BUSINESS: "사업자",
  INDIVIDUAL: "비사업자",
};

/** 증빙 문서 상태 색 — 서버가 톤을 내리지 않는다(라벨은 서버 statusLabel) */
export const TAX_DOCUMENT_TONE: Record<
  TaxDocumentStatus | "WAITING_CREATOR",
  Tone
> = {
  PENDING_INPUT: "NEUTRAL",
  SUBMITTED: "INFO",
  VERIFIED: "SUCCESS",
  REJECTED: "NEUTRAL",
  PENDING_ISSUE: "NEUTRAL",
  ISSUED: "SUCCESS",
  GENERATED: "SUCCESS",
  WAITING_CREATOR: "NEUTRAL",
};

/** ClawbackStatus 톤 · 라벨(서버 enum과 같은 값 — 행에 측별 라벨이 없을 때만 쓴다) */
export const CLAWBACK_STATUS: Record<
  ClawbackStatus,
  { label: string; tone: Tone }
> = {
  PENDING: { label: "차감 예정", tone: "NEUTRAL" },
  APPLIED: { label: "차감 반영", tone: "INFO" },
  UNRECOVERABLE: { label: "미회수", tone: "WARNING" },
};

/** 명세 상태 색 — 라벨은 서버 statusLabel */
export const ITEM_STATUS_TONE: Record<SettlementItemStatus, Tone> = {
  CONFIRMED: "SUCCESS",
  PARTIAL_RETURNED: "NEUTRAL",
  RETURNED: "NEUTRAL",
  CANCELLED: "NEUTRAL",
  DELIVERY_EXCEPTION: "NEUTRAL",
};

/** 처리 이력 점 색 — 라벨은 서버 label */
export const HISTORY_TONE: Partial<Record<SettlementEventType, Tone>> = {
  CREATED: "INFO",
  ADJUSTMENT_REQUESTED: "WARNING",
  ADJUSTMENT_COUNTERED: "WARNING",
  ADJUSTMENT_REJECTED: "WARNING",
  ADJUSTMENT_ACCEPTED: "SUCCESS",
  ADJUSTMENT_DEADLINE_NOTICED: "WARNING",
  AUTO_CONFIRMED: "INFO",
  CONFIRMED_BY_AGREEMENT: "INFO",
  CONFIRMED_BY_EXPIRY: "INFO",
  TAX_INVOICE_VERIFIED: "SUCCESS",
  TAX_INVOICE_REJECTED: "WARNING",
  BRAND_INVOICE_ISSUED: "SUCCESS",
  PAYOUT_REQUESTED: "INFO",
  PAYOUT_PAID: "SUCCESS",
  PAYOUT_FAILED: "DANGER",
  PAYOUT_RETRIED: "INFO",
  PAYOUT_BLOCKED: "WARNING",
  PAYOUT_CHECK_REQUIRED: "WARNING",
  WITHHOLDING_RECEIPT_GENERATED: "SUCCESS",
  CLAWBACK_REGISTERED: "WARNING",
  CLAWBACK_APPLIED: "INFO",
  CLAWBACK_UNRECOVERABLE: "WARNING",
};

/** 조정 협의 상태 색 */
export const ADJUSTMENT_TONE: Record<"OPEN" | "AGREED" | "EXPIRED", Tone> = {
  OPEN: "INFO",
  AGREED: "SUCCESS",
  EXPIRED: "NEUTRAL",
};

/** 확정 사유별 레일 안내(SettlementConfirmReason.description을 문장으로) */
export const CONFIRM_REASON_TEXT: Record<string, string> = {
  AUTO: "확인 기간에 조정 요청이 없어 자동 확정됐습니다.",
  AGREED: "양측이 조정 금액에 합의해 합의 금액으로 확정됐습니다.",
  EXPIRED: "합의 기한이 지나 원래 금액으로 확정됐습니다.",
};

/** M4 대조 결과 — 일치 / 반려 사유 3종(TaxInvoiceRejectReason 라벨이 쇼룸 스튜디오에 그대로 뜬다) */
export const INVOICE_VERIFY_OPTIONS: Array<{
  value: InvoiceVerifyResult;
  label: string;
}> = [
  { value: "MATCH", label: "일치 — 확인" },
  { value: "AMOUNT_MISMATCH", label: "금액 불일치 — 반려" },
  { value: "RECIPIENT_MISMATCH", label: "공급받는자 불일치 — 반려" },
  { value: "NOT_FOUND", label: "국세청 조회 불가 — 반려" },
];

/** M5 발행본 PDF 상한(settlement.tax-invoice-attachment-max-bytes) */
export const BRAND_INVOICE_MAX_BYTES = 10 * 1024 * 1024;

/** 주민등록번호 미등록 보류 사유 코드(PayoutBlockReason) */
export const RESIDENT_NUMBER_MISSING = "RESIDENT_NUMBER_MISSING";
/** 세금계산서 확인 전 보류 사유 코드 — 증빙 줄이 따로 말한다 */
export const TAX_INVOICE_UNVERIFIED = "TAX_INVOICE_UNVERIFIED";
