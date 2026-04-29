import { FAQ_CATEGORIES_QUERY_KEY } from "@/features/faq/constants/queryKey";
import { faqService } from "@/features/faq/services/faqService";
import { useQuery } from "@tanstack/react-query";

export function useGetFaqCategories() {
  return useQuery({
    queryKey: [FAQ_CATEGORIES_QUERY_KEY],
    queryFn: faqService.getFaqCategories,
  });
}
