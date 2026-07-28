import { parseServerDateTime } from "@/common/utils/formatDate";

/** 심사 SLA 기준 시간 (기능요구사항 v0.8 §5 — 48시간 초과 시 경고) */
export const SLA_LIMIT_HOURS = 48;

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

/**
 * 신청 시각으로부터 지금까지 경과한 시간(h).
 *
 * 백엔드가 포맷해 내려주던 `elapsedTime` 필드는 제거되어(PR #272) 신청일로 직접 계산한다.
 *
 * @returns 총 경과 시간(h). 신청일이 없거나 파싱 불가면 null.
 */
export function getElapsedHours(createdAt: string | null): number | null {
  if (!createdAt) {
    return null;
  }

  const created = parseServerDateTime(createdAt);
  if (!created.isValid()) {
    return null;
  }

  const hours = Math.floor((Date.now() - created.valueOf()) / MILLISECONDS_PER_HOUR);
  return hours < 0 ? 0 : hours;
}

/** 경과 시간 표기 (예: `11h`, `3일 11h`) — 기존 서버 포맷과 동일한 형식 */
export function formatElapsed(createdAt: string | null): string | null {
  const totalHours = getElapsedHours(createdAt);
  if (totalHours === null) {
    return null;
  }

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return days === 0 ? `${hours}h` : `${days}일 ${hours}h`;
}

/** SLA(48시간) 초과 여부. 판정 불가 시 false. */
export function isSlaExceeded(createdAt: string | null): boolean {
  const hours = getElapsedHours(createdAt);
  return hours !== null && hours >= SLA_LIMIT_HOURS;
}
