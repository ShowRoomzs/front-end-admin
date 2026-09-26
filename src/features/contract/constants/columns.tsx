import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type { Columns } from "@/common/components/Table/types";
import { formatDateTimeShort } from "@/common/utils/formatDate";
import type { AdminContractListItem } from "@/features/contract/types";
import { periodText } from "@/features/contract/utils/format";
import { toneToVariant } from "@/features/contract/utils/statusBadge";

/**
 * 시안 A1 열 — 공구명 · 브랜드 126 · 인플루언서 122 · 상품 수 66 · 공구 기간 246 ·
 * 검토 요청 116 · 상태 126. 운영자는 **양측이 다 보여야** 누구의 계약인지 안다
 * (파트너는 「계약 상대」, 스튜디오는 「브랜드」 1열).
 * `fitWidth`가 너비를 비율로 환산하므로 공구명에도 남는 폭(226)을 준다.
 */
export const CONTRACT_COLUMNS: Columns<AdminContractListItem> = [
  {
    key: "title",
    label: "공구명",
    width: 226,
    render: (value) => {
      const title = value as string | null;
      return title ? (
        <span className="block truncate text-[12px] font-medium text-sz-n-900">
          {title}
        </span>
      ) : (
        <span className="text-[12px] text-sz-n-400">(공구명 미입력)</span>
      );
    },
  },
  {
    key: "brandName",
    label: "브랜드",
    width: 126,
    render: (value) => (
      <span className="block truncate text-[12px] text-sz-n-900">
        {value as string}
      </span>
    ),
  },
  {
    key: "creatorName",
    label: "인플루언서",
    width: 122,
    render: (value) => (
      <span className="block truncate text-[12px] text-sz-n-900">
        {(value as string | null) ?? "—"}
      </span>
    ),
  },
  {
    key: "itemCount",
    label: "상품 수",
    width: 66,
    align: "center",
    render: (value) => (
      <span className="text-[12px] tabular-nums">{value as number}</span>
    ),
  },
  {
    key: "startAt",
    label: "공구 기간",
    width: 246,
    align: "center",
    render: (_value, record) => {
      const text = periodText(record.startAt, record.endAt);
      return (
        <span className="whitespace-nowrap text-[12px] tabular-nums text-sz-n-500">
          {text ?? "미설정"}
        </span>
      );
    },
  },
  {
    key: "reviewRequestedAt",
    label: "검토 요청",
    width: 116,
    align: "center",
    render: (value) => (
      <span className="whitespace-nowrap text-[12px] tabular-nums text-sz-n-500">
        {formatDateTimeShort(value as string | null)}
      </span>
    ),
  },
  {
    key: "statusLabel",
    label: "상태",
    width: 126,
    align: "center",
    render: (_value, record) => (
      <StatusBadge variant={toneToVariant(record.statusTone)}>
        {record.statusLabel}
      </StatusBadge>
    ),
  },
];
