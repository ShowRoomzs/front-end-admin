import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import type {
  AdminOrderGroupDetail,
  OrderBadgeTone,
} from "@/features/order/types";
import dayjs from "dayjs";

/*
  시안의 표기 — 일시는 `09.16 14:22`(목록) · `2026.09.16 14:22`(상세), 금액은 `58,400원`.
  서버는 시간대 표기 없는 LocalDateTime(KST 벽시계)을 내린다 — 벽시계 그대로 읽는다
  (공용 formatDate의 UTC→KST 보정을 쓰면 9시간 밀린다).
*/

/** 목록 결제일시 — 09.16 14:22 */
export function formatShortDateTime(value: string) {
  return dayjs(value).format("MM.DD HH:mm");
}

/** 상세 일시 — 2026.09.16 14:22 */
export function formatFullDateTime(value: string) {
  return dayjs(value).format("YYYY.MM.DD HH:mm");
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

export function toneToVariant(tone: OrderBadgeTone): StatusBadgeVariant {
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

/** 하위주문번호 `20261003-000123-01` → `-01` */
export function subOrderSuffix(subOrderNumber: string) {
  const index = subOrderNumber.lastIndexOf("-");
  return index >= 0 ? subOrderNumber.slice(index) : subOrderNumber;
}

/** 서버로 보내는 LocalDateTime — 시간대 없이 yyyy-MM-ddTHH:mm:ss */
export function toLocalDateTime(value: dayjs.Dayjs) {
  return value.format("YYYY-MM-DDTHH:mm:ss");
}

/** 구매확정 한 줄 — 확정 · 정지(남은 N일) · 예정(D-N) */
export function purchaseConfirmText(group: AdminOrderGroupDetail) {
  const pc = group.purchaseConfirm;
  if (!pc) {
    return "미도래";
  }
  if (pc.confirmedAt) {
    return `확정 ${dayjs(pc.confirmedAt).format("MM.DD")}`;
  }
  if (pc.paused) {
    return `타이머 정지 · 남은 ${pc.remainingDays ?? 0}일`;
  }
  if (pc.dueAt) {
    return `예정 ${dayjs(pc.dueAt).format("MM.DD")}${
      pc.remainingDays !== null ? ` (D-${pc.remainingDays})` : ""
    }`;
  }
  return "—";
}
