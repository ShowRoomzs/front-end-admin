import type {
  EvidenceItem,
  SettlementDetail,
} from "@/features/settlement/types";

/** 증빙 중 아직 끝나지 않은 것 — 레일의 지급 보류 조건 · 카드 순서가 이것으로 갈린다 */
export function isPendingEvidence(item: EvidenceItem): boolean {
  return (
    item.state === "CHECK_PENDING" ||
    item.state === "REJECTED" ||
    item.state === "RRN_MISSING" ||
    item.state === "ISSUE_PENDING"
  );
}

/** 인플루언서 몫을 막는 증빙(세금계산서 미확인 · 주민번호 미등록) — 브랜드 발행 대기는 막지 않는다 */
export function isInfluencerHeld(detail: SettlementDetail): boolean {
  return detail.evidence.some(
    (item) =>
      item.state === "CHECK_PENDING" ||
      item.state === "REJECTED" ||
      item.state === "RRN_MISSING"
  );
}

/** 확정 전(정산 확인 중 · 조정 협의) — 명세 다운로드 비활성 · 증빙 없음 */
export function isBeforeConfirm(detail: SettlementDetail): boolean {
  return detail.status === "CHECKING" || detail.status === "ADJUSTING";
}
