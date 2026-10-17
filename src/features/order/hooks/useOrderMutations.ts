import { ORDER_QUERY_KEYS } from "@/features/order/constants/queryKeys";
import { orderService } from "@/features/order/services/orderService";
import type {
  OrderCorrectDeliveredAtRequest,
  OrderForceCancelRequest,
  OrderOpenReturnRequest,
  OrderProxyInvoiceRequest,
  OrderRefundRequest,
} from "@/features/order/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * 운영자 액션 — 성공하면 상세·목록·탭 건수를 함께 다시 받는다.
 * 상태·이력·가능한 액션을 서버가 다시 계산해 내려주므로 낙관적 갱신은 쓰지 않는다.
 */
function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [ORDER_QUERY_KEYS.DETAIL] });
    queryClient.invalidateQueries({ queryKey: [ORDER_QUERY_KEYS.LIST] });
    queryClient.invalidateQueries({ queryKey: [ORDER_QUERY_KEYS.SUMMARY] });
  };
}

export function useProxyInvoice() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { orderNo: string; body: OrderProxyInvoiceRequest }) =>
      orderService.proxyInvoice(v.orderNo, v.body),
    onSuccess: invalidate,
  });
}

export function useCorrectDeliveredAt() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: {
      orderNo: string;
      body: OrderCorrectDeliveredAtRequest;
    }) => orderService.correctDeliveredAt(v.orderNo, v.body),
    onSuccess: invalidate,
  });
}

export function useRefundOrder() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { orderNo: string; body: OrderRefundRequest }) =>
      orderService.refund(v.orderNo, v.body),
    onSuccess: invalidate,
  });
}

export function useOpenReturn() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { orderNo: string; body: OrderOpenReturnRequest }) =>
      orderService.openReturn(v.orderNo, v.body),
    onSuccess: invalidate,
  });
}

export function useForceCancel() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { orderNo: string; body: OrderForceCancelRequest }) =>
      orderService.forceCancel(v.orderNo, v.body),
    onSuccess: invalidate,
  });
}
