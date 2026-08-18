import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type { Columns } from "@/common/components/Table/types";
import { formatDateTimeShort } from "@/common/utils/formatDate";
import type { NoticeListItem } from "@/features/notice/types/notice";

interface NoticeColumnHandlers {
  onEdit: (notice: NoticeListItem) => void;
  onEnd: (notice: NoticeListItem) => void;
  onPublish: (notice: NoticeListItem) => void;
}

/**
 * 시안 컬럼 폭 — 번호 56px / 제목 auto / 등록일 10% / 수정일 10% / 상태 9% / 관리 13%.
 * `fitWidth`가 비례 배분하므로 합이 1000이다.
 *
 * **조회수·작성자 컬럼은 일부러 없다**(작성자는 수정 페이지에서 확인). 드래그 순서
 * 조정도 두지 않는다 — 정렬은 중요 고정 상단 + 등록일 최신순으로 서버가 고정한다.
 * 공지는 시간순이 자연스러운 콘텐츠라 수동 순서가 필요 없다(§20-3).
 */
export const createNoticeListColumns = (
  handlers: NoticeColumnHandlers
): Columns<NoticeListItem> => [
  {
    key: "number",
    label: "번호",
    width: 56,
    align: "center",
    render: (value) => (
      <span className="text-[11px] tabular-nums text-sz-n-500">
        {value as number}
      </span>
    ),
  },
  {
    key: "title",
    label: "제목",
    width: 464,
    render: (value, record) => (
      <span className="flex min-w-0 items-center gap-1.5">
        {/* 중요는 상태가 아니라 분류라 점 없는 중립 배지다 — 상태 배지와 섞지 말 것 */}
        {record.pinned && (
          <StatusBadge variant="neutral" hideDot>
            중요
          </StatusBadge>
        )}
        <span className="truncate text-[13px] font-medium text-sz-n-900">
          {value as string}
        </span>
      </span>
    ),
  },
  {
    key: "createdAt",
    label: "등록일",
    width: 130,
    align: "center",
    // FAQ와 달리 **분까지** 표기한다 — 같은 날 여러 건이 올라가는 콘텐츠라서다(§20-3)
    render: (value) => (
      <span className="text-[11px] tabular-nums text-sz-n-500">
        {formatDateTimeShort(value as string)}
      </span>
    ),
  },
  {
    key: "modifiedAt",
    label: "수정일",
    width: 130,
    align: "center",
    render: (value) => (
      <span className="text-[11px] tabular-nums text-sz-n-500">
        {formatDateTimeShort(value as string)}
      </span>
    ),
  },
  {
    key: "statusName",
    label: "상태",
    width: 90,
    align: "center",
    // 게시=성공(노출 중) / 게시 종료=중립(종료) — 게시 종료에 위험색을 쓰지 말 것
    render: (value, record) => (
      <StatusBadge
        variant={record.status === "PUBLISHED" ? "success" : "neutral"}
      >
        {value as string}
      </StatusBadge>
    ),
  },
  {
    key: "virtual",
    label: "관리",
    width: 130,
    align: "center",
    preventRowClick: true,
    /*
      관리 열은 **상태에 따라 버튼이 바뀐다**(§20-3). 게시 행에는 `게시 종료`,
      게시 종료 행에는 `게시`가 뜬다. 둘을 동시에 두면 지금 어떤 상태인지가 흐려진다.
      상태 전이는 이 버튼에서만 일어나고, 수정 페이지의 저장은 상태를 건드리지 않는다.
    */
    render: (_value, record) => (
      <div className="flex justify-center gap-1.5">
        <button
          type="button"
          onClick={() => handlers.onEdit(record)}
          className="inline-flex h-[26px] items-center rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[11px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100"
        >
          수정
        </button>
        {record.status === "PUBLISHED" ? (
          <button
            type="button"
            onClick={() => handlers.onEnd(record)}
            className="inline-flex h-[26px] items-center rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[11px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100"
          >
            게시 종료
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handlers.onPublish(record)}
            className="inline-flex h-[26px] items-center rounded-[6px] border border-sz-accent-100 bg-sz-accent-50 px-2.5 text-[11px] font-medium text-sz-accent-600 hover:bg-sz-accent-100"
          >
            게시
          </button>
        )}
      </div>
    ),
  },
];
