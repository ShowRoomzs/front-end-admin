import { ORDER_QUERY_KEYS } from "@/features/order/constants/queryKeys";
import { orderService } from "@/features/order/services/orderService";
import type {
  AdminOrderDetail,
  CancelCommand,
  CorrectDeliveredAtRequest,
  DefectClaimRequest,
  OperatorRefundRequest,
  ShipmentRequest,
} from "@/features/order/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface GroupVariables<B> {
  orderId: number;
  deliveryGroupId: number;
  body: B;
}

/**
 * 운영자 조치 — 서버가 돌려준 상세로 모달을 바로 바꾸고, 목록 · 탭 건수 · 상세를 다시 받는다.
 * 상태 · 이력 · 가능한 조치를 서버가 다시 계산하므로 낙관적 갱신은 쓰지 않는다.
 */
function useSettle() {
  const queryClient = useQueryClient();
  return (orderId: number, detail?: AdminOrderDetail) => {
    if (detail) {
      queryClient.setQueryData([ORDER_QUERY_KEYS.DETAIL, orderId], detail);
    }
    queryClient.invalidateQueries({ queryKey: [ORDER_QUERY_KEYS.DETAIL] });
    queryClient.invalidateQueries({ queryKey: [ORDER_QUERY_KEYS.LIST] });
    queryClient.invalidateQueries({ queryKey: [ORDER_QUERY_KEYS.SUMMARY] });
    queryClient.invalidateQueries({ queryKey: [ORDER_QUERY_KEYS.DELAY_COUNT] });
  };
}

export function useRegisterShipment() {
  const settle = useSettle();
  return useMutation({
    mutationFn: (v: GroupVariables<ShipmentRequest>) =>
      orderService.registerShipment(v.deliveryGroupId, v.body),
    onSuccess: (detail, v) => settle(v.orderId, detail),
  });
}

export function useCorrectDeliveredAt() {
  const settle = useSettle();
  return useMutation({
    mutationFn: (v: GroupVariables<CorrectDeliveredAtRequest>) =>
      orderService.correctDeliveredAt(v.deliveryGroupId, v.body),
    onSuccess: (detail, v) => settle(v.orderId, detail),
  });
}

export function useEnqueueRefund() {
  const settle = useSettle();
  return useMutation({
    mutationFn: (v: GroupVariables<OperatorRefundRequest>) =>
      orderService.enqueueRefund(v.deliveryGroupId, v.body),
    onSuccess: (detail, v) => settle(v.orderId, detail),
  });
}

export function useCancelGroup() {
  const settle = useSettle();
  return useMutation({
    mutationFn: (v: GroupVariables<CancelCommand>) =>
      orderService.cancel(v.deliveryGroupId, v.body),
    onSuccess: (detail, v) => settle(v.orderId, detail),
  });
}

/** B6은 상세가 아니라 생성 id를 돌려준다 — 상세는 다시 받는다 */
export function useOpenDefectClaim() {
  const settle = useSettle();
  return useMutation({
    mutationFn: (v: GroupVariables<DefectClaimRequest>) =>
      orderService.openDefectClaim(v.deliveryGroupId, v.body),
    onSuccess: (_, v) => settle(v.orderId),
  });
}
