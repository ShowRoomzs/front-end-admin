export const POST_QUERY_KEYS = {
  LIST: "adminPostList",
  /** 셸(GNB 배지)과 목록 탭이 같은 키를 쓴다 */
  SUMMARY: "adminPostSummary",
  DETAIL: "adminPostDetail",
  SUSPENSION_REASONS: "adminPostSuspensionReasons",
  POLICY_CLAUSES: "adminPostPolicyClauses",
} as const;

/** 조치 필요 배지 폴링 — 신고는 소비자가 아무 때나 넣는다 */
export const POST_SUMMARY_POLL_INTERVAL = 60_000;
