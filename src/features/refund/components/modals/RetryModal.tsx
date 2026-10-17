import { ModalShell } from "@/common/components/ModalShell/ModalShell";
import {
  DIALOG_BODY_CLASS,
  DialogRow,
  DialogStatus,
  Sub,
} from "@/features/refund/components/modals/DialogParts";
import Btn from "@/features/refund/components/shared/Btn";
import { useGetRefundDetail } from "@/features/refund/hooks/useAdminRefund";
import { formatMonthDayTime, formatWon } from "@/features/refund/utils/format";

interface RetryModalProps {
  refundId: number;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (refundId: number) => void;
}

/**
 * 시안 M2 — 재시도. 운영자가 바꿀 수 있는 값이 **없다**(실패는 PG 쪽 문제라 같은 요청을 다시 보낼 뿐).
 * 그래서 입력도 확인 체크도 없고 [재시도] 한 번이다. PG 응답 코드는 목록이 아니라 여기서만 보여준다.
 */
export default function RetryModal(props: RetryModalProps) {
  const { refundId, isPending, onClose, onConfirm } = props;
  const { data: detail, isLoading, isError } = useGetRefundDetail(refundId);

  return (
    <ModalShell
      isOpen
      title="환불 재시도"
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
            onClick={() => onConfirm(refundId)}
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
            <span className="tabular-nums">{detail.refundNumber}</span> ·{" "}
            {detail.orderNumber}
          </DialogRow>
          <DialogRow label="경로">
            {detail.routeLabel}
            <Sub>
              {` · ${detail.source === "OPERATOR" ? "운영자 사유" : "PG 자동"}`}
            </Sub>
          </DialogRow>
          <DialogRow label="취소 대상">
            {detail.originalPayment.methodLabel}{" "}
            <span className="tabular-nums">
              {detail.originalPayment.pgTransactionId}
            </span>{" "}
            ·{" "}
            <b className="tabular-nums">
              {formatWon(detail.originalPayment.amount)}
            </b>
          </DialogRow>
          {detail.failure && (
            <DialogRow label="실패">
              {detail.failure.label}
              <Sub>
                {` · 코드 ${detail.failure.code} · ${formatMonthDayTime(detail.failure.failedAt)}`}
              </Sub>
            </DialogRow>
          )}
          {detail.autoRetry && (
            <DialogRow label="자동 재시도">
              {detail.autoRetry.count}회 · 실패
              <Sub>{` · ${formatMonthDayTime(detail.autoRetry.failedAt)}`}</Sub>
            </DialogRow>
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
