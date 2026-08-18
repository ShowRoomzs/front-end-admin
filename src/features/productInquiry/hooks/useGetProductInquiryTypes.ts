import { PRODUCT_INQUIRY_TYPES_QUERY_KEY } from "@/features/productInquiry/constants/queryKey";
import { productInquiryService } from "@/features/productInquiry/services/productInquiryService";
import { useQuery } from "@tanstack/react-query";

/**
 * 유형 옵션은 서버가 내려주는 만큼 그린다.
 *
 * §18 문서는 4종(옵션·성분·사용법·재입고·기타)이지만 서버 enum에는 `배송`이 추가돼
 * 5종이다(§23 파트너센터 문의 관리에서 늘었다). 하드코딩하면 이런 증감마다 필터에서
 * 값이 빠져 조회가 안 되는 유형이 생긴다.
 */
export function useGetProductInquiryTypes() {
  return useQuery({
    queryKey: [PRODUCT_INQUIRY_TYPES_QUERY_KEY],
    queryFn: productInquiryService.getProductInquiryTypes,
  });
}
