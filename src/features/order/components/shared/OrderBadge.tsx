import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type { OrderBadgeData } from "@/features/order/types";
import { toneToVariant } from "@/features/order/utils/format";

/** 상태 배지 — 목록·현재 상태는 점이 있고(`.badge`), 모달 안 블록은 점이 없다(`.badge.nodot`) */
export default function OrderBadge(props: {
  data: OrderBadgeData;
  hideDot?: boolean;
  className?: string;
}) {
  const { data, hideDot = false, className } = props;
  const badge = (
    <StatusBadge variant={toneToVariant(data.tone)} hideDot={hideDot}>
      {data.label}
    </StatusBadge>
  );
  return className ? <span className={className}>{badge}</span> : badge;
}
