import {
  EXCEPTION_QUERY_KEYS,
  EXCEPTION_SUMMARY_POLL_INTERVAL,
} from "@/features/exception/constants/queryKeys";
import { exceptionService } from "@/features/exception/services/exceptionService";
import type { ExceptionListParams } from "@/features/exception/types";
import { useQuery } from "@tanstack/react-query";

export function useGetExceptionList(params: ExceptionListParams) {
  return useQuery({
    queryKey: [EXCEPTION_QUERY_KEYS.LIST, params],
    queryFn: () => exceptionService.getList(params),
  });
}

/**
 * 탭 카운트 · 유형 드롭다운 건수 · 대행 가능 · 사이드바 배지(`badge`).
 * 셸(MainLayout)도 부르는 폴링 대상이라 목록과 키를 나눈다.
 */
export function useGetExceptionSummary() {
  return useQuery({
    queryKey: [EXCEPTION_QUERY_KEYS.SUMMARY],
    queryFn: exceptionService.getSummary,
    refetchInterval: EXCEPTION_SUMMARY_POLL_INTERVAL,
    staleTime: 10_000,
  });
}
