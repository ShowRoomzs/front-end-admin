import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import { parseServerDateTime, parseWallClock } from "@/common/utils/formatDate";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/*
  서버 시각은 두 종류다.
  - 이벤트 시각(가입 · 승인 · 정지 · 이력 · 메모 · 접속) = `now()`로 찍은 UTC 벽시계 → parseServerDateTime 후 KST로 고정한다.
  - 기한 · 입력 날짜(정지 종료일 · 자동 해제 · 이의 신청 기한 · 정산 지급일) = KST 벽시계 → 보정하지 않고 그대로 읽는다.
    보정하면 23:59:59 기한이 다음 날 08:59로 밀린다. 시간대 꼬리표가 붙어 와도 벽시계로 읽도록 떼어 낸다.
*/

function kst(value: string) {
  return parseServerDateTime(value).utcOffset(9);
}

function wall(value: string) {
  return parseWallClock(value);
}

/** 이벤트 날짜 — 2026.07.28 */
export function eventDate(value: string | null | undefined): string {
  return value ? kst(value).format("YYYY.MM.DD") : "—";
}

/** 이벤트 시각 — 2026.08.14 08:12 */
export function eventDateTime(value: string | null | undefined): string {
  return value ? kst(value).format("YYYY.MM.DD HH:mm") : "—";
}

/** 이벤트 시각 짧게 — 08.29 14:02 */
export function eventMonthDayTime(value: string | null | undefined): string {
  return value ? kst(value).format("MM.DD HH:mm") : "—";
}

/** 이벤트 시각(시:분만) — 마스킹 해제 「해제됨 · 김운영 · 14:22」 */
export function eventTime(value: string | null | undefined): string {
  return value ? kst(value).format("HH:mm") : "—";
}

/** 이벤트 날짜 짧게 — 08.16 */
export function eventMonthDay(value: string | null | undefined): string {
  return value ? kst(value).format("MM.DD") : "—";
}

/** 기한 · 입력 날짜(KST 벽시계) — 2026.10.22 */
export function wallDate(value: string | null | undefined): string {
  return value ? wall(value).format("YYYY.MM.DD") : "—";
}

/** 기한 짧게(KST 벽시계) — 09.17 */
export function wallMonthDay(value: string | null | undefined): string {
  return value ? wall(value).format("MM.DD") : "—";
}

/** 오늘(KST) — `<input type="date">` 값 형식 YYYY-MM-DD */
export function todayKst(): string {
  return dayjs().utcOffset(9).format("YYYY-MM-DD");
}

/** YYYY-MM-DD 입력값을 시안 표기 YYYY.MM.DD로 */
export function inputDateLabel(value: string): string {
  return value ? value.replaceAll("-", ".") : "";
}

/** 3,180,000원 */
export function won(amount: number | null | undefined): string {
  return amount === null || amount === undefined
    ? "—"
    : `${amount.toLocaleString("ko-KR")}원`;
}

/** 1,840 */
export function count(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "—"
    : value.toLocaleString("ko-KR");
}

/** 서버 톤 → 공용 배지 변형 */
export function toneVariant(
  tone: string | null | undefined
): StatusBadgeVariant {
  switch (tone) {
    case "SUCCESS":
      return "success";
    case "INFO":
      return "info";
    case "WARNING":
      return "warning";
    case "DANGER":
      return "danger";
    default:
      return "neutral";
  }
}

/** 서버 톤 → 처리 이력 점 색(시안 `.hdot.h-*`) */
export function toneDotClass(tone: string | null | undefined): string {
  switch (tone) {
    case "SUCCESS":
      return "bg-sz-success-text";
    case "INFO":
      return "bg-sz-info-text";
    case "WARNING":
      return "bg-sz-warning-text";
    case "DANGER":
      return "bg-sz-danger-text";
    default:
      return "bg-sz-n-400";
  }
}

/** 외부 링크 표기 — 프로토콜을 떼어 시안처럼 `glowlab.co.kr`로 */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** 외부 링크로 열 수 있는 주소 — 프로토콜이 없으면 붙인다 */
export function externalHref(url: string): string {
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}
