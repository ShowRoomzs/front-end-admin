import type { CreatorRejectionReasonType } from "@/features/creator/services/creatorService";

export const CREATOR_APPLICATION_STATUS = {
  PENDING: "심사 대기",
  APPROVED: "승인",
  REJECTED: "반려",
} as const;

/**
 * 반려 사유 유형 — 백엔드 CreatorRejectionReasonType 4종 전부 노출.
 * 브랜드(서류 중심)와 값이 하나도 겹치지 않는다(기능요구사항 §9-4).
 */
export const CREATOR_REJECTION_REASONS: Array<{
  value: CreatorRejectionReasonType;
  label: string;
}> = [
  { value: "CHANNEL_PERFORMANCE_UNVERIFIABLE", label: "채널 실적 확인 불가" },
  { value: "IDENTITY_INFO_MISMATCH", label: "본인 인증 정보 불일치" },
  { value: "SUSPECTED_FAKE_FOLLOWERS", label: "허위 팔로워 의심" },
  { value: "OTHER", label: "기타(직접 입력)" },
];

/** 상세 화면에서 반려 사유 코드를 한글로 표시하기 위한 맵 */
export const CREATOR_REJECTION_REASON_LABELS: Record<string, string> = {
  CHANNEL_PERFORMANCE_UNVERIFIABLE: "채널 실적 확인 불가",
  IDENTITY_INFO_MISMATCH: "본인 인증 정보 불일치",
  SUSPECTED_FAKE_FOLLOWERS: "허위 팔로워 의심",
  OTHER: "기타",
};
