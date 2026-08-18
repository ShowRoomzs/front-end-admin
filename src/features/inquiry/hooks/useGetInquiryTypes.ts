import { INQUIRY_TYPES_QUERY_KEY } from "@/features/inquiry/constants/queryKey";
import { inquiryService } from "@/features/inquiry/services/inquiryService";
import { useQuery } from "@tanstack/react-query";

export function useGetInquiryTypes() {
  return useQuery({
    queryKey: [INQUIRY_TYPES_QUERY_KEY],
    queryFn: inquiryService.getInquiryTypes,
  });
}
