import { parseServerDateTime } from "@/common/utils/formatDate";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/** 날짜 + 시 + 분 입력(시안 `.dt`)의 값 — date는 `YYYY-MM-DD` */
export interface DateTimeParts {
  date: string;
  hour: string;
  minute: string;
}

/** 서버 시각 → 입력칸 값. 비어 있으면 현재 시각(분은 5분 단위로 내림)을 기본값으로 쓴다 */
export function toParts(serverValue: string | null): DateTimeParts {
  const base = serverValue ? parseServerDateTime(serverValue) : dayjs();
  const minute = serverValue
    ? base.minute()
    : Math.floor(base.minute() / 5) * 5;
  return {
    date: base.format("YYYY-MM-DD"),
    hour: String(base.hour()).padStart(2, "0"),
    minute: String(minute).padStart(2, "0"),
  };
}

/**
 * 입력칸 값 → 서버 전송값. 서버는 시간대 없는 LocalDateTime을 UTC 벽시계로 저장하므로
 * 로컬 시각을 UTC로 바꿔 시간대 표기 없이 보낸다(표시 쪽 `parseServerDateTime`과 대칭).
 */
export function toServerDateTime(parts: DateTimeParts): string | null {
  if (!parts.date) {
    return null;
  }
  const local = dayjs(`${parts.date} ${parts.hour}:${parts.minute}`);
  if (!local.isValid()) {
    return null;
  }
  return local.utc().format("YYYY-MM-DDTHH:mm:ss");
}

/** 서버 시각을 `toServerDateTime`과 같은 형식(UTC · 초 단위)으로 — 문자열 비교로 순서를 본다 */
export function toServerComparable(value: string | null) {
  return value
    ? parseServerDateTime(value).utc().format("YYYY-MM-DDTHH:mm:ss")
    : null;
}

/** 같은 분인지 — 서명 현황 저장 전 변경 여부 판단용 */
export function sameMinute(a: string | null, b: string | null) {
  if (!a || !b) {
    return a === b;
  }
  return parseServerDateTime(a).isSame(parseServerDateTime(b), "minute");
}

export function formatMonthDayTime(value: string | null) {
  return value ? parseServerDateTime(value).format("MM.DD HH:mm") : "—";
}

export function formatTime(value: string | null) {
  return value ? parseServerDateTime(value).format("HH:mm") : "—";
}

export function formatMonthDay(value: string | null) {
  return value ? parseServerDateTime(value).format("MM.DD") : "—";
}

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0")
);

export const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0")
);
