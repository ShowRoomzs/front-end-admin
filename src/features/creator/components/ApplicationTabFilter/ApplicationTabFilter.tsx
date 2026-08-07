import type {
  CreatorApplicationStatus,
  CreatorApplicationStatusCounts,
} from "@/features/creator/services/creatorService";

interface TabDef {
  label: string;
  value: CreatorApplicationStatus;
  countKey: keyof CreatorApplicationStatusCounts;
}

const TABS: Array<TabDef> = [
  { label: "심사 대기", value: "PENDING", countKey: "pending" },
  { label: "승인", value: "APPROVED", countKey: "approved" },
  { label: "반려", value: "REJECTED", countKey: "rejected" },
  { label: "전체", value: null, countKey: "all" },
];

interface ApplicationTabFilterProps {
  status: CreatorApplicationStatus;
  onStatusChange: (status: CreatorApplicationStatus) => void;
  counts: CreatorApplicationStatusCounts;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onSearch: () => void;
}

/**
 * 좌측 상태 탭 + 우측 검색. 목록형 화면 상단 필터 카드.
 *
 * 검색은 계정 아이디가 기준이다(§9-1 — 계정 아이디가 주요 식별 컬럼).
 * 서버는 계정 이름(닉네임)까지 OR 검색하지만, 운영자가 입력하는 값은 계정 아이디로 안내한다.
 */
export default function ApplicationTabFilter(props: ApplicationTabFilterProps) {
  const { status, onStatusChange, counts, keyword, onKeywordChange, onSearch } =
    props;

  return (
    <div className="mb-4 flex shrink-0 items-center justify-between gap-4 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3">
      <div className="flex">
        {TABS.map((tab) => {
          const isActive = status === tab.value;
          return (
            <button
              key={tab.label}
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

      <div className="flex gap-1.5">
        <input
          type="text"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearch();
            }
          }}
          placeholder="계정 아이디로 검색"
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
