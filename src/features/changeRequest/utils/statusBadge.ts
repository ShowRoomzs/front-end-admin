import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import type { ChangeRequestStatus } from "@/features/changeRequest/services/changeRequestService";

interface ChangeRequestStatusBadge {
  variant: StatusBadgeVariant;
  label: string;
}

/**
 * 상태 배지 (§9 상태색 원칙).
 *
 * 반려는 `danger`가 아니라 `neutral`이다 — 이미 끝난 상태라 운영자가 더 할 일이 없다.
 * `danger`는 파괴적 액션(반려 **버튼**)에만 남겨 둔다. SLA 초과만 조치가 필요하므로
 * `warning`을 쓴다.
 *
 * 처리 완료 건을 먼저 걸러내는 이유: `slaExceeded`는 검토 대기에서만 true가 되지만,
 * 서버가 규칙을 바꿔도 승인·반려 배지가 경고색으로 흔들리지 않게 하기 위해서다.
 */
export function getChangeRequestStatusBadge(
  status: ChangeRequestStatus,
  slaExceeded: boolean,
  detailed = false
): ChangeRequestStatusBadge {
  if (status === "APPROVED") {
    return { variant: "success", label: "승인" };
  }
  if (status === "REJECTED") {
    return { variant: "neutral", label: "반려" };
  }
  if (status === "CANCELED") {
    return { variant: "neutral", label: "요청 취소" };
  }
  if (slaExceeded) {
    return {
      variant: "warning",
      label: detailed ? "SLA 초과 · 검토 대기" : "SLA 초과",
    };
  }
  return { variant: "info", label: "검토 대기" };
}
