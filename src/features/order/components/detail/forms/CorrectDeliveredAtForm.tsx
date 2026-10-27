import OrderBtn from "@/features/order/components/shared/OrderBtn";
import {
  FORM_INPUT_CLASS,
  FORM_TEXTAREA_CLASS,
} from "@/features/order/components/shared/styles";
import {
  FormError,
  FormHint,
  FormLabel,
  FormShell,
  FormWarn,
  TargetGroupField,
} from "@/features/order/components/detail/forms/FormParts";
import { RailCard, RailText } from "@/features/order/components/detail/parts";
import { useCorrectDeliveredAt } from "@/features/order/hooks/useOrderMutations";
import type {
  AdminOrderDetail,
  AdminOrderGroupDetail,
} from "@/features/order/types";
import {
  parseDotDate,
  toDotDate,
  toEventTime,
  toLocalDateTime,
} from "@/features/order/utils/format";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { useState } from "react";
import toast from "react-hot-toast";

/**
 * 시안 B3 — 배송완료일 정정(배송완료 상태만 · `actions.canCorrectDeliveredAt`). 소비자 수령일 이의를
 * 받아들일 때만 쓴다. 정정 사유 필수(300자) · 정정하면 구매확정 예정일과 반품·교환 가능 기간이
 * 함께 움직인다는 사실을 버튼 바로 위에 적는다.
 * 서버는 수령 「일시」를 받는다 — 날짜만 고치고 시각은 원래 값을 그대로 쓰되, 지금보다 뒤가 되면 지금으로 맞춘다
 * (발송 이후 · 지금 이전이 아니면 400).
 * 시안의 「근거」 셀렉트(1:1 문의 · 스레드 · 증빙 사진)는 받을 필드가 없어 사유 입력 하나로 합쳤다.
 */
export default function CorrectDeliveredAtForm(props: {
  detail: AdminOrderDetail;
  groups: Array<AdminOrderGroupDetail>;
  onClose: () => void;
}) {
  const { detail, groups, onClose } = props;
  const [groupId, setGroupId] = useState(groups[0]?.deliveryGroupId ?? 0);
  const group = groups.find((g) => g.deliveryGroupId === groupId);
  const currentAt = group?.shipping.deliveredAt ?? null;
  const [dateText, setDateText] = useState(
    currentAt ? toDotDate(currentAt) : ""
  );
  const [reason, setReason] = useState("");
  const { mutateAsync, isPending } = useCorrectDeliveredAt();

  // 배송완료 · 확정 예정은 이벤트 시각(UTC) — 운영자 시각으로 바꿔 날짜를 비교하고, 보낼 때 다시 UTC로
  const current = currentAt ? toEventTime(currentAt) : null;
  const parsed = parseDotDate(dateText);
  const unchanged = (current && parsed?.isSame(current, "day")) ?? false;
  const formatInvalid = dateText.length > 0 && !parsed;
  const canSubmit =
    groupId > 0 && reason.trim().length > 0 && parsed !== null && !unchanged;

  const target = (() => {
    if (!parsed || !current) return null;
    const withTime = parsed
      .hour(current.hour())
      .minute(current.minute())
      .second(current.second());
    return withTime.isAfter(dayjs()) ? dayjs() : withTime;
  })();

  // 구매확정 예정도 같은 만큼 움직인다(정지 중 · 확정 후면 예정이 없다)
  const dueAt = group?.purchaseConfirm?.dueAt ?? null;
  const shiftedDue =
    dueAt && target && current
      ? toEventTime(dueAt).add(target.diff(current, "day"), "day")
      : null;
  const periodChange =
    target && current && target.isAfter(current, "day")
      ? "늘어납니다"
      : "줄어듭니다";

  const handleSubmit = async () => {
    if (!target) return;
    try {
      await mutateAsync({
        orderId: detail.orderId,
        deliveryGroupId: groupId,
        body: { deliveredAt: toLocalDateTime(target), reason: reason.trim() },
      });
      toast.success("배송완료일을 정정했습니다");
      onClose();
    } catch {
      // 날짜 범위 · 상태 변경은 apiInstance가 서버 문구로 알린다
    }
  };

  return (
    <RailCard
      title="배송완료일 정정"
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
        {groups.length > 1 && (
          <TargetGroupField
            id="correct-group"
            groups={groups}
            value={groupId}
            onChange={(id) => {
              setGroupId(id);
              const next = groups.find((g) => g.deliveryGroupId === id);
              setDateText(
                next?.shipping.deliveredAt
                  ? toDotDate(next.shipping.deliveredAt)
                  : ""
              );
            }}
          />
        )}
        <FormLabel required htmlFor="correct-reason">
          정정 사유
        </FormLabel>
        <textarea
          id="correct-reason"
          maxLength={300}
          className={FORM_TEXTAREA_CLASS}
          placeholder="이의 경로(1:1 문의 번호 등)와 확인한 근거를 적습니다"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />

        <FormLabel required htmlFor="correct-date">
          정정할 배송완료일
        </FormLabel>
        <input
          id="correct-date"
          autoComplete="off"
          placeholder="2026.09.18"
          className={cn(
            FORM_INPUT_CLASS,
            "tabular-nums",
            formatInvalid && "border-sz-danger-text"
          )}
          value={dateText}
          onChange={(event) => setDateText(event.target.value)}
        />
        {formatInvalid && (
          <FormError>날짜 형식이 올바르지 않습니다(예: 2026.09.18).</FormError>
        )}
        {currentAt && (
          <FormHint>
            현재 값 {toDotDate(currentAt)}
            {group?.shipping.deliveredSourceLabel &&
              ` (${group.shipping.deliveredSourceLabel})`}
          </FormHint>
        )}

        <FormWarn>
          정정하면{" "}
          {shiftedDue && dueAt ? (
            <b>
              구매확정 예정일이 {toEventTime(dueAt).format("MM.DD")} →{" "}
              {shiftedDue.format("MM.DD")}
            </b>
          ) : (
            <b>구매확정 예정일</b>
          )}
          {shiftedDue ? "로 바뀌고 " : "과 "}
          <b>반품·교환 가능 기간</b>도 함께 {periodChange}.
        </FormWarn>
        <OrderBtn
          variant="primary"
          block
          className="mt-[9px]"
          disabled={!canSubmit || isPending}
          onClick={handleSubmit}
        >
          정정
        </OrderBtn>
      </FormShell>
      <RailText>
        정정 시 출처가 <b>(운영자 정정)</b>으로 바뀌고 원래 값은 이력에
        남습니다.
      </RailText>
    </RailCard>
  );
}
