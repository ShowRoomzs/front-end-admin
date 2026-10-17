import {
  ApiNotReadyError,
  DEV_MOCK_ENABLED,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock";
import type {
  DelayItem,
  DeliveryItem,
  ExceptionListParams,
  ExceptionListResponse,
  ExceptionRow,
  ExceptionSummary,
} from "@/features/exception/types";

/*
  예외 관리 서비스 — **백엔드 API가 아직 없다.**
  개발 서버에서만 아래 목업(시안 ui-admin-06d의 샘플 행)으로 답하고, 배포본은 `ApiNotReadyError`를
  던져 화면이 「준비 중」을 띄우게 한다(가짜 거래가 운영자에게 보이면 안 된다).
  API가 생기면 각 함수의 본문만 바꾼다 — 필요한 엔드포인트는 함수마다 적어 둔다.

  `?mock=` 시나리오(개발 서버 전용):
    empty — 두 탭 모두 0건(빈 상태)
    many  — 처리 지연 47건 · 배송 예외 38건(페이지네이션·긴 목록)
    error — 목록 조회 실패(오류 상태)
*/

const FEATURE = "예외 관리";

/*
  시나리오는 처음 읽은 값을 붙들어 둔다 — 탭·검색을 바꾸면 `useParams`가 주소의 쿼리를 다시 써서
  `?mock=`이 사라지는데, 그때 시나리오가 풀리면 화면이 갑자기 기본 데이터로 돌아가기 때문이다.
*/
let cachedScenario: string | null | undefined;
function scenario() {
  if (cachedScenario === undefined) {
    cachedScenario = mockScenario();
  }
  return cachedScenario;
}

/** 시안 A1 — 기준 시각 09.19 11:30 */
const SAMPLE_DELAYS: DelayItem[] = [
  {
    tab: "DELAY",
    id: "delay-ORD-24190",
    targetKind: "ORDER",
    targetNo: "ORD-24190",
    delayType: "SHIPPING_OVERDUE",
    brandName: "데일리랩",
    deadlineAt: "2026-09-16T23:59:00+09:00",
    deadlineBasis: null,
    elapsedBusinessDays: 3,
    notifyCount: 3,
    proxyAvailable: true,
    nextNotifyRound: null,
    nextNotifyAt: null,
  },
  {
    tab: "DELAY",
    id: "delay-CLM-3015",
    targetKind: "CLAIM",
    targetNo: "CLM-3015",
    delayType: "INSPECTION_OVERDUE",
    brandName: "데일리랩",
    deadlineAt: "2026-09-16T23:59:00+09:00",
    deadlineBasis: "입고+2",
    elapsedBusinessDays: 1,
    notifyCount: 1,
    proxyAvailable: false,
    nextNotifyRound: 2,
    nextNotifyAt: "2026-09-19T09:00:00+09:00",
  },
  {
    tab: "DELAY",
    id: "delay-ORD-24139",
    targetKind: "ORDER",
    targetNo: "ORD-24139",
    delayType: "SHIPPING_OVERDUE",
    brandName: "퓨어랩",
    deadlineAt: "2026-09-17T23:59:00+09:00",
    deadlineBasis: null,
    elapsedBusinessDays: 1,
    notifyCount: 1,
    proxyAvailable: false,
    nextNotifyRound: 2,
    nextNotifyAt: "2026-09-19T09:00:00+09:00",
  },
];

/** 시안 A2 */
const SAMPLE_DELIVERIES: DeliveryItem[] = [
  {
    tab: "DELIVERY",
    id: "delivery-ORD-24151",
    orderNo: "ORD-24151",
    exceptionType: "TRACKING_STALLED",
    brandName: "퓨어네이처",
    carrierName: "CJ대한통운",
    trackingNoMasked: "6512****2240",
    elapsedHours: 8 * 24,
  },
  {
    tab: "DELIVERY",
    id: "delivery-ORD-24166",
    orderNo: "ORD-24166",
    exceptionType: "TRACKING_STALLED",
    brandName: "글로우코스",
    carrierName: "롯데택배",
    trackingNoMasked: "2448****1102",
    elapsedHours: 7 * 24,
  },
  {
    tab: "DELIVERY",
    id: "delivery-ORD-24198",
    orderNo: "ORD-24198",
    exceptionType: "RETURNING",
    brandName: "데일리랩",
    carrierName: "CJ대한통운",
    trackingNoMasked: "6512****7731",
    elapsedHours: 4 * 24,
  },
  {
    tab: "DELIVERY",
    id: "delivery-ORD-24195",
    orderNo: "ORD-24195",
    exceptionType: "PICKUP_UNCONFIRMED",
    brandName: "글로우코스",
    carrierName: "CJ대한통운",
    trackingNoMasked: "6512****5508",
    elapsedHours: 26,
  },
];

const MANY_BRANDS = ["데일리랩", "퓨어랩", "퓨어네이처", "글로우코스"];

/** many 시나리오 — 샘플 뒤에 합성 행을 붙여 긴 목록을 만든다 */
function manyDelays(): DelayItem[] {
  const extra = Array.from({ length: 44 }, (_, index): DelayItem => {
    const isClaim = index % 5 === 0;
    const no = 24000 + index;
    return {
      tab: "DELAY",
      id: `delay-many-${index}`,
      targetKind: isClaim ? "CLAIM" : "ORDER",
      targetNo: isClaim ? `CLM-${3100 + index}` : `ORD-${no}`,
      delayType: isClaim
        ? "INSPECTION_OVERDUE"
        : index % 7 === 1
          ? "RESHIP_OVERDUE"
          : "SHIPPING_OVERDUE",
      brandName: MANY_BRANDS[index % MANY_BRANDS.length],
      deadlineAt: "2026-09-15T23:59:00+09:00",
      deadlineBasis: isClaim ? "입고+2" : null,
      elapsedBusinessDays: 1 + (index % 4),
      notifyCount: 1 + (index % 3),
      proxyAvailable: index % 3 === 2,
      nextNotifyRound: index % 3 === 2 ? null : 2,
      nextNotifyAt: index % 3 === 2 ? null : "2026-09-19T09:00:00+09:00",
    };
  });
  return [...SAMPLE_DELAYS, ...extra];
}

function manyDeliveries(): DeliveryItem[] {
  const types = [
    "PICKUP_UNCONFIRMED",
    "TRACKING_STALLED",
    "RETURNING",
    "RETURN_INVOICE_UNTRACKED",
  ] as const;
  const extra = Array.from({ length: 34 }, (_, index): DeliveryItem => {
    const type = types[index % types.length];
    return {
      tab: "DELIVERY",
      id: `delivery-many-${index}`,
      orderNo: `ORD-${23900 + index}`,
      exceptionType: type,
      brandName: MANY_BRANDS[index % MANY_BRANDS.length],
      carrierName: index % 2 === 0 ? "CJ대한통운" : "롯데택배",
      trackingNoMasked: `6512****${String(1000 + index * 37).slice(-4)}`,
      elapsedHours: type === "PICKUP_UNCONFIRMED" ? 25 + index : 96 + index * 3,
    };
  });
  return [...SAMPLE_DELIVERIES, ...extra];
}

function source(): { delays: DelayItem[]; deliveries: DeliveryItem[] } {
  switch (scenario()) {
    case "empty":
      return { delays: [], deliveries: [] };
    case "many":
      return { delays: manyDelays(), deliveries: manyDeliveries() };
    default:
      return { delays: SAMPLE_DELAYS, deliveries: SAMPLE_DELIVERIES };
  }
}

/** 시안 정렬 「경과 오래된순」 — 영업일(지연)·시간(배송) 모두 큰 값이 먼저. 같으면 입력 순서 유지 */
function elapsedOf(row: ExceptionRow) {
  return row.tab === "DELAY" ? row.elapsedBusinessDays : row.elapsedHours;
}

function typeOf(row: ExceptionRow) {
  return row.tab === "DELAY" ? row.delayType : row.exceptionType;
}

function searchText(row: ExceptionRow) {
  const no = row.tab === "DELAY" ? row.targetNo : row.orderNo;
  return `${no} ${row.brandName}`.toLowerCase();
}

export const exceptionService = {
  /**
   * GET /admin/exceptions?tab&type&keyword&sort&page&size — 탭·유형·검색어를 서버가 거른다.
   * 응답: PageResponse + `proxyAvailableCount`(현재 조건 안의 대행 가능 건수).
   */
  getList: async (
    params: ExceptionListParams
  ): Promise<ExceptionListResponse> => {
    if (!DEV_MOCK_ENABLED) {
      throw new ApiNotReadyError(FEATURE);
    }
    if (scenario() === "error") {
      await mockDelay(null);
      throw new Error("목업 오류 시나리오");
    }

    const { delays, deliveries } = source();
    const rows: ExceptionRow[] = params.tab === "DELAY" ? delays : deliveries;
    const keyword = params.keyword.trim().toLowerCase();

    const filtered = rows
      .filter((row) => !params.type || typeOf(row) === params.type)
      .filter((row) => !keyword || searchText(row).includes(keyword))
      .map((row, index) => ({ row, index }))
      .sort((a, b) => elapsedOf(b.row) - elapsedOf(a.row) || a.index - b.index)
      .map(({ row }) => row);

    // useParams는 주소에서 읽은 값을 문자열로 돌려준다 — 숫자로 바로잡는다
    const size = Number(params.size) || 20;
    const totalResults = filtered.length;
    const totalPages = Math.ceil(totalResults / size);
    const currentPage = Math.min(
      Math.max(Number(params.page) || 1, 1),
      totalPages || 1
    );
    const content = filtered.slice(
      (currentPage - 1) * size,
      currentPage * size
    );

    return mockDelay({
      content,
      pageInfo: {
        currentPage,
        totalPages,
        totalResults,
        limit: size,
        hasNext: currentPage < totalPages,
      },
      proxyAvailableCount: filtered.filter(
        (row) => row.tab === "DELAY" && row.proxyAvailable
      ).length,
    });
  },

  /** GET /admin/exceptions/summary — 탭 카운트 · 유형별 건수(드롭다운) */
  getSummary: async (): Promise<ExceptionSummary> => {
    if (!DEV_MOCK_ENABLED) {
      throw new ApiNotReadyError(FEATURE);
    }

    const { delays, deliveries } = source();
    const countBy = <T extends ExceptionRow>(rows: T[], type: string) =>
      rows.filter((row) => typeOf(row) === type).length;

    return mockDelay({
      tabCounts: { DELAY: delays.length, DELIVERY: deliveries.length },
      delayTypeCounts: {
        SHIPPING_OVERDUE: countBy(delays, "SHIPPING_OVERDUE"),
        INSPECTION_OVERDUE: countBy(delays, "INSPECTION_OVERDUE"),
        RESHIP_OVERDUE: countBy(delays, "RESHIP_OVERDUE"),
      },
      deliveryTypeCounts: {
        PICKUP_UNCONFIRMED: countBy(deliveries, "PICKUP_UNCONFIRMED"),
        TRACKING_STALLED: countBy(deliveries, "TRACKING_STALLED"),
        RETURNING: countBy(deliveries, "RETURNING"),
        RETURN_INVOICE_UNTRACKED: countBy(
          deliveries,
          "RETURN_INVOICE_UNTRACKED"
        ),
      },
    });
  },
};
