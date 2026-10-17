import Btn from "@/features/refund/components/shared/Btn";
import {
  REFUND_ROUTE_OPTIONS,
  REFUND_TABS,
  SELECT_CHEVRON_STYLE,
} from "@/features/refund/constants/params";
import type {
  RefundRouteFilter,
  RefundStatus,
  RefundSummary,
} from "@/features/refund/types";
import { cn } from "@/lib/utils";

interface RefundFilterCardProps {
  tab: RefundStatus;
  /** 서버가 내린 탭 카운트 — 아직 없으면 칩을 그리지 않는다(0으로 거짓 표시하지 않는다) */
  counts: RefundSummary["tabCounts"] | undefined;
  /** 입력 중인 값 — [검색]을 눌러야 목록에 반영된다 */
  route: RefundRouteFilter;
  keyword: string;
  onTabChange: (tab: RefundStatus) => void;
  onRouteChange: (route: RefundRouteFilter) => void;
  onKeywordChange: (keyword: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

/** 시안 `.filter` — 탭 3종(좌) + 경로 셀렉트 · 검색어 · [검색] [초기화](우)를 한 흰 카드에 담는다 */
export default function RefundFilterCard(props: RefundFilterCardProps) {
  const {
    tab,
    counts,
    route,
    keyword,
    onTabChange,
    onRouteChange,
    onKeywordChange,
    onSearch,
    onReset,
  } = props;

  return (
    <div className="mb-4 flex shrink-0 items-center justify-between gap-4 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3">
      <div className="flex" role="tablist">
        {REFUND_TABS.map((item) => {
          const isActive = item.value === tab;
          const count = counts?.[item.value];
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(item.value)}
              className={cn(
                "mr-5 flex cursor-pointer items-center gap-1.5 border-b-2 px-0.5 py-1.5 text-[12px] leading-[1.6]",
                isActive
                  ? "border-sz-accent-500 font-medium text-sz-accent-500"
                  : "border-transparent text-sz-n-500 hover:text-sz-n-700"
              )}
            >
              {item.label}
              {count !== undefined && (
                <span
                  className={cn(
                    "rounded-[8px] px-[5px] text-[10px] leading-[1.6]",
                    isActive
                      ? "bg-sz-accent-50 text-sz-accent-600"
                      : "bg-sz-n-100 text-sz-n-600"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 시안 `.search` — 셀렉트(28px)는 자기 높이대로 윗줄에 붙고 입력·버튼(32px)이 줄 높이를 정한다 */}
      <form
        className="flex items-start gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <select
          aria-label="경로"
          className="h-7 w-[104px] cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[26px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          style={SELECT_CHEVRON_STYLE}
          value={route}
          onChange={(event) =>
            onRouteChange(event.target.value as RefundRouteFilter)
          }
        >
          {REFUND_ROUTE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          aria-label="검색어"
          className="h-8 w-[220px] rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-1.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          placeholder="환불번호 · 주문번호 · PG 거래번호"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
        />
        <Btn type="submit">검색</Btn>
        <Btn onClick={onReset}>초기화</Btn>
      </form>
    </div>
  );
}
