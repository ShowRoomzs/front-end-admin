import OrderBtn from "@/features/order/components/shared/OrderBtn";
import {
  FORM_INPUT_CLASS,
  FORM_SELECT_CLASS,
  FORM_TEXTAREA_CLASS,
} from "@/features/order/components/shared/styles";
import {
  FormHint,
  FormLabel,
  FormShell,
  FormWarn,
  TargetGroupField,
} from "@/features/order/components/detail/forms/FormParts";
import { RailCard } from "@/features/order/components/detail/parts";
import { REFUND_REASONS } from "@/features/order/constants/labels";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/features/order/constants/params";
import { useEnqueueRefund } from "@/features/order/hooks/useOrderMutations";
import type {
  AdminOrderDetail,
  AdminOrderGroupDetail,
  OperatorRefundReason,
} from "@/features/order/types";
import { formatWon } from "@/features/order/utils/format";
import { cn } from "@/lib/utils";
import { useState } from "react";
import toast from "react-hot-toast";

/**
 * 시안 B5 — 운영자 사유 환불(발송분 · 배송중 · 배송완료 · 구매확정). 이 화면은 **환불 대기 편입까지**이고
 * 집행은 환불 관리의 재확인 다이얼로그에서 한다. 서버는 항목 체크 + 수량 대신 **금액 하나**를 받고,
 * 사유는 위해성 리콜 · 구매확정 후 하자 2종이다(반려 이의 인용 · 검수 무응답은 반품·교환 화면 전용).
 * 금액 상한은 「결제 취소 가능 잔액 − 아직 나가지 않은 환불」이라 서버가 넘으면 409로 잔액을 알려 준다.
 */
export default function RefundForm(props: {
  detail: AdminOrderDetail;
  groups: Array<AdminOrderGroupDetail>;
  onClose: () => void;
}) {
  const { detail, groups, onClose } = props;
  const [groupId, setGroupId] = useState(groups[0]?.deliveryGroupId ?? 0);
  const [reason, setReason] = useState<OperatorRefundReason>("RECALL");
  const [amountText, setAmountText] = useState("");
  const [detailText, setDetailText] = useState("");
  const { mutateAsync, isPending } = useEnqueueRefund();

  const group = groups.find((g) => g.deliveryGroupId === groupId);
  const amount = Number(amountText);
  const cancellable = detail.payment
    ? detail.payment.amount - detail.payment.cancelledAmount
    : null;
  const settled = Boolean(group?.settlement?.confirmedAt);
  const canSubmit =
    groupId > 0 &&
    Number.isInteger(amount) &&
    amount >= 1 &&
    detailText.trim().length > 0;

  const handleSubmit = async () => {
    try {
      await mutateAsync({
        orderId: detail.orderId,
        deliveryGroupId: groupId,
        body: { reason, amount, detail: detailText.trim() },
      });
      toast.success(
        "환불 대기에 편입했습니다 — 환불 관리에서 재확인 후 실행합니다"
      );
      onClose();
    } catch {
      // 잔액 초과 · 상태 변경 등은 apiInstance가 서버 문구로 알린다
    }
  };

  return (
    <RailCard
      title="운영자 사유 환불"
      action={
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-[10px] font-normal text-sz-n-500 hover:text-sz-n-700"
        >
          접기
        </button>
      }
    >
      <FormShell>
        <TargetGroupField
          id="refund-group"
          groups={groups}
          value={groupId}
          onChange={setGroupId}
        />

        <FormLabel required htmlFor="refund-category">
          사유 카테고리
        </FormLabel>
        <select
          id="refund-category"
          className={FORM_SELECT_CLASS}
          style={MODAL_SELECT_CHEVRON_STYLE}
          value={reason}
          onChange={(event) =>
            setReason(event.target.value as OperatorRefundReason)
          }
        >
          {REFUND_REASONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <FormLabel required htmlFor="refund-amount">
          환불 금액
        </FormLabel>
        <input
          id="refund-amount"
          inputMode="numeric"
          autoComplete="off"
          placeholder="원 단위 숫자"
          className={cn(FORM_INPUT_CLASS, "tabular-nums")}
          value={amountText}
          onChange={(event) =>
            setAmountText(event.target.value.replace(/\D/g, ""))
          }
        />
        {cancellable !== null && (
          <FormHint>
            결제 취소 가능 잔액 {formatWon(cancellable)} — 아직 나가지 않은
            환불만큼 줄어듭니다
          </FormHint>
        )}

        <FormLabel required htmlFor="refund-reason">
          근거
        </FormLabel>
        <textarea
          id="refund-reason"
          maxLength={500}
          className={FORM_TEXTAREA_CLASS}
          placeholder="환불 근거를 적습니다"
          value={detailText}
          onChange={(event) => setDetailText(event.target.value)}
        />

        <FormWarn>
          {settled ? (
            <>
              이 하위주문은 <b>정산 확정</b>이라 환불되면{" "}
              <b>다음 정산에서 차감</b>됩니다(클로백).
            </>
          ) : (
            <>
              이 하위주문은 <b>정산 전</b>이라 클로백이 없습니다.
            </>
          )}{" "}
          환불은 <b>「환불 관리」에서 재확인 후 실행</b>되며 여기서는{" "}
          <b>대기 편입까지</b>입니다.
        </FormWarn>
        <OrderBtn
          variant="primary"
          block
          className="mt-[9px]"
          disabled={!canSubmit || isPending}
          onClick={handleSubmit}
        >
          환불 대기 편입
        </OrderBtn>
      </FormShell>
    </RailCard>
  );
}
