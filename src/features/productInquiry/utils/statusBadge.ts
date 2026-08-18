import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import type {
  ProductInquiryAnswerStatus,
  ProductInquiryExposureStatus,
} from "@/features/productInquiry/types/productInquiry";

/**
 * 상태 배지 색 (§18-1).
 *
 * - 답변대기 = **정보**: 브랜드가 조치할 건이라 운영자에게는 정상 진행 중이다.
 *   운영자를 재촉하는 색을 쓰면 안 된다.
 * - 답변완료 = 중립(종료).
 * - 삭제 요청 = **경고**: 이 화면에서 유일하게 운영자 조치가 필요한 상태.
 * - 삭제 = **위험**: "종료는 중립"의 의도적 예외다 — 소비자 노출이 실제로 막힌
 *   상태는 목록에서 즉시 눈에 띄어야 한다(ui-admin-04 미진열 선례).
 *
 * 텍스트는 서버 `statusLabel`을 그대로 쓰고 여기서는 색만 정한다.
 */
export function getProductInquiryStatusVariant(
  status: ProductInquiryAnswerStatus,
  exposureStatus: ProductInquiryExposureStatus
): StatusBadgeVariant {
  if (exposureStatus === "DELETED") {
    return "danger";
  }

  if (exposureStatus === "DELETE_REQUESTED") {
    return "warning";
  }

  return status === "ANSWERED" ? "neutral" : "info";
}
