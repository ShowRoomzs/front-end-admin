import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import type {
  AdminChannelMemberStatus,
  ServerTone,
} from "@/features/thread/types";

const TONE_VARIANT: Record<string, StatusBadgeVariant> = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  DANGER: "danger",
  NEUTRAL: "neutral",
};

/** 서버 톤(badgeTone · holdTone) → 공용 StatusBadge 변형. 모르는 값은 중립 */
export function toBadgeVariant(
  tone: ServerTone | null | undefined
): StatusBadgeVariant {
  return (tone ? TONE_VARIANT[tone.toUpperCase()] : undefined) ?? "neutral";
}

/**
 * 회원 상태 배지 — 활성 = 성공 · 정지 = 위험(운영자가 내린 제재) · 휴면 · 탈퇴 = 중립.
 * 소비자 회원 관리(consumer/utils/statusBadge)와 같은 색 규칙이다.
 */
export function memberStatusVariant(
  status: AdminChannelMemberStatus
): StatusBadgeVariant {
  if (status === "ACTIVE") {
    return "success";
  }
  if (status === "SUSPENDED") {
    return "danger";
  }
  return "neutral";
}
