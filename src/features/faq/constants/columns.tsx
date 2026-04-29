import type { Columns } from "@/common/components/Table/types";
import type { Faq } from "@/features/faq/types/faq";
import dayjs from "dayjs";
import { GripVertical } from "lucide-react";

const formatTableDate = (date: string) => dayjs(date).format("YYYY.MM.DD");

export const createFaqListColumns = (): Columns<Faq> => [
  {
    key: "number",
    label: "순서",
    width: 80,
    align: "center",
    preventRowClick: true,
    render: (_value, _record, _index, options) => (
      <button
        type="button"
        aria-label="FAQ 순서 변경"
        className="flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing"
        {...options?.dragHandleProps}
      >
        <GripVertical className="size-4" />
      </button>
    ),
  },
  {
    key: "categoryDisplayName",
    label: "카테고리",
    width: 160,
  },
  {
    key: "question",
    label: "질문/답변",
    width: 720,
    render: (_value, record) => (
      <div className="flex flex-col gap-1">
        <p className="font-medium text-slate-900">{record.question}</p>
        <p className="text-sm text-slate-500">{record.answer}</p>
      </div>
    ),
  },
  {
    key: "createdAt",
    label: "등록일",
    width: 140,
    align: "center",
    render: (value) => formatTableDate(value as string),
  },
  {
    key: "modifiedAt",
    label: "수정일",
    width: 140,
    align: "center",
    render: (value) => formatTableDate(value as string),
  },
];
