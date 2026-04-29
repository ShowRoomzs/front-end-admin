import { queryClient } from "@/common/lib/queryClient";
import { FAQS_QUERY_KEY } from "@/features/faq/constants/queryKey";
import { faqService } from "@/features/faq/services/faqService";
import { useMutation } from "@tanstack/react-query";

export function useDeleteFaq() {
  return useMutation({
    mutationFn: (faqId: number) => faqService.deleteFaq(faqId),
    onSuccess: (_data, faqId) => {
      queryClient.invalidateQueries({ queryKey: [FAQS_QUERY_KEY] });
      queryClient.removeQueries({ queryKey: [FAQS_QUERY_KEY, faqId] });
    },
  });
}
