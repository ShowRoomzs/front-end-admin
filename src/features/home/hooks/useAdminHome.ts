import {
  BADGES_POLL_INTERVAL,
  HOME_POLL_INTERVAL,
  HOME_QUERY_KEYS,
} from "@/features/home/constants/queryKeys";
import { adminHomeService } from "@/features/home/services/adminHomeService";
import { useQuery } from "@tanstack/react-query";

/** 홈 한 화면 — 5분마다 다시 부른다(연동 상태 · 할 일 · 오늘 일정 · 오늘 지표) */
export function useGetAdminHome() {
  return useQuery({
    queryKey: [HOME_QUERY_KEYS.HOME],
    queryFn: adminHomeService.getHome,
    refetchInterval: HOME_POLL_INTERVAL,
    staleTime: 30_000,
  });
}

/**
 * 사이드바 배지 — 홈 할 일과 같은 계산이라 「할 일 합계 = 배지 합」이 서버에서 보장된다.
 * 셸(MainLayout)이 부를 수 있도록 홈과 키를 나눈다. 실패하면 재시도 없이 배지를 비운다.
 */
export function useGetAdminBadges() {
  return useQuery({
    queryKey: [HOME_QUERY_KEYS.BADGES],
    queryFn: adminHomeService.getBadges,
    refetchInterval: BADGES_POLL_INTERVAL,
    staleTime: 10_000,
    retry: false,
  });
}
