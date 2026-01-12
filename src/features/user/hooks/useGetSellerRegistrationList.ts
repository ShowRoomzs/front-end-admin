import { SELLER_REGISTRATION_LIST_QUERY_KEY } from "@/features/user/constants/queryKey";
import {
  sellerService,
  type SellerRegistrationParams,
} from "@/features/user/services/sellerService";
import { useQuery } from "@tanstack/react-query";

export function useGetSellerRegistrationList(params: SellerRegistrationParams) {
  return useQuery({
    queryKey: [SELLER_REGISTRATION_LIST_QUERY_KEY, params],
    queryFn: () => sellerService.getSellerRegistrationList(params),
  });
}
