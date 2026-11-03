import { parseServerDateTime } from "@/common/utils/formatDate";

/** 27,200 — 표 안 금액(단위는 열 머리에 없고 시안도 숫자만 적는다) */
export function formatAmount(value: number) {
  return value.toLocaleString("ko-KR");
}

/** 환불번호 — 서버 `AdminRefundNumber.format`과 같은 규칙(「RFD-」 + id · 0 채움 없음) */
export function refundNoOf(refundTaskId: number) {
  return `RFD-${refundTaskId}`;
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

/** 09.18 — 짝 행 배지 「완료 09.18」 */
export function formatMonthDay(value: string) {
  return parseServerDateTime(value).format("MM.DD");
}

/** 완료 탭 집계 기간 — 서버 기본 30일은 시안 문구 「최근 1개월」로 적는다 */
export function formatPeriod(days: number) {
  return days === 30 ? "최근 1개월" : `최근 ${days}일`;
}

/**
 * 기-18 — 「교환비」 명칭 폐기 · 06c rev.6 「재발송 배송비」. 서버도 경로 라벨을 「재발송 배송비」로 바꿨다
 * (58 계획 5-15). 옛 라벨 「교환 재발송비(환불)」 · 「반려 재발송비(환불)」가 남은 곳(M1 추가 결제 `typeLabel` 등)이
 * 와도 시안 표기로 맞춘다 — 교환 건은 「재발송 배송비」, 반려 건은 「반려 재발송 배송비」.
 */
export function reshipText(label: string) {
  return label
    .replace(/^교환 재발송비( 환불)?/, "재발송 배송비")
    .replace(/^반려 재발송비( 환불)?/, "반려 재발송 배송비");
}
