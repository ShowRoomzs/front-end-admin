import ThreadListPane from "@/features/thread/components/ThreadList/ThreadListPane";
import ThreadView from "@/features/thread/components/ThreadView/ThreadView";
import { DEFAULT_TAB } from "@/features/thread/constants/params";
import { useGetThreadSummary } from "@/features/thread/hooks/useGetThreadSummary";
import { useThreadSearchParams } from "@/features/thread/hooks/useThreadSearchParams";
import {
  useGetChannelInfo,
  useGetChannelList,
} from "@/features/thread/hooks/useThreadQueries";
import type {
  AdminChannelTab,
  AdminIssueState,
  ChannelInfo,
} from "@/features/thread/types";
import { useCallback, useEffect } from "react";

/** 가운데 영역 안내(시안 A7) — 가운데 정렬 */
function CenterMessage(props: { title: string; description?: string }) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-center bg-sz-n-50 p-6">
      <div className="text-center text-[12px] leading-[1.7] text-sz-n-500">
        <div className="text-[13px] font-semibold text-sz-n-700">
          {props.title}
        </div>
        {props.description}
      </div>
    </div>
  );
}

/** 이슈 스레드의 진행중/종결 seg — 협의가 OPEN이면 진행중, 그 밖은 종결 */
function issueStateOf(info: ChannelInfo): AdminIssueState | null {
  if (!info.issue) {
    return null;
  }
  return info.issue.status === "OPEN" ? "OPEN" : "CLOSED";
}

/**
 * 게시물·소통 모니터링 > 소통 스레드(ui-admin-20a 운영팀 1:1 채널 · 20b 이슈 스레드).
 *
 * URL `?tab=&state=&keyword=&threadId=`가 화면 상태의 전부다. 다른 화면은 `?threadId=55`만 붙여
 * 들어오고, 그때는 `info.tab`으로 탭(이슈면 진행중/종결까지)을 정해 URL을 고쳐 쓴다.
 * 이슈 패널에서 여는 브랜드–인플루언서 1:1 스레드는 탭이 없어(`info.tab = null`) 목록은 그대로 둔다.
 */
export default function ThreadPage() {
  const { tabParam, state, keyword, threadId, update } =
    useThreadSearchParams();
  const { data: summary } = useGetThreadSummary();
  const infoQuery = useGetChannelInfo(threadId);
  const info = infoQuery.data;

  // threadId만 받은 딥링크 — 탭이 정해질 때까지 목록을 부르지 않는다(엉뚱한 탭이 한 번 그려진다)
  const isResolvingTab = tabParam === null && threadId !== null;
  const tab: AdminChannelTab = tabParam ?? DEFAULT_TAB;

  useEffect(() => {
    if (!isResolvingTab) {
      return;
    }
    if (info) {
      const resolvedTab = info.tab ?? DEFAULT_TAB;
      update(
        {
          tab: resolvedTab,
          state: resolvedTab === "ISSUE" ? issueStateOf(info) : null,
        },
        { replace: true }
      );
    } else if (infoQuery.isError) {
      update({ tab: DEFAULT_TAB }, { replace: true });
    }
  }, [info, infoQuery.isError, isResolvingTab, update]);

  const list = useGetChannelList({
    tab,
    state,
    keyword,
    enabled: !isResolvingTab,
  });

  /*
    이슈 탭은 첫 행을 열어 둔다(시안 A1 「기본 진입」). 운영자가 답할 일이 없는 열람 전용이라
    열어도 배지가 변하지 않는다. 브랜드 · 인플루언서 탭은 자동으로 열지 않는다 — 열면 그 채널이
    운영팀 공용으로 읽음 처리돼, 아무도 안 본 메시지가 모든 운영자에게서 사라진다.
  */
  const firstIssueThreadId =
    tab === "ISSUE" && !isResolvingTab
      ? (list.items[0]?.threadId ?? null)
      : null;
  useEffect(() => {
    if (threadId === null && firstIssueThreadId !== null) {
      update({ threadId: firstIssueThreadId }, { replace: true });
    }
  }, [firstIssueThreadId, threadId, update]);

  const handleTabChange = useCallback(
    (nextTab: AdminChannelTab) => {
      if (nextTab === tab) {
        return;
      }
      // 탭마다 검색 축이 달라 검색어를 비우고, 열린 스레드도 닫는다
      update({
        tab: nextTab,
        state: nextTab === "ISSUE" ? state : null,
        keyword: null,
        threadId: null,
      });
    },
    [state, tab, update]
  );

  const handleStateChange = useCallback(
    (nextState: AdminIssueState) => {
      if (nextState !== state) {
        update({ state: nextState, threadId: null });
      }
    },
    [state, update]
  );

  const handleKeywordChange = useCallback(
    (nextKeyword: string) =>
      update({ keyword: nextKeyword }, { replace: true }),
    [update]
  );

  const handleSelect = useCallback(
    (nextThreadId: number) => {
      if (nextThreadId !== threadId) {
        update({ threadId: nextThreadId });
      }
    },
    [threadId, update]
  );

  /** 정보 바 「열린 이슈 스레드」 — 이슈 탭(진행중)의 그 스레드로 */
  const handleOpenIssueThread = useCallback(
    (issueThreadId: number) =>
      update({
        tab: "ISSUE",
        state: "OPEN",
        keyword: null,
        threadId: issueThreadId,
      }),
    [update]
  );

  /** 이슈 패널 「브랜드–인플루언서 1:1 스레드 열람」 — 목록(이슈 탭)은 그대로 두고 가운데만 바꾼다 */
  const handleOpenPairThread = useCallback(
    (pairThreadId: number) => update({ threadId: pairThreadId }),
    [update]
  );

  const renderCenter = () => {
    if (threadId === null) {
      return (
        <CenterMessage
          title="선택된 스레드가 없습니다"
          description={
            tab === "ISSUE"
              ? "이슈 스레드는 정산 확인 기간에 정산 조정 요청이 들어올 때만 자동으로 열립니다."
              : "왼쪽 목록에서 채널을 선택하세요."
          }
        />
      );
    }
    if (infoQuery.isError) {
      return (
        <CenterMessage
          title="스레드를 열 수 없습니다"
          description="없는 스레드이거나 운영팀이 열람할 수 없는 스레드입니다."
        />
      );
    }
    if (!info) {
      return <CenterMessage title="불러오는 중…" />;
    }
    return (
      <ThreadView
        key={info.threadId}
        info={info}
        onOpenIssueThread={handleOpenIssueThread}
        onOpenPairThread={handleOpenPairThread}
      />
    );
  };

  return (
    <div className="flex min-h-[640px] flex-1 overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
      <ThreadListPane
        tab={tab}
        state={state}
        keyword={keyword}
        summary={summary}
        items={list.items}
        isLoading={isResolvingTab || list.isLoading}
        hasNextPage={Boolean(list.hasNextPage)}
        isFetchingNextPage={list.isFetchingNextPage}
        onLoadMore={() => void list.fetchNextPage()}
        selectedThreadId={threadId}
        onTabChange={handleTabChange}
        onStateChange={handleStateChange}
        onKeywordChange={handleKeywordChange}
        onSelect={handleSelect}
      />
      {renderCenter()}
    </div>
  );
}
