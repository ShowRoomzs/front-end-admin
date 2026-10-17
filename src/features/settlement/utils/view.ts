import { RESIDENT_NUMBER_MISSING } from "@/features/settlement/constants/params";
import type {
  SettlementDetail,
  SettlementStatus,
  TaxDocument,
} from "@/features/settlement/types";

/** 확정 전(정산 확인 중 · 조정 협의) — 3자 분배 · 증빙이 비어 있다 */
export function isBeforeConfirm(status: SettlementStatus): boolean {
  return status === "REVIEWING" || status === "ADJUSTING";
}

export function creatorInvoiceOf(
  detail: SettlementDetail
): TaxDocument | undefined {
  return detail.taxDocuments.find((doc) => doc.type === "CREATOR_TAX_INVOICE");
}

/** 브랜드 세금계산서(수정세금계산서 포함) — 발행 대기 행을 먼저 */
export function brandInvoicesOf(detail: SettlementDetail): Array<TaxDocument> {
  return detail.taxDocuments.filter(
    (doc) =>
      doc.type === "BRAND_TAX_INVOICE" ||
      doc.type === "BRAND_TAX_INVOICE_CREDIT"
  );
}

export function isResidentNumberMissing(detail: SettlementDetail): boolean {
  return detail.rail.blockReasons.some(
    (reason) => reason.code === RESIDENT_NUMBER_MISSING
  );
}

/** 인플루언서 세금계산서가 확인 전(입력 대기 · 확인 대기 · 반려) — 인플루언서 몫을 막는다 */
export function isCreatorInvoiceOpen(doc: TaxDocument | undefined): boolean {
  return (
    doc?.status === "PENDING_INPUT" ||
    doc?.status === "SUBMITTED" ||
    doc?.status === "REJECTED"
  );
}

/** 증빙 중 아직 끝나지 않은 것이 있는가(지급 보류 조건 · 카드 순서) */
export function hasPendingEvidence(detail: SettlementDetail): boolean {
  return (
    isResidentNumberMissing(detail) ||
    isCreatorInvoiceOpen(creatorInvoiceOf(detail)) ||
    brandInvoicesOf(detail).some((doc) => doc.status === "PENDING_ISSUE")
  );
}

/** 운영자가 처리할 증빙(대조 · 발행본 등록)이 있는가 */
export function hasOperatorEvidence(detail: SettlementDetail): boolean {
  return (
    detail.actions.canVerifyInvoice || detail.actions.canRegisterBrandInvoice
  );
}

/** 계좌 한 줄 — 「신한은행 110-482-337120 · 벨라코스」 */
export function accountText(parts: {
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
}): string | null {
  const account = [parts.bankName, parts.accountNumber]
    .filter(Boolean)
    .join(" ");
  const text = [account, parts.accountHolder].filter(Boolean).join(" · ");
  return text || null;
}

/** 증빙 카드에 보일 것이 있는가 — 문서가 있거나 주민번호 미등록 보류가 있을 때 */
export function hasEvidenceRows(detail: SettlementDetail): boolean {
  return detail.taxDocuments.length > 0 || isResidentNumberMissing(detail);
}

/** 고정 지급비가 계약에 있는가 — 없으면 카드를 그리지 않는다 */
export function hasFixedFee(detail: SettlementDetail): boolean {
  return (detail.fixedFee?.amount ?? 0) > 0;
}
