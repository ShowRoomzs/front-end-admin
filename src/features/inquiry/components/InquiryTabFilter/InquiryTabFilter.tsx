import { MODAL_SELECT_CHEVRON_STYLE } from "@/common/constants";
import type {
  CsCategoryCode,
  InquiryStatusCounts,
  InquiryStatusFilter,
  InquiryTypeOption,
} from "@/features/inquiry/types/inquiry";

interface TabDef {
  label: string;
  value: InquiryStatusFilter;
  countKey: keyof InquiryStatusCounts;
}

/** 순서는 시안 그대로 — 처리할 것(접수) → 끝난 것(답변완료) → 전체(기본 진입) */
const TABS: Array<TabDef> = [
  { label: "접수", value: "WAITING", countKey: "waiting" },
  { label: "답변완료", value: "ANSWERED", countKey: "answered" },
  { label: "전체", value: "ALL", countKey: "all" },
];

interface InquiryTabFilterProps {
  status: InquiryStatusFilter;
  onStatusChange: (status: InquiryStatusFilter) => void;
  counts: InquiryStatusCounts;
  /** `/admin/inquiries/types` 응답 — 하드코딩하지 않는다 */
  types: Array<InquiryTypeOption>;
  /** null = 전체 유형 */
  type: CsCategoryCode | null;
  onTypeChange: (type: CsCategoryCode | null) => void;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onSearch: () => void;
}

/**
 * 좌측 상태 탭 + 우측 [유형 셀렉트 · 검색].
 *
 * 유형을 탭이 아니라 셀렉트로 두는 건 FAQ(§19)와 반대 선택이다 — 여기는 탭 줄을
 * 상태가 이미 쓰고 있고, 유형까지 펼치면 두 줄짜리 필터가 된다. 검색은 작성자와
 * 문의 내용을 함께 훑는 **단일 입력**이고, 필드 선택 셀렉트를 두지 않는다(§17-2).
 */
export default function InquiryTabFilter(props: InquiryTabFilterProps) {
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
      <div className="flex">
        {TABS.map((tab) => {
          const isActive = status === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onStatusChange(tab.value)}
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
          className="h-8 w-[150px] appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[30px] text-[13px] text-sz-n-900 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
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
          placeholder="작성자 · 문의 내용 검색"
          className="h-8 w-[210px] rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
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
