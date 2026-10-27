import DetailCard from "@/common/components/DetailCard/DetailCard";
import { APPLIES_FROM_LABELS } from "@/features/changeRequest/constants/params";
import type {
  ChangeRequestApprovalImpact,
  ChangeRequestType,
} from "@/features/changeRequest/services/changeRequestService";
import type { ReactNode } from "react";

interface ApprovalImpactCardProps {
  type: ChangeRequestType;
  impact: ChangeRequestApprovalImpact;
}

/**
 * C3a · C3b 「승인하면」 카드 — 인플루언서 사업자 구분 변경의 정산 영향을 **승인 전에** 보여준다.
 *
 * 브랜드 사업자 정보 변경과 달리 승인하면 세무 처리(원천징수 ↔ 세금계산서)가 바뀐다. 심사 중에도 기존
 * 구분으로 정산이 계속되므로, 기존 구분으로 끝나는 정산 · 계좌 변경 필요 여부를 운영자가 알고 눌러야 한다.
 * 서버는 검토 대기일 때만 `approvalImpact`를 준다.
 */
export default function ApprovalImpactCard(props: ApprovalImpactCardProps) {
  const { type, impact } = props;
  const toBusiness = type === "TO_BUSINESS";
  const retained = impact.retainedSettlements ?? [];
  const holderIsRepresentative =
    impact.accountHolderRuleAfter === "REPRESENTATIVE_NAME";

  return (
    <DetailCard title="승인하면" note="정산 영향 · 승인 전에 확인">
      <div className="pt-1">
        <ImpactRow label="적용 시점">
          {APPLIES_FROM_LABELS[impact.appliesFrom] ?? impact.appliesFrom}
        </ImpactRow>
        <ImpactRow label="기존 구분 유지">
          확인 기간 중 정산 <b>{retained.length}건</b>
          {retained.length > 0 &&
            ` · ${retained.map((item) => item.settlementNumber).join(" · ")}`}
        </ImpactRow>
        <ImpactRow label="정산 계좌">
          {impact.accountChangeRequired ? (
            <span className="text-sz-warning-text">
              승인 후 변경 필요 · 예금주가 상호
            </span>
          ) : (
            <span className="text-sz-success-text">
              변경 필요 없음 · 예금주 ={" "}
              {holderIsRepresentative ? "대표자명" : "본인 실명"}
            </span>
          )}
        </ImpactRow>
      </div>

      {toBusiness ? (
        <p className="mt-2 text-[11px] leading-[1.55] text-sz-n-500">
          승인 후 정산부터 인플루언서가 <b>SHOWROOMZ 앞으로 세금계산서</b>를
          발행해야 지급됩니다 — 스튜디오 배너로 안내됩니다.
        </p>
      ) : (
        impact.accountChangeRequired && (
          <p className="mt-2 text-[11px] leading-[1.55] text-sz-n-500">
            승인 뒤 인플루언서가 <b>본인 실명 계좌</b>로 바꾸기 전까지 확정된
            정산은 <b>지급 보류</b>됩니다. 계좌를 요청에서 같이 받지 않는 이유는
            반려되면 계좌만 바뀐 채 남기 때문입니다.
          </p>
        )
      )}
    </DetailCard>
  );
}

/** 시안 `.mrow` — 상세 우측 「현재 상태」 카드의 메타 행과 같은 규격 */
function ImpactRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0">
      <span className="shrink-0 text-sz-n-500">{label}</span>
      <span className="text-right font-medium text-sz-n-900">{children}</span>
    </div>
  );
}
