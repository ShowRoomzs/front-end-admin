import { SUMMARY_POLL_INTERVAL } from "@/features/thread/constants/params";
import { ADMIN_THREAD_QUERY_KEYS } from "@/features/thread/constants/queryKeys";
import { adminThreadService } from "@/features/thread/services/adminThreadService";
import type { ThreadSummary } from "@/features/thread/types";
import { useQuery } from "@tanstack/react-query";

/**
 * 탭 배지 · GNB 배지 원천(`GET /admin/connections/summary`).
 *
 * 실시간 푸시가 없어 어드민 화면에 있는 동안 폴링한다(36 설계 0-2 · 3-2 「30~60초」).
 * 쿼리 3회로 끝나는 가벼운 API라 셸(사이드바)에서 상시 돌려도 된다.
 * 읽음 처리 뒤에는 `useMarkThreadRead`가 이 쿼리를 무효화해 바로 줄어든다.
 */
export function useGetThreadSummary() {
  return useQuery({
    queryKey: [ADMIN_THREAD_QUERY_KEYS.SUMMARY],
    queryFn: adminThreadService.getSummary,
    refetchInterval: SUMMARY_POLL_INTERVAL,
  });
}

/**
 * 탭 숫자 — 브랜드 · 인플루언서 = 그 탭의 **운영팀 기준 안 읽은 메시지 수**(`unreadCount`).
 * 이슈 탭은 운영자 차례가 없어 서버가 항상 0을 내린다(44 이슈 스레드 설계서 0-7 · 시안 「항상 0」).
 *
 * `pendingCardCount`(재발송 요청 카드)를 더하지 않는 이유 — 요청 카드도 상대가 보낸 메시지라
 * 읽기 전에는 이미 `unreadCount`에 들어 있다. 더하면 같은 카드를 두 번 센다.
 */
export function getTabBadgeCount(
  summary: ThreadSummary | undefined,
  tab: "BRAND" | "INFLUENCER" | "ISSUE"
) {
  if (!summary) {
    return 0;
  }
  if (tab === "BRAND") {
    return summary.brand.unreadCount;
  }
  if (tab === "INFLUENCER") {
    return summary.influencer.unreadCount;
  }
  return summary.issue.unreadCount;
}

/**
 * GNB 「소통 스레드」 배지 = 브랜드 + 인플루언서 안 읽은 수(1:1 미답만).
 * 이슈 탭 숫자는 더하지 않는다 — 운영자 차례가 없다(44 이슈 스레드 설계서 4-2 · 시안 20b 「GNB 배지는 1:1 미답만 센다」).
 * 0이면 undefined를 돌려 사이드바가 배지를 그리지 않게 한다.
 */
export function getThreadMenuBadge(summary: ThreadSummary | undefined) {
  const total =
    getTabBadgeCount(summary, "BRAND") +
    getTabBadgeCount(summary, "INFLUENCER");
  return total > 0 ? total : undefined;
}
