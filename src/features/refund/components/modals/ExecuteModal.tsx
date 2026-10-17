import { ModalShell } from "@/common/components/ModalShell/ModalShell";
import {
  DIALOG_BODY_CLASS,
  DialogRow,
  DialogStatus,
  DialogWarn,
  Dim,
  Sub,
} from "@/features/refund/components/modals/DialogParts";
import Btn from "@/features/refund/components/shared/Btn";
import { useGetRefundDetail } from "@/features/refund/hooks/useAdminRefund";
import type { RefundCancelTarget, RefundDetail } from "@/features/refund/types";
import { formatMonthDayTime, formatWon } from "@/features/refund/utils/format";

interface ExecuteModalProps {
  refundId: number;
  isPending: boolean;
  onClose: () => void;
  /** 확인한 금액을 함께 올린다 — 그 사이 금액이 바뀌었으면 서버가 거절한다 */
  onConfirm: (detail: RefundDetail) => void;
}

/** 「원래 결제 · 카드 tosspay_9c41e0b2 · 27,200원 전액」 — 결제 건별 한 줄 */
function TargetLine(props: { kind: string; target: RefundCancelTarget }) {
  const { kind, target } = props;
  return (
    <>
      {kind} · {target.methodLabel}{" "}
      <span className="tabular-nums">{target.pgTransactionId}</span> ·{" "}
      <b className="tabular-nums">{formatWon(target.amount)}</b>{" "}
      {target.partial ? "부분" : "전액"}
    </>
  );
}

/**
 * 시안 M1 — 집행 재확인. 돈이 나가는 **유일한 실행 버튼**이다.
 * 사유·근거·편입자를 다시 보여주고 취소 대상을 결제 건별로 적는다. 입력할 값이 없어
 * 재확인은 「읽고 금액이 적힌 버튼을 누르는 것」 한 번이다(2인 승인 없음 · 일괄 집행 없음).
 * 버튼 라벨에 금액을 넣어 무엇을 누르는지 버튼만 봐도 알게 한다 — 상세가 올 때까지는 비활성.
 */
export default function ExecuteModal(props: ExecuteModalProps) {
  const { refundId, isPending, onClose, onConfirm } = props;
  const { data: detail, isLoading, isError } = useGetRefundDetail(refundId);

  return (
    <ModalShell
      isOpen
      title="환불 집행 — 재확인"
      width={520}
      onClose={onClose}
      bodyClassName={DIALOG_BODY_CLASS}
      footer={
        <>
          <Btn onClick={onClose}>취소</Btn>
          <Btn
            variant="primary"
            disabled={!detail}
            isLoading={isPending}
            onClick={() => detail && onConfirm(detail)}
          >
            {detail ? `${formatWon(detail.amount)} 집행` : "집행"}
          </Btn>
        </>
      }
    >
      {isLoading && <DialogStatus>불러오는 중입니다…</DialogStatus>}
      {isError && (
        <DialogStatus>
          환불 정보를 불러오지 못했습니다. 닫고 다시 시도해 주세요.
        </DialogStatus>
      )}
      {detail && (
        <>
          <DialogRow label="환불번호">
            <span className="tabular-nums">{detail.refundNumber}</span> ·{" "}
            {detail.orderNumber}
          </DialogRow>
          <DialogRow label="사유">
            {detail.routeLabel}
            {(detail.routeDetail || detail.enrollment) && (
              <Sub>
                {[
                  detail.routeDetail,
                  detail.enrollment &&
                    `편입 ${detail.enrollment.enrolledBy} ${formatMonthDayTime(detail.enrollment.enrolledAt)}`,
                ]
                  .filter(Boolean)
                  .map((part) => ` · ${part}`)
                  .join("")}
              </Sub>
            )}
          </DialogRow>
          <DialogRow label="근거">{detail.enrollment?.ground ?? "—"}</DialogRow>
          <DialogRow label="취소 대상">
            <TargetLine kind="원래 결제" target={detail.originalPayment} />
          </DialogRow>
          <DialogRow label="추가 결제">
            {detail.additionalPayment ? (
              <TargetLine kind="추가 결제" target={detail.additionalPayment} />
            ) : (
              <>
                <Dim>없음</Dim>
                {detail.additionalPaymentNote && (
                  <Sub>{` · ${detail.additionalPaymentNote}`}</Sub>
                )}
              </>
            )}
          </DialogRow>
          <DialogRow label="정산">
            {detail.settlement.clawback ? (
              // 정산 확정 건 — 이미 정산된 돈이라 다음 정산에서 차감한다(시안은 법률 자문 대기)
              <span className="font-medium text-sz-warning-text">
                정산 확정 · 클로백{" "}
                {detail.settlement.clawbackAmount !== null
                  ? formatWon(detail.settlement.clawbackAmount)
                  : ""}{" "}
                (다음 정산 차감)
              </span>
            ) : (
              <Dim>정산 전 · 클로백 없음</Dim>
            )}
          </DialogRow>
          <DialogWarn>
            집행하면 <b>PG 취소가 즉시 요청</b>되고 되돌릴 수 없습니다.
            소비자·브랜드에게 통지되며 이력에 <b>집행자 · 시각</b>이 남습니다.
          </DialogWarn>
        </>
      )}
    </ModalShell>
  );
}
