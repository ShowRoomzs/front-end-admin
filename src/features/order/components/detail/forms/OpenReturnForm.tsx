import OrderBtn from "@/features/order/components/shared/OrderBtn";
import {
  FORM_INPUT_CLASS,
  FORM_SELECT_CLASS,
  FORM_TEXTAREA_CLASS,
} from "@/features/order/components/shared/styles";
import {
  CheckRow,
  FormError,
  FormHint,
  FormLabel,
  FormShell,
  FormWarn,
  TargetGroupField,
} from "@/features/order/components/detail/forms/FormParts";
import {
  MetaRow,
  RailCard,
  RailText,
} from "@/features/order/components/detail/parts";
import { DEFECT_REASONS } from "@/features/order/constants/labels";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/features/order/constants/params";
import { useOpenDefectClaim } from "@/features/order/hooks/useOrderMutations";
import type {
  AdminOrderDetail,
  AdminOrderGroupDetail,
  ClaimReason,
} from "@/features/order/types";
import { parseDotDate, toEventTime } from "@/features/order/utils/format";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

const TNUM = "tabular-nums tracking-[-0.1px]";

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
 * 서버가 받는 것은 항목 · 수량 · 하자 유형 · 하자 내용 · 증빙 사진 URL(1장 이상) · 하자 인지일이다.
 * 법정 청약철회 기한(공급일 + 3개월 · 인지일 + 30일 중 이른 날)을 폼 위에 계산해 보여 준다 — 인지일은
 * 배송완료일 이후 · 오늘 이전만 받는다(서버도 같은 범위를 본다). 기한이 지난 건의 개설을 막을지는
 * 법무 판단이라(46 수정계획 8절 #9) 막지 않고 「기한 경과」로만 적는다.
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
  const [noticedText, setNoticedText] = useState("");
  const { mutateAsync, isPending } = useOpenDefectClaim();

  const urls = urlsText
    .split(/\s+/)
    .map((url) => url.trim())
    .filter(Boolean);
  const chosen = candidates.filter(
    (item) => selected[item.orderProductId] !== undefined
  );

  const deliveredAt = group?.shipping.deliveredAt;
  const settled = Boolean(group?.settlement?.confirmedAt);

  // 하자 인지일 — 배송완료일 ≤ 인지일 ≤ 오늘
  const today = dayjs().startOf("day");
  // 공급일 = 배송완료(이벤트 시각 · UTC)의 운영자 날짜
  const suppliedOn = deliveredAt
    ? toEventTime(deliveredAt).startOf("day")
    : null;
  const noticed = parseDotDate(noticedText);
  const noticedFormatInvalid = noticedText.length > 0 && !noticed;
  const noticedOutOfRange =
    noticed !== null &&
    (noticed.isAfter(today, "day") ||
      (suppliedOn !== null && noticed.isBefore(suppliedOn, "day")));
  const noticedValid = noticed !== null && !noticedOutOfRange;

  // 법정 청약철회 기한 — 공급일 + 3개월 · 인지일 + 30일 중 이른 날
  const supplyDeadline = suppliedOn?.add(3, "month") ?? null;
  const noticeDeadline = noticedValid ? noticed.add(30, "day") : null;
  const appliedDeadline =
    supplyDeadline && noticeDeadline
      ? noticeDeadline.isBefore(supplyDeadline)
        ? noticeDeadline
        : supplyDeadline
      : supplyDeadline;
  const daysLeft = appliedDeadline ? appliedDeadline.diff(today, "day") : null;

  const canSubmit =
    groupId > 0 &&
    chosen.length > 0 &&
    detailText.trim().length > 0 &&
    urls.length > 0 &&
    noticedValid;

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
          defectNoticedOn: noticed?.format("YYYY-MM-DD"),
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
      {suppliedOn && supplyDeadline && (
        <div>
          <MetaRow label="공급일">
            <span className={TNUM}>{suppliedOn.format("MM.DD")}</span> → 3개월{" "}
            <span className={TNUM}>{supplyDeadline.format("MM.DD")}</span>
          </MetaRow>
          {noticeDeadline && noticed && (
            <MetaRow label="하자 인지">
              <span className={TNUM}>{noticed.format("MM.DD")}</span> → 30일{" "}
              <span className={TNUM}>{noticeDeadline.format("MM.DD")}</span>
            </MetaRow>
          )}
          {appliedDeadline && daysLeft !== null && (
            <MetaRow
              label="청약철회 기한"
              tone={daysLeft < 0 ? "warn" : undefined}
            >
              <b className={TNUM}>{appliedDeadline.format("MM.DD")}</b> ·{" "}
              {daysLeft < 0
                ? "기한 경과"
                : daysLeft === 0
                  ? "D-DAY"
                  : `D-${daysLeft}`}
            </MetaRow>
          )}
        </div>
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

        <FormLabel required htmlFor="return-noticed">
          하자 인지일
        </FormLabel>
        <input
          id="return-noticed"
          autoComplete="off"
          placeholder="2026.09.17"
          className={cn(
            FORM_INPUT_CLASS,
            "tabular-nums",
            (noticedFormatInvalid || noticedOutOfRange) &&
              "border-sz-danger-text"
          )}
          value={noticedText}
          onChange={(event) => setNoticedText(event.target.value)}
        />
        {noticedFormatInvalid && (
          <FormError>날짜 형식이 올바르지 않습니다(예: 2026.09.17).</FormError>
        )}
        {noticedOutOfRange && (
          <FormError>
            {suppliedOn
              ? `배송완료일(${suppliedOn.format("YYYY.MM.DD")})부터 오늘까지의 날짜만 넣을 수 있습니다.`
              : "오늘 이후 날짜는 넣을 수 없습니다."}
          </FormError>
        )}

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
