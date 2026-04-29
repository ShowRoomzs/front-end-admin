import { FAQS_QUERY_KEY } from "@/features/faq/constants/queryKey";
import { faqService } from "@/features/faq/services/faqService";
import { useQuery } from "@tanstack/react-query";

export function useGetFaqDetail(faqId: number) {
  return useQuery({
    queryKey: [FAQS_QUERY_KEY, faqId],
    queryFn: () => faqService.getFaqDetail(faqId),
    enabled: Number.isFinite(faqId),
  });
}
