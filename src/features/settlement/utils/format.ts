import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import type { Tone } from "@/features/settlement/types";
import dayjs from "dayjs";

/** 6,300,000 */
export function won(value: number): string {
  return value.toLocaleString("ko-KR");
}

/** 시안 차감 표기 「− 160,000」(마이너스 기호 U+2212 · 공백) */
export function minus(value: number): string {
  return `− ${won(value)}`;
}

export function plus(value: number): string {
  return `+ ${won(value)}`;
}

/** 2026.08.31 */
export function ymd(value: string | null | undefined): string {
  return value ? dayjs(value).format("YYYY.MM.DD") : "—";
}

/** 08.31 */
export function md(value: string | null | undefined): string {
  return value ? dayjs(value).format("MM.DD") : "—";
}

/** 2026.08.31 09:02 */
export function ymdhm(value: string | null | undefined): string {
  return value ? dayjs(value).format("YYYY.MM.DD HH:mm") : "—";
}

/** 목록 「08.28 ~ 09.14」 */
export function periodShort(start: string, end: string): string {
  return `${md(start)} ~ ${md(end)}`;
}

/** 상세 「2026.08.28 ~ 09.14」 — 해가 바뀌면 끝도 연도를 붙인다 */
export function periodFull(start: string, end: string): string {
  const sameYear = dayjs(start).year() === dayjs(end).year();
  return `${ymd(start)} ~ ${sameYear ? md(end) : ymd(end)}`;
}

export function toneToVariant(tone: Tone): StatusBadgeVariant {
  switch (tone) {
    case "INFO":
      return "info";
    case "SUCCESS":
      return "success";
    case "WARNING":
      return "warning";
    case "DANGER":
      return "danger";
    default:
      return "neutral";
  }
}
