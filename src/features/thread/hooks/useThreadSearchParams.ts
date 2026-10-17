import { DEFAULT_ISSUE_STATE } from "@/features/thread/constants/params";
import type { AdminChannelTab, AdminIssueState } from "@/features/thread/types";
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const TABS: Array<AdminChannelTab> = ["BRAND", "INFLUENCER", "ISSUE"];
const STATES: Array<AdminIssueState> = ["OPEN", "CLOSED"];

export interface ThreadSearchParams {
  /** URL에 tab이 없으면 null — threadId만 받은 딥링크는 info.tab으로 탭을 정한다 */
  tabParam: AdminChannelTab | null;
  state: AdminIssueState;
  keyword: string;
  threadId: number | null;
}

/**
 * URL 상태 `?tab=&state=&keyword=&threadId=` — 다른 화면이 `/monitoring/threads?threadId=55`로 들어온다.
 *
 * 공용 `useParams`(초기 1회만 URL을 읽는다) 대신 매번 URL에서 바로 읽는다 — 이 화면에 머문 채
 * 사이드바 · 계약 상세 링크로 쿼리만 바뀌어 다시 들어와도 그 스레드가 열려야 하기 때문이다.
 */
export function useThreadSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo<ThreadSearchParams>(() => {
    const rawTab = searchParams.get("tab");
    const rawState = searchParams.get("state");
    const rawThreadId = Number(searchParams.get("threadId"));
    return {
      tabParam: TABS.includes(rawTab as AdminChannelTab)
        ? (rawTab as AdminChannelTab)
        : null,
      state: STATES.includes(rawState as AdminIssueState)
        ? (rawState as AdminIssueState)
        : DEFAULT_ISSUE_STATE,
      keyword: searchParams.get("keyword") ?? "",
      threadId:
        Number.isInteger(rawThreadId) && rawThreadId > 0 ? rawThreadId : null,
    };
  }, [searchParams]);

  /**
   * 바뀐 키만 덮어쓴다. null · 빈 문자열은 URL에서 지운다.
   * `replace`는 히스토리를 쌓지 않는 보정(딥링크의 탭 확정 · 검색어 입력)에 쓴다.
   */
  const update = useCallback(
    (
      patch: Partial<{
        tab: AdminChannelTab | null;
        state: AdminIssueState | null;
        keyword: string | null;
        threadId: number | null;
      }>,
      options?: { replace?: boolean }
    ) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([key, value]) => {
            if (value === null || value === undefined || value === "") {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          });
          return next;
        },
        { replace: options?.replace }
      );
    },
    [setSearchParams]
  );

  return { ...params, update };
}
