import { parseServerDateTime } from "@/common/utils/formatDate";

/** 심사 SLA 기준 시간 — 브랜드 심사(§5)와 동일하게 48시간을 적용한다 */
export const SLA_LIMIT_HOURS = 48;

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

/**
 * 신청 시각으로부터 경과한 시간(h).
 *
 * 백엔드는 경과 시간을 계산해 내려주지 않으므로(크리에이터·브랜드 양쪽 모두)
 * 신청일로 프론트에서 직접 계산한다.
 *
 * @param until 기준 종료 시각. 넘기지 않으면 **지금**까지 잰다.
 *   승인·반려로 처리가 끝난 건은 처리 일시를 넘겨 **심사에 걸린 시간**을 잰다
 *   (종료된 건에 계속 늘어나는 숫자를 보여줄 이유가 없다).
 * @returns 총 경과 시간(h). 신청일이 없거나 파싱 불가면 null.
 */
export function getElapsedHours(
  appliedAt: string | null,
  until?: string | null
): number | null {
  if (!appliedAt) {
    return null;
  }

  const applied = parseServerDateTime(appliedAt);
  if (!applied.isValid()) {
    return null;
  }

  let endMs = Date.now();
  if (until) {
    const end = parseServerDateTime(until);
    // 처리 일시를 못 읽으면 조용히 "지금까지"로 되돌린다(값을 통째로 잃는 것보다 낫다)
    if (end.isValid()) {
      endMs = end.valueOf();
    }
  }

  const hours = Math.floor((endMs - applied.valueOf()) / MILLISECONDS_PER_HOUR);
  return hours < 0 ? 0 : hours;
}

/** 경과 시간 표기 (예: `11h`, `3일 11h`) */
export function formatElapsed(
  appliedAt: string | null,
  until?: string | null
): string | null {
  const totalHours = getElapsedHours(appliedAt, until);
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
