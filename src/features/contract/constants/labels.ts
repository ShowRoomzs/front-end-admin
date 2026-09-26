import type { HistoryDotTone } from "@/common/components/HistoryList/HistoryList";
import type {
  ContractActorType,
  ContractCloseReasonCode,
  ContractEventType,
  ContractReviewRejectReason,
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

/** 직권 취소 사유 — 서버 `ContractCloseReasonCode` 라벨. ETC는 설명 필수 */
export const CANCEL_REASONS: Array<{
  code: ContractCloseReasonCode;
  label: string;
}> = [
  { code: "CONDITION_REVIEW", label: "조건 재검토 필요" },
  { code: "OUT_OF_STOCK", label: "상품 재고 부족" },
  { code: "SCHEDULE_CHANGE", label: "공구 일정 변경" },
  { code: "NEGOTIATION_STOPPED", label: "상대와 협의 중단" },
  { code: "ETC", label: "기타(직접 입력)" },
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
  RESEND_REQUESTED: "서명 안내 재발송 요청 · 소통 스레드 자동 등록",
  RESEND_HANDLED: "서명 안내 재발송 · 스레드 답글",
  CONTRACT_PDF_GENERATED: "계약서 생성본 발급",
  DOCUMENT_UPLOADED: "체결 문서 업로드",
  DOCUMENT_DELETED: "체결 문서 삭제",
  CONCLUDED: "체결 완료 처리 · 공구 생성",
  DECLINED: "인플루언서 거절",
  EXPIRED: "서명 기한 초과 확인 · 만료 처리",
  CANCELED: "계약 취소 · 운영자 직권 · 양측 통지",
  FIXED_FEE_PAID: "고정 지급비 지급 완료 기록 · 브랜드 직접 지급",
  GROUP_BUY_CREATED: "공구 생성",
  DELETED: "계약 삭제",
};

/** 이력 점 색 — 진행은 정보, 서명·체결은 성공, 반려·재발송 요청은 경고, 거절은 위험 */
export const HISTORY_TONE: Partial<Record<ContractEventType, HistoryDotTone>> =
  {
    REVIEW_REQUESTED: "accent",
    REVIEW_APPROVED: "accent",
    SIGNATURE_SENT: "accent",
    CONTRACT_PDF_GENERATED: "accent",
    RESEND_HANDLED: "accent",
    REVIEW_REJECTED: "warn",
    RESEND_REQUESTED: "warn",
    BRAND_SIGNED: "success",
    CREATOR_SIGNED: "success",
    SIGNATURE_UPDATED: "success",
    BOTH_SIGNED_CONFIRMED: "success",
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
