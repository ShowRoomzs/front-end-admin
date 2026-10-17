import { adminGroupBuyService } from "@/features/groupBuy/services/adminGroupBuyService";
import { ORDER_QUERY_KEYS } from "@/features/order/constants/queryKeys";
import { orderService } from "@/features/order/services/orderService";
import type {
  AdminOrderListQuery,
  AdminOrderSummaryQuery,
} from "@/features/order/types";
import { sellerService } from "@/features/seller/services/sellerService";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

/** 상세 조건 셀렉트는 한 번에 받는 목록이다 — 서버 페이지 크기 상한(100) 안에서 받는다 */
const OPTION_PAGE_SIZE = 100;

export function useGetOrderList(query: AdminOrderListQuery) {
  return useQuery({
    queryKey: [ORDER_QUERY_KEYS.LIST, query],
    queryFn: () => orderService.getList(query),
    // 필터를 바꿔도 표가 깜빡이며 비지 않게 이전 결과를 들고 있는다
    placeholderData: keepPreviousData,
    retry: false,
  });
}

/** 탭 건수 — 목록과 같은 조건으로 함께 부른다 */
export function useGetOrderSummary(query: AdminOrderSummaryQuery) {
  return useQuery({
    queryKey: [ORDER_QUERY_KEYS.SUMMARY, query],
    queryFn: () => orderService.getSummary(query),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

/** 툴바 「처리 지연 N건」 — 06d 요약(필터 무관) */
export function useGetOrderDelayCount(enabled: boolean) {
  return useQuery({
    queryKey: [ORDER_QUERY_KEYS.DELAY_COUNT],
    queryFn: orderService.getDelayCount,
    enabled,
    retry: false,
  });
}

export function useGetOrderDetail(orderId: number | null) {
  return useQuery({
    queryKey: [ORDER_QUERY_KEYS.DETAIL, orderId],
    queryFn: () => orderService.getDetail(orderId as number),
    enabled: orderId !== null,
    retry: false,
  });
}

/** 상세 조건 「브랜드」 — 어드민 마켓 목록(`GET /v1/admin/markets`)을 그대로 쓴다 */
export function useGetOrderBrandOptions(enabled: boolean) {
  return useQuery({
    queryKey: [ORDER_QUERY_KEYS.BRAND_OPTIONS],
    queryFn: async () => {
      const data = await sellerService.getSellerUserList({
        page: 1,
        size: OPTION_PAGE_SIZE,
        mainCategory: "",
        marketName: "",
      });
      return data.content.map((market) => ({
        id: String(market.marketId),
        name: market.marketName,
      }));
    },
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/**
 * 상세 조건 「공구」 — 브랜드에 종속. 공구 목록 응답에 마켓 id가 없어 브랜드명으로 검색한 뒤
 * 브랜드명이 정확히 같은 공구만 남긴다.
 */
export function useGetOrderGroupBuyOptions(brandName: string | undefined) {
  return useQuery({
    queryKey: [ORDER_QUERY_KEYS.GROUP_BUY_OPTIONS, brandName],
    queryFn: async () => {
      const data = await adminGroupBuyService.getList({
        tab: "ALL",
        keyword: brandName ?? "",
        sort: "CREATED_DESC",
        page: 1,
        size: OPTION_PAGE_SIZE,
      });
      return data.content
        .filter((groupBuy) => groupBuy.brandName === brandName)
        .map((groupBuy) => ({
          id: String(groupBuy.groupBuyId),
          title: groupBuy.title,
        }));
    },
    enabled: Boolean(brandName),
    staleTime: 5 * 60_000,
    retry: false,
  });
}
