import { queryClient } from "@/common/lib/queryClient";
import {
  INQUIRIES_QUERY_KEY,
  INQUIRY_DETAIL_QUERY_KEY,
  INQUIRY_SUMMARY_QUERY_KEY,
} from "@/features/inquiry/constants/queryKey";
import { inquiryService } from "@/features/inquiry/services/inquiryService";
import type { InquiryAnswerRequest } from "@/features/inquiry/types/inquiry";
import { useMutation } from "@tanstack/react-query";

interface RegisterAnswerVariables {
  inquiryId: number;
  data: InquiryAnswerRequest;
}

/**
 * 답변 등록 — 등록은 1회뿐이고 수정·삭제가 없다(§17-4).
 *
 * 그래서 **낙관적 업데이트를 하지 않는다.** 상태는 성공 응답을 받고 다시 조회한
 * 값으로만 바뀐다. 화면에서 먼저 답변완료로 바꿔 두면, 실패했을 때 운영자는
 * 보냈다고 믿고 떠나는데 소비자에게는 아무것도 가지 않는다.
 */
export function useRegisterAnswer() {
  return useMutation({
    mutationFn: ({ inquiryId, data }: RegisterAnswerVariables) =>
      inquiryService.registerAnswer(inquiryId, data),
    onSuccess: (_response, { inquiryId }) => {
      queryClient.invalidateQueries({
        queryKey: [INQUIRY_DETAIL_QUERY_KEY, inquiryId],
      });
      queryClient.invalidateQueries({ queryKey: [INQUIRIES_QUERY_KEY] });
      // 배지를 빼먹으면 답변을 보내도 GNB 숫자가 그대로 남는다
      queryClient.invalidateQueries({ queryKey: [INQUIRY_SUMMARY_QUERY_KEY] });
    },
  });
}
