import { faqService } from "@/features/faq/services/faqService";
import type { FaqReorderRequest } from "@/features/faq/types/faq";
import { useMutation } from "@tanstack/react-query";

export function useReorderFaq() {
  return useMutation({
    mutationFn: (data: FaqReorderRequest) => faqService.reorderFaqs(data),
    // 캐시 초기화 x 프론트단에서 낙관적 업데이트 진행
  });
}
