import {
  ORDER_DEFAULT_SORT,
  ORDER_INITIAL_PARAMS,
  ORDER_ISSUE_OPTIONS,
  ORDER_PAGE_SIZES,
  ORDER_PAYMENT_METHODS,
  ORDER_PERIOD_PRESETS,
  ORDER_SEARCH_TYPES,
  ORDER_SORT_OPTIONS,
  ORDER_STATUS_OPTIONS,
  ORDER_TABS,
} from "@/features/order/constants/params";
import type {
  AdminOrderListQuery,
  AdminOrderSummaryQuery,
  AdminOrderTab,
  FulfillmentStatus,
  OrderListParams,
  PaymentMethod,
  TrackingAlert,
} from "@/features/order/types";

/** 탭마다 같은 자리의 셀렉트가 다른 축을 받는다 — 상태 · 이상 유형 · (취소 탭은 없음) */
const STATUS_VALUES: Record<AdminOrderTab, Array<string>> = {
  ALL: ORDER_STATUS_OPTIONS.map((item) => item.value),
  DELIVERY_ISSUE: ORDER_ISSUE_OPTIONS.map((item) => item.value),
  CANCEL: [],
};

const ID_PATTERN = /^\d+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** 숫자 id만 남긴다 — 손으로 고친 주소가 400으로 화면을 비우지 않게 */
function toId(value: string | undefined) {
  const trimmed = (value ?? "").trim();
  return ID_PATTERN.test(trimmed) && Number(trimmed) > 0 ? trimmed : "";
}

/**
 * 주소창에서 읽은 값은 전부 문자열이고 손으로 고칠 수도 있다 —
 * 서버 enum에 없는 값은 400이 되므로, 숫자로 바꾸고 모르는 값은 기본값으로 되돌린다.
 */
export function normalizeOrderParams(params: OrderListParams) {
  const page = Number(params.page);
  const size = Number(params.size);
  const initial = ORDER_INITIAL_PARAMS;
  const tab = ORDER_TABS.some((item) => item.value === params.tab)
    ? params.tab
    : initial.tab;
  const next: OrderListParams = {
    ...params,
    tab,
    status: STATUS_VALUES[tab].includes(params.status) ? params.status : "",
    searchType: ORDER_SEARCH_TYPES.some(
      (item) => item.value === params.searchType
    )
      ? params.searchType
      : initial.searchType,
    keyword: params.keyword ?? "",
    period:
      params.period === "ALL" ||
      ORDER_PERIOD_PRESETS.some((item) => item.value === params.period)
        ? params.period
        : initial.period,
    from: DATE_PATTERN.test(params.from ?? "") ? params.from : "",
    to: DATE_PATTERN.test(params.to ?? "") ? params.to : "",
    marketId: toId(params.marketId),
    // 공구는 브랜드에 종속 — 브랜드 없이 온 공구는 버린다
    groupBuyId: toId(params.marketId) ? toId(params.groupBuyId) : "",
    creatorId: toId(params.creatorId),
    paymentMethod: ORDER_PAYMENT_METHODS.some(
      (item) => item.value === params.paymentMethod
    )
      ? params.paymentMethod
      : "",
    // 탭마다 정렬 선택지가 다르다 — 이 탭에 없는 값이면 그 탭의 기본값으로 읽는다
    sort: ORDER_SORT_OPTIONS[tab].includes(params.sort)
      ? params.sort
      : ORDER_DEFAULT_SORT[tab],
    orderId: toId(params.orderId),
    page: Number.isInteger(page) && page > 0 ? page : initial.page,
    size: ORDER_PAGE_SIZES.includes(size) ? size : initial.size,
  };
  return next;
}

const optionalId = (value: string) => (value ? Number(value) : undefined);

/** 요약과 목록이 함께 쓰는 조건 — 상세 조건 · 검색 · 결제일 */
export function toSummaryQuery(
  params: OrderListParams,
  range: { from: string; to: string }
): AdminOrderSummaryQuery {
  const keyword = params.keyword.trim();
  return {
    marketId: optionalId(params.marketId),
    groupBuyId: optionalId(params.groupBuyId),
    creatorId: optionalId(params.creatorId),
    paymentMethod: (params.paymentMethod || undefined) as
      PaymentMethod | undefined,
    searchType: keyword ? params.searchType : undefined,
    keyword: keyword || undefined,
    from: range.from || undefined,
    to: range.to || undefined,
  };
}

/** 화면 조건 → `GET /v1/admin/orders` 쿼리 */
export function toListQuery(
  params: OrderListParams,
  range: { from: string; to: string }
): AdminOrderListQuery {
  const query: AdminOrderListQuery = {
    ...toSummaryQuery(params, range),
    tab: params.tab,
    sort: params.sort,
    page: params.page,
    size: params.size,
  };
  if (params.tab === "DELIVERY_ISSUE") {
    // 이상 유형 셀렉트 — 반송 중만 상태 축으로 보낸다
    if (params.status === "RETURNING") {
      query.status = "RETURNING";
    } else if (params.status) {
      query.trackingAlert = params.status as TrackingAlert;
    }
  } else if (params.tab === "ALL" && params.status) {
    query.status = params.status as FulfillmentStatus;
  }
  return query;
}
