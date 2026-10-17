import { DEV_MOCK_ENABLED } from "@/common/utils/devMock";
import { EXCEPTION_QUERY_KEYS } from "@/features/exception/constants/queryKeys";
import { exceptionService } from "@/features/exception/services/exceptionService";
import type { ExceptionListParams } from "@/features/exception/types";
import { useQuery } from "@tanstack/react-query";

// API가 생기기 전에는 개발 서버(목업)에서만 부른다 — 배포본은 요청 자체를 보내지 않는다
export function useGetExceptionList(params: ExceptionListParams) {
  return useQuery({
    queryKey: [EXCEPTION_QUERY_KEYS.LIST, params],
    queryFn: () => exceptionService.getList(params),
    enabled: DEV_MOCK_ENABLED,
    retry: false,
  });
}

/** 탭 카운트 · 유형 드롭다운 건수 — 탭을 오가도 다시 받지 않게 목록과 키를 나눈다 */
export function useGetExceptionSummary() {
  return useQuery({
    queryKey: [EXCEPTION_QUERY_KEYS.SUMMARY],
    queryFn: exceptionService.getSummary,
    enabled: DEV_MOCK_ENABLED,
    retry: false,
    staleTime: 10_000,
  });
}
