import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import type {
  TermsDocumentStatus,
  TermsVersionStatus,
} from "@/features/terms/types/terms";

/**
 * 문서 상태 색 (§21-1) — 시행중=성공 / 시행 예정=정보 / 구버전=중립.
 *
 * 구버전에 위험색을 쓰지 않는다. 문서가 지워진 것이 아니라 후속 문서로 대체돼
 * 조회 전용이 된 종료 상태다(원칙 ②).
 */
export function getTermsDocumentVariant(
  status: TermsDocumentStatus | null
): StatusBadgeVariant {
  if (status === "EFFECTIVE") {
    return "success";
  }
  if (status === "SCHEDULED") {
    return "info";
  }
  return "neutral";
}

/** 버전 상태 색 — 문서 상태와 축이 다르지만 색 규칙은 같다 */
export function getTermsVersionVariant(
  status: TermsVersionStatus
): StatusBadgeVariant {
  if (status === "EFFECTIVE") {
    return "success";
  }
  if (status === "SCHEDULED") {
    return "info";
  }
  return "neutral";
}
