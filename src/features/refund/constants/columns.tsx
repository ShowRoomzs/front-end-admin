import StatusBadge, {
  type StatusBadgeVariant,
} from "@/common/components/StatusBadge/StatusBadge";
import type { Columns } from "@/common/components/Table/types";
import Btn from "@/features/refund/components/shared/Btn";
import type { RefundItem, RefundTaskStatus } from "@/features/refund/types";
import {
  formatAmount,
  formatMonthDayTime,
} from "@/features/refund/utils/format";

interface ColumnHandlers {
  onExecute: (record: RefundItem) => void;
  onRetry: (record: RefundItem) => void;
}

/** 상태 배지 색 — 문구는 서버 `statusLabel` */
const STATUS_VARIANT: Record<RefundTaskStatus, StatusBadgeVariant> = {
  PENDING: "warning",
  // 집행 대기 탭의 「환불 처리 중」 — PG 응답을 기다리는 중
  EXECUTING: "info",
  FAILED: "danger",
  DONE: "success",
  VOID: "neutral",
};

/**
 * 시안 A1~A3 열 — 환불번호 · 주문번호 · 경로 · 출처 · 브랜드 · 결제 · 환불액 · 상태 · 일시 · 관리.
 * 문구는 전부 서버 라벨(`sourceLabel` · `originLabel` · `paymentLabel` · `statusLabel` · `statusNote`)이다.
 * 시안은 상태 열이 남는 폭을 먹지만 `fitWidth`는 비율로 나누므로 열마다 폭을 준다.
 * 시안 경로 열(130)은 「반품 · 일부 반려 · CLM-3002」가 출처 배지와 겹쳐 넓혔고(180),
 * 공용 Table 셀 여백(좌우 16)이 시안(10)보다 넓어 결제·브랜드도 그만큼 늘렸다.
 */
export function createRefundColumns(
  handlers: ColumnHandlers
): Columns<RefundItem> {
  return [
    {
      key: "refundNo",
      label: "환불번호",
      width: 92,
      render: (value) => (
        <span className="whitespace-nowrap text-[12px] tabular-nums">
          {value as string}
        </span>
      ),
    },
    {
      key: "orderNumber",
      label: "주문번호",
      width: 100,
      render: (value) => (
        <span
          className="block truncate text-[12px] tabular-nums"
          title={value as string}
        >
          {value as string}
        </span>
      ),
    },
    {
      key: "sourceLabel",
      label: "경로",
      width: 180,
      render: (_value, record) => (
        <span
          className="block truncate text-[12px]"
          title={[record.sourceLabel, record.sourceRef]
            .filter(Boolean)
            .join(" · ")}
        >
          {record.sourceLabel}
          {/* 시안 `.t-sub` — 값 옆에 붙는 보조 문구 */}
          {record.sourceRef && (
            <span className="text-[11px] text-sz-n-500">{` · ${record.sourceRef}`}</span>
          )}
        </span>
      ),
    },
    {
      key: "origin",
      label: "출처",
      width: 100,
      align: "center",
      render: (_value, record) => (
        <StatusBadge
          variant={record.origin === "OPERATOR" ? "warning" : "neutral"}
          hideDot
        >
          {record.originLabel}
        </StatusBadge>
      ),
    },
    {
      key: "brandName",
      label: "브랜드",
      width: 104,
      render: (value) => (
        <span className="block truncate text-[12px]" title={value as string}>
          {value as string}
        </span>
      ),
    },
    {
      key: "paymentLabel",
      label: "결제",
      width: 116,
      align: "center",
      render: (value) => (
        <span className="whitespace-nowrap text-[12px]">
          {(value as string | null) ?? <span className="text-sz-n-400">—</span>}
        </span>
      ),
    },
    {
      key: "amount",
      label: "환불액",
      width: 80,
      align: "right",
      render: (value) => (
        <span className="text-[12px] tabular-nums">
          {formatAmount(value as number)}
        </span>
      ),
    },
    {
      key: "status",
      label: "상태",
      width: 180,
      align: "center",
      render: (_value, record) => (
        // 시안 행은 배지 + 한 줄 메모로 65px 안팎이다 — 공용 Table 행(50px)에 위아래 여백을 보태 맞춘다
        <div className="flex flex-col items-center py-1.5">
          <StatusBadge variant={STATUS_VARIANT[record.status]}>
            {record.statusLabel}
          </StatusBadge>
          {record.statusNote && (
            <span
              className={`mt-[3px] max-w-full truncate whitespace-nowrap text-[11px] font-medium leading-[1.6] ${record.status === "FAILED" ? "text-sz-danger-text" : "text-sz-n-900"}`}
              title={record.statusNote}
            >
              {record.statusNote}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "displayAt",
      label: "일시",
      width: 100,
      align: "center",
      render: (value) => (
        <span className="whitespace-nowrap text-[12px] tabular-nums">
          {formatMonthDayTime(value as string | null)}
        </span>
      ),
    },
    {
      key: "refundTaskId",
      label: "관리",
      width: 92,
      align: "center",
      // 버튼을 눌렀을 때 행 클릭으로 번지지 않게 한다(행 자체는 눌러도 아무 일 없지만 규약을 지킨다)
      preventRowClick: true,
      render: (_value, record) => {
        // 처리 중(EXECUTING) · 결제 없는 주문은 서버가 `executable=false`로 내린다 — 버튼은 보이되 막는다
        if (record.status === "PENDING" || record.status === "EXECUTING") {
          return (
            <Btn
              variant="primary"
              small
              disabled={!record.executable}
              onClick={() => handlers.onExecute(record)}
            >
              집행
            </Btn>
          );
        }
        if (record.status === "FAILED") {
          return (
            <Btn
              small
              disabled={!record.executable}
              onClick={() => handlers.onRetry(record)}
            >
              재시도
            </Btn>
          );
        }
        return <span className="text-sz-n-400">—</span>;
      },
    },
  ];
}
