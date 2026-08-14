import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type { Columns } from "@/common/components/Table/types";
import { formatDateTimeShort } from "@/common/utils/formatDate";
import { CHANGE_REQUEST_TYPE_LABELS } from "@/features/changeRequest/constants/params";
import type { ChangeRequestInfo } from "@/features/changeRequest/services/changeRequestService";
import { getChangeRequestStatusBadge } from "@/features/changeRequest/utils/statusBadge";

/**
 * 시안 고정 너비 23 / 14 / 18 / 18 / 11 / 16 %.
 *
 * `Table`이 `fitWidth`에서 측정 너비를 %로 환산하므로, 합이 1000이 되도록 비례 값을 주면
 * 그대로 시안 비율이 나온다. 일부만 지정하면 나머지가 실제 내용 폭으로 측정돼 비율이 깨진다.
 */
export const CHANGE_REQUEST_COLUMNS: Columns<ChangeRequestInfo> = [
  {
    key: "brandName",
    // 시안은 좌우 끝 셀에 여백 20px을 더한다(공용 Table은 px-4 고정)
    label: <span className="pl-1">브랜드</span>,
    width: 230,
    render: (value) => (
      <span className="pl-1 text-[13px] font-medium text-sz-n-900">
        {value as string}
      </span>
    ),
  },
  {
    key: "type",
    label: "요청 유형",
    align: "center",
    width: 140,
    render: (value) => (
      <StatusBadge variant="neutral" hideDot>
        {CHANGE_REQUEST_TYPE_LABELS[value as ChangeRequestInfo["type"]]}
      </StatusBadge>
    ),
  },
  {
    key: "requestedAt",
    label: "요청일시",
    align: "center",
    width: 180,
    render: (value) => (
      <span className="text-[11px] tabular-nums text-sz-n-500">
        {formatDateTimeShort(value as string)}
      </span>
    ),
  },
  {
    key: "processedAt",
    label: "승인·반려일시",
    align: "center",
    width: 180,
    render: (value) => {
      const processedAt = value as string | null;
      if (!processedAt) {
        return <span className="text-[11px] text-sz-n-500">—</span>;
      }
      return (
        <span className="text-[11px] tabular-nums text-sz-n-500">
          {formatDateTimeShort(processedAt)}
        </span>
      );
    },
  },
  {
    key: "elapsedText",
    label: "경과",
    align: "center",
    width: 110,
    // 서버가 문구까지 만들어 내려준다 — 처리 완료 건은 null
    render: (value, record) => {
      const elapsedText = value as string | null;
      if (!elapsedText) {
        return <span className="tabular-nums">—</span>;
      }
      return (
        <span
          className={`tabular-nums ${
            record.slaExceeded ? "font-semibold text-sz-warning-text" : ""
          }`}
        >
          {elapsedText}
        </span>
      );
    },
  },
  {
    key: "status",
    label: "상태",
    align: "center",
    width: 160,
    render: (_value, record) => {
      const { variant, label } = getChangeRequestStatusBadge(
        record.status,
        record.slaExceeded
      );
      return <StatusBadge variant={variant}>{label}</StatusBadge>;
    },
  },
];
