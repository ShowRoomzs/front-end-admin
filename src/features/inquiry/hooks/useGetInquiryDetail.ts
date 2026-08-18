import { INQUIRY_DETAIL_QUERY_KEY } from "@/features/inquiry/constants/queryKey";
import { inquiryService } from "@/features/inquiry/services/inquiryService";
import type { InquiryDetailParams } from "@/features/inquiry/types/inquiry";
import { useQuery } from "@tanstack/react-query";

/**
 * `params`(status·type·keyword)는 조회 조건이 아니라 **이전/다음 계산 범위**라
 * 쿼리키에 포함해야 한다. 같은 문의라도 어느 탭·유형에서 들어왔느냐에 따라
 * prev/next가 달라진다.
 */
export function useGetInquiryDetail(
  inquiryId: number,
  params: InquiryDetailParams
) {
  return useQuery({
    queryKey: [INQUIRY_DETAIL_QUERY_KEY, inquiryId, params],
    queryFn: () => inquiryService.getInquiryDetail(inquiryId, params),
    enabled: Number.isFinite(inquiryId),
  });
}
