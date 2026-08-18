import { PRODUCT_INQUIRIES_QUERY_KEY } from "@/features/productInquiry/constants/queryKey";
import { productInquiryService } from "@/features/productInquiry/services/productInquiryService";
import type { ProductInquiryListParams } from "@/features/productInquiry/types/productInquiry";
import { useQuery } from "@tanstack/react-query";

export function useGetProductInquiryList(params: ProductInquiryListParams) {
  return useQuery({
    queryKey: [PRODUCT_INQUIRIES_QUERY_KEY, params],
    queryFn: () => productInquiryService.getProductInquiryList(params),
  });
}
