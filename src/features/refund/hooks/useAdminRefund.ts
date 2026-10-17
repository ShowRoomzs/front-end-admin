import { REFUND_SUMMARY_POLL_INTERVAL } from "@/features/refund/constants/params";
import { REFUND_QUERY_KEYS } from "@/features/refund/constants/queryKeys";
import { adminRefundService } from "@/features/refund/services/adminRefundService";
import type { RefundListParams } from "@/features/refund/types";
import { formatWon } from "@/features/refund/utils/format";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

export function useGetRefundList(params: RefundListParams) {
  return useQuery({
    queryKey: [REFUND_QUERY_KEYS.LIST, params],
    queryFn: () => adminRefundService.getList(params),
    // 탭·페이지를 바꿀 때 표가 비었다 채워지며 깜빡이지 않게 이전 결과를 들고 있는다
    placeholderData: keepPreviousData,
  });
}

/** 탭 숫자 · 표 위 요약(`tabs`) · 사이드바 배지(`badge` = 집행 대기 + 실패) */
export function useGetRefundSummary() {
  return useQuery({
    queryKey: [REFUND_QUERY_KEYS.SUMMARY],
    queryFn: adminRefundService.getSummary,
    refetchInterval: REFUND_SUMMARY_POLL_INTERVAL,
    staleTime: 10_000,
  });
}

export function useGetRefundDetail(refundTaskId: number | null) {
  return useQuery({
    queryKey: [REFUND_QUERY_KEYS.DETAIL, refundTaskId],
    queryFn: () => adminRefundService.getDetail(refundTaskId as number),
    enabled: refundTaskId !== null,
    // 돈이 나가기 직전의 화면이라 캐시를 믿지 않는다 — 열 때마다 새로 읽는다
    gcTime: 0,
  });
}

/**
 * 환불 쓰기 뒤 목록·요약(탭 숫자·배지)·상세를 함께 무효화한다.
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

/*
  집행(M1) · 재시도(M2) 공용 — 서버도 `POST /execute` 하나다.
  결과 토스트는 화면이 아니라 여기서 띄운다 — mutate()에 넘긴 콜백은 그 사이 화면을 떠나면
  불리지 않아서, PG 취소가 끝났는데도 운영자가 결과를 못 보는 일이 생긴다.
  HTTP 실패(404 · 409 등)의 문구는 공용 인터셉터가 서버 메시지로 띄운다.
*/
export function useExecuteRefund() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: {
      refundTaskId: number;
      /** 토스트에 적을 환불번호 — 요청 본문에는 싣지 않는다 */
      refundNo: string;
      /** 재시도(M2)면 true — 문구만 다르다 */
      retry: boolean;
    }) => adminRefundService.execute(v.refundTaskId),
    onSuccess: ({ outcome, refund }, v) => {
      switch (outcome) {
        case "DONE":
          toast.success(
            `${formatWon(refund.amount)} 환불 완료 — ${v.refundNo}`
          );
          break;
        case "FAILED":
          // PG가 명시적으로 거절 — 행은 실패 탭으로 간다
          toast.error(
            `${refund.lastError ?? "PG 거절"} — ${v.retry ? "다시 실패했습니다" : "환불이 실패해 실패 탭으로 옮겼습니다"}. (${v.refundNo})`
          );
          break;
        case "UNKNOWN":
          // 결과를 못 받았다 — 처리 중으로 남고 정리 배치가 30분 안에 결론을 낸다
          toast(
            `결과 확인 중입니다 — PG 응답을 기다리고 있습니다. 잠시 후 새로고침해 주세요. (${v.refundNo})`
          );
          break;
        case "SKIPPED":
          toast(
            `같은 결제의 다른 환불이 처리 중입니다 — 잠시 후 다시 시도해 주세요. (${v.refundNo})`
          );
          break;
      }
      invalidate();
    },
    // 409(이미 처리 중 · 완료) 등 — 상태가 바뀌었을 수 있으니 다시 읽는다
    onError: () => invalidate(),
  });
}
