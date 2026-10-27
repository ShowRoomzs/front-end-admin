import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Pagination from "@/common/components/Pagination/Pagination";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import Btn from "@/features/contract/components/shared/Btn";
import { INPUT_CLASS } from "@/features/contract/components/shared/styles";
import {
  PolicyChapterModal,
  ReportTypeGuideModal,
} from "@/features/post/components/modals/ReferenceModals";
import { FLink, PhotoFill } from "@/features/post/components/shared/PostParts";
import {
  LIST_STATUS_LABEL,
  MONITORING_STATUS_TONE,
} from "@/features/post/constants/labels";
import {
  POST_INITIAL_PARAMS,
  POST_LIST_PATH,
  POST_PAGE_SIZES,
  POST_SORT_OPTIONS,
  POST_TABS,
  SELECT_CHEVRON_STYLE,
  influencerDetailPath,
} from "@/features/post/constants/params";
import { POLICY_CHAPTER } from "@/features/post/constants/provisional";
import {
  useGetAdminPostList,
  useGetAdminPostSummary,
} from "@/features/post/hooks/useAdminPost";
import type {
  AdminPostListItem,
  AdminPostListParams,
  AdminPostSummary,
  PostMonitoringSort,
  PostMonitoringTab,
} from "@/features/post/types";
import {
  dLabel,
  dateTime,
  daysLeft,
  yearMonth,
} from "@/features/post/utils/view";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const NAV_BTN_CLASS =
  "inline-flex h-8 items-center gap-[5px] whitespace-nowrap rounded-[6px] border border-sz-n-300 bg-white px-3 text-[12px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100 hover:text-sz-n-900";
const SELECT_SM_CLASS =
  "h-7 cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[26px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";
const HEAD_CLASS =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-100 px-5 py-2.5 text-left text-[11px] font-medium text-sz-n-600";
const CELL_CLASS =
  "h-[50px] whitespace-nowrap px-5 py-3.5 align-middle text-[12px]";

/** 툴바 요약 — 신고 접수 탭은 「심사 건은 별도 탭」을 함께 말한다(C9) */
function summaryLine(
  summary: AdminPostSummary | undefined,
  tab: PostMonitoringTab
): ReactNode {
  if (!summary) {
    return null;
  }
  if (tab === "REPORTED") {
    return (
      <>
        신고 접수 <b className="text-sz-n-900">{summary.reported}</b>건
        {summary.underReview > 0 && (
          <>
            {" · 이의 신청 심사 "}
            <b className="text-sz-n-900">{summary.underReview}</b>건은 별도 탭
          </>
        )}
      </>
    );
  }
  return (
    <>
      조치 필요 <b className="text-sz-n-900">{summary.actionRequired}</b>건
      {summary.actionRequired > 0 && (
        <>
          {" — 신고 접수 "}
          <b className="text-sz-n-900">{summary.reported}</b>
          {" · 이의 신청 심사 "}
          <b className="text-sz-n-900">{summary.underReview}</b>
        </>
      )}
    </>
  );
}

/** 상태 아래 기한 — 노출 중지 「기한 D-5」 · 이의 신청 「심사 D-2」 · 영구 삭제 「보관 ~2027.02」 */
function statusSub(row: AdminPostListItem): string | null {
  switch (row.monitoringStatus) {
    case "SUSPENDED":
      return row.appealDeadline
        ? `기한 ${dLabel(daysLeft(row.appealDeadline))}`
        : null;
    case "UNDER_REVIEW":
      return row.reviewDueAt
        ? `심사 ${dLabel(daysLeft(row.reviewDueAt))}`
        : null;
    case "CLOSED":
      return row.purgeAt ? `보관 ~${yearMonth(row.purgeAt)}` : null;
    default:
      return null;
  }
}

/**
 * `/monitoring/posts` — C1 일반 게시물 목록 · C9 신고 접수 탭 빈 상태.
 *
 * 관리 열을 두지 않는다 — 조치는 원문 · 신고 내역 · 조치 이력을 다 읽고 판단해야 하므로 상세에서만 실행한다.
 * 등록일시와 수정일시를 나란히 둔다(신고 접수 뒤 본문이 고쳐졌는지가 조치 판단에 걸린다).
 */
export default function PostMonitoring() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    params,
    localParams,
    update,
    updateParam,
    updateParams,
    updateLocalParam,
  } = useParams<AdminPostListParams>(POST_INITIAL_PARAMS);
  const [guide, setGuide] = useState<"reportTypes" | "policy" | null>(null);

  const { data: list, isLoading } = useGetAdminPostList(params);
  const { data: summary } = useGetAdminPostSummary();

  const pageInfo = usePaginationInfo({
    data: list?.pageInfo,
    onPageChange: (page) => updateParam("page", page),
  });

  const handleRowClick = useCallback(
    (row: AdminPostListItem) => {
      // 목록 조건을 들고 간다 — 상세가 이 조건으로 이전/다음을 받고 [목록]은 같은 자리로 돌아온다
      navigate({
        pathname: `${POST_LIST_PATH}/${row.postId}`,
        search: location.search,
      });
    },
    [navigate, location.search]
  );

  const rows = list?.content ?? [];
  const isReportedEmpty =
    params.tab === "REPORTED" && !params.keyword && rows.length === 0;

  return (
    <ListViewWrapper>
      {/* 시안 `.page-h` — 제목 옆 기준 문서 버튼 2개(MainLayout SELF_TITLED_PATHS) */}
      <div className="mb-4 flex shrink-0 items-end justify-between gap-4">
        <h1 className="text-[20px] font-semibold text-sz-n-900">일반 게시물</h1>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={NAV_BTN_CLASS}
            onClick={() => setGuide("reportTypes")}
          >
            신고 유형 기준
          </button>
          <span className="mx-0.5 h-[18px] w-px bg-sz-n-300" />
          <button
            type="button"
            className={NAV_BTN_CLASS}
            onClick={() => setGuide("policy")}
          >
            {POLICY_CHAPTER}
          </button>
        </div>
      </div>

      {/* 시안 `.filter` — 탭과 검색을 한 카드에 담는다 */}
      <div className="mb-4 flex shrink-0 items-center justify-between gap-4 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3">
        <div className="flex">
          {POST_TABS.map((item) => {
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
                  {summary?.[item.countKey] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-1.5">
          <input
            className={cn(INPUT_CLASS, "h-8 w-[200px] px-2.5 py-1.5")}
            placeholder="쇼룸명 · 본문 검색"
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

      <div className="flex min-h-0 flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
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
                  sort: event.target.value as PostMonitoringSort,
                  page: 1,
                })
              }
            >
              {POST_SORT_OPTIONS.map((option) => (
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
              {POST_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}건씩
                </option>
              ))}
            </select>
          </div>
        </div>

        {isReportedEmpty && !isLoading ? (
          // C9 — 조치할 일이 없다는 뜻이라 중립 톤 · 버튼 없음
          <div className="px-6 py-[72px] text-center leading-[1.6]">
            <div className="mb-2.5 text-[28px] text-sz-n-300">✓</div>
            <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
              접수된 신고가 없습니다
            </div>
            <div className="text-[12px] text-sz-n-500">
              신고가 들어오면 이 탭에 모입니다.
              {summary && summary.underReview > 0 && (
                <>
                  {" "}
                  좌측 메뉴 배지는 이의 신청 {summary.underReview}건만 남습니다.
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="min-h-0 overflow-auto">
              <table className="w-full min-w-[960px] table-fixed border-collapse">
                <colgroup>
                  <col />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 150 }} />
                  <col style={{ width: 150 }} />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 130 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className={HEAD_CLASS}>게시물</th>
                    <th className={HEAD_CLASS}>쇼룸명</th>
                    <th className={cn(HEAD_CLASS, "text-center")}>등록일시</th>
                    <th className={cn(HEAD_CLASS, "text-center")}>수정일시</th>
                    <th className={cn(HEAD_CLASS, "text-center")}>신고</th>
                    <th className={cn(HEAD_CLASS, "text-center")}>상태</th>
                  </tr>
                </thead>
                {rows.length > 0 && (
                  <tbody>
                    {rows.map((row) => (
                      <PostRow
                        key={row.postId}
                        row={row}
                        onOpen={() => handleRowClick(row)}
                        onAuthor={
                          row.showroomId !== null
                            ? () =>
                                navigate(
                                  influencerDetailPath(row.showroomId as number)
                                )
                            : undefined
                        }
                      />
                    ))}
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
                      : "해당하는 게시물이 없습니다"}
                  </div>
                  {params.keyword && (
                    <div className="text-[12px] text-sz-n-500">
                      쇼룸명 · 본문으로 검색됩니다. 철자를 확인해 주세요.
                    </div>
                  )}
                </div>
              ))}

            {rows.length > 0 && (
              <div className="flex shrink-0 justify-center border-t border-sz-n-200 p-3">
                <Pagination {...pageInfo} />
              </div>
            )}
          </>
        )}
      </div>

      {guide === "reportTypes" && (
        <ReportTypeGuideModal onClose={() => setGuide(null)} />
      )}
      {guide === "policy" && (
        <PolicyChapterModal onClose={() => setGuide(null)} />
      )}
    </ListViewWrapper>
  );
}

function PostRow(props: {
  row: AdminPostListItem;
  onOpen: () => void;
  onAuthor?: () => void;
}) {
  const { row, onOpen, onAuthor } = props;
  const sub = statusSub(row);

  return (
    <tr
      onClick={onOpen}
      className="group cursor-pointer border-t border-sz-n-100 first:border-t-0 hover:bg-sz-accent-50"
    >
      <td className={cn(CELL_CLASS, "whitespace-normal")}>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-[6px] bg-sz-n-200">
            <PhotoFill url={row.thumbnailUrl} fallback="사진" />
          </div>
          <span className="block max-w-[360px] truncate text-[13px] text-sz-n-900 group-hover:text-sz-accent-600">
            {row.contentPreview ?? "(본문 없음)"}
          </span>
        </div>
      </td>
      <td className={cn(CELL_CLASS, "truncate")}>
        <FLink onClick={onAuthor}>{row.showroomName ?? "—"}</FLink>
      </td>
      <td
        className={cn(
          CELL_CLASS,
          "text-center text-[11px] tabular-nums text-sz-n-500"
        )}
      >
        {dateTime(row.publishedAt)}
      </td>
      <td
        className={cn(
          CELL_CLASS,
          "text-center text-[11px] tabular-nums text-sz-n-500"
        )}
        title={row.editedAfterFirstReport ? "최초 신고 뒤 수정됨" : undefined}
      >
        {dateTime(row.editedAt)}
      </td>
      <td
        className={cn(
          CELL_CLASS,
          "text-center tabular-nums",
          row.reportCount > 0
            ? "font-semibold text-sz-danger-text"
            : "text-sz-n-400"
        )}
      >
        {row.reportCount}
      </td>
      <td className={cn(CELL_CLASS, "text-center")}>
        <StatusBadge variant={MONITORING_STATUS_TONE[row.monitoringStatus]}>
          {LIST_STATUS_LABEL[row.monitoringStatus] ?? row.monitoringStatusLabel}
        </StatusBadge>
        {sub && (
          <div className="mt-[3px] text-[11px] tabular-nums text-sz-n-500">
            {sub}
          </div>
        )}
      </td>
    </tr>
  );
}
