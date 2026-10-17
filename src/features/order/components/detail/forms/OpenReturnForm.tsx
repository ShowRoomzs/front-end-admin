import OrderBtn from "@/features/order/components/shared/OrderBtn";
import {
  FORM_INPUT_CLASS,
  FORM_SELECT_CLASS,
} from "@/features/order/components/shared/styles";
import {
  CheckRow,
  FormError,
  FormHint,
  FormLabel,
  FormShell,
  FormWarn,
} from "@/features/order/components/detail/forms/FormParts";
import { RailCard, RailText } from "@/features/order/components/detail/parts";
import { DEFECT_TYPES } from "@/features/order/constants/labels";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/features/order/constants/params";
import { useOpenReturn } from "@/features/order/hooks/useOrderMutations";
import type {
  OrderActions,
  OrderDetail,
  OrderOpenReturnRequest,
} from "@/features/order/types";
import { parseDotDate, toDotDate } from "@/features/order/utils/format";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

/**
 * 시안 B6 — 구매확정 후 하자 · 반품 대신 열기. 소비자 앱은 구매확정 뒤 반품 버튼이 없지만 하자·표시와
 * 다른 상품은 법정 청약철회 기간(공급일 3개월 · 안 날 30일 중 이른 날)이 남는다. 그래서 운영자가
 * 1:1 문의의 증빙을 보고 **반품 클레임을 대신 연다** — 환불을 바로 하지 않는 이유는 물건이 돌아와야
 * 하기 때문이고, 연 뒤로는 회수 송장 · 검수 · 자동 환불이 일반 반품과 같다(06b).
 * 하자 유형에 단순 변심이 없다. 법정 기한이 지난 건은 버튼이 비활성이다.
 */
export default function OpenReturnForm(props: {
  detail: OrderDetail;
  config: NonNullable<OrderActions["openReturn"]>;
}) {
  const { detail, config } = props;
  const candidates = useMemo(
    () =>
      detail.subOrders
        .flatMap((sub) => sub.items)
        .filter((item) => config.itemIds.includes(item.id)),
    [detail.subOrders, config.itemIds]
  );
  // 후보가 하나면 처음부터 골라 둔다 — 운영자가 고를 것이 없다
  const [selected, setSelected] = useState<Array<string>>(
    candidates.length === 1 ? [candidates[0].id] : []
  );
  const [defectType, setDefectType] =
    useState<OrderOpenReturnRequest["defectType"]>("DEFECT");
  const [evidence, setEvidence] = useState(config.evidenceOptions[0] ?? "");
  const [dateText, setDateText] = useState(
    toDotDate(config.suggestedNoticeDate)
  );
  const { mutateAsync, isPending } = useOpenReturn();

  const parsed = parseDotDate(dateText);
  const formatInvalid = dateText.length > 0 && !parsed;
  const canSubmit =
    selected.length > 0 &&
    parsed !== null &&
    !config.expired &&
    evidence !== "";

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSubmit = async () => {
    if (!parsed) return;
    try {
      await mutateAsync({
        orderNo: detail.orderNo,
        body: {
          itemIds: selected,
          defectType,
          evidence,
          noticedAt: parsed.format("YYYY-MM-DD"),
        },
      });
      toast.success("반품을 열었습니다 — 반품·교환에서 이어서 처리합니다");
    } catch {
      toast.error("반품 열기에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <RailCard title="반품 대신 열기">
      <FormShell>
        <FormLabel required>대상 항목</FormLabel>
        {candidates.map((item) => (
          <CheckRow
            key={item.id}
            checked={selected.includes(item.id)}
            label={`${item.name} ${item.option}`}
            qty={item.qty}
            maxQty={item.qty}
            onToggle={() => toggle(item.id)}
          />
        ))}

        <FormLabel required htmlFor="return-defect">
          하자 유형
        </FormLabel>
        <select
          id="return-defect"
          className={FORM_SELECT_CLASS}
          style={MODAL_SELECT_CHEVRON_STYLE}
          value={defectType}
          onChange={(event) =>
            setDefectType(
              event.target.value as OrderOpenReturnRequest["defectType"]
            )
          }
        >
          {DEFECT_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <FormLabel required htmlFor="return-evidence">
          증빙
        </FormLabel>
        <select
          id="return-evidence"
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

        <FormLabel required htmlFor="return-date">
          하자 인지일
        </FormLabel>
        <input
          id="return-date"
          autoComplete="off"
          placeholder="2026.09.17"
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
            날짜 형식이 올바르지 않습니다(예:{" "}
            {toDotDate(config.suggestedNoticeDate)}).
          </FormError>
        )}
        {config.expired && (
          <FormHint>청약철회 기한이 지나 반품을 열 수 없습니다.</FormHint>
        )}

        <FormWarn>
          반품이 열리면 소비자에게 <b>회수 송장 입력</b>이 요청되고 검수·환불은
          일반 반품과 같습니다(<b>브랜드 귀책 · 착불 · 차감 없음</b>).
          {config.settledRoundLabel && (
            <>
              {" "}
              이 항목은 <b>{config.settledRoundLabel} 정산 확정</b> — 환불되면{" "}
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
