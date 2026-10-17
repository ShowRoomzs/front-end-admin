import { ModalShell } from "@/common/components/ModalShell/ModalShell";
import {
  DIALOG_BODY_CLASS,
  DialogRow,
  DialogStatus,
  Dim,
  Sub,
} from "@/features/refund/components/modals/DialogParts";
import Btn from "@/features/refund/components/shared/Btn";
import { useGetRefundDetail } from "@/features/refund/hooks/useAdminRefund";
import type { RefundDetail } from "@/features/refund/types";
import { formatMonthDayTime, formatWon } from "@/features/refund/utils/format";

interface RetryModalProps {
  refundId: number;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (detail: RefundDetail) => void;
}

/**
 * 「자동 재시도 N회」 — 시스템 실패 기록(`failure.attempts`, actorType SYSTEM) 중 최초 시도를 뺀 수.
 * 운영자 사유 환불은 자동 재시도하지 않는다(서버 배치가 PG 자동만 집는다).
 */
function autoRetry(detail: RefundDetail) {
  const system = (detail.failure?.attempts ?? []).filter(
    (attempt) => attempt.actorType === "SYSTEM"
  );
  const count =
    detail.origin === "PG_AUTO" ? Math.max(0, system.length - 1) : 0;
  return { count, lastAt: count > 0 ? system[system.length - 1].at : null };
}

/**
 * 시안 M2 — 재시도. 운영자가 바꿀 수 있는 값이 **없다**(실패는 PG 쪽 문제라 같은 요청을 다시 보낼 뿐).
 * 그래서 입력도 확인 체크도 없고 [재시도] 한 번이다. PG 응답 코드는 목록이 아니라 여기서만 보여준다.
 */
export default function RetryModal(props: RetryModalProps) {
  const { refundId, isPending, onClose, onConfirm } = props;
  const { data: detail, isLoading, isError } = useGetRefundDetail(refundId);
  // 요청이 나간 뒤에는 닫지 못한다(X · Esc · [취소]) — 결과를 보기 전에 창이 사라지면
  // 돈이 나갔는지 알 수 없다. 바깥 클릭은 ModalShell이 원래 막는다.
  const handleClose = () => {
    if (!isPending) onClose();
  };
  const retry = detail ? autoRetry(detail) : null;

  return (
    <ModalShell
      isOpen
      title="환불 재시도"
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
            disabled={!detail?.executable}
            isLoading={isPending}
            onClick={() => detail && onConfirm(detail)}
          >
            재시도
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
          <DialogRow label="경로">
            {detail.source.label}
            <Sub>{` · ${detail.originLabel}`}</Sub>
          </DialogRow>
          <DialogRow label="취소 대상">
            {detail.target ? (
              <>
                {detail.target.methodLabel}{" "}
                {detail.target.pgTxId && (
                  <span className="tabular-nums">{detail.target.pgTxId}</span>
                )}{" "}
                ·{" "}
                <b className="tabular-nums">
                  {formatWon(detail.target.amount)}
                </b>
              </>
            ) : (
              <Dim>결제 없음</Dim>
            )}
          </DialogRow>
          {detail.failure && (
            <DialogRow label="실패">
              {detail.failure.message}
              <Sub>
                {[
                  detail.failure.code && `코드 ${detail.failure.code}`,
                  detail.failure.at && formatMonthDayTime(detail.failure.at),
                ]
                  .filter(Boolean)
                  .map((part) => ` · ${part}`)
                  .join("")}
              </Sub>
            </DialogRow>
          )}
          {retry && (
            <DialogRow label="자동 재시도">
              {retry.count > 0 ? (
                <>
                  {retry.count}회 · 실패
                  {retry.lastAt && (
                    <Sub>{` · ${formatMonthDayTime(retry.lastAt)}`}</Sub>
                  )}
                </>
              ) : (
                <>
                  <Dim>없음</Dim>
                  {detail.origin === "OPERATOR" && (
                    <Sub> · 운영자 사유 환불은 자동 재시도하지 않습니다</Sub>
                  )}
                </>
              )}
            </DialogRow>
          )}
          {!detail.executable && (
            <p className="mb-0 mt-2.5 text-[11px] leading-[1.7] text-sz-n-500">
              지금은 재시도할 수 없습니다 — {detail.statusLabel}
            </p>
          )}
          <p className="mb-[1em] mt-2.5 text-[11px] leading-[1.7] text-sz-n-500">
            금액과 경로는 바꿀 수 없습니다 — 원래 요청을 그대로 다시 보냅니다.
            반복 실패 시 처리 기준은 <b className="font-bold">[근거 대기]</b>
            입니다.
          </p>
        </>
      )}
    </ModalShell>
  );
}
