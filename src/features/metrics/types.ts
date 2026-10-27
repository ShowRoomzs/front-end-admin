/*
  어드민 운영 지표 — 백엔드 `AdminMetricsDto`(origin/main · 1017 설계서 7절)와 1:1.
  시각 필드: `asOf`는 now() 기반(UTC 벽시계) → parseServerDateTime. `period` · `compare`의 from/to와
  `chart.points[].bucket`은 서버가 날짜 경계(00:00)로 자른 값이라 벽시계 그대로 읽는다(TODAY의 `period.to`만 now()).
*/

export type MetricsPreset = "TODAY" | "D7" | "M1" | "M6" | "CUSTOM";

export type MetricsTab =
  "CORE" | "SUPPLY" | "GROUP_BUY" | "DEMAND" | "OPERATION";

export type MetricsUnit = "HOUR" | "DAY" | "WEEK" | "MONTH";

export type MetricValueType =
  "COUNT" | "AMOUNT" | "RATE" | "RATIO" | "DAYS" | "HOURS";

/** 증감 판정 — 지표 방향(betterWhen)으로 서버가 매긴다 */
export type DeltaKind = "GOOD" | "BAD" | "NEUTRAL";

export interface MetricsPeriod {
  /** 시작(포함) */
  from: string;
  /** 끝(제외) — 오늘 00:00(TODAY는 지금) */
  to: string;
  /** 예: 「10.15 ~ 10.21 (7일)」 */
  label: string;
}

export interface MetricsPoint {
  /** 버킷 시작 */
  bucket: string;
  /** 「10.15」 · 「9시」 · 「10.13~」 · 「2026.10」 */
  label: string;
  value: number;
}

export interface MetricsChart {
  metricKey: string;
  label: string;
  unit: MetricsUnit | string;
  total: number;
  /** 비교 기간 합계 대비 증감(절대값) */
  delta: number;
  points: Array<MetricsPoint>;
}

export interface MetricsRow {
  key: string;
  label: string;
  /** 지표 이름 아래 보조 설명 한 줄 */
  note: string;
  valueType: MetricValueType | string;
  /** 계산할 수 없으면 null(분모 0) */
  current: number | null;
  previous: number | null;
  /** 증감 — 비율은 %p */
  delta: number | null;
  deltaKind: DeltaKind | string;
  /** 비율 지표의 분자/분모(「4/6」) */
  currentCount: string | null;
  previousCount: string | null;
  /** 값을 나눠 적는 지표(신규 입점 「1곳 · 3명」) — 있으면 값 칸에 숫자 대신 쓴다 */
  currentBreakdown: string | null;
  previousBreakdown: string | null;
}

export interface MetricsBreakdown {
  title: string;
  columns: Array<string>;
  rows: Array<Array<string>>;
}

/** GET /v1/admin/metrics */
export interface AdminMetrics {
  /** 적용된 프리셋 — 요청에서 생략하면 M1 */
  preset: MetricsPreset | string;
  tab: MetricsTab | string;
  period: MetricsPeriod;
  compare: MetricsPeriod;
  chart: MetricsChart;
  /** 핵심 탭만 — 4칸 */
  cards: Array<MetricsRow> | null;
  rows: Array<MetricsRow>;
  breakdown: MetricsBreakdown;
  asOf: string;
}

/** GET /v1/admin/metrics/tabs */
export interface MetricsTabBadge {
  tab: MetricsTab | string;
  label: string;
  /** 나빠진 지표 수 — 0이면 배지 없음 */
  worsenedCount: number;
}

/** 기간 파라미터 — CUSTOM일 때만 from · to(yyyy-MM-dd · 포함 · 최대 1년) */
export interface MetricsPeriodParams {
  preset: MetricsPreset;
  from?: string;
  to?: string;
}

export interface MetricsQueryParams extends MetricsPeriodParams {
  tab: MetricsTab;
}
