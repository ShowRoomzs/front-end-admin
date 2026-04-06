import { PRODUCT_LIST_QUERY_KEY } from "@/features/product/constants/queryKey";
import {
  productService,
  type ProductListParams,
} from "@/features/product/services/productService";
import { useQuery } from "@tanstack/react-query";

export function useGetProductList(params: ProductListParams) {
  return useQuery({
    queryKey: [PRODUCT_LIST_QUERY_KEY, params],
    queryFn: () => productService.getProductList(params),
  });
}
