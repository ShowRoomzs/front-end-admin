import { parseServerDateTime } from "@/common/utils/formatDate";

/** 심사 SLA 기준 시간 (기능요구사항 v0.8 §5 — 48시간 초과 시 경고) */
export const SLA_LIMIT_HOURS = 48;

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

/**
 * 신청 시각으로부터 경과한 시간(h).
 *
 * 백엔드가 포맷해 내려주던 `elapsedTime` 필드는 제거되어(PR #272) 신청일로 직접 계산한다.
 *
 * @param until 기준 종료 시각. 넘기지 않으면 **지금**까지 잰다.
 *   승인·반려로 처리가 끝난 건은 처리 일시를 넘겨 **심사에 걸린 시간**을 잰다.
 * @returns 총 경과 시간(h). 신청일이 없거나 파싱 불가면 null.
 */
export function getElapsedHours(
  createdAt: string | null,
  until?: string | null
): number | null {
  if (!createdAt) {
    return null;
  }

  const created = parseServerDateTime(createdAt);
  if (!created.isValid()) {
    return null;
  }

  let endMs = Date.now();
  if (until) {
    const end = parseServerDateTime(until);
    // 처리 일시를 못 읽으면 "지금까지"로 되돌린다(값을 통째로 잃는 것보다 낫다)
    if (end.isValid()) {
      endMs = end.valueOf();
    }
  }

  const hours = Math.floor((endMs - created.valueOf()) / MILLISECONDS_PER_HOUR);
  return hours < 0 ? 0 : hours;
}

/** 경과 시간 표기 (예: `11h`, `3일 11h`) — 기존 서버 포맷과 동일한 형식 */
export function formatElapsed(
  createdAt: string | null,
  until?: string | null
): string | null {
  const totalHours = getElapsedHours(createdAt, until);
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
