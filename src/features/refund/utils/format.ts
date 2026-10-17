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
