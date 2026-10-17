export const EXCEPTION_QUERY_KEYS = {
  LIST: "admin-exception-list",
  SUMMARY: "admin-exception-summary",
} as const;

/** 요약 폴링 간격 — 40 설계서 7-3 #2(30~60초) */
export const EXCEPTION_SUMMARY_POLL_INTERVAL = 60_000;
