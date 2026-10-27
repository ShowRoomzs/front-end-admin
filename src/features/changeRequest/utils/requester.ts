import {
  CHANGE_REQUEST_PHRASES,
  CHANGE_REQUEST_TYPE_LABELS,
  CHANGE_REQUEST_TYPE_META_LABELS,
} from "@/features/changeRequest/constants/params";
import type {
  ChangeRequestRequester,
  ChangeRequestType,
} from "@/features/changeRequest/services/changeRequestService";

interface RequesterSource {
  requester?: ChangeRequestRequester | null;
  brandName: string | null;
  marketId?: number | null;
}

/**
 * 요청자를 하나로 맞춘다.
 *
 * origin/main은 `requester`를 주지만 개발 서버(옛 응답)는 `brandName` · `marketId`만 준다 — 옛 응답은
 * 브랜드 요청뿐이므로 브랜드로 메운다. 백엔드 배포 뒤에는 `requester`만 남고 이 분기는 쓰이지 않는다.
 */
export function resolveRequester(
  source: RequesterSource
): ChangeRequestRequester {
  if (source.requester) {
    return source.requester;
  }
  return {
    type: "BRAND",
    id: source.marketId ?? null,
    name: source.brandName ?? "—",
  };
}

/** 인플루언서 요청(사업자 전환 · 비사업자 전환 · 계좌 변경)인가 */
export function isCreatorType(type: ChangeRequestType) {
  return (
    type === "TO_BUSINESS" ||
    type === "TO_INDIVIDUAL" ||
    type === "CREATOR_ACCOUNT"
  );
}

/** 인플루언서 사업자 구분 변경(양방향)인가 — 「승인하면」 카드 · C5b 대조 패널 · C8b 반려 사유 */
export function isBusinessTypeChange(type: ChangeRequestType) {
  return type === "TO_BUSINESS" || type === "TO_INDIVIDUAL";
}

/** 계좌 변경(브랜드 정산 계좌 · 인플루언서 계좌) — 통장 사본 대조 · 오지급 위험 */
export function isAccountChange(type: ChangeRequestType) {
  return type === "SETTLEMENT_ACCOUNT" || type === "CREATOR_ACCOUNT";
}

/** 서버가 새 유형을 추가해도 화면이 죽지 않게 — FE 라벨 → 서버 typeLabel → 코드 */
export function getTypeLabel(
  type: ChangeRequestType,
  serverLabel?: string | null
) {
  return CHANGE_REQUEST_TYPE_LABELS[type] ?? serverLabel ?? type;
}

export function getTypeMetaLabel(type: ChangeRequestType) {
  return CHANGE_REQUEST_TYPE_META_LABELS[type] ?? type;
}

export function getRequestPhrase(type: ChangeRequestType) {
  return CHANGE_REQUEST_PHRASES[type] ?? `${type} 변경 요청`;
}

/** 본인확인 생년월일(19950812 · 1995-08-12)을 시안 표기 1995.08.12로 — 마스킹 값(1995-**-**)은 그대로 */
export function formatBirthday(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
  }
  return value;
}
