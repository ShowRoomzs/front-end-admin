/*
  DEV 전용 목업 — 서비스가 `DEV_MOCK_ENABLED` 가드 뒤에서 동적 import 한다(배포 번들에 들어가지 않는다).
  시안 ui-admin-06d-exceptions rev.5 A2(배송 예외 탭) — 추적 정지 2건의 「선택 개방까지 N일 [정책값 미정]」.
  `stallChoice`는 서버 `ExceptionItem`에 아직 없다(백엔드 요청) — 서버가 생기면 이 파일을 지운다.
*/
import type {
  ExceptionItem,
  ExceptionListParams,
  ExceptionPage,
  ExceptionSummary,
} from "@/features/exception/types";

const AS_OF = "2026-09-19T02:30:00";

function stalled(overrides: Partial<ExceptionItem>): ExceptionItem {
  return {
    tab: "DELIVERY",
    kind: "TRACKING_STALLED",
    kindLabel: "추적 정지",
    targetNumber: "20260909-000151",
    subOrderNumber: "20260909-000151-01",
    orderId: 24151,
    deliveryGroupId: 2415101,
    claimId: null,
    marketId: 11,
    brandName: "퓨어네이처",
    dueAt: null,
    dueBasisLabel: null,
    basisAt: "2026-09-10T03:00:00",
    basisLabel: "집화 후 7일",
    elapsedHours: 199,
    elapsedBusinessDays: null,
    elapsedLabel: "8일 무갱신",
    overdue: true,
    noticeCount: null,
    lastNoticeAt: null,
    nextNoticeAt: null,
    actOnBehalfAvailable: false,
    nextStepLabel: null,
    nextStepNote: null,
    invoice: {
      carrier: "CJ",
      carrierLabel: "CJ대한통운",
      trackingNumber: "6512****2240",
    },
    handlerLabel: "소비자·브랜드가 택배사 조회",
    link: {
      type: "ORDER",
      orderId: 24151,
      deliveryGroupId: 2415101,
      claimId: null,
    },
    stallChoice: { state: "WAITING", daysUntilOpen: null, choiceLabel: null },
    ...overrides,
  };
}

const ROWS: Array<ExceptionItem> = [
  stalled({}),
  stalled({
    targetNumber: "20260911-000166",
    subOrderNumber: "20260911-000166-01",
    orderId: 24166,
    deliveryGroupId: 2416601,
    brandName: "글로우코스",
    basisAt: "2026-09-11T03:00:00",
    elapsedHours: 175,
    elapsedLabel: "7일 무갱신",
    invoice: {
      carrier: "LOTTE",
      carrierLabel: "롯데택배",
      trackingNumber: "2448****1102",
    },
    link: {
      type: "ORDER",
      orderId: 24166,
      deliveryGroupId: 2416601,
      claimId: null,
    },
  }),
];

export function mockExceptionPage(params: ExceptionListParams): ExceptionPage {
  const content = params.tab === "DELIVERY" ? ROWS : [];
  return {
    asOf: AS_OF,
    page: {
      content,
      pageInfo: {
        currentPage: 1,
        totalPages: 1,
        totalResults: content.length,
        limit: params.size,
        hasNext: false,
      },
    },
  };
}

export function mockExceptionSummary(): ExceptionSummary {
  return {
    asOf: AS_OF,
    tabCounts: { DELAY: 0, DELIVERY: 2 },
    kindCounts: {
      SHIP_OVERDUE: 0,
      INSPECT_OVERDUE: 0,
      RESHIP_DELAYED: 0,
      PICKUP_UNCONFIRMED: 0,
      TRACKING_STALLED: 2,
      RETURNING: 0,
      COLLECTION_UNSCANNED: 0,
    },
    actOnBehalfCount: 0,
    badge: 2,
    badgeScope: "ALL",
  };
}
