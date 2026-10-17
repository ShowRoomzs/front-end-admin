import { DEV_MOCK_ENABLED } from "@/common/utils/devMock";
import { REFUND_SUMMARY_POLL_INTERVAL } from "@/features/refund/constants/params";
import { REFUND_QUERY_KEYS } from "@/features/refund/constants/queryKeys";
import { adminRefundService } from "@/features/refund/services/adminRefundService";
import type {
  RefundExecuteRequest,
  RefundListParams,
} from "@/features/refund/types";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

// API가 없는 배포본에서는 요청 자체를 보내지 않는다(서비스가 던지는 ApiNotReadyError를 화면이 보지 않는다)
const ENABLED = DEV_MOCK_ENABLED;

export function useGetRefundList(params: RefundListParams) {
  return useQuery({
    queryKey: [REFUND_QUERY_KEYS.LIST, params],
    queryFn: () => adminRefundService.getList(params),
    enabled: ENABLED,
    // 탭·페이지를 바꿀 때 표가 비었다 채워지며 깜빡이지 않게 이전 결과를 들고 있는다
    placeholderData: keepPreviousData,
  });
}

/** 탭 카운트 · 사이드바 배지(집행 대기 + 실패) */
export function useGetRefundSummary() {
  return useQuery({
    queryKey: [REFUND_QUERY_KEYS.SUMMARY],
    queryFn: adminRefundService.getSummary,
    enabled: ENABLED,
    refetchInterval: REFUND_SUMMARY_POLL_INTERVAL,
    staleTime: 10_000,
  });
}

export function useGetRefundDetail(refundId: number | null) {
  return useQuery({
    queryKey: [REFUND_QUERY_KEYS.DETAIL, refundId],
    queryFn: () => adminRefundService.getDetail(refundId as number),
    enabled: ENABLED && refundId !== null,
    // 돈이 나가기 직전의 화면이라 캐시를 믿지 않는다 — 열 때마다 새로 읽는다
    gcTime: 0,
  });
}

/**
 * 환불 쓰기 — 성공하면 목록·요약(탭 카운트·배지)을 함께 무효화한다.
 * 낙관적 갱신을 쓰지 않는다: 돈이 움직이는 일이라 서버가 정한 상태만 믿는다.
 */
function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [REFUND_QUERY_KEYS.LIST] });
    queryClient.invalidateQueries({ queryKey: [REFUND_QUERY_KEYS.SUMMARY] });
    queryClient.invalidateQueries({ queryKey: [REFUND_QUERY_KEYS.DETAIL] });
  };
}

export function useExecuteRefund() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { refundId: number; body: RefundExecuteRequest }) =>
      adminRefundService.execute(v.refundId, v.body),
    onSuccess: invalidate,
  });
}

export function useRetryRefund() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (refundId: number) => adminRefundService.retry(refundId),
    onSuccess: invalidate,
  });
}
