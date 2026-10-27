import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import type {
  IntegrationKey,
  TodayMetricKey,
  TodoMenu,
  TodoUrgency,
} from "@/features/home/types";

/**
 * 급한 정도 → 배지 색(ui-admin-00-home rev.4 「급한 정도는 배지 색 + 정렬로만」).
 * 실패 = 위험 · 기한 초과 · 집행 대기 · 기한 임박 = 경고 · 대기 = 정보. 중립 회색은 종료 · 취소 전용이라 쓰지 않는다.
 */
export const URGENCY_VARIANT: Record<TodoUrgency, StatusBadgeVariant> = {
  FAILED: "danger",
  OVERDUE: "warning",
  EXECUTION_PENDING: "warning",
  DUE_SOON: "warning",
  WAITING: "info",
};

/** 「메뉴」 열 — 시안은 칸이 좁아 CS · 게시물 메뉴를 줄여 적는다 */
export const MENU_LABEL: Record<TodoMenu, string> = {
  ONBOARDING: "입점 관리",
  MEMBERS: "회원 관리",
  CONTRACTS: "계약 관리",
  GROUP_BUYS: "공구 관리",
  TRANSACTIONS: "거래 관리",
  SETTLEMENTS: "정산 관리",
  CS: "CS·콘텐츠",
  POSTS: "게시물·소통",
};

/**
 * 헤더 연동 배지 이름 — 시안 표기(서버 label은 택배 추적을 「택배 추적」으로 내린다).
 * 키를 모르는 연동이 오면 서버 label을 쓴다.
 */
export const INTEGRATION_LABEL: Record<IntegrationKey, string> = {
  PG: "PG",
  DELIVERY_TRACKING: "배송 추적",
  E_SIGN: "전자서명",
};

/** 헤더 배지 순서 — 시안 PG · 배송 추적 · 전자서명 */
export const INTEGRATION_ORDER: Array<IntegrationKey> = [
  "PG",
  "DELIVERY_TRACKING",
  "E_SIGN",
];

/** 오늘 지표 값 단위 — 결제 거래액은 시안처럼 단위 없이 숫자만 */
export const TODAY_METRIC_UNIT: Record<TodayMetricKey, string> = {
  ORDERS: "건",
  PAID_AMOUNT: "",
  SIGNUPS: "명",
  CLAIMS: "건",
};

/** 시안 문구 — 한 곳에 모은다 */
export const HOME_COPY = {
  title: "홈",
  integrationLead: "연동",
  todoRight: "급한 순 · 사이드바 배지 합",
  oldest: "가장 오래된 건",
  emptyTitle: "지금 처리할 일이 없습니다",
  emptyDesc: "새 건이 들어오면 급한 순서대로 여기에 나타납니다.",
  scheduleTitle: "오늘 일정",
  scheduleRight: "자동 실행 · 알고 있을 것",
  metricsTitle: "지표",
  metricsLink: "운영 지표 ›",
  metricsYesterday: "어제 같은 시각",
  /** H3 — 배송 추적 장애 배너(시안 그대로) */
  trackingBannerTitle: "배송 추적 연동 응답 지연",
} as const;
