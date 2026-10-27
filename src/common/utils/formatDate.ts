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

/**
 * KST 벽시계 값(입력 날짜 · 영업일 기한 — 23:59:59 · 00:00)을 읽는다. 이벤트 시각(`parseServerDateTime`)과 섞지 말 것.
 *
 * 서버는 이 값들을 Asia/Seoul 벽시계로 만들지만(`BusinessDayCalculator` · 정지 기간 · 이의 신청 기한 ·
 * 정산 확인 마감 · 조정 합의 기한 · 오픈 승인 기한 등) `JacksonConfig`가 LocalDateTime 전부에 'Z'를
 * 붙여 내린다(2026-10-27 실서버 확인). 'Z'를 믿으면 「10.30 23:59」가 「10.31 08:59」로 밀린다.
 * 그래서 시간대 꼬리표를 떼고 벽시계 그대로 읽는다 — 백엔드가 +09:00을 붙이도록 고쳐도 그대로 맞는다.
 * 백엔드가 이 값들을 「진짜 UTC」로 바꾸면 이 함수 본문만 `parseServerDateTime(value)`로 바꾼다.
 */
export function parseWallClock(value: string) {
  return dayjs(value.replace(/(?:Z|[+-]\d{2}:?\d{2})$/, ""));
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
