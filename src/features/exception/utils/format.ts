import type {
  DelayItem,
  DeliveryExceptionType,
  DeliveryItem,
} from "@/features/exception/types";
import {
  CLAIM_LIST_PATH,
  ORDER_LIST_PATH,
} from "@/features/exception/constants/params";

const KST_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** 시안 날짜 표기는 연도 없는 「09.16」 · 「09.16 23:59」다 — 한국 시각 기준 */
function kstParts(iso: string) {
  const parts: Record<string, string> = {};
  for (const part of KST_PARTS.formatToParts(new Date(iso))) {
    parts[part.type] = part.value;
  }
  return parts;
}

/** 「09.16」 */
export function formatMonthDay(iso: string) {
  const { month, day } = kstParts(iso);
  return `${month}.${day}`;
}

/** 「09.16 23:59」 */
export function formatMonthDayTime(iso: string) {
  const { month, day, hour, minute } = kstParts(iso);
  return `${month}.${day} ${hour}:${minute}`;
}

/** 기한 열 — 기준 라벨이 있으면 시각 대신 「09.16 · 입고+2」(기한이 날짜 단위인 건) */
export function deadlineText(item: DelayItem) {
  return item.deadlineBasis
    ? `${formatMonthDay(item.deadlineAt)} · ${item.deadlineBasis}`
    : formatMonthDayTime(item.deadlineAt);
}

/** 다음 단계 열 — 「자동 알림 대기 · 2회차 09.19」 */
export function nextNotifyText(item: DelayItem) {
  if (item.nextNotifyRound === null || item.nextNotifyAt === null) {
    return "자동 알림 대기";
  }
  return `자동 알림 대기 · ${item.nextNotifyRound}회차 ${formatMonthDay(item.nextNotifyAt)}`;
}

/**
 * 경과 열 — 유형마다 말이 다르다: 집화 확인 필요 「26시간」 · 추적 정지 「8일 무갱신」 ·
 * 반송 중 「감지 후 4일」. 회수 송장 미조회는 시안에 없어 「N일」로 임시 표기한다.
 */
export function deliveryElapsedText(
  type: DeliveryExceptionType,
  elapsedHours: number
) {
  const days = Math.floor(elapsedHours / 24);
  switch (type) {
    case "PICKUP_UNCONFIRMED":
      return `${elapsedHours}시간`;
    case "TRACKING_STALLED":
      return `${days}일 무갱신`;
    case "RETURNING":
      return `감지 후 ${days}일`;
    default:
      return `${days}일`;
  }
}

/**
 * 열기 — 이 화면에는 실행 버튼이 없고 대행은 주문 상세에서 한다(같은 조치를 두 화면에 두면
 * 근거를 읽지 않고 누르는 경로가 생긴다). 주문 조회 / 반품·교환 화면으로 번호를 들고 간다.
 */
export function openPath(item: DelayItem | DeliveryItem) {
  if (item.tab === "DELAY" && item.targetKind === "CLAIM") {
    return `${CLAIM_LIST_PATH}?keyword=${encodeURIComponent(item.targetNo)}`;
  }
  const orderNo = item.tab === "DELAY" ? item.targetNo : item.orderNo;
  return `${ORDER_LIST_PATH}?keyword=${encodeURIComponent(orderNo)}`;
}
