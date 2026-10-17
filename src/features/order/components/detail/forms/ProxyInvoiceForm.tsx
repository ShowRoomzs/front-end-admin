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
} from "@/features/order/components/detail/forms/FormParts";
import { RailCard, RailText } from "@/features/order/components/detail/parts";
import {
  INVOICE_MAX_LENGTH,
  INVOICE_MIN_LENGTH,
  TRACKING_CARRIERS,
} from "@/features/order/constants/labels";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/features/order/constants/params";
import { useProxyInvoice } from "@/features/order/hooks/useOrderMutations";
import {
  getOrderErrorCode,
  getOrderErrorMessage,
} from "@/features/order/utils/apiError";
import { cn } from "@/lib/utils";
import { useState } from "react";
import toast from "react-hot-toast";

/**
 * 시안 B4 — 송장 대행 등록. 발송 기한 경과 후 자동 알림 3회 무응답일 때만 열린다.
 * 택배사는 추적 연동 목록 하나에서만 고른다(자유 입력 없음). 대행 사유 필수 ·
 * 출처가 「운영자 대행」으로 남아 브랜드에 통지된다.
 * 빈 값은 버튼 비활성만 — 에러 문구는 송장번호 형식 오류·중복에만 뜬다.
 */
export default function ProxyInvoiceForm(props: { orderNo: string }) {
  const { orderNo } = props;
  const [carrier, setCarrier] = useState(TRACKING_CARRIERS[0]);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useProxyInvoice();

  const formatInvalid =
    invoiceNo.length > 0 &&
    (invoiceNo.length < INVOICE_MIN_LENGTH ||
      invoiceNo.length > INVOICE_MAX_LENGTH);
  const canSubmit =
    invoiceNo.length > 0 && !formatInvalid && reason.trim().length > 0;

  const handleSubmit = async () => {
    try {
      await mutateAsync({
        orderNo,
        body: { carrier, invoiceNo, reason: reason.trim() },
      });
      toast.success("운영자 대행 송장을 등록했습니다 — 브랜드에 통지됩니다");
    } catch (error) {
      if (getOrderErrorCode(error) === "DUPLICATE_INVOICE") {
        setServerError(
          getOrderErrorMessage(error) ?? "이미 등록된 송장번호입니다."
        );
        return;
      }
      toast.error("송장 대행 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  const showFormatError = touched && formatInvalid;

  return (
    <RailCard title="송장 대행 등록">
      <FormShell>
        <FormLabel required htmlFor="proxy-carrier">
          택배사
        </FormLabel>
        <select
          id="proxy-carrier"
          className={FORM_SELECT_CLASS}
          style={MODAL_SELECT_CHEVRON_STYLE}
          value={carrier}
          onChange={(event) => setCarrier(event.target.value)}
        >
          {TRACKING_CARRIERS.map((name) => (
            <option key={name} value={name}>
              {name}
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
            (showFormatError || serverError) && "border-sz-danger-text"
          )}
          value={invoiceNo}
          onChange={(event) => {
            // 숫자만 — 붙여넣은 하이픈·공백은 걸러낸다
            setInvoiceNo(event.target.value.replace(/\D/g, ""));
            setServerError(null);
          }}
          onBlur={() => setTouched(true)}
        />
        {showFormatError && (
          <FormError>
            송장번호 형식이 올바르지 않습니다(숫자 {INVOICE_MIN_LENGTH}~
            {INVOICE_MAX_LENGTH}자리).
          </FormError>
        )}
        {serverError && <FormError>{serverError}</FormError>}

        <FormLabel required htmlFor="proxy-reason">
          대행 사유
        </FormLabel>
        <textarea
          id="proxy-reason"
          className={FORM_TEXTAREA_CLASS}
          placeholder="브랜드 무응답 경위와 송장 확보 경로를 적습니다"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />

        <FormWarn tone="info">
          송장 출처가 <b>「운영자 대행」</b>으로 기록되며 <b>브랜드에게 통지</b>
          됩니다. 형식 오류·중복 송장은 등록되지 않습니다.
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
        세 칸이 모두 채워질 때까지 버튼은 <b>비활성</b>입니다 — 에러 문구는 형식
        오류·중복에만 뜹니다.
      </RailText>
    </RailCard>
  );
}
