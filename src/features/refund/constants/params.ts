import type {
  RefundListParams,
  RefundRouteFilter,
  RefundSort,
  RefundStatus,
} from "@/features/refund/types";

export const REFUND_LIST_PATH = "/order/refund";

/** 탭 3종 — 집행 대기 · 실패 · 완료(시안 A1~A3) */
export const REFUND_TABS: Array<{ value: RefundStatus; label: string }> = [
  { value: "PENDING", label: "집행 대기" },
  { value: "FAILED", label: "실패" },
  { value: "DONE", label: "완료" },
];

export const REFUND_ROUTE_OPTIONS: Array<{
  value: RefundRouteFilter;
  label: string;
}> = [
  { value: "", label: "경로 전체" },
  { value: "CANCEL", label: "취소" },
  { value: "RETURN", label: "반품" },
  { value: "RETURN_BACK", label: "반송" },
  { value: "OPERATOR", label: "운영자 사유" },
];

export const REFUND_SORT_OPTIONS: Array<{ value: RefundSort; label: string }> =
  [
    { value: "LATEST", label: "일시 최신순" },
    { value: "AMOUNT_DESC", label: "환불액 높은순" },
  ];

export const REFUND_PAGE_SIZES = [20, 50];

export const REFUND_INITIAL_PARAMS: RefundListParams = {
  // 기본 진입은 집행 대기 — 운영자는 처리할 것을 찾으러 온다(시안 A1)
  tab: "PENDING",
  route: "",
  keyword: "",
  sort: "LATEST",
  page: 1,
  size: 20,
};

/** 탭 카운트 · 사이드바 배지 폴링 간격(ms) */
export const REFUND_SUMMARY_POLL_INTERVAL = 30_000;

export const SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235B5F68' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 9px center",
} as const;
