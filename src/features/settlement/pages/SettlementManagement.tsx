import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Pagination from "@/common/components/Pagination/Pagination";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import type { PageInfo } from "@/common/types/page";
import Btn from "@/features/contract/components/shared/Btn";
import { SELECT_CHEVRON_STYLE } from "@/features/groupBuy/constants/params";
import {
  ClawbackTable,
  EvidenceTable,
  SettlementTable,
} from "@/features/settlement/components/list/ListTables";
import { WithholdingReportModal } from "@/features/settlement/components/modals/SettlementModals";
import { TSub } from "@/features/settlement/components/shared/StlParts";
import {
  ALL_SORT_OPTIONS,
  FIXED_SORT_LABEL,
  PAGE_SIZES,
  SETTLEMENT_INITIAL_PARAMS,
  SETTLEMENT_LIST_PATH,
  SETTLEMENT_NO_PREFIX,
  SETTLEMENT_ROW_TABS,
  SETTLEMENT_TABS,
} from "@/features/settlement/constants/params";
import {
  useGetAdminClawbackList,
  useGetAdminEvidenceList,
  useGetAdminSettlementList,
  useGetAdminSettlementSummary,
} from "@/features/settlement/hooks/useAdminSettlement";
import type {
  SettlementListItem,
  SettlementListParams,
  SettlementListResponse,
  SettlementSort,
  SettlementSummary,
  SettlementTab,
  SettlementToolbar,
} from "@/features/settlement/types";
import { md, won } from "@/features/settlement/utils/format";
import { normalizeListParams } from "@/features/settlement/utils/listParams";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** 시안 `.inp` — 32px · 13px · 6px 10px */
const INPUT_CLASS =
  "h-8 w-[300px] rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-1.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50 disabled:cursor-not-allowed disabled:bg-sz-n-50";

/** 시안 `.sel-sm` — 28px */
const SELECT_SM_CLASS =
  "h-7 cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[26px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

const EMPTY_TEXT: Record<SettlementTab, { title: string; desc: string }> = {
  ALL: {
    title: "정산이 없습니다",
    desc: "정산은 공구의 주문이 모두 종결되면 생성됩니다.",
  },
  REVIEWING: {
    title: "정산 확인 중인 회차가 없습니다",
    desc: "주문이 모두 종결되면 금액이 공개되고 3영업일 확인 기간이 시작됩니다.",
  },
  ADJUSTING: {
    title: "조정 협의 중인 회차가 없습니다",
    desc: "확인 기간에 정산 조정 요청이 들어오면 이 탭에 모입니다.",
  },
  PAYOUT_FAILED: {
    title: "분배 실패 건이 없습니다",
    desc: "PG 3자 분배에서 반환된 몫이 생기면 이 탭에 모입니다.",
  },
  EVIDENCE: {
    title: "처리할 증빙이 없습니다",
    desc: "세금계산서 확인 · 브랜드 세금계산서 발행 · 주민번호 미등록 건이 이 탭에 모입니다.",
  },
  CLAWBACK: {
    title: "차감 건이 없습니다",
    desc: "정산이 끝난 뒤 환불된 건이 생기면 이 탭에 모입니다.",
  },
};

const b = (value: ReactNode, className?: string) => (
  <b className={cn("font-semibold text-sz-n-900", className)}>{value}</b>
);

/** 툴바 요약 한 줄 — 서버 toolbar · 탭 숫자로 그린다(07a) */
function toolbarLine(input: {
  tab: SettlementTab;
  total: number | undefined;
  toolbar: SettlementToolbar | null | undefined;
  summary: SettlementSummary | undefined;
  hasKeyword: boolean;
}): ReactNode {
  const { tab, total, toolbar, summary, hasKeyword } = input;
  if (total === undefined) return null;
  switch (tab) {
    case "EVIDENCE":
      return (
        <>
          증빙 처리 {b(toolbar?.count ?? total)}건 · 운영자 조치{" "}
          {b(toolbar?.operatorActionCount ?? 0)}건{" "}
          <TSub>· 지급 보류 {toolbar?.payoutBlockedCount ?? 0}건</TSub>
        </>
      );
    case "CLAWBACK": {
      const unrecoverable = toolbar?.unrecoverableCount ?? 0;
      return (
        <>
          차감 {b(toolbar?.count ?? total)}건 · 미회수 {b(unrecoverable)}건{" "}
          {unrecoverable > 0 && (
            <>{b(won(toolbar?.unrecoverableAmount ?? 0), "tabular-nums")}원</>
          )}
        </>
      );
    }
    case "REVIEWING":
      return (
        <>
          정산 확인 중 {b(total)}건{" "}
          <TSub>· 마감까지 조정 요청이 없으면 자동 확정</TSub>
        </>
      );
    case "ADJUSTING":
      return (
        <>
          조정 협의 {b(total)}건
          {total > 0 && (
            <>
              {" "}
              · 보류 {b(won(toolbar?.heldAmount ?? 0), "tabular-nums")}원 기준
              전액{" "}
              {toolbar?.earliestDeadlineAt && (
                <TSub>· 최단 합의 기한 {md(toolbar.earliestDeadlineAt)}</TSub>
              )}
            </>
          )}
        </>
      );
    case "PAYOUT_FAILED": {
      const days = toolbar?.elapsedDays;
      return (
        <>
          분배 실패 {b(total)}건
          {total > 0 && (
            <>
              {" "}
              · 미전달 {b(won(toolbar?.undeliveredAmount ?? 0), "tabular-nums")}
              원{" "}
              <TSub>
                {toolbar?.failedPayeeLabel &&
                  `· 실패 수취자 ${toolbar.failedPayeeLabel} `}
                {days !== undefined &&
                  (total > 1 ? `· 최장 ${days}일 경과` : `· ${days}일 경과`)}
              </TSub>
            </>
          )}
        </>
      );
    }
    default: {
      // 탭 숫자는 검색과 무관한 전체 기준이라 검색 중에는 총 건수만 보인다
      const adjusting = hasKeyword ? 0 : (summary?.tabCounts.ADJUSTING ?? 0);
      const failed = hasKeyword ? 0 : (summary?.tabCounts.PAYOUT_FAILED ?? 0);
      return (
        <>
          총 {b(total)}건{adjusting > 0 && <> · 조정 협의 {b(adjusting)}건</>}
          {failed > 0 && <> · 분배 실패 {b(failed)}건</>}
        </>
      );
    }
  }
}

/**
 * L1~L7 — 어드민 공구 정산 목록(ui-admin-07a rev.2 · `GET /v1/admin/settlements`).
 *
 * 조회 화면이다 — 관리 열 · 체크박스 · 일괄 액션 · 확정 버튼이 없고 행 클릭으로 상세(07b)에 간다.
 * 필터는 탭 + 검색 한 칸 + 초기화 한 줄이고 기간 필터를 두지 않는다(공구당 정산 1건이라 회차가 드물다).
 */
export default function SettlementManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    params: rawParams,
    localParams,
    update,
    updateParam,
    updateParams,
    updateLocalParam,
  } = useParams<SettlementListParams>(SETTLEMENT_INITIAL_PARAMS);
  // 주소에서 읽은 값(문자열 · 예전 탭 이름)을 서버가 받는 값으로 고른다
  const params = useMemo(() => normalizeListParams(rawParams), [rawParams]);
  const [reportOpen, setReportOpen] = useState(false);

  const tab = params.tab;
  const isSettlementRowTab = SETTLEMENT_ROW_TABS.includes(tab);
  const { data: summary } = useGetAdminSettlementSummary();
  const settlementQuery = useGetAdminSettlementList(params, isSettlementRowTab);
  const evidenceQuery = useGetAdminEvidenceList(params, tab === "EVIDENCE");
  const clawbackQuery = useGetAdminClawbackList(params, tab === "CLAWBACK");

  const active: {
    data: SettlementListResponse<unknown> | undefined;
    isLoading: boolean;
    isError: boolean;
  } =
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
    updateParams({
      tab: value,
      sort: value === "ALL" ? "SCHEDULE_DESC" : "",
      page: 1,
    });

  const resetAll = () => updateParams(SETTLEMENT_INITIAL_PARAMS);

  // 증빙 탭은 서버가 검색어를 받지 않는다 — 입력을 막고 검색 결과 없음 문구도 쓰지 않는다
  const searchable = tab !== "EVIDENCE";
  const keyword = searchable ? params.keyword.trim() : "";
  const showPager =
    rowCount > 0 && (tab === "ALL" || (pageData?.totalPages ?? 0) > 1);
  const showSizeSelect = isSettlementRowTab;

  return (
    <ListViewWrapper>
      {/* 시안 `.filter` — 탭 · 검색 · 초기화 한 줄 */}
      <div className="mb-4 flex items-center justify-between gap-4 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3 leading-[1.6]">
        <div className="flex">
          {SETTLEMENT_TABS.map((item) => {
            const isActive = item.value === tab;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => changeTab(item.value)}
                aria-pressed={isActive}
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
            aria-label="정산 검색"
            placeholder={
              searchable
                ? tab === "CLAWBACK"
                  ? "차감번호 · 정산번호 · 주문번호 · 브랜드명 · 쇼룸명 입력"
                  : "공구명 · 브랜드명 · 쇼룸명 · 정산번호 입력"
                : "증빙 처리 탭은 검색 없이 기한 순으로 봅니다"
            }
            disabled={!searchable}
            value={searchable ? localParams.keyword : ""}
            onChange={(event) =>
              updateLocalParam("keyword", event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") update();
            }}
          />
          <Btn variant="secondary" onClick={update} disabled={!searchable}>
            검색
          </Btn>
          <Btn variant="secondary" onClick={resetAll}>
            초기화
          </Btn>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white leading-[1.6] text-sz-n-900">
        <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
          <span className="text-[12px] text-sz-n-600">
            {toolbarLine({
              tab,
              total: pageData?.totalResults,
              toolbar: active.data?.toolbar,
              summary,
              hasKeyword: keyword !== "",
            })}
          </span>
          <div className="flex items-center gap-2">
            {tab === "ALL" && rowCount > 0 && (
              <Btn variant="secondary" onClick={() => setReportOpen(true)}>
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
              {tab === "ALL" ? (
                ALL_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))
              ) : (
                <option value="">{FIXED_SORT_LABEL[tab]}</option>
              )}
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
            onRowClick={(row) => goDetail(row.originSettlementId)}
          />
        ) : (
          <SettlementTable
            rows={settlementQuery.data?.content ?? []}
            footer={settlementQuery.data?.footer ?? null}
            onRowClick={(row: SettlementListItem) => goDetail(row.settlementId)}
          />
        )}

        {rowCount === 0 &&
          (active.isLoading ? (
            <div className="flex justify-center py-12 text-sz-n-400">
              <Loader2 className="size-5 animate-spin" aria-hidden />
            </div>
          ) : active.isError ? (
            <div className="py-[18px] text-center">
              <div className="text-[13px] font-medium text-sz-n-700">
                정산 목록을 불러오지 못했습니다
              </div>
              <div className="mt-[5px] text-[12px] text-sz-n-500">
                잠시 후 다시 시도해 주세요.
              </div>
            </div>
          ) : keyword ? (
            // L7 — 기간 필터가 없어 결과가 없으면 정말 없는 것이다 · 검색어는 지우지 않는다
            <div className="py-[18px] text-center">
              <div className="mb-2.5 text-[28px] text-sz-n-300">◎</div>
              <div className="text-[13px] font-medium text-sz-n-700">
                <span
                  className={cn(
                    keyword.toUpperCase().startsWith(SETTLEMENT_NO_PREFIX) &&
                      "tabular-nums"
                  )}
                >
                  {keyword}
                </span>{" "}
                {tab === "CLAWBACK" ? "차감 건이 없습니다" : "정산이 없습니다"}
              </div>
              <div className="mt-[5px] text-[12px] text-sz-n-500">
                {tab === "CLAWBACK"
                  ? "차감번호 · 원 정산번호 · 주문번호 · 브랜드명 · 쇼룸명 중 하나로 검색됩니다."
                  : "정산번호(STL-로 시작하면 번호 앞부분) · 공구명 · 브랜드명 · 쇼룸명 중 하나로 검색됩니다."}{" "}
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
            <div className="py-[18px] text-center">
              <div className="text-[13px] font-medium text-sz-n-700">
                {EMPTY_TEXT[tab].title}
              </div>
              <div className="mt-[5px] text-[12px] text-sz-n-500">
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

      {reportOpen && (
        <WithholdingReportModal onClose={() => setReportOpen(false)} />
      )}
    </ListViewWrapper>
  );
}
