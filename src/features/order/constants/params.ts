import type {
  OrderAnomalyType,
  OrderCancelType,
  OrderListParams,
  OrderPeriod,
  OrderSearchType,
  OrderSort,
  OrderStatusGroup,
  OrderTab,
} from "@/features/order/types";

/** 라우터가 이 경로로 주문 조회를 연다(`common/router`) */
export const ORDER_LIST_PATH = "/order/list";
/** 반품·교환(06b) · 예외 관리(06d) · 소통 스레드 — 레일 링크가 가는 곳 */
export const ORDER_CLAIM_PATH = "/order/claim";
export const ORDER_EXCEPTION_PATH = "/order/exception";
export const THREAD_PATH = "/monitoring/threads";

/** 탭 3종 — 반품 환불은 반품·교환, 환불 실패는 환불 관리 소관이라 「취소」만 남는다 */
export const ORDER_TABS: Array<{ value: OrderTab; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "ANOMALY", label: "배송 이상" },
  { value: "CANCELED", label: "취소" },
];

/** 상태 셀렉트(전체 탭) — 옵션 라벨 뒤에 건수가 붙는다 */
export const ORDER_STATUS_OPTIONS: Array<{
  value: OrderStatusGroup;
  label: string;
}> = [
  { value: "PAID", label: "결제완료" },
  { value: "PREPARING", label: "상품준비중" },
  { value: "SHIPPING", label: "배송중" },
  { value: "DELIVERED", label: "배송완료" },
  { value: "CONFIRMED", label: "구매확정" },
  { value: "CANCELED", label: "취소·환불" },
];

/** 이상 유형 셀렉트 — 탭이 축을 바꾸면 같은 자리의 셀렉트가 따라 바뀐다 */
export const ORDER_ANOMALY_OPTIONS: Array<{
  value: OrderAnomalyType;
  label: string;
}> = [
  { value: "COLLECT_CHECK", label: "집화 확인 필요" },
  { value: "TRACKING_STOPPED", label: "추적 정지" },
  { value: "RETURNING", label: "반송 중" },
];

/** 취소 유형 셀렉트(취소 탭) — 시안에 없는 탭의 축이라 같은 규칙으로 추가했다 */
export const ORDER_CANCEL_OPTIONS: Array<{
  value: OrderCancelType;
  label: string;
}> = [
  { value: "CONSUMER", label: "소비자 취소" },
  { value: "FORCED", label: "직권 취소" },
  { value: "RETURNED", label: "반송 환불" },
];

export const ORDER_SEARCH_TYPES: Array<{
  value: OrderSearchType;
  label: string;
}> = [
  { value: "ORDER_NO", label: "주문번호" },
  { value: "CONSUMER", label: "소비자" },
  { value: "INVOICE_NO", label: "송장번호" },
  { value: "PG_TX_NO", label: "PG 거래번호" },
];

export const ORDER_PERIOD_PRESETS: Array<{
  value: OrderPeriod;
  label: string;
  /** 오늘 기준으로 며칠 전부터 */
  days?: number;
}> = [
  { value: "TODAY", label: "오늘", days: 0 },
  { value: "WEEK", label: "7일", days: 7 },
  { value: "MONTH", label: "1개월", days: 30 },
  { value: "QUARTER", label: "3개월", days: 90 },
  { value: "CUSTOM", label: "직접 입력" },
];

export const ORDER_SORT_LABEL: Record<OrderSort, string> = {
  PAID_DESC: "결제일시 최신순",
  PAID_ASC: "결제일시 오래된순",
  AMOUNT_DESC: "결제금액 높은순",
  ANOMALY_OLDEST: "이상 지속 오래된순",
};

/** 조치 탭에서는 정렬 기본값과 선택지가 바뀐다 — 설명문은 UI에 쓰지 않는다(DS §8) */
export const ORDER_SORT_OPTIONS: Record<OrderTab, Array<OrderSort>> = {
  ALL: ["PAID_DESC", "PAID_ASC", "AMOUNT_DESC"],
  ANOMALY: ["ANOMALY_OLDEST", "PAID_DESC"],
  CANCELED: ["PAID_DESC", "PAID_ASC", "AMOUNT_DESC"],
};

export const ORDER_DEFAULT_SORT: Record<OrderTab, OrderSort> = {
  ALL: "PAID_DESC",
  ANOMALY: "ANOMALY_OLDEST",
  CANCELED: "PAID_DESC",
};

export const ORDER_PAGE_SIZES = [20, 50, 100];

export const ORDER_INITIAL_PARAMS: OrderListParams = {
  tab: "ALL",
  status: "",
  searchType: "ORDER_NO",
  keyword: "",
  period: "MONTH",
  from: "",
  to: "",
  brandId: "",
  groupBuyId: "",
  influencerId: "",
  payMethod: "",
  sort: "PAID_DESC",
  page: 1,
  size: 20,
};

export const SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235B5F68' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 9px center",
} as const;

/** 모달 폼 셀렉트(.msel) — 화살표가 10px 안쪽 */
export const MODAL_SELECT_CHEVRON_STYLE = {
  ...SELECT_CHEVRON_STYLE,
  backgroundPosition: "right 10px center",
} as const;
