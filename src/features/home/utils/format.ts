import { parseServerDateTime } from "@/common/utils/formatDate";
import { INTEGRATION_LABEL } from "@/features/home/constants/labels";
import type { AdminHomeIntegration } from "@/features/home/types";

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

/** 「2026.10.16 (금) 09:30 기준」 — asOf는 now() 기반이라 UTC → 로컬 */
export function asOfText(asOf: string) {
  const at = parseServerDateTime(asOf);
  return `${at.format("YYYY.MM.DD")} (${WEEKDAY[at.day()]}) ${at.format("HH:mm")} 기준`;
}

/** 「09:30」 — now() 기반 시각(UTC → 로컬) */
export function serverClock(value: string) {
  return parseServerDateTime(value).format("HH:mm");
}

/**
 * 「10:00」 — 오늘 일정 시각은 공구 시작 · 종료 · 확인 마감 · 조정 기한 같은 입력 · 기한 시각(KST 벽시계)이라
 * 시간대 변환 없이 문자열의 시:분을 그대로 쓴다.
 */
export function wallClock(value: string) {
  const match = /T(\d{2}:\d{2})/.exec(value);
  return match ? match[1] : value;
}

export function integrationLabel(integration: AdminHomeIntegration) {
  return (
    INTEGRATION_LABEL[integration.key as keyof typeof INTEGRATION_LABEL] ??
    integration.label
  );
}

/** 장애 · 지연 상태 — 배너 대상 */
export function isIntegrationDown(integration: AdminHomeIntegration) {
  return integration.status === "DEGRADED" || integration.status === "DOWN";
}

export function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}
