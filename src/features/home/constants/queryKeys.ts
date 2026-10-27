export const HOME_QUERY_KEYS = {
  HOME: "admin-home",
  BADGES: "admin-badges",
} as const;

/** 홈 폴링 간격 — 백엔드 Docs 「FE 가 5분마다 다시 부릅니다」(1017 설계서 6-3 ⓔ) */
export const HOME_POLL_INTERVAL = 5 * 60_000;

/** 사이드바 배지 폴링 간격 — 메뉴별 요약 폴링(30초)과 맞춘다 */
export const BADGES_POLL_INTERVAL = 30_000;
