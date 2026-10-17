import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import type { OrderTone } from "@/features/order/types";
import dayjs from "dayjs";

/*
  시안의 표기 — 일시는 `09.16 14:22`(목록) · `2026.09.16 14:22`(상세), 금액은 `58,400원`.
  서버가 시간대 표기 없는 LocalDateTime을 내릴 것으로 보고 벽시계 그대로 읽는다
  (공용 formatDate의 UTC→KST 보정은 이 화면의 시안 값과 맞지 않는다 — API 확정 시 다시 본다).
*/

/** 목록 결제일시 — 09.16 14:22 */
export function formatShortDateTime(value: string) {
  return dayjs(value).format("MM.DD HH:mm");
}

/** 상세 일시 — 2026.09.16 14:22 */
export function formatFullDateTime(value: string) {
  return dayjs(value).format("YYYY.MM.DD HH:mm");
}

/** 2026.09.16 */
export function formatFullDate(value: string) {
  return dayjs(value).format("YYYY.MM.DD");
}

/** 09.16 */
export function formatMonthDay(value: string) {
  return dayjs(value).format("MM.DD");
}

/** 58,400 */
export function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

/** 58,400원 */
export function formatWon(value: number) {
  return `${formatNumber(value)}원`;
}

export function toneToVariant(tone: OrderTone): StatusBadgeVariant {
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

/** 입력 중인 `2026.09.18`이 실제 날짜인지 — 형식 오류에만 에러 문구를 띄운다 */
export function parseDotDate(value: string) {
  const match = /^(\d{4})\.(\d{2})\.(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const parsed = dayjs(`${match[1]}-${match[2]}-${match[3]}`);
  const isReal =
    parsed.isValid() && parsed.format("YYYY.MM.DD") === value.trim();
  return isReal ? parsed : null;
}

/** yyyy-MM-dd → 2026.09.18 */
export function toDotDate(value: string) {
  return dayjs(value).format("YYYY.MM.DD");
}
