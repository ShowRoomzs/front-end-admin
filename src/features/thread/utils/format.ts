import { parseServerDateTime } from "@/common/utils/formatDate";
import dayjs from "dayjs";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 금액 — 「150,528」 */
export function formatAmount(value: number) {
  return value.toLocaleString("ko-KR");
}

/** 금액 + 원 — 「150,528원」 */
export function won(value: number) {
  return `${formatAmount(value)}원`;
}

/** 메시지 시각 — 「14:02」 */
export function formatTime(date: string) {
  return parseServerDateTime(date).format("HH:mm");
}

/** 「2026.09.03」 */
export function formatDay(date: string) {
  return parseServerDateTime(date).format("YYYY.MM.DD");
}

/** 「2026.09.03 14:10」 */
export function formatDateTime(date: string) {
  return parseServerDateTime(date).format("YYYY.MM.DD HH:mm");
}

/** 「09.17」 */
export function formatMonthDay(date: string) {
  return parseServerDateTime(date).format("MM.DD");
}

/** 「09.09 10:52」 */
export function formatMonthDayTime(date: string) {
  return parseServerDateTime(date).format("MM.DD HH:mm");
}

/** 날짜 구분선 키 — 같은 날의 메시지를 한 줄 아래에 묶는다 */
export function dayKey(date: string) {
  return parseServerDateTime(date).format("YYYY-MM-DD");
}

/** 시안 `.daymark` — 「오늘 · 2026.08.14 (금)」 · 「2026.09.03 (목)」 */
export function formatDayMark(date: string) {
  const target = parseServerDateTime(date);
  const label = `${target.format("YYYY.MM.DD")} (${WEEKDAYS[target.day()]})`;
  return target.isSame(dayjs(), "day") ? `오늘 · ${label}` : label;
}

/** 시안 `.cs-time` — 오늘은 「10:05」, 어제는 「어제」, 올해는 「09.24」, 그 전은 「2025.09.24」 */
export function formatListTime(date: string | null) {
  if (!date) {
    return "";
  }
  const target = parseServerDateTime(date);
  const now = dayjs();
  if (target.isSame(now, "day")) {
    return target.format("HH:mm");
  }
  if (target.isSame(now.subtract(1, "day"), "day")) {
    return "어제";
  }
  if (target.isSame(now, "year")) {
    return target.format("MM.DD");
  }
  return target.format("YYYY.MM.DD");
}

/** 시안 표기 — 「412KB」 · 「1.2MB」 */
export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb)}KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(1)}MB`;
  }
  return `${(mb / 1024).toFixed(1)}GB`;
}

/** 영상 재생시간 — 「0:42」 · 「1:05:30」 */
export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(Math.floor(seconds % 60)).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}`
    : `${minutes}:${rest}`;
}

/**
 * 주격 조사 「이/가」 — 「뷰티_소연이」 · 「글로우랩이」 · 「하나가」.
 * 받침을 판정할 수 없는 끝 글자(영문 · 숫자)는 「이(가)」로 둔다.
 */
export function withSubjectParticle(name: string) {
  const last = name.charCodeAt(name.length - 1);
  if (last >= 0xac00 && last <= 0xd7a3) {
    return `${name}${(last - 0xac00) % 28 === 0 ? "가" : "이"}`;
  }
  return `${name}이(가)`;
}
