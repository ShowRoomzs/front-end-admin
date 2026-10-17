import OrderBtn from "@/features/order/components/shared/OrderBtn";
import {
  FORM_INPUT_CLASS,
  FORM_SELECT_CLASS,
  FORM_TEXTAREA_CLASS,
} from "@/features/order/components/shared/styles";
import {
  FormError,
  FormHint,
  FormLabel,
  FormShell,
  FormWarn,
} from "@/features/order/components/detail/forms/FormParts";
import { RailCard, RailText } from "@/features/order/components/detail/parts";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/features/order/constants/params";
import { useCorrectDeliveredAt } from "@/features/order/hooks/useOrderMutations";
import type { OrderActions } from "@/features/order/types";
import { parseDotDate, toDotDate } from "@/features/order/utils/format";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { useState } from "react";
import toast from "react-hot-toast";

/**
 * 시안 B3 — 배송완료일 정정. 직권 배송완료를 지우고 이것으로 바꿨다: 택배사가 추적 연동 목록 하나로
 * 묶여 추적이 원래 없는 건이 생기지 않으므로, 남는 개입은 「이미 찍힌 날짜가 틀렸다는 이의」 하나다.
 * 근거 필수 · 정정하면 구매확정 예정일과 반품·교환 가능 기간이 함께 움직인다는 사실을 버튼 바로 위에 적는다.
 */
export default function CorrectDeliveredAtForm(props: {
  orderNo: string;
  config: NonNullable<OrderActions["correctDeliveredAt"]>;
}) {
  const { orderNo, config } = props;
  const [evidence, setEvidence] = useState(config.evidenceOptions[0] ?? "");
  const [evidenceText, setEvidenceText] = useState("");
  // 소비자가 주장하는 수령일에서 출발한다 — 운영자가 이의를 받아들일 때 그 값이 대개 정답이다
  const [dateText, setDateText] = useState(toDotDate(config.claimedDate));
  const { mutateAsync, isPending } = useCorrectDeliveredAt();

  const parsed = parseDotDate(dateText);
  const current = dayjs(config.currentDate);
  const unchanged = parsed?.isSame(current, "day") ?? false;
  const formatInvalid = dateText.length > 0 && !parsed;
  const canSubmit =
    evidenceText.trim().length > 0 && parsed !== null && !unchanged;

  const before = current.add(config.confirmDays, "day").format("MM.DD");
  const after = (parsed ?? dayjs(config.claimedDate))
    .add(config.confirmDays, "day")
    .format("MM.DD");

  const handleSubmit = async () => {
    if (!parsed) return;
    try {
      await mutateAsync({
        orderNo,
        body: {
          evidence,
          evidenceText: evidenceText.trim(),
          deliveredAt: parsed.format("YYYY-MM-DD"),
        },
      });
      toast.success(
        "배송완료일을 정정했습니다 — 브랜드와 소비자에게 통지됩니다"
      );
    } catch {
      toast.error(
        "배송완료일 정정에 실패했습니다. 잠시 후 다시 시도해 주세요."
      );
    }
  };

  return (
    <RailCard title="배송완료일 정정">
      <FormShell>
        <FormLabel required htmlFor="correct-evidence">
          근거
        </FormLabel>
        <select
          id="correct-evidence"
          className={FORM_SELECT_CLASS}
          style={MODAL_SELECT_CHEVRON_STYLE}
          value={evidence}
          onChange={(event) => setEvidence(event.target.value)}
        >
          {config.evidenceOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <textarea
          aria-label="근거 내용"
          className={cn(FORM_TEXTAREA_CLASS, "mt-[5px]")}
          placeholder="정정 근거를 적습니다"
          value={evidenceText}
          onChange={(event) => setEvidenceText(event.target.value)}
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
          <FormError>
            날짜 형식이 올바르지 않습니다(예: {toDotDate(config.claimedDate)}).
          </FormError>
        )}
        <FormHint>
          현재 값 {toDotDate(config.currentDate)} ({config.sourceLabel})
        </FormHint>

        <FormWarn>
          정정하면{" "}
          <b>
            구매확정 예정일이 {before} → {after}
          </b>
          로 바뀌고 <b>반품·교환 가능 기간</b>도 함께 늘어납니다. 브랜드와
          소비자에게 통지됩니다.
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
