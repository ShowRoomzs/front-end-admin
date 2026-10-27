import { parseServerDateTime } from "@/common/utils/formatDate";

/** 27,200 — 표 안 금액(단위는 열 머리에 없고 시안도 숫자만 적는다) */
export function formatAmount(value: number) {
  return value.toLocaleString("ko-KR");
}

/** 27,200원 */
export function formatWon(value: number) {
  return `${formatAmount(value)}원`;
}

/** 09.18 14:20 — 시안 일시 열. 값이 없으면 「—」 */
export function formatMonthDayTime(value: string | null | undefined) {
  if (!value) return "—";
  return parseServerDateTime(value).format("MM.DD HH:mm");
}

/** 완료 탭 집계 기간 — 서버 기본 30일은 시안 문구 「최근 1개월」로 적는다 */
export function formatPeriod(days: number) {
  return days === 30 ? "최근 1개월" : `최근 ${days}일`;
}

/**
 * 기-18 — 「교환비」 명칭 폐기 · 06c rev.6 「재발송 배송비」. 서버는 아직 「교환 재발송비(환불)」 ·
 * 「반려 재발송비(환불)」를 내린다(경로 `sourceLabel` · M1 추가 결제 `typeLabel`) — 화면 표기만 시안대로
 * 바꾼다. 교환 철회로 취소되는 추가 결제는 시안처럼 「재발송 배송비」, 반려 건은 「반려 재발송 배송비」.
 */
export function reshipText(label: string) {
  return label
    .replace(/^교환 재발송비( 환불)?/, "재발송 배송비")
    .replace(/^반려 재발송비( 환불)?/, "반려 재발송 배송비");
}
