import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type { Columns } from "@/common/components/Table/types";
import Btn from "@/features/refund/components/shared/Btn";
import type { RefundListItem } from "@/features/refund/types";
import {
  formatAmount,
  formatMonthDayTime,
  paymentText,
} from "@/features/refund/utils/format";

interface ColumnHandlers {
  onExecute: (record: RefundListItem) => void;
  onRetry: (record: RefundListItem) => void;
}

/** 상태 배지 아래 한 줄 — 편입자 · 집행자 · 실패 원인(시안 `.t-note`) */
function statusNote(record: RefundListItem) {
  if (record.status === "PENDING" && record.enrolledBy) {
    return {
      text: `편입 ${formatMonthDayTime(record.occurredAt)} · ${record.enrolledBy}`,
      danger: false,
    };
  }
  if (record.status === "FAILED" && record.failureLabel) {
    return {
      text: `${record.failureLabel} · 재시도 ${record.autoRetryCount ?? 0}회 실패`,
      danger: true,
    };
  }
  if (record.status === "DONE" && record.executedBy) {
    return { text: `집행 ${record.executedBy} · 재확인`, danger: false };
  }
  return null;
}

/**
 * 시안 A1~A3 열 — 환불번호 · 주문번호 · 경로 · 출처 · 브랜드 · 결제 · 환불액 · 상태 · 일시 · 관리.
 * 시안은 상태 열이 남는 폭을 먹지만 `fitWidth`는 비율로 나누므로 열마다 폭을 준다.
 * 시안 경로 열(130)은 「반품 · 일부 반려 · CLM-3002」가 출처 배지와 겹쳐 넓혔고(180),
 * 공용 Table 셀 여백(좌우 16)이 시안(10)보다 넓어 결제·브랜드도 그만큼 늘렸다.
 */
export function createRefundColumns(
  handlers: ColumnHandlers
): Columns<RefundListItem> {
  return [
    {
      key: "refundNumber",
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
        <span className="whitespace-nowrap text-[12px] tabular-nums">
          {value as string}
        </span>
      ),
    },
    {
      key: "routeLabel",
      label: "경로",
      width: 180,
      render: (_value, record) => (
        <span
          className="block truncate text-[12px]"
          title={[record.routeLabel, record.routeDetail]
            .filter(Boolean)
            .join(" · ")}
        >
          {record.routeLabel}
          {/* 시안 `.t-sub` — 값 옆에 붙는 보조 문구 */}
          {record.routeDetail && (
            <span className="text-[11px] text-sz-n-500">{` · ${record.routeDetail}`}</span>
          )}
        </span>
      ),
    },
    {
      key: "source",
      label: "출처",
      width: 100,
      align: "center",
      render: (value) =>
        value === "OPERATOR" ? (
          <StatusBadge variant="warning" hideDot>
            운영자 사유
          </StatusBadge>
        ) : (
          <StatusBadge variant="neutral" hideDot>
            PG 자동
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
      key: "paymentMethod",
      label: "결제",
      width: 116,
      align: "center",
      render: (_value, record) => (
        <span className="whitespace-nowrap text-[12px]">
          {paymentText(record.paymentMethod, record.paymentScope)}
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
      render: (_value, record) => {
        const note = statusNote(record);
        return (
          // 시안 행은 배지 + 한 줄 메모로 65px 안팎이다 — 공용 Table 행(50px)에 위아래 여백을 보태 맞춘다
          <div className="flex flex-col items-center py-1.5">
            {record.status === "PENDING" && (
              <StatusBadge variant="warning">집행 대기</StatusBadge>
            )}
            {record.status === "FAILED" && (
              <StatusBadge variant="danger">환불 실패</StatusBadge>
            )}
            {record.status === "DONE" && (
              <StatusBadge variant="success">환불 완료</StatusBadge>
            )}
            {note && (
              <span
                className={`mt-[3px] whitespace-nowrap text-[11px] font-medium leading-[1.6] ${note.danger ? "text-sz-danger-text" : "text-sz-n-900"}`}
              >
                {note.text}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "occurredAt",
      label: "일시",
      width: 100,
      align: "center",
      render: (value) => (
        <span className="whitespace-nowrap text-[12px] tabular-nums">
          {formatMonthDayTime(value as string)}
        </span>
      ),
    },
    {
      key: "refundId",
      label: "관리",
      width: 92,
      align: "center",
      // 버튼을 눌렀을 때 행 클릭으로 번지지 않게 한다(행 자체는 눌러도 아무 일 없지만 규약을 지킨다)
      preventRowClick: true,
      render: (_value, record) => {
        if (record.status === "PENDING") {
          return (
            <Btn
              variant="primary"
              small
              onClick={() => handlers.onExecute(record)}
            >
              집행
            </Btn>
          );
        }
        if (record.status === "FAILED") {
          return (
            <Btn small onClick={() => handlers.onRetry(record)}>
              재시도
            </Btn>
          );
        }
        return <span className="text-sz-n-400">—</span>;
      },
    },
  ];
}
