import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import NotReady from "@/common/components/NotReady/NotReady";
import Pagination from "@/common/components/Pagination/Pagination";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import type { PageInfo } from "@/common/types/page";
import { DEV_MOCK_ENABLED, mockScenario } from "@/common/utils/devMock";
import Btn from "@/features/contract/components/shared/Btn";
import { SELECT_CHEVRON_STYLE } from "@/features/groupBuy/constants/params";
import {
  ClawbackTable,
  EvidenceTable,
  SettlementTable,
} from "@/features/settlement/components/list/ListTables";
import { TSub } from "@/features/settlement/components/shared/StlParts";
import {
  PAGE_SIZES,
  SETTLEMENT_INITIAL_PARAMS,
  SETTLEMENT_LIST_PATH,
  SETTLEMENT_NO_PREFIX,
  SETTLEMENT_TABS,
  SORT_OPTIONS,
} from "@/features/settlement/constants/params";
import {
  useGetAdminClawbacks,
  useGetAdminEvidenceTasks,
  useGetAdminSettlementList,
  useGetAdminSettlementSummary,
} from "@/features/settlement/hooks/useAdminSettlement";
import { adminSettlementService } from "@/features/settlement/services/adminSettlementService";
import type {
  ClawbackListResponse,
  EvidenceListResponse,
  SettlementListParams,
  SettlementListResponse,
  SettlementSort,
  SettlementTab,
} from "@/features/settlement/types";
import { md, won } from "@/features/settlement/utils/format";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

/** 시안 `.inp` — 32px · 13px · 6px 10px */
const INPUT_CLASS =
  "h-8 w-[300px] rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-1.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** 시안 `.sel-sm` — 28px */
const SELECT_SM_CLASS =
  "h-7 cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[26px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

const SETTLEMENT_TAB_VALUES: Array<SettlementTab> = [
  "ALL",
  "CHECKING",
  "ADJUSTING",
  "FAILED",
];

const EMPTY_TEXT: Record<SettlementTab, { title: string; desc: string }> = {
  ALL: {
    title: "정산이 없습니다",
    desc: "정산은 공구의 주문이 모두 종결되면 생성됩니다.",
  },
  CHECKING: {
    title: "정산 확인 중인 회차가 없습니다",
    desc: "주문이 모두 종결되면 금액이 공개되고 3영업일 확인 기간이 시작됩니다.",
  },
  ADJUSTING: {
    title: "조정 협의 중인 회차가 없습니다",
    desc: "확인 기간에 정산 조정 요청이 들어오면 이 탭에 모입니다.",
  },
  FAILED: {
    title: "분배 실패 건이 없습니다",
    desc: "PG 3자 분배에서 반환된 몫이 생기면 이 탭에 모입니다.",
  },
  EVIDENCE: {
    title: "처리할 증빙이 없습니다",
    desc: "세금계산서 대조 · 브랜드 세금계산서 발행 · 주민번호 미등록 건이 이 탭에 모입니다.",
  },
  CLAWBACK: {
    title: "차감 건이 없습니다",
    desc: "정산이 끝난 뒤 환불된 건이 생기면 이 탭에 모입니다.",
  },
};

/** 툴바 요약 한 줄 — 탭 전체가 같은 성격이면 행마다 반복하지 않고 여기 모은다(07a) */
function toolbarLine(
  tab: SettlementTab,
  settlement: SettlementListResponse | undefined,
  evidence: EvidenceListResponse | undefined,
  clawback: ClawbackListResponse | undefined
): ReactNode {
  const b = (value: ReactNode, className?: string) => (
    <b className={cn("font-semibold text-sz-n-900", className)}>{value}</b>
  );
  if (tab === "EVIDENCE") {
    if (!evidence) return null;
    const { stats } = evidence;
    return (
      <>
        증빙 처리 {b(stats.total)}건 · 운영자 조치{" "}
        {b(stats.operatorActionCount)}건{" "}
        <TSub>
          (대조 {stats.checkCount} · 발행 {stats.issueCount}) · 지급 보류{" "}
          {stats.payoutHoldCount}건
        </TSub>
      </>
    );
  }
  if (tab === "CLAWBACK") {
    if (!clawback) return null;
    const { stats } = clawback;
    return (
      <>
        차감 {b(stats.total)}건 · 미회수 {b(stats.unrecoveredCount)}건{" "}
        {stats.unrecoveredCount > 0 && (
          <>{b(won(stats.unrecoveredAmount), "tabular-nums")}원</>
        )}
      </>
    );
  }
  if (!settlement) return null;
  const { stats } = settlement;
  switch (tab) {
    case "CHECKING":
      return (
        <>
          정산 확인 중 {b(stats.total)}건{" "}
          <TSub>· 마감까지 조정 요청이 없으면 자동 확정</TSub>
        </>
      );
    case "ADJUSTING":
      return (
        <>
          조정 협의 {b(stats.total)}건
          {stats.total > 0 && (
            <>
              {" "}
              · 보류 {b(won(stats.heldAmount), "tabular-nums")}원 기준 전액{" "}
              <TSub>· 최단 합의 기한 {md(stats.nearestAgreeDue)}</TSub>
            </>
          )}
        </>
      );
    case "FAILED":
      return (
        <>
          분배 실패 {b(stats.total)}건
          {stats.total > 0 && (
            <>
              {" "}
              · 미전달 {b(won(stats.undeliveredAmount), "tabular-nums")}원{" "}
              <TSub>
                {stats.returnedShareLabel &&
                  `· ${stats.returnedShareLabel} 몫만 반환 `}
                ·{" "}
                {stats.total > 1
                  ? `최장 ${stats.maxElapsedDays}일 경과`
                  : `${stats.maxElapsedDays}일 경과`}
              </TSub>
            </>
          )}
        </>
      );
    default:
      return (
        <>
          총 {b(stats.total)}건
          {stats.adjustingCount > 0 && (
            <> · 조정 협의 {b(stats.adjustingCount)}건</>
          )}
          {stats.failedCount > 0 && <> · 분배 실패 {b(stats.failedCount)}건</>}
        </>
      );
  }
}

/**
 * L1~L7 — 어드민 공구 정산 목록(ui-admin-07a rev.2).
 *
 * 조회 화면이다 — 관리 열 · 체크박스 · 일괄 액션 · 확정 버튼이 없고 행 클릭으로 상세(07b)에 간다.
 * 필터는 탭 + 검색 한 칸 + 초기화 한 줄이고 기간 필터를 두지 않는다(공구당 정산 1건이라 회차가 드물다).
 * 배포본은 API가 없어 「준비 중」만 띄운다(가짜 금액 노출 금지).
 */
export default function SettlementManagement() {
  if (!DEV_MOCK_ENABLED) {
    return (
      <ListViewWrapper>
        <div className="rounded-[8px] border border-sz-n-200 bg-white">
          <NotReady title="공구 정산 화면은 준비 중입니다">
            정산 데이터 연동이 끝나면 공구별 정산 회차 · 증빙 처리 · 차감 내역을
            이 화면에서 확인합니다.
          </NotReady>
        </div>
      </ListViewWrapper>
    );
  }
  return <SettlementList />;
}

function SettlementList() {
  const navigate = useNavigate();
  const location = useLocation();
  // 개발 서버 `?mock=` 시나리오를 목록 조건과 함께 주소에 남긴다
  const [initialParams] = useState<SettlementListParams>(() => ({
    ...SETTLEMENT_INITIAL_PARAMS,
    mock: mockScenario() ?? "",
  }));
  const {
    params,
    localParams,
    update,
    updateParam,
    updateParams,
    updateLocalParam,
  } = useParams<SettlementListParams>(initialParams);

  const tab = params.tab;
  const isSettlementTab = SETTLEMENT_TAB_VALUES.includes(tab);
  const { data: summary } = useGetAdminSettlementSummary();
  const settlementQuery = useGetAdminSettlementList(params, isSettlementTab);
  const evidenceQuery = useGetAdminEvidenceTasks(params, tab === "EVIDENCE");
  const clawbackQuery = useGetAdminClawbacks(params, tab === "CLAWBACK");

  const active =
    tab === "EVIDENCE"
      ? evidenceQuery
      : tab === "CLAWBACK"
        ? clawbackQuery
        : settlementQuery;
  const pageData: PageInfo | undefined = active.data?.pageInfo;
  const rowCount = active.data?.content.length ?? 0;
  const pageInfo = usePaginationInfo({
    data: pageData,
    onPageChange: (page) => updateParam("page", page),
  });

  const goDetail = useCallback(
    (settlementId: number) => {
      // 목록 조건을 들고 간다 — 상세가 이 순서로 이전/다음을 계산하고 [목록]은 같은 자리로 돌아온다
      navigate({
        pathname: `${SETTLEMENT_LIST_PATH}/${settlementId}`,
        search: location.search,
      });
    },
    [navigate, location.search]
  );

  const changeTab = (value: SettlementTab) =>
    updateParams({ tab: value, sort: SORT_OPTIONS[value][0].value, page: 1 });

  const resetAll = () =>
    updateParams({
      ...SETTLEMENT_INITIAL_PARAMS,
      mock: params.mock,
    });

  const downloadReport = () => {
    adminSettlementService
      .downloadWithholdingReport()
      .catch((error: Error) => toast.error(error.message));
  };

  const keyword = params.keyword.trim();
  const showPager =
    rowCount > 0 && (tab === "ALL" || (pageData?.totalPages ?? 0) > 1);
  const showSizeSelect = tab !== "EVIDENCE" && tab !== "CLAWBACK";

  return (
    <ListViewWrapper>
      {/* 시안 `.filter` — 탭 · 검색 · 초기화 한 줄 */}
      <div className="mb-4 flex items-center justify-between gap-4 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3">
        <div className="flex">
          {SETTLEMENT_TABS.map((item) => {
            const isActive = item.value === tab;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => changeTab(item.value)}
                className={cn(
                  "mr-5 flex items-center gap-1.5 border-b-2 px-0.5 py-1.5 text-[12px]",
                  isActive
                    ? "border-sz-accent-500 font-medium text-sz-accent-500"
                    : "border-transparent text-sz-n-500 hover:text-sz-n-700"
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "rounded-[8px] px-[5px] text-[10px]",
                    isActive
                      ? "bg-sz-accent-50 text-sz-accent-600"
                      : "bg-sz-n-100 text-sz-n-600"
                  )}
                >
                  {summary?.tabCounts[item.value] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-1.5">
          <input
            className={INPUT_CLASS}
            placeholder="공구명 · 브랜드명 · 쇼룸명 · 정산번호 입력"
            value={localParams.keyword}
            onChange={(event) =>
              updateLocalParam("keyword", event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") update();
            }}
          />
          <Btn variant="secondary" onClick={update}>
            검색
          </Btn>
          <Btn variant="secondary" onClick={resetAll}>
            초기화
          </Btn>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
          <span className="text-[12px] text-sz-n-600">
            {toolbarLine(
              tab,
              settlementQuery.data,
              evidenceQuery.data,
              clawbackQuery.data
            )}
          </span>
          <div className="flex items-center gap-2">
            {tab === "ALL" && (
              <Btn variant="secondary" onClick={downloadReport}>
                원천세 신고 자료
              </Btn>
            )}
            <select
              aria-label="정렬"
              className={SELECT_SM_CLASS}
              style={SELECT_CHEVRON_STYLE}
              value={params.sort}
              onChange={(event) =>
                updateParams({
                  sort: event.target.value as SettlementSort,
                  page: 1,
                })
              }
            >
              {SORT_OPTIONS[tab].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {showSizeSelect && (
              <select
                aria-label="표시 건수"
                className={SELECT_SM_CLASS}
                style={SELECT_CHEVRON_STYLE}
                value={params.size}
                onChange={(event) =>
                  updateParams({ size: Number(event.target.value), page: 1 })
                }
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}건씩
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {tab === "EVIDENCE" ? (
          <EvidenceTable
            rows={evidenceQuery.data?.content ?? []}
            onRowClick={(row) => goDetail(row.settlementId)}
          />
        ) : tab === "CLAWBACK" ? (
          <ClawbackTable
            rows={clawbackQuery.data?.content ?? []}
            onRowClick={(row) => {
              if (row.originSettlementId !== null) {
                goDetail(row.originSettlementId);
              }
            }}
          />
        ) : (
          <SettlementTable
            rows={settlementQuery.data?.content ?? []}
            totals={settlementQuery.data?.totals ?? null}
            onRowClick={(row) => goDetail(row.settlementId)}
          />
        )}

        {rowCount === 0 &&
          (active.isLoading ? (
            <div className="flex justify-center py-12 text-sz-n-400">
              <Loader2 className="size-5 animate-spin" aria-hidden />
            </div>
          ) : keyword ? (
            // L7 — 기간 필터가 없어 결과가 없으면 정말 없는 것이다 · 검색어는 지우지 않는다
            <div className="px-6 py-[72px] text-center leading-[1.6]">
              <div className="mb-2.5 text-[28px] text-sz-n-300">◎</div>
              <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
                <span
                  className={cn(
                    keyword.toUpperCase().startsWith(SETTLEMENT_NO_PREFIX) &&
                      "tabular-nums"
                  )}
                >
                  {keyword}
                </span>{" "}
                정산이 없습니다
              </div>
              <div className="text-[12px] text-sz-n-500">
                정산번호 · 공구명 · 브랜드명 · 쇼룸명 중 하나로 검색됩니다.
                철자를 확인해 주세요.
              </div>
              <div className="mt-4">
                <Btn
                  variant="secondary"
                  onClick={() => updateParams({ keyword: "", page: 1 })}
                >
                  검색 초기화
                </Btn>
              </div>
            </div>
          ) : (
            <div className="px-6 py-[72px] text-center leading-[1.6]">
              <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
                {EMPTY_TEXT[tab].title}
              </div>
              <div className="text-[12px] text-sz-n-500">
                {EMPTY_TEXT[tab].desc}
              </div>
            </div>
          ))}

        {showPager && (
          <div className="flex justify-center border-t border-sz-n-100 py-[11px]">
            <Pagination {...pageInfo} />
          </div>
        )}
      </div>
    </ListViewWrapper>
  );
}
