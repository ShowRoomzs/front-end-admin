import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface DetailColumn<T> {
  key: string;
  label: string;
  /** px — 비우면 남은 폭 */
  width?: number;
  align?: "left" | "center" | "right";
  render: (row: T) => ReactNode;
}

interface DetailTableProps<T> {
  columns: Array<DetailColumn<T>>;
  rows: Array<T>;
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  /**
   * `basic` = 시안 `.tb-inf`(연결 인플루언서 · 최근 문의 — 본문 14px 16px · 행높이 50px)
   * `compact` = `.tb-stl` · `.tb-ctr`(최근 정산 · 계약 — 머리 n-50 · 본문 12px 10px)
   */
  variant?: "basic" | "compact";
}

const ALIGN = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

/** 상세 카드 안의 작은 표 — 행 전체 클릭으로 다른 상세로 간다 */
export default function DetailTable<T>(props: DetailTableProps<T>) {
  const { columns, rows, rowKey, onRowClick, variant = "basic" } = props;
  const compact = variant === "compact";

  return (
    <table className="w-full table-fixed border-collapse">
      <thead>
        <tr>
          {columns.map((column, index) => (
            <td
              key={column.key}
              style={column.width ? { width: column.width } : undefined}
              className={cn(
                "whitespace-nowrap border-b border-sz-n-200 text-[11px] text-sz-n-600",
                compact
                  ? "bg-sz-n-50 px-2.5 py-[9px] font-semibold"
                  : "bg-sz-n-100 px-4 py-2.5 font-medium",
                compact && index === 0 && "pl-4",
                compact && index === columns.length - 1 && "pr-4",
                ALIGN[column.align ?? "left"]
              )}
            >
              {column.label}
            </td>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              "group",
              onRowClick && "cursor-pointer",
              compact ? "hover:bg-sz-n-50" : "hover:bg-sz-accent-50"
            )}
          >
            {columns.map((column, index) => (
              <td
                key={column.key}
                className={cn(
                  "align-middle text-[12px] text-sz-n-900",
                  compact
                    ? "border-b border-sz-n-100 px-2.5 py-3 group-last:border-b-0"
                    : "h-[50px] border-t border-sz-n-100 px-4 py-3.5 group-first:border-t-0",
                  compact && index === 0 && "pl-4",
                  compact && index === columns.length - 1 && "pr-4",
                  ALIGN[column.align ?? "left"]
                )}
              >
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
