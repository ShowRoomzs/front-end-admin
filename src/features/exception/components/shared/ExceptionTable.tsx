import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface ExceptionColumn<T> {
  key: string;
  label: string;
  /** px — 비워 두면 남는 폭을 가져간다(시안의 마지막 가변 열) */
  width?: number;
  align?: "left" | "center";
  /** 가변 열은 좁은 화면에서 줄바꿈을 허용한다 — 시안 표는 nowrap이지만 1280px에서 잘리지 않게 */
  wrap?: boolean;
  render: (row: T) => ReactNode;
}

interface ExceptionTableProps<T> {
  columns: Array<ExceptionColumn<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick: (row: T) => void;
}

/**
 * 시안 `.tcard table` — 고정 레이아웃 · 머리글 11px/600 · 본문 12px · 행 50px · 첫·끝 열 안쪽 여백 20px.
 *
 * 공용 `Table`을 쓰지 않는 이유: 이 시안(06 거래 관리 계열)은 머리글 배경이 `--n-50`이고 셀 좌우 여백이 10px이며,
 * 마지막 열(다음 단계 · 처리 주체)만 가변이다. 공용 Table(fitWidth)은 모든 열을 같은 비율로 줄여
 * 1280px에서 대상번호·기한 열이 먼저 잘린다.
 * 행 전체가 [열기]와 같은 곳으로 간다 — 시안 `tbody tr{cursor:pointer}`.
 */
export default function ExceptionTable<T>(props: ExceptionTableProps<T>) {
  const { columns, rows, rowKey, onRowClick } = props;
  const lastIndex = columns.length - 1;

  return (
    <table className="w-full table-fixed border-collapse">
      <colgroup>
        {columns.map((column) => (
          <col
            key={column.key}
            style={column.width ? { width: column.width } : undefined}
          />
        ))}
      </colgroup>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th
              key={column.key}
              scope="col"
              className={cn(
                "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-50 px-2.5 py-[9px] text-[11px] font-semibold leading-[1.6] text-sz-n-600",
                column.align === "center" ? "text-center" : "text-left",
                index === 0 && "pl-5",
                index === lastIndex && "pr-5"
              )}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={rowKey(row)}
            onClick={() => onRowClick(row)}
            className="group cursor-pointer hover:bg-sz-n-50"
          >
            {columns.map((column, index) => (
              <td
                key={column.key}
                className={cn(
                  "h-[50px] border-b border-sz-n-100 px-2.5 py-[11px] align-middle text-[12px] leading-[1.6] text-sz-n-900 group-last:border-b-0",
                  column.align === "center" ? "text-center" : "text-left",
                  column.wrap
                    ? "whitespace-normal"
                    : "overflow-hidden text-ellipsis whitespace-nowrap",
                  index === 0 && "pl-5",
                  index === lastIndex && "pr-5"
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
