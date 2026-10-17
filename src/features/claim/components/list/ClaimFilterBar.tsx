import {
  CLAIM_KIND_OPTIONS,
  CLAIM_TABS,
  SELECT_CHEVRON_STYLE,
} from "@/features/claim/constants/params";
import type {
  ClaimKind,
  ClaimListParams,
  ClaimTab,
} from "@/features/claim/types";
import Btn from "@/features/contract/components/shared/Btn";
import { INPUT_CLASS } from "@/features/contract/components/shared/styles";
import { cn } from "@/lib/utils";

interface ClaimFilterBarProps {
  /** 적용된 탭 */
  tab: ClaimTab;
  /** 아직 적용 전인(검색을 눌러야 반영되는) 유형 · 검색어 */
  draft: Pick<ClaimListParams, "kind" | "keyword">;
  /** 탭 건수 — 요약을 받기 전(또는 API 미준비)에는 칩을 그리지 않는다 */
  counts: Record<ClaimTab, number> | undefined;
  onTabChange: (tab: ClaimTab) => void;
  onDraftChange: (key: "kind" | "keyword", value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

/**
 * 시안 `.filter` — 탭(좌) + 유형 · 검색(우)을 한 장의 카드에 담는다.
 * 탭 7개와 건수는 파트너 11-claims와 같다 — 브랜드가 보는 큐와 운영자가 보는 큐가 어긋나면 CS 통화에서 단계가 맞지 않는다.
 */
export default function ClaimFilterBar(props: ClaimFilterBarProps) {
  const { tab, draft, counts, onTabChange, onDraftChange, onSearch, onReset } =
    props;

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
                  {counts[item.value]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex gap-1.5">
        <select
          aria-label="유형"
          className="h-7 w-24 cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[26px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          style={SELECT_CHEVRON_STYLE}
          value={draft.kind}
          onChange={(event) =>
            onDraftChange("kind", event.target.value as "" | ClaimKind)
          }
        >
          {CLAIM_KIND_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          aria-label="검색어"
          className={cn(INPUT_CLASS, "h-8 w-[220px] py-1.5 pl-2.5 pr-2.5")}
          placeholder="접수번호 · 주문번호 · 브랜드명 · 소비자"
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
