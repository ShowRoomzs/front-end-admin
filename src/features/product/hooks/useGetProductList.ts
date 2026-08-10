import { PRODUCT_LIST_QUERY_KEY } from "@/features/product/constants/queryKey";
import {
  productService,
  type AdminProductParams,
} from "@/features/product/services/productService";
import { useQuery } from "@tanstack/react-query";

export function useGetProductList(params: AdminProductParams) {
  return useQuery({
    queryKey: [PRODUCT_LIST_QUERY_KEY, params],
    queryFn: () => productService.getProductList(params),
  });
}
