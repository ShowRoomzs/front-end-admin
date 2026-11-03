import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import type { ContractStatusTone } from "@/features/contract/types";

/** 서버가 내린 배지 톤을 그대로 매핑한다 — FE가 상태→색 표를 갖지 않는다 */
export function toneToVariant(tone: ContractStatusTone): StatusBadgeVariant {
  switch (tone) {
    case "INFO":
      return "info";
    case "SUCCESS":
      return "success";
    case "WARNING":
      return "warning";
    case "DANGER":
      return "danger";
    default:
      return "neutral";
  }
}
