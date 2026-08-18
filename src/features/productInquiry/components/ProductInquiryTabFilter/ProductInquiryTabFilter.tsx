import { MODAL_SELECT_CHEVRON_STYLE } from "@/common/constants";
import type {
  ProductInquiryStatusCounts,
  ProductInquiryStatusFilter,
  ProductInquiryTypeCode,
  ProductInquiryTypeOption,
} from "@/features/productInquiry/types/productInquiry";

interface TabDef {
  label: string;
  value: ProductInquiryStatusFilter;
  countKey: keyof ProductInquiryStatusCounts;
}

/** 전체가 맨 앞·기본 진입이다 — §17과 달리 처리 대기열이 아니라 모니터링 창구다 */
const TABS: Array<TabDef> = [
  { label: "전체", value: "ALL", countKey: "all" },
  { label: "답변대기", value: "WAITING", countKey: "waiting" },
  { label: "답변완료", value: "ANSWERED", countKey: "answered" },
  {
    label: "삭제 요청",
    value: "DELETE_REQUESTED",
    countKey: "deleteRequested",
  },
  { label: "삭제", value: "DELETED", countKey: "deleted" },
];

interface ProductInquiryTabFilterProps {
  status: ProductInquiryStatusFilter;
  onStatusChange: (status: ProductInquiryStatusFilter) => void;
  counts: ProductInquiryStatusCounts;
  types: Array<ProductInquiryTypeOption>;
  /** null = 전체 유형 */
  type: ProductInquiryTypeCode | null;
  onTypeChange: (type: ProductInquiryTypeCode | null) => void;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onSearch: () => void;
}

/** 좌측 상태 탭 5종 + 우측 [유형 셀렉트 · `상품명 · 브랜드 · 질문` 단일 검색] */
export default function ProductInquiryTabFilter(
  props: ProductInquiryTabFilterProps
) {
  const {
    status,
    onStatusChange,
    counts,
    types,
    type,
    onTypeChange,
    keyword,
    onKeywordChange,
    onSearch,
  } = props;

  return (
    <div className="mb-4 flex shrink-0 items-center justify-between gap-4 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3">
      <div className="flex flex-wrap">
        {TABS.map((tab) => {
          const isActive = status === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onStatusChange(tab.value)}
              className={`mr-5 flex items-center gap-1.5 whitespace-nowrap border-b-2 px-0.5 py-1.5 text-[12px] ${
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
                {counts[tab.countKey]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 gap-1.5">
        <select
          aria-label="문의 유형"
          value={type ?? ""}
          onChange={(event) => onTypeChange(event.target.value || null)}
          style={MODAL_SELECT_CHEVRON_STYLE}
          className="h-8 w-[140px] appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[30px] text-[13px] text-sz-n-900 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
        >
          <option value="">전체 유형</option>
          {types.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
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
          placeholder="상품명 · 브랜드 · 질문 검색"
          className="h-8 w-[200px] rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
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
