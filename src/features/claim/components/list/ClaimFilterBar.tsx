import {
  CLAIM_SEARCH_FIELDS,
  CLAIM_TABS,
  CLAIM_TYPE_OPTIONS,
  SELECT_CHEVRON_STYLE,
} from "@/features/claim/constants/params";
import type { ClaimListParams, ClaimTab } from "@/features/claim/types";
import Btn from "@/features/contract/components/shared/Btn";
import { INPUT_CLASS } from "@/features/contract/components/shared/styles";
import { cn } from "@/lib/utils";

const SELECT_SM_CLASS =
  "h-7 cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[26px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

interface ClaimFilterBarProps {
  /** 적용된 탭 */
  tab: ClaimTab;
  /** 아직 적용 전인(검색을 눌러야 반영되는) 유형 · 검색 기준 · 검색어 */
  draft: Pick<ClaimListParams, "type" | "searchField" | "keyword">;
  /** 탭 건수 — 요약을 받기 전에는 칩을 그리지 않는다 */
  counts: Record<ClaimTab, number> | undefined;
  onTabChange: (tab: ClaimTab) => void;
  onDraftChange: (
    key: "type" | "searchField" | "keyword",
    value: string
  ) => void;
  onSearch: () => void;
  onReset: () => void;
}

/**
 * 시안 `.filter` — 탭(좌) + 유형 · 검색(우)을 한 장의 카드에 담는다.
 * 탭 7개와 건수(`summary.tabCounts`)는 파트너 11-claims와 같다.
 * 시안의 검색 입력 하나는 서버가 셋(접수·주문번호 / 브랜드명 / 소비자명)으로 나눠 받아 기준 셀렉트를 더했다.
 */
export default function ClaimFilterBar(props: ClaimFilterBarProps) {
  const { tab, draft, counts, onTabChange, onDraftChange, onSearch, onReset } =
    props;
  const field =
    CLAIM_SEARCH_FIELDS.find((item) => item.value === draft.searchField) ??
    CLAIM_SEARCH_FIELDS[0];

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3">
      {/* 탭은 줄이지 않는다 — 1280px처럼 좁으면 검색이 아래 줄로 내려간다(시안은 1440px) */}
      <div className="flex shrink-0 whitespace-nowrap">
        {CLAIM_TABS.map((item) => {
          const isActive = item.value === tab;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onTabChange(item.value)}
              className={cn(
                "mr-5 flex items-center gap-1.5 border-b-2 px-0.5 py-1.5 text-[12px]",
                isActive
                  ? "border-sz-accent-500 font-medium text-sz-accent-500"
                  : "border-transparent text-sz-n-500 hover:text-sz-n-700"
              )}
            >
              {item.label}
              {counts && (
                <span
                  className={cn(
                    "rounded-[8px] px-[5px] text-[10px]",
                    isActive
                      ? "bg-sz-accent-50 text-sz-accent-600"
                      : "bg-sz-n-100 text-sz-n-600"
                  )}
                >
                  {counts[item.value] ?? 0}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex gap-1.5">
        <select
          aria-label="유형"
          className={cn(SELECT_SM_CLASS, "w-24")}
          style={SELECT_CHEVRON_STYLE}
          value={draft.type}
          onChange={(event) => onDraftChange("type", event.target.value)}
        >
          {CLAIM_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label="검색 기준"
          className={cn(SELECT_SM_CLASS, "w-[112px]")}
          style={SELECT_CHEVRON_STYLE}
          value={draft.searchField}
          onChange={(event) => onDraftChange("searchField", event.target.value)}
        >
          {CLAIM_SEARCH_FIELDS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          aria-label="검색어"
          className={cn(INPUT_CLASS, "h-8 w-[172px] py-1.5 pl-2.5 pr-2.5")}
          placeholder={field.placeholder}
          value={draft.keyword}
          onChange={(event) => onDraftChange("keyword", event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSearch();
          }}
        />
        <Btn variant="secondary" onClick={onSearch}>
          검색
        </Btn>
        <Btn variant="secondary" onClick={onReset}>
          초기화
        </Btn>
      </div>
    </div>
  );
}
