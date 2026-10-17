import { INPUT_CLASS } from "@/features/thread/components/styles";
import ThreadListItem from "@/features/thread/components/ThreadList/ThreadListItem";
import {
  CHANNEL_TABS,
  ISSUE_STATES,
  KEYWORD_DEBOUNCE_MS,
  SEARCH_PLACEHOLDER,
} from "@/features/thread/constants/params";
import { getTabBadgeCount } from "@/features/thread/hooks/useGetThreadSummary";
import type {
  AdminChannelTab,
  AdminIssueState,
  ChannelListItem,
  ThreadSummary,
} from "@/features/thread/types";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ThreadListPaneProps {
  tab: AdminChannelTab;
  state: AdminIssueState;
  keyword: string;
  summary: ThreadSummary | undefined;
  items: Array<ChannelListItem>;
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  selectedThreadId: number | null;
  onTabChange: (tab: AdminChannelTab) => void;
  onStateChange: (state: AdminIssueState) => void;
  onKeywordChange: (keyword: string) => void;
  onSelect: (threadId: number) => void;
}

/** 빈 목록 안내(시안 A7) — 이슈는 자동 개설뿐이라 「개설하세요」를 권하지 않는다 */
function EmptyList(props: {
  tab: AdminChannelTab;
  state: AdminIssueState;
  keyword: string;
}) {
  const { tab, state, keyword } = props;
  let title = "채널이 없습니다.";
  let description: string | null = null;
  if (keyword) {
    title = "검색 결과가 없습니다.";
  } else if (tab === "ISSUE" && state === "OPEN") {
    title = "진행중인 이슈가 없습니다.";
    description = "종결된 이슈는 [종결]에서 볼 수 있습니다.";
  } else if (tab === "ISSUE") {
    title = "종결된 이슈가 없습니다.";
  }

  return (
    <div className="px-5 py-10 text-center text-[12px] leading-[1.7] text-sz-n-500">
      {title}
      {description && (
        <>
          <br />
          <span className="text-[11px]">{description}</span>
        </>
      )}
    </div>
  );
}

/** 좌측 목록(시안 `.cs-list`) — 탭 · (이슈) 진행중/종결 seg · 검색 · 행 */
export default function ThreadListPane(props: ThreadListPaneProps) {
  const {
    tab,
    state,
    keyword,
    summary,
    items,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    selectedThreadId,
    onTabChange,
    onStateChange,
    onKeywordChange,
    onSelect,
  } = props;

  /*
    입력 중인 검색어 — URL(keyword)은 입력이 멈춘 뒤에 바꾼다.
    탭을 바꾸거나 다른 화면 링크로 URL 검색어가 바뀌면 입력란도 그 값으로 맞춘다.
  */
  const [draft, setDraft] = useState(keyword);
  const [syncedKeyword, setSyncedKeyword] = useState(keyword);
  if (keyword !== syncedKeyword) {
    setSyncedKeyword(keyword);
    // 입력이 반영된 결과로 바뀐 경우엔 그대로 둔다 — 「abc 」처럼 치던 공백을 지우지 않는다
    if (keyword !== draft.trim()) {
      setDraft(keyword);
    }
  }

  useEffect(() => {
    const next = draft.trim();
    if (next === keyword) {
      return;
    }
    const timer = setTimeout(() => onKeywordChange(next), KEYWORD_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, keyword, onKeywordChange]);

  return (
    <div className="flex w-[300px] shrink-0 flex-col border-r border-sz-n-200 bg-white">
      <div className="flex shrink-0 flex-col gap-2.5 border-b border-sz-n-100 px-3.5 pb-2.5 pt-3">
        <div className="flex border-b border-sz-n-100">
          {CHANNEL_TABS.map((item) => {
            const isActive = item.value === tab;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onTabChange(item.value)}
                className={cn(
                  "-mb-px flex flex-1 items-center justify-center gap-1 whitespace-nowrap border-b-2 px-0.5 py-1.5 text-[12px]",
                  isActive
                    ? "border-sz-accent-500 font-medium text-sz-accent-500"
                    : "border-transparent text-sz-n-500 hover:text-sz-n-700"
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "rounded-[8px] px-[5px] text-[10px]",
                    isActive
                      ? "bg-sz-accent-50 text-sz-accent-600"
                      : "bg-sz-n-100 text-sz-n-600"
                  )}
                >
                  {getTabBadgeCount(summary, item.value)}
                </span>
              </button>
            );
          })}
        </div>

        {tab === "ISSUE" && (
          <div className="flex gap-1.5">
            {ISSUE_STATES.map((item) => {
              const isOn = item.value === state;
              const count =
                item.value === "OPEN"
                  ? summary?.issue.openCount
                  : summary?.issue.closedCount;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onStateChange(item.value)}
                  className={cn(
                    "whitespace-nowrap rounded-[10px] border px-2.5 py-0.5 text-[11px]",
                    isOn
                      ? "border-sz-accent-500 bg-sz-accent-50 font-semibold text-sz-accent-600"
                      : "border-sz-n-300 text-sz-n-600 hover:bg-sz-n-50"
                  )}
                >
                  {item.label} {count ?? 0}
                </button>
              );
            })}
          </div>
        )}

        <input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              onKeywordChange(draft.trim());
            }
          }}
          placeholder={SEARCH_PLACEHOLDER[tab]}
          aria-label="검색"
          className={INPUT_CLASS}
        />
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        onScroll={(event) => {
          const element = event.currentTarget;
          const distance =
            element.scrollHeight - element.scrollTop - element.clientHeight;
          if (distance < 120 && hasNextPage && !isFetchingNextPage) {
            onLoadMore();
          }
        }}
      >
        {isLoading ? (
          <div className="px-5 py-10 text-center text-[12px] text-sz-n-400">
            불러오는 중…
          </div>
        ) : items.length === 0 ? (
          <EmptyList tab={tab} state={state} keyword={keyword} />
        ) : (
          items.map((item) => (
            <ThreadListItem
              key={item.threadId}
              item={item}
              isActive={item.threadId === selectedThreadId}
              onSelect={onSelect}
            />
          ))
        )}
        {isFetchingNextPage && (
          <div className="py-3 text-center text-[11px] text-sz-n-400">
            불러오는 중…
          </div>
        )}
      </div>
    </div>
  );
}
