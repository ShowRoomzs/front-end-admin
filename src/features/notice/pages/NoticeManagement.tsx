import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Table from "@/common/components/Table/Table";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/common/constants";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import NoticeStatusModal from "@/features/notice/components/NoticeStatusModal/NoticeStatusModal";
import { createNoticeListColumns } from "@/features/notice/constants/columns";
import {
  NOTICE_INITIAL_PARAMS,
  NOTICE_PAGE_SIZES,
} from "@/features/notice/constants/params";
import {
  useEndNotice,
  useGetNoticeList,
  usePublishNotice,
} from "@/features/notice/hooks/useNoticeQueries";
import type {
  NoticeListParams,
  NoticeStatusFilter,
} from "@/features/notice/types/notice";
import { PlusIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface TabDef {
  label: string;
  value: NoticeStatusFilter;
}

const TABS: Array<TabDef> = [
  { label: "전체", value: "ALL" },
  { label: "게시", value: "PUBLISHED" },
  { label: "게시 종료", value: "ENDED" },
];

interface StatusTarget {
  noticeId: number;
  title: string;
  mode: "END" | "PUBLISH";
}

/**
 * C1 — 공지 관리 목록.
 *
 * FAQ(§19)와 같은 운영자 정적 콘텐츠지만 세 가지가 갈린다 — 등록·수정이 모달이 아니라
 * **전체 페이지**이고, 내릴 때 삭제가 아니라 **게시 종료**이며, 순서는 드래그가 아니라
 * **중요 고정 + 등록일 최신순** 자동이다.
 *
 * FAQ와 같은 점: **행 클릭이 상세로 가지 않는다.** 수정 진입은 `수정` 버튼으로만 한다.
 */
export default function NoticeManagement() {
  const navigate = useNavigate();
  const {
    params,
    localParams,
    update,
    updateParam,
    updateParams,
    updateLocalParam,
  } = useParams<NoticeListParams>(NOTICE_INITIAL_PARAMS);

  const { data: noticeList, isLoading } = useGetNoticeList(params);
  const { mutateAsync: endNotice, isPending: isEnding } = useEndNotice();
  const { mutateAsync: publishNotice, isPending: isPublishing } =
    usePublishNotice();

  const [statusTarget, setStatusTarget] = useState<StatusTarget | null>(null);

  const pageInfo = usePaginationInfo({
    data: noticeList?.pageInfo,
    onPageChange: (page) => {
      updateParam("page", page);
    },
  });

  const handleStatusTabChange = useCallback(
    (status: NoticeStatusFilter) => {
      updateParams({ status, page: 1 });
    },
    [updateParams]
  );

  const handleSizeChange = useCallback(
    (size: number) => {
      updateParams({ size, page: 1 });
    },
    [updateParams]
  );

  const columns = useMemo(
    () =>
      createNoticeListColumns({
        onEdit: (notice) => navigate(`/support/notice/${notice.noticeId}`),
        onEnd: (notice) =>
          setStatusTarget({
            noticeId: notice.noticeId,
            title: notice.title,
            mode: "END",
          }),
        onPublish: (notice) =>
          setStatusTarget({
            noticeId: notice.noticeId,
            title: notice.title,
            mode: "PUBLISH",
          }),
      }),
    [navigate]
  );

  const handleConfirmStatus = useCallback(async () => {
    if (!statusTarget) {
      return;
    }

    const isEnd = statusTarget.mode === "END";
    try {
      if (isEnd) {
        await endNotice(statusTarget.noticeId);
      } else {
        await publishNotice(statusTarget.noticeId);
      }
      setStatusTarget(null);
      toast.success(
        isEnd
          ? "공지 게시를 종료했습니다. 목록에는 그대로 남습니다."
          : "공지를 다시 게시했습니다."
      );
    } catch {
      toast.error(
        isEnd ? "게시 종료에 실패했습니다." : "게시 처리에 실패했습니다."
      );
    }
  }, [statusTarget, endNotice, publishNotice]);

  const emptyState = useMemo(() => {
    if (params.keyword) {
      return (
        <div className="px-6 py-[72px] text-center">
          <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">⌕</div>
          <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
            검색 결과가 없습니다
          </div>
          <div className="text-[12px] text-sz-n-500">
            다른 제목으로 검색해 보세요.
          </div>
        </div>
      );
    }

    return (
      <div className="px-6 py-[72px] text-center">
        <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">＋</div>
        <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
          등록된 공지가 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          공지를 등록하면 소비자 앱 공지사항에 즉시 노출됩니다.
        </div>
      </div>
    );
  }, [params.keyword]);

  return (
    <ListViewWrapper>
      {/* 셸은 pageTitle로 h1만 그리므로 헤더 우측 액션 줄은 화면이 직접 만든다 */}
      <div className="mb-4 flex shrink-0 items-center justify-end">
        <button
          type="button"
          onClick={() => navigate("/support/notice/register")}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[6px] bg-sz-accent-500 px-3.5 text-[12px] font-medium text-white hover:bg-sz-accent-600"
        >
          <PlusIcon className="size-3.5" />
          공지 등록
        </button>
      </div>

      <div className="mb-4 flex shrink-0 items-center justify-between gap-4 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3">
        <div className="flex">
          {TABS.map((tab) => {
            const isActive = params.status === tab.value;
            const count = noticeList?.statusCounts[tab.value];
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleStatusTabChange(tab.value)}
                className={`mr-5 flex items-center gap-1.5 whitespace-nowrap border-b-2 px-0.5 py-1.5 text-[12px] ${
                  isActive
                    ? "border-sz-accent-500 font-medium text-sz-accent-500"
                    : "border-transparent text-sz-n-500 hover:text-sz-n-700"
                }`}
              >
                {tab.label}
                {/* 집계가 없을 때 0으로 대신 그리면 "정말 0건"과 구분되지 않는다 */}
                {count !== undefined && (
                  <span
                    className={`rounded-lg px-1.5 text-[10px] ${
                      isActive
                        ? "bg-sz-accent-50 text-sz-accent-600"
                        : "bg-sz-n-100 text-sz-n-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 gap-1.5">
          <input
            type="text"
            value={localParams.keyword}
            onChange={(event) =>
              updateLocalParam("keyword", event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                update();
              }
            }}
            placeholder="제목 검색"
            className="h-8 w-[180px] rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          />
          <button
            type="button"
            onClick={update}
            className="inline-flex h-8 items-center rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[12px] font-medium text-sz-n-900 hover:bg-sz-n-100"
          >
            검색
          </button>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
          <span className="text-[12px] text-sz-n-600">
            총 <b className="text-sz-n-900">{pageInfo.totalResults}</b>건
            {!!noticeList?.pinnedCount && (
              <>
                {" · 중요 "}
                <b className="text-sz-n-900">{noticeList.pinnedCount}</b>건
              </>
            )}
          </span>
          <select
            aria-label="표시 건수"
            value={params.size}
            onChange={(event) => handleSizeChange(Number(event.target.value))}
            style={MODAL_SELECT_CHEVRON_STYLE}
            className="h-7 appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[26px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          >
            {NOTICE_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}건씩
              </option>
            ))}
          </select>
        </div>

        <Table
          columns={columns}
          data={noticeList?.content ?? []}
          pageInfo={pageInfo}
          isLoading={isLoading}
          emptyState={emptyState}
          fitWidth
          autoHeight
          maxRows={14}
          bodyClassName="overflow-hidden whitespace-nowrap"
          headerClassName="whitespace-nowrap"
        />
      </div>

      <NoticeStatusModal
        target={statusTarget}
        onClose={() => setStatusTarget(null)}
        isSubmitting={isEnding || isPublishing}
        onSubmit={handleConfirmStatus}
      />
    </ListViewWrapper>
  );
}
