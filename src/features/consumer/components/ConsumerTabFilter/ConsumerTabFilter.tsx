import { MODAL_SELECT_CHEVRON_STYLE } from "@/common/constants";
import {
  CONSUMER_PROVIDER_FILTERS,
  CONSUMER_PROVIDER_LABELS,
  CONSUMER_TABS,
} from "@/features/consumer/constants/params";
import type {
  ConsumerListSummary,
  ConsumerProvider,
  ConsumerTab,
} from "@/features/consumer/types/consumer";

interface ConsumerTabFilterProps {
  tab: ConsumerTab;
  onTabChange: (tab: ConsumerTab) => void;
  summary: ConsumerListSummary;
  /** null = 전체 수단 */
  providerType: ConsumerProvider | null;
  onProviderChange: (providerType: ConsumerProvider | null) => void;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onSearch: () => void;
}

/**
 * 좌측 상태 탭 4종 + 우측 [가입 수단 셀렉트 · 단일 검색].
 *
 * 검색은 **회원번호 · 닉네임 · 휴대폰 뒤 4자리** 3축을 한 입력이 받는다 — 축 선택
 * 셀렉트를 두지 않는다. 어느 축인지는 서버가 값 모양으로 판별한다(`CST-`로 시작하면
 * 회원번호). 그래서 placeholder가 곧 사용 설명이라 문구를 줄이지 말 것.
 */
export default function ConsumerTabFilter(props: ConsumerTabFilterProps) {
  const {
    tab,
    onTabChange,
    summary,
    providerType,
    onProviderChange,
    keyword,
    onKeywordChange,
    onSearch,
  } = props;

  return (
    <div className="mb-4 flex shrink-0 items-center justify-between gap-4 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3">
      <div className="flex">
        {CONSUMER_TABS.map((item) => {
          const isActive = tab === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onTabChange(item.value)}
              className={`mr-5 flex items-center gap-1.5 whitespace-nowrap border-b-2 px-0.5 py-1.5 text-[12px] ${
                isActive
                  ? "border-sz-accent-500 font-medium text-sz-accent-500"
                  : "border-transparent text-sz-n-500 hover:text-sz-n-700"
              }`}
            >
              {item.label}
              <span
                className={`rounded-lg px-1.5 text-[10px] ${
                  isActive
                    ? "bg-sz-accent-50 text-sz-accent-600"
                    : "bg-sz-n-100 text-sz-n-600"
                }`}
              >
                {summary[item.countKey].toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 gap-1.5">
        <select
          aria-label="가입 수단"
          value={providerType ?? ""}
          onChange={(event) =>
            onProviderChange(
              (event.target.value || null) as ConsumerProvider | null
            )
          }
          style={MODAL_SELECT_CHEVRON_STYLE}
          className="h-8 w-[120px] appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[30px] text-[13px] text-sz-n-900 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
        >
          <option value="">전체 수단</option>
          {CONSUMER_PROVIDER_FILTERS.map((provider) => (
            <option key={provider} value={provider}>
              {CONSUMER_PROVIDER_LABELS[provider]}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearch();
            }
          }}
          placeholder="회원번호 · 닉네임 · 휴대폰 뒤 4자리"
          className="h-8 w-[240px] rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
        />
        <button
          type="button"
          onClick={onSearch}
          className="inline-flex h-8 items-center rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[12px] font-medium text-sz-n-900 hover:bg-sz-n-100"
        >
          검색
        </button>
      </div>
    </div>
  );
}
