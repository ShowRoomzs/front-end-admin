import { CONTRACT_BADGE_QUEUES } from "@/features/contract/constants/params";
import type { AdminContractSummary } from "@/features/contract/types";

/**
 * 조치 필요 건수 = 화면에 보이는 조치 큐의 합(검토 대기 · 공구 생성 대기 · 만료 확인 · 해지 요청).
 * 서버 `actionRequiredCount`는 rev.8 ②로 뺀 「재발송 요청」까지 더하므로 쓰지 않는다 —
 * 목록의 「조치 필요 N건」과 GNB 「계약 관리」 배지가 같은 값을 쓰도록 여기 한 곳에 둔다.
 */
export function contractActionRequiredCount(
  summary: AdminContractSummary | undefined
) {
  if (!summary) {
    return 0;
  }
  return CONTRACT_BADGE_QUEUES.reduce(
    (sum, queue) => sum + (summary.queues[queue] ?? 0),
    0
  );
}
