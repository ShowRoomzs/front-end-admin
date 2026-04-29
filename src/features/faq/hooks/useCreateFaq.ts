import { queryClient } from "@/common/lib/queryClient";
import { FAQS_QUERY_KEY } from "@/features/faq/constants/queryKey";
import { faqService } from "@/features/faq/services/faqService";
import type { FaqRequest } from "@/features/faq/types/faq";
import { useMutation } from "@tanstack/react-query";

export function useCreateFaq() {
  return useMutation({
    mutationFn: (data: FaqRequest) => faqService.createFaq(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FAQS_QUERY_KEY] });
    },
  });
}
