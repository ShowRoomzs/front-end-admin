import { parseServerDateTime } from "@/common/utils/formatDate";
import { INTEGRATION_LABEL } from "@/features/home/constants/labels";
import type { AdminHomeIntegration } from "@/features/home/types";

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

/** 「2026.10.16 (금) 09:30 기준」 — asOf는 now() 기반이라 UTC → 로컬 */
export function asOfText(asOf: string) {
  const at = parseServerDateTime(asOf);
  return `${at.format("YYYY.MM.DD")} (${WEEKDAY[at.day()]}) ${at.format("HH:mm")} 기준`;
}

/**
 * 「09:30」 — 서버 시각(UTC 순간 `…Z` → 로컬). now() 기반 시각과 오늘 일정 시각(공구 시작 · 종료 ·
 * 확인 마감 · 조정 기한 — 한국 시각으로 계산해 UTC로 바꾼 값) 모두 이 함수로 읽는다.
 */
export function serverClock(value: string) {
  return parseServerDateTime(value).format("HH:mm");
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
