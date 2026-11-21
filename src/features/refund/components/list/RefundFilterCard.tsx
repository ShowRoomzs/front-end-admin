import {
  SELECT_TOOLBAR_CLASS,
  TAB_CLASS,
  TAB_ON_CLASS,
} from "@/common/constants/dsStyle";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/common/constants/selectStyle";
import Btn from "@/features/refund/components/shared/Btn";
import {
  REFUND_ROUTE_OPTIONS,
  REFUND_TABS,
} from "@/features/refund/constants/params";
import type {
  RefundRouteFilter,
  RefundSummary,
  RefundTab,
} from "@/features/refund/types";
import { cn } from "@/lib/utils";

interface RefundFilterCardProps {
  tab: RefundTab;
  /** 서버 요약 `tabs` — 아직 없으면 칩을 그리지 않는다(0으로 거짓 표시하지 않는다) */
  tabs: RefundSummary["tabs"] | undefined;
  /** 입력 중인 값 — [검색]을 눌러야 목록에 반영된다 */
  route: RefundRouteFilter;
  keyword: string;
  onTabChange: (tab: RefundTab) => void;
  onRouteChange: (route: RefundRouteFilter) => void;
  onKeywordChange: (keyword: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

/** 시안 `.filter` — 탭 3종(좌) + 경로 셀렉트 · 검색어 · [검색] [초기화](우)를 한 흰 카드에 담는다 */
export default function RefundFilterCard(props: RefundFilterCardProps) {
  const {
    tab,
    tabs,
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
          const count = tabs?.[item.value]?.count;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(item.value)}
              className={cn(
                TAB_CLASS,
                "flex items-center gap-1.5",
                isActive && TAB_ON_CLASS
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

      {/* 시안 `.search` — 셀렉트 · 입력 · 버튼 모두 32px(세 앱 합의 11-21) */}
      <form
        className="flex items-start gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <select
          aria-label="경로"
          className={cn(SELECT_TOOLBAR_CLASS, "w-[104px]")}
          style={MODAL_SELECT_CHEVRON_STYLE}
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
