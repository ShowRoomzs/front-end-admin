import OrderBtn from "@/features/order/components/shared/OrderBtn";
import {
  FORM_SELECT_CLASS,
  FORM_TEXTAREA_CLASS,
} from "@/features/order/components/shared/styles";
import {
  CheckRow,
  FormHint,
  FormLabel,
  FormShell,
  FormWarn,
  TargetGroupField,
} from "@/features/order/components/detail/forms/FormParts";
import { RailCard, RailText } from "@/features/order/components/detail/parts";
import { DEFECT_REASONS } from "@/features/order/constants/labels";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/features/order/constants/params";
import { useOpenDefectClaim } from "@/features/order/hooks/useOrderMutations";
import type {
  AdminOrderDetail,
  AdminOrderGroupDetail,
  ClaimReason,
} from "@/features/order/types";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

/** 반품을 열 수 있는 항목 — 결제 완료 · 구매확정이고 남은 수량이 있다 */
function candidatesOf(group: AdminOrderGroupDetail | undefined) {
  return (group?.items ?? [])
    .filter(
      (item) =>
        (item.status === "PAID" || item.status === "PURCHASE_CONFIRMED") &&
        item.quantity - item.returnedQuantity > 0
    )
    .map((item) => ({
      ...item,
      remaining: item.quantity - item.returnedQuantity,
    }));
}

/**
 * 시안 B6 — 구매확정 후 하자 · 반품 대신 열기(`actions.canOpenDefectClaim` — 배송완료 3개월 안).
 * 운영자가 1:1 문의의 증빙을 보고 **반품 클레임을 대신 연다** — 연 뒤로는 회수 송장 · 검수 ·
 * 자동 환불이 일반 반품과 같다(06b). 하자 유형에 단순 변심이 없다.
 * 서버가 받는 것은 항목 · 수량 · 하자 유형 · 하자 내용 · 증빙 사진 URL(1장 이상)이다 —
 * 시안의 「하자 인지일」(안 날부터 30일)은 서버가 받지 않아 뺐다(운영자가 문의 접수일로 판단).
 */
export default function OpenReturnForm(props: {
  detail: AdminOrderDetail;
  groups: Array<AdminOrderGroupDetail>;
  onClose: () => void;
}) {
  const { detail, groups, onClose } = props;
  const [groupId, setGroupId] = useState(groups[0]?.deliveryGroupId ?? 0);
  const group = groups.find((g) => g.deliveryGroupId === groupId);
  const candidates = useMemo(() => candidatesOf(group), [group]);
  // 후보가 하나면 처음부터 골라 둔다 — 운영자가 고를 것이 없다
  const [selected, setSelected] = useState<Record<number, number>>(() =>
    candidates.length === 1
      ? { [candidates[0].orderProductId]: candidates[0].remaining }
      : {}
  );
  const [reasonCode, setReasonCode] = useState<ClaimReason>(
    "DAMAGED_OR_DEFECTIVE"
  );
  const [detailText, setDetailText] = useState("");
  const [urlsText, setUrlsText] = useState("");
  const { mutateAsync, isPending } = useOpenDefectClaim();

  const urls = urlsText
    .split(/\s+/)
    .map((url) => url.trim())
    .filter(Boolean);
  const chosen = candidates.filter(
    (item) => selected[item.orderProductId] !== undefined
  );
  const canSubmit =
    groupId > 0 &&
    chosen.length > 0 &&
    detailText.trim().length > 0 &&
    urls.length > 0;

  const deliveredAt = group?.shipping.deliveredAt;
  const settled = Boolean(group?.settlement?.confirmedAt);

  const toggle = (id: number, remaining: number) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id] === undefined) {
        next[id] = remaining;
      } else {
        delete next[id];
      }
      return next;
    });

  const handleSubmit = async () => {
    try {
      await mutateAsync({
        orderId: detail.orderId,
        deliveryGroupId: groupId,
        body: {
          items: chosen.map((item) => ({
            orderProductId: item.orderProductId,
            quantity: selected[item.orderProductId],
          })),
          reasonCode,
          detail: detailText.trim(),
          evidenceImageUrls: urls,
        },
      });
      toast.success("반품을 열었습니다 — 반품·교환에서 이어서 처리합니다");
      onClose();
    } catch {
      // 사유 · 수량 · 기한 오류는 apiInstance가 서버 문구로 알린다
    }
  };

  return (
    <RailCard
      title="반품 대신 열기"
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
      {deliveredAt && (
        <RailText flush>
          공급일 {dayjs(deliveredAt).format("MM.DD")} → 3개월{" "}
          <b>{dayjs(deliveredAt).add(3, "month").format("MM.DD")}</b> · 안
          날부터 30일은 문의 접수일로 판단합니다.
        </RailText>
      )}
      <FormShell>
        {groups.length > 1 && (
          <TargetGroupField
            id="return-group"
            groups={groups}
            value={groupId}
            onChange={(id) => {
              setGroupId(id);
              setSelected({});
            }}
          />
        )}
        <FormLabel required>대상 항목</FormLabel>
        {candidates.map((item) => (
          <CheckRow
            key={item.orderProductId}
            checked={selected[item.orderProductId] !== undefined}
            label={[item.productName, item.optionName]
              .filter(Boolean)
              .join(" ")}
            qty={selected[item.orderProductId] ?? 0}
            maxQty={item.remaining}
            onToggle={() => toggle(item.orderProductId, item.remaining)}
            onQtyChange={(qty) =>
              setSelected((prev) => ({ ...prev, [item.orderProductId]: qty }))
            }
          />
        ))}

        <FormLabel required htmlFor="return-defect">
          하자 유형
        </FormLabel>
        <select
          id="return-defect"
          className={FORM_SELECT_CLASS}
          style={MODAL_SELECT_CHEVRON_STYLE}
          value={reasonCode}
          onChange={(event) => setReasonCode(event.target.value as ClaimReason)}
        >
          {DEFECT_REASONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <FormLabel required htmlFor="return-detail">
          하자 내용
        </FormLabel>
        <textarea
          id="return-detail"
          maxLength={1000}
          className={FORM_TEXTAREA_CLASS}
          placeholder="1:1 문의 번호와 하자 내용을 요약합니다"
          value={detailText}
          onChange={(event) => setDetailText(event.target.value)}
        />

        <FormLabel required htmlFor="return-evidence">
          증빙 사진 URL
        </FormLabel>
        <textarea
          id="return-evidence"
          className={FORM_TEXTAREA_CLASS}
          placeholder="문의에 첨부된 사진 주소 — 한 줄에 하나"
          value={urlsText}
          onChange={(event) => setUrlsText(event.target.value)}
        />
        <FormHint>증빙 {urls.length}장 · 1장 이상 필요</FormHint>

        <FormWarn>
          반품이 열리면 소비자에게 <b>회수 송장 입력</b>이 요청되고 검수·환불은
          일반 반품과 같습니다(<b>브랜드 귀책 · 착불 · 차감 없음</b>).
          {settled && (
            <>
              {" "}
              이 하위주문은 <b>정산 확정</b> — 환불되면{" "}
              <b>다음 정산에서 차감</b>됩니다.
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
          반품 열기
        </OrderBtn>
      </FormShell>
      <RailText>단순 변심은 열 수 없습니다 — 하자 유형에 없습니다.</RailText>
    </RailCard>
  );
}
