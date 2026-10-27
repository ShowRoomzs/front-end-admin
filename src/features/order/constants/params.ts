import type {
  AdminOrderSearchType,
  AdminOrderSort,
  AdminOrderTab,
  FulfillmentStatus,
  OrderListParams,
  OrderPeriod,
  PaymentMethod,
  TrackingAlert,
} from "@/features/order/types";

/** 라우터가 이 경로로 주문 조회를 연다(`common/router`) */
export const ORDER_LIST_PATH = "/order/list";
/** 반품·교환(06b) · 예외 관리(06d) · 소통 스레드 — 레일 링크가 가는 곳 */
export const ORDER_CLAIM_PATH = "/order/claim";
export const ORDER_EXCEPTION_PATH = "/order/exception";
export const THREAD_PATH = "/monitoring/threads";

/** CS · 1:1 문의 상세(`common/router` `support/inquiry/:inquiryId`) */
export function inquiryDetailPath(inquiryId: number) {
  return `/support/inquiry/${inquiryId}`;
}

/** 탭 3종(`AdminOrderTab`) — 라벨은 enum 라벨 그대로 */
export const ORDER_TABS: Array<{ value: AdminOrderTab; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "DELIVERY_ISSUE", label: "배송 이상" },
  { value: "CANCEL", label: "취소" },
];

/**
 * 상태 셀렉트(전체 탭) — `FulfillmentStatus`에서 PENDING(목록 밖)을 뺀 7종.
 * 셀렉트 옵션에는 서버 라벨이 없어 enum 라벨을 옮겼다. 옆 숫자는 요약 `statusCounts`.
 */
export const ORDER_STATUS_OPTIONS: Array<{
  value: Exclude<FulfillmentStatus, "PENDING">;
  label: string;
}> = [
  { value: "NEW", label: "신규(준비 대기)" },
  { value: "PREPARING", label: "상품준비중" },
  { value: "SHIPPING", label: "배송중" },
  { value: "RETURNING", label: "반송중" },
  { value: "DELIVERED", label: "배송완료" },
  { value: "CONFIRMED", label: "구매확정" },
  { value: "CANCELLED", label: "취소" },
];

/**
 * 이상 유형 셀렉트(배송 이상 탭) — 집화 확인 필요 · 추적 정지는 `trackingAlert`,
 * 반송 중은 `TrackingAlert` 값이 아니라 상태라 `status=RETURNING`으로 보낸다.
 * 옆 숫자는 요약 `deliveryIssueCounts`.
 */
export const ORDER_ISSUE_OPTIONS: Array<{
  value: TrackingAlert | "RETURNING";
  label: string;
}> = [
  { value: "PICKUP_UNCONFIRMED", label: "집화 확인 필요" },
  { value: "STALLED", label: "추적 정지" },
  { value: "RETURNING", label: "반송 중" },
];

export const ORDER_SEARCH_TYPES: Array<{
  value: AdminOrderSearchType;
  label: string;
}> = [
  { value: "ORDER_NUMBER", label: "주문번호" },
  { value: "SUB_ORDER_NUMBER", label: "하위주문번호" },
  { value: "RECIPIENT", label: "수취인" },
  { value: "BRAND", label: "브랜드" },
  { value: "TRACKING_NUMBER", label: "송장번호" },
  { value: "PG_TX_ID", label: "PG 거래번호" },
  { value: "ALL", label: "전체" },
];

/** 결제수단(`PaymentMethod`) */
export const ORDER_PAYMENT_METHODS: Array<{
  value: PaymentMethod;
  label: string;
}> = [
  { value: "CARD", label: "카드" },
  { value: "EASY_PAY", label: "간편결제" },
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

export const ORDER_SORT_LABEL: Record<AdminOrderSort, string> = {
  PAID_DESC: "결제일시 최신순",
  PAID_ASC: "결제일시 오래된순",
  AMOUNT_DESC: "결제금액 높은순",
  ISSUE_OLDEST: "이상 지속 오래된순",
};

/** 조치 탭에서는 정렬 기본값과 선택지가 바뀐다 — 설명문은 UI에 쓰지 않는다(DS §8) */
export const ORDER_SORT_OPTIONS: Record<
  AdminOrderTab,
  Array<AdminOrderSort>
> = {
  ALL: ["PAID_DESC", "PAID_ASC", "AMOUNT_DESC"],
  DELIVERY_ISSUE: ["ISSUE_OLDEST", "PAID_DESC"],
  CANCEL: ["PAID_DESC", "PAID_ASC", "AMOUNT_DESC"],
};

export const ORDER_DEFAULT_SORT: Record<AdminOrderTab, AdminOrderSort> = {
  ALL: "PAID_DESC",
  DELIVERY_ISSUE: "ISSUE_OLDEST",
  CANCEL: "PAID_DESC",
};

export const ORDER_PAGE_SIZES = [20, 50, 100];

export const ORDER_INITIAL_PARAMS: OrderListParams = {
  tab: "ALL",
  status: "",
  searchType: "ORDER_NUMBER",
  keyword: "",
  period: "MONTH",
  from: "",
  to: "",
  marketId: "",
  groupBuyId: "",
  creatorId: "",
  paymentMethod: "",
  sort: "PAID_DESC",
  orderId: "",
  userId: "",
  cancelRequested: "",
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
