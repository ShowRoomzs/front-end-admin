import { SELLER_REGISTRATION_DETAIL_QUERY_KEY } from "@/features/user/constants/queryKey";
import { sellerService } from "@/features/user/services/sellerService";
import { useQuery } from "@tanstack/react-query";

export function useGetSellerRegistrationDetail(sellerId: number) {
  return useQuery({
    queryKey: [SELLER_REGISTRATION_DETAIL_QUERY_KEY, sellerId],
    queryFn: () => sellerService.getSellerRegistrationDetail(sellerId),
  });
}
