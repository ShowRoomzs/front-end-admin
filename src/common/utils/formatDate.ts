import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/**
 * 서버가 내려준 시각 문자열을 로컬 시각으로 파싱한다.
 *
 * 백엔드는 LocalDateTime을 시간대 표기 없이 내려주는데("2026-07-28T08:00:00"),
 * 서버 JVM이 UTC로 동작하므로 이 값은 UTC 벽시계 시각이다.
 * 그대로 dayjs에 넘기면 브라우저 로컬(KST)로 해석돼 9시간 어긋난다.
 */
export function parseServerDateTime(date: string) {
  // 시간대가 이미 붙어 있으면(Z, +09:00 등) 그 값을 그대로 신뢰한다
  const hasTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(date);
  return hasTimeZone ? dayjs(date) : dayjs.utc(date).local();
}

export function formatDate(date: string): string {
  return dayjs(date).format("YYYY/MM/DD HH:mm:ss");
}

/** 날짜만 (예: 2026.07.10) — 목록 등 밀도 높은 화면용 */
export function formatDateOnly(date: string | null): string {
  if (!date) {
    return "—";
  }
  return parseServerDateTime(date).format("YYYY.MM.DD");
}

/** 날짜 + 분 (예: 2026.07.10 14:22) — 상세 메타 정보용 */
export function formatDateTimeShort(date: string | null): string {
  if (!date) {
    return "—";
  }
  return parseServerDateTime(date).format("YYYY.MM.DD HH:mm");
}
