import { SELLER_REGISTRATION_LIST_QUERY_KEY } from "@/features/seller/constants/queryKey";
import {
  sellerService,
  type SellerRegistrationParams,
} from "@/features/seller/services/sellerService";
import { useQuery } from "@tanstack/react-query";

// 목록 응답에 statusCounts가 함께 오므로 행은 최소로만 받는다
const PENDING_COUNT_PARAMS: SellerRegistrationParams = {
  status: "PENDING",
  keyword: "",
  page: 1,
  size: 1,
};

/**
 * 사이드바 뱃지에 쓸 브랜드 심사 대기 건수.
 * 목록 API가 내려주는 statusCounts.pending을 그대로 사용한다.
 */
export function useGetSellerPendingCount() {
  const { data, isLoading } = useQuery({
    queryKey: [
      SELLER_REGISTRATION_LIST_QUERY_KEY,
      "count",
      PENDING_COUNT_PARAMS,
    ],
    queryFn: () => sellerService.getSellerRegistrationList(PENDING_COUNT_PARAMS),
    select: (data) => data.statusCounts?.pending ?? 0,
  });

  return {
    pendingCount: data ?? 0,
    isLoading,
  };
}
