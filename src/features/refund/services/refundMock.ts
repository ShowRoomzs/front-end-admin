/*
  환불 관리 DEV 목업 — 백엔드 API가 생기면 이 파일째 지운다.

  시안(ui-admin-06c-refunds)의 표본 행을 그대로 담고, [집행]·[재시도]는 메모리 저장소를 바꿔
  행이 탭을 옮겨 가는 흐름을 보여 준다(새로고침하면 처음으로 돌아간다).
  완료 탭은 시안의 「38건 · PG 자동 36 · 운영자 사유 2」를 맞추려고 표본 5건 뒤에 33건을 더 만든다.

  ?mock= 시나리오(개발 서버 전용)
    empty       모든 탭이 비어 있다 — 빈 상태
    clawback    RFD-0918이 정산 확정 건이다 — M1 정산 줄에 클로백이 적힌다
    retry-fail  [재시도]가 다시 실패한다 — 행이 실패 탭에 남는다
*/
import type { PageInfo } from "@/common/types/page";
import { mockDelay, mockScenario } from "@/common/utils/devMock";
import type {
  RefundCancelTarget,
  RefundDetail,
  RefundExecuteRequest,
  RefundExecuteResponse,
  RefundListItem,
  RefundListParams,
  RefundListResponse,
  RefundRetryResponse,
  RefundStatus,
  RefundSummary,
} from "@/features/refund/types";

const OPERATOR_NAME = "김운영";
/** 시안 기준일 — 소비자 대기 일수를 이 시각으로 센다 */
const NOW = "2026-09-18T15:00:00+09:00";

interface MockRefund {
  item: RefundListItem;
  detail: RefundDetail;
  /** 이력 — 집행자 · 시각이 남는다(시안 M1 경고 문구). 이 화면에는 그리지 않는다 */
  history: Array<{ at: string; actor: string; action: string }>;
}

function ts(month: number, day: number, hour: number, minute: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `2026-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+09:00`;
}

function target(
  methodLabel: string,
  pgTransactionId: string,
  amount: number,
  partial = false
): RefundCancelTarget {
  return { methodLabel, pgTransactionId, amount, partial };
}

function build(
  item: RefundListItem,
  detail: Partial<RefundDetail> & Pick<RefundDetail, "originalPayment">
): MockRefund {
  return {
    item,
    detail: {
      refundId: item.refundId,
      refundNumber: item.refundNumber,
      orderNumber: item.orderNumber,
      routeLabel: item.routeLabel,
      routeDetail: item.routeDetail,
      source: item.source,
      amount: item.amount,
      enrollment: null,
      additionalPayment: null,
      additionalPaymentNote: null,
      settlement: { clawback: false, clawbackAmount: null },
      failure: null,
      autoRetry: null,
      ...detail,
    },
    history: [],
  };
}

function autoItem(
  id: number,
  base: Pick<
    RefundListItem,
    | "orderNumber"
    | "routeGroup"
    | "routeLabel"
    | "routeDetail"
    | "brandName"
    | "paymentMethod"
    | "paymentScope"
    | "amount"
    | "occurredAt"
  >
): RefundListItem {
  return {
    refundId: id,
    refundNumber: `RFD-${String(id).padStart(4, "0")}`,
    source: "PG_AUTO",
    status: "DONE",
    enrolledBy: null,
    executedBy: null,
    failureLabel: null,
    autoRetryCount: null,
    ...base,
  };
}

/** 시안 표본 7건 — 집행 대기 1 · 실패 1 · 완료 5 */
function sampleRows(): MockRefund[] {
  const pending = build(
    {
      refundId: 918,
      refundNumber: "RFD-0918",
      orderNumber: "ORD-24171",
      routeGroup: "OPERATOR",
      routeLabel: "반려 이의 인용",
      routeDetail: "CLM-3008",
      source: "OPERATOR",
      brandName: "글로우코스",
      paymentMethod: "카드",
      paymentScope: "ORIGINAL",
      amount: 27200,
      status: "PENDING",
      occurredAt: ts(9, 18, 14, 20),
      enrolledBy: OPERATOR_NAME,
      executedBy: null,
      failureLabel: null,
      autoRetryCount: null,
    },
    {
      enrollment: {
        enrolledBy: OPERATOR_NAME,
        enrolledAt: ts(9, 18, 14, 20),
        ground: "1:1 문의 #4527 사진상 배송 시점 오염으로 판단",
      },
      originalPayment: target("카드", "tosspay_9c41e0b2", 27200),
      additionalPaymentNote: "재발송비 결제 요청은 편입 시 취소됨",
    }
  );

  const failed = build(
    {
      refundId: 915,
      refundNumber: "RFD-0915",
      orderNumber: "ORD-24113",
      routeGroup: "CANCEL",
      routeLabel: "취소 요청 자동 승인",
      routeDetail: null,
      source: "PG_AUTO",
      brandName: "무드코스메틱",
      paymentMethod: "카카오페이",
      paymentScope: null,
      amount: 27200,
      status: "FAILED",
      occurredAt: ts(9, 16, 14, 31),
      enrolledBy: null,
      executedBy: null,
      failureLabel: "PG 응답 오류",
      autoRetryCount: 1,
    },
    {
      originalPayment: target("카카오페이", "kakaopay_7f20aa18", 27200),
      failure: {
        label: "PG 응답 오류",
        code: "PG_TIMEOUT",
        failedAt: ts(9, 16, 14, 31),
      },
      autoRetry: { count: 1, failedAt: ts(9, 16, 15, 31) },
    }
  );

  const done: MockRefund[] = [
    build(
      autoItem(914, {
        orderNumber: "ORD-24158",
        routeGroup: "CANCEL",
        routeLabel: "교환 재발송비",
        routeDetail: "교환 철회",
        brandName: "글로우코스",
        paymentMethod: "카카오페이",
        paymentScope: "ADDITIONAL",
        amount: 3000,
        occurredAt: ts(9, 15, 10, 12),
      }),
      { originalPayment: target("카카오페이", "kakaopay_3a90c1d4", 3000) }
    ),
    build(
      autoItem(912, {
        orderNumber: "ORD-24198",
        routeGroup: "RETURN_BACK",
        routeLabel: "반송 완료",
        routeDetail: null,
        brandName: "데일리랩",
        paymentMethod: "카드",
        paymentScope: "ORIGINAL",
        amount: 32000,
        occurredAt: ts(9, 16, 9, 5),
      }),
      { originalPayment: target("카드", "tosspay_51be77a0", 32000) }
    ),
    build(
      {
        ...autoItem(911, {
          orderNumber: "ORD-24201",
          routeGroup: "OPERATOR",
          routeLabel: "위해성 리콜",
          routeDetail: "공구 긴급 중단",
          brandName: "글로우코스",
          paymentMethod: "카드",
          paymentScope: "ORIGINAL",
          amount: 29200,
          occurredAt: ts(9, 17, 11, 40),
        }),
        source: "OPERATOR",
        executedBy: OPERATOR_NAME,
      },
      { originalPayment: target("카드", "tosspay_e208f6b3", 29200) }
    ),
    build(
      autoItem(908, {
        orderNumber: "ORD-24133",
        routeGroup: "RETURN",
        routeLabel: "반품 · 일부 반려",
        routeDetail: "CLM-3002",
        brandName: "데일리랩",
        paymentMethod: "카드",
        paymentScope: "ORIGINAL_PARTIAL",
        amount: 13000,
        occurredAt: ts(9, 8, 10, 2),
      }),
      { originalPayment: target("카드", "tosspay_8d3c2f19", 13000, true) }
    ),
    build(
      autoItem(906, {
        orderNumber: "ORD-24116",
        routeGroup: "CANCEL",
        routeLabel: "결제완료 소비자 취소",
        routeDetail: null,
        brandName: "글로우랩",
        paymentMethod: "카드",
        paymentScope: "ORIGINAL",
        amount: 51200,
        occurredAt: ts(9, 9, 8, 30),
      }),
      { originalPayment: target("카드", "tosspay_0b7a45ce", 51200) }
    ),
  ];

  return [pending, failed, ...done];
}

const AUTO_ROUTES: Array<
  Pick<RefundListItem, "routeGroup" | "routeLabel" | "routeDetail">
> = [
  {
    routeGroup: "CANCEL",
    routeLabel: "결제완료 소비자 취소",
    routeDetail: null,
  },
  {
    routeGroup: "CANCEL",
    routeLabel: "취소 요청 자동 승인",
    routeDetail: null,
  },
  { routeGroup: "CANCEL", routeLabel: "브랜드 직권 취소", routeDetail: null },
  { routeGroup: "RETURN", routeLabel: "반품 검수 통과", routeDetail: null },
  { routeGroup: "RETURN_BACK", routeLabel: "반송 완료", routeDetail: null },
];
const BRANDS = ["글로우코스", "데일리랩", "무드코스메틱", "글로우랩"];
const METHODS = ["카드", "카카오페이", "카드", "네이버페이"];

/** 완료 탭을 38건으로 채우는 가짜 과거 이력 — 표본보다 모두 오래됐다(최신순에서 표본이 위에 온다) */
function fillerRows(): MockRefund[] {
  const rows: MockRefund[] = [];
  const start = Date.UTC(2026, 8, 7, 1, 0); // 09.07 10:00 KST
  for (let i = 0; i < 33; i += 1) {
    const id = 905 - i;
    const when = new Date(start - i * 14 * 3600 * 1000);
    const kst = new Date(when.getTime() + 9 * 3600 * 1000);
    const occurredAt = ts(
      kst.getUTCMonth() + 1,
      kst.getUTCDate(),
      kst.getUTCHours(),
      kst.getUTCMinutes()
    );
    const amount = 8000 + ((i * 7919) % 90) * 700;
    const method = METHODS[i % METHODS.length];
    const base = autoItem(id, {
      ...AUTO_ROUTES[i % AUTO_ROUTES.length],
      orderNumber: `ORD-${24000 + id}`,
      brandName: BRANDS[i % BRANDS.length],
      paymentMethod: method,
      paymentScope: "ORIGINAL",
      amount,
      occurredAt,
    });
    // 운영자 사유 2건 중 나머지 1건(표본 RFD-0911 외)
    const item: RefundListItem =
      i === 10
        ? {
            ...base,
            source: "OPERATOR",
            routeGroup: "OPERATOR",
            routeLabel: "위해성 리콜",
            routeDetail: "공구 긴급 중단",
            executedBy: OPERATOR_NAME,
          }
        : base;
    rows.push(
      build(item, {
        originalPayment: target(
          method,
          `pg_${String(id).padStart(4, "0")}f${i}c9`,
          amount
        ),
      })
    );
  }
  return rows;
}

let store: MockRefund[] | null = null;
/**
 * 저장소를 만들 때의 시나리오를 붙들어 둔다 — 탭을 바꾸면 useParams가 주소의 쿼리를 새로 써서
 * `?mock=`이 사라지므로, 호출 시점마다 읽으면 시나리오가 도중에 풀린다.
 */
let scenario: string | null = null;

function getStore(): MockRefund[] {
  if (store) {
    return store;
  }
  scenario = mockScenario();
  if (scenario === "empty") {
    store = [];
    return store;
  }
  store = [...sampleRows(), ...fillerRows()];
  if (scenario === "clawback") {
    const pending = store.find((row) => row.item.refundId === 918);
    if (pending) {
      pending.detail.settlement = { clawback: true, clawbackAmount: 27200 };
    }
  }
  return store;
}

function findRow(refundId: number) {
  const row = getStore().find((entry) => entry.item.refundId === refundId);
  if (!row) {
    throw new Error("환불 건을 찾을 수 없습니다.");
  }
  return row;
}

function byTime(a: RefundListItem, b: RefundListItem) {
  return b.occurredAt.localeCompare(a.occurredAt);
}

function matches(row: MockRefund, params: RefundListParams) {
  const { item, detail } = row;
  if (item.status !== params.tab) {
    return false;
  }
  if (params.route && item.routeGroup !== params.route) {
    return false;
  }
  const keyword = params.keyword.trim().toLowerCase();
  if (!keyword) {
    return true;
  }
  return [
    item.refundNumber,
    item.orderNumber,
    detail.originalPayment.pgTransactionId,
    detail.additionalPayment?.pgTransactionId ?? "",
  ].some((field) => field.toLowerCase().includes(keyword));
}

function waitingDays(items: RefundListItem[]) {
  if (items.length === 0) {
    return null;
  }
  const oldest = items.reduce((min, item) =>
    item.occurredAt < min.occurredAt ? item : min
  );
  const diff = new Date(NOW).getTime() - new Date(oldest.occurredAt).getTime();
  return Math.max(0, Math.floor(diff / (24 * 3600 * 1000)));
}

export function mockList(params: RefundListParams) {
  const matched = getStore()
    .filter((row) => matches(row, params))
    .map((row) => row.item);
  matched.sort(
    params.sort === "AMOUNT_DESC"
      ? (a, b) => b.amount - a.amount || byTime(a, b)
      : byTime
  );

  const limit = Number(params.size) || 20;
  const totalPages = Math.max(1, Math.ceil(matched.length / limit));
  const currentPage = Math.min(
    Math.max(1, Number(params.page) || 1),
    totalPages
  );
  const pageInfo: PageInfo = {
    currentPage,
    totalPages,
    totalResults: matched.length,
    limit,
    hasNext: currentPage < totalPages,
  };
  const content = matched.slice((currentPage - 1) * limit, currentPage * limit);

  const isDone = params.tab === "DONE";
  const response: RefundListResponse = {
    content,
    pageInfo,
    summary: {
      count: matched.length,
      totalAmount: matched.reduce((sum, item) => sum + item.amount, 0),
      consumerWaitingDays:
        params.tab === "FAILED" ? waitingDays(matched) : null,
      periodLabel: isDone ? "최근 1개월" : null,
      pgAutoCount: isDone
        ? matched.filter((item) => item.source === "PG_AUTO").length
        : null,
      operatorCount: isDone
        ? matched.filter((item) => item.source === "OPERATOR").length
        : null,
    },
  };
  return mockDelay(response);
}

export function mockSummary() {
  const counts: Record<RefundStatus, number> = {
    PENDING: 0,
    FAILED: 0,
    DONE: 0,
  };
  getStore().forEach((row) => {
    counts[row.item.status] += 1;
  });
  const summary: RefundSummary = {
    tabCounts: counts,
    actionRequiredCount: counts.PENDING + counts.FAILED,
  };
  return mockDelay(summary, 120);
}

export function mockDetail(refundId: number) {
  return mockDelay(findRow(refundId).detail, 200);
}

export function mockExecute(refundId: number, body: RefundExecuteRequest) {
  const row = findRow(refundId);
  if (row.item.status !== "PENDING") {
    throw new Error("집행 대기 상태가 아닙니다.");
  }
  if (body.confirmedAmount !== row.item.amount) {
    throw new Error("환불액이 바뀌었습니다. 새로고침 후 다시 확인해 주세요.");
  }
  const at = new Date().toISOString();
  row.item = {
    ...row.item,
    status: "DONE",
    occurredAt: at,
    executedBy: OPERATOR_NAME,
  };
  row.history.push({ at, actor: OPERATOR_NAME, action: "환불 집행" });
  const response: RefundExecuteResponse = { refundId, status: "DONE" };
  return mockDelay(response, 500);
}

export function mockRetry(refundId: number) {
  const row = findRow(refundId);
  if (row.item.status !== "FAILED") {
    throw new Error("실패 상태가 아닙니다.");
  }
  const at = new Date().toISOString();
  if (scenario === "retry-fail") {
    row.history.push({ at, actor: OPERATOR_NAME, action: "재시도 실패" });
    const failed: RefundRetryResponse = {
      refundId,
      result: "FAILED",
      failureLabel: row.item.failureLabel,
    };
    return mockDelay(failed, 500);
  }
  row.item = {
    ...row.item,
    status: "DONE",
    occurredAt: at,
    failureLabel: null,
    autoRetryCount: null,
  };
  row.history.push({ at, actor: OPERATOR_NAME, action: "재시도 성공" });
  const response: RefundRetryResponse = {
    refundId,
    result: "SUCCEEDED",
    failureLabel: null,
  };
  return mockDelay(response, 500);
}
