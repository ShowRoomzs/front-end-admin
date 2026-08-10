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

/**
 * 진열 상태 필터 — 시안 그대로 **3종만** 노출한다.
 * HIDE_REQUEST("미진열(요청)")는 목록 배지로는 구분해 보여주지만 필터 항목에는 없다
 * (신규제안 §진열상태 enum 3종화 — 요청 여부는 미진열의 하위 구분일 뿐이라는 판단).
 */
const DISPLAY_ITEMS: Array<{
  label: string;
  value: ProductDisplayStatus;
  countKey: keyof DisplayStatusCounts;
}> = [
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
];

const GROUP_BUY_ITEMS: Array<{
  label: string;
  value: ProductGroupBuyStatus;
  countKey: keyof GroupBuyStatusCounts;
}> = [
  {
    label: PRODUCT_GROUP_BUY_STATUS.PREPARING,
    value: "PREPARING",
    countKey: "preparing",
  },
  { label: PRODUCT_GROUP_BUY_STATUS.READY, value: "READY", countKey: "ready" },
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

/** 시안 `.fp-item` — 체크박스 + 라벨 + 건수 */
function CheckItem(props: {
  label: string;
  count: number;
  checked: boolean;
  onToggle: () => void;
}) {
  const { label, count, checked, onToggle } = props;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 text-[12px] ${
        checked ? "font-medium text-sz-n-900" : "text-sz-n-600"
      }`}
    >
      <span
        className={`flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px] ${
          checked
            ? "border-sz-accent-500 bg-sz-accent-500"
            : "border-sz-n-300 bg-white"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 9 9" className="h-[9px] w-[9px]">
            <path
              d="M1 4.5L3.3 7L8 1.5"
              stroke="#fff"
              strokeWidth="1.6"
              fill="none"
            />
          </svg>
        )}
      </span>
      {label}
      <span className="text-[11px] font-normal text-sz-n-400">{count}</span>
    </button>
  );
}

function CheckRow<T extends string>(props: {
  label: string;
  items: Array<{ label: string; value: T; count: number }>;
  selected: T | null;
  onSelect: (value: T | null) => void;
}) {
  const { label, items, selected, onSelect } = props;

  return (
    <div className="flex flex-wrap items-center gap-3.5">
      <span className="w-[58px] shrink-0 text-[11px] font-semibold text-sz-n-400">
        {label}
      </span>
      {items.map((item) => (
        <CheckItem
          key={item.value}
          label={item.label}
          count={item.count}
          checked={selected === item.value}
          // 이미 켜진 항목을 다시 누르면 해제 → 그 축은 "전체"로 돌아간다
          onToggle={() => onSelect(selected === item.value ? null : item.value)}
        />
      ))}
    </div>
  );
}

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

/**
 * 시안 `.filter-panel` — 진열 상태 행 + 공구 상태 행 + 우상단 초기화 + 하단 검색.
 *
 * ⚠️ 생김새는 체크박스지만 **한 축에 하나만 켜진다.** 백엔드 검색 조건
 * (AdminProductSearchCondition)의 displayStatus·groupBuyStatus가 각각 단일 enum이라
 * 서버가 OR(IN) 조건을 못 받는다. 서버가 List<>를 받게 되면 selected를 배열로
 * 바꾸고 CheckRow의 onToggle만 누적 방식으로 고치면 된다.
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
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[11px] w-[11px]"
        >
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
        초기화
      </button>

      <div className="pr-[90px]">
        <CheckRow
          label="진열 상태"
          selected={displayStatus}
          onSelect={onDisplayStatusChange}
          items={DISPLAY_ITEMS.map((item) => ({
            label: item.label,
            value: item.value,
            count: displayCounts[item.countKey],
          }))}
        />
      </div>

      <CheckRow
        label="공구 상태"
        selected={groupBuyStatus}
        onSelect={onGroupBuyStatusChange}
        items={GROUP_BUY_ITEMS.map((item) => ({
          label: item.label,
          value: item.value,
          count: groupBuyCounts[item.countKey],
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
