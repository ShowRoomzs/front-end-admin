import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import type { HistoryDotTone } from "@/common/components/HistoryList/HistoryList";
import type {
  PostDeleteReason,
  PostMonitoringStatus,
  TimelineActor,
} from "@/features/post/types";

/**
 * 상태 색 — 게시중=성공 / 신고 접수 · 이의 신청 심사 중=경고 / 노출 중지=위험 / 영구 삭제=중립(시안 rule 「상태 색 매핑」).
 * 노출 중지는 어드민 관점으로는 정보색이지만 스튜디오와 같은 위험색으로 맞췄다(「색 충돌 판단」).
 */
export const MONITORING_STATUS_TONE: Record<
  PostMonitoringStatus,
  StatusBadgeVariant
> = {
  PUBLISHED: "success",
  REPORTED: "warning",
  SUSPENDED: "danger",
  UNDER_REVIEW: "warning",
  CLOSED: "neutral",
  DRAFT: "info",
};

/** 상세 레일 배지 — 서버 라벨이 비었을 때만 쓴다 */
export const MONITORING_STATUS_LABEL: Record<PostMonitoringStatus, string> = {
  PUBLISHED: "게시중",
  REPORTED: "신고 접수",
  SUSPENDED: "노출 중지",
  UNDER_REVIEW: "이의 신청 심사 중",
  CLOSED: "영구 삭제",
  DRAFT: "작성중",
};

/** 목록 상태 열은 칸이 좁아 시안 C1이 「이의 신청」으로 줄여 쓴다 */
export const LIST_STATUS_LABEL: Record<PostMonitoringStatus, string> = {
  ...MONITORING_STATUS_LABEL,
  UNDER_REVIEW: "이의 신청",
};

/** 삭제 경위 「삭제 유형」 · 레일 「경위」 */
export const DELETE_REASON_LABEL: Record<PostDeleteReason, string> = {
  SELF: "작성자 삭제",
  APPEAL_REJECTED: "이의 신청 반려",
  APPEAL_EXPIRED: "이의 신청 기한 경과",
  ADMIN: "운영자 직권 삭제",
};

/** 처리 이력 점 색 — 서버 `tone` 문자열을 공용 HistoryList 톤으로 옮긴다 */
export const TIMELINE_TONE: Record<string, HistoryDotTone> = {
  INFO: "accent",
  SUCCESS: "success",
  WARNING: "warn",
  DANGER: "danger",
  NEUTRAL: "muted",
};

/** 처리 이력 주체 표기 — 「운영자(김운영)」 · 「인플루언서(김소연)」 · 「소비자(한*준)」 · 「시스템」 */
export const TIMELINE_ACTOR_LABEL: Record<TimelineActor, string> = {
  ADMIN: "운영자",
  CREATOR: "인플루언서",
  USER: "소비자",
  SYSTEM: "시스템",
};

/**
 * 사유 코드 표시명 — 서버 `reasonLabel`이 비었을 때만 쓴다.
 * 아래쪽 옛 코드 8종은 V192 재매핑 전 서버(10-21 개발 서버 배포본)가 내리던 값이다. 재매핑 뒤에는 오지 않지만,
 * 배포 순서가 어긋나도 화면이 코드 문자열을 그대로 드러내지 않게 둔다.
 * V192: MEDICAL_CLAIM · AD_DISCLOSURE · MISLEADING_AD → MISLEADING_INFO / COPYRIGHT → OTHER /
 * VIOLENCE_HATE → ABUSE_HATE / 신고의 PERSONAL_INFO → 운영자 전용으로만 남음.
 */
export const REASON_CODE_LABEL: Record<string, string> = {
  MISLEADING_INFO: "허위 · 과장 정보",
  FRAUD_IMPERSONATION: "사기 · 사칭",
  ABUSE_HATE: "욕설 · 혐오 표현",
  SEXUAL_CONTENT: "음란물 · 성적인 내용",
  SPAM: "스팸 · 반복 게시",
  PERSONAL_INFO: "개인정보 노출",
  OTHER: "기타",
  // V192 이전 코드
  MEDICAL_CLAIM: "허위 · 과장 정보",
  AD_DISCLOSURE: "허위 · 과장 정보",
  MISLEADING_AD: "허위 · 과장 정보",
  COPYRIGHT: "기타",
  VIOLENCE_HATE: "욕설 · 혐오 표현",
};
