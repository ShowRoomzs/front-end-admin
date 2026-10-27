import type {
  ClaimListParams,
  ClaimSearchField,
  ClaimSort,
  ClaimTab,
  ClaimType,
} from "@/features/claim/types";

export const CLAIM_LIST_PATH = "/order/claim";

/** 탭 7종 — 파트너 11-claims와 같은 탭·같은 순서. 반품·교환은 탭을 나누지 않고 유형 열로 가른다 */
export const CLAIM_TABS: Array<{ value: ClaimTab; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "COLLECT_WAIT", label: "회수 대기" },
  { value: "COLLECTING", label: "회수 중" },
  { value: "INSPECTION", label: "입고·검수" },
  { value: "RESHIP", label: "재발송" },
  { value: "REJECT_HOLD", label: "반려 보류" },
  { value: "DONE", label: "완료" },
];

export const CLAIM_TYPE_OPTIONS: Array<{
  value: "" | ClaimType;
  label: string;
}> = [
  { value: "", label: "유형 전체" },
  { value: "RETURN", label: "반품" },
  { value: "EXCHANGE", label: "교환" },
];

/**
 * 검색 기준 — 서버가 검색어를 셋으로 나눠 받는다(접수·주문번호 정확 일치 / 브랜드명 · 소비자명 부분 일치).
 * 시안은 입력 하나지만 한 값을 셋에 같이 보내면 AND라 아무것도 안 걸린다 — 기준을 고르게 한다.
 */
export const CLAIM_SEARCH_FIELDS: Array<{
  value: ClaimSearchField;
  label: string;
  placeholder: string;
}> = [
  {
    value: "keyword",
    label: "접수·주문번호",
    placeholder: "CLM-3021 또는 주문번호",
  },
  { value: "marketName", label: "브랜드명", placeholder: "브랜드명 일부" },
  { value: "consumerName", label: "소비자", placeholder: "소비자 이름 일부" },
];

export const CLAIM_SORT_OPTIONS: Array<{ value: ClaimSort; label: string }> = [
  { value: "REQUESTED_DESC", label: "신청일시 최신순" },
  { value: "ELAPSED_ASC", label: "경과 오래된순" },
];

/**
 * 정렬을 고르지 않았을 때 서버가 쓰는 탭 기본 정렬 — 셀렉트에 그 값을 보인다.
 * 작업 탭은 단계 진입 오래된순(=경과 오래된순), 조회 탭(전체 · 완료)은 최신순.
 */
export const CLAIM_TAB_DEFAULT_SORT: Record<ClaimTab, ClaimSort> = {
  ALL: "REQUESTED_DESC",
  COLLECT_WAIT: "ELAPSED_ASC",
  COLLECTING: "ELAPSED_ASC",
  INSPECTION: "ELAPSED_ASC",
  RESHIP: "ELAPSED_ASC",
  REJECT_HOLD: "ELAPSED_ASC",
  DONE: "REQUESTED_DESC",
};

export const CLAIM_PAGE_SIZES = [20, 50];

export const CLAIM_INITIAL_PARAMS: ClaimListParams = {
  tab: "ALL",
  type: "",
  searchField: "keyword",
  keyword: "",
  sort: "",
  userId: "",
  openOnly: "",
  page: 1,
  size: 20,
};

/**
 * 신청일 조회 범위(일) — 서버는 `from`이 없으면 최근 30일만 준다. 탭 건수(요약)는 기간과 무관한
 * 전체 기준이라 30일이면 탭 숫자와 목록이 어긋난다 — 서버 상한(365일)까지 넓혀 보낸다.
 */
export const CLAIM_LIST_RANGE_DAYS = 365;

/** 탭 값 → 라벨 — 상단 줄 「입고·검수 2건」에 쓴다 */
export const CLAIM_TAB_LABEL: Record<ClaimTab, string> = Object.fromEntries(
  CLAIM_TABS.map((tab) => [tab.value, tab.label])
) as Record<ClaimTab, string>;

/** 주문 조회 — `?orderId=`로 들어가면 그 주문의 상세가 바로 열린다 */
export function orderDetailPath(orderId: number) {
  return `/order/list?orderId=${orderId}`;
}

/** 1:1 문의 상세 — 소비자 이의의 원문 · 기각(답변)은 여기서 한다 */
export function inquiryDetailPath(inquiryId: number) {
  return `/support/inquiry/${inquiryId}`;
}

export const SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235B5F68' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 9px center",
} as const;
