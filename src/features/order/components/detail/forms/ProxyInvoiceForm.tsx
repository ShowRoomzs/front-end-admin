import OrderBtn from "@/features/order/components/shared/OrderBtn";
import {
  FORM_INPUT_CLASS,
  FORM_SELECT_CLASS,
  FORM_TEXTAREA_CLASS,
} from "@/features/order/components/shared/styles";
import {
  FormError,
  FormLabel,
  FormShell,
  FormWarn,
  TargetGroupField,
} from "@/features/order/components/detail/forms/FormParts";
import { RailCard, RailText } from "@/features/order/components/detail/parts";
import { TRACKING_CARRIERS } from "@/features/order/constants/labels";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/features/order/constants/params";
import { useRegisterShipment } from "@/features/order/hooks/useOrderMutations";
import type {
  AdminOrderDetail,
  AdminOrderGroupDetail,
  DeliveryCarrier,
} from "@/features/order/types";
import {
  getOrderErrorCode,
  getOrderErrorMessage,
} from "@/features/order/utils/apiError";
import { cn } from "@/lib/utils";
import { useState } from "react";
import toast from "react-hot-toast";

/** 폼 안에 직접 그리는 서버 오류 — 송장 형식 · 지원하지 않는 택배사 · 중복 송장 */
const INLINE_ERROR_CODES = ["INVOICE_FORMAT_INVALID", "INVOICE_DUPLICATE"];

/**
 * 시안 B4 — 송장 대행 등록. 상품준비중 ∧ 발송 기한 경과 ∧ 자동 알림 3회 무응답일 때만 열린다
 * (`actions.canRegisterShipment`). 택배사는 추적 연동 목록 하나에서만 고른다(자유 입력 없음).
 * 대행 사유 필수(300자) · 이력에 「운영자 대행」으로 남는다.
 * 빈 값은 버튼 비활성만 — 송장 형식 · 중복은 서버가 판정하고 그 문구를 칸 아래에 띄운다.
 */
export default function ProxyInvoiceForm(props: {
  detail: AdminOrderDetail;
  groups: Array<AdminOrderGroupDetail>;
}) {
  const { detail, groups } = props;
  const [groupId, setGroupId] = useState(groups[0]?.deliveryGroupId ?? 0);
  const [carrier, setCarrier] = useState<DeliveryCarrier>(
    TRACKING_CARRIERS[0].value
  );
  const [trackingNumber, setTrackingNumber] = useState("");
  const [note, setNote] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useRegisterShipment();

  const canSubmit =
    groupId > 0 && trackingNumber.length > 0 && note.trim().length > 0;

  const handleSubmit = async () => {
    try {
      await mutateAsync({
        orderId: detail.orderId,
        deliveryGroupId: groupId,
        body: { carrier, trackingNumber, note: note.trim() },
      });
      toast.success("운영자 대행 송장을 등록했습니다");
    } catch (error) {
      const message = getOrderErrorMessage(error);
      if (INLINE_ERROR_CODES.includes(getOrderErrorCode(error) ?? "")) {
        setServerError(message ?? "송장번호를 확인해 주세요.");
        return;
      }
      // 이 요청은 인터셉터 토스트를 껐다 — 나머지 오류는 서버 문구로 직접 알린다
      toast.error(message ?? "송장 대행 등록에 실패했습니다.");
    }
  };

  return (
    <RailCard title="송장 대행 등록">
      <FormShell>
        {groups.length > 1 && (
          <TargetGroupField
            id="proxy-group"
            groups={groups}
            value={groupId}
            onChange={setGroupId}
          />
        )}
        <FormLabel required htmlFor="proxy-carrier">
          택배사
        </FormLabel>
        <select
          id="proxy-carrier"
          className={FORM_SELECT_CLASS}
          style={MODAL_SELECT_CHEVRON_STYLE}
          value={carrier}
          onChange={(event) => {
            setCarrier(event.target.value as DeliveryCarrier);
            setServerError(null);
          }}
        >
          {TRACKING_CARRIERS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <FormLabel required htmlFor="proxy-invoice">
          송장번호
        </FormLabel>
        <input
          id="proxy-invoice"
          inputMode="numeric"
          autoComplete="off"
          placeholder="숫자만 입력"
          className={cn(
            FORM_INPUT_CLASS,
            "tabular-nums",
            serverError && "border-sz-danger-text"
          )}
          value={trackingNumber}
          onChange={(event) => {
            // 숫자만 — 붙여넣은 하이픈·공백은 걸러낸다(서버도 숫자만 남겨 저장한다)
            setTrackingNumber(event.target.value.replace(/\D/g, ""));
            setServerError(null);
          }}
        />
        {serverError && <FormError>{serverError}</FormError>}

        <FormLabel required htmlFor="proxy-reason">
          대행 사유
        </FormLabel>
        <textarea
          id="proxy-reason"
          maxLength={300}
          className={FORM_TEXTAREA_CLASS}
          placeholder="브랜드 무응답 경위와 송장 확보 경로를 적습니다"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />

        <FormWarn tone="info">
          이력에 <b>「운영자 대행」</b>으로 기록됩니다. 형식 오류·중복 송장은
          등록되지 않습니다.
        </FormWarn>
        <OrderBtn
          variant="primary"
          block
          className="mt-[9px]"
          disabled={!canSubmit || isPending}
          onClick={handleSubmit}
        >
          등록
        </OrderBtn>
      </FormShell>
      <RailText>
        칸이 모두 채워질 때까지 버튼은 <b>비활성</b>입니다 — 에러 문구는 형식
        오류·중복에만 뜹니다.
      </RailText>
    </RailCard>
  );
}
