import type { CreatorRejectionReasonType } from "@/features/creator/services/creatorService";

export const CREATOR_APPLICATION_STATUS = {
  PENDING: "심사 대기",
  APPROVED: "승인",
  REJECTED: "반려",
} as const;

/**
 * 반려 사유 유형 — 백엔드 CreatorRejectionReasonType 4종 전부 노출.
 * 브랜드(서류 중심)와 값이 하나도 겹치지 않는다(기능요구사항 §9-4).
 *
 * 사유 코드 하나에 라벨이 둘이다(기-36 보완). `label`은 운영자 선택지 ·
 * 내부 기록용, `noticeLabel`은 신청자 이메일에 실리는 라벨이다 — 「허위」라는
 * 단정을 신청자에게 보내지 않으려고 허위 팔로워 의심만 다르게 보낸다.
 * 서버 enum에도 같은 두 라벨이 있다(`description` · `noticeLabel`). 화면은
 * 미리보기 API가 주는 값을 우선하고, 이 표는 그 API가 없을 때만 쓴다.
 */
export const CREATOR_REJECTION_REASONS: Array<{
  value: CreatorRejectionReasonType;
  label: string;
  noticeLabel: string;
}> = [
  {
    value: "CHANNEL_PERFORMANCE_UNVERIFIABLE",
    label: "채널 실적 확인 불가",
    noticeLabel: "채널 실적 확인 불가",
  },
  {
    value: "IDENTITY_INFO_MISMATCH",
    label: "본인 인증 정보 불일치",
    noticeLabel: "본인 인증 정보 불일치",
  },
  {
    value: "SUSPECTED_FAKE_FOLLOWERS",
    label: "허위 팔로워 의심 (통지: 채널 운영 기준 미충족)",
    noticeLabel: "채널 운영 기준 미충족",
  },
  // 직접 입력한 상세 사유는 신청자에게 가지 않으므로 「기타(직접 입력)」가 아니다
  { value: "OTHER", label: "기타", noticeLabel: "기타" },
];

/** 반려일로부터 재신청이 열리기까지 — 서버 `REAPPLY_COOLDOWN_DAYS`(달력일) */
export const CREATOR_REAPPLY_COOLDOWN_DAYS = 14;

/** 상세 화면에서 반려 사유 코드를 한글로 표시하기 위한 맵(내부 라벨) */
export const CREATOR_REJECTION_REASON_LABELS: Record<string, string> = {
  CHANNEL_PERFORMANCE_UNVERIFIABLE: "채널 실적 확인 불가",
  IDENTITY_INFO_MISMATCH: "본인 인증 정보 불일치",
  SUSPECTED_FAKE_FOLLOWERS: "허위 팔로워 의심",
  OTHER: "기타",
};
