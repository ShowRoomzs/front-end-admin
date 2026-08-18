import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import type { ConsumerStatus } from "@/features/consumer/types/consumer";

const STATUS_LABELS: Record<ConsumerStatus, string> = {
  NORMAL: "활성",
  SUSPENDED: "정지",
  WITHDRAWN: "탈퇴",
  DORMANT: "휴면",
};

/**
 * 상태 배지 (§25-3) — 활성=성공 / 정지=**위험**(운영자 조치 · 원칙 ①) / 탈퇴=중립(원칙 ② 해지).
 *
 * 정지가 위험색인 건 운영자가 내린 제재라서다. 탈퇴는 소비자가 스스로 끝낸 상태라
 * 조치할 것이 없어 중립이다 — 둘을 같은 색으로 묶지 말 것.
 *
 * 휴면은 탭이 없지만 전체 탭에는 나올 수 있어 중립으로 받아 둔다(휴면 배치 미구현).
 */
export function getConsumerStatusBadge(status: ConsumerStatus): {
  variant: StatusBadgeVariant;
  label: string;
} {
  if (status === "NORMAL") {
    return { variant: "success", label: STATUS_LABELS.NORMAL };
  }
  if (status === "SUSPENDED") {
    return { variant: "danger", label: STATUS_LABELS.SUSPENDED };
  }
  return { variant: "neutral", label: STATUS_LABELS[status] ?? status };
}
