import { DEV_MOCK_ENABLED } from "@/common/utils/devMock";
import { ORDER_QUERY_KEYS } from "@/features/order/constants/queryKeys";
import { orderService } from "@/features/order/services/orderService";
import type { OrderListQuery } from "@/features/order/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

/** 목업은 개발 서버에서만 돈다 — 배포본에서는 요청 자체를 보내지 않는다 */
export function useGetOrderList(query: OrderListQuery) {
  return useQuery({
    queryKey: [ORDER_QUERY_KEYS.LIST, query],
    queryFn: () => orderService.getList(query),
    enabled: DEV_MOCK_ENABLED,
    // 필터를 바꿔도 표가 깜빡이며 비지 않게 이전 결과를 들고 있는다
    placeholderData: keepPreviousData,
    retry: false,
  });
}

/** 탭 · 상태 셀렉트 건수 — 필터와 무관하다 */
export function useGetOrderSummary() {
  return useQuery({
    queryKey: [ORDER_QUERY_KEYS.SUMMARY],
    queryFn: orderService.getSummary,
    enabled: DEV_MOCK_ENABLED,
    retry: false,
  });
}

export function useGetOrderFilterOptions() {
  return useQuery({
    queryKey: [ORDER_QUERY_KEYS.FILTER_OPTIONS],
    queryFn: orderService.getFilterOptions,
    enabled: DEV_MOCK_ENABLED,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useGetOrderDetail(orderNo: string | null) {
  return useQuery({
    queryKey: [ORDER_QUERY_KEYS.DETAIL, orderNo],
    queryFn: () => orderService.getDetail(orderNo as string),
    enabled: DEV_MOCK_ENABLED && Boolean(orderNo),
    retry: false,
  });
}
