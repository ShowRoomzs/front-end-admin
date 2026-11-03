import { LEGACY_RESIDENT_NUMBER_MISSING } from "@/features/settlement/constants/params";
import type {
  SettlementDetail,
  SettlementStatus,
  TaxDocument,
  TaxRecipient,
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

/** 증빙 카드에 보일 것이 있는가 — 문서가 있을 때(주민번호 미등록 가상 줄은 기-12로 없어졌다) */
export function hasEvidenceRows(detail: SettlementDetail): boolean {
  return detail.taxDocuments.length > 0;
}

/** 지급 보류 사유 — 폐기된 주민번호 미등록 코드는 옛 서버가 내려 줘도 보이지 않는다(기-12) */
export function activeBlockReasons(
  detail: SettlementDetail
): SettlementDetail["rail"]["blockReasons"] {
  return detail.rail.blockReasons.filter(
    (reason) => reason.code !== LEGACY_RESIDENT_NUMBER_MISSING
  );
}

/**
 * M4 공급받는자 — 운영사 사업자 정보(서버 `taxDocuments[].recipient` · 58 계획 5-19).
 * 서버는 브랜드 세금계산서 행에만 채우므로(인플루언서 세금계산서는 null) 대조하는 문서에 없으면
 * 같은 정산의 브랜드 세금계산서 값을 쓴다 — 출처는 둘 다 `company.*` 한 곳이다.
 */
export function taxRecipientOf(
  detail: SettlementDetail,
  document: TaxDocument
): TaxRecipient | null {
  return (
    document.recipient ??
    detail.taxDocuments.find((doc) => doc.recipient?.name)?.recipient ??
    null
  );
}

/** M4 공급받는자 「쇼룸즈 · 대표 소병서 · 791-12-03353」 — 상호가 없으면 null(호출부가 대체값을 쓴다) */
export function recipientText(recipient: TaxRecipient | null): string | null {
  if (!recipient?.name) return null;
  return [
    recipient.name,
    recipient.representative && `대표 ${recipient.representative}`,
    recipient.registrationNumber,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** 고정 지급비가 계약에 있는가 — 없으면 카드를 그리지 않는다 */
export function hasFixedFee(detail: SettlementDetail): boolean {
  return (detail.fixedFee?.amount ?? 0) > 0;
}
