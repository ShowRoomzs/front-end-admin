import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import type { SellerRegistrationStatus } from "@/features/seller/services/sellerService";
import { isSlaExceeded } from "@/features/seller/utils/elapsedTime";

interface StatusBadgeDescriptor {
  variant: StatusBadgeVariant;
  label: string;
}

/**
 * 심사 상태 → 배지 (웹 디자인시스템 v1.1 §9 4원칙)
 * - SLA 초과 = 경고(운영자 조치 필요) · 심사 대기 = 정보 · 승인 = 성공
 * - 반려 = 중립 회색: 이미 종료된 상태라 조치가 불필요하므로 danger를 쓰지 않는다
 *
 * @param createdAt 신청 일시 — SLA 초과 판정에 쓴다(서버가 경과 시간을 주지 않음)
 * @param detailed 상세 화면용 확장 라벨 사용 여부
 */
export function getApplicationStatusBadge(
  status: SellerRegistrationStatus,
  createdAt: string | null,
  detailed = false
): StatusBadgeDescriptor {
  if (status === "APPROVED") {
    return { variant: "success", label: detailed ? "승인 완료" : "승인" };
  }

  if (status === "REJECTED") {
    return { variant: "neutral", label: detailed ? "반려 · 파기 완료" : "반려" };
  }

  if (isSlaExceeded(createdAt)) {
    return {
      variant: "warning",
      label: detailed ? "SLA 초과 · 심사 대기" : "SLA 초과",
    };
  }

  return { variant: "info", label: "심사 대기" };
}
