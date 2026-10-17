import type {
  ExceptionListParams,
  ExceptionTab,
} from "@/features/exception/types";

export const EXCEPTION_TABS: Array<{ value: ExceptionTab; label: string }> = [
  { value: "DELAY", label: "처리 지연" },
  { value: "DELIVERY", label: "배송 예외" },
];

/**
 * 정렬 — 서버가 「경과 오래된순」(기준 시각 오름차순 · 동률은 대상번호) 하나로 고정한다(40 설계서 2-1).
 * 시안의 셀렉트도 선택지가 이것 하나라 표시만 하고 서버에 보내지 않는다.
 */
export const EXCEPTION_SORT_LABEL = "경과 오래된순";

/** 서버 상한은 100(`order.list-page-size-max`) */
export const EXCEPTION_PAGE_SIZES = [20, 50];

export const EXCEPTION_INITIAL_PARAMS: ExceptionListParams = {
  tab: "DELAY",
  kind: "",
  keyword: "",
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
 * ORDER는 06a 주문 조회에 `?orderId=`, CLAIM은 06b 반품·교환에 `?claimId=`를 얹어 상세를 연다.
 */
export const ORDER_LIST_PATH = "/order/list";
export const CLAIM_LIST_PATH = "/order/claim";
