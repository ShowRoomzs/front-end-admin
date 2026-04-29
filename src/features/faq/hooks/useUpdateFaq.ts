import { queryClient } from "@/common/lib/queryClient";
import { FAQS_QUERY_KEY } from "@/features/faq/constants/queryKey";
import { faqService } from "@/features/faq/services/faqService";
import type { FaqRequest } from "@/features/faq/types/faq";
import { useMutation } from "@tanstack/react-query";

interface UpdateFaqVariables {
  faqId: number;
  data: FaqRequest;
}

export function useUpdateFaq() {
  return useMutation({
    mutationFn: ({ faqId, data }: UpdateFaqVariables) =>
      faqService.updateFaq(faqId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [FAQS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [FAQS_QUERY_KEY, variables.faqId],
      });
    },
  });
}
