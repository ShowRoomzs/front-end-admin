import { INQUIRIES_QUERY_KEY } from "@/features/inquiry/constants/queryKey";
import { inquiryService } from "@/features/inquiry/services/inquiryService";
import type { InquiryListParams } from "@/features/inquiry/types/inquiry";
import { useQuery } from "@tanstack/react-query";

export function useGetInquiryList(params: InquiryListParams) {
  return useQuery({
    queryKey: [INQUIRIES_QUERY_KEY, params],
    queryFn: () => inquiryService.getInquiryList(params),
  });
}
