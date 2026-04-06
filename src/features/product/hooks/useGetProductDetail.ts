import { PRODUCT_LIST_QUERY_KEY } from "@/features/product/constants/queryKey";
import {
  productService,
} from "@/features/product/services/productService";
import { useQuery } from "@tanstack/react-query";

const PRODUCT_DETAIL_QUERY_KEY = "product-detail";

export function useGetProductDetail(productId: number) {
  return useQuery({
    queryKey: [PRODUCT_LIST_QUERY_KEY, PRODUCT_DETAIL_QUERY_KEY, productId],
    queryFn: () => productService.getProductDetail(productId),
    enabled: !!productId,
  });
}
