import type { RejectionReason } from "@/features/seller/services/sellerService";

export const SELLER_REGISTRATION_STATUS = {
  PENDING: "심사 대기",
  APPROVED: "승인",
  REJECTED: "반려",
} as const;

/**
 * 반려 사유 유형 — 백엔드 RejectionReasonType 6종 중 UI에 노출하는 4종.
 * (기능요구사항 v0.8 §5 · 나머지 2종은 필요해지면 추가)
 */
export const SELLER_REJECTION_REASONS: Array<{
  value: RejectionReason;
  label: string;
}> = [
  { value: "BUSINESS_REG_NUMBER_MISMATCH", label: "사업자등록번호 불일치" },
  { value: "MAIL_ORDER_REPORT_INCOMPLETE", label: "통신판매업 신고 미완료" },
  { value: "INSUFFICIENT_DOCUMENTS", label: "첨부 서류 부실·누락" },
  { value: "OTHER", label: "기타(직접 입력)" },
];

/**
 * 반려 사유 표시용 전체 6종 라벨 — 백엔드 RejectionReasonType과 1:1.
 * UI 선택지(SELLER_REJECTION_REASONS)는 4종만 노출하지만, 상세 화면은
 * 과거에 다른 사유로 반려된 건도 그대로 보여줘야 하므로 6종 전부 필요하다.
 */
export const SELLER_REJECTION_REASON_LABELS: Record<string, string> = {
  BUSINESS_REG_NUMBER_MISMATCH: "사업자등록번호 불일치",
  MAIL_ORDER_REPORT_INCOMPLETE: "통신판매업 신고 미완료",
  INSUFFICIENT_DOCUMENTS: "첨부 서류 부실·누락",
  BANK_ACCOUNT_ERROR: "계좌 정보 오류",
  DUPLICATE_APPLICATION: "중복 신청",
  OTHER: "기타",
};
