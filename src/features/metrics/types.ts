/*
  어드민 운영 지표 — 백엔드 `AdminMetricsDto`(origin/main · 1017 설계서 7절)와 1:1.
  시각 필드는 전부 UTC 순간(`…Z`) → parseServerDateTime. `asOf`는 now() 기반. `period` · `compare`의 from/to와
  `chart.points[].bucket`은 서버가 KST 날짜 경계(00:00)로 자른 뒤 UTC로 바꾼 값이다(10.01 00:00 KST =
  `2026-09-30T15:00:00Z` · TODAY의 `period.to`만 now()) — 날짜로 쓸 때 KST로 고정한다.
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
  /**
   * 비교 기간의 같은 지표(백엔드 58 5-32) — 같은 단위 버킷 · 현재 버킷 수만큼 · i번째가 `points[i]`와 짝.
   * 비교 기간이 짧으면 개수가 적을 수 있다(모자란 칸은 회색 막대를 비운다).
   */
  comparePoints: Array<MetricsPoint>;
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
