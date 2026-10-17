import {
  REFUND_PAGE_SIZES,
  REFUND_SORT_OPTIONS,
  SELECT_CHEVRON_STYLE,
} from "@/features/refund/constants/params";
import type {
  RefundSort,
  RefundTab,
  RefundTabStat,
} from "@/features/refund/types";
import { formatAmount, formatPeriod } from "@/features/refund/utils/format";

const SELECT_SM_CLASS =
  "h-7 cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[26px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

const TAB_LABEL: Record<RefundTab, string> = {
  PENDING: "집행 대기",
  FAILED: "실패",
  DONE: "완료",
};

interface RefundTableBarProps {
  tab: RefundTab;
  /** 요약 API의 그 탭 통계 — 탭 전체 기준이다(검색 · 경로 조건과 무관) */
  stat: RefundTabStat | undefined;
  sort: RefundSort;
  size: number;
  onSortChange: (sort: RefundSort) => void;
  onSizeChange: (size: number) => void;
}

/**
 * 시안 `.tbar` — 왼쪽 요약 줄은 탭마다 다르다.
 *   집행 대기  「집행 대기 1건 · 27,200원」
 *   실패       「실패 1건 · 27,200원 · 소비자 대기 2일」
 *   완료       「완료 38건 · 최근 1개월 · PG 자동 36 · 운영자 사유 2」
 */
export default function RefundTableBar(props: RefundTableBarProps) {
  const { tab, stat, sort, size, onSortChange, onSizeChange } = props;

  return (
    <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
      <div className="text-[12px] text-sz-n-600">
        {stat && (
          <>
            {TAB_LABEL[tab]} <b className="text-sz-n-900">{stat.count}</b>건
            {tab === "DONE" ? (
              <span className="text-[11px] text-sz-n-500">
                {[
                  stat.days !== null ? formatPeriod(stat.days) : null,
                  `PG 자동 ${stat.byOrigin?.PG_AUTO ?? 0}`,
                  `운영자 사유 ${stat.byOrigin?.OPERATOR ?? 0}`,
                ]
                  .filter(Boolean)
                  .map((part) => ` · ${part}`)
                  .join("")}
              </span>
            ) : (
              <>
                {" · "}
                <b className="tabular-nums text-sz-n-900">
                  {formatAmount(stat.amount)}
                </b>
                원
                {tab === "FAILED" && stat.oldestWaitingDays !== null && (
                  <>
                    {" · 소비자 대기 "}
                    <b className="text-sz-n-900">{stat.oldestWaitingDays}일</b>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <select
          aria-label="정렬"
          className={SELECT_SM_CLASS}
          style={SELECT_CHEVRON_STYLE}
          value={sort}
          onChange={(event) => onSortChange(event.target.value as RefundSort)}
        >
          {REFUND_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label="표시 건수"
          className={SELECT_SM_CLASS}
          style={SELECT_CHEVRON_STYLE}
          value={size}
          onChange={(event) => onSizeChange(Number(event.target.value))}
        >
          {REFUND_PAGE_SIZES.map((value) => (
            <option key={value} value={value}>
              {value}건씩
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
