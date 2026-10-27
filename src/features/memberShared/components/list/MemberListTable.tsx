import Pagination from "@/common/components/Pagination/Pagination";
import type { PaginationProps } from "@/common/components/Pagination/Pagination";
import { MEMBER_PAGE_SIZES } from "@/features/memberShared/constants/params";
import {
  SELECT_CHEVRON_STYLE,
  SELECT_SM_CLASS,
} from "@/features/memberShared/constants/styles";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface MemberListColumn<T> {
  key: string;
  label: string;
  /** px — 첫 열(이름)은 비워 남은 폭을 쓴다 */
  width?: number;
  render: (row: T) => ReactNode;
}

interface MemberListTableProps<T> {
  columns: Array<MemberListColumn<T>>;
  rows: Array<T>;
  rowKey: (row: T) => number;
  /** 탈퇴 승인 대기 상단 고정 행 — 경고 배경으로 「왜 위에 있는지」를 보인다 */
  isPinned: (row: T) => boolean;
  onRowClick: (row: T) => void;
  toolbar: ReactNode;
  size: number;
  onSizeChange: (size: number) => void;
  pageInfo: PaginationProps;
  isLoading: boolean;
  emptyState: ReactNode;
}

/**
 * 시안 `.tcard` + `.tb-brd` / `.tb-inf` — 회원 목록 표.
 * 본문 셀 14px 20px · 행높이 50px 균일(시안 규격 정합). 첫 열만 왼쪽 정렬, 나머지는 가운데.
 * 공용 Table은 행마다 배경을 바꿀 수 없어(상단 고정 행) 따로 둔다.
 */
export default function MemberListTable<T>(props: MemberListTableProps<T>) {
  const {
    columns,
    rows,
    rowKey,
    isPinned,
    onRowClick,
    toolbar,
    size,
    onSizeChange,
    pageInfo,
    isLoading,
    emptyState,
  } = props;

  return (
    <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
        <div className="text-[12px] text-sz-n-600">{toolbar}</div>
        <select
          aria-label="표시 건수"
          className={SELECT_SM_CLASS}
          style={{
            ...SELECT_CHEVRON_STYLE,
            backgroundPosition: "right 9px center",
          }}
          value={size}
          onChange={(event) => onSizeChange(Number(event.target.value))}
        >
          {MEMBER_PAGE_SIZES.map((option) => (
            <option key={option} value={option}>
              {option}건씩
            </option>
          ))}
        </select>
      </div>

      {/* 1280px 노트북처럼 좁은 화면에서는 표만 가로로 민다 — 행높이 50px(한 줄)을 지키려고 */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] table-fixed border-collapse">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <td
                  key={column.key}
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-100 px-5 py-2.5 text-[11px] font-medium text-sz-n-600",
                    index === 0 ? "text-left" : "text-center"
                  )}
                >
                  {column.label}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const pinned = isPinned(row);
              return (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick(row)}
                  className={cn(
                    "group cursor-pointer",
                    pinned
                      ? "bg-sz-warning-bg hover:bg-sz-warning-bg"
                      : "hover:bg-sz-accent-50"
                  )}
                >
                  {columns.map((column, index) => (
                    <td
                      key={column.key}
                      className={cn(
                        "h-[50px] whitespace-nowrap border-t border-sz-n-100 px-5 py-3.5 align-middle text-[12px] text-sz-n-900 group-first:border-t-0",
                        index === 0 ? "text-left" : "text-center"
                      )}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 &&
        (isLoading ? (
          <div className="px-6 py-[72px] text-center text-[12px] text-sz-n-500">
            불러오는 중…
          </div>
        ) : (
          emptyState
        ))}

      {rows.length > 0 && (
        <div className="flex justify-center border-t border-sz-n-200 p-3">
          <Pagination {...pageInfo} />
        </div>
      )}
    </div>
  );
}
