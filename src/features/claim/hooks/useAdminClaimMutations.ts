import { ADMIN_CLAIM_QUERY_KEYS } from "@/features/claim/constants/queryKeys";
import { adminClaimService } from "@/features/claim/services/adminClaimService";
import type { OperatorRefundRequest } from "@/features/claim/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * 운영자 사유 환불 — 성공하면 상세·목록·요약(탭 건수 · 이의 배지)을 함께 무효화한다.
 * 낙관적 갱신을 쓰지 않는다: 단계·이력·귀책을 서버가 다시 계산해 내려준다.
 */
export function useRefundByOperator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { claimNo: string; body: OperatorRefundRequest }) =>
      adminClaimService.refundByOperator(v.claimNo, v.body),
    onSuccess: () => {
      Object.values(ADMIN_CLAIM_QUERY_KEYS).forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      );
    },
  });
}
