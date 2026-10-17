import {
  ModalLabel,
  ModalShell,
} from "@/common/components/ModalShell/ModalShell";
import OrderBtn from "@/features/order/components/shared/OrderBtn";
import { MODAL_TEXTAREA_CLASS } from "@/features/order/components/shared/styles";
import { useForceCancel } from "@/features/order/hooks/useOrderMutations";
import type { OrderActions } from "@/features/order/types";
import { useState } from "react";
import toast from "react-hot-toast";

/**
 * 직권 취소 확인 — 시안에는 버튼과 안내 문구만 있고 대화상자는 없다(DS 확인 모달 400px 규격으로 보탰다).
 * 배송 전 하위주문만 대상이고 취소분은 PG 자동 환불이라 운영자 집행이 없다.
 * 정산 확정 항목이 있으면 클로백이 생기므로 누르기 전에 적는다. 사유는 필수 — 빈 값은 버튼 비활성만.
 */
export default function ForceCancelDialog(props: {
  orderNo: string;
  config: NonNullable<OrderActions["forceCancel"]>;
  onClose: () => void;
}) {
  const { orderNo, config, onClose } = props;
  const [reason, setReason] = useState("");
  const { mutateAsync, isPending } = useForceCancel();

  const handleSubmit = async () => {
    try {
      await mutateAsync({ orderNo, body: { reason: reason.trim() } });
      toast.success("직권 취소했습니다 — PG 자동 환불이 실행됩니다");
      onClose();
    } catch {
      toast.error("직권 취소에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <ModalShell
      isOpen
      title="직권 취소"
      width={400}
      onClose={onClose}
      footer={
        <>
          <OrderBtn variant="secondary" onClick={onClose}>
            취소
          </OrderBtn>
          <OrderBtn
            variant="danger"
            disabled={reason.trim().length === 0 || isPending}
            onClick={handleSubmit}
          >
            직권 취소
          </OrderBtn>
        </>
      }
    >
      <p className="text-[12px] leading-[1.7] text-sz-n-700">
        <b>{config.targetBrandNames.join(", ")} 하위주문</b>(배송 전)을 직권
        취소합니다. 취소분은 <b>PG 자동 환불</b>로 처리되며 운영자 집행이
        없습니다.{" "}
        {config.clawback ? (
          <b>정산 확정 항목이 있어 다음 정산에서 차감됩니다(클로백).</b>
        ) : (
          <b>정산 확정 항목 없음 — 클로백 발생하지 않습니다.</b>
        )}
      </p>
      <div className="mt-4">
        <ModalLabel required>사유</ModalLabel>
        <textarea
          className={MODAL_TEXTAREA_CLASS}
          placeholder="직권 취소 근거를 적습니다"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </div>
    </ModalShell>
  );
}
