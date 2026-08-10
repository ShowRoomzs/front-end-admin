import {
  PRODUCT_DISPLAY_STATUS,
  PRODUCT_GROUP_BUY_STATUS,
} from "@/features/product/constants/params";
import type {
  DisplayStatusCounts,
  GroupBuyStatusCounts,
  ProductDisplayStatus,
  ProductGroupBuyStatus,
} from "@/features/product/services/productService";

const DISPLAY_TABS: Array<{
  label: string;
  value: ProductDisplayStatus | null;
  countKey: keyof DisplayStatusCounts;
}> = [
  { label: "전체", value: null, countKey: "all" },
  {
    label: PRODUCT_DISPLAY_STATUS.DISPLAY,
    value: "DISPLAY",
    countKey: "display",
  },
  { label: PRODUCT_DISPLAY_STATUS.HIDDEN, value: "HIDDEN", countKey: "hidden" },
  {
    label: PRODUCT_DISPLAY_STATUS.PENDING_REVIEW,
    value: "PENDING_REVIEW",
    countKey: "pendingReview",
  },
  {
    label: PRODUCT_DISPLAY_STATUS.HIDE_REQUEST,
    value: "HIDE_REQUEST",
    countKey: "hideRequest",
  },
];

const GROUP_BUY_TABS: Array<{
  label: string;
  value: ProductGroupBuyStatus | null;
  countKey: keyof GroupBuyStatusCounts;
}> = [
  { label: "전체", value: null, countKey: "all" },
  {
    label: PRODUCT_GROUP_BUY_STATUS.PREPARING,
    value: "PREPARING",
    countKey: "preparing",
  },
  {
    label: PRODUCT_GROUP_BUY_STATUS.READY,
    value: "READY",
    countKey: "ready",
  },
  {
    label: PRODUCT_GROUP_BUY_STATUS.IN_PROGRESS,
    value: "IN_PROGRESS",
    countKey: "inProgress",
  },
  {
    label: PRODUCT_GROUP_BUY_STATUS.NOT_CONNECTED,
    value: "NOT_CONNECTED",
    countKey: "notConnected",
  },
];

interface ProductStatusFilterProps {
  displayStatus: ProductDisplayStatus | null;
  onDisplayStatusChange: (status: ProductDisplayStatus | null) => void;
  displayCounts: DisplayStatusCounts;
  groupBuyStatus: ProductGroupBuyStatus | null;
  onGroupBuyStatusChange: (status: ProductGroupBuyStatus | null) => void;
  groupBuyCounts: GroupBuyStatusCounts;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onSearch: () => void;
  onReset: () => void;
  searchPlaceholder: string;
}

function StatusTabRow<T extends string>(props: {
  label: string;
  tabs: Array<{ label: string; value: T | null; count: number }>;
  selected: T | null;
  onSelect: (value: T | null) => void;
}) {
  const { label, tabs, selected, onSelect } = props;

  return (
    <div className="flex items-center gap-3.5">
      <span className="w-[58px] shrink-0 text-[11px] font-semibold text-sz-n-400">
        {label}
      </span>
      <div className="flex flex-wrap">
        {tabs.map((tab) => {
          const isActive = selected === tab.value;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => onSelect(tab.value)}
              className={`mr-5 flex items-center gap-1.5 border-b-2 px-0.5 py-1.5 text-[12px] ${
                isActive
                  ? "border-sz-accent-500 font-medium text-sz-accent-500"
                  : "border-transparent text-sz-n-500 hover:text-sz-n-700"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-lg px-1.5 text-[10px] ${
                  isActive
                    ? "bg-sz-accent-50 text-sz-accent-600"
                    : "bg-sz-n-100 text-sz-n-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 시안 `.filter-panel` — 진열 상태 행 + 공구 상태 행 + 우상단 초기화 + 하단 검색.
 *
 * ⚠️ 시안은 체크박스 **다중선택**(한 축 내 OR)이지만, 백엔드 검색 조건이 각 축
 * 단일값만 받아(AdminProductSearchCondition) 실제 동작은 단일선택이다.
 * 그래서 체크박스 대신 이미 검증된 탭 시각(입점 심사 화면과 동일)을 쓴다.
 * 서버가 IN 조건을 지원하게 되면 이 컴포넌트만 체크박스로 바꾸면 된다.
 */
export default function ProductStatusFilter(props: ProductStatusFilterProps) {
  const {
    displayStatus,
    onDisplayStatusChange,
    displayCounts,
    groupBuyStatus,
    onGroupBuyStatusChange,
    groupBuyCounts,
    keyword,
    onKeywordChange,
    onSearch,
    onReset,
    searchPlaceholder,
  } = props;

  return (
    <div className="relative mb-4 flex shrink-0 flex-col gap-4 rounded-[8px] border border-sz-n-200 bg-white px-4 py-5">
      {/* 우상단 초기화 — 여백은 겹치는 첫 행에만 준다(패널 전체에 주면 검색 행까지 밀린다, §4-5) */}
      <button
        type="button"
        onClick={onReset}
        className="absolute right-3.5 top-[17px] inline-flex h-[26px] items-center gap-[5px] rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[11px] font-medium text-sz-n-500 hover:border-sz-n-400 hover:bg-sz-n-100 hover:text-sz-n-700"
      >
        초기화
      </button>

      <div className="pr-[90px]">
        <StatusTabRow
          label="진열 상태"
          selected={displayStatus}
          onSelect={onDisplayStatusChange}
          tabs={DISPLAY_TABS.map((tab) => ({
            label: tab.label,
            value: tab.value,
            count: displayCounts[tab.countKey],
          }))}
        />
      </div>

      <StatusTabRow
        label="공구 상태"
        selected={groupBuyStatus}
        onSelect={onGroupBuyStatusChange}
        tabs={GROUP_BUY_TABS.map((tab) => ({
          label: tab.label,
          value: tab.value,
          count: groupBuyCounts[tab.countKey],
        }))}
      />

      <div className="flex justify-end gap-1.5">
        <input
          type="text"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearch();
            }
          }}
          placeholder={searchPlaceholder}
          className="h-9 w-[340px] rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
        />
        <button
          type="button"
          onClick={onSearch}
          className="inline-flex h-9 items-center rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[12px] font-medium text-sz-n-900 hover:bg-sz-n-100"
        >
          검색
        </button>
      </div>
    </div>
  );
}
