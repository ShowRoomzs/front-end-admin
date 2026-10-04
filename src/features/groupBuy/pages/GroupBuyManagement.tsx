import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Pagination from "@/common/components/Pagination/Pagination";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import Btn from "@/features/contract/components/shared/Btn";
import { INPUT_CLASS } from "@/features/contract/components/shared/styles";
import { GbBadge } from "@/features/groupBuy/components/shared/GbParts";
import {
  GROUP_BUY_INITIAL_PARAMS,
  GROUP_BUY_LIST_PATH,
  GROUP_BUY_PAGE_SIZES,
  GROUP_BUY_SORT_OPTIONS,
  GROUP_BUY_TABS,
  QUEUE_LABEL,
  QUEUE_ORDER,
  SELECT_CHEVRON_STYLE,
} from "@/features/groupBuy/constants/params";
import {
  useGetAdminGroupBuyList,
  useGetAdminGroupBuySummary,
} from "@/features/groupBuy/hooks/useAdminGroupBuy";
import type {
  AdminGroupBuyListItem,
  AdminGroupBuyListParams,
  AdminGroupBuySort,
  AdminGroupBuySummary,
  AdminGroupBuyTab,
} from "@/features/groupBuy/types";
import {
  dLabel,
  localDate,
  mdDate,
  periodFull,
} from "@/features/groupBuy/utils/view";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Fragment, useCallback, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SELECT_SM_CLASS =
  "h-7 cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[26px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

const HEAD_CLASS =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-100 px-5 py-2.5 text-left text-[11px] font-medium text-sz-n-600";
const CELL_CLASS =
  "h-[50px] whitespace-nowrap px-5 py-3.5 align-middle text-[12px]";

/** 툴바 요약 — 탭마다 답하는 질문이 다르다(시안 A1 · A2 · A3) */
function summaryLine(
  summary: AdminGroupBuySummary | undefined,
  tab: AdminGroupBuyTab
): ReactNode {
  if (!summary) {
    return null;
  }
  const total = summary.actionRequiredCount;
  const watch = summary.settlementWatch;

  if (total === 0) {
    return (
      <>
        조치 필요 <b className="text-sz-n-900">0</b>건
        {watch && watch.watchingCount > 0 && (
          <>
            {" · 지연 감시 "}
            <b className="text-sz-n-900">{watch.watchingCount}</b>건
            {watch.nearest &&
              `(${watch.nearest.title} 종료 +30일 기한 ${localDate(watch.nearest.dueAt)} · ${watch.nearest.reached ? "도달" : "도달 전"})`}
          </>
        )}
      </>
    );
  }

  if (tab === "ACTION_REQUIRED") {
    // 건수는 탭 배지가 이미 말하므로 여기서는 「무엇이 먼저 터지는가」가 정보다
    const openReview = summary.nearestDeadlines.find(
      (item) => item.queue === "OPEN_REVIEW"
    );
    const appeal = summary.nearestDeadlines.find(
      (item) => item.queue === "APPEAL_REVIEW"
    );
    const appealCount = summary.queues.APPEAL_REVIEW ?? 0;
    return (
      <>
        조치 필요 <b className="text-sz-n-900">{total}</b>건
        {openReview && (
          <>
            {" · 최단 기한 "}
            <b className="text-sz-n-900">{dLabel(openReview.daysLeft)}</b>(
            {openReview.title} 오픈 승인)
          </>
        )}
        {appealCount > 0 && (
          <>
            {" · 소명 검토 "}
            <b className="text-sz-n-900">{appealCount}</b>건
            {appeal && `(${appeal.title} · 집행 예정 ${mdDate(appeal.dueAt)})`}
          </>
        )}
      </>
    );
  }

  const parts = QUEUE_ORDER.filter((queue) => (summary.queues[queue] ?? 0) > 0);
  return (
    <>
      조치 필요 <b className="text-sz-n-900">{total}</b>건
      {parts.length > 0 && " — "}
      {parts.map((queue, index) => (
        <Fragment key={queue}>
          {index > 0 && " · "}
          {/* 시안 A1 — 소명 검토는 라벨까지 굵게(다른 큐와 성격이 다른 직권 중단 단계) */}
          {queue === "APPEAL_REVIEW" ? (
            <b className="text-sz-n-900">
              {QUEUE_LABEL[queue]} {summary.queues[queue]}
            </b>
          ) : (
            <>
              {QUEUE_LABEL[queue]}{" "}
              <b className="text-sz-n-900">{summary.queues[queue]}</b>
            </>
          )}
        </Fragment>
      ))}
    </>
  );
}

/**
 * A1~A3 — 어드민 공구 목록.
 *
 * 조치 필요 건(오픈 승인 · 중단 요청 · 조기 마감 요청 · 소명 검토)을 경고 배경으로 상단 고정하고,
 * 조치 필요 탭에서는 전부 같은 성격이라 고정·배경을 끈다. 목록에 실행 액션을 두지 않는다 —
 * 모든 판정은 상세에서 모달을 거친다.
 */
export default function GroupBuyManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    params,
    localParams,
    update,
    updateParam,
    updateParams,
    updateLocalParam,
  } = useParams<AdminGroupBuyListParams>(GROUP_BUY_INITIAL_PARAMS);

  const { data: list, isLoading } = useGetAdminGroupBuyList(params);
  const { data: summary } = useGetAdminGroupBuySummary();

  const pageInfo = usePaginationInfo({
    data: list?.pageInfo,
    onPageChange: (page) => updateParam("page", page),
  });

  const handleRowClick = useCallback(
    (record: AdminGroupBuyListItem) => {
      // 목록 조건을 들고 간다 — 상세가 이 조건으로 이전/다음을 계산하고 [목록]은 같은 자리로 돌아온다
      navigate({
        pathname: `${GROUP_BUY_LIST_PATH}/${record.groupBuyId}`,
        search: location.search,
      });
    },
    [navigate, location.search]
  );

  const rows = list?.content ?? [];
  const pinRows = params.tab !== "ACTION_REQUIRED";
  const isActionTabEmpty =
    params.tab === "ACTION_REQUIRED" && !params.keyword && rows.length === 0;

  return (
    <ListViewWrapper>
      {/* 시안 `.filter` — 탭과 검색을 한 카드에 담는다 */}
      <div className="mb-4 flex items-center justify-between gap-4 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3">
        <div className="flex">
          {GROUP_BUY_TABS.map((item) => {
            const isActive = item.value === params.tab;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => updateParams({ tab: item.value, page: 1 })}
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
            className={cn(INPUT_CLASS, "h-8 w-[280px] px-2.5 py-1.5")}
            placeholder="공구명 · 공구번호 · 브랜드 · 쇼룸명 검색"
            value={localParams.keyword}
            onChange={(event) =>
              updateLocalParam("keyword", event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                update();
              }
            }}
          />
          <Btn variant="secondary" onClick={update}>
            검색
          </Btn>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
          <span className="text-[12px] text-sz-n-600">
            {summaryLine(summary, params.tab)}
          </span>
          <div className="flex items-center gap-2">
            <select
              aria-label="정렬"
              className={SELECT_SM_CLASS}
              style={SELECT_CHEVRON_STYLE}
              value={params.sort}
              onChange={(event) =>
                updateParams({
                  sort: event.target.value as AdminGroupBuySort,
                  page: 1,
                })
              }
            >
              {GROUP_BUY_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              aria-label="표시 건수"
              className={SELECT_SM_CLASS}
              style={SELECT_CHEVRON_STYLE}
              value={params.size}
              onChange={(event) =>
                updateParams({ size: Number(event.target.value), page: 1 })
              }
            >
              {GROUP_BUY_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}건씩
                </option>
              ))}
            </select>
          </div>
        </div>

        {isActionTabEmpty && !isLoading ? (
          <div className="px-6 py-[72px] text-center leading-[1.6]">
            <div className="mb-2.5 text-[28px] text-sz-n-300">✓</div>
            <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
              지금 판단할 공구가 없습니다
            </div>
            <div className="text-[12px] text-sz-n-500">
              오픈 승인 · 중단 요청 · 조기 마감 요청이 들어오면 이 탭에
              모입니다.
              <br />
              정산 지연 감시(종료 +30일)는 기한 도달 전에도 종료 탭에서 확인할
              수 있습니다.
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] table-fixed border-collapse">
                <colgroup>
                  <col />
                  <col style={{ width: 120 }} />
                  <col style={{ width: 112 }} />
                  <col style={{ width: 80 }} />
                  <col style={{ width: 250 }} />
                  <col style={{ width: 104 }} />
                  <col style={{ width: 112 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className={HEAD_CLASS}>공구명</th>
                    <th className={HEAD_CLASS}>인플루언서</th>
                    <th className={HEAD_CLASS}>브랜드</th>
                    <th className={cn(HEAD_CLASS, "text-center")}>상품 수</th>
                    <th className={cn(HEAD_CLASS, "text-center")}>공구 기간</th>
                    <th className={cn(HEAD_CLASS, "text-center")}>게시물</th>
                    <th className={cn(HEAD_CLASS, "text-center")}>상태</th>
                  </tr>
                </thead>
                {rows.length > 0 && (
                  <tbody>
                    {rows.map((row) => {
                      const pinned = pinRows && row.actionRequired;
                      return (
                        <tr
                          key={row.groupBuyId}
                          onClick={() => handleRowClick(row)}
                          className={cn(
                            "group cursor-pointer border-t border-sz-n-100 first:border-t-0",
                            pinned
                              ? "bg-sz-warning-bg"
                              : "hover:bg-sz-accent-50"
                          )}
                        >
                          <td className={CELL_CLASS}>
                            <span className="block truncate text-[13px] font-medium text-sz-n-900 group-hover:text-sz-accent-600">
                              {row.title}
                            </span>
                          </td>
                          <td
                            className={cn(CELL_CLASS, "truncate")}
                            title={row.creatorName}
                          >
                            {row.creatorName}
                          </td>
                          <td
                            className={cn(CELL_CLASS, "truncate")}
                            title={row.brandName}
                          >
                            {row.brandName}
                          </td>
                          <td
                            className={cn(
                              CELL_CLASS,
                              "text-center tabular-nums"
                            )}
                          >
                            {row.itemCount}개
                          </td>
                          <td
                            className={cn(
                              CELL_CLASS,
                              "text-center text-[11px] tabular-nums text-sz-n-500"
                            )}
                          >
                            {periodFull(row.startAt, row.endAt)}
                          </td>
                          <td className={cn(CELL_CLASS, "text-center")}>
                            <GbBadge tone={row.postStatusTone}>
                              {row.postStatusLabel}
                            </GbBadge>
                          </td>
                          <td className={cn(CELL_CLASS, "text-center")}>
                            <GbBadge tone={row.statusTone}>
                              {row.statusLabel}
                            </GbBadge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                )}
              </table>
            </div>

            {rows.length === 0 &&
              (isLoading ? (
                <div className="flex justify-center py-12 text-sz-n-400">
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                </div>
              ) : (
                <div className="px-6 py-[72px] text-center leading-[1.6]">
                  <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
                    {params.keyword
                      ? "검색 결과가 없습니다"
                      : "해당하는 공구가 없습니다"}
                  </div>
                  <div className="text-[12px] text-sz-n-500">
                    {params.keyword
                      ? "공구명 · 공구번호 · 브랜드 · 쇼룸명 중 하나로 검색됩니다. 철자를 확인해 주세요."
                      : "공구는 계약이 체결되면 자동으로 생성됩니다."}
                  </div>
                </div>
              ))}

            {rows.length > 0 && (
              <div className="flex justify-center border-t border-sz-n-200 p-3">
                <Pagination {...pageInfo} />
              </div>
            )}
          </>
        )}
      </div>
    </ListViewWrapper>
  );
}
