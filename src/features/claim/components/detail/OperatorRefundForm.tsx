import {
  INPUT_CLASS,
  TEXTAREA_CLASS,
} from "@/features/contract/components/shared/styles";
import Btn from "@/features/contract/components/shared/Btn";
import { Warn } from "@/features/claim/components/shared/ClaimParts";
import { won } from "@/features/claim/utils/format";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

/** 서버 `@Size(max = 500)` */
const DETAIL_MAX = 500;

/** 시안 `.ifm .mlabel` — 11px · 위 9px · 아래 3px(첫 라벨은 위 0) */
function Label(props: { required?: boolean; children: ReactNode }) {
  return (
    <label className="mb-[3px] mt-[9px] block text-[11px] font-medium text-sz-n-600 first:mt-0">
      {props.children}
      {props.required && <span className="ml-0.5 text-sz-danger-text">*</span>}
    </label>
  );
}

const READONLY_INPUT_CLASS = cn(
  INPUT_CLASS,
  // 시안 .inp는 비활성이어도 흰 바탕 · 본문색이다 — 값을 고칠 수 없다는 것만 disabled가 알린다
  "h-7 w-full px-2.5 py-0 text-[11px] disabled:bg-white disabled:text-sz-n-900"
);

interface OperatorRefundFormProps {
  /** 사유 — 조치마다 서버가 고정한다(반려 이의 인용 · 검수 무응답) */
  reasonLabel: string;
  /** 서버 계산 금액 — 수정 불가 */
  amount: number;
  /** 금액 아래 보조 문구 */
  amountNote?: ReactNode;
  /** 위험 안내 — 되돌릴 수 없는 효과 */
  warning: ReactNode;
  isPending: boolean;
  onSubmit: (detail: string) => void;
}

/**
 * 운영자 사유 환불 편입 폼(시안 B2) — 06b에서 운영자가 실행하는 지점.
 * 사유는 조치가 정하고 금액은 서버가 계산한다 — 운영자가 쓰는 것은 근거 하나뿐이다(요청 `{ detail }`).
 * 필수 입력(근거) 전에는 에러 문구 없이 버튼 비활성만 — 디자인 규칙.
 */
export default function OperatorRefundForm(props: OperatorRefundFormProps) {
  const { reasonLabel, amount, amountNote, warning, isPending, onSubmit } =
    props;
  const [detail, setDetail] = useState("");
  const canSubmit = detail.trim() !== "";

  return (
    <div className="rounded-[6px] border border-sz-accent-100 bg-sz-accent-50 p-2.5">
      <Label>사유</Label>
      <input
        aria-label="사유"
        className={READONLY_INPUT_CLASS}
        value={reasonLabel}
        disabled
        readOnly
      />

      <Label required>근거</Label>
      <textarea
        aria-label="근거"
        rows={2}
        maxLength={DETAIL_MAX}
        className={cn(
          TEXTAREA_CLASS,
          "min-h-[52px] px-2.5 pb-1.5 pt-[7px] text-[11px] leading-[1.6]"
        )}
        value={detail}
        onChange={(event) => setDetail(event.target.value)}
      />

      <Label>환불 금액</Label>
      <input
        aria-label="환불 금액"
        className={READONLY_INPUT_CLASS}
        value={won(amount)}
        disabled
        readOnly
      />
      {amountNote && (
        <p className="mt-1 text-[10px] text-sz-n-500">{amountNote}</p>
      )}

      <Warn className="mt-[9px] px-[9px] py-2 text-[10px]">{warning}</Warn>

      <Btn
        variant="primary"
        className="mt-[9px] w-full"
        disabled={!canSubmit}
        isLoading={isPending}
        onClick={() => onSubmit(detail.trim())}
      >
        환불 대기 편입
      </Btn>
    </div>
  );
}
