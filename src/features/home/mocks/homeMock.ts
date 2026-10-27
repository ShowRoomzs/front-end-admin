/*
  어드민 홈 DEV 목업 — 백엔드 배포 후 삭제(`services/adminHomeService.ts`의 분기와 함께).
  값 · 문구는 시안 ui-admin-00-home rev.4 H1~H3를 서버 응답 모양(AdminHomeDto)으로 옮긴 것이다.
  서버 문구 규칙(AdminHomeQueueReader)을 따른다 — 경과 「N일 경과」 · 기한 「마감 MM.dd」 · 「+N시간」.
*/
import type {
  AdminBadges,
  AdminHome,
  AdminHomeIntegration,
  AdminHomeScheduleItem,
  AdminHomeTodoRow,
} from "@/features/home/types";

/** 서버 `LocalDateTime.now()`(UTC 벽시계) 모양 — 시간대 표기 없음 */
function utcNow() {
  return new Date().toISOString().slice(0, 19);
}

/** 오늘(KST 벽시계) HH:mm — 일정 시각은 입력 · 기한 시각이라 시간대 변환 없이 쓴다 */
function todayAt(time: string) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}T${time}:00`;
}

function queueTarget(filter: string) {
  return { type: "QUEUE", id: null, filter };
}

function waiting(
  queue: string,
  menu: string,
  title: string,
  detail: string | null,
  count: number,
  ageText: string,
  filter: string
): AdminHomeTodoRow {
  return {
    urgency: "WAITING",
    badge: "대기",
    queue,
    title,
    detail,
    menu,
    ageText,
    dueText: null,
    target: queueTarget(filter),
    count,
  };
}

const ROWS: Array<AdminHomeTodoRow> = [
  {
    urgency: "FAILED",
    badge: "실패",
    queue: "REFUND_FAILED",
    title: "환불 실패 · ORD-24091",
    detail: "카드 유효기간 만료 · 27,200원",
    menu: "TRANSACTIONS",
    ageText: "4일 경과",
    dueText: null,
    target: { type: "REFUND", id: 9101, filter: null },
    count: 1,
  },
  {
    urgency: "FAILED",
    badge: "실패",
    queue: "PAYOUT_FAILED",
    title: "분배 실패 · STL-2609-009",
    detail: "인플루언서 몫 259,930원 반환 · 예금주 불일치",
    menu: "SETTLEMENTS",
    ageText: "4일 경과",
    dueText: null,
    target: { type: "SETTLEMENT", id: 9, filter: null },
    count: 1,
  },
  {
    urgency: "OVERDUE",
    badge: "기한 초과",
    queue: "INQUIRY",
    title: "1:1 문의 · 배송",
    detail:
      "INQ-20261015-031 · 주문한 지 일주일이 지났는데 아직 배송이 시작되지 않았어요",
    menu: "CS",
    ageText: "1일 경과",
    dueText: "+2시간",
    target: { type: "INQUIRY", id: 31, filter: null },
    count: 1,
  },
  {
    urgency: "EXECUTION_PENDING",
    badge: "집행 대기",
    queue: "REFUND_EXECUTION",
    title: "사유 환불 집행 대기 · ORD-24072",
    detail: "구매확정 후 하자 · 27,200원",
    menu: "TRANSACTIONS",
    ageText: "1일 경과",
    dueText: null,
    target: { type: "REFUND", id: 9102, filter: null },
    count: 1,
  },
  {
    urgency: "DUE_SOON",
    badge: "D-1",
    queue: "OPEN_REVIEW",
    title: "오픈 승인 · 가을 톤업 크림 공구",
    detail: "글로우랩 × 하린_뷰티랩",
    menu: "GROUP_BUYS",
    ageText: "2일 경과",
    dueText: "마감 10.19",
    target: { type: "GROUP_BUY", id: 41, filter: null },
    count: 1,
  },
  {
    urgency: "DUE_SOON",
    badge: "D-1",
    queue: "BRAND_APPLICATION",
    title: "브랜드 입점 심사 · 루미에르랩",
    detail: "서류 3종",
    menu: "ONBOARDING",
    ageText: "2일 경과",
    dueText: "마감 10.19",
    target: { type: "SELLER_APPLICATION", id: 77, filter: null },
    count: 1,
  },
  waiting(
    "CLAWBACK_UNRECOVERABLE",
    "SETTLEMENTS",
    "차감 미회수",
    "CLW-0003 · 2,094원",
    1,
    "21일 경과",
    "/settlements?tab=CLAWBACK"
  ),
  waiting(
    "DELIVERY_EXCEPTION",
    "TRANSACTIONS",
    "배송 예외 확인",
    "추적 정지 2 · 집화 확인 필요 1 · 반송 1",
    4,
    "9일 경과",
    "/order-exceptions?tab=DELIVERY"
  ),
  waiting(
    "WITHDRAWAL",
    "MEMBERS",
    "탈퇴 승인 검토",
    null,
    2,
    "4일 경과",
    "/members/withdrawals"
  ),
  waiting(
    "CHANGE_REQUEST",
    "ONBOARDING",
    "변경 요청 검토",
    "브랜드 2 · 인플루언서 2",
    4,
    "3일 경과",
    "/change-requests?status=PENDING"
  ),
  waiting(
    "TAX_INVOICE_ISSUE",
    "SETTLEMENTS",
    "세금계산서 발행",
    "브랜드 3곳 · 홈택스 수동 · 11.10 마감",
    3,
    "2일 경과",
    "/settlements?tab=EVIDENCE"
  ),
  waiting(
    "TAX_INVOICE_VERIFY",
    "SETTLEMENTS",
    "세금계산서 대조",
    "인플루언서 사업자 승인번호",
    1,
    "1일 경과",
    "/settlements?tab=EVIDENCE"
  ),
  waiting(
    "PROCESSING_DELAY",
    "TRANSACTIONS",
    "처리 지연 확인",
    "발송 기한 경과 3",
    3,
    "2일 경과",
    "/order-exceptions?tab=DELAY"
  ),
  waiting(
    "CLAIM_DISPUTE",
    "TRANSACTIONS",
    "반려 이의 확인",
    null,
    1,
    "2일 경과",
    "/claims?dispute=OPEN"
  ),
  waiting(
    "INQUIRY",
    "CS",
    "1:1 문의(기한 내)",
    "기한 내 · 초과 1건은 위에",
    1,
    "3시간 경과",
    "/inquiries?status=WAITING"
  ),
  waiting(
    "POST_REPORT",
    "POSTS",
    "신고 게시물 검토",
    "일반 게시물 신고 누적",
    3,
    "1일 경과",
    "/posts?tab=REPORTED"
  ),
  waiting(
    "BRAND_APPLICATION",
    "ONBOARDING",
    "브랜드 입점 심사",
    "기한 임박 1건은 위에",
    3,
    "1일 경과",
    "/sellers/applications?status=PENDING"
  ),
  waiting(
    "CREATOR_APPLICATION",
    "ONBOARDING",
    "인플루언서 입점 심사",
    null,
    3,
    "1일 경과",
    "/creator/applications?status=PENDING"
  ),
  waiting(
    "CONTRACT_REVIEW",
    "CONTRACTS",
    "계약 검토 대기",
    "브랜드 제출 · 승인 또는 반려",
    2,
    "1일 경과",
    "/contracts?queue=REVIEW"
  ),
  waiting(
    "OPEN_REVIEW",
    "GROUP_BUYS",
    "오픈 승인",
    "기한 임박 1건은 위에",
    1,
    "1일 경과",
    "/group-buys?queue=OPEN_REVIEW"
  ),
  waiting(
    "SUSPEND_REQUEST",
    "GROUP_BUYS",
    "중단 요청",
    null,
    1,
    "1일 경과",
    "/group-buys?queue=SUSPEND_REQUEST"
  ),
  waiting(
    "EARLY_CLOSE_REQUEST",
    "GROUP_BUYS",
    "조기 마감 요청",
    null,
    1,
    "1일 경과",
    "/group-buys?queue=EARLY_CLOSE_REQUEST"
  ),
];

const SCHEDULE: Array<AdminHomeScheduleItem> = [
  {
    time: todayAt("10:00"),
    kind: "GROUP_BUY_OPEN",
    title: "공구 오픈 · 수분 크림 기획 공구",
    detail: "무드코스메틱 × 소연_쇼룸",
    target: { type: "GROUP_BUY", id: 52, filter: null },
  },
  {
    time: todayAt("10:00"),
    kind: "SETTLEMENT_PAYOUT",
    title: "정산 지급 2건",
    detail: "합계 4,712,800원",
    target: queueTarget("/settlements?tab=ALL"),
  },
  {
    time: todayAt("23:55"),
    kind: "GROUP_BUY_END",
    title: "공구 종료 · 데일리 선크림 앵콜 공구",
    detail: "데일리랩 × 하린_뷰티랩",
    target: { type: "GROUP_BUY", id: 38, filter: null },
  },
  {
    time: todayAt("23:59"),
    kind: "SETTLEMENT_REVIEW_DUE",
    title: "정산 확인 마감 · 글로우 크림 앵콜 공구",
    detail: "조정 요청이 없으면 자동 확정",
    target: { type: "SETTLEMENT", id: 7, filter: null },
  },
  {
    time: todayAt("23:59"),
    kind: "ADJUSTMENT_DEADLINE",
    title: "조정 협의 기한 · STL-2610-002",
    detail: "합의가 없으면 원래 금액으로 확정",
    target: { type: "SETTLEMENT", id: 2, filter: null },
  },
];

const INTEGRATIONS_OK: Array<AdminHomeIntegration> = [
  {
    key: "PG",
    label: "PG",
    status: "OK",
    since: null,
    message: null,
    affectedQueues: [],
  },
  {
    key: "DELIVERY_TRACKING",
    label: "택배 추적",
    status: "OK",
    since: null,
    message: null,
    affectedQueues: [],
  },
  {
    key: "E_SIGN",
    label: "전자서명",
    status: "NOT_INTEGRATED",
    since: null,
    message: "수동",
    affectedQueues: [],
  },
];

function sum(rows: Array<AdminHomeTodoRow>, urgency: Array<string>) {
  return rows
    .filter((row) => urgency.includes(row.urgency))
    .reduce((acc, row) => acc + row.count, 0);
}

export function mockAdminHome(scenario: string | null): AdminHome {
  const rows = scenario === "empty" ? [] : ROWS;
  const failed = sum(rows, ["FAILED"]);
  const overdue = sum(rows, ["OVERDUE"]);
  const dueSoon = sum(rows, ["EXECUTION_PENDING", "DUE_SOON"]);
  const waitingCount = sum(rows, ["WAITING"]);
  const asOf = utcNow();
  // H3 — 장애 시작은 지금보다 48분 앞(시안 「08:42부터」)
  const since = new Date(Date.now() - 48 * 60_000).toISOString().slice(0, 19);
  const integrations =
    scenario === "degraded"
      ? INTEGRATIONS_OK.map((integration) =>
          integration.key === "DELIVERY_TRACKING"
            ? {
                ...integration,
                status: "DEGRADED",
                since,
                message: "조회 실패",
                affectedQueues: ["배송 예외 확인"],
              }
            : integration
        )
      : INTEGRATIONS_OK;
  return {
    asOf,
    integrations,
    todo: {
      total: failed + overdue + dueSoon + waitingCount,
      failed,
      overdue,
      dueSoon,
      waiting: waitingCount,
      processedToday: scenario === "empty" ? 11 : 6,
      note: "처리 시각이 기록되는 큐만 합산 — 배송 예외 · 차감 미회수는 빠진다",
      rows,
    },
    todaySchedule: SCHEDULE,
    metricsToday: {
      asOf,
      items: [
        { key: "ORDERS", label: "주문", today: 23, yesterdaySameTime: 19 },
        {
          key: "PAID_AMOUNT",
          label: "결제 거래액",
          today: 1_012_000,
          yesterdaySameTime: 846_000,
        },
        { key: "SIGNUPS", label: "신규 가입", today: 12, yesterdaySameTime: 9 },
        {
          key: "CLAIMS",
          label: "반품·교환 접수",
          today: 2,
          yesterdaySameTime: 1,
        },
      ],
    },
  };
}

export function mockAdminBadges(scenario: string | null): AdminBadges {
  const empty = scenario === "empty";
  const n = (value: number) => (empty ? 0 : value);
  return {
    onboarding: {
      total: n(11),
      brand: n(4),
      creator: n(3),
      changeRequests: n(4),
    },
    members: {
      todo: n(2),
      brandCount: 8,
      creatorCount: 18,
      userCount: 2340,
    },
    contracts: n(2),
    groupBuys: n(4),
    transactions: n(10),
    settlements: n(6),
    cs: { total: n(2), inquiries: n(2) },
    posts: { total: n(3), general: n(3), threads: n(2) },
  };
}
