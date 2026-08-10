import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import {
  PRODUCT_DISPLAY_STATUS,
  PRODUCT_GROUP_BUY_STATUS,
} from "@/features/product/constants/params";
import type {
  ProductDisplayStatus,
  ProductGroupBuyStatus,
} from "@/features/product/services/productService";

interface StatusBadgeDescriptor {
  variant: StatusBadgeVariant;
  label: string;
}

/**
 * 진열 상태 → 배지 (기능요구사항 §12-2 색상 매핑 그대로)
 *
 * 미진열이 danger(빨강)인 것은 §9 상태색 4원칙의 **공식 예외**다 —
 * "종료·취소"가 아니라 "소비자 노출이 실제로 막힌, 운영자가 즉시 인지해야 할 문제 상태"로 본다.
 * 반면 미진열(요청)은 브랜드가 스스로 요청한 것이라 문제 상황이 아니므로 neutral을 쓴다.
 */
export function getDisplayStatusBadge(
  status: ProductDisplayStatus
): StatusBadgeDescriptor {
  const label = PRODUCT_DISPLAY_STATUS[status];

  switch (status) {
    case "DISPLAY":
      return { variant: "success", label };
    case "HIDDEN":
      return { variant: "danger", label };
    case "PENDING_REVIEW":
      return { variant: "warning", label };
    case "HIDE_REQUEST":
      return { variant: "neutral", label };
  }
}

/** 공구 상태 → 배지. 준비중·준비완료·진행중은 info, 연결 없음만 neutral (§12-2) */
export function getGroupBuyStatusBadge(
  status: ProductGroupBuyStatus
): StatusBadgeDescriptor {
  return {
    variant: status === "NOT_CONNECTED" ? "neutral" : "info",
    label: PRODUCT_GROUP_BUY_STATUS[status],
  };
}
