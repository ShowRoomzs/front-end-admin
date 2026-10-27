import type { HistoryDotTone } from "@/common/components/HistoryList/HistoryList";
import type {
  ContractActorType,
  ContractCancelRequestChannel,
  ContractCloseReasonCode,
  ContractEventType,
  ContractReviewRejectReason,
  ContractTerminationReasonCode,
} from "@/features/contract/types";

/** 검토 반려 사유 — 어드민 설계서 §6-1 화면 문구. 브랜드 화면에 그대로 노출된다 */
export const REJECT_REASONS: Array<{
  code: ContractReviewRejectReason;
  label: string;
}> = [
  {
    code: "AGREEMENT_MISMATCH",
    label: "계약 조건이 인플루언서 합의 내용과 다릅니다",
  },
  { code: "INFO_MISMATCH", label: "계약 조건과 상품 정보가 일치하지 않습니다" },
  {
    code: "OBLIGATION_UNVERIFIABLE",
    label: "콘텐츠 의무가 이행 판정 가능한 형태가 아닙니다",
  },
  { code: "TYPO_OR_OMISSION", label: "계약 내용에 오기·누락이 있습니다" },
  { code: "ACCOUNT_STATUS", label: "당사자 계정 상태 문제" },
  { code: "ETC", label: "기타(직접 입력)" },
];

/**
 * 직권 취소 사유 — 시안 C6(rev.9 · 기-06) 선택지 순서 그대로, 서버 `ContractCloseReasonCode` 앞 3종 + ETC.
 * 1021 이전 4종(CONDITION_REVIEW …)은 저장된 행 표시용이라 고르지 않는다(표시는 서버 `closure.reasonLabel`).
 */
export const CANCEL_REASONS: Array<{
  code: ContractCloseReasonCode;
  label: string;
}> = [
  { code: "PARTY_RENEGOTIATION", label: "당사자 요청 — 조건 재협의 필요" },
  { code: "PARTY_CANNOT_PROCEED", label: "당사자 요청 — 공구 진행 불가" },
  {
    code: "CONTENT_ERROR_AFTER_REVIEW",
    label: "계약 내용 오류 — 검토 통과 후 발견",
  },
  { code: "ETC", label: "기타(직접 입력)" },
];

/** 해지 사유 — 시안 C7 선택지 순서 그대로, 서버 `ContractTerminationReasonCode` */
export const TERMINATION_REASONS: Array<{
  code: ContractTerminationReasonCode;
  label: string;
}> = [
  { code: "TERMINATE_CANNOT_PROCEED", label: "당사자 요청 — 공구 진행 불가" },
  {
    code: "TERMINATE_RENEGOTIATION",
    label: "당사자 요청 — 조건 재협의 필요",
  },
  { code: "TERMINATE_CONTENT_ERROR", label: "계약 내용 오류 — 성립 후 발견" },
  { code: "TERMINATE_OTHER", label: "기타(직접 입력)" },
];

/** 직권 취소 요청 경로 — 서버 `ContractCancelRequestChannel` 라벨 */
export const CANCEL_REQUEST_CHANNELS: Array<{
  code: ContractCancelRequestChannel;
  label: string;
}> = [
  { code: "THREAD", label: "소통 스레드" },
  { code: "PHONE", label: "전화" },
  { code: "EMAIL", label: "이메일" },
  { code: "ETC", label: "기타" },
];

export function rejectReasonLabel(code: string | null | undefined) {
  if (!code) {
    return "—";
  }
  return REJECT_REASONS.find((reason) => reason.code === code)?.label ?? code;
}

/** 이력 주체 — 어드민은 실명(표시명)을 쓰고, 없을 때만 호칭으로 대신한다 */
export const ACTOR_LABEL: Record<ContractActorType, string> = {
  SELLER: "브랜드",
  CREATOR: "인플루언서",
  ADMIN: "운영자",
  SYSTEM: "시스템",
};

/** 이력 문구 — 시안 ui-admin-01 `.htxt`. 모르는 이벤트는 코드를 그대로 보여준다 */
export const EVENT_LABEL: Record<ContractEventType, string> = {
  CREATED: "계약 작성 시작",
  REVIEW_REQUESTED: "운영자 검토 요청 · 편집 잠금",
  REVIEW_REQUEST_CANCELED: "검토 요청 취소 · 작성중 복귀",
  REVIEW_APPROVED: "운영자 검토 통과",
  REVIEW_REJECTED: "운영자 검토 반려 · 브랜드 편집 재개",
  SIGNATURE_SENT: "양측에 전자서명 요청 발송",
  BRAND_SIGNED: "서명 현황 갱신 · 브랜드 서명 완료 확인",
  CREATOR_SIGNED: "서명 현황 갱신 · 인플루언서 서명 완료 확인",
  SIGNATURE_UPDATED: "서명 현황 갱신",
  BOTH_SIGNED_CONFIRMED: "서명 현황 갱신 · 양측 서명 완료 확인",
  // 성립은 양측 서명 저장 줄에 「(계약 성립)」으로 붙인다(시안 B7) — 단독 줄은 숨긴다
  ESTABLISHED: "계약 성립",
  // 재발송 이벤트는 rev.8 ②로 이력에서 숨긴다(utils/history.ts) — 라벨은 서버 호환으로만 둔다
  RESEND_REQUESTED: "서명 안내 재발송 요청 · 소통 스레드 자동 등록",
  RESEND_HANDLED: "서명 안내 재발송 · 스레드 답글",
  CONTRACT_PDF_GENERATED: "계약서 생성본 발급",
  DOCUMENT_UPLOADED: "체결 문서 업로드",
  DOCUMENT_DELETED: "체결 문서 삭제",
  // 시안 B7 「공구 생성 · GRB-…」 — 공구 번호는 utils/history.ts가 붙인다
  CONCLUDED: "공구 생성",
  DECLINED: "인플루언서 거절",
  EXPIRED: "서명 기한 초과 확인 · 만료 처리",
  CANCELED: "계약 취소 · 운영자 직권 · 양측 통지",
  FIXED_FEE_PAID: "고정 지급비 지급 완료 기록 · 브랜드 직접 지급",
  GROUP_BUY_CREATED: "공구 생성",
  TERMINATION_REQUESTED: "해지 요청 · 운영팀 채널",
  TERMINATION_REQUEST_WITHDRAWN: "해지 요청 철회",
  TERMINATED: "계약 해지 · 생성 공구 함께 종료 · 양측 운영팀 채널 카드",
  DRAFT_APPROVAL_RECORDED: "초안 승인 기록",
  DELETED: "계약 삭제",
};

/** 이력 점 색 — 진행은 정보, 서명·성립은 성공, 반려·해지 요청은 경고, 거절은 위험 */
export const HISTORY_TONE: Partial<Record<ContractEventType, HistoryDotTone>> =
  {
    REVIEW_REQUESTED: "accent",
    REVIEW_APPROVED: "accent",
    SIGNATURE_SENT: "accent",
    CONTRACT_PDF_GENERATED: "accent",
    RESEND_HANDLED: "accent",
    DRAFT_APPROVAL_RECORDED: "accent",
    REVIEW_REJECTED: "warn",
    RESEND_REQUESTED: "warn",
    TERMINATION_REQUESTED: "warn",
    BRAND_SIGNED: "success",
    CREATOR_SIGNED: "success",
    SIGNATURE_UPDATED: "success",
    BOTH_SIGNED_CONFIRMED: "success",
    ESTABLISHED: "success",
    CONCLUDED: "success",
    FIXED_FEE_PAID: "success",
    GROUP_BUY_CREATED: "success",
    DECLINED: "danger",
  };

export const DOCUMENT_LABEL = {
  GENERATED_DRAFT: "계약서 생성본",
  SIGNED_PDF: "서명 PDF",
  AUDIT_TRAIL: "감사추적인증서",
} as const;
