import type { Columns } from "@/common/components/Table/types";
import type { Faq } from "@/features/faq/types/faq";
import dayjs from "dayjs";

interface CreateFaqListColumnsParams {
  page: number;
  size: number;
}

const formatTableDate = (date: string) => dayjs(date).format("YYYY.MM.DD");

export const createFaqListColumns = (
  params: CreateFaqListColumnsParams
): Columns<Faq> => [
  {
    key: "number",
    label: "순서",
    width: 80,
    align: "center",
    render: (_value, _record, index) =>
      (Number(params.page) - 1) * Number(params.size) + index + 1,
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
