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
import type {
  RefundAdditionalPayment,
  RefundDetail,
  RefundSettlement,
} from "@/features/refund/types";
import { formatMonthDayTime, formatWon } from "@/features/refund/utils/format";

interface ExecuteModalProps {
  refundId: number;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (detail: RefundDetail) => void;
}

const KIND_LABEL = { ORIGINAL: "원래 결제", ADDITIONAL: "추가 결제" } as const;

/** 「반려 재발송비 3,000원 · 결제 취소」 + 서버 note */
function AdditionalLine(props: { charge: RefundAdditionalPayment }) {
  const { charge } = props;
  return (
    <div>
      {charge.typeLabel}{" "}
      <b className="tabular-nums">{formatWon(charge.amount)}</b> ·{" "}
      {charge.statusLabel}
      {charge.note && <Sub>{` · ${charge.note}`}</Sub>}
    </div>
  );
}

/**
 * 추가 결제 — 결제까지 된 청구(`claimPaymentId`)만 「추가 결제」로 적는다.
 * 결제되지 않은 청구(편입 · 인용 때 소멸 등)뿐이면 시안처럼 「없음 · {사유}」로 적는다.
 */
function AdditionalPayments(props: {
  charges: Array<RefundAdditionalPayment>;
}) {
  const paid = props.charges.filter((charge) => charge.claimPaymentId !== null);
  if (paid.length > 0) {
    return (
      <>
        {paid.map((charge) => (
          <AdditionalLine key={charge.chargeId} charge={charge} />
        ))}
      </>
    );
  }
  const notes = props.charges
    .map((charge) => charge.note)
    .filter((note): note is string => Boolean(note));
  return (
    <>
      <Dim>없음</Dim>
      {notes.length > 0 && <Sub>{` · ${notes.join(" · ")}`}</Sub>}
    </>
  );
}

function SettlementLine(props: { settlement: RefundSettlement }) {
  const { settlement } = props;
  if (!settlement.clawback) return <Dim>{settlement.stateLabel}</Dim>;
  // 이미 정산된 돈 — 다음 정산에서 차감한다
  return (
    <>
      <span className="font-medium text-sz-warning-text">
        {settlement.stateLabel}
      </span>
      <Sub>
        {[
          settlement.settlementNumber,
          `${settlement.clawback.clawbackNumber} ${settlement.clawback.statusLabel}`,
        ]
          .filter(Boolean)
          .map((part) => ` · ${part}`)
          .join("")}
      </Sub>
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
  // 요청이 나간 뒤에는 닫지 못한다(X · Esc · [취소]) — 결과를 보기 전에 창이 사라지면
  // 돈이 나갔는지 알 수 없다. 바깥 클릭은 ModalShell이 원래 막는다.
  const handleClose = () => {
    if (!isPending) onClose();
  };
  const amount = detail?.target?.amount;
  const canExecute = Boolean(detail?.executable && detail.target);

  return (
    <ModalShell
      isOpen
      title="환불 집행 — 재확인"
      width={520}
      onClose={handleClose}
      bodyClassName={DIALOG_BODY_CLASS}
      footer={
        <>
          <Btn disabled={isPending} onClick={handleClose}>
            취소
          </Btn>
          <Btn
            variant="primary"
            disabled={!canExecute}
            isLoading={isPending}
            onClick={() => detail && onConfirm(detail)}
          >
            {amount !== undefined ? `${formatWon(amount)} 집행` : "집행"}
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
            <span className="tabular-nums">{detail.refundNo}</span> ·{" "}
            {detail.order.orderNumber}
          </DialogRow>
          <DialogRow label="사유">
            {detail.reason?.label ?? detail.source.label}
            {(detail.source.ref || detail.reason) && (
              <Sub>
                {[
                  detail.source.ref,
                  detail.reason &&
                    [
                      "편입",
                      detail.reason.requestedByName,
                      formatMonthDayTime(detail.reason.requestedAt),
                    ]
                      .filter(Boolean)
                      .join(" "),
                ]
                  .filter(Boolean)
                  .map((part) => ` · ${part}`)
                  .join("")}
              </Sub>
            )}
          </DialogRow>
          <DialogRow label="근거">{detail.reason?.detail ?? "—"}</DialogRow>
          <DialogRow label="취소 대상">
            {detail.target ? (
              <>
                {KIND_LABEL[detail.target.paymentKind]} ·{" "}
                {detail.target.methodLabel}{" "}
                {detail.target.pgTxId && (
                  <span className="tabular-nums">{detail.target.pgTxId}</span>
                )}{" "}
                ·{" "}
                <b className="tabular-nums">
                  {formatWon(detail.target.amount)}
                </b>{" "}
                {detail.target.partial ? "부분" : "전액"}
              </>
            ) : (
              // 결제가 없는 주문 — PG로 돌려줄 길이 없어 서버가 집행을 막는다
              <Dim>결제 없음</Dim>
            )}
          </DialogRow>
          <DialogRow label="추가 결제">
            <AdditionalPayments charges={detail.additionalPayments} />
          </DialogRow>
          <DialogRow label="정산">
            <SettlementLine settlement={detail.settlement} />
          </DialogRow>
          {!detail.executable && (
            <p className="mb-0 mt-2.5 text-[11px] leading-[1.7] text-sz-n-500">
              지금은 집행할 수 없습니다 — {detail.statusLabel}
            </p>
          )}
          <DialogWarn>
            집행하면 <b>PG 취소가 즉시 요청</b>되고 되돌릴 수 없습니다.
            소비자·브랜드에게 통지되며 이력에 <b>집행자 · 시각</b>이 남습니다.
          </DialogWarn>
        </>
      )}
    </ModalShell>
  );
}
