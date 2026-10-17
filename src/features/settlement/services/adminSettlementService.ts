import type { PageResponse } from "@/common/types/page";
import {
  ApiNotReadyError,
  DEV_MOCK_ENABLED,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock";
import {
  INVOICE_CHECK_OPTIONS,
  SETTLEMENT_NO_PREFIX,
} from "@/features/settlement/constants/params";
import {
  MOCK_OPERATOR,
  type MockRecord,
  addBusinessDays,
  buildMockStore,
  distributionOf,
} from "@/features/settlement/services/settlementMock";
import type {
  BrandInvoicePayload,
  Clawback,
  ClawbackListResponse,
  DetailNavParams,
  EvidenceListResponse,
  EvidenceTask,
  InvoiceCheckResult,
  RedistributePayload,
  SettlementDetail,
  SettlementListItem,
  SettlementListParams,
  SettlementListResponse,
  SettlementSort,
  SettlementStatus,
  SettlementSummary,
  SettlementTab,
} from "@/features/settlement/types";
import dayjs from "dayjs";

/**
 * 어드민 정산 관리 — 공구 정산(ui-admin-07a · 07b).
 *
 * ⚠️ 백엔드에 어드민 정산 API가 없다(`AdminGroupBuyController`의 `settlement/confirm`은 빈 구현이고
 * 폐기된 「운영자 확정」 흐름이라 쓰지 않는다). 개발 서버에서만 목업으로 채우고 배포본에서는 화면이
 * 「준비 중」을 띄운다 — 가짜 정산 금액을 운영자에게 보이면 안 된다. API가 생기면 아래 함수 본문만
 * 바꾼다. 예상 경로(제안):
 *   GET  /v1/admin/settlements · /summary · /evidence-tasks · /clawbacks · /{id}
 *   POST /v1/admin/settlements/{id}/redistribute · /account-check-request
 *   POST /v1/admin/settlements/{id}/influencer-invoice/check · /brand-invoice(multipart)
 *   GET  /v1/admin/settlements/{id}/statement(xlsx) · /withholding-report?month=
 *
 * 목업 시나리오(개발 서버 · 주소에 `?mock=`):
 *   (없음)                     시안 더미 — 9건 · 증빙 5 · 차감 3 · GNB 6
 *   settlement-empty           모든 탭 빈 상태
 *   settlement-evidence-done   증빙 처리 완료 — 07b D3처럼 보류 조건 없는 지급 예정, 증빙 탭 비어 있음
 *   settlement-payout-stop     STL-2609-014 브랜드 계정 정지 연동 지급 정지(§41-5 · 07b 표시만)
 * 재분배 · 계좌 확인 요청 · 승인번호 대조 · 발행본 등록은 메모리 안에서만 바뀐다(새로고침하면 처음으로).
 */

let store: ReturnType<typeof buildMockStore> | null = null;
let storeScenario: string | null = null;

function source() {
  const scenario = mockScenario();
  if (!store || storeScenario !== scenario) {
    store = buildMockStore(scenario);
    storeScenario = scenario;
  }
  return store;
}

function notReady(): never {
  throw new ApiNotReadyError("정산 관리");
}

const SETTLEMENT_TAB_STATUS: Partial<Record<SettlementTab, SettlementStatus>> =
  {
    CHECKING: "CHECKING",
    ADJUSTING: "ADJUSTING",
    FAILED: "FAILED",
  };

/** 합계 행에 넣는 상태 — 정산 확인 중 · 조정 협의는 금액이 바뀔 수 있어 뺀다 */
const TOTAL_STATUSES: Array<SettlementStatus> = ["SCHEDULED", "PAID", "FAILED"];

function matchesKeyword(keyword: string, fields: Array<string>): boolean {
  const query = keyword.trim().toLowerCase();
  if (!query) return true;
  if (query.toUpperCase().startsWith(SETTLEMENT_NO_PREFIX)) {
    // 정산번호 축 — 번호 필드만 본다
    return fields
      .filter((field) => field.toUpperCase().startsWith(SETTLEMENT_NO_PREFIX))
      .some((field) => field.toLowerCase().includes(query));
  }
  return fields.some((field) => field.toLowerCase().includes(query));
}

function paginate<T>(
  items: Array<T>,
  params: { page: number; size: number }
): PageResponse<T> {
  const page = Math.max(1, Number(params.page) || 1);
  const size = Number(params.size) || 20;
  const totalResults = items.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / size));
  return {
    content: items.slice((page - 1) * size, page * size),
    pageInfo: {
      currentPage: page,
      totalPages,
      totalResults,
      limit: size,
      hasNext: page < totalPages,
    },
  };
}

function toListItem(record: MockRecord): SettlementListItem {
  return {
    settlementId: record.settlementId,
    settlementNo: record.settlementNo,
    groupBuyTitle: record.groupBuyTitle,
    brandName: record.brandName,
    showroomName: record.showroomName,
    influencerBusiness: record.influencerBusiness,
    periodStart: record.periodStart,
    periodEnd: record.periodEnd,
    confirmedSales: record.confirmedSales,
    brandPayout: record.brandPayout,
    influencerPayout: record.influencerPayout,
    status: record.status,
    schedule: record.schedule,
  };
}

function sortRecords(
  records: Array<MockRecord>,
  sort: SettlementSort
): Array<MockRecord> {
  return [...records].sort((a, b) => {
    switch (sort) {
      case "SALES_DESC":
        return b.confirmedSales - a.confirmedSales;
      case "CHECK_DUE_ASC":
      case "AGREE_DUE_ASC":
        return a.schedule.date.localeCompare(b.schedule.date);
      case "ELAPSED_DESC":
        return (b.failure?.elapsedDays ?? 0) - (a.failure?.elapsedDays ?? 0);
      default:
        return b.schedule.date.localeCompare(a.schedule.date);
    }
  });
}

function filterSettlements(params: {
  tab?: string;
  keyword?: string;
  sort?: string;
}): Array<MockRecord> {
  const tab = (params.tab ?? "ALL") as SettlementTab;
  const status = SETTLEMENT_TAB_STATUS[tab];
  const records = source().records.filter(
    (record) =>
      (!status || record.status === status) &&
      matchesKeyword(params.keyword ?? "", [
        record.settlementNo,
        record.groupBuyTitle,
        record.brandName,
        record.showroomName,
      ])
  );
  return sortRecords(
    records,
    (params.sort as SettlementSort | undefined) ?? "SCHEDULE_DESC"
  );
}

/** 증빙 처리 항목 — 상세의 증빙 상태에서 만든다(한 원천이라 대조·등록하면 목록에서도 빠진다) */
function evidenceTasks(): Array<EvidenceTask> {
  const tasks: Array<EvidenceTask> = [];
  for (const record of source().records) {
    const common = {
      settlementId: record.settlementId,
      settlementNo: record.settlementNo,
      groupBuyTitle: record.groupBuyTitle,
    };
    record.evidence.forEach((item, index) => {
      const taskId = `${record.settlementId}-${index}`;
      if (
        item.kind === "INFLUENCER_INVOICE" &&
        item.state === "CHECK_PENDING"
      ) {
        tasks.push({
          ...common,
          taskId,
          targetName: record.showroomName,
          targetBusiness: true,
          type: "INVOICE_CHECK",
          dateKind: "INPUT",
          date: item.inputAt,
          statusLabel: "대조 대기",
          statusTone: "INFO",
          payoutHold: true,
          operatorAction: true,
        });
      }
      if (item.kind === "INFLUENCER_INVOICE" && item.state === "REJECTED") {
        tasks.push({
          ...common,
          taskId,
          targetName: record.showroomName,
          targetBusiness: true,
          type: "INVOICE_CHECK",
          dateKind: "INPUT",
          date: item.inputAt,
          statusLabel: "반려 · 재입력 대기",
          statusTone: "NEUTRAL",
          payoutHold: true,
          operatorAction: false,
        });
      }
      if (item.kind === "BRAND_INVOICE" && item.state === "ISSUE_PENDING") {
        tasks.push({
          ...common,
          taskId,
          targetName: record.brandName,
          targetBusiness: null,
          type: "BRAND_INVOICE",
          dateKind: "DUE",
          date: item.dueAt,
          statusLabel: "발행 대기",
          statusTone: "NEUTRAL",
          payoutHold: false,
          operatorAction: true,
        });
      }
      if (item.kind === "WITHHOLDING_RECEIPT" && item.state === "RRN_MISSING") {
        tasks.push({
          ...common,
          taskId,
          targetName: record.showroomName,
          targetBusiness: false,
          type: "RRN_MISSING",
          dateKind: null,
          date: null,
          statusLabel: "인플루언서 대기",
          statusTone: "NEUTRAL",
          payoutHold: true,
          operatorAction: false,
        });
      }
    });
  }
  return tasks;
}

const TASK_TYPE_ORDER = ["INVOICE_CHECK", "BRAND_INVOICE", "RRN_MISSING"];

function sortTasks(tasks: Array<EvidenceTask>, sort: SettlementSort) {
  const byDate = (a: EvidenceTask, b: EvidenceTask) => {
    if (!a.date || !b.date) return a.date ? -1 : b.date ? 1 : 0;
    return a.date.localeCompare(b.date);
  };
  return [...tasks].sort((a, b) =>
    sort === "TASK_TYPE"
      ? TASK_TYPE_ORDER.indexOf(a.type) - TASK_TYPE_ORDER.indexOf(b.type) ||
        byDate(a, b)
      : byDate(a, b)
  );
}

function unrecoveredAmount(clawback: Clawback): number {
  return (
    (clawback.brand.state === "UNRECOVERED" ? clawback.brand.amount : 0) +
    (clawback.reward.state === "UNRECOVERED" ? clawback.reward.amount : 0)
  );
}

function findRecord(settlementId: number): MockRecord {
  const record = source().records.find(
    (item) => item.settlementId === settlementId
  );
  if (!record) throw new Error("NOT_FOUND");
  return record;
}

function pushHistory(
  record: MockRecord,
  entry: Omit<MockRecord["history"][number], "at">
) {
  record.history = [
    { ...entry, at: dayjs().format("YYYY-MM-DDTHH:mm:ss") },
    ...record.history,
  ];
}

export const adminSettlementService = {
  /** 탭 건수 · GNB 배지 — 검색 조건과 무관한 전체 기준 */
  getSummary: async (): Promise<SettlementSummary> => {
    if (!DEV_MOCK_ENABLED) notReady();
    const { records, clawbacks } = source();
    const tasks = evidenceTasks();
    const count = (status: SettlementStatus) =>
      records.filter((record) => record.status === status).length;
    const failed = count("FAILED");
    const unrecovered = clawbacks.filter(
      (item) => item.status === "UNRECOVERED"
    ).length;
    return mockDelay({
      tabCounts: {
        ALL: records.length,
        CHECKING: count("CHECKING"),
        ADJUSTING: count("ADJUSTING"),
        FAILED: failed,
        EVIDENCE: tasks.length,
        CLAWBACK: clawbacks.length,
      },
      operatorActionCount:
        failed +
        unrecovered +
        tasks.filter((task) => task.operatorAction).length,
    });
  },

  getList: async (
    params: SettlementListParams
  ): Promise<SettlementListResponse> => {
    if (!DEV_MOCK_ENABLED) notReady();
    const records = filterSettlements(params);
    const adjusting = records.filter((record) => record.status === "ADJUSTING");
    const failed = records.filter((record) => record.status === "FAILED");
    const shares = new Set(failed.map((record) => record.failure?.shareLabel));
    const elapsed = failed.map((record) => record.failure?.elapsedDays ?? 0);
    const totalTargets = records.filter((record) =>
      TOTAL_STATUSES.includes(record.status)
    );
    const sum = (pick: (record: MockRecord) => number) =>
      totalTargets.reduce((acc, record) => acc + pick(record), 0);

    return mockDelay({
      ...paginate(records.map(toListItem), params),
      stats: {
        total: records.length,
        adjustingCount: adjusting.length,
        failedCount: failed.length,
        heldAmount: adjusting.reduce(
          (acc, record) => acc + record.confirmedSales,
          0
        ),
        nearestAgreeDue:
          adjusting.map((record) => record.schedule.date).sort()[0] ?? null,
        undeliveredAmount: failed.reduce(
          (acc, record) => acc + (record.failure?.amount ?? 0),
          0
        ),
        returnedShareLabel: shares.size === 1 ? ([...shares][0] ?? null) : null,
        maxElapsedDays: elapsed.length > 0 ? Math.max(...elapsed) : null,
      },
      totals:
        params.tab === "ALL" && totalTargets.length > 0
          ? {
              count: totalTargets.length,
              confirmedSales: sum((record) => record.confirmedSales),
              brandPayout: sum((record) => record.brandPayout),
              influencerPayout: sum((record) => record.influencerPayout),
              pgFee: sum((record) => record.breakdown.pgFee),
              withholding: sum(
                (record) => record.breakdown.influencer.withholding
              ),
              businessVat: sum((record) => record.breakdown.influencer.vat),
              rewardVat: sum((record) => record.breakdown.rewardVat),
              platformFee: sum((record) => record.breakdown.platformFee),
              platformFeeLabel: "베타",
            }
          : null,
    });
  },

  getEvidenceTasks: async (
    params: SettlementListParams
  ): Promise<EvidenceListResponse> => {
    if (!DEV_MOCK_ENABLED) notReady();
    const tasks = sortTasks(
      evidenceTasks().filter((task) =>
        matchesKeyword(params.keyword, [
          task.settlementNo,
          task.groupBuyTitle,
          task.targetName,
        ])
      ),
      params.sort
    );
    return mockDelay({
      ...paginate(tasks, params),
      stats: {
        total: tasks.length,
        operatorActionCount: tasks.filter((task) => task.operatorAction).length,
        checkCount: tasks.filter(
          (task) => task.operatorAction && task.type === "INVOICE_CHECK"
        ).length,
        issueCount: tasks.filter((task) => task.type === "BRAND_INVOICE")
          .length,
        payoutHoldCount: tasks.filter((task) => task.payoutHold).length,
      },
    });
  },

  getClawbacks: async (
    params: SettlementListParams
  ): Promise<ClawbackListResponse> => {
    if (!DEV_MOCK_ENABLED) notReady();
    const items = source()
      .clawbacks.filter((item) =>
        matchesKeyword(params.keyword, [
          item.originSettlementNo,
          item.appliedSettlementNo ?? "",
          item.brand.appliedSettlementNo ?? "",
          item.productTitle,
          item.brandName,
          item.showroomName,
        ])
      )
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    const unrecovered = items.filter((item) => item.status === "UNRECOVERED");
    return mockDelay({
      ...paginate(items, params),
      stats: {
        total: items.length,
        unrecoveredCount: unrecovered.length,
        unrecoveredAmount: unrecovered.reduce(
          (acc, item) => acc + unrecoveredAmount(item),
          0
        ),
      },
    });
  },

  /** 이전 · 다음은 목록 조건(탭 · 검색 · 정렬) 순서를 따른다 — 정산 탭이 아니면 전체 순서 */
  getDetail: async (
    settlementId: number,
    navParams: DetailNavParams
  ): Promise<SettlementDetail> => {
    if (!DEV_MOCK_ENABLED) notReady();
    const record = findRecord(settlementId);
    const settlementTab =
      navParams.tab && navParams.tab in SETTLEMENT_TAB_STATUS
        ? navParams
        : { keyword: navParams.keyword };
    const ordered = filterSettlements(settlementTab);
    const index = ordered.findIndex(
      (item) => item.settlementId === settlementId
    );
    return mockDelay({
      ...record,
      distribution: distributionOf(record),
      navigation: {
        prevId: index > 0 ? ordered[index - 1].settlementId : null,
        nextId:
          index >= 0 && index < ordered.length - 1
            ? ordered[index + 1].settlementId
            : null,
      },
    });
  },

  /** M3 — 확정 금액을 그대로 PG에 재지시한다(재계산 없음) */
  redistribute: async (
    settlementId: number,
    payload: RedistributePayload
  ): Promise<void> => {
    if (!DEV_MOCK_ENABLED) notReady();
    const record = findRecord(settlementId);
    if (!record.failure) throw new Error("NOT_FAILED");
    const account =
      payload.account === "UPDATED" && record.failure.updatedAccount
        ? record.failure.updatedAccount
        : record.failure.account;
    record.failure = {
      ...record.failure,
      redistributionRequestedAt: dayjs().format("YYYY-MM-DDTHH:mm:ss"),
    };
    pushHistory(record, {
      label: `재분배 지시 — ${record.failure.shareLabel} 몫`,
      actor: `${MOCK_OPERATOR}(운영자)`,
      note: `${account} · 재계산 없음`,
      tone: "INFO",
    });
    return mockDelay(undefined);
  },

  /** D5 [계좌 확인 요청] — 동작(채널 카드 / 알림)이 시안에 없다(§46 C-15). 목업은 이력만 남긴다 */
  requestAccountCheck: async (settlementId: number): Promise<void> => {
    if (!DEV_MOCK_ENABLED) notReady();
    const record = findRecord(settlementId);
    pushHistory(record, {
      label: `계좌 확인 요청 — ${record.failure?.recipientName ?? record.showroomName}`,
      actor: `${MOCK_OPERATOR}(운영자)`,
      note: null,
      tone: "NEUTRAL",
    });
    return mockDelay(undefined);
  },

  /** M4 — 확인이면 인플루언서 지급 보류 해제 · 지급일 = 확인일 + 3영업일 */
  checkInfluencerInvoice: async (
    settlementId: number,
    result: InvoiceCheckResult
  ): Promise<void> => {
    if (!DEV_MOCK_ENABLED) notReady();
    const record = findRecord(settlementId);
    const now = dayjs();
    const label =
      INVOICE_CHECK_OPTIONS.find((option) => option.value === result)?.label ??
      "";
    record.evidence = record.evidence.map((item) => {
      if (item.kind !== "INFLUENCER_INVOICE") return item;
      return result === "MATCH"
        ? {
            ...item,
            state: "CHECKED",
            processedAt: now.format("YYYY-MM-DDTHH:mm:ss"),
            processorName: MOCK_OPERATOR,
            rejectReason: null,
          }
        : {
            ...item,
            state: "REJECTED",
            processedAt: now.format("YYYY-MM-DDTHH:mm:ss"),
            processorName: MOCK_OPERATOR,
            rejectReason: label.replace(/ — 반려$/, ""),
          };
    });
    if (result === "MATCH") {
      const payoutAt = addBusinessDays(now, 3);
      record.influencerPayoutAt = payoutAt.format("YYYY-MM-DD");
      pushHistory(record, {
        label: "세금계산서 대조 확인 · 지급 보류 해제",
        actor: `${MOCK_OPERATOR}(운영자)`,
        note: `인플루언서 지급 예정 ${payoutAt.format("MM.DD")}`,
        tone: "SUCCESS",
      });
    } else {
      pushHistory(record, {
        label: `세금계산서 반려 — ${label.replace(/ — 반려$/, "")}`,
        actor: `${MOCK_OPERATOR}(운영자)`,
        note: "쇼룸 스튜디오에 사유 표시 · 재입력 대기",
        tone: "WARNING",
      });
    }
    return mockDelay(undefined);
  },

  /*
    파일 내려받기 — 정산 명세(xlsx) · 증빙 PDF · 원천세 신고 자료(월별 합계).
    목업에는 파일이 없어 개발 서버에서도 「준비 중」 오류를 낸다(가짜 파일을 만들지 않는다).
  */
  downloadStatement: async (): Promise<Blob> => {
    throw new ApiNotReadyError("정산 명세 다운로드");
  },

  openEvidenceFile: async (): Promise<string> => {
    throw new ApiNotReadyError("증빙 파일 보기");
  },

  downloadWithholdingReport: async (): Promise<Blob> => {
    throw new ApiNotReadyError("원천세 신고 자료");
  },

  /** M5 — 운영자가 홈택스에서 발행한 세금계산서를 등록한다(정상 등록 후 다시 등록할 수 없다) */
  registerBrandInvoice: async (
    settlementId: number,
    payload: BrandInvoicePayload
  ): Promise<void> => {
    if (!DEV_MOCK_ENABLED) notReady();
    const record = findRecord(settlementId);
    record.evidence = record.evidence.map((item) =>
      item.kind === "BRAND_INVOICE"
        ? {
            ...item,
            state: "ISSUED",
            approvalNo: payload.approvalNo,
            processedAt: dayjs().format("YYYY-MM-DDTHH:mm:ss"),
            processorName: MOCK_OPERATOR,
          }
        : item
    );
    pushHistory(record, {
      label: "브랜드 세금계산서 발행본 등록",
      actor: `${MOCK_OPERATOR}(운영자)`,
      note: `발행일 ${dayjs(payload.issuedAt).format("YYYY.MM.DD")} · ${payload.file.name}`,
      tone: "SUCCESS",
    });
    return mockDelay(undefined);
  },
};
