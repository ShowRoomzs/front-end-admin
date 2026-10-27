import type { DeviceType } from "@/features/influencerMember/types";

export const INFLUENCER_MEMBER_LIST_PATH = "/showroom/list";
export const BRAND_DETAIL_PATH = "/market/list";
export const SETTLEMENT_PATH = "/settlement/group-buy";
export const CONTRACT_PATH = "/contract";
export const CHANGE_REQUEST_PATH = "/market/change-requests";
/** 공구 게시물 모니터링 — 「게시물 검토 · 이력 보기 ↗」 */
export const GROUP_BUY_POST_MONITOR_PATH = "/monitoring/group-buy-posts";

export const INFLUENCER_MEMBER_QUERY_KEYS = {
  LIST: "adminInfluencerMemberList",
  DETAIL: "adminInfluencerMemberDetail",
  REASON_OPTIONS: "adminInfluencerReasonOptions",
  OVERVIEW: "adminInfluencerOverview",
  SETTLEMENTS: "adminInfluencerSettlements",
  CONTRACTS: "adminInfluencerContracts",
  CONNECTIONS: "adminInfluencerConnections",
  HISTORIES: "adminInfluencerHistories",
  MEMOS: "adminInfluencerMemos",
} as const;

/** 최근 정산 카드 건수(서버 기본 5) */
export const RECENT_SETTLEMENT_SIZE = 5;

/**
 * 최근 로그인 기기 — 서버 `DeviceType` 설명 그대로. 로그인 이력에 앱 / 스튜디오 서피스가 없어
 * 시안의 「iOS 앱」처럼 서피스까지는 적지 못한다(UNKNOWN은 적지 않는다).
 */
export const DEVICE_LABEL: Record<DeviceType, string | null> = {
  ANDROID: "안드로이드",
  IPHONE: "아이폰",
  DESKTOP_CHROME: "PC (크롬)",
  DESKTOP_EDGE: "PC (엣지)",
  UNKNOWN: null,
};
