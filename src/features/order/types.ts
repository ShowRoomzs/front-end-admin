/*
  주문 조회(거래 관리 › 주문 조회) 타입 — 시안 ui-admin-06a-orders.html rev.4에서 뽑은 잠정 타입.

  백엔드에 어드민 주문 API가 아직 없다. 이 파일은 서버 응답이 아니라 **시안이 보여주는 값**에서
  거꾸로 만든 것이라, API가 생기면 *Dto.java를 먼저 읽고 이 파일을 맞춘다(필드명·열거값 추측 금지).
  `Rich`로 표현한 줄(배송·정산·상태 카드)은 시안의 문장 조각을 그대로 옮긴 표시용 구조이고,
  실제 API에서는 구조화된 필드(택배사 · 송장 · 일시 · 출처 …)로 내려받아 화면에서 문장으로 조립한다.
*/

import type { BaseParams } from "@/common/types/page";

// ── 공통 ────────────────────────────────────────────────

/** 상태색 4원칙: 조치 필요=경고 · 반송·추적 정지=위험 · 정상 진행=정보 · 완료=성공 · 취소·환불=중립 */
export type OrderTone = "INFO" | "SUCCESS" | "WARNING" | "DANGER" | "NEUTRAL";

/** 탭 3종 — 상태 6종은 탭이 아니라 상태 셀렉트가 맡는다(DS §6 탭은 4~5개까지) */
export type OrderTab = "ALL" | "ANOMALY" | "CANCELED";

/** 상태 셀렉트(전체 탭) — 혼합 주문은 서버가 대표 단계 하나로 묶어 센다 */
export type OrderStatusGroup =
  "PAID" | "PREPARING" | "SHIPPING" | "DELIVERED" | "CONFIRMED" | "CANCELED";

/** 이상 유형 셀렉트(배송 이상 탭) */
export type OrderAnomalyType =
  "COLLECT_CHECK" | "TRACKING_STOPPED" | "RETURNING";

/** 취소 유형 셀렉트(취소 탭) — 시안에 없어 추가한 축 */
export type OrderCancelType = "CONSUMER" | "FORCED" | "RETURNED";

export type OrderSearchType =
  "ORDER_NO" | "CONSUMER" | "INVOICE_NO" | "PG_TX_NO";

export type OrderPeriod =
  "TODAY" | "WEEK" | "MONTH" | "QUARTER" | "CUSTOM" | "ALL";

export type OrderSort =
  "PAID_DESC" | "PAID_ASC" | "AMOUNT_DESC" | "ANOMALY_OLDEST";

export type OrderPayMethod = "CARD" | "KAKAOPAY" | "NAVERPAY" | "TRANSFER";

/** 표시용 문장 조각 — 굵게·흐리게·경고색·숫자 정렬·배지·태그를 한 줄 안에 섞는다 */
export type RichSeg =
  | string
  | {
      t: string;
      /** b 굵게 · dim 흐림(n-400) · bdim 굵은 흐림 · sub 보조(n-500) · warn 경고색 · bwarn 굵은 경고색 · num 숫자 정렬 */
      k?: "b" | "dim" | "sub" | "warn" | "num" | "bwarn" | "bdim";
    }
  | { badge: string; tone: OrderTone }
  | { tag: string };
export type Rich = Array<RichSeg>;

// ── 목록 ────────────────────────────────────────────────

export interface OrderListParams extends BaseParams {
  tab: OrderTab;
  /** 탭에 따라 상태(전체) · 이상 유형(배송 이상) · 취소 유형(취소) 중 하나 */
  status: string;
  searchType: OrderSearchType;
  keyword: string;
  period: OrderPeriod;
  /** period=CUSTOM일 때만 쓴다 — yyyy-MM-dd */
  from: string;
  to: string;
  brandId: string;
  groupBuyId: string;
  influencerId: string;
  payMethod: string;
  sort: OrderSort;
}

/** 서버로 나가는 조회 조건 — 기간은 화면이 yyyy-MM-dd로 풀어서 보낸다(빈 문자열이면 전체 기간) */
export interface OrderListQuery extends Omit<
  OrderListParams,
  "period" | "from" | "to"
> {
  paidFrom: string;
  paidTo: string;
}

export interface OrderBadgeData {
  label: string;
  tone: OrderTone;
}

export interface OrderSubSummary {
  /** `-01` */
  suffix: string;
  brandName: string;
  /** "글로우 크림 50ml · 1건" */
  itemSummary: string;
  amount: number;
  status: OrderBadgeData;
  /** "CJ 6512****8823" · "송장 미등록" */
  shipNote: string;
}

export interface OrderListItem {
  orderNo: string;
  /** 결제일시 — yyyy-MM-ddTHH:mm:ss */
  paidAt: string;
  consumerMasked: string;
  /** 단일 브랜드명 또는 "2개 브랜드" */
  brandLabel: string;
  groupBuyTitle: string;
  payAmount: number;
  status: OrderBadgeData;
  /** 상태 배지 아래 한 줄 — "배송중 · 상품준비중" · "PG 자동 환불" */
  statusNote: string | null;
  statusGroup: OrderStatusGroup;
  /** 배송 이상 열 — 상태와 다른 축(진행 단계 vs 그 단계에서 벌어진 사고) */
  anomaly: (OrderBadgeData & { note: string }) | null;
  /** 하위주문이 둘 이상이면 행 확장을 연다 — 1단에서 끊는다 */
  subOrders: Array<OrderSubSummary>;
}

export interface OrderListSummary {
  /** 총 N건 옆에 붙는 건수 — 조건이 걸리면 그 조건 안에서 센다 */
  anomalyCount: number;
  delayedCount: number;
  /** 배송 이상 탭 · 취소 탭의 유형별 건수 */
  typeCounts: Array<{ label: string; count: number }>;
}

export interface OrderListResponse {
  content: Array<OrderListItem>;
  pageInfo: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    limit: number;
    hasNext: boolean;
  };
  summary: OrderListSummary;
}

/** 탭·셀렉트 건수 — 필터에 영향을 받지 않는 전체 기준 */
export interface OrderTabSummary {
  tabCounts: Record<OrderTab, number>;
  statusCounts: Record<OrderStatusGroup, number>;
  anomalyCounts: Record<OrderAnomalyType, number>;
  cancelCounts: Record<OrderCancelType, number>;
}

export interface OrderFilterOptions {
  brands: Array<{ id: string; name: string }>;
  /** 공구는 브랜드에 종속 — brandId 없이는 비어 있다 */
  groupBuys: Array<{ id: string; title: string; brandId: string }>;
  influencers: Array<{ id: string; name: string }>;
  payMethods: Array<{ value: OrderPayMethod; label: string }>;
}

// ── 상세 ────────────────────────────────────────────────

export interface OrderItemLine {
  id: string;
  name: string;
  option: string;
  /** 교환 — 새 옵션 */
  optionTo?: string;
  qty: number;
  status: OrderBadgeData;
  /** 항목 배지 옆에 하나 더 붙는 배지(환불 대기 등) */
  extraBadge?: OrderBadgeData;
  price: number;
  /** 정산 확정 여부 — 환불·반품 시 클로백 */
  settled: boolean;
}

export interface OrderSubOrder {
  suffix: string;
  brandName: string;
  status: OrderBadgeData;
  amount: number;
  items: Array<OrderItemLine>;
}

export interface OrderPayment {
  kind: "ORIGINAL" | "EXTRA";
  pgTxNo: string;
  /** "카드 · 신한 (일시불)" */
  method: string;
  amount: number;
  /** yyyy-MM-ddTHH:mm:ss */
  paidAt: string;
  /** 추가 결제 사유 — "교환 재발송비" */
  purpose?: string;
  cancelable: number;
}

export interface OrderShippingCard {
  brandName?: string;
  status?: OrderBadgeData;
  /** 카드 머리 오른쪽 — 택배사 · 송장 · 출처 */
  head?: Rich;
  rows: Array<{
    label: string;
    main: Rich;
    side?: Rich;
    tone?: "warn";
  }>;
}

export interface OrderHistoryEntry {
  tone: OrderTone;
  title: string;
  /** "시스템 · 택배사 상태 코드 09.12 13:40" — 행위자 · 근거 · 일시 */
  meta: string;
}

export interface OrderMetaRow {
  label: string;
  value: Rich;
  tone?: "warn";
}

export type OrderBannerData =
  | { kind: "RETURN_REFUNDED"; refundAmount: number; refundAt: string }
  | { kind: "PROXY_AVAILABLE"; alertCount: number; lastAlertAt: string };

export type OrderRailNotice =
  | "RETURNED"
  | "CANCEL_REQUESTED"
  | "EXCHANGING"
  | "RETURN_OPENED"
  | "CANCELED"
  | "NO_ACTION";

export interface OrderActions {
  /** 운영자 사유 환불 — 이 화면은 환불 대기 편입까지, 집행은 환불 관리 */
  refund: boolean;
  /** 직권 취소 — 배송 전 하위주문만 대상 */
  forceCancel: { targetBrandNames: Array<string>; clawback: boolean } | null;
  /** 발송 기한 경과 + 자동 알림 3회 무응답일 때만 열린다 */
  proxyInvoice: { overdueBrandName: string } | null;
  /** 소비자 수령일 이의 접수 시 — 배송완료일 정정 */
  correctDeliveredAt: {
    currentDate: string;
    sourceLabel: string;
    claimedDate: string;
    evidenceOptions: Array<string>;
    /** 배송완료일 + N일 = 구매확정 예정일 */
    confirmDays: number;
  } | null;
  /** 구매확정 후 하자 — 반품 대신 열기 */
  openReturn: {
    itemIds: Array<string>;
    evidenceOptions: Array<string>;
    suggestedNoticeDate: string;
    withdrawalDeadline: string;
    expired: boolean;
    settledRoundLabel: string | null;
  } | null;
}

export interface OrderCancelRequestBlock {
  requestedAt: string;
  reason: string;
  /** 응답 마감 · 영업일 */
  respondBy: string;
  respondBusinessDays: number;
  autoApproveText: Rich;
}

export interface OrderDetail {
  orderNo: string;
  /** 기준 시각 — 이력에 새 줄을 남길 때의 시각(yyyy-MM-ddTHH:mm:ss) */
  asOf: string;
  inquiryCount: number;
  banner: OrderBannerData | null;
  groupBuyTitle: string;
  influencerName: string;
  /** 하위주문 블록 머리 오른쪽에 덧붙는 한 줄 — 교환 사유 · 귀책 */
  claimNote: string | null;

  payments: Array<OrderPayment>;
  paymentStatus: OrderBadgeData;
  /** 취소 가능 잔액 옆 보조 — "부분 환불 없음" · "전액 환불 09.16" */
  cancelableNote: string | null;

  subOrders: Array<OrderSubOrder>;
  shipping: {
    title: string | null;
    cards: Array<OrderShippingCard>;
    hint: Rich | null;
  };
  /** 정산 반영 블록 — 취소 요청이 걸린 주문은 이 자리에 취소 요청 블록이 온다 */
  settlement: Array<{ label: string; value: Rich }> | null;
  cancelRequest: OrderCancelRequestBlock | null;
  history: Array<OrderHistoryEntry>;

  statusCard: {
    label: string;
    tone: OrderTone;
    rows: Array<OrderMetaRow>;
  };
  actions: OrderActions;
  railNotice: OrderRailNotice | null;
  /** 반품·교환 상세로 가는 링크 — 교환 진행 중 */
  claimLink: boolean;
}

// ── 쓰기 ────────────────────────────────────────────────

export interface OrderProxyInvoiceRequest {
  carrier: string;
  invoiceNo: string;
  reason: string;
}

export interface OrderCorrectDeliveredAtRequest {
  evidence: string;
  evidenceText: string;
  /** yyyy-MM-dd */
  deliveredAt: string;
}

export interface OrderRefundRequest {
  items: Array<{ itemId: string; qty: number }>;
  category: "RECALL" | "OBJECTION_ACCEPTED" | "OTHER";
  reason: string;
}

export interface OrderOpenReturnRequest {
  itemIds: Array<string>;
  defectType: "DEFECT" | "MISMATCH" | "WRONG_ITEM";
  evidence: string;
  /** yyyy-MM-dd */
  noticedAt: string;
}

export interface OrderForceCancelRequest {
  reason: string;
}
