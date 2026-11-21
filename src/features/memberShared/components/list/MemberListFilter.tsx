import { TAB_CLASS, TAB_ON_CLASS } from "@/common/constants/dsStyle";
import { MEMBER_TABS } from "@/features/memberShared/constants/params";
import {
  BTN_SECONDARY,
  INPUT_CLASS,
} from "@/features/memberShared/constants/styles";
import type {
  MemberListSummary,
  MemberListTab,
} from "@/features/memberShared/types";
import { cn } from "@/lib/utils";

interface MemberListFilterProps {
  tab: MemberListTab;
  summary: MemberListSummary | undefined;
  keyword: string;
  placeholder: string;
  /** 시안 입력칸 폭 — 브랜드 200px · 인플루언서 240px */
  inputWidth: number;
  onTabChange: (tab: MemberListTab) => void;
  onKeywordChange: (keyword: string) => void;
  onSearch: () => void;
}

/** 시안 `.filter` — 탭 5종(건수 병기) + 검색 한 줄 */
export default function MemberListFilter(props: MemberListFilterProps) {
  const {
    tab,
    summary,
    keyword,
    placeholder,
    inputWidth,
    onTabChange,
    onKeywordChange,
    onSearch,
  } = props;

  return (
    <div className="mb-4 flex items-center justify-between gap-4 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3">
      <div className="flex">
        {MEMBER_TABS.map((item) => {
          const isActive = item.value === tab;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onTabChange(item.value)}
              className={cn(
                TAB_CLASS,
                "flex items-center gap-1.5",
                isActive && TAB_ON_CLASS
              )}
            >
              {item.label}
              <span
                className={cn(
                  "rounded-[8px] px-[5px] text-[10px] tabular-nums",
                  isActive
                    ? "bg-sz-accent-50 text-sz-accent-600"
                    : "bg-sz-n-100 text-sz-n-600"
                )}
              >
                {(summary?.[item.summaryKey] ?? 0).toLocaleString("ko-KR")}
              </span>
            </button>
          );
        })}
      </div>
      <form
        className="flex gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <input
          className={INPUT_CLASS}
          style={{ width: inputWidth }}
          placeholder={placeholder}
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
        />
        <button type="submit" className={BTN_SECONDARY}>
          검색
        </button>
      </form>
    </div>
  );
}
