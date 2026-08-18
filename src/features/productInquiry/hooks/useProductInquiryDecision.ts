import { queryClient } from "@/common/lib/queryClient";
import {
  PRODUCT_INQUIRIES_QUERY_KEY,
  PRODUCT_INQUIRY_DETAIL_QUERY_KEY,
} from "@/features/productInquiry/constants/queryKey";
import { productInquiryService } from "@/features/productInquiry/services/productInquiryService";
import type {
  ProductInquiryDeleteExecuteRequest,
  ProductInquiryRejectRequest,
} from "@/features/productInquiry/types/productInquiry";
import { useMutation } from "@tanstack/react-query";

interface DecisionVariables<T> {
  inquiryId: number;
  data: T;
}

/** 처리 후 상세와 목록을 함께 무효화한다 — 목록을 빼면 탭 건수가 옛 값으로 남는다 */
function invalidate(inquiryId: number) {
  queryClient.invalidateQueries({
    queryKey: [PRODUCT_INQUIRY_DETAIL_QUERY_KEY, inquiryId],
  });
  queryClient.invalidateQueries({ queryKey: [PRODUCT_INQUIRIES_QUERY_KEY] });
}

/**
 * 삭제 집행 — 되돌릴 수 없다(§18-1 "삭제 복구 경로 없음").
 *
 * 낙관적 업데이트를 하지 않는다. 실패했는데 화면만 삭제로 바뀌면 운영자는 내렸다고
 * 믿고 떠나는데 게시물은 그대로 노출된 채 남는다.
 */
export function useExecuteProductInquiryDelete() {
  return useMutation({
    mutationFn: ({
      inquiryId,
      data,
    }: DecisionVariables<ProductInquiryDeleteExecuteRequest>) =>
      productInquiryService.executeDelete(inquiryId, data),
    onSuccess: (_response, { inquiryId }) => invalidate(inquiryId),
  });
}

/** 삭제 요청 반려 — 문의는 게시 유지되고 상태만 요청 직전으로 되돌아간다 */
export function useRejectProductInquiryDeleteRequest() {
  return useMutation({
    mutationFn: ({
      inquiryId,
      data,
    }: DecisionVariables<ProductInquiryRejectRequest>) =>
      productInquiryService.rejectDeleteRequest(inquiryId, data),
    onSuccess: (_response, { inquiryId }) => invalidate(inquiryId),
  });
}
