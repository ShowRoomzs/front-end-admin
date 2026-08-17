import {
  FAQ_CATEGORY_ALL,
  type FaqCategory,
  type FaqCategoryCounts,
} from "@/features/faq/types/faq";

interface FaqTabFilterProps {
  /** `/common/faqs/categories` 응답에서 ALL을 걸러낸 저장용 카테고리 */
  categories: Array<FaqCategory>;
  /** null = 전체 탭 */
  category: string | null;
  onCategoryChange: (category: string | null) => void;
  counts?: FaqCategoryCounts;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onSearch: () => void;
}

/**
 * 좌측 카테고리 탭 + 우측 질문 검색.
 *
 * 카테고리를 셀렉트가 아니라 탭으로 펼치는 건 시안의 결정이다 — FAQ 목록에는 상태 탭이
 * 없어 탭 줄이 비어 있고, 카테고리가 그 자리를 단독으로 쓰면 카테고리별 보유량이
 * 목록 진입 즉시 보인다. 탭 개수는 하드코딩하지 않고 API가 내려준 만큼 그린다 —
 * 카테고리 5종 확정(§17-8 #4)이 BE에 반영될 때 이 파일은 건드릴 필요가 없다.
 *
 * 검색 범위는 **질문만**이다(답변 본문은 검색하지 않는다 — 시안 `질문 검색`).
 */
export default function FaqTabFilter(props: FaqTabFilterProps) {
  const {
    categories,
    category,
    onCategoryChange,
    counts,
    keyword,
    onKeywordChange,
    onSearch,
  } = props;

  /*
    전체 탭 배지는 서버가 ALL 키를 함께 내려주면 그 값을, 아니면 나머지 합을 쓴다.
    counts가 없으면 배지를 그리지 않는다 — 0으로 그리면 "집계가 없다"와
    "정말 0건이다"가 구분되지 않는다.

    합계는 숫자로 확인된 값만 더한다. counts는 서비스 계층에서 정규화되지만,
    여기서 한 번 더 막지 않으면 응답 모양이 바뀌었을 때 배지에 문자열이 찍힌다.
  */
  const totalCount = counts
    ? (counts[FAQ_CATEGORY_ALL] ??
      Object.entries(counts)
        .filter(([key]) => key !== FAQ_CATEGORY_ALL)
        .reduce(
          (sum, [, value]) => (typeof value === "number" ? sum + value : sum),
          0
        ))
    : undefined;

  const tabs: Array<{ label: string; value: string | null; count?: number }> = [
    { label: "전체", value: null, count: totalCount },
    ...categories.map((item) => ({
      label: item.description,
      value: item.key,
      count: counts?.[item.key],
    })),
  ];

  return (
    <div className="mb-4 flex shrink-0 items-center justify-between gap-4 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3">
      <div className="flex flex-wrap">
        {tabs.map((tab) => {
          const isActive = category === tab.value;
          return (
            <button
              key={tab.value ?? FAQ_CATEGORY_ALL}
              type="button"
              onClick={() => onCategoryChange(tab.value)}
              className={`mr-5 flex items-center gap-1.5 border-b-2 px-0.5 py-1.5 text-[12px] ${
                isActive
                  ? "border-sz-accent-500 font-medium text-sz-accent-500"
                  : "border-transparent text-sz-n-500 hover:text-sz-n-700"
              }`}
            >
              {tab.label}
              {typeof tab.count === "number" && (
                <span
                  className={`rounded-lg px-1.5 text-[10px] ${
                    isActive
                      ? "bg-sz-accent-50 text-sz-accent-600"
                      : "bg-sz-n-100 text-sz-n-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 gap-1.5">
        <input
          type="text"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearch();
            }
          }}
          placeholder="질문 검색"
          className="h-8 w-[180px] rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
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
