import type {
  DelayType,
  DeliveryExceptionType,
  ExceptionListParams,
  ExceptionSort,
  ExceptionTab,
} from "@/features/exception/types";

export const EXCEPTION_TABS: Array<{ value: ExceptionTab; label: string }> = [
  { value: "DELAY", label: "처리 지연" },
  { value: "DELIVERY", label: "배송 예외" },
];

/** 유형 드롭다운 — 시안 순서. 괄호 숫자는 화면이 summary로 붙인다(「발송 기한 경과 2」) */
export const DELAY_TYPE_OPTIONS: Array<{ value: DelayType; label: string }> = [
  { value: "SHIPPING_OVERDUE", label: "발송 기한 경과" },
  { value: "INSPECTION_OVERDUE", label: "검수 지연" },
  { value: "RESHIP_OVERDUE", label: "재발송 지연" },
];

export const DELIVERY_TYPE_OPTIONS: Array<{
  value: DeliveryExceptionType;
  label: string;
}> = [
  { value: "PICKUP_UNCONFIRMED", label: "집화 확인 필요" },
  { value: "TRACKING_STALLED", label: "추적 정지" },
  { value: "RETURNING", label: "반송 중" },
  { value: "RETURN_INVOICE_UNTRACKED", label: "회수 송장 미조회" },
];

/** 시안은 「경과 오래된순」 하나다 — 방치된 건이 먼저 */
export const EXCEPTION_SORT_OPTIONS: Array<{
  value: ExceptionSort;
  label: string;
}> = [{ value: "ELAPSED_DESC", label: "경과 오래된순" }];

export const EXCEPTION_PAGE_SIZES = [20, 50];

export const EXCEPTION_INITIAL_PARAMS: ExceptionListParams = {
  tab: "DELAY",
  type: "",
  keyword: "",
  sort: "ELAPSED_DESC",
  page: 1,
  size: 20,
};

/** 시안 `.sel-sm` · `.msel`의 갈매기표 */
export const SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235B5F68' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 9px center",
} as const;

/**
 * 열기 링크 — 다른 화면은 경로로만 잇는다(그 화면의 코드를 가져오지 않는다).
 * 주문·클레임 상세 경로는 해당 화면이 정하므로 지금은 목록에 검색어를 얹어 보낸다.
 */
export const ORDER_LIST_PATH = "/order/list";
export const CLAIM_LIST_PATH = "/order/claim";
