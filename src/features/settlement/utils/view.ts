import {
  LEGACY_RESIDENT_NUMBER_MISSING,
  PAYOUT_DAYS_FALLBACK,
} from "@/features/settlement/constants/params";
import type {
  CompanyInfo,
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
 * 지급 예정일 영업일 수 — 서버 확정 이력 문장(「자동 확정 10.06 + 3영업일 · …」)에서 읽는다.
 * 서버가 숫자를 따로 내리지 않아([정책값 미정] · 백엔드 요청) 문장이 없으면 「N영업일」.
 */
export function payoutBusinessDaysText(detail: SettlementDetail): string {
  const matched = detail.rail.payoutBasis?.match(/\+\s*(\d+)영업일/);
  return matched ? `${matched[1]}영업일` : PAYOUT_DAYS_FALLBACK;
}

/** M4 공급받는자 「쇼룸즈 · 대표 소병서 · 791-12-03353」 — 상호가 없으면 null(호출부가 대체값을 쓴다) */
export function companyRecipientText(
  company: CompanyInfo | undefined
): string | null {
  if (!company?.name) return null;
  return [
    company.name,
    company.representative && `대표 ${company.representative}`,
    company.registrationNumber,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** 브랜드 축의 1021 신규 줄 — 배포 전 서버는 내리지 않아 0으로 읽는다 */
export function brandExtraLines(detail: SettlementDetail): {
  returnDeductionFee: { amount: number; count: number };
  freightAdjustment: { amount: number; count: number };
} {
  const { brand } = detail.breakdown;
  return {
    returnDeductionFee: brand.returnDeductionFee ?? { amount: 0, count: 0 },
    freightAdjustment: brand.freightAdjustment ?? { amount: 0, count: 0 },
  };
}

/** 고정 지급비가 계약에 있는가 — 없으면 카드를 그리지 않는다 */
export function hasFixedFee(detail: SettlementDetail): boolean {
  return (detail.fixedFee?.amount ?? 0) > 0;
}
