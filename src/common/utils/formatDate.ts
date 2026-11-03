import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/**
 * 서버가 내려준 시각 문자열을 로컬 시각으로 파싱한다.
 *
 * 서버는 LocalDateTime 전부를 UTC 순간(`…Z`)으로 내린다(백엔드 58 계획 3-2 · 2026-10-30 배포).
 * 이벤트 시각(`now()`)뿐 아니라 영업일 기한 · 정지 기간 · 이의 신청 기한 · 정산 확인 마감 · 조정 합의 기한도
 * 한국 날짜로 계산한 뒤 UTC로 바꿔 내린다 — 「10.30 23:59 KST」는 `2026-10-30T14:59:59Z`다.
 * 시간대 표기가 없는 값(옛 응답 · 날짜만 있는 LocalDate)은 UTC로 본다. LocalDate(`yyyy-MM-dd`)는
 * UTC 0시 = KST 9시라 KST로 읽으면 같은 날짜가 나온다.
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
