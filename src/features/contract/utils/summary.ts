import type { AdminContractSummary } from "@/features/contract/types";

/**
 * 조치 필요 건수 = 화면에 보이는 조치 큐의 합(검토 대기 · 공구 생성 대기 · 만료 확인 · 해지 요청).
 * 서버 `actionRequiredCount`가 rev.8 ②로 「재발송 요청」을 뺀 같은 합을 내린다(백엔드 58 계획 5-33) —
 * 목록의 「조치 필요 N건」과 GNB 「계약 관리」 배지가 같은 값을 쓰도록 여기 한 곳을 거친다.
 */
export function contractActionRequiredCount(
  summary: AdminContractSummary | undefined
) {
  return summary?.actionRequiredCount ?? 0;
}
