import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import {
  HOME_COPY,
  MENU_LABEL,
  URGENCY_VARIANT,
} from "@/features/home/constants/labels";
import type { AdminHomeTodo, AdminHomeTodoRow } from "@/features/home/types";
import { todoRowPath } from "@/features/home/utils/target";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

const TH =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-100 px-4 py-[10px] text-[11px] font-medium text-sz-n-600";

/** 시안 `.tcard` 껍데기 — 할 일 표 · 빈 상태 · 로딩 · 실패가 같은 카드 안에 그려진다 */
export function TodoCard(props: {
  summary: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex items-center justify-between border-b border-sz-n-200 px-4 py-[10px]">
        <div className="text-[12px] text-sz-n-600 [&_b]:text-sz-n-900">
          {props.summary}
        </div>
        {props.right && (
          <div className="flex items-center gap-2 text-[11px] text-sz-n-500">
            {props.right}
          </div>
        )}
      </div>
      {props.children}
    </div>
  );
}

/** tbar-l 요약 — 「할 일 38건 · 실패 2 · 기한 초과 1 · 기한 임박 3 · 대기 32 · 오늘 처리 6건」 */
export function TodoSummary(props: { todo: AdminHomeTodo }) {
  const { todo } = props;
  const processed = (
    <span title={todo.note}>
      오늘 처리 <b>{todo.processedToday}</b>건
    </span>
  );
  if (todo.total === 0) {
    return (
      <>
        할 일 <b>0</b>건 · {processed}
      </>
    );
  }
  return (
    <>
      할 일 <b>{todo.total}</b>건 · 실패 <b>{todo.failed}</b> · 기한 초과{" "}
      <b>{todo.overdue}</b> · 기한 임박 <b>{todo.dueSoon}</b> · 대기{" "}
      <b>{todo.waiting}</b> · {processed}
    </>
  );
}

function isWaiting(row: AdminHomeTodoRow) {
  return row.urgency === "WAITING";
}

/** 경과 · 기한 칸 — 기한이 있으면 기한이 위, 경과가 아래. 대기 행은 가장 오래된 건의 경과 */
function AgeCell(props: { row: AdminHomeTodoRow }) {
  const { row } = props;
  if (row.dueText) {
    return (
      <>
        {row.dueText}
        {row.ageText && (
          <span className="mt-[2px] block text-[11px] text-sz-n-500">
            {row.ageText}
          </span>
        )}
      </>
    );
  }
  if (!row.ageText) return <span className="text-sz-n-400">—</span>;
  return (
    <>
      {row.ageText}
      {isWaiting(row) && (
        <span className="mt-[2px] block text-[11px] text-sz-n-500">
          {HOME_COPY.oldest}
        </span>
      )}
    </>
  );
}

/**
 * 할 일 표(H1) — 서버가 급한 순(실패 → 기한 초과 → 집행 대기 → 기한 임박 → 대기)으로 정렬해 내린다.
 * 행 클릭으로 해당 화면에 간다(DS §8 · 별도 버튼 없음). 대기 행은 보조 문구를 같은 줄에 붙여 한 줄로 줄인다.
 * 장애 배너가 떠 있으면(`compact`) 행 높이를 줄여 한 화면에 담는다(시안 `.main:has(.bn)`).
 */
export function TodoTable(props: {
  rows: Array<AdminHomeTodoRow>;
  compact: boolean;
}) {
  const { rows, compact } = props;
  const navigate = useNavigate();
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <td className={cn(TH, "w-24 text-center")}>상태</td>
          <td className={TH}>할 일</td>
          <td className={cn(TH, "w-24 text-center")}>메뉴</td>
          <td className={cn(TH, "w-24 text-right")}>경과 · 기한</td>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => {
          const waiting = isWaiting(row);
          const path = todoRowPath(row);
          const td = cn(
            "border-t border-sz-n-100 px-4 align-middle text-[12px] whitespace-nowrap group-first:border-t-0",
            waiting
              ? compact
                ? "h-[31px]"
                : "h-[34px]"
              : compact
                ? "h-[40px]"
                : "h-[42px]"
          );
          return (
            <tr
              key={`${row.queue}-${row.urgency}-${row.target.id ?? index}`}
              className={cn(
                "group hover:[&>td]:bg-sz-n-50",
                path && "cursor-pointer"
              )}
              onClick={path ? () => navigate(path) : undefined}
            >
              <td className={cn(td, "text-center")}>
                <StatusBadge
                  variant={
                    URGENCY_VARIANT[
                      row.urgency as keyof typeof URGENCY_VARIANT
                    ] ?? "info"
                  }
                >
                  {row.badge}
                </StatusBadge>
              </td>
              <td
                className={cn(
                  td,
                  "font-medium whitespace-normal text-sz-n-900",
                  waiting ? "text-[12px]" : "text-[13px]"
                )}
              >
                {row.title}
                {waiting && (
                  <span className="tabular-nums"> {row.count}건</span>
                )}
                <span
                  className={cn(
                    "text-[11px] font-normal text-sz-n-500",
                    waiting ? "ml-1.5 inline" : "mt-[2px] block"
                  )}
                >
                  {row.detail ?? (waiting ? "—" : null)}
                </span>
              </td>
              <td className={cn(td, "text-center")}>
                {MENU_LABEL[row.menu as keyof typeof MENU_LABEL] ?? row.menu}
              </td>
              <td className={cn(td, "text-right tabular-nums")}>
                <AgeCell row={row} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** H2 — DS 빈 상태(.empty) 그대로 */
export function TodoEmpty() {
  return (
    <div className="px-6 py-[72px] text-center">
      <div className="mb-2.5 text-[28px] text-sz-n-300">✓</div>
      <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
        {HOME_COPY.emptyTitle}
      </div>
      <div className="text-[12px] text-sz-n-500">{HOME_COPY.emptyDesc}</div>
    </div>
  );
}
