import { PRODUCT_DETAIL_QUERY_KEY } from "@/features/product/constants/queryKey";
import { productService } from "@/features/product/services/productService";
import { useQuery } from "@tanstack/react-query";

export function useGetProductDetail(productId: number) {
  return useQuery({
    queryKey: [PRODUCT_DETAIL_QUERY_KEY, productId],
    queryFn: () => productService.getProductDetail(productId),
  });
}
