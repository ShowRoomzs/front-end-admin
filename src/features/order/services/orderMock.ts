/*
  주문 조회 목업 저장소 — 개발 서버 전용. 운영자 액션이 이 메모리 저장소를 바꾸므로 새로고침하기 전까지
  이력·상태가 그대로 이어진다(서버 연동 전 흐름 확인용).

  시나리오(`?mock=`) — 주소에 붙이면 시안의 다른 상태가 나온다.
    empty   조건과 상관없이 결과 0건            → A4(칩이 걸린 빈 목록. `&brandId=b2&groupBuyId=g5`를 같이 붙인다)
    recall  ORD-24201에 위해성 긴급 중단 이력   → B5(상세에서 [운영자 사유 환불]을 누른다)
    error   목록·상세 조회가 실패한다           → 오류 안내
    (A5는 `검색어 ORD-23004` 입력으로 바로 나온다 · B1~B8은 행 클릭 — orderMockData.ts 머리말 참고)
  시나리오는 첫 호출 때 한 번만 읽는다 — 필터를 바꾸면 주소의 `mock`이 지워지기 때문이다.
*/

import { mockDelay, mockScenario } from "@/common/utils/devMock";
import {
  applyRecallScenario,
  BRANDS,
  buildMockOrders,
  GROUP_BUYS,
  INFLUENCERS,
  maskInvoice,
  md,
  PAY_METHODS,
  type MockOrder,
} from "@/features/order/services/orderMockData";
import type {
  OrderAnomalyType,
  OrderBadgeData,
  OrderCancelType,
  OrderCorrectDeliveredAtRequest,
  OrderDetail,
  OrderFilterOptions,
  OrderForceCancelRequest,
  OrderListQuery,
  OrderListResponse,
  OrderOpenReturnRequest,
  OrderProxyInvoiceRequest,
  OrderRefundRequest,
  OrderStatusGroup,
  OrderTabSummary,
  Rich,
} from "@/features/order/types";
import { OrderApiError } from "@/features/order/utils/apiError";
import dayjs from "dayjs";

let scenarioCache: { value: string | null } | null = null;
function scenario() {
  if (!scenarioCache) {
    scenarioCache = { value: mockScenario() };
  }
  return scenarioCache.value;
}

let store: Array<MockOrder> | null = null;
function orders() {
  if (!store) {
    store = buildMockOrders();
    if (scenario() === "recall") {
      applyRecallScenario(store);
    }
  }
  return store;
}

function find(orderNo: string) {
  const found = orders().find((o) => o.row.orderNo === orderNo);
  if (!found) {
    throw new OrderApiError("ORDER_NOT_FOUND", "주문을 찾을 수 없습니다.");
  }
  return found;
}

/** 시안 기준일 — 1개월 프리셋이 2026.08.17 ~ 2026.09.16이 되도록 */
export function mockToday() {
  return new Date(2026, 8, 16);
}

const ANOMALY_ORDER: Array<OrderAnomalyType> = [
  "COLLECT_CHECK",
  "TRACKING_STOPPED",
  "RETURNING",
];
const ANOMALY_LABEL: Record<OrderAnomalyType, string> = {
  COLLECT_CHECK: "집화 확인 필요",
  TRACKING_STOPPED: "추적 정지",
  RETURNING: "반송 중",
};
const CANCEL_ORDER: Array<OrderCancelType> = ["CONSUMER", "FORCED", "RETURNED"];
const CANCEL_LABEL: Record<OrderCancelType, string> = {
  CONSUMER: "소비자 취소",
  FORCED: "직권 취소",
  RETURNED: "반송 환불",
};

// ── 조회 ────────────────────────────────────────────────
export async function mockGetList(
  query: OrderListQuery
): Promise<OrderListResponse> {
  if (scenario() === "error") {
    throw new OrderApiError("MOCK_ERROR", "목록을 불러오지 못했습니다.");
  }
  const page = Math.max(1, Number(query.page) || 1);
  const size = Number(query.size) || 20;
  const keyword = query.keyword.trim().toLowerCase();

  let rows = scenario() === "empty" ? [] : [...orders()];

  if (query.tab === "ANOMALY") {
    rows = rows.filter((o) => o.meta.anomalyType);
  } else if (query.tab === "CANCELED") {
    rows = rows.filter((o) => o.row.statusGroup === "CANCELED");
  }
  if (query.status) {
    rows = rows.filter((o) => {
      if (query.tab === "ANOMALY") return o.meta.anomalyType === query.status;
      if (query.tab === "CANCELED") return o.meta.cancelType === query.status;
      return o.row.statusGroup === query.status;
    });
  }
  if (query.paidFrom) {
    rows = rows.filter((o) => o.row.paidAt.slice(0, 10) >= query.paidFrom);
  }
  if (query.paidTo) {
    rows = rows.filter((o) => o.row.paidAt.slice(0, 10) <= query.paidTo);
  }
  if (query.brandId) {
    rows = rows.filter((o) => o.meta.brandIds.includes(query.brandId));
  }
  if (query.groupBuyId) {
    rows = rows.filter((o) => o.meta.groupBuyId === query.groupBuyId);
  }
  if (query.influencerId) {
    rows = rows.filter((o) => o.meta.influencerId === query.influencerId);
  }
  if (query.payMethod) {
    rows = rows.filter((o) => o.meta.payMethod === query.payMethod);
  }
  if (keyword) {
    rows = rows.filter((o) => {
      switch (query.searchType) {
        case "CONSUMER":
          return o.meta.consumerName.toLowerCase().includes(keyword);
        case "INVOICE_NO":
          return o.meta.invoiceNos.some((n) => n.includes(keyword));
        case "PG_TX_NO":
          return o.meta.pgTxNos.some((n) => n.toLowerCase().includes(keyword));
        default:
          return o.row.orderNo.toLowerCase().includes(keyword);
      }
    });
  }

  rows.sort((a, b) => {
    switch (query.sort) {
      case "PAID_ASC":
        return a.row.paidAt.localeCompare(b.row.paidAt);
      case "AMOUNT_DESC":
        return b.row.payAmount - a.row.payAmount;
      case "ANOMALY_OLDEST":
        return (a.meta.anomalySince ?? "9").localeCompare(
          b.meta.anomalySince ?? "9"
        );
      default:
        return b.row.paidAt.localeCompare(a.row.paidAt);
    }
  });

  const typeCounts: Array<{ label: string; count: number }> =
    query.tab === "ANOMALY"
      ? ANOMALY_ORDER.map((type) => ({
          label: ANOMALY_LABEL[type],
          count: rows.filter((o) => o.meta.anomalyType === type).length,
        }))
      : query.tab === "CANCELED"
        ? CANCEL_ORDER.map((type) => ({
            label: CANCEL_LABEL[type],
            count: rows.filter((o) => o.meta.cancelType === type).length,
          }))
        : [];

  const totalResults = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / size));
  const content = rows.slice((page - 1) * size, page * size).map((o) => o.row);

  return mockDelay({
    content,
    pageInfo: {
      currentPage: page,
      totalPages: totalResults === 0 ? 0 : totalPages,
      totalResults,
      limit: size,
      hasNext: page < totalPages,
    },
    summary: {
      anomalyCount: rows.filter((o) => o.meta.anomalyType).length,
      delayedCount: rows.filter((o) => o.meta.delayed).length,
      typeCounts,
    },
  });
}

export async function mockGetSummary(): Promise<OrderTabSummary> {
  const all = orders();
  const count = (group: OrderStatusGroup) =>
    all.filter((o) => o.row.statusGroup === group).length;
  return mockDelay({
    tabCounts: {
      ALL: all.length,
      ANOMALY: all.filter((o) => o.meta.anomalyType).length,
      CANCELED: count("CANCELED"),
    },
    statusCounts: {
      PAID: count("PAID"),
      PREPARING: count("PREPARING"),
      SHIPPING: count("SHIPPING"),
      DELIVERED: count("DELIVERED"),
      CONFIRMED: count("CONFIRMED"),
      CANCELED: count("CANCELED"),
    },
    anomalyCounts: {
      COLLECT_CHECK: all.filter((o) => o.meta.anomalyType === "COLLECT_CHECK")
        .length,
      TRACKING_STOPPED: all.filter(
        (o) => o.meta.anomalyType === "TRACKING_STOPPED"
      ).length,
      RETURNING: all.filter((o) => o.meta.anomalyType === "RETURNING").length,
    },
    cancelCounts: {
      CONSUMER: all.filter((o) => o.meta.cancelType === "CONSUMER").length,
      FORCED: all.filter((o) => o.meta.cancelType === "FORCED").length,
      RETURNED: all.filter((o) => o.meta.cancelType === "RETURNED").length,
    },
  });
}

export async function mockGetFilterOptions(): Promise<OrderFilterOptions> {
  return mockDelay(
    {
      brands: BRANDS,
      groupBuys: GROUP_BUYS.map((g) => ({
        id: g.id,
        title: g.title,
        brandId: g.brandId,
      })),
      influencers: INFLUENCERS,
      payMethods: PAY_METHODS,
    },
    120
  );
}

export async function mockGetDetail(orderNo: string): Promise<OrderDetail> {
  if (scenario() === "error") {
    throw new OrderApiError("MOCK_ERROR", "주문을 불러오지 못했습니다.");
  }
  return mockDelay(find(orderNo).detail);
}

// ── 쓰기 ────────────────────────────────────────────────
const OPERATOR = "운영자 김운영";

function stamp(order: MockOrder) {
  // 이력에 남기는 시각은 시안의 기준 시각에서 1분씩 흐른다
  const at = dayjs(order.detail.asOf).add(1, "minute").format();
  order.detail.asOf = at;
  return md(at);
}

const UNSHIPPED = ["결제완료", "상품준비중", "취소 요청"];

function summarizeSubs(order: MockOrder) {
  const short: Record<string, string> = {
    배송중: "배송중",
    상품준비중: "준비중",
    결제완료: "결제",
    취소: "취소",
  };
  const counts = new Map<string, number>();
  for (const sub of order.detail.subOrders) {
    const key = short[sub.status.label] ?? sub.status.label;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts].map(([k, v]) => `${k} ${v}`).join(" · ");
}

export async function mockProxyInvoice(
  orderNo: string,
  body: OrderProxyInvoiceRequest
) {
  const order = find(orderNo);
  const duplicated = orders().find((o) =>
    o.meta.invoiceNos.includes(body.invoiceNo)
  );
  if (duplicated) {
    throw new OrderApiError(
      "DUPLICATE_INVOICE",
      `이미 등록된 송장번호입니다(${duplicated.row.orderNo}).`
    );
  }
  const target = order.detail.actions.proxyInvoice;
  if (!target) {
    throw new OrderApiError("NOT_ALLOWED", "대행 등록이 열려 있지 않습니다.");
  }
  const when = stamp(order);
  const masked = maskInvoice(body.invoiceNo);
  const shipped: OrderBadgeData = { label: "배송중", tone: "INFO" };

  for (const sub of order.detail.subOrders) {
    if (sub.brandName !== target.overdueBrandName) continue;
    sub.status = shipped;
    sub.items.forEach((item) => (item.status = shipped));
  }
  for (const card of order.detail.shipping.cards) {
    if (card.brandName !== target.overdueBrandName) continue;
    card.status = shipped;
    card.head = [`${body.carrier} · ${masked}`];
    card.rows = [
      {
        label: "추적",
        main: [{ t: "송장 등록 직후", k: "dim" }],
        side: ["송장 출처 ", { t: "운영자 대행", k: "b" }],
      },
    ];
  }
  order.detail.banner = null;
  order.detail.actions.proxyInvoice = null;
  order.detail.actions.forceCancel = null;
  order.detail.statusCard = {
    label: "배송중",
    tone: "INFO",
    rows: [
      { label: "송장 출처", value: ["운영자 대행"] },
      { label: "등록 일시", value: [{ t: when, k: "num" }] },
    ],
  };
  order.detail.history.unshift({
    tone: "INFO",
    title: "운영자 대행 송장 등록 → 배송중 전환",
    meta: `${OPERATOR} · ${body.carrier} ${masked} · 사유: ${body.reason} · ${when} · 브랜드 통지`,
  });
  order.meta.invoiceNos.push(body.invoiceNo);
  order.meta.delayed = false;

  order.row.status = shipped;
  order.row.statusGroup = "SHIPPING";
  order.row.subOrders.forEach((sub) => {
    if (sub.brandName === target.overdueBrandName) {
      sub.status = shipped;
      sub.shipNote = `${body.carrier.slice(0, 2)} ${masked}`;
    }
  });
  return mockDelay({ orderNo }, 400);
}

export async function mockCorrectDeliveredAt(
  orderNo: string,
  body: OrderCorrectDeliveredAtRequest
) {
  const order = find(orderNo);
  const target = order.detail.actions.correctDeliveredAt;
  if (!target) {
    throw new OrderApiError("NOT_ALLOWED", "정정이 열려 있지 않습니다.");
  }
  const when = stamp(order);
  const before = dayjs(target.currentDate);
  const after = dayjs(body.deliveredAt);
  const confirmAt = after.add(target.confirmDays, "day");
  const confirmDay = dayjs(order.detail.asOf).startOf("day");
  const dDay = confirmAt.startOf("day").diff(confirmDay, "day");

  const shippingCard = order.detail.shipping.cards[0];
  const tracking = shippingCard?.rows.find((r) => r.label === "추적");
  if (tracking) {
    tracking.main = [
      "배송완료 ",
      { t: after.format("MM.DD"), k: "num" },
      " ",
      { t: "(운영자 정정)", k: "sub" },
    ];
    tracking.side = ["정정 전 ", { t: before.format("MM.DD"), k: "num" }];
  }
  const dispute = shippingCard?.rows.find((r) => r.label === "소비자 이의");
  if (dispute) {
    dispute.side = [
      { t: dayjs(order.detail.asOf).format("MM.DD"), k: "num" },
      " 정정 반영",
    ];
  }
  if (order.detail.settlement) {
    const row = order.detail.settlement.find((r) => r.label === "구매확정");
    if (row) {
      row.value = [
        "예정 ",
        { t: confirmAt.format("MM.DD"), k: "num" },
        " ",
        { t: `(D-${dDay})`, k: "sub" },
      ];
    }
  }
  order.detail.statusCard.rows = [
    {
      label: "배송완료",
      value: [{ t: after.format("MM.DD"), k: "num" }, " (운영자 정정)"],
    },
    {
      label: "구매확정 예정",
      value: [{ t: confirmAt.format("MM.DD"), k: "num" }],
    },
    { label: "이의", value: ["1건 처리"] },
  ];
  order.detail.history.unshift({
    tone: "WARNING",
    title: "배송완료일 정정 (운영자 정정)",
    meta: `${OPERATOR} · ${before.format("MM.DD")} → ${after.format("MM.DD")} · 근거 ${body.evidence} · ${when} · 브랜드·소비자 통지`,
  });
  order.detail.actions.correctDeliveredAt = null;
  order.detail.railNotice = "NO_ACTION";
  return mockDelay({ orderNo }, 400);
}

const REFUND_CATEGORY_LABEL = {
  RECALL: "위해성 리콜",
  OBJECTION_ACCEPTED: "반려 이의 인용",
  OTHER: "기타",
};

export async function mockRefund(orderNo: string, body: OrderRefundRequest) {
  const order = find(orderNo);
  const when = stamp(order);
  const names: Array<string> = [];
  for (const sub of order.detail.subOrders) {
    for (const item of sub.items) {
      if (body.items.some((x) => x.itemId === item.id)) {
        item.extraBadge = { label: "환불 대기", tone: "WARNING" };
        names.push(`${item.name} ${item.option}`);
      }
    }
  }
  const left = order.detail.subOrders
    .flatMap((s) => s.items)
    .filter((i) => !i.extraBadge && i.status.label !== "취소·환불");
  order.detail.actions.refund = left.length > 0;
  order.detail.statusCard.rows.push({
    label: "환불",
    value: ["환불 대기 · 환불 관리에서 집행"],
  });
  order.detail.history.unshift({
    tone: "WARNING",
    title: `운영자 사유 환불 · 환불 대기 편입 (${REFUND_CATEGORY_LABEL[body.category]})`,
    meta: `${OPERATOR} · ${names.join(", ")} · 근거 ${body.reason} · ${when}`,
  });
  return mockDelay({ orderNo }, 400);
}

const DEFECT_LABEL = {
  DEFECT: "불량 · 파손",
  MISMATCH: "표시·광고와 다름",
  WRONG_ITEM: "오배송",
};

export async function mockOpenReturn(
  orderNo: string,
  body: OrderOpenReturnRequest
) {
  const order = find(orderNo);
  const target = order.detail.actions.openReturn;
  if (!target || target.expired) {
    throw new OrderApiError("NOT_ALLOWED", "반품을 열 수 없습니다.");
  }
  const when = stamp(order);
  for (const sub of order.detail.subOrders) {
    for (const item of sub.items) {
      if (body.itemIds.includes(item.id)) {
        item.extraBadge = { label: "반품 열림", tone: "INFO" };
      }
    }
  }
  order.detail.statusCard = {
    label: "반품 진행 중",
    tone: "INFO",
    rows: [
      { label: "단계", value: ["회수 송장 입력 대기"] },
      { label: "귀책", value: ["브랜드 · 착불 · 차감 없음"] },
      { label: "환불", value: ["검수 승인 후 PG 자동 환불"] },
    ],
  };
  order.detail.history.unshift({
    tone: "INFO",
    title: "반품 열림 (운영자 대행)",
    meta: `${OPERATOR} · ${DEFECT_LABEL[body.defectType]} · 하자 인지 ${dayjs(body.noticedAt).format("MM.DD")} · ${body.evidence} · 귀책 브랜드 · ${when}`,
  });
  order.detail.actions.openReturn = null;
  order.detail.railNotice = "RETURN_OPENED";
  order.detail.claimLink = true;
  order.row.status = { label: "반품 진행 중", tone: "INFO" };
  order.row.statusNote = "회수 송장 대기";
  return mockDelay({ orderNo }, 400);
}

export async function mockForceCancel(
  orderNo: string,
  body: OrderForceCancelRequest
) {
  const order = find(orderNo);
  const target = order.detail.actions.forceCancel;
  if (!target) {
    throw new OrderApiError("NOT_ALLOWED", "직권 취소가 열려 있지 않습니다.");
  }
  const when = stamp(order);
  const canceled: OrderBadgeData = { label: "취소", tone: "NEUTRAL" };
  const canceledItem: OrderBadgeData = { label: "취소·환불", tone: "NEUTRAL" };
  let refunded = 0;
  const brandNames: Array<string> = [];

  for (const sub of order.detail.subOrders) {
    if (!UNSHIPPED.includes(sub.status.label)) continue;
    refunded += sub.amount;
    brandNames.push(sub.brandName);
    sub.status = canceled;
    sub.items.forEach((item) => (item.status = canceledItem));
  }
  for (const card of order.detail.shipping.cards) {
    if (card.brandName && brandNames.includes(card.brandName)) {
      card.status = canceled;
      card.head = [{ t: "직권 취소 · 송장 없음", k: "dim" }];
      card.rows = [];
    }
  }
  const payment = order.detail.payments[0];
  payment.cancelable = Math.max(0, payment.cancelable - refunded);
  order.detail.cancelableNote = "직권 취소분 환불 완료";
  order.detail.history.unshift({
    tone: "NEUTRAL",
    title: `직권 취소 · PG 자동 환불 · ${refunded.toLocaleString("ko-KR")}원`,
    meta: `${OPERATOR} · ${brandNames.join(", ")} 하위주문 · 사유: ${body.reason} · ${when}`,
  });
  order.detail.actions.forceCancel = null;

  const allCanceled = order.detail.subOrders.every(
    (sub) => sub.status.label === "취소"
  );
  const cancelRowStatus: OrderBadgeData = {
    label: "취소·환불",
    tone: "NEUTRAL",
  };
  if (allCanceled) {
    order.detail.paymentStatus = { label: "전체 취소", tone: "NEUTRAL" };
    order.detail.actions.refund = false;
    order.detail.actions.proxyInvoice = null;
    order.detail.banner = null;
    order.detail.railNotice = "CANCELED";
    order.detail.statusCard = {
      label: "취소·환불",
      tone: "NEUTRAL",
      rows: [
        {
          label: "환불",
          value: [
            { t: `${refunded.toLocaleString("ko-KR")}원`, k: "num" },
            " · 자동 완료",
          ],
        },
        { label: "환불 일시", value: [{ t: when, k: "num" }] },
      ],
    };
    order.row.status = cancelRowStatus;
    order.row.statusNote = "직권 취소";
    order.row.statusGroup = "CANCELED";
    order.row.anomaly = null;
    order.meta.cancelType = "FORCED";
    order.meta.anomalyType = null;
    order.meta.anomalySince = null;
    order.meta.delayed = false;
  } else {
    const subRow = order.detail.statusCard.rows.find(
      (r) => r.label === "하위주문"
    );
    if (subRow) {
      subRow.value = [summarizeSubs(order)] as Rich;
    }
    order.row.statusNote = summarizeSubs(order).replace(/ \d+/g, "");
  }
  order.row.subOrders.forEach((sub) => {
    if (brandNames.includes(sub.brandName)) {
      sub.status = canceled;
      sub.shipNote = "직권 취소";
    }
  });
  return mockDelay({ orderNo }, 400);
}
