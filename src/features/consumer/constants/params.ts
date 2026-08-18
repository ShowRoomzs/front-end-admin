import type {
  ConsumerListParams,
  ConsumerListSummary,
  ConsumerProvider,
  ConsumerSort,
  ConsumerTab,
} from "@/features/consumer/types/consumer";

export const CONSUMER_PAGE_SIZES = [20, 50, 100];

export const CONSUMER_INITIAL_PARAMS: ConsumerListParams = {
  page: 1,
  size: CONSUMER_PAGE_SIZES[0],
  tab: "ALL",
  keyword: "",
  providerType: null,
  sort: "RECENT_JOINED",
};

export const CONSUMER_EMPTY_SUMMARY: ConsumerListSummary = {
  total: 0,
  active: 0,
  suspended: 0,
  withdrawn: 0,
  newSuspendedIn30Days: null,
};

interface TabDef {
  label: string;
  value: ConsumerTab;
  countKey: keyof Omit<ConsumerListSummary, "newSuspendedIn30Days">;
}

export const CONSUMER_TABS: Array<TabDef> = [
  { label: "전체", value: "ALL", countKey: "total" },
  { label: "활성", value: "ACTIVE", countKey: "active" },
  { label: "정지", value: "SUSPENDED", countKey: "suspended" },
  { label: "탈퇴", value: "WITHDRAWN", countKey: "withdrawn" },
];

export const CONSUMER_SORT_OPTIONS: Array<{
  code: ConsumerSort;
  label: string;
}> = [
  { code: "RECENT_JOINED", label: "최근 가입순" },
  { code: "ORDER_COUNT_DESC", label: "누적 주문 많은 순" },
  { code: "MEMBER_NO", label: "회원번호순" },
];

/**
 * 가입 수단 표기 — **배지를 쓰지 않고 색점 + 이름**으로 그린다(§25-3).
 *
 * 가입 수단은 상태가 아니라 **속성**이다. 배지를 쓰면 상태색 체계(활성·정지·탈퇴)를
 * 침범해 한 행에서 어느 색이 상태인지 흐려진다. 색점은 각 사업자 식별색이며 어드민
 * 액센트와 무관하다 — 여기 색을 디자인 토큰으로 바꾸지 말 것.
 *
 * 시안이 정한 소비자 가입 수단은 4종이지만 서버 enum에는 `FACEBOOK`·`LOCAL`도 있어
 * 표기만 준비해 둔다(필터 셀렉트에는 올리지 않는다).
 */
export const CONSUMER_PROVIDER_LABELS: Record<ConsumerProvider, string> = {
  KAKAO: "카카오",
  NAVER: "네이버",
  APPLE: "Apple",
  GOOGLE: "Google",
  FACEBOOK: "Facebook",
  LOCAL: "이메일",
};

export const CONSUMER_PROVIDER_DOT_COLORS: Record<ConsumerProvider, string> = {
  KAKAO: "#FEE500",
  NAVER: "#03C75A",
  APPLE: "#1A1B1F",
  GOOGLE: "#C7C9D1",
  FACEBOOK: "#1877F2",
  LOCAL: "#A8ACB4",
};

/** 필터 셀렉트에 올리는 4종 — 시안 확정값 */
export const CONSUMER_PROVIDER_FILTERS: Array<ConsumerProvider> = [
  "KAKAO",
  "NAVER",
  "APPLE",
  "GOOGLE",
];
