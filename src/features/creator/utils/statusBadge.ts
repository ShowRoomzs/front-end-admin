import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import type { CreatorApplicationStatus } from "@/features/creator/services/creatorService";
import { isSlaExceeded } from "@/features/creator/utils/elapsedTime";

interface StatusBadgeDescriptor {
  variant: StatusBadgeVariant;
  label: string;
}

/**
 * 심사 상태 → 배지 (웹 디자인시스템 §9 4원칙 · 브랜드 심사 화면과 동일 규칙)
 * - SLA 초과 = 경고(운영자 조치 필요) · 심사 대기 = 정보 · 승인 = 성공
 * - 반려 = 중립 회색: 이미 종료된 상태라 조치가 불필요하므로 danger를 쓰지 않는다
 *
 * @param appliedAt 신청 일시 — SLA 초과 판정에 쓴다(서버가 경과 시간을 주지 않음)
 * @param detailed 상세 화면용 확장 라벨 사용 여부
 */
export function getApplicationStatusBadge(
  status: CreatorApplicationStatus,
  appliedAt: string | null,
  detailed = false
): StatusBadgeDescriptor {
  if (status === "APPROVED") {
    return { variant: "success", label: detailed ? "승인 완료" : "승인" };
  }

  if (status === "REJECTED") {
    return { variant: "neutral", label: detailed ? "반려 · 파기 완료" : "반려" };
  }

  if (isSlaExceeded(appliedAt)) {
    return {
      variant: "warning",
      label: detailed ? "SLA 초과 · 심사 대기" : "SLA 초과",
    };
  }

  return { variant: "info", label: "심사 대기" };
}
