/*
  어드민 홈 · 사이드바 배지 — 백엔드 `AdminHomeDto`(origin/main · 1017 설계서 6절)와 1:1.
  필드명 · nullable은 DTO 그대로다. 시각 필드 두 종류를 가른다(서버 JVM = UTC):
  - `asOf` · `metricsToday.asOf` · `Integration.since`는 now() 기반 이벤트 시각(UTC 벽시계) → parseServerDateTime
  - `ScheduleItem.time`은 공구 시작 · 종료 · 정산 확인 마감 · 조정 기한 같은 입력 · 기한 시각(KST 벽시계) → 그대로
*/

/** 연동 3종 — PG · DELIVERY_TRACKING · E_SIGN */
export type IntegrationKey = "PG" | "DELIVERY_TRACKING" | "E_SIGN";

export type IntegrationStatus =
  "OK" | "DEGRADED" | "DOWN" | "DISABLED" | "NOT_INTEGRATED";

export interface AdminHomeIntegration {
  key: IntegrationKey | string;
  label: string;
  status: IntegrationStatus | string;
  /** 장애 시작 시각(DEGRADED) — UTC 벽시계 */
  since: string | null;
  message: string | null;
  /** 영향받는 큐 — 배너 「배송 예외 확인」 */
  affectedQueues: Array<string>;
}

/** 급한 정도 — 선언 순서가 정렬 순서(서버가 정렬해 내린다) */
export type TodoUrgency =
  "FAILED" | "OVERDUE" | "EXECUTION_PENDING" | "DUE_SOON" | "WAITING";

/** 사이드바 메뉴 코드 */
export type TodoMenu =
  | "ONBOARDING"
  | "MEMBERS"
  | "CONTRACTS"
  | "GROUP_BUYS"
  | "TRANSACTIONS"
  | "SETTLEMENTS"
  | "CS"
  | "POSTS";

/**
 * 이동 대상 — REFUND · SETTLEMENT · INQUIRY · GROUP_BUY · SELLER_APPLICATION ·
 * CREATOR_APPLICATION · TAX_DOCUMENT · QUEUE(목록 필터)
 */
export type TodoTargetType =
  | "REFUND"
  | "SETTLEMENT"
  | "INQUIRY"
  | "GROUP_BUY"
  | "SELLER_APPLICATION"
  | "CREATOR_APPLICATION"
  | "TAX_DOCUMENT"
  | "QUEUE";

export interface AdminHomeTarget {
  type: TodoTargetType | string;
  id: number | null;
  /** QUEUE일 때 서버 기준 목록 경로 · 필터(예: `/group-buys?queue=OPEN_REVIEW`) — FE 경로가 아니다 */
  filter: string | null;
}

export interface AdminHomeTodoRow {
  urgency: TodoUrgency | string;
  /** 상태 배지 문구(「실패」 · 「D-1」 · 「대기」 …) */
  badge: string;
  /** 큐 코드(예: OPEN_REVIEW · CONTRACT_REVIEW) */
  queue: string;
  title: string;
  detail: string | null;
  menu: TodoMenu | string;
  /** 경과 — 가장 오래된 건 기준(「2일 경과」) */
  ageText: string | null;
  /** 기한 문구(「마감 10.23」 · 「+3시간」) */
  dueText: string | null;
  target: AdminHomeTarget;
  /** 이 행이 대표하는 건수 — 건별 행은 1 */
  count: number;
}

export interface AdminHomeTodo {
  /** 합계 = 사이드바 배지 합(회원 수 제외) */
  total: number;
  failed: number;
  overdue: number;
  /** 기한 임박 = 집행 대기 + D-1 */
  dueSoon: number;
  waiting: number;
  /** 오늘 처리 완료 — 운영팀 전체 · 처리 시각이 있는 큐만 */
  processedToday: number;
  note: string;
  rows: Array<AdminHomeTodoRow>;
}

export type ScheduleKind =
  | "GROUP_BUY_OPEN"
  | "GROUP_BUY_END"
  | "SETTLEMENT_PAYOUT"
  | "SETTLEMENT_REVIEW_DUE"
  | "ADJUSTMENT_DEADLINE"
  | "ADMIN_SUSPENSION_EXECUTE";

export interface AdminHomeScheduleItem {
  /** KST 벽시계 */
  time: string;
  kind: ScheduleKind | string;
  title: string;
  detail: string | null;
  target: AdminHomeTarget;
}

export type TodayMetricKey = "ORDERS" | "PAID_AMOUNT" | "SIGNUPS" | "CLAIMS";

export interface AdminHomeMetricItem {
  key: TodayMetricKey | string;
  label: string;
  /** 오늘 00:00 ~ 지금 */
  today: number;
  /** 어제 00:00 ~ 어제 이 시각 */
  yesterdaySameTime: number;
}

export interface AdminHomeMetricsToday {
  asOf: string;
  items: Array<AdminHomeMetricItem>;
}

/** GET /v1/admin/home */
export interface AdminHome {
  asOf: string;
  integrations: Array<AdminHomeIntegration>;
  todo: AdminHomeTodo;
  todaySchedule: Array<AdminHomeScheduleItem>;
  metricsToday: AdminHomeMetricsToday;
}

/** GET /v1/admin/badges — 홈 할 일과 같은 큐 계산 */
export interface AdminBadges {
  onboarding: {
    total: number;
    brand: number;
    creator: number;
    changeRequests: number;
  };
  members: {
    /** 탈퇴 승인 검토 */
    todo: number;
    brandCount: number;
    creatorCount: number;
    userCount: number;
  };
  /** 검토 대기 · 공구 생성 대기 · 만료 확인 · 재발송 요청 · 해지 요청 */
  contracts: number;
  groupBuys: number;
  transactions: number;
  settlements: number;
  cs: {
    /** 1:1 문의 답변 대기 + 상품 문의 삭제 요청 */
    total: number;
    inquiries: number;
  };
  posts: {
    /** 게시물 조치 필요 합(소통 스레드 제외) */
    total: number;
    general: number;
    /** 소통 스레드 안 읽은 메시지 합 — 할 일 합계에 들지 않는다 */
    threads: number;
  };
}
