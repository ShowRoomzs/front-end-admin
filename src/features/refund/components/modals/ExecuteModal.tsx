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
  RefundFreightAdjustment,
  RefundSettlement,
} from "@/features/refund/types";
import {
  formatMonthDayTime,
  formatWon,
  reshipText,
} from "@/features/refund/utils/format";

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
      {reshipText(charge.typeLabel)}{" "}
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

/** 측별 차감액 — 「브랜드 24,208원 · 인플루언서 2,720원」. 행이 없는 측(null)은 뺀다 */
function clawbackSides(
  brandAmount: number | null,
  creatorAmount: number | null
) {
  return [
    brandAmount !== null && `브랜드 ${formatWon(brandAmount)}`,
    creatorAmount !== null && `인플루언서 ${formatWon(creatorAmount)}`,
  ];
}

/**
 * 운임 정산 행(06c rev.7~8 M1 · 기-93) — 소비자 → 브랜드 귀책: 최초 배송비 차감 취소(PG 환불액에 포함) +
 * 선불 반품 운임 별도 환급(원래 결제액 초과분이면 운영자 계좌 송금 · 이 버튼 금액에 넣지 않는다).
 * 서버 상세에 이 값이 없어(백엔드 요청) DEV 목업만 그린다.
 */
function FreightLine(props: { freight: RefundFreightAdjustment }) {
  const { freight } = props;
  if (freight.direction === "CHARGE_CONSUMER") {
    return (
      <>
        브랜드 → 소비자 귀책 ·{" "}
        <b className="tabular-nums">착불 운임 {formatWon(freight.amount)}</b>{" "}
        환불액에서 차감<Sub> · 브랜드 정산 「+ 운임 정산」</Sub>
      </>
    );
  }
  return (
    <>
      소비자 → 브랜드 귀책 · 최초 배송비 차감 취소
      <Sub> (전액 환불에 포함)</Sub> · 선불 반품 운임{" "}
      <b className="tabular-nums">{formatWon(freight.amount)}</b> = 기본 배송비
      편도 정액
      {freight.transferRefundNo && (
        <Sub>
          {` — 원래 결제액 초과분이라 운영자 계좌 송금(${freight.transferRefundNo}) · 이 버튼에 포함되지 않음`}
        </Sub>
      )}
    </>
  );
}

/**
 * 정산 행 — 정산 확정 건이면 시안대로 「클로백(다음 정산 차감)」을 적는다.
 * 집행 전(M1)은 서버 예정액 `expectedClawback`, 집행 후는 실제 차감 행 `clawback`.
 * 둘 다 없으면(정산 전 · 차감 대상 아님) 서버 문구만 흐리게 둔다.
 */
function SettlementLine(props: { settlement: RefundSettlement }) {
  const { settlement } = props;
  const { clawback, expectedClawback } = settlement;
  if (!clawback && !expectedClawback) {
    return <Dim>{settlement.stateLabel}</Dim>;
  }
  const brandAmount = (clawback ?? expectedClawback)?.brandAmount ?? null;
  const creatorAmount = (clawback ?? expectedClawback)?.creatorAmount ?? null;
  const hasAmount = brandAmount !== null || creatorAmount !== null;
  const total = (brandAmount ?? 0) + (creatorAmount ?? 0);
  // 이미 정산된 돈 — 다음 정산에서 브랜드 · 인플루언서 몫을 차감한다
  return (
    <>
      <span className="font-medium text-sz-warning-text">
        클로백 {hasAmount && <b className="tabular-nums">{formatWon(total)}</b>}
      </span>
      <Sub>
        {[
          "다음 정산 차감",
          ...clawbackSides(brandAmount, creatorAmount),
          settlement.settlementNumber,
          // 집행 전 예정액이면 차감 번호가 아직 없다 — 시안에 자리가 없는 문구는 쓰지 않는다
          clawback && `${clawback.clawbackNumber} ${clawback.statusLabel}`,
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
          {detail.freightAdjustment && (
            <DialogRow label="운임 정산">
              <FreightLine freight={detail.freightAdjustment} />
            </DialogRow>
          )}
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
