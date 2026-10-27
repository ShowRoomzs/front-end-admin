import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import type {
  AdminOrderGroupDetail,
  OrderBadgeTone,
} from "@/features/order/types";
import { parseServerDateTime, parseWallClock } from "@/common/utils/formatDate";
import dayjs from "dayjs";

/*
  시안의 표기 — 일시는 `09.16 14:22`(목록) · `2026.09.16 14:22`(상세), 금액은 `58,400원`.
  서버 LocalDateTime(시간대 표기 없음)은 두 종류가 섞인다 — 값마다 골라 읽는다.
  - 이벤트 시각(결제 · 송장 등록 · 추적 · 배송완료 · 이력 · 문의 · 환불 · 정산 확정 · 선택 개방):
    서버가 `now()`나 택배사 시각을 서버 시간대(UTC)로 바꿔 저장한다 → `parseServerDateTime`.
  - 영업일 기한(발송 기한 · 취소 요청 응답 마감 — `BusinessDayCalculator.dueAt`의 23:59:59):
    날짜에 붙인 벽시계 → 그대로 읽는다(`formatDue*`). 보정하면 다음 날 08:59로 보인다.
*/

/** 이벤트 시각 · 목록 — 09.16 14:22 */
export function formatShortDateTime(value: string) {
  return parseServerDateTime(value).format("MM.DD HH:mm");
}

/** 이벤트 시각 · 상세 — 2026.09.16 14:22 */
export function formatFullDateTime(value: string) {
  return parseServerDateTime(value).format("YYYY.MM.DD HH:mm");
}

/** 이벤트 시각 · 날짜만 — 09.16 */
export function formatMonthDay(value: string) {
  return parseServerDateTime(value).format("MM.DD");
}

/** 이벤트 시각을 운영자 시간대의 dayjs로(날짜 비교 · 계산용) */
export function toEventTime(value: string) {
  return parseServerDateTime(value);
}

/** 영업일 기한 · 목록 — 09.16 23:59(벽시계 그대로) */
export function formatDueShort(value: string) {
  return parseWallClock(value).format("MM.DD HH:mm");
}

/** 영업일 기한 · 상세 — 2026.09.16 23:59(벽시계 그대로) */
export function formatDueFull(value: string) {
  return parseWallClock(value).format("YYYY.MM.DD HH:mm");
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

/** 이벤트 시각(배송완료 등) → 운영자 날짜 2026.09.18 */
export function toDotDate(value: string) {
  return parseServerDateTime(value).format("YYYY.MM.DD");
}

/** 하위주문번호 `20261003-000123-01` → `-01` */
export function subOrderSuffix(subOrderNumber: string) {
  const index = subOrderNumber.lastIndexOf("-");
  return index >= 0 ? subOrderNumber.slice(index) : subOrderNumber;
}

/**
 * 서버로 보내는 이벤트 시각(배송완료일 정정 · 배송완료 판정) — 서버가 `now()`(UTC)와 비교하고 그대로
 * 저장하므로, 운영자 시각을 UTC로 바꿔 시간대 없이 yyyy-MM-ddTHH:mm:ss로 보낸다(표시 쪽과 대칭).
 */
export function toLocalDateTime(value: dayjs.Dayjs) {
  return value.utc().format("YYYY-MM-DDTHH:mm:ss");
}

/** 구매확정 한 줄 — 확정 · 정지(남은 N일) · 예정(D-N) */
export function purchaseConfirmText(group: AdminOrderGroupDetail) {
  const pc = group.purchaseConfirm;
  if (!pc) {
    return "미도래";
  }
  if (pc.confirmedAt) {
    return `확정 ${formatMonthDay(pc.confirmedAt)}`;
  }
  if (pc.paused) {
    return `타이머 정지 · 남은 ${pc.remainingDays ?? 0}일`;
  }
  if (pc.dueAt) {
    // 확정 예정 = 배송완료(이벤트) + N일 — 이벤트 시각과 같이 읽는다
    return `예정 ${formatMonthDay(pc.dueAt)}${
      pc.remainingDays !== null ? ` (D-${pc.remainingDays})` : ""
    }`;
  }
  return "—";
}
