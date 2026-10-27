import type {
  AdjustmentStatus,
  ClawbackRowStatus,
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
  COMPANY_INFO: "adminSettlementCompanyInfo",
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
export const TAX_DOCUMENT_TONE: Record<TaxDocumentStatus, Tone> = {
  PENDING_INPUT: "NEUTRAL",
  SUBMITTED: "INFO",
  VERIFIED: "SUCCESS",
  REJECTED: "NEUTRAL",
  PENDING_ISSUE: "NEUTRAL",
  ISSUED: "SUCCESS",
  GENERATED: "SUCCESS",
};

/**
 * 차감 탭 상태 배지(07a L6) — 배지 글자 + 배지 아래 보조줄(시안 `.t-note`).
 * 서버 라벨은 배지 · 보조줄을 한 문장으로 합친 값이라(「미회수 · 베타: 플랫폼 손실 처리」) 화면은 이 표를 쓴다.
 */
export const CLAWBACK_STATUS: Record<
  ClawbackRowStatus,
  { label: string; tone: Tone; note?: string }
> = {
  PENDING: { label: "차감 예정", tone: "NEUTRAL" },
  APPLIED: { label: "차감 반영", tone: "INFO" },
  // 【잠정】 기-13 — 회수 방법이 정해지기 전(베타)의 표기. 변호사 확인 뒤 바뀔 수 있다
  UNRECOVERABLE: {
    label: "미회수",
    tone: "WARNING",
    note: "베타: 플랫폼 손실 처리",
  },
  // 【잠정】 기-13 — 지급 전(확인 기간 중) 환불은 차감이 아니라 재계산
  RECALCULATED: { label: "재계산", tone: "INFO", note: "확인 기간 재시작" },
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
  ADJUSTMENT_WITHDRAWN: "NEUTRAL",
  AUTO_CONFIRMED: "INFO",
  CONFIRMED_BY_AGREEMENT: "INFO",
  CONFIRMED_BY_EXPIRY: "INFO",
  CONFIRMED_BY_WITHDRAWAL: "INFO",
  TAX_INVOICE_VERIFIED: "SUCCESS",
  TAX_INVOICE_REJECTED: "WARNING",
  BRAND_INVOICE_ISSUED: "SUCCESS",
  PAYOUT_REQUESTED: "INFO",
  PAYOUT_PAID: "SUCCESS",
  PAYOUT_FAILED: "DANGER",
  PAYOUT_RETRIED: "INFO",
  PAYOUT_DEFERRED: "WARNING",
  PAYOUT_BLOCKED: "WARNING",
  PAYOUT_HOLD_RELEASED: "INFO",
  PAYOUT_CHECK_REQUIRED: "WARNING",
  WITHHOLDING_RECEIPT_GENERATED: "SUCCESS",
  WITHHOLDING_RECEIPT_SKIPPED: "NEUTRAL",
  CLAWBACK_REGISTERED: "WARNING",
  CLAWBACK_APPLIED: "INFO",
  CLAWBACK_UNRECOVERABLE: "WARNING",
  RECALCULATED: "INFO",
};

/** 조정 협의 상태 색 */
export const ADJUSTMENT_TONE: Record<AdjustmentStatus, Tone> = {
  OPEN: "INFO",
  AGREED: "SUCCESS",
  EXPIRED: "NEUTRAL",
  WITHDRAWN: "NEUTRAL",
};

/** 확정 사유별 레일 안내(SettlementConfirmReason.description을 문장으로) */
export const CONFIRM_REASON_TEXT: Record<string, string> = {
  AUTO: "확인 기간에 조정 요청이 없어 자동 확정됐습니다.",
  AGREED: "양측이 조정 금액에 합의해 합의 금액으로 확정됐습니다.",
  EXPIRED: "합의 기한이 지나 원래 금액으로 확정됐습니다.",
  WITHDRAWN: "조정 요청이 철회돼 원래 금액으로 확정됐습니다.",
};

/** M4 대조 결과 — 일치 / 반려 사유 3종(TaxInvoiceRejectReason 라벨이 쇼룸 스튜디오에 그대로 뜬다) */
export const INVOICE_VERIFY_OPTIONS: Array<{
  value: InvoiceVerifyResult;
  label: string;
}> = [
  { value: "MATCH", label: "일치 — 확인" },
  { value: "AMOUNT_MISMATCH", label: "금액 불일치 — 반려" },
  { value: "RECIPIENT_MISMATCH", label: "공급받는자 오기 — 반려" },
  { value: "NOT_FOUND", label: "승인번호 조회 불가 — 반려" },
];

/** M5 발행본 PDF 상한(settlement.tax-invoice-attachment-max-bytes) */
export const BRAND_INVOICE_MAX_BYTES = 10 * 1024 * 1024;

/**
 * 폐기된 「주민등록번호 미등록」 코드(기-12) — 지급 보류 사유 · 증빙 가상 행에서 빠졌다.
 * 아직 배포된 옛 서버가 내려 주면 화면에 닿기 전에 걸러 낸다(서비스 · 레일). 서버 배포 뒤에도 방어로 둔다.
 */
export const LEGACY_RESIDENT_NUMBER_MISSING = "RESIDENT_NUMBER_MISSING";
/** 세금계산서 확인 전 보류 사유 코드 — 증빙 줄이 따로 말한다 */
export const TAX_INVOICE_UNVERIFIED = "TAX_INVOICE_UNVERIFIED";

/**
 * 지급 예정일 영업일 수를 서버가 따로 내리지 않는다(`settlement.payout-business-days` · [정책값 미정]).
 * 확정 이력 문장(`rail.payoutBasis` — 「자동 확정 10.06 + 3영업일 · …」)에서 읽고, 없으면 「N영업일」로 둔다.
 */
export const PAYOUT_DAYS_FALLBACK = "N영업일";

/**
 * 정산 확인 기간 — 서버 `settlement.review-business-days`(기본 3)를 어드민 응답이 내리지 않는다.
 * 시안은 정책값 미정 표기 없이 「3영업일」로 쓴다 — 서버가 값을 내리면 이 한 곳을 바꾼다(백엔드 요청).
 */
export const REVIEW_PERIOD_LABEL = "3영업일";

/** 운임 정산 · 반품 차감 배송비 줄 설명(시안 07b D1 · D3 `.pb`) */
export const BREAKDOWN_NOTE = {
  consumerDeliveryFee: "소비자 결제분",
  reshipFee: "소비자 결제분",
  returnDeductionFee: "무료배송 · 소비자 귀책",
  freightAdjustment: "귀책 변경",
} as const;
