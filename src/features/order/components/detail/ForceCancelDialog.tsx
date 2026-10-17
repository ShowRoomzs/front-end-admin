import {
  ModalLabel,
  ModalShell,
} from "@/common/components/ModalShell/ModalShell";
import OrderBtn from "@/features/order/components/shared/OrderBtn";
import {
  FORM_SELECT_CLASS,
  MODAL_TEXTAREA_CLASS,
} from "@/features/order/components/shared/styles";
import { CANCEL_REASONS } from "@/features/order/constants/labels";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/features/order/constants/params";
import { useCancelGroup } from "@/features/order/hooks/useOrderMutations";
import type {
  AdminOrderDetail,
  SellerCancelReason,
} from "@/features/order/types";
import { subOrderSuffix } from "@/features/order/utils/format";
import { cn } from "@/lib/utils";
import { useState } from "react";
import toast from "react-hot-toast";

/**
 * 직권 취소 확인 — 시안에는 버튼과 안내 문구만 있고 대화상자는 없다(DS 확인 모달 400px 규격으로 보탰다).
 * 대상은 배송 전 하위주문 하나(`actions.canCancel`)이고 하위주문 전체가 취소 · 재고 원복 ·
 * **PG 즉시 자동 환불**(항목 + 배송비 전액)된다. 사유 코드가 「상품 하자」가 아니면 대행 조건
 * (발송 기한 경과 ∧ 자동 알림 3회 무응답)을 서버가 다시 본다. 소비자 전달 문구 필수 — 빈 값은 버튼 비활성만.
 */
export default function ForceCancelDialog(props: {
  detail: AdminOrderDetail;
  onClose: () => void;
}) {
  const { detail, onClose } = props;
  const groups = detail.groups.filter((group) => group.actions.canCancel);
  const [groupId, setGroupId] = useState(groups[0]?.deliveryGroupId ?? 0);
  const [reasonCode, setReasonCode] = useState<SellerCancelReason>("DEFECT");
  const [message, setMessage] = useState("");
  const { mutateAsync, isPending } = useCancelGroup();

  const group = groups.find((g) => g.deliveryGroupId === groupId);
  const canSubmit = groupId > 0 && message.trim().length > 0;

  const handleSubmit = async () => {
    try {
      await mutateAsync({
        orderId: detail.orderId,
        deliveryGroupId: groupId,
        body: { reasonCode, consumerMessage: message.trim() },
      });
      toast.success("직권 취소했습니다 — PG 자동 환불이 실행됩니다");
      onClose();
    } catch {
      // 대행 조건 미충족 · 검토 중 취소 요청 · 상태 변경은 apiInstance가 서버 문구로 알린다
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
            disabled={!canSubmit || isPending}
            onClick={handleSubmit}
          >
            직권 취소
          </OrderBtn>
        </>
      }
    >
      <p className="text-[12px] leading-[1.7] text-sz-n-700">
        {group && (
          <b>
            {group.brandName} 하위주문 {subOrderSuffix(group.subOrderNumber)}
          </b>
        )}
        (배송 전)을 직권 취소합니다. 하위주문 전체가 취소되고 재고가 돌아오며,{" "}
        <b>PG 자동 환불</b>(항목 + 배송비 전액)로 처리되어 운영자 집행이
        없습니다.
      </p>
      {groups.length > 1 && (
        <div className="mt-4">
          <ModalLabel required>대상 하위주문</ModalLabel>
          <select
            aria-label="대상 하위주문"
            className={cn(FORM_SELECT_CLASS, "h-8 text-[13px]")}
            style={MODAL_SELECT_CHEVRON_STYLE}
            value={groupId}
            onChange={(event) => setGroupId(Number(event.target.value))}
          >
            {groups.map((g) => (
              <option key={g.deliveryGroupId} value={g.deliveryGroupId}>
                {g.brandName} · 하위주문 {subOrderSuffix(g.subOrderNumber)}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="mt-4">
        <ModalLabel required>사유</ModalLabel>
        <select
          aria-label="취소 사유"
          className={cn(FORM_SELECT_CLASS, "h-8 text-[13px]")}
          style={MODAL_SELECT_CHEVRON_STYLE}
          value={reasonCode}
          onChange={(event) =>
            setReasonCode(event.target.value as SellerCancelReason)
          }
        >
          {CANCEL_REASONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        {reasonCode !== "DEFECT" && (
          <p className="mt-1 text-[11px] text-sz-n-500">
            상품 하자 외 사유는 대행 조건(발송 기한 경과 · 자동 알림 3회
            무응답)을 충족해야 취소됩니다.
          </p>
        )}
      </div>
      <div className="mt-4">
        <ModalLabel required>소비자 전달 문구</ModalLabel>
        <textarea
          aria-label="소비자 전달 문구"
          maxLength={300}
          className={MODAL_TEXTAREA_CLASS}
          placeholder="소비자에게 그대로 전달됩니다"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>
    </ModalShell>
  );
}
