export const METRICS_QUERY_KEYS = {
  METRICS: "admin-metrics",
  TABS: "admin-metrics-tabs",
} as const;

/** 서버가 같은 기간 계산을 10분 캐시한다 — 그보다 자주 부를 이유가 없다 */
export const METRICS_STALE_TIME = 5 * 60_000;
