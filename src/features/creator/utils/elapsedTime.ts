import { parseServerDateTime } from "@/common/utils/formatDate";

/** 심사 SLA 기준 시간 — 브랜드 심사(§5)와 동일하게 48시간을 적용한다 */
export const SLA_LIMIT_HOURS = 48;

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

/**
 * 신청 시각으로부터 지금까지 경과한 시간(h).
 *
 * 백엔드는 경과 시간을 계산해 내려주지 않으므로(크리에이터·브랜드 양쪽 모두)
 * 신청일로 프론트에서 직접 계산한다.
 *
 * @returns 총 경과 시간(h). 신청일이 없거나 파싱 불가면 null.
 */
export function getElapsedHours(appliedAt: string | null): number | null {
  if (!appliedAt) {
    return null;
  }

  const applied = parseServerDateTime(appliedAt);
  if (!applied.isValid()) {
    return null;
  }

  const hours = Math.floor(
    (Date.now() - applied.valueOf()) / MILLISECONDS_PER_HOUR
  );
  return hours < 0 ? 0 : hours;
}

/** 경과 시간 표기 (예: `11h`, `3일 11h`) */
export function formatElapsed(appliedAt: string | null): string | null {
  const totalHours = getElapsedHours(appliedAt);
  if (totalHours === null) {
    return null;
  }

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return days === 0 ? `${hours}h` : `${days}일 ${hours}h`;
}

/** SLA(48시간) 초과 여부. 판정 불가 시 false. */
export function isSlaExceeded(appliedAt: string | null): boolean {
  const hours = getElapsedHours(appliedAt);
  return hours !== null && hours >= SLA_LIMIT_HOURS;
}
