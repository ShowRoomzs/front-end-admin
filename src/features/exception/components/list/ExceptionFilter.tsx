import {
  BTN_SECONDARY,
  INPUT_CLASS,
  SELECT_SM_CLASS,
} from "@/features/exception/components/shared/styles";
import {
  EXCEPTION_TABS,
  SELECT_CHEVRON_STYLE,
} from "@/features/exception/constants/params";
import type {
  ExceptionTab,
  ExceptionTypeFilter,
} from "@/features/exception/types";
import { cn } from "@/lib/utils";

export interface TypeOption {
  value: Exclude<ExceptionTypeFilter, "">;
  label: string;
  /** 요약 건수 — 아직 못 받았으면 숫자를 붙이지 않는다 */
  count: number | undefined;
}

interface ExceptionFilterProps {
  tab: ExceptionTab;
  /** 탭 카운트 — 못 받았으면(준비 중 · 로딩) 칩을 그리지 않는다. 0으로 보이면 거짓말이다 */
  tabCounts: Partial<Record<ExceptionTab, number>> | undefined;
  onTabChange: (tab: ExceptionTab) => void;
  typeValue: ExceptionTypeFilter;
  typeOptions: TypeOption[];
  onTypeChange: (type: ExceptionTypeFilter) => void;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

/**
 * 시안 `.filter` — 탭 둘(처리 지연 · 배송 예외, 카운트 칩) + 유형 셀렉트 · 검색어 · [검색] · [초기화].
 * 유형 셀렉트의 괄호 숫자(「발송 기한 경과 2」)는 탭 안의 유형별 건수다.
 */
export default function ExceptionFilter(props: ExceptionFilterProps) {
  const {
    tab,
    tabCounts,
    onTabChange,
    typeValue,
    typeOptions,
    onTypeChange,
    keyword,
    onKeywordChange,
    onSearch,
    onReset,
  } = props;

  return (
    <div className="mb-4 flex shrink-0 items-center justify-between gap-4 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3">
      <div className="flex" role="tablist">
        {EXCEPTION_TABS.map((item) => {
          const isActive = item.value === tab;
          const count = tabCounts?.[item.value];
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
                  : "border-transparent text-sz-n-500"
              )}
            >
              {item.label}
              {count !== undefined && (
                <span
                  className={cn(
                    "rounded-[8px] px-[5px] text-[10px] font-normal",
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

      {/* 시안 `.search` — 셀렉트(28px)는 32px 줄의 위쪽에 붙는다(align-items 기본값 stretch + 고정 높이) */}
      <div className="flex items-start gap-1.5">
        <select
          aria-label="유형"
          className={cn(SELECT_SM_CLASS, "w-[150px]")}
          style={SELECT_CHEVRON_STYLE}
          value={typeValue}
          onChange={(event) =>
            onTypeChange(event.target.value as ExceptionTypeFilter)
          }
        >
          <option value="">유형 전체</option>
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.count === undefined
                ? option.label
                : `${option.label} ${option.count}`}
            </option>
          ))}
        </select>
        <input
          className={cn(INPUT_CLASS, "w-[210px]")}
          placeholder="주문번호 · 접수번호 · 브랜드명"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearch();
            }
          }}
        />
        <button type="button" className={BTN_SECONDARY} onClick={onSearch}>
          검색
        </button>
        <button type="button" className={BTN_SECONDARY} onClick={onReset}>
          초기화
        </button>
      </div>
    </div>
  );
}
