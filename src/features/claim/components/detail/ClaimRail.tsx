import OperatorRefundForm from "@/features/claim/components/detail/OperatorRefundForm";
import {
  ClaimBadge,
  Emphasis,
  RailCard,
  RailLink,
  RailText,
} from "@/features/claim/components/shared/ClaimParts";
import { operatorGuide } from "@/features/claim/constants/guides";
import type {
  ClaimDetail,
  OperatorRefundRequest,
} from "@/features/claim/types";

interface ClaimRailProps {
  detail: ClaimDetail;
  isRefunding: boolean;
  onRefund: (body: OperatorRefundRequest) => void;
  onOpenOrder: () => void;
  onOpenThread: () => void;
}

/**
 * 상세 우측 레일 — 현재 상태 + 운영자 조치.
 * 운영자가 실행하는 일은 소비자 이의가 들어온 반려 보류 건의 사유 환불 하나뿐이라, 그 건에서만 폼이 열리고
 * 나머지는 「조치할 것이 없습니다」와 그 이유를 적는다.
 */
export default function ClaimRail(props: ClaimRailProps) {
  const { detail, isRefunding, onRefund, onOpenOrder, onOpenThread } = props;

  const links = (
    <>
      <RailLink onClick={onOpenOrder}>주문 상세 열기 (주문 조회) ↗</RailLink>
      <RailLink onClick={onOpenThread}>연결·소통 스레드 열기 ↗</RailLink>
    </>
  );

  return (
    <>
      <RailCard title="현재 상태">
        <div className="mb-2 flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3">
          <span className="shrink-0 text-[12px] text-sz-n-500">단계</span>
          <ClaimBadge tone={detail.stageTone}>{detail.stageLabel}</ClaimBadge>
        </div>
        <div className="pt-2">
          {detail.statusRows.map((row) => (
            <div
              key={row.label}
              className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0"
            >
              <span className="text-sz-n-500">{row.label}</span>
              <span className="text-right font-medium text-sz-n-900">
                {row.emphasis ? <b>{row.value}</b> : row.value}
              </span>
            </div>
          ))}
        </div>
      </RailCard>

      {detail.refundableByOperator ? (
        <RailCard title="운영자 사유 환불">
          {/* 건이 바뀌면 입력값을 비운다 — 이전·다음으로 넘어가도 남은 근거가 딴 건에 붙으면 안 된다 */}
          <OperatorRefundForm
            key={detail.claimNo}
            amount={detail.refundAmountIfAccepted ?? 0}
            isPending={isRefunding}
            onSubmit={onRefund}
          />
          <RailText>
            받아들이지 않으면 버튼 없이 <b>스레드로 답합니다</b> — 반려는 그대로
            유지됩니다.
          </RailText>
          {links}
        </RailCard>
      ) : (
        <RailCard title="운영자 조치">
          <RailText flushTop>
            <Emphasis text={operatorGuide(detail)} />
          </RailText>
          {links}
        </RailCard>
      )}
    </>
  );
}
