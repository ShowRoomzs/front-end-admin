import { FAQS_QUERY_KEY } from "@/features/faq/constants/queryKey";
import { faqService } from "@/features/faq/services/faqService";
import type { FaqListParams } from "@/features/faq/types/faq";
import { useQuery } from "@tanstack/react-query";

export function useGetFaqList(params: FaqListParams) {
  return useQuery({
    queryKey: [FAQS_QUERY_KEY, params],
    queryFn: () => faqService.getFaqList(params),
  });
}
