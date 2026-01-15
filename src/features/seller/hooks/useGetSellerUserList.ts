import { SELLER_USER_LIST_QUERY_KEY } from "@/features/seller/constants/queryKey";
import {
  sellerService,
  type SellerUserListParams,
} from "@/features/seller/services/sellerService";
import { useQuery } from "@tanstack/react-query";

export function useGetSellerUserList(params: SellerUserListParams) {
  return useQuery({
    queryKey: [SELLER_USER_LIST_QUERY_KEY, params],
    queryFn: () => sellerService.getSellerUserList(params),
  });
}
