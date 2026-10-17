import {
  INPUT_CLASS,
  SELECT_CLASS,
  TEXTAREA_CLASS,
} from "@/features/contract/components/shared/styles";
import Btn from "@/features/contract/components/shared/Btn";
import { Warn } from "@/features/claim/components/shared/ClaimParts";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/features/claim/constants/params";
import type {
  OperatorRefundReason,
  OperatorRefundRequest,
} from "@/features/claim/types";
import { won } from "@/features/claim/utils/format";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

const REASON_OPTIONS: Array<{ value: OperatorRefundReason; label: string }> = [
  { value: "ACCEPT_OBJECTION", label: "반려 이의 인용" },
  { value: "RECALL", label: "위해성 리콜" },
  { value: "OTHER", label: "기타(직접 입력)" },
];

/** 시안 `.ifm .mlabel` — 11px · 위 9px · 아래 3px(첫 라벨은 위 0) */
function Label(props: { required?: boolean; children: ReactNode }) {
  return (
    <label className="mb-[3px] mt-[9px] block text-[11px] font-medium text-sz-n-600 first:mt-0">
      {props.children}
      {props.required && <span className="ml-0.5 text-sz-danger-text">*</span>}
    </label>
  );
}

interface OperatorRefundFormProps {
  /** 반려 상품 금액 — 환불 대기로 편입될 금액(수정 불가) */
  amount: number;
  isPending: boolean;
  onSubmit: (body: OperatorRefundRequest) => void;
}

/**
 * 운영자 사유 환불(시안 B2) — 06b에서 **운영자가 실행하는 유일한 지점**.
 *
 * 반려 이의를 인용하면 반품 승인과 같아진다: 상품이 이미 브랜드에 있으므로 재발송비 결제가 취소되고
 * 환불 대기로 편입된다(집행은 환불 관리). 기각은 버튼이 아니라 스레드 답변이다(반려가 그대로 유지되므로).
 * 필수 입력(근거) 전에는 에러 문구 없이 버튼 비활성만 — 디자인 규칙.
 */
export default function OperatorRefundForm(props: OperatorRefundFormProps) {
  const { amount, isPending, onSubmit } = props;
  const [reason, setReason] =
    useState<OperatorRefundReason>("ACCEPT_OBJECTION");
  const [basis, setBasis] = useState("");
  const isAccept = reason === "ACCEPT_OBJECTION";
  const canSubmit = basis.trim() !== "";

  return (
    <div className="rounded-[6px] border border-sz-accent-100 bg-sz-accent-50 p-2.5">
      <Label required>사유</Label>
      <select
        aria-label="사유"
        className={cn(SELECT_CLASS, "h-7 w-full px-2.5 py-0 pr-8 text-[11px]")}
        style={MODAL_SELECT_CHEVRON_STYLE}
        value={reason}
        onChange={(event) =>
          setReason(event.target.value as OperatorRefundReason)
        }
      >
        {REASON_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <Label required>근거</Label>
      <textarea
        aria-label="근거"
        rows={2}
        className={cn(
          TEXTAREA_CLASS,
          "min-h-[52px] px-2.5 pb-1.5 pt-[7px] text-[11px] leading-[1.6]"
        )}
        value={basis}
        onChange={(event) => setBasis(event.target.value)}
      />

      <Label>환불 금액</Label>
      <input
        aria-label="환불 금액"
        className={cn(
          INPUT_CLASS,
          // 시안 .inp는 비활성이어도 흰 바탕 · 본문색이다 — 값을 고칠 수 없다는 것만 disabled가 알린다
          "h-7 w-full px-2.5 py-0 text-[11px] disabled:bg-white disabled:text-sz-n-900"
        )}
        value={won(amount)}
        disabled
        readOnly
      />
      {isAccept && (
        <p className="mt-1 text-[10px] text-sz-n-500">
          인용하면 귀책이 <b>브랜드</b>로 바뀌어 배송비 차감이 없습니다.
        </p>
      )}

      <Warn className="mt-[9px] px-[9px] py-2 text-[10px]">
        {isAccept ? (
          <>
            인용하면 반려가 <b>반품 승인과 같아집니다</b> — 재발송비 결제 요청이
            취소되고 상품은 브랜드에 남습니다. 환불은 <b>환불 관리</b>에서
            재확인 후 실행됩니다. 브랜드·소비자에게 통지됩니다.
          </>
        ) : (
          <>
            환불 대기로 편입됩니다 — 재발송비 결제 요청이 취소되고 상품은
            브랜드에 남습니다. 환불은 <b>환불 관리</b>에서 재확인 후 실행됩니다.
            브랜드·소비자에게 통지됩니다.
          </>
        )}
      </Warn>

      <Btn
        variant="primary"
        className="mt-[9px] w-full"
        disabled={!canSubmit}
        isLoading={isPending}
        onClick={() => onSubmit({ reason, basis: basis.trim() })}
      >
        환불 대기 편입
      </Btn>
    </div>
  );
}
