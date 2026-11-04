import {
  METRICS_QUERY_KEYS,
  METRICS_STALE_TIME,
} from "@/features/metrics/constants/queryKeys";
import { adminMetricsService } from "@/features/metrics/services/adminMetricsService";
import type {
  MetricsPeriodParams,
  MetricsQueryParams,
} from "@/features/metrics/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

/** 직접 선택은 시작 · 종료일이 다 있어야 부른다 */
function isReady(params: MetricsPeriodParams) {
  return params.preset !== "CUSTOM" || Boolean(params.from && params.to);
}

export function useGetAdminMetrics(params: MetricsQueryParams) {
  return useQuery({
    queryKey: [METRICS_QUERY_KEYS.METRICS, params],
    queryFn: () => adminMetricsService.getMetrics(params),
    enabled: isReady(params),
    staleTime: METRICS_STALE_TIME,
    // 서버가 바쁘면 503 METRICS_BUSY(계산 대기 30초 초과) — 자동 재시도는 바쁜 서버에 계산을 더 쌓는다.
    // 다시 부르는 것은 화면의 [다시 시도]로만 한다
    retry: false,
    // 탭 · 기간을 바꾸는 동안 이전 화면을 남겨 깜빡이지 않게 한다
    placeholderData: keepPreviousData,
  });
}

export function useGetAdminMetricsTabs(params: MetricsPeriodParams) {
  return useQuery({
    queryKey: [METRICS_QUERY_KEYS.TABS, params],
    queryFn: () => adminMetricsService.getTabs(params),
    enabled: isReady(params),
    staleTime: METRICS_STALE_TIME,
    retry: false,
    placeholderData: keepPreviousData,
  });
}
