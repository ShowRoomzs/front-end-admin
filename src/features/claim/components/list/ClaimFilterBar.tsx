import {
  SELECT_TOOLBAR_CLASS,
  TAB_CLASS,
  TAB_ON_CLASS,
} from "@/common/constants/dsStyle";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/common/constants/selectStyle";
import {
  CLAIM_SEARCH_FIELDS,
  CLAIM_TABS,
  CLAIM_TYPE_OPTIONS,
} from "@/features/claim/constants/params";
import type { ClaimListParams, ClaimTab } from "@/features/claim/types";
import Btn from "@/features/contract/components/shared/Btn";
import { INPUT_CLASS } from "@/features/contract/components/shared/styles";
import { cn } from "@/lib/utils";

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
                TAB_CLASS,
                "flex items-center gap-1.5",
                isActive && TAB_ON_CLASS
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
          className={cn(SELECT_TOOLBAR_CLASS, "w-24")}
          style={MODAL_SELECT_CHEVRON_STYLE}
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
          className={cn(SELECT_TOOLBAR_CLASS, "w-[112px]")}
          style={MODAL_SELECT_CHEVRON_STYLE}
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
          className={cn(INPUT_CLASS, "w-[172px]")}
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
