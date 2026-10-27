import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import { STATUS_LABEL_OVERRIDE } from "@/features/contract/constants/params";
import type {
  ContractStatus,
  ContractStatusTone,
} from "@/features/contract/types";

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

/**
 * 상태 표시 라벨 — 서버 라벨을 쓰되 rev.9 기-05로 이름이 바뀐 상태는 시안 문구로 덮어쓴다
 * (서버 `CONCLUSION_PENDING`「체결 처리 대기」(배포본) · `CONCLUDED`「체결완료」).
 */
export function statusLabelOf(status: ContractStatus, serverLabel: string) {
  return STATUS_LABEL_OVERRIDE[status] ?? serverLabel;
}
