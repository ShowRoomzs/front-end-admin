import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type { Columns } from "@/common/components/Table/types";
import type { Faq } from "@/features/faq/types/faq";
import dayjs from "dayjs";
import { GripVertical } from "lucide-react";

const formatTableDate = (date: string) => dayjs(date).format("YYYY.MM.DD");

interface FaqColumnHandlers {
  onEdit: (faq: Faq) => void;
  onDelete: (faq: Faq) => void;
}

/**
 * 시안 컬럼 폭 — 순서 52px / 카테고리 13% / 질문 auto / 등록일 10% / 수정일 10% / 관리 13%.
 * `Table`이 `fitWidth`에서 측정 너비를 %로 환산하므로 합이 1000이 되도록 비례 값을 준다.
 *
 * 순서 컬럼이 맨 앞, 관리 컬럼이 맨 뒤인 건 시안의 결정이다 — 끌 대상을 먼저 잡는 순서이고,
 * 삭제 버튼과 물리적으로 떨어뜨려 오조작을 줄인다. 두 컬럼을 붙이지 말 것.
 */
export const createFaqListColumns = (
  handlers: FaqColumnHandlers
): Columns<Faq> => [
  {
    key: "number",
    label: "순서",
    width: 45,
    align: "center",
    preventRowClick: true,
    render: (_value, _record, _index, options) => (
      <button
        type="button"
        aria-label="FAQ 순서 변경"
        className="flex items-center justify-center rounded-[4px] p-1 text-sz-n-400 hover:bg-sz-n-100 hover:text-sz-n-700 cursor-grab active:cursor-grabbing"
        {...options?.dragHandleProps}
      >
        <GripVertical className="size-4" />
      </button>
    ),
  },
  {
    key: "categoryDisplayName",
    label: "카테고리",
    width: 130,
    // 카테고리는 상태값이 아니므로 중립·점 없음(시안 `.badge.nodot`)
    render: (value) => (
      <StatusBadge variant="neutral" hideDot>
        {value as string}
      </StatusBadge>
    ),
  },
  {
    key: "question",
    label: "질문",
    width: 495,
    /*
      시안은 질문 한 줄만 말줄임으로 보여준다. 답변을 아래 줄에 함께 깔면 행 높이가
      50px을 넘어 목록 스캔이 느려지고, 답변 전문은 수정 모달에서 어차피 본다.
    */
    render: (value) => (
      <span className="block truncate text-[13px] font-medium text-sz-n-900">
        {value as string}
      </span>
    ),
  },
  {
    key: "createdAt",
    label: "등록일",
    width: 100,
    align: "center",
    render: (value) => (
      <span className="text-[11px] tabular-nums text-sz-n-500">
        {formatTableDate(value as string)}
      </span>
    ),
  },
  {
    key: "modifiedAt",
    label: "수정일",
    width: 100,
    align: "center",
    render: (value) => (
      <span className="text-[11px] tabular-nums text-sz-n-500">
        {formatTableDate(value as string)}
      </span>
    ),
  },
  {
    key: "virtual",
    label: "관리",
    width: 130,
    align: "center",
    // 행 클릭이 상세로 가지 않는 화면이지만, 버튼 영역은 명시적으로 막아 둔다
    preventRowClick: true,
    render: (_value, record) => (
      <div className="flex justify-center gap-1.5">
        <button
          type="button"
          onClick={() => handlers.onEdit(record)}
          className="inline-flex h-[26px] items-center rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[11px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100"
        >
          수정
        </button>
        <button
          type="button"
          onClick={() => handlers.onDelete(record)}
          className="inline-flex h-[26px] items-center rounded-[6px] border border-[#E9C9C9] bg-white px-2.5 text-[11px] font-medium text-sz-danger-text hover:bg-sz-danger-bg"
        >
          삭제
        </button>
      </div>
    ),
  },
];
