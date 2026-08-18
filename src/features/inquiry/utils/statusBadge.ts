import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import type { InquiryStatus } from "@/features/inquiry/types/inquiry";

/**
 * 상태 배지 — SLA 초과는 접수 배지를 **교체**한다(§17-6).
 *
 * 병기하지 않는 건 시안의 결정이다. 한 칸에 배지 두 개가 들어가면 상태 컬럼 폭이
 * 무너지고, 초과 건은 어차피 전부 접수 상태라 "접수"를 지워도 정보가 사라지지 않는다.
 *
 * 접수를 경고색이 아니라 정보색으로 두는 것도 운영 확정 사항이다 — 접수는 정상 유입이지
 * 이상 상태가 아니라서, 경고색을 쓰면 목록 전체가 경고로 물들어 SLA 초과가 묻힌다.
 */
export function getInquiryStatusBadge(
  status: InquiryStatus,
  slaExceeded: boolean
): { variant: StatusBadgeVariant; label: string } {
  if (slaExceeded) {
    return { variant: "warning", label: "SLA 초과" };
  }

  if (status === "ANSWERED") {
    return { variant: "neutral", label: "답변완료" };
  }

  return { variant: "info", label: "접수" };
}
