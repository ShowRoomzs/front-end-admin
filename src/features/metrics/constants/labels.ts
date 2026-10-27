import type {
  MetricsPreset,
  MetricsTab,
  MetricsUnit,
} from "@/features/metrics/types";

/** 기간 5종(ui-admin-21-metrics rev.5) — 한 달이 기본 */
export const PRESET_OPTIONS: Array<{ value: MetricsPreset; label: string }> = [
  { value: "TODAY", label: "오늘" },
  { value: "D7", label: "7일" },
  { value: "M1", label: "한 달" },
  { value: "M6", label: "6개월" },
  { value: "CUSTOM", label: "직접 선택" },
];

export const DEFAULT_PRESET: MetricsPreset = "M1";

/** 탭 5종 — DS 탭 상한 5 */
export const TAB_OPTIONS: Array<{ value: MetricsTab; label: string }> = [
  { value: "CORE", label: "핵심" },
  { value: "SUPPLY", label: "공급" },
  { value: "GROUP_BUY", label: "공구" },
  { value: "DEMAND", label: "수요" },
  { value: "OPERATION", label: "운영" },
];

/** 차트 제목 앞 단위 — 「일별 공구 거래액」 · 「주별 계약 체결」 */
export const UNIT_PREFIX: Record<MetricsUnit, string> = {
  HOUR: "시간별",
  DAY: "일별",
  WEEK: "주별",
  MONTH: "월별",
};

/** 요약 표 머리(시안 `.tbar`) — 공구 탭 오른쪽 문구의 건수는 「진행한 공구」 값으로 채운다 */
export const SUMMARY_HEAD: Record<
  MetricsTab,
  { title: string; caption: string }
> = {
  CORE: { title: "핵심 요약", caption: "공구 거래액 = 결제 시점 · 취소 포함" },
  SUPPLY: { title: "공급", caption: "브랜드 · 인플루언서가 공구를 여는가" },
  GROUP_BUY: {
    title: "공구 성과",
    caption: "기간 중 하루라도 판매된 공구",
  },
  DEMAND: { title: "수요", caption: "소비자 · 결제 시점" },
  OPERATION: {
    title: "신뢰 · 운영",
    caption: "신뢰 = 거래가 깨끗하게 끝나나 · 운영 = 처리 완료 시각",
  },
};

/**
 * 분해 표 구성 — 서버는 열을 문자열로 나눠 내린다(`breakdown.columns` · `rows`). 시안은 이름 칸에
 * 보조줄(브랜드 × 인플루언서 · 첫/재공구)과 막대(`.hb`)를 함께 그리므로 서버 열 이름으로 칸을 골라 합친다.
 * 막대는 표의 기준 값(`bar` 열)으로만 그린다(시안 rev.2 [분해 표 정합]).
 */
export interface BreakdownColumn {
  /** 서버 열 이름 */
  source: string;
  header: string;
  width: number;
  /** 금액 칸 — 서버 「5,120,000원」에서 「원」을 뗀다(머리가 「거래액」) */
  amount?: boolean;
  /** 서버가 콤마 없이 내리는 숫자(팔로워) */
  number?: boolean;
  /** 「96% · 미달」 → 빨간 글자 「96%」 */
  shortfall?: boolean;
}

export interface BreakdownConfig {
  title: string;
  caption: string;
  nameHeader: string;
  name: string;
  sub?: string;
  bar: string;
  columns: Array<BreakdownColumn>;
}

export const BREAKDOWN: Record<MetricsTab, BreakdownConfig> = {
  CORE: {
    title: "공구별 거래액",
    caption: "상위 5개",
    nameHeader: "공구 · 브랜드 × 인플루언서",
    name: "공구",
    sub: "브랜드 × 인플루언서",
    bar: "거래액",
    columns: [
      { source: "주문", header: "주문", width: 52 },
      { source: "거래액", header: "거래액", width: 96, amount: true },
      { source: "반품·교환율", header: "반품·교환", width: 76 },
    ],
  },
  SUPPLY: {
    title: "인플루언서별 공구",
    caption: "거래액 순 · 상위 5명",
    nameHeader: "인플루언서(쇼룸)",
    name: "인플루언서",
    sub: "구분",
    bar: "거래액",
    columns: [
      { source: "공구 수", header: "공구", width: 48 },
      { source: "거래액", header: "거래액", width: 96, amount: true },
      { source: "누적 공구", header: "누적 공구", width: 72 },
    ],
  },
  GROUP_BUY: {
    title: "공구별 성과",
    caption: "거래액 순 · 상위 5개",
    nameHeader: "공구 · 브랜드 × 인플루언서",
    name: "공구",
    sub: "브랜드 × 인플루언서",
    bar: "거래액",
    columns: [
      { source: "거래액", header: "거래액", width: 96, amount: true },
      { source: "물량 달성", header: "물량 달성", width: 72, shortfall: true },
      { source: "ROI", header: "ROI", width: 56 },
    ],
  },
  DEMAND: {
    title: "쇼룸별 전환",
    caption: "구매 소비자 순 · 상위 5곳",
    nameHeader: "인플루언서(쇼룸)",
    name: "인플루언서(쇼룸)",
    bar: "구매 소비자",
    columns: [
      { source: "팔로워", header: "팔로워", width: 72, number: true },
      { source: "구매 소비자", header: "구매 소비자", width: 60 },
      { source: "전환율", header: "전환율", width: 60 },
    ],
  },
  OPERATION: {
    title: "큐별 처리",
    caption: "이번 기간",
    nameHeader: "큐",
    name: "큐",
    bar: "처리",
    columns: [
      { source: "처리", header: "처리", width: 56 },
      { source: "평균 소요", header: "평균 소요", width: 90 },
      { source: "기한 초과", header: "기한 초과", width: 72 },
    ],
  },
};

/** COUNT 지표 단위 — 키를 모르면 「건」 */
export const COUNT_UNIT: Record<string, string> = {
  ACTIVE_CREATORS: "명",
  ACTIVE_BRANDS: "곳",
  BUYERS: "명",
  BUYERS_MEDIAN: "명",
  NEW_CONSUMERS: "명",
  CONSUMER_WITHDRAWALS: "명",
};

/** DAYS 지표 단위 — 오픈 승인 소요는 영업일 */
export const DAYS_UNIT: Record<string, string> = {
  OPEN_REVIEW_DAYS: "영업일",
};

/**
 * 증감을 %로 적는 COUNT 지표(시안: 주문 ▲ 8.1% · 진행한 공구 ▲ 33.3% · 구매 소비자 ▲ 7.6% …).
 * 나머지 COUNT는 분모가 작아 절대값(▲ 1명 · ▼ 1건)으로 적는다. 금액은 언제나 %.
 */
export const PERCENT_DELTA_KEYS = new Set([
  "ORDERS",
  "GROUP_BUYS_RUN",
  "SELLING_GROUP_BUYS",
  "BUYERS",
  "BUYERS_MEDIAN",
  "NEW_CONSUMERS",
  "PROCESSED",
]);

/** 수수료 수익 — 이름 옆 「예상」 배지(서버 라벨의 「(예상)」을 배지로 바꿔 그린다) */
export const ESTIMATED_KEYS = new Set(["FEE_REVENUE"]);

export const METRICS_COPY = {
  title: "운영 지표",
  metricHeader: "지표",
  deltaHeader: "증감",
  estimated: "예상",
} as const;
