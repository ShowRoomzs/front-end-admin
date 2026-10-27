export const BRAND_MEMBER_LIST_PATH = "/market/list";

export const BRAND_MEMBER_QUERY_KEYS = {
  LIST: "adminBrandMemberList",
  DETAIL: "adminBrandMemberDetail",
  REASON_OPTIONS: "adminBrandReasonOptions",
  HISTORIES: "adminBrandHistories",
  MEMOS: "adminBrandMemos",
  CONNECTED_CREATORS: "adminBrandConnectedCreators",
  RECENT_INQUIRIES: "adminBrandRecentInquiries",
} as const;

/** 레일 「진행 중」 칩 → 이동할 화면(서버 `target`) */
export const BRAND_CHIP_PATHS = {
  ORDERS: "/order/list",
  CLAIMS: "/order/claim",
  PRODUCT_INQUIRIES: "/support/product-inquiry",
  THREAD: "/monitoring/threads",
  SETTLEMENTS: "/settlement/group-buy",
} as const;

export const INFLUENCER_DETAIL_PATH = "/showroom/list";
export const CONTRACT_PATH = "/contract";
export const PRODUCT_PATH = "/product/list";
export const CHANGE_REQUEST_PATH = "/market/change-requests";
export const INQUIRY_PATH = "/support/inquiry";
