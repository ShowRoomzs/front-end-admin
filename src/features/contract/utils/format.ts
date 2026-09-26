import { parseServerDateTime } from "@/common/utils/formatDate";

export function formatKRW(value: number | null | undefined) {
  return value === null || value === undefined
    ? "—"
    : `${value.toLocaleString("ko-KR")}원`;
}

/** 리워드율 — 소수점 뒤 0은 떼고 보인다(15.0 → 15%) */
export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }
  return `${Number(value.toFixed(1))}%`;
}

/** 공구 기간 한 줄 — "2026.09.20 10:00 ~ 2026.09.27 23:55" */
export function periodText(startAt: string | null, endAt: string | null) {
  if (!startAt || !endAt) {
    return null;
  }
  const f = (value: string) =>
    parseServerDateTime(value).format("YYYY.MM.DD HH:mm");
  return `${f(startAt)} ~ ${f(endAt)}`;
}
