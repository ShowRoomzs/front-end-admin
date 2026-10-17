import OrderBtn from "@/features/order/components/shared/OrderBtn";
import {
  FORM_SELECT_CLASS,
  FORM_TEXTAREA_CLASS,
} from "@/features/order/components/shared/styles";
import {
  CheckRow,
  FormLabel,
  FormShell,
  FormWarn,
} from "@/features/order/components/detail/forms/FormParts";
import { RailCard } from "@/features/order/components/detail/parts";
import { REFUND_CATEGORIES } from "@/features/order/constants/labels";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/features/order/constants/params";
import { useRefundOrder } from "@/features/order/hooks/useOrderMutations";
import type { OrderDetail, OrderRefundRequest } from "@/features/order/types";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

/**
 * 시안 B5 — 운영자 사유 환불(반려 이의 인용 · 위해성 리콜 · 기타). 운영자가 실행하는 유일한 환불이다 —
 * 취소·반품 승인·반송 완료는 모두 PG 자동이다. 이 화면은 **환불 대기 편입까지**이고 집행은
 * 환불 관리의 재확인 다이얼로그에서 한다. 정산 확정된 항목이면 클로백이 생기므로 누르기 전에 적어 둔다.
 * 구매확정 후 하자는 환불이 아니라 반품을 대신 연다(OpenReturnForm).
 */
export default function RefundForm(props: {
  detail: OrderDetail;
  onClose: () => void;
}) {
  const { detail, onClose } = props;
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [category, setCategory] =
    useState<OrderRefundRequest["category"]>("RECALL");
  const [reason, setReason] = useState("");
  const { mutateAsync, isPending } = useRefundOrder();

  // 이미 취소·환불 대기에 든 항목은 대상에서 뺀다
  const items = useMemo(
    () =>
      detail.subOrders
        .flatMap((sub) => sub.items)
        .filter(
          (item) => item.status.label !== "취소·환불" && !item.extraBadge
        ),
    [detail.subOrders]
  );
  const chosen = items.filter((item) => selected[item.id] !== undefined);
  const hasSettled = chosen.some((item) => item.settled);
  const canSubmit = chosen.length > 0 && reason.trim().length > 0;

  const toggle = (id: string, qty: number) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id] === undefined) {
        next[id] = qty;
      } else {
        delete next[id];
      }
      return next;
    });

  const handleSubmit = async () => {
    try {
      await mutateAsync({
        orderNo: detail.orderNo,
        body: {
          items: chosen.map((item) => ({
            itemId: item.id,
            qty: selected[item.id],
          })),
          category,
          reason: reason.trim(),
        },
      });
      toast.success(
        "환불 대기에 편입했습니다 — 환불 관리에서 재확인 후 실행합니다"
      );
      onClose();
    } catch {
      toast.error("환불 대기 편입에 실패했습니다. 잠시 후 다시 시도해 주세요.");
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
        <FormLabel required>대상 항목</FormLabel>
        {items.map((item) => (
          <CheckRow
            key={item.id}
            checked={selected[item.id] !== undefined}
            label={`${item.name} ${item.option}`}
            qty={selected[item.id] ?? 0}
            maxQty={item.qty}
            onToggle={() => toggle(item.id, item.qty)}
            onQtyChange={(qty) =>
              setSelected((prev) => ({ ...prev, [item.id]: qty }))
            }
          />
        ))}

        <FormLabel required htmlFor="refund-category">
          사유 카테고리
        </FormLabel>
        <select
          id="refund-category"
          className={FORM_SELECT_CLASS}
          style={MODAL_SELECT_CHEVRON_STYLE}
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as OrderRefundRequest["category"])
          }
        >
          {REFUND_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <FormLabel required htmlFor="refund-reason">
          근거
        </FormLabel>
        <textarea
          id="refund-reason"
          className={FORM_TEXTAREA_CLASS}
          placeholder="환불 근거를 적습니다"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />

        <FormWarn>
          {hasSettled ? (
            <>
              선택 항목 중 <b>정산 확정</b> 항목이 있어 환불되면{" "}
              <b>다음 정산에서 차감</b>됩니다(클로백). 환불은{" "}
              <b>「환불 관리」에서 재확인 후 실행</b>되며 여기서는{" "}
              <b>대기 편입까지</b>입니다.
            </>
          ) : (
            <>
              선택 항목은 <b>정산 전</b>이라 클로백이 없습니다. 환불은{" "}
              <b>「환불 관리」에서 재확인 후 실행</b>되며 여기서는{" "}
              <b>대기 편입까지</b>입니다.
            </>
          )}
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
