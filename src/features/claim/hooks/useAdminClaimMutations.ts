import { ADMIN_CLAIM_QUERY_KEYS } from "@/features/claim/constants/queryKeys";
import { adminClaimService } from "@/features/claim/services/adminClaimService";
import type {
  ClaimActionRequest,
  ClaimActionResponse,
} from "@/features/claim/types";
import { won } from "@/features/claim/utils/format";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export type ClaimActionKind = "DISPUTE" | "UNANSWERED";

interface ClaimActionVariables {
  kind: ClaimActionKind;
  claimId: number;
  body: ClaimActionRequest;
}

/**
 * 운영자 조치 둘 — B2 반려 이의 인용 · 검수 무응답 환불. 둘 다 운영자 사유 환불로 편입하고
 * 같은 응답(환불번호 · 서버 계산 금액)을 돌려준다.
 *
 * 끝나면 성공·실패와 상관없이 목록·요약(탭 건수 · 이의 배지)·상세를 무효화한다 —
 * 실패(409 그 사이 상태 변경)여도 화면이 서버의 지금 상태로 돌아와야 한다. 낙관적 갱신은 쓰지 않는다.
 *
 * 토스트도 여기서 띄운다 — `mutate()`에 넘긴 콜백은 요청 중에 모달을 닫으면 불리지 않는다.
 * 실패 토스트는 apiInstance 인터셉터가 서버 메시지로 띄우므로 여기서 또 띄우지 않는다.
 */
export function useClaimOperatorAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: ClaimActionVariables): Promise<ClaimActionResponse> =>
      v.kind === "DISPUTE"
        ? adminClaimService.acceptDispute(v.claimId, v.body)
        : adminClaimService.refundUnanswered(v.claimId, v.body),
    onSuccess: (data) => {
      toast.success(
        `환불 대기로 편입했습니다 — ${data.refundNo} · ${won(data.amount)}`
      );
    },
    onSettled: () =>
      Promise.all(
        Object.values(ADMIN_CLAIM_QUERY_KEYS).map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] })
        )
      ),
  });
}
