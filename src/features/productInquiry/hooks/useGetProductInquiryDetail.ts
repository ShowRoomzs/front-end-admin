import { PRODUCT_INQUIRY_DETAIL_QUERY_KEY } from "@/features/productInquiry/constants/queryKey";
import { productInquiryService } from "@/features/productInquiry/services/productInquiryService";
import type { ProductInquiryDetailParams } from "@/features/productInquiry/types/productInquiry";
import { useQuery } from "@tanstack/react-query";

/** `params`는 조회 조건이 아니라 이전/다음 계산 범위라 쿼리키에 포함해야 한다 */
export function useGetProductInquiryDetail(
  inquiryId: number,
  params: ProductInquiryDetailParams
) {
  return useQuery({
    queryKey: [PRODUCT_INQUIRY_DETAIL_QUERY_KEY, inquiryId, params],
    queryFn: () =>
      productInquiryService.getProductInquiryDetail(inquiryId, params),
    enabled: Number.isFinite(inquiryId),
  });
}
